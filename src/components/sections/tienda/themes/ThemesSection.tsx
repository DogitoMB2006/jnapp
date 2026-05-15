import { useState } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { ThemeCard } from "./ThemeCard"
import { ALL_THEMES } from "../../../../lib/themes"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"
import type { ThemeDef } from "../../../../types"

export function ThemesSection() {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { group } = useGroupStore()
  const { coins, purchases, equippedTheme, buyTheme, equipTheme } = useStoreStore()
  const [busy, setBusy] = useState<string | null>(null)

  async function handleBuy(theme: ThemeDef) {
    if (!group) return
    if (busy) return
    if (coins < theme.cost) {
      toast.error(lang === "en" ? "Not enough coins" : "Monedas insuficientes")
      return
    }
    setBusy(theme.id)
    try {
      await buyTheme(group.id, theme.id, theme.cost)
      toast.success(lang === "en" ? `${theme.nameEn} unlocked!` : `¡${theme.nameEs} desbloqueado!`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "already_owned") {
        toast(lang === "en" ? "Already owned" : "Ya lo tienes")
      } else {
        toast.error(lang === "en" ? "Purchase failed" : "Error al comprar")
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleEquip(theme: ThemeDef) {
    if (!group) return
    if (busy) return
    setBusy(theme.id)
    try {
      await equipTheme(group.id, theme.id)
      toast.success(lang === "en" ? `${theme.nameEn} equipped!` : `¡${theme.nameEs} equipado!`, {
        icon: "🎨",
      })
    } catch {
      toast.error(lang === "en" ? "Could not equip theme" : "Error al equipar tema")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p className="text-xs text-base-content/40 mb-4">
        {lang === "en"
          ? "Themes apply for both of you in real time."
          : "Los temas se aplican para los dos en tiempo real."}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {ALL_THEMES.map((theme, i) => (
          <div key={theme.id} className={busy === theme.id ? "opacity-60 pointer-events-none" : ""}>
            <ThemeCard
              theme={theme}
              owned={purchases.has(theme.id)}
              equipped={equippedTheme === theme.id}
              onBuy={() => handleBuy(theme)}
              onEquip={() => handleEquip(theme)}
              index={i}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
