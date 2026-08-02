import { memo } from "react"
import { motion } from "framer-motion"
import { Check, Coins, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { staggerDelay, springSnappy, tapScale } from "../../../../lib/motion"
import type { ThemeDef } from "../../../../types"

interface ThemeCardProps {
  theme: ThemeDef
  owned: boolean
  equipped: boolean
  onBuy: () => void
  onEquip: () => void
  index: number
}

const RARITY_COLORS: Record<string, string> = {
  common: "#86efac",
  uncommon: "#67e8f9",
  epic: "#c084fc",
  legendary: "#fbbf24",
}

export const ThemeCard = memo(function ThemeCard({
  theme,
  owned,
  equipped,
  onBuy,
  onEquip,
  index,
}: ThemeCardProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const name = lang === "en" ? theme.nameEn : theme.nameEs
  const rarityColor = RARITY_COLORS[theme.rarity] ?? RARITY_COLORS.common
  const { bg, primary, accent } = theme.preview

  const handlePress = () => {
    if (equipped) return
    if (owned) onEquip()
    else onBuy()
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay: staggerDelay(index, 0.035, 0.25) }}
      {...(equipped ? {} : tapScale)}
      onClick={handlePress}
      disabled={equipped}
      aria-label={
        equipped
          ? `${name}, ${t("store.equipped")}`
          : owned
            ? `${name}, ${t("store.equip")}`
            : `${name}, ${t("store.coinsPrice", { count: theme.cost })}`
      }
      aria-pressed={equipped}
      className={`group relative aspect-square w-full overflow-hidden rounded-2xl border text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default ${
        equipped
          ? "border-primary shadow-[0_0_0_2px_color-mix(in_srgb,var(--p)_35%,transparent),0_8px_24px_rgba(0,0,0,0.2)]"
          : "border-base-300/80 hover:border-base-content/20 hover:shadow-md hover:shadow-black/15"
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${bg} 0%, color-mix(in srgb, ${bg} 55%, ${primary}) 55%, ${accent} 100%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 70% 20%, ${primary}66 0%, transparent 55%)`,
        }}
        aria-hidden
      />

      <span
        className="absolute top-2 left-2 h-2 w-2 rounded-full ring-2 ring-black/20"
        style={{ background: rarityColor }}
        aria-hidden
      />

      {equipped && (
        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-content shadow-sm">
          <span className="h-1 w-1 rounded-full bg-primary-content" aria-hidden />
          {t("store.on")}
        </span>
      )}

      {!owned && !equipped && (
        <span className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm">
          <Lock size={10} strokeWidth={2.5} aria-hidden />
        </span>
      )}

      {owned && !equipped && (
        <span className="absolute top-1.5 right-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm">
          <Check size={11} strokeWidth={2.75} aria-hidden />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2 pb-2 pt-6">
        <p className="truncate text-[11px] font-bold leading-tight text-white drop-shadow-sm">
          {name}
        </p>
        {!owned && (
          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums text-warning">
            <Coins size={10} strokeWidth={2.5} aria-hidden />
            {theme.cost}
          </span>
        )}
        {owned && !equipped && (
          <span className="mt-0.5 block text-[10px] font-semibold text-white/70">
            {t("store.equip")}
          </span>
        )}
      </div>
    </motion.button>
  )
})
