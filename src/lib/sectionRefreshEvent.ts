import type { Section } from "../types"

export const SECTION_REFRESH_EVENT = "jnapp:section-refresh" as const

type Detail = { section: Section }

/**
 * Fires a global event so the active (or all) section pages can refetch.
 * Used after pull or explicit sync; pages subscribe via `useOnSectionRefresh`.
 */
export const emitSectionRefresh = (section: Section) => {
  if (typeof window === "undefined") {
    return
  }
  window.dispatchEvent(
    new CustomEvent<Detail>(SECTION_REFRESH_EVENT, { detail: { section } }),
  )
}
