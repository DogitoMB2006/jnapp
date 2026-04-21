import { useEffect, useRef } from "react"
import insforge from "../lib/insforge"

/** Tab in background — aggressive; browsers may still clamp (often ≥1s). */
const POLL_MS_BACKGROUND = 400

/** Tab visible + WebSocket connected — safety net when events are delayed. */
const POLL_MS_VISIBLE_CONNECTED = 2_500

/** Tab visible + WebSocket down — REST catch-up. */
const POLL_MS_VISIBLE_DISCONNECTED = 650

type SectionDataSyncOptions = {
  enabled?: boolean
  /** Visible + disconnected (default 650). */
  fastPollMs?: number
  /** Visible + connected safety poll (default 2500). */
  slowPollMs?: number
  /** Background tab poll (default 400). */
  backgroundPollMs?: number
}

function pickPollMs(
  fastPollMs: number,
  slowPollMs: number,
  backgroundPollMs: number
): number {
  if (typeof document !== "undefined" && document.visibilityState !== "visible") {
    return backgroundPollMs
  }
  return insforge.realtime.isConnected ? slowPollMs : fastPollMs
}

/**
 * Keeps section lists aligned when realtime lags or the tab is idle.
 * Fast intervals while hidden / disconnected; lighter polling when visible with a healthy socket.
 */
export function useSectionDataSync(
  refetchSilent: () => void | Promise<void>,
  options?: SectionDataSyncOptions
) {
  const enabled = options?.enabled ?? true
  const fastPollMs = options?.fastPollMs ?? POLL_MS_VISIBLE_DISCONNECTED
  const slowPollMs = options?.slowPollMs ?? POLL_MS_VISIBLE_CONNECTED
  const backgroundPollMs = options?.backgroundPollMs ?? POLL_MS_BACKGROUND

  const refetchRef = useRef(refetchSilent)
  refetchRef.current = refetchSilent

  useEffect(() => {
    if (!enabled) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const runPeriodicSync = () => {
      void refetchRef.current()
    }

    const restartInterval = () => {
      if (intervalId) clearInterval(intervalId)
      const ms = pickPollMs(fastPollMs, slowPollMs, backgroundPollMs)
      intervalId = setInterval(runPeriodicSync, ms)
    }

    const onSocketActivity = () => {
      restartInterval()
      if (insforge.realtime.isConnected) void runPeriodicSync()
    }

    restartInterval()

    insforge.realtime.on("connect", onSocketActivity)
    insforge.realtime.on("disconnect", onSocketActivity)
    insforge.realtime.on("connect_error", onSocketActivity)

    let lastForegroundSync = 0
    const syncForeground = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastForegroundSync < 120) return
      lastForegroundSync = now
      void refetchRef.current()
    }

    const onVisibility = () => {
      restartInterval()
      if (document.visibilityState === "visible") syncForeground()
    }

    const onFocus = () => syncForeground()

    window.addEventListener("online", syncForeground)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onFocus)
    window.addEventListener("pageshow", syncForeground)

    return () => {
      insforge.realtime.off("connect", onSocketActivity)
      insforge.realtime.off("disconnect", onSocketActivity)
      insforge.realtime.off("connect_error", onSocketActivity)
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener("online", syncForeground)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pageshow", syncForeground)
    }
  }, [enabled, fastPollMs, slowPollMs, backgroundPollMs])
}
