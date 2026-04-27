import { useEffect } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { isMobileTauri } from "../lib/platform"
import { useNavigationStore } from "../store/navigationStore"
import type { Section } from "../types"

const VALID_SECTIONS = new Set<string>(["planes", "lista", "salidas", "peliculas"])

const isValidSection = (s: string): s is Section =>
  VALID_SECTIONS.has(s)

/**
 * On Android: after a killed-app FCM push is tapped, the app relaunches and
 * `deep_link_consume_pending` returns the stored { reference_id, reference_type }.
 * We navigate once and clear the store entry so re-opens don't replay it.
 */
export const useDeepLinkNavigation = (userId: string | undefined) => {
  const { navigateTo } = useNavigationStore()

  useEffect(() => {
    if (!userId || !isMobileTauri) return

    const checkPending = async () => {
      try {
        const raw = await invoke<string | null>("deep_link_consume_pending")
        if (!raw) return
        const parsed = JSON.parse(raw) as {
          reference_id?: string
          reference_type?: string
        }
        const section = parsed.reference_type
        const itemId = parsed.reference_id ?? null
        if (!section || !isValidSection(section)) return
        navigateTo(section, itemId)
      } catch {
        /* best-effort */
      }
    }

    void checkPending()

    const unlistenResume = listen("tauri://resume", () => {
      void checkPending()
    })

    const onVis = () => {
      if (document.visibilityState === "visible") void checkPending()
    }
    document.addEventListener("visibilitychange", onVis)

    return () => {
      void unlistenResume.then((u) => u())
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [userId, navigateTo])
}
