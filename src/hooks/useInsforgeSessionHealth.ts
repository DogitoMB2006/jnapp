import { useEffect, useRef } from "react"
import insforge from "../lib/insforge"
import { healInsforgeConnection } from "../lib/insforgeConnectionHeal"

const REFRESH_MS = 4 * 60 * 1000
const DISCONNECT_RECONNECT_MS = 1500

/**
 * Proactive session + realtime keepalive: avoids stale JWT / dead socket after long runtime.
 * Also reconnects shortly after a socket drop (zombie "connected" or missed subs).
 */
export const useInsforgeSessionHealth = (enabled: boolean) => {
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) return

    const onInterval = () => {
      void healInsforgeConnection()
    }
    const intervalId = window.setInterval(onInterval, REFRESH_MS)

    const onOnline = () => {
      void healInsforgeConnection()
    }
    window.addEventListener("online", onOnline)

    const onDisconnect = () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
      disconnectTimerRef.current = setTimeout(() => {
        disconnectTimerRef.current = null
        void healInsforgeConnection()
      }, DISCONNECT_RECONNECT_MS)
    }
    insforge.realtime.on("disconnect", onDisconnect)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("online", onOnline)
      insforge.realtime.off("disconnect", onDisconnect)
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current)
    }
  }, [enabled])
}
