import { createClient } from "npm:@insforge/sdk@1.2.5"
import { GoogleAuth } from "npm:google-auth-library@9.14.0"

/**
 * Reminder cron — runs daily (e.g. 09:00 UTC).
 * For every planes/salidas item whose date = tomorrow:
 *   1. Inserts a notification row in the DB (visible in the bell icon)
 *   2. Sends FCM push to the user's Android device (if token available)
 *
 * Both operations use SECURITY DEFINER SQL functions so no user JWT is needed.
 * Schedule this via InsForge dashboard or CLI: `cron "0 14 * * *"` (14:00 UTC = ~8 AM Mexico).
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })

type ReminderRow = {
  item_id: string
  item_title: string
  section: string
  item_group_id: string
  member_user_id: string
  member_fcm_token: string | null
  member_lang: string
}

const MESSAGES: Record<string, Record<string, (title: string) => { title: string; body: string }>> = {
  es: {
    planes:  (t) => ({ title: "Recordatorio 📅", body: `¡Mañana tienen "${t}"! No olviden su plan.` }),
    salidas: (t) => ({ title: "Recordatorio 📅", body: `¡Mañana es "${t}"! Prepárense para su salida.` }),
  },
  en: {
    planes:  (t) => ({ title: "Reminder 📅",    body: `Tomorrow you have "${t}"! Don't forget your plan.` }),
    salidas: (t) => ({ title: "Reminder 📅",    body: `Tomorrow is "${t}"! Get ready for your outing.` }),
  },
}

function buildMessage(lang: string, section: string, title: string) {
  const langMap = MESSAGES[lang] ?? MESSAGES["es"]
  const fn = langMap[section] ?? langMap["planes"]
  return fn(title)
}

async function sendFcm(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
  referenceId: string,
  referenceType: string,
) {
  const fcmData: Record<string, string> = {
    title,
    body,
    reference_id: referenceId,
    reference_type: referenceType,
  }
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          android: {
            priority: "HIGH",
            notification: { channel_id: "jnapp_push" },
          },
          data: fcmData,
        },
      }),
    }
  )
  if (!res.ok) {
    const txt = await res.text()
    console.error("[reminder-cron] fcm error:", res.status, txt.slice(0, 200))
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors })

  console.log("[reminder-cron] start")

  const baseUrl = Deno.env.get("INSFORGE_BASE_URL")
  const anonKey = Deno.env.get("INSFORGE_ANON_KEY")
  if (!baseUrl || !anonKey) {
    return json({ error: "Missing INSFORGE_BASE_URL or INSFORGE_ANON_KEY" }, 500)
  }

  const sa = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")
  if (!sa) {
    return json({ error: "Missing FIREBASE_SERVICE_ACCOUNT_JSON" }, 500)
  }

  // Use anon key — SECURITY DEFINER functions bypass RLS
  const client = createClient({ baseUrl, edgeFunctionToken: anonKey })

  const { data, error } = await client.database.rpc("get_tomorrow_reminders") as {
    data: ReminderRow[] | null
    error: { message?: string } | null
  }

  if (error) {
    console.error("[reminder-cron] rpc error:", error.message)
    return json({ error: error.message }, 500)
  }

  const reminders = data ?? []
  console.log("[reminder-cron] reminders found:", reminders.length)

  if (!reminders.length) {
    return json({ ok: true, sent: 0 })
  }

  // Parse Firebase service account + get OAuth token once
  let accessToken: string | null = null
  let projectId: string | null = null
  try {
    const credentials = JSON.parse(sa) as Record<string, unknown>
    projectId = String(credentials.project_id ?? "")
    if (projectId) {
      const googleAuth = new GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
      })
      const gClient = await googleAuth.getClient()
      const at = await gClient.getAccessToken()
      accessToken = typeof at === "string" ? at : (at?.token ?? null)
    }
  } catch (e) {
    console.warn("[reminder-cron] firebase auth error:", e)
  }

  let inserted = 0
  let fcmSent = 0

  for (const row of reminders) {
    const msg = buildMessage(row.member_lang, row.section, row.item_title)

    // 1. Insert DB notification row
    try {
      await client.database.rpc("insert_reminder_notification", {
        p_user_id: row.member_user_id,
        p_title: msg.title,
        p_message: msg.body,
        p_section: row.section,
        p_item_id: row.item_id,
        p_group_id: row.item_group_id,
      })
      inserted++
    } catch (e) {
      console.warn("[reminder-cron] insert error:", e)
    }

    // 2. FCM push if token available
    if (accessToken && projectId && row.member_fcm_token && row.member_fcm_token.length >= 8) {
      await sendFcm(
        accessToken,
        projectId,
        row.member_fcm_token,
        msg.title,
        msg.body,
        row.item_id,
        row.section,
      )
      fcmSent++
    }
  }

  console.log("[reminder-cron] done. inserted:", inserted, "fcm:", fcmSent)
  return json({ ok: true, inserted, fcmSent })
}
