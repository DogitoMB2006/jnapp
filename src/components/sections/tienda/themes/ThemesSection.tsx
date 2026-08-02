import { useState } from "react"
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { ThemeCard } from "./ThemeCard"
import { ALL_THEMES } from "../../../../lib/themes"
import { useShallow } from "zustand/react/shallow"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"
import type { ThemeDef } from "../../../../types"

export function ThemesSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const group = useGroupStore((s) => s.group)
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

  const equipped = ALL_THEMES.find((th) => th.id === equippedTheme) ?? ALL_THEMES[0]
  const equippedName = lang === "en" ? equipped.nameEn : equipped.nameEs

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
      toast.success(lang === "en" ? `${theme.nameEn} equipped!` : `¡${theme.nameEs} equipado!`)
    } catch {
      toast.error(lang === "en" ? "Could not equip theme" : "Error al equipar tema")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-1.5 text-center text-[11px] leading-snug text-base-content/45"
      >
        <Users className="h-3 w-3 shrink-0 text-primary/70" aria-hidden />
        {t("store.themesHint")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/8 px-2.5 py-2"
        aria-label={`${t("store.yourSpace")}: ${equippedName}`}
      >
        <div
          className="h-8 w-8 shrink-0 rounded-lg border border-white/15 shadow-inner"
          style={{
            background: `linear-gradient(135deg, ${equipped.preview.bg}, ${equipped.preview.primary}, ${equipped.preview.accent})`,
          }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-base-content/40">
            {t("store.yourSpace")}
          </p>
          <p className="truncate text-sm font-bold text-base-content">{equippedName}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
          {t("store.on")}
        </span>
      </motion.div>

      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5"
        role="list"
        aria-label={t("store.collection")}
      >
        {ALL_THEMES.map((theme, i) => (
          <div
            key={theme.id}
            role="listitem"
            className={busy === theme.id ? "opacity-55 pointer-events-none" : ""}
          >
            <ThemeCard
              theme={theme}
              owned={purchases.has(theme.id)}
              equipped={theme.id === equippedTheme}
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
