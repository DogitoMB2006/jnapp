import { useState } from "react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { ThemeCard } from "./ThemeCard"
import { ThemePreviewModal } from "./ThemePreviewModal"
import { ALL_THEMES } from "../../../../lib/themes"
import { useShallow } from "zustand/react/shallow"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"
import { useAuthStore } from "../../../../store/authStore"
import type { ThemeDef } from "../../../../types"

export function ThemesSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const group = useGroupStore((s) => s.group)
  const profile = useAuthStore((s) => s.profile)
  const { coins, purchases, equippedTheme, buyTheme, equipTheme } = useStoreStore(
    useShallow((s) => ({
      coins: s.coins,
      purchases: s.purchases,
      equippedTheme: s.equippedTheme,
      buyTheme: s.buyTheme,
      equipTheme: s.equipTheme,
    })),
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [previewTheme, setPreviewTheme] = useState<ThemeDef | null>(null)

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
      setPreviewTheme(null)
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
      toast.success(lang === "en" ? `${theme.nameEn} equipped!` : `¡${theme.nameEs} equipado!`)
    } catch {
      toast.error(lang === "en" ? "Could not equip theme" : "Error al equipar tema")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-3 flex items-end justify-between gap-3 px-1">
          <div>
            <h3 className="text-sm font-extrabold text-base-content">{t("store.collection")}</h3>
            <p className="mt-0.5 text-[10px] text-base-content/40">{t("store.themePreview.collectionHint")}</p>
          </div>
          <span className="text-[10px] font-bold tabular-nums text-base-content/35">{ALL_THEMES.length}</span>
        </div>
        <div
          className="grid grid-cols-2 gap-3"
          role="list"
          aria-label={t("store.collection")}
        >
          {ALL_THEMES.map((theme, i) => (
            <div
              key={theme.id}
              role="listitem"
              className={busy === theme.id ? "pointer-events-none opacity-50" : ""}
            >
              <ThemeCard
                theme={theme}
                profile={profile}
                owned={purchases.has(theme.id)}
                equipped={theme.id === equippedTheme}
                onPreview={() => setPreviewTheme(theme)}
                onEquip={() => handleEquip(theme)}
                index={i}
              />
            </div>
          ))}
        </div>
      </div>

      <ThemePreviewModal
        theme={previewTheme}
        profile={profile}
        coins={coins}
        onClose={() => setPreviewTheme(null)}
        onBuy={handleBuy}
      />
    </div>
  )
}
