import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getStreakTier, STREAK_TIER_COLORS } from "../../lib/streak"

interface Props {
  fromStreak: number
  visible: boolean
  onDismiss: () => void
}

/** Lerp between two hex colors by ratio 0→1 */
function lerpColor(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.replace("#", ""), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [ar, ag, ab] = parse(hexA)
  const [br, bg, bb] = parse(hexB)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const b = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${b})`
}

function DyingFireSVG({
  primary,
  secondary,
  fadeRatio,
  size = 120,
}: {
  primary: string
  secondary: string
  fadeRatio: number // 0=full color, 1=fully grey/dead
  size?: number
}) {
  const grey = "#4B5563"
  const greyDim = "#374151"
  const col1 = lerpColor(primary, grey, fadeRatio)
  const col2 = lerpColor(secondary, greyDim, fadeRatio)
  const col3 = lerpColor("#FFEC40", "#6B7280", fadeRatio)
  const opacity = 1 - fadeRatio * 0.35
  const id = `df-${Math.round(fadeRatio * 100)}`

  return (
    <div style={{ opacity, filter: `drop-shadow(0 0 ${18 - fadeRatio * 14}px ${col1})` }}>
      <svg
        width={size}
        height={size * 1.3}
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-outer`} x1="50" y1="128" x2="50" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={col3} />
            <stop offset="45%" stopColor={col2} />
            <stop offset="100%" stopColor={col1} stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`${id}-inner`} x1="50" y1="100" x2="50" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={col3} stopOpacity={1 - fadeRatio * 0.7} />
            <stop offset="100%" stopColor={col2} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer flame — shrinks as ratio increases */}
        <motion.path
          d="M50 126C24 126 8 110 8 88C8 66 22 52 32 40C26 56 34 66 42 72C34 56 38 38 46 24C42 38 50 50 58 58C64 46 62 28 54 14C72 30 92 54 92 88C92 110 76 126 50 126Z"
          fill={`url(#${id}-outer)`}
          animate={{
            d: [
              "M50 126C24 126 8 110 8 88C8 66 22 52 32 40C26 56 34 66 42 72C34 56 38 38 46 24C42 38 50 50 58 58C64 46 62 28 54 14C72 30 92 54 92 88C92 110 76 126 50 126Z",
              "M50 126C26 126 9 109 9 88C9 67 23 53 33 41C28 57 35 67 43 71C36 57 39 39 47 25C43 39 51 51 59 59C65 47 63 29 55 15C73 31 91 55 91 88C91 110 74 126 50 126Z",
              "M50 126C24 126 8 110 8 88C8 66 22 52 32 40C26 56 34 66 42 72C34 56 38 38 46 24C42 38 50 50 58 58C64 46 62 28 54 14C72 30 92 54 92 88C92 110 76 126 50 126Z",
            ],
          }}
          transition={{
            duration: 1.8 + fadeRatio * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Inner core */}
        <motion.ellipse
          cx="50"
          cy="96"
          rx={13 - fadeRatio * 5}
          ry={18 - fadeRatio * 8}
          fill={`url(#${id}-inner)`}
          animate={{
            ry: [18 - fadeRatio * 8, 20 - fadeRatio * 8, 17 - fadeRatio * 8, 18 - fadeRatio * 8],
          }}
          transition={{ duration: 1.2 + fadeRatio, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Smoke wisps when dying (fadeRatio > 0.5) */}
        {fadeRatio > 0.4 && (
          <>
            <motion.ellipse
              cx="44"
              cy="14"
              rx="4"
              ry="6"
              fill="#6B7280"
              opacity={fadeRatio - 0.4}
              animate={{ cy: [14, 6, 14], rx: [4, 6, 4], opacity: [fadeRatio - 0.4, 0, fadeRatio - 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.ellipse
              cx="56"
              cy="18"
              rx="3"
              ry="5"
              fill="#4B5563"
              opacity={fadeRatio - 0.4}
              animate={{ cy: [18, 8, 18], rx: [3, 5, 3], opacity: [fadeRatio - 0.4, 0, fadeRatio - 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
            />
          </>
        )}
      </svg>
    </div>
  )
}

/** Slot-machine number display */
function SlotNumber({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-24 flex items-center justify-center overflow-hidden" style={{ minWidth: 180 }}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -60, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 60, opacity: 0, scale: 0.7 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          style={{
            color,
            textShadow: `0 0 24px ${color}`,
            position: "absolute",
          }}
          className="text-8xl font-black tabular-nums leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export function StreakBreakAnimation({ fromStreak, visible, onDismiss }: Props) {
  const { t } = useTranslation()
  const tier = getStreakTier(fromStreak)
  const colors = STREAK_TIER_COLORS[tier]

  const [current, setCurrent] = useState(fromStreak)
  const [phase, setPhase] = useState<"counting" | "done">("counting")
  const countingRef = useRef(false)

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss])

  // Reset state when animation becomes visible
  useEffect(() => {
    if (!visible) {
      setCurrent(fromStreak)
      setPhase("counting")
      countingRef.current = false
      return
    }

    if (countingRef.current) return
    countingRef.current = true

    if (fromStreak <= 1) {
      setPhase("done")
      return
    }

    // Pause briefly then count down
    let cancelled = false
    let n = fromStreak

    const tick = () => {
      if (cancelled) return
      n--
      setCurrent(n)

      if (n <= 1) {
        setTimeout(() => {
          if (!cancelled) setPhase("done")
        }, 500)
        return
      }

      // Speed: fast at start, slightly slower near end for drama
      const delay = n <= 5 ? 180 : n <= 10 ? 120 : 75
      setTimeout(tick, delay)
    }

    const startTimer = setTimeout(tick, 900)
    return () => {
      cancelled = true
      clearTimeout(startTimer)
    }
  }, [visible, fromStreak])

  // Auto-dismiss 3s after countdown finishes
  useEffect(() => {
    if (phase !== "done" || !visible) return
    const t = setTimeout(handleDismiss, 3000)
    return () => clearTimeout(t)
  }, [phase, visible, handleDismiss])

  // Fade ratio: 0 (full color) → 1 (full grey) as current drops from fromStreak → 1
  const fadeRatio = fromStreak > 1 ? Math.max(0, Math.min(1, (fromStreak - current) / (fromStreak - 1))) : 1

  const currentColor = lerpColor(colors.primary, "#6B7280", fadeRatio)
  const currentGlow = lerpColor(colors.glow.replace("rgba", "rgb").replace(/,\s*[\d.]+\)/, ")"), "rgba(107,114,128,0.3)", fadeRatio)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={phase === "done" ? handleDismiss : undefined}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, rgba(10,0,0,0.92) 0%, rgba(0,0,0,0.98) 100%)",
            cursor: phase === "done" ? "pointer" : "default",
          }}
        >
          {/* Background pulse (slow, dying) */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.12 - fadeRatio * 0.08, 0.18 - fadeRatio * 0.12, 0.12 - fadeRatio * 0.08],
            }}
            transition={{ duration: 2.5 + fadeRatio * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${currentGlow} 0%, transparent 70%)`,
            }}
          />

          <div className="relative flex flex-col items-center gap-5 select-none">
            {/* Dying fire */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >
              <DyingFireSVG
                primary={colors.primary}
                secondary={colors.secondary}
                fadeRatio={fadeRatio}
                size={120}
              />
            </motion.div>

            {/* Slot machine counter */}
            <div className="flex items-end gap-1">
              <motion.span
                style={{ color: currentColor, textShadow: `0 0 16px ${currentColor}` }}
                className="text-5xl font-black leading-none pb-3"
              >
                ×
              </motion.span>
              <SlotNumber value={current} color={currentColor} />
            </div>

            {/* Status label */}
            <AnimatePresence mode="wait">
              {phase === "counting" ? (
                <motion.span
                  key="counting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-base font-semibold tracking-wide"
                  style={{ color: currentColor }}
                >
                  {t("streak.breakLosing")}
                </motion.span>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20 }}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-2xl font-black text-white/90">
                    {t("streak.breakLostTitle")}
                  </span>
                  <span className="text-sm text-white/40">
                    {t("streak.breakLostSub", { count: fromStreak })}
                  </span>
                  <span className="text-xs text-white/25 mt-1">
                    {t("streak.tapToContinue")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
