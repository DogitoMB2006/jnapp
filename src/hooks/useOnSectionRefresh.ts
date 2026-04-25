import { useEffect, useRef } from "react"
import { SECTION_REFRESH_EVENT } from "../lib/sectionRefreshEvent"
import type { Section } from "../types"

type RefreshDetail = { section: Section }

/**
 * Run `refetch` when something emits `emitSectionRefresh` for this section (pull / manual sync).
 */
export const useOnSectionRefresh = (section: Section, refetch: () => void) => {
  const ref = useRef(refetch)
  ref.current = refetch
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent<RefreshDetail>).detail
      if (d?.section === section) {
        ref.current()
      }
    }
    window.addEventListener(SECTION_REFRESH_EVENT, handler)
    return () => window.removeEventListener(SECTION_REFRESH_EVENT, handler)
  }, [section])
}
