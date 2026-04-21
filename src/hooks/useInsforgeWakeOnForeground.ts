import { useEffect } from "react"
import insforge from "../lib/insforge"

/**
 * After the tab or window was in the background, browsers often throttle or drop WebSocket traffic.
 * Reconnecting when the app becomes visible keeps realtime subscriptions alive so you do not have to
 * stay focused on the window for partner updates to flow once you return.
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
      void insforge.realtime.connect().catch(() => undefined)
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
