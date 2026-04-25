import { useEffect, useRef } from "react"
import { useAndroidUpdaterStore } from "../store/androidUpdaterStore"
import { isMobileTauri } from "../lib/platform"

const INITIAL_CHECK_MS = 1_200
const INTERVAL_CHECK_MS = 60 * 60 * 1000
const NUDGE_MS = 320

/**
 * Android: check GitHub releases shortly after login, re-check hourly,
 * and re-open update modal when user returns to app (visibility change).
 */
export const useAndroidAutoUpdater = (userLoggedIn: boolean) => {
  const checkForUpdate = useAndroidUpdaterStore((s) => s.checkForUpdate)
  const wasHiddenRef = useRef(false)
  const nudgeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isMobileTauri || !userLoggedIn) return

    const scheduleNudge = () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current)
      nudgeTimerRef.current = window.setTimeout(() => {
        nudgeTimerRef.current = null
        useAndroidUpdaterStore.getState().nudgeUpdateModal()
      }, NUDGE_MS)
    }

    const runCheck = () => void checkForUpdate("auto")

    const initial = window.setTimeout(runCheck, INITIAL_CHECK_MS)
    const interval = window.setInterval(runCheck, INTERVAL_CHECK_MS)

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true
        return
      }
      if (!wasHiddenRef.current) return
      wasHiddenRef.current = false
      scheduleNudge()
    }

    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current)
        nudgeTimerRef.current = null
      }
    }
  }, [userLoggedIn, checkForUpdate])
}
