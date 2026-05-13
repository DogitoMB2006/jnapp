import type { TFunction } from "i18next"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getStreakTier, STREAK_TIER_COLORS } from "../../lib/streak"
import { useStreakStore } from "../../store/streakStore"
import { FireSVGSmall } from "./FireSVGSmall"

export function StreakBadge() {
  const { t } = useTranslation()
  const { streak, longestStreak, loaded } = useStreakStore()

  if (!loaded) return null

  const tier = getStreakTier(streak)
  const colors = STREAK_TIER_COLORS[tier]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="w-full card border shadow-md overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(0,0,0,0.04) 100%)`,
        borderColor: `${colors.primary}30`,
      }}
    >
      <div className="card-body p-5 gap-4">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.primary}40`,
              padding: "6px",
              filter: `drop-shadow(0 0 8px ${colors.glow})`,
            }}
          >
            <FireSVGSmall
              primary={colors.primary}
              secondary={colors.secondary}
              accent={colors.accent}
              size={22}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base-content text-sm">{t("streak.title")}</h2>
            <p className="text-xs text-base-content/50">{t("streak.subtitle")}</p>
          </div>
          {streak >= 20 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: colors.bg, color: colors.primary, border: `1px solid ${colors.primary}40` }}
            >
              {streak >= 100 ? t("streak.tierLegendary") : streak >= 50 ? t("streak.tierEpic") : t("streak.tierAmazing")}
            </span>
          )}
        </div>

        {/* Streak numbers */}
        {streak > 0 && streak === longestStreak ? (
          // No record to compare — show single centered counter
          <div
            className="flex flex-col items-center gap-1 py-3 rounded-xl w-full"
            style={{ background: `${colors.primary}12` }}
          >
            <span
              className="text-5xl font-black leading-none"
              style={{ color: colors.primary, textShadow: `0 0 20px ${colors.glow}` }}
            >
              {streak}
            </span>
            <span className="text-xs text-base-content/50 font-medium">
              {streak === 1 ? t("streak.day") : t("streak.daysInARow")}
            </span>
          </div>
        ) : (
          // Current vs record
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl"
              style={{ background: `${colors.primary}12` }}>
              <span
                className="text-4xl font-black leading-none"
                style={{ color: colors.primary, textShadow: `0 0 16px ${colors.glow}` }}
              >
                {streak}
              </span>
              <span className="text-xs text-base-content/50 font-medium">
                {streak === 1 ? t("streak.day") : t("streak.days")}
              </span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-base-content/20 text-xs">{t("streak.vs")}</span>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-base-300/50">
              <span className="text-4xl font-black leading-none text-base-content/50">
                {longestStreak}
              </span>
              <span className="text-xs text-base-content/40 font-medium">{t("streak.record")}</span>
            </div>
          </div>
        )}

        {/* Progress bar — only when below record */}
        {longestStreak > 0 && streak < longestStreak && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-base-content/40">
              <span>{t("streak.progressToRecord")}</span>
              <span>{Math.round((streak / longestStreak) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-base-300">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (streak / longestStreak) * 100)}%` }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${colors.secondary}, ${colors.primary})`,
                  boxShadow: `0 0 6px ${colors.glow}`,
                }}
              />
            </div>
          </div>
        )}

        {/* Next milestone hint */}
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
  colors: (typeof STREAK_TIER_COLORS)[keyof typeof STREAK_TIER_COLORS]
  t: TFunction
}) {
  let next: number | null = null
  let label = ""

  if (streak < 20) { next = 20; label = t("streak.milestoneBlue20") }
  else if (streak < 50) { next = 50; label = t("streak.milestoneCyan50") }
  else if (streak < 100) { next = 100; label = t("streak.milestoneLegend100") }

  if (!next) {
    return (
      <p className="text-xs text-center" style={{ color: colors.primary }}>
        {t("streak.legendaryKeepGoing")}
      </p>
    )
  }

  const remaining = next - streak
  return (
    <p className="text-xs text-base-content/40 text-center">
      {label}{" "}
      <span style={{ color: colors.primary }} className="font-semibold">
        {remaining} {remaining === 1 ? t("streak.dayLeft") : t("streak.daysLeft")}
      </span>
    </p>
  )
}
