import { memo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Gem, Sparkles, Zap } from "lucide-react"
import { usePrefersReducedMotion } from "../../../../lib/motion"
import { AnimatedBubbleFrame } from "./AnimatedBubbleFrame"
import { useTranslation } from "react-i18next"
import { tapScale } from "../../../../lib/motion"
import type { DecorationDef } from "./decorationDefs"

interface DecorationCardProps {
  decor: DecorationDef
  owned: boolean
  equipped: boolean
  diamonds: number
  layout?: "compact" | "featured"
  onBuy: () => Promise<void>
  onEquip: () => Promise<void>
}

export const DecorationCard = memo(function DecorationCard({
  decor,
  owned,
  equipped,
  diamonds,
  layout = "compact",
  onBuy,
  onEquip,
}: DecorationCardProps) {
  const { t, i18n } = useTranslation()
  const reducedMotion = usePrefersReducedMotion()
  const lang = i18n.language === "en" ? "en" : "es"
  const [busy, setBusy] = useState(false)
  const canAfford = diamonds >= decor.cost
  const isFeatured = layout === "featured"

  async function handlePress() {
    if (busy || equipped || (!owned && !canAfford)) return
    setBusy(true)
    try {
      if (owned) await onEquip()
      else await onBuy()
    } finally {
      setBusy(false)
    }
  }

  const name = lang === "en" ? decor.nameEn : decor.nameEs
  const desc = lang === "en" ? decor.descEn : decor.descEs

  const ctaLabel = busy
    ? "…"
    : equipped
      ? t("store.decor.equipped")
      : owned
        ? t("store.decor.equip")
        : canAfford
          ? t("store.decor.buy")
          : t("store.decor.needMore")

  const previewLabel = lang === "en" ? "Hello!" : "¡Hola!"

  const previewBubble = decor.animated ? (
    <motion.div
      className={`relative flex shrink-0 items-center justify-center ${
        isFeatured ? "min-h-[100px] w-full sm:w-40" : "h-[5.25rem] w-full"
      }`}
    >
      <AnimatedBubbleFrame
        isMine
        reducedMotion={reducedMotion}
        className="max-w-[94%] scale-[0.92] origin-center"
      >
        <p className="bubble-nebula__label text-xs font-semibold">{previewLabel}</p>
      </AnimatedBubbleFrame>
    </motion.div>
  ) : (
    <motion.div
      className={`relative flex shrink-0 items-center justify-center ${
        isFeatured ? "min-h-[88px] w-full sm:w-36" : "h-[4.5rem] w-full"
      }`}
      style={{
        background: `radial-gradient(ellipse 80% 70% at 50% 100%, ${decor.accent}28 0%, transparent 72%)`,
      }}
    >
      <motion.div
        className="max-w-[92%] px-3 py-2 text-xs font-semibold leading-snug shadow-sm"
        style={decor.previewStyle}
      >
        <span style={decor.textStyle ?? {}}>{previewLabel}</span>
      </motion.div>
    </motion.div>
  )

  const priceRow = (
    <motion.div className="flex items-center justify-between gap-2 min-w-0">
      {owned ? (
        <motion.span
          className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: decor.accent }}
        >
          <Sparkles size={11} strokeWidth={2.5} aria-hidden />
          {t("store.decor.owned")}
        </motion.span>
      ) : (
        <motion.span className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 tabular-nums">
          <Gem size={12} strokeWidth={2.5} aria-hidden />
          {t("store.diamondsPrice", { count: decor.cost })}
        </motion.span>
      )}
      <motion.span
        className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold leading-none"
        style={{
          background: equipped
            ? `${decor.accent}22`
            : owned
              ? `${decor.accent}28`
              : canAfford
                ? "color-mix(in oklch, #0ea5e9 18%, transparent)"
                : "oklch(var(--b3)/0.55)",
          color: equipped
            ? decor.accent
            : owned
              ? decor.accent
              : canAfford
                ? "#38bdf8"
                : "oklch(var(--bc)/0.4)",
        }}
      >
        {busy ? <span className="loading loading-spinner loading-xs" /> : ctaLabel}
      </motion.span>
    </motion.div>
  )

  return (
    <motion.button
      type="button"
      onClick={() => void handlePress()}
      disabled={busy || equipped || (!owned && !canAfford)}
      {...tapScale}
      className={`group relative flex w-full text-left transition-shadow duration-200 overflow-hidden rounded-2xl border bg-base-200/60 disabled:cursor-default disabled:opacity-55 ${
        isFeatured ? "flex-row items-stretch gap-0 sm:gap-1" : "flex-col"
      }`}
      style={{
        borderColor: equipped
          ? `${decor.accent}70`
          : owned
            ? `${decor.accent}35`
            : "oklch(var(--b3)/0.75)",
        boxShadow: equipped
          ? `0 0 0 1px ${decor.accent}30, 0 8px 28px ${decor.accent}18`
          : undefined,
      }}
    >
      {decor.animated ? (
        <motion.div
          className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.35), rgba(34,211,238,0.25))",
            color: "#e9d5ff",
            boxShadow: "0 0 12px rgba(168,85,247,0.45)",
          }}
        >
          <Zap size={10} strokeWidth={2.5} aria-hidden />
          {t("store.decor.animated")}
        </motion.div>
      ) : null}

      {equipped && (
        <motion.div
          className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${decor.accent}25`, color: decor.accent }}
        >
          <CheckCircle2 size={10} strokeWidth={2.5} aria-hidden />
          {t("store.on")}
        </motion.div>
      )}

      {isFeatured ? (
        <>
          <motion.div className="flex flex-1 items-center justify-center border-r border-base-300/50 px-3 py-4 sm:max-w-[42%]">
            {previewBubble}
          </motion.div>
          <motion.div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-4">
            <motion.div>
              <h3 className="font-bold text-sm text-base-content leading-tight">{name}</h3>
              <p className="mt-1 text-[11px] text-base-content/55 leading-snug line-clamp-2">{desc}</p>
            </motion.div>
            {priceRow}
          </motion.div>
        </>
      ) : (
        <>
          {previewBubble}
          <motion.div className="flex min-w-0 flex-1 flex-col gap-2 px-3 pb-3 pt-1">
            <motion.div className="min-w-0">
              <h3 className="truncate text-xs font-bold text-base-content">{name}</h3>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-base-content/45">{desc}</p>
            </motion.div>
            {priceRow}
          </motion.div>
        </>
      )}
    </motion.button>
  )
})
