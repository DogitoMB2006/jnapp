import { useState } from "react"
import { motion } from "framer-motion"
import { Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { ThemeCard } from "./ThemeCard"
import { ALL_THEMES } from "../../../../lib/themes"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"
import type { ThemeDef } from "../../../../types"

export function ThemesSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { group } = useGroupStore()
  const { coins, purchases, equippedTheme, buyTheme, equipTheme } = useStoreStore()
  const [busy, setBusy] = useState<string | null>(null)

  const equipped = ALL_THEMES.find((th) => th.id === equippedTheme) ?? ALL_THEMES[0]
  const others = ALL_THEMES.filter((th) => th.id !== equippedTheme)

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
    <div className="flex flex-col gap-6">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12 }}
        className="flex items-center justify-center gap-2 text-center text-xs text-base-content/45"
      >
        <Users className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
        {t("store.themesHint")}
      </motion.p>

      <section aria-labelledby="store-your-space">
        <motion.h3
          id="store-your-space"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.14 }}
          className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-base-content/35"
        >
          {t("store.yourSpace")}
        </motion.h3>
        <div className={busy === equipped.id ? "opacity-60 pointer-events-none" : ""}>
          <ThemeCard
            theme={equipped}
            owned={purchases.has(equipped.id)}
            equipped
            onBuy={() => handleBuy(equipped)}
            onEquip={() => handleEquip(equipped)}
            index={0}
            featured
          />
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="store-collection">
          <motion.h3
            id="store-collection"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-base-content/35"
          >
            {t("store.collection")}
          </motion.h3>
          <div className="flex flex-col gap-4">
            {others.map((theme, i) => (
              <div
                key={theme.id}
                className={busy === theme.id ? "opacity-60 pointer-events-none" : ""}
              >
                <ThemeCard
                  theme={theme}
                  owned={purchases.has(theme.id)}
                  equipped={false}
                  onBuy={() => handleBuy(theme)}
                  onEquip={() => handleEquip(theme)}
                  index={i + 1}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
