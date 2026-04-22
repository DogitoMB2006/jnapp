import { useEffect, useRef } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useUpdaterStore } from "../store/updaterStore"

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

const INITIAL_CHECK_MS = 5_000
const INTERVAL_CHECK_MS = 60 * 60 * 1000

/**
 * When logged in: delayed check, hourly re-check, and re-open modal when returning
 * from background / tray if an update is still available.
 */
export const useAutoUpdater = (userLoggedIn: boolean) => {
  const checkForUpdate = useUpdaterStore((s) => s.checkForUpdate)
  const openModal = useUpdaterStore((s) => s.openModal)
  const wasInBackgroundRef = useRef(false)

  useEffect(() => {
    if (!isTauriRuntime || !userLoggedIn) return

    const nudgeModalIfUpdatePending = async () => {
      const { status } = useUpdaterStore.getState()
      if (status !== "available") return
      try {
        const w = getCurrentWindow()
        if (!(await w.isVisible()) || (await w.isMinimized())) return
        if (document.visibilityState === "hidden") return
        openModal()
      } catch {
        /* ignore */
      }
    }

    const runCheck = () => {
      void checkForUpdate("auto")
    }

    const initial = window.setTimeout(runCheck, INITIAL_CHECK_MS)
    const interval = window.setInterval(runCheck, INTERVAL_CHECK_MS)

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        wasInBackgroundRef.current = true
        return
      }
      if (!wasInBackgroundRef.current) return
      wasInBackgroundRef.current = false
      void nudgeModalIfUpdatePending()
    }

    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.clearTimeout(initial)
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [userLoggedIn, checkForUpdate, openModal])
}
