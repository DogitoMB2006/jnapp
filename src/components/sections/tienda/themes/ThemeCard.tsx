import { motion } from "framer-motion"
import { Check, Coins, Lock, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ThemeDef } from "../../../../types"

interface ThemeCardProps {
  theme: ThemeDef
  owned: boolean
  equipped: boolean
  onBuy: () => void
  onEquip: () => void
  index: number
  featured?: boolean
}

const RARITY_LABELS: Record<string, { en: string; es: string; color: string }> = {
  common: { en: "Common", es: "Común", color: "#86efac" },
  uncommon: { en: "Uncommon", es: "Poco común", color: "#67e8f9" },
  epic: { en: "Epic", es: "Épico", color: "#c084fc" },
  legendary: { en: "Legendary", es: "Legendario", color: "#fbbf24" },
}

const ThemePreviewMock = ({ theme }: { theme: ThemeDef }) => {
  const { primary, secondary, accent, bg, text } = theme.preview
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[220px] overflow-hidden rounded-[1.35rem] border border-white/10 shadow-lg"
      style={{
        background: `linear-gradient(160deg, ${bg} 0%, color-mix(in srgb, ${bg} 70%, ${primary} 30%) 100%)`,
        aspectRatio: "9 / 14",
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <motion.div
        aria-hidden
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 blur-2xl"
        style={{ background: primary }}
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex items-center justify-between px-3 pt-2.5">
        <motion.div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: primary }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: secondary }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
        <motion.div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: accent }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
        />
      </div>
      <motion.div
        className="relative mx-3 mt-2 rounded-xl px-2.5 py-2"
        style={{ background: `${primary}22`, border: `1px solid ${primary}33` }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-1 w-8 rounded-full opacity-80" style={{ background: text }} />
        <motion.div
          className="mt-1.5 h-1 w-full rounded-full opacity-40"
          style={{ background: text }}
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <div className="mt-1 h-1 w-2/3 rounded-full opacity-25" style={{ background: text }} />
      </motion.div>
      <div className="absolute bottom-3 left-3 right-3 flex gap-1">
        {[primary, secondary, accent].map((c, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full opacity-70"
            style={{ background: c }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function ThemeCard({
  theme,
  owned,
  equipped,
  onBuy,
  onEquip,
  index,
  featured = false,
}: ThemeCardProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const name = lang === "en" ? theme.nameEn : theme.nameEs
  const rarity = RARITY_LABELS[theme.rarity] ?? RARITY_LABELS.common
  const rarityLabel = lang === "en" ? rarity.en : rarity.es

  const handleCardPress = () => {
    if (equipped) return
    if (owned) onEquip()
    else onBuy()
  }

  const isInteractive = !equipped

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 300, damping: 28 }}
      className={`relative overflow-hidden rounded-3xl border bg-base-200/30 backdrop-blur-sm transition-shadow duration-300 ${
        equipped
          ? "border-primary/50 shadow-[0_0_40px_rgba(255,45,107,0.15)]"
          : "border-base-300/80 hover:border-base-content/15 hover:shadow-xl hover:shadow-black/20"
      } ${featured ? "p-5" : "p-4"}`}
    >
      {equipped && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent"
          style={{
            background: `linear-gradient(to bottom, color-mix(in srgb, ${theme.preview.primary} 12%, transparent), transparent)`,
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      <div className={`relative flex flex-col gap-4 ${featured ? "sm:flex-row sm:items-center sm:gap-6" : ""}`}>
        <div className={featured ? "sm:flex-1 flex justify-center" : "flex justify-center pt-1"}>
          <ThemePreviewMock theme={theme} />
        </div>

        <div className={`relative flex flex-col gap-3 ${featured ? "sm:flex-1 sm:min-w-0" : ""}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-base text-base-content truncate">{name}</h3>
              <span
                className="mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  color: rarity.color,
                  background: `${rarity.color}18`,
                }}
              >
                {rarityLabel}
              </span>
            </div>
            {equipped && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold text-primary">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {t("store.on")}
              </span>
            )}
          </div>

          <motion.button
            type="button"
            whileTap={isInteractive ? { scale: 0.98 } : {}}
            onClick={handleCardPress}
            disabled={equipped}
            className={`w-full rounded-2xl py-3 text-sm font-bold transition-all duration-200 disabled:cursor-default ${
              equipped
                ? "bg-base-300/50 text-base-content/50"
                : owned
                  ? "bg-primary text-primary-content shadow-md shadow-primary/25 hover:brightness-110"
                  : "border border-warning/30 bg-warning/10 text-warning hover:bg-warning/15"
            }`}
          >
            {equipped ? (
              <span className="inline-flex items-center gap-1.5">
                <Check size={16} strokeWidth={2.5} aria-hidden />
                {t("store.equipped")}
              </span>
            ) : owned ? (
              t("store.equip")
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <Lock size={14} strokeWidth={2.5} aria-hidden />
                <Sparkles size={14} strokeWidth={2} aria-hidden />
                <Coins size={14} strokeWidth={2.25} aria-hidden />
                {t("store.coinsPrice", { count: theme.cost })}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
