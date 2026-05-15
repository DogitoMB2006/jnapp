import { motion } from "framer-motion"
import { Check, Lock, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ThemeDef } from "../../../../types"

interface ThemeCardProps {
  theme: ThemeDef
  owned: boolean
  equipped: boolean
  onBuy: () => void
  onEquip: () => void
  index: number
}

const RARITY_LABELS: Record<string, { en: string; es: string; color: string }> = {
  common:    { en: "Common",    es: "Común",       color: "#86efac" },
  uncommon:  { en: "Uncommon",  es: "Poco común",  color: "#67e8f9" },
  epic:      { en: "Epic",      es: "Épico",        color: "#c084fc" },
  legendary: { en: "Legendary", es: "Legendario",  color: "#fbbf24" },
}

export function ThemeCard({ theme, owned, equipped, onBuy, onEquip, index }: ThemeCardProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const name = lang === "en" ? theme.nameEn : theme.nameEs
  const rarity = RARITY_LABELS[theme.rarity] ?? RARITY_LABELS.common
  const rarityLabel = lang === "en" ? rarity.en : rarity.es

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: "spring", stiffness: 300, damping: 28 }}
      className="relative rounded-2xl overflow-hidden border transition-all duration-200"
      style={{
        background: `linear-gradient(145deg, ${theme.preview.bg} 0%, color-mix(in srgb, ${theme.preview.bg} 80%, ${theme.preview.primary} 20%) 100%)`,
        borderColor: equipped
          ? theme.preview.primary
          : "rgba(255,255,255,0.08)",
        boxShadow: equipped
          ? `0 0 0 2px ${theme.preview.primary}40, 0 8px 24px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.35)",
      }}
    >
      {/* Color preview strip */}
      <div className="flex h-2 w-full">
        <div className="flex-1" style={{ background: theme.preview.bg }} />
        <div className="flex-[2]" style={{ background: theme.preview.primary }} />
        <div className="flex-1" style={{ background: theme.preview.secondary }} />
        <div className="flex-1" style={{ background: theme.preview.accent }} />
      </div>

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-sm leading-tight truncate"
              style={{ color: theme.preview.text }}
            >
              {name}
            </p>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 inline-block"
              style={{ color: rarity.color }}
            >
              {rarityLabel}
            </span>
          </div>

          {equipped && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0"
              style={{ background: `${theme.preview.primary}30`, color: theme.preview.primary }}
            >
              <Check size={10} strokeWidth={3} />
              {lang === "en" ? "On" : "Activo"}
            </div>
          )}
        </div>

        {/* Color swatches */}
        <div className="flex items-center gap-1.5 mb-4">
          {[theme.preview.primary, theme.preview.secondary, theme.preview.accent, theme.preview.bg].map(
            (c, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-white/10 shadow-sm"
                style={{ background: c }}
              />
            )
          )}
        </div>

        {/* Action button */}
        {theme.cost === 0 ? (
          <button
            type="button"
            onClick={onEquip}
            disabled={equipped}
            className="w-full rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-default"
            style={
              equipped
                ? { background: `${theme.preview.primary}20`, color: theme.preview.primary }
                : { background: theme.preview.primary, color: "#fff" }
            }
          >
            {equipped
              ? lang === "en" ? "Equipped" : "Equipado"
              : lang === "en" ? "Equip" : "Equipar"}
          </button>
        ) : owned ? (
          <button
            type="button"
            onClick={onEquip}
            disabled={equipped}
            className="w-full rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-default"
            style={
              equipped
                ? { background: `${theme.preview.primary}20`, color: theme.preview.primary }
                : { background: theme.preview.primary, color: "#fff" }
            }
          >
            {equipped
              ? lang === "en" ? "Equipped" : "Equipado"
              : lang === "en" ? "Equip" : "Equipar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuy}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all duration-150 active:scale-95"
            style={{ background: `${theme.preview.primary}22`, color: theme.preview.primary, border: `1px solid ${theme.preview.primary}40` }}
          >
            <Lock size={11} strokeWidth={2.5} />
            <Sparkles size={11} strokeWidth={2} />
            {theme.cost} {lang === "en" ? "coins" : "monedas"}
          </button>
        )}
      </div>
    </motion.div>
  )
}
