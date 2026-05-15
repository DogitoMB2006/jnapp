import type { ThemeDef, ThemeId } from "../types"
import { auroraTheme } from "../components/sections/tienda/themes/common/auroraTheme"
import { sakuraTheme } from "../components/sections/tienda/themes/common/sakuraTheme"
import { oceanTheme } from "../components/sections/tienda/themes/common/oceanTheme"

/** The built-in default theme — always free, always available. */
export const DEFAULT_THEME: ThemeDef = {
  id: "jnapp",
  nameEn: "Midnight Rose",
  nameEs: "Rosa Medianoche",
  rarity: "common",
  cost: 0,
  preview: {
    bg: "#1a0a1f",
    primary: "#ff2d6b",
    secondary: "#f471b5",
    accent: "#fb7185",
    text: "#f5e6ff",
  },
}

/** All purchasable themes (excludes default). */
export const PURCHASABLE_THEMES: ThemeDef[] = [
  auroraTheme,
  sakuraTheme,
  oceanTheme,
]

/** All themes including default. */
export const ALL_THEMES: ThemeDef[] = [DEFAULT_THEME, ...PURCHASABLE_THEMES]

/** Look up a theme by ID, falling back to default. */
export function getThemeById(id: ThemeId | string | null | undefined): ThemeDef {
  return ALL_THEMES.find((t) => t.id === id) ?? DEFAULT_THEME
}

/** Apply a theme to the document root. Safe to call on every platform. */
export function applyTheme(id: ThemeId | string) {
  if (typeof document === "undefined") return
  document.documentElement.setAttribute("data-theme", id || "jnapp")
}
