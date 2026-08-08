import { memo } from "react"
import { motion } from "framer-motion"
import { Check, Coins, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { staggerDelay, springSnappy, tapScale } from "../../../../lib/motion"
import type { Profile, ThemeDef } from "../../../../types"
import { ThemePreviewCanvas } from "./ThemePreviewCanvas"

interface ThemeCardProps {
  theme: ThemeDef
  profile: Profile | null
  owned: boolean
  equipped: boolean
  onPreview: () => void
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
  profile,
  owned,
  equipped,
  onPreview,
  onEquip,
  index,
}: ThemeCardProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const name = lang === "en" ? theme.nameEn : theme.nameEs
  const rarityColor = RARITY_COLORS[theme.rarity] ?? RARITY_COLORS.common

  function handlePress() {
    if (equipped) return
    if (owned) onEquip()
    else onPreview()
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay: staggerDelay(index, 0.045, 0.3) }}
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
      className="group relative h-[210px] w-full overflow-hidden rounded-[24px] border text-left shadow-lg shadow-black/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:cursor-default"
      style={{
        borderColor: equipped ? theme.preview.primary : `${theme.preview.primary}42`,
        boxShadow: equipped ? `0 0 0 2px ${theme.preview.primary}40, 0 14px 34px rgba(0,0,0,0.25)` : undefined,
      }}
    >
      <ThemePreviewCanvas theme={theme} profile={profile} compact className="absolute inset-0" />

      <span
        className="absolute left-2.5 top-2.5 rounded-full border px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.12em] backdrop-blur-md"
        style={{ color: rarityColor, borderColor: `${rarityColor}55`, background: "rgba(0,0,0,0.38)" }}
      >
        {t(`store.themeRarity.${theme.rarity}`)}
      </span>

      {equipped ? (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white backdrop-blur-md">
          <Check size={9} strokeWidth={3} aria-hidden />
          {t("store.on")}
        </span>
      ) : !owned ? (
        <span className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md">
          <Lock size={12} strokeWidth={2.5} aria-hidden />
        </span>
      ) : (
        <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[8px] font-bold uppercase text-white/90 backdrop-blur-md">
          {t("store.themePreview.tapApply")}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-3 pt-10">
        <p className="truncate text-sm font-extrabold tracking-tight text-white">{name}</p>
        {!owned ? (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-amber-300">
            <Coins size={12} strokeWidth={2.5} aria-hidden />
            {theme.cost}
          </span>
        ) : !equipped ? (
          <span className="mt-1 block text-[10px] font-semibold text-white/55">{t("store.equip")}</span>
        ) : (
          <span className="mt-1 block text-[10px] font-semibold" style={{ color: theme.preview.accent }}>
            {t("store.equipped")}
          </span>
        )}
      </div>
    </motion.button>
  )
})
