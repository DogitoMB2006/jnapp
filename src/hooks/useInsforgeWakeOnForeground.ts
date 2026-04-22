import { useEffect } from "react"
import { runInsforgeConnectionHeal } from "../lib/insforgeConnectionHeal"

/**
 * After the tab or window was in the background, browsers often throttle or drop WebSocket traffic.
 * Refresh session + reconnect when visible so JWT and socket stay valid (same as long-idle fix).
 */
export function useInsforgeWakeOnForeground(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    let lastWake = 0
    const wake = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastWake < 250) return
      lastWake = now
      runInsforgeConnectionHeal()
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") wake()
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", wake)
    window.addEventListener("pageshow", wake)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", wake)
      window.removeEventListener("pageshow", wake)
    }
  }, [enabled])
}
