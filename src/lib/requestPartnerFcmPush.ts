import insforge from "./insforge"

/**
 * When the app is killed, JS/Realtime/Tauri do not run — the only way the partner
 * sees a tray notification is an FCM message delivered by Google to
 * `FcmMessagingService`. That requires a **server** call to Firebase (this client
 * only registers `profiles.fcm_token`).
 *
 * Set `VITE_PARTNER_FCM_FUNCTION_SLUG` to an InsForge edge function slug you deploy.
 * The function should:
 * 1. Verify the JWT user may notify `target_user_id` (e.g. same `group_id`).
 * 2. Load `profiles.fcm_token` for that user.
 * 3. Send FCM HTTP v1 with `android: { priority: "high" }` and `data` payload
 *    keys `title` and `body` (see `FcmMessagingService.kt` in the Android project).
 *
 * Without a deployed function, in-app notifications still work; killed-state push does not.
 */
export const requestPartnerFcmPush = async (args: {
  targetUserId: string
  title: string
  body: string
}) => {
  const slug = (import.meta.env.VITE_PARTNER_FCM_FUNCTION_SLUG as string | undefined)?.trim()
  if (!slug) {
    if (import.meta.env.DEV) {
      console.warn("[requestPartnerFcmPush] missing VITE_PARTNER_FCM_FUNCTION_SLUG")
    }
    return
  }
  try {
    const { data, error } = await insforge.functions.invoke(slug, {
      body: {
        target_user_id: args.targetUserId,
        title: args.title,
        body: args.body,
      },
    })
    if (error) {
      console.warn("[requestPartnerFcmPush]", error.message)
    } else if (import.meta.env.DEV) {
      console.debug("[requestPartnerFcmPush]", data)
    }
  } catch (e) {
    console.warn("[requestPartnerFcmPush]", e)
  }
}
