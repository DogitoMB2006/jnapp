import { useCallback, useRef } from "react"
import { lightHaptic } from "../lib/mobileHaptics"
import type { Section } from "../types"
import { NAV_SECTION_ORDER } from "../lib/sectionOrder"

const MIN_PX = 64
const VERTICAL_DOMINANCE = 0.78

/** `setPointerCapture` on the main area steals clicks from children — skip swipe for these. */
const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof Element)) {
    return false
  }
  return Boolean(
    target.closest(
      'button, a, input, textarea, select, option, label, summary, [role="button"], [role="tab"], [role="menuitem"], [contenteditable="true"]',
    ),
  )
}

type PointerStart = { x: number; y: number } | null

/**
 * Horizontal swipe to move between `NAV_SECTION_ORDER` (same as bottom tabs).
 * Uses pointer capture so a gesture that leaves the main area still completes.
 * Ignored when movement is mostly vertical (scrolling lists).
 */
export const useSectionSwipe = (
  section: Section,
  onChange: (next: Section) => void,
) => {
  const start = useRef<PointerStart>(null)
  const activeId = useRef<number | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) {
        return
      }
      if (isInteractiveTarget(e.target)) {
        return
      }
      start.current = { x: e.clientX, y: e.clientY }
      activeId.current = e.pointerId
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        /* */
      }
    },
    [],
  )

  const finish = useCallback(
    (e: React.PointerEvent) => {
      if (activeId.current !== e.pointerId) {
        return
      }
      activeId.current = null
      if (!start.current) {
        return
      }
      const dx = e.clientX - start.current.x
      const dy = e.clientY - start.current.y
      start.current = null
      if (Math.abs(dx) < MIN_PX) {
        return
      }
      if (Math.abs(dy) > Math.abs(dx) * VERTICAL_DOMINANCE) {
        return
      }
      const i = NAV_SECTION_ORDER.indexOf(section)
      if (i < 0) {
        return
      }
      if (dx < 0) {
        if (i < NAV_SECTION_ORDER.length - 1) {
          onChange(NAV_SECTION_ORDER[i + 1]!)
          lightHaptic()
        }
        return
      }
      if (i > 0) {
        onChange(NAV_SECTION_ORDER[i - 1]!)
        lightHaptic()
      }
    },
    [section, onChange],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      finish(e)
    },
    [finish],
  )

  const onPointerCancel = useCallback((e: React.PointerEvent) => {
    if (activeId.current === e.pointerId) {
      start.current = null
      activeId.current = null
    }
  }, [])

  return { onPointerDown, onPointerUp, onPointerCancel }
}
