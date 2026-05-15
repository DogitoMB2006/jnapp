import type { TFunction } from "i18next"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getStreakTier, STREAK_TIER_COLORS, type StreakTier } from "../../lib/streak"
import { useStreakStore } from "../../store/streakStore"
import { FireSVGSmall } from "./FireSVGSmall"

const spring = { type: "spring" as const, stiffness: 380, damping: 28 }

export function StreakBadge() {
  const { t } = useTranslation()
  const { streak, loaded } = useStreakStore()

  if (!loaded) return null

  const colors = STREAK_TIER_COLORS[getStreakTier(streak)]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, ...spring }}
      className="w-full rounded-2xl border border-base-300/60 bg-base-200/40 overflow-hidden"
    >
      <div className="px-4 py-3 flex flex-col items-center gap-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, ...spring }}
          className="flex flex-col items-center gap-1"
          aria-label={t("streak.title")}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
          >
            <FireSVGSmall
              primary={colors.primary}
              secondary={colors.secondary}
              accent={colors.accent}
              size={22}
            />
          </motion.div>

          {streak === 0 ? (
            <span className="text-3xl font-black leading-none tabular-nums text-base-content/30">
              0
            </span>
          ) : (
            <motion.span
              key={streak}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="text-3xl font-black leading-none tabular-nums"
              style={{ color: colors.primary }}
            >
              {streak}
            </motion.span>
          )}
        </motion.div>

        <NextMilestone streak={streak} colors={colors} t={t} />
      </div>
    </motion.div>
  )
}

function NextMilestone({
  streak,
  colors,
  t,
}: {
  streak: number
  colors: (typeof STREAK_TIER_COLORS)[StreakTier]
  t: TFunction
}) {
  let next: number | null = null
  let label = ""

  if (streak < 20) {
    next = 20
    label = t("streak.milestoneBlue20")
  } else if (streak < 50) {
    next = 50
    label = t("streak.milestoneCyan50")
  } else if (streak < 100) {
    next = 100
    label = t("streak.milestoneLegend100")
  }

  if (!next) {
    return (
      <p className="text-[11px] text-center text-base-content/45" style={{ color: colors.primary }}>
        {t("streak.legendaryKeepGoing")}
      </p>
    )
  }

  const remaining = next - streak

  return (
    <p className="text-[11px] text-base-content/40 text-center leading-snug">
      {label}{" "}
      <span style={{ color: colors.primary }} className="font-semibold">
        {remaining} {remaining === 1 ? t("streak.dayLeft") : t("streak.daysLeft")}
      </span>
    </p>
  )
}
