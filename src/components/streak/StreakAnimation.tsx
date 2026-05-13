import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { getStreakTier, STREAK_TIER_COLORS } from "../../lib/streak"

interface Props {
  streak: number
  visible: boolean
  onDismiss: () => void
}

// Animated SVG fire that doesn't use emoji
function FireSVG({
  primary,
  secondary,
  accent,
  glow,
  size = 140,
}: {
  primary: string
  secondary: string
  accent: string
  glow: string
  size?: number
}) {
  const id = `fg-${primary.replace("#", "")}`
  return (
    <div
      style={{
        filter: `drop-shadow(0 0 28px ${glow}) drop-shadow(0 0 56px ${glow})`,
      }}
    >
      <svg
        width={size}
        height={size * 1.35}
        viewBox="0 0 100 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-outer`} x1="50" y1="130" x2="50" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={accent} />
            <stop offset="35%" stopColor={secondary} />
            <stop offset="100%" stopColor={primary} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${id}-mid`} x1="50" y1="110" x2="50" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFEC40" />
            <stop offset="40%" stopColor={secondary} />
            <stop offset="100%" stopColor={primary} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`${id}-inner`} x1="50" y1="100" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="60%" stopColor={accent} />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id={`${id}-core`} cx="50%" cy="75%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer flame */}
        <motion.path
          d="M50 128C24 128 8 112 8 90C8 68 22 54 32 42C26 58 34 68 42 74C34 58 38 40 46 26C42 40 50 52 58 60C64 48 62 30 54 16C72 32 92 56 92 90C92 112 76 128 50 128Z"
          fill={`url(#${id}-outer)`}
          animate={{
            d: [
              "M50 128C24 128 8 112 8 90C8 68 22 54 32 42C26 58 34 68 42 74C34 58 38 40 46 26C42 40 50 52 58 60C64 48 62 30 54 16C72 32 92 56 92 90C92 112 76 128 50 128Z",
              "M50 128C26 128 8 110 8 90C8 68 24 56 30 44C28 60 36 70 44 72C36 56 40 38 48 24C44 38 52 50 60 58C66 46 63 28 56 14C74 30 92 56 92 90C92 112 74 128 50 128Z",
              "M50 128C22 128 8 113 8 90C8 68 20 52 34 40C28 56 36 66 44 72C36 58 40 42 46 28C42 42 50 54 57 63C63 50 62 32 53 18C70 34 92 58 92 90C92 112 76 128 50 128Z",
              "M50 128C24 128 8 112 8 90C8 68 22 54 32 42C26 58 34 68 42 74C34 58 38 40 46 26C42 40 50 52 58 60C64 48 62 30 54 16C72 32 92 56 92 90C92 112 76 128 50 128Z",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Middle flame */}
        <motion.path
          d="M50 112C32 112 20 100 20 84C20 68 30 60 36 52C34 62 40 70 46 74C40 62 42 50 46 40C44 50 52 58 58 64C62 56 60 44 56 34C66 44 80 62 80 84C80 100 68 112 50 112Z"
          fill={`url(#${id}-mid)`}
          animate={{
            d: [
              "M50 112C32 112 20 100 20 84C20 68 30 60 36 52C34 62 40 70 46 74C40 62 42 50 46 40C44 50 52 58 58 64C62 56 60 44 56 34C66 44 80 62 80 84C80 100 68 112 50 112Z",
              "M50 112C30 112 20 102 20 84C20 66 32 58 38 50C36 62 42 70 48 72C42 62 44 48 48 38C46 50 54 60 60 66C64 56 62 42 58 32C68 42 80 60 80 84C80 102 68 112 50 112Z",
              "M50 112C34 112 20 98 20 84C20 70 28 62 34 54C32 64 38 72 44 76C38 64 40 52 44 42C42 52 50 60 56 66C60 58 58 46 54 36C64 46 80 64 80 84C80 100 66 112 50 112Z",
              "M50 112C32 112 20 100 20 84C20 68 30 60 36 52C34 62 40 70 46 74C40 62 42 50 46 40C44 50 52 58 58 64C62 56 60 44 56 34C66 44 80 62 80 84C80 100 68 112 50 112Z",
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
        />

        {/* Inner hot core */}
        <motion.ellipse
          cx="50"
          cy="94"
          rx="14"
          ry="20"
          fill={`url(#${id}-inner)`}
          animate={{ rx: [14, 12, 15, 14], ry: [20, 22, 19, 20], cy: [94, 93, 95, 94] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.05 }}
        />

        {/* White hot center glow */}
        <motion.ellipse
          cx="50"
          cy="98"
          rx="7"
          ry="10"
          fill={`url(#${id}-core)`}
          animate={{ rx: [7, 6, 8, 7], ry: [10, 11, 9, 10] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  )
}

function Particle({ color, glow }: { color: string; glow: string }) {
  const angle = Math.random() * 360
  const distance = 80 + Math.random() * 120
  const size = 3 + Math.random() * 5
  const delay = Math.random() * 0.8
  const duration = 0.8 + Math.random() * 0.8

  const x = Math.cos((angle * Math.PI) / 180) * distance
  const y = Math.sin((angle * Math.PI) / 180) * distance - distance * 0.3

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x, y, scale: 0 }}
      transition={{ delay, duration, ease: "easeOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size * 2}px ${glow}`,
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
    />
  )
}

function CountUp({ target, color }: { target: number; color: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target <= 1) {
      setCount(1)
      return
    }
    const start = Math.max(1, target - Math.min(target - 1, 8))
    setCount(start)
    let current = start
    const step = () => {
      current++
      setCount(current)
      if (current < target) {
        const delay = current < target - 2 ? 60 : 120
        setTimeout(step, delay)
      }
    }
    const timer = setTimeout(step, 300)
    return () => clearTimeout(timer)
  }, [target])

  return (
    <motion.span
      key={count}
      initial={{ scale: count === target ? 1.35 : 1.1, opacity: 0.7 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      style={{ color, textShadow: `0 0 32px ${color}` }}
      className="text-8xl font-black tabular-nums leading-none"
    >
      {count}
    </motion.span>
  )
}

export function StreakAnimation({ streak, visible, onDismiss }: Props) {
  const { t } = useTranslation()
  const tier = getStreakTier(streak)
  const colors = STREAK_TIER_COLORS[tier]
  const [particles] = useState(() => Array.from({ length: 18 }, (_, i) => i))

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(handleDismiss, 4000)
    return () => clearTimeout(timer)
  }, [visible, handleDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={handleDismiss}
          className="fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer"
          style={{
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.97) 100%)",
          }}
        >
          {/* Background glow pulse */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.28, 0.15],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            }}
          />

          {/* Main content */}
          <div className="relative flex flex-col items-center gap-5 select-none">
            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {particles.map((i) => (
                <Particle key={i} color={colors.secondary} glow={colors.glow} />
              ))}
            </div>

            {/* Fire */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
            >
              <FireSVG
                primary={colors.primary}
                secondary={colors.secondary}
                accent={colors.accent}
                glow={colors.glow}
                size={140}
              />
            </motion.div>

            {/* x{N} counter */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.2 }}
              className="flex items-end gap-1"
            >
              <motion.span
                style={{ color: colors.secondary, textShadow: `0 0 20px ${colors.glow}` }}
                className="text-5xl font-black leading-none pb-2"
              >
                ×
              </motion.span>
              <CountUp target={streak} color={colors.primary} />
            </motion.div>

            {/* Label */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="text-xl font-bold tracking-wide"
                style={{ color: colors.accent }}
              >
                {streak === 1
                  ? t("streak.animationStarted")
                  : t("streak.animationDays", { count: streak })}
              </span>
              <span className="text-white/40 text-sm">
                {t("streak.tapToContinue")}
              </span>
            </motion.div>

            {/* Tier label */}
            {streak >= 20 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75 }}
                className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.primary}40`,
                  color: colors.primary,
                }}
              >
                {streak >= 100
                  ? t("streak.tierBadgeLegendary")
                  : streak >= 50
                    ? t("streak.tierBadgeEpic")
                    : t("streak.tierBadgeAmazing")}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
