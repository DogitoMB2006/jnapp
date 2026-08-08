import { memo, useState } from "react"
import { motion } from "framer-motion"
import { Check, Gem, Lock, Zap } from "lucide-react"
import { usePrefersReducedMotion, staggerDelay, springSnappy, tapScale } from "../../../../lib/motion"
import { AnimatedBubbleFrame } from "./AnimatedBubbleFrame"
import { CardDecorationFrame } from "../../../shared/CardDecorationFrame"
import { useTranslation } from "react-i18next"
import type { DecorationDef } from "./decorationDefs"

interface DecorationCardProps {
  decor: DecorationDef
  owned: boolean
  equipped: boolean
  diamonds: number
  index: number
  onPreview: () => void
  onEquip: () => Promise<void>
}

export const DecorationCard = memo(function DecorationCard({
  decor,
  owned,
  equipped,
  diamonds,
  index,
  onPreview,
  onEquip,
}: DecorationCardProps) {
  const { t, i18n } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const lang = i18n.language === "en" ? "en" : "es"
  const [busy, setBusy] = useState(false)
  const canAfford = diamonds >= decor.cost
  const name = lang === "en" ? decor.nameEn : decor.nameEs
  const previewLabel = lang === "en" ? "Hi" : "Hola"
  const cardPreviewLabel = lang === "en" ? "Friday plan" : "Plan del viernes"
  const animated = Boolean(decor.variant)
  const disabled = busy || equipped

  async function handlePress() {
    if (disabled) return
    setBusy(true)
    try {
      if (owned) await onEquip()
      else onPreview()
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springSnappy, delay: staggerDelay(index, 0.035, 0.25) }}
      {...(disabled ? {} : tapScale)}
      onClick={() => void handlePress()}
      disabled={disabled}
      aria-label={
        equipped
          ? `${name}, ${t("store.decor.equipped")}`
          : owned
            ? `${name}, ${t("store.decor.equip")}`
            : `${name}, ${t("store.diamondsPrice", { count: decor.cost })}`
      }
      aria-pressed={equipped}
      className="group relative aspect-square w-full overflow-hidden rounded-2xl border bg-base-200/70 text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 disabled:cursor-default disabled:opacity-70"
      style={{
        borderColor: equipped
          ? `${decor.accent}80`
          : owned
            ? `${decor.accent}40`
            : "oklch(var(--b3)/0.8)",
        boxShadow: equipped
          ? `0 0 0 2px ${decor.accent}40, 0 8px 20px ${decor.accent}18`
          : undefined,
      }}
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 0%, ${decor.accent}35 0%, transparent 70%)`,
        }}
        aria-hidden
      />

      {animated && (
        <span
          className="absolute top-1.5 left-1.5 z-10 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.4), rgba(34,211,238,0.28))",
            color: "#e9d5ff",
          }}
        >
          <Zap size={8} strokeWidth={2.75} aria-hidden />
          {t("store.decor.animated")}
        </span>
      )}

      {equipped && (
        <span
          className="absolute top-1.5 right-1.5 z-10 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase"
          style={{ background: `${decor.accent}30`, color: decor.accent }}
        >
          {t("store.on")}
        </span>
      )}

      {!owned && !equipped && (
        <span className="absolute top-1.5 right-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white/85 backdrop-blur-sm">
          <Lock size={10} strokeWidth={2.5} aria-hidden />
        </span>
      )}

      {owned && !equipped && (
        <span className="absolute top-1.5 right-1.5 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/25 text-white/90 backdrop-blur-sm">
          <Check size={11} strokeWidth={2.75} aria-hidden />
        </span>
      )}

      <div className="relative flex h-[58%] items-center justify-center px-2 pt-5">
        {decor.target === "card" ? (
          <CardDecorationFrame decorationId={decor.id} preview className="w-[92%]">
            <div className="relative overflow-hidden rounded-[11px] bg-[#170d20] px-2.5 py-2 shadow-lg">
              <span className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-primary to-secondary" />
              <p className="truncate pl-1 text-[9px] font-bold text-white/90">{cardPreviewLabel}</p>
              <p className="mt-1 pl-1 text-[7px] text-white/40">{lang === "en" ? "A shared moment" : "Un momento juntos"}</p>
              <div className="mt-2 ml-1 h-px bg-white/8" />
            </div>
          </CardDecorationFrame>
        ) : decor.variant === "bubble-nebula" ? (
          <AnimatedBubbleFrame
            isMine
            reducedMotion={reducedMotion}
            className="max-w-[92%] scale-[0.72] origin-center"
          >
            <p className="bubble-nebula__label text-[10px] font-semibold">{previewLabel}</p>
          </AnimatedBubbleFrame>
        ) : (
          <div
            className="max-w-[88%] px-2 py-1.5 text-[10px] font-semibold leading-none shadow-sm"
            style={decor.previewStyle}
          >
            <span style={decor.textStyle ?? {}}>{previewLabel}</span>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base-300/95 via-base-200/80 to-transparent px-2 pb-2 pt-5">
        <p className="truncate text-[11px] font-bold leading-tight text-base-content">
          {name}
        </p>
        {busy ? (
          <span className="mt-0.5 loading loading-spinner loading-xs text-sky-400" />
        ) : !owned ? (
          <span
            className={`mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
              canAfford ? "text-sky-400" : "text-base-content/35"
            }`}
          >
            <Gem size={10} strokeWidth={2.5} aria-hidden />
            {decor.cost}
          </span>
        ) : !equipped ? (
          <span className="mt-0.5 block text-[10px] font-semibold" style={{ color: decor.accent }}>
            {t("store.decor.equip")}
          </span>
        ) : (
          <span className="mt-0.5 block text-[10px] font-semibold text-base-content/45">
            {t("store.decor.equipped")}
          </span>
        )}
      </div>
    </motion.button>
  )
})
