import { useEffect, useRef } from "react"
import { invoke } from "@tauri-apps/api/core"
import insforge from "../lib/insforge"
import { isMobileTauri } from "../lib/platform"

/**
 * After login, read the FCM token written by native code and store it on `profiles.fcm_token`
 * so your backend can target this device. Add a nullable `fcm_token` text column in InsForge
 * if it does not exist.
 */
export const useAndroidFcmRegistration = (userId: string | undefined) => {
  const lastSent = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || !isMobileTauri) {
      return
    }
    let cancelled = false
    const sync = async () => {
      try {
        const token = await invoke<string | null>("fcm_get_stored_token")
        if (cancelled || !token || token.length < 8) {
          return
        }
        if (token === lastSent.current) {
          return
        }
        // Clear this token from any other account (same device, different login)
        await insforge.database
          .from("profiles")
          .update({ fcm_token: null })
          .eq("fcm_token", token)
          .neq("user_id", userId)
        const { error } = await insforge.database
          .from("profiles")
          .update({ fcm_token: token })
          .eq("user_id", userId)
        if (!error) {
          lastSent.current = token
        }
      } catch {
        /* FCM or DB optional */
      }
    }
    void sync()
    const id = window.setInterval(() => {
      void sync()
    }, 8000)
    return () => {
      cancelled = true
      window.clearInterval(id)
      lastSent.current = null
    }
  }, [userId])
}
