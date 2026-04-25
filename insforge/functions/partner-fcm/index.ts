import { createClient } from "npm:@insforge/sdk@1.2.5"
import { GoogleAuth } from "npm:google-auth-library@9.14.0"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const

type Body = {
  target_user_id?: string
  title?: string
  body?: string
}

const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  })

export default async function handler(req: Request): Promise<Response> {
  console.log("[partner-fcm] invoked method:", req.method)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...cors } })
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  const baseUrl = Deno.env.get("INSFORGE_BASE_URL")
  if (!baseUrl) {
    console.error("[partner-fcm] INSFORGE_BASE_URL missing")
    return json({ error: "INSFORGE_BASE_URL missing" }, 500)
  }

  const authHeader = req.headers.get("Authorization")
  const userToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null
  console.log("[partner-fcm] has token:", !!userToken)
  if (!userToken) {
    return json({ error: "Unauthorized" }, 401)
  }

  const sa = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")
  if (!sa) {
    console.error("[partner-fcm] FIREBASE_SERVICE_ACCOUNT_JSON missing")
    return json(
      {
        error: "FIREBASE_SERVICE_ACCOUNT_JSON is not set",
        hint: "npx @insforge/cli secrets add FIREBASE_SERVICE_ACCOUNT_JSON \"<service-account-json>\"",
      },
      503
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ error: "Invalid JSON" }, 400)
  }
  const targetId = body.target_user_id?.trim()
  const title = String(body.title ?? "JNApp").slice(0, 200)
  const text = String(body.body ?? "").slice(0, 4000)
  console.log("[partner-fcm] target:", targetId, "title:", title)
  if (!targetId?.length) {
    return json({ error: "target_user_id required" }, 400)
  }

  const client = createClient({
    baseUrl,
    edgeFunctionToken: userToken,
  })

  const { data: u, error: userErr } = await client.auth.getCurrentUser()
  if (userErr || !u?.user?.id) {
    return json({ error: "Unauthorized" }, 401)
  }

  const { data: fcmToken, error: rpcErr } = await client.database.rpc(
    "get_partner_fcm_for_push",
    { p_target_user_id: targetId, p_actor_user_id: u.user.id }
  ) as { data: string | null; error: { message?: string } | null }

  if (rpcErr) {
    console.error("[partner-fcm] rpc error:", rpcErr.message)
    return json({ error: rpcErr.message ?? "rpc failed" }, 400)
  }
  const deviceToken = typeof fcmToken === "string"
    ? fcmToken
    : Array.isArray(fcmToken) && typeof fcmToken[0] === "string"
    ? fcmToken[0]
    : null
  console.log("[partner-fcm] actor:", u.user.id, "target:", targetId, "token:", deviceToken ? deviceToken.slice(0, 12) + "..." : "null")
  if (!deviceToken || deviceToken.length < 8) {
    return json({ ok: true, skipped: true, reason: "no_token_or_not_partner" }, 200)
  }

  let projectId: string
  let credentials: Record<string, unknown>
  try {
    credentials = JSON.parse(sa) as Record<string, unknown>
    projectId = String(credentials.project_id ?? "")
    if (!projectId) {
      return json({ error: "Service account missing project_id" }, 500)
    }
  } catch {
    return json({ error: "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON" }, 500)
  }

  const googleAuth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  })
  const gClient = await googleAuth.getClient()
  const at = await gClient.getAccessToken()
  const accessToken = typeof at === "string" ? at : at?.token
  if (!accessToken) {
    return json({ error: "Could not get Google access token" }, 500)
  }

  // Data-only = tray often missing when the app is killed. Add `notification` + channel so
  // the OS can display without running our Activity (see Firebase Android docs).
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const fcmRes = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title, body: text },
        android: {
          priority: "HIGH",
          notification: {
            channel_id: "jnapp_push",
          },
        },
        data: {
          title,
          body: text,
        },
      },
    }),
  })
  const fcmText = await fcmRes.text()
  if (!fcmRes.ok) {
    console.error("[partner-fcm] fcm send failed:", fcmRes.status, fcmText.slice(0, 300))
    return json(
      { error: "fcm_send_failed", status: fcmRes.status, detail: fcmText.slice(0, 500) },
      502
    )
  }
  console.log("[partner-fcm] sent ok:", fcmText.slice(0, 100))
  return json({ ok: true, sent: true }, 200)
}
