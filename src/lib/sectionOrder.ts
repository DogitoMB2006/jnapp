import type { Section } from "../types"

/** Order matches bottom nav: swipe left = next, swipe right = previous. */
export const NAV_SECTION_ORDER: readonly Section[] = [
  "planes",
  "lista",
  "salidas",
  "peliculas",
  "perfil",
] as const
