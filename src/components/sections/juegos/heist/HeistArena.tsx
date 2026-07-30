import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { ArrowRight, Fingerprint, Hand, LogIn, MousePointer2, Timer, Users, Vault } from "lucide-react"
import { useAuthStore } from "../../../../store/authStore"
import { isHeistActive, useHeistStore } from "../../../../store/heistStore"
import { lightHaptic } from "../../../../lib/mobileHaptics"
import type { HeistInteraction } from "../../../../types"

const remainingTime = (expiresAt: string) => Math.max(0, new Date(expiresAt).getTime() - Date.now())

function InteractionControl({
  interaction,
  goal,
  progress,
  onAction,
}: {
  interaction: HeistInteraction
  goal: number
  progress: number
  onAction: (amount: number) => void
}) {
  const { t } = useTranslation()
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const holdTimer = useRef<number | null>(null)
  const [holding, setHolding] = useState(false)
  const ratio = Math.min(1, progress / goal)

  const stopHold = () => {
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHolding(false)
  }

  useEffect(() => stopHold, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (interaction === "tap") {
      lightHaptic()
      onAction(1)
      return
    }
    if (interaction === "swipe") {
      pointerStart.current = { x: event.clientX, y: event.clientY }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    setHolding(true)
    holdTimer.current = window.setTimeout(() => {
      lightHaptic()
      onAction(goal)
      setHolding(false)
      holdTimer.current = null
    }, goal)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (interaction === "hold") {
      stopHold()
      return
    }
    if (interaction !== "swipe" || !pointerStart.current) return
    const distance = Math.hypot(event.clientX - pointerStart.current.x, event.clientY - pointerStart.current.y)
    pointerStart.current = null
    if (distance >= 55) {
      lightHaptic()
      onAction(1)
    }
  }

  const Icon = interaction === "tap" ? Fingerprint : interaction === "swipe" ? ArrowRight : Hand
  const count = interaction === "hold" ? `${(goal / 1000).toFixed(1)}s` : `${progress}/${goal}`

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="text-base font-bold">{t(`juegos.heist.interactions.${interaction}`)}</p>
      <motion.button
        type="button"
        whileTap={{ scale: interaction === "tap" ? 0.92 : 0.98 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopHold}
        className="relative flex h-56 w-56 touch-none select-none items-center justify-center overflow-hidden rounded-[2.5rem] border-4 border-primary/30 bg-gradient-to-br from-primary/20 to-base-200"
        aria-label={t(`juegos.heist.interactions.${interaction}`)}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 bg-primary/20"
          animate={{ height: holding ? "100%" : `${ratio * 100}%` }}
          transition={holding ? { duration: goal / 1000, ease: "linear" } : { type: "spring", stiffness: 200, damping: 26 }}
        />
        <div className="relative flex flex-col items-center gap-2 pointer-events-none">
          <Icon size={42} className="text-primary" aria-hidden />
          <span className="text-2xl font-black tabular-nums">{count}</span>
          {interaction === "swipe" && <MousePointer2 size={17} className="text-base-content/45" aria-hidden />}
        </div>
      </motion.button>
      <p className="text-xs text-base-content/45">{t(`juegos.heist.interactionHelp.${interaction}`)}</p>
    </div>
  )
}

export function HeistArena() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const heist = useHeistStore((state) => state.activeHeist)
  const localProgress = useHeistStore((state) => state.localProgress)
  const joinHeist = useHeistStore((state) => state.joinHeist)
  const registerAction = useHeistStore((state) => state.registerAction)
  const expireHeist = useHeistStore((state) => state.expireHeist)
  const [remainingMs, setRemainingMs] = useState(() => heist ? remainingTime(heist.expires_at) : 0)
  const [joining, setJoining] = useState(false)
  const [joinFailed, setJoinFailed] = useState(false)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!isHeistActive(heist)) return
    expiredRef.current = false
    const update = () => {
      const next = remainingTime(heist.expires_at)
      setRemainingMs(next)
      if (next <= 0 && !expiredRef.current) {
        expiredRef.current = true
        void expireHeist(heist.id)
      }
    }
    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [heist, expireHeist])

  if (!isHeistActive(heist) || !user) return null

  const isStarter = heist.starter_id === user.id
  const isPartner = heist.partner_id === user.id
  const joined = !!heist.partner_joined_at
  const myTurn = (isStarter && heist.status === "starter_turn") || (isPartner && heist.status === "partner_turn")
  const interaction = isStarter ? heist.starter_interaction : heist.partner_interaction
  const goal = isStarter ? heist.starter_goal : heist.partner_goal
  const serverProgress = isStarter ? heist.starter_progress : heist.partner_progress
  const progress = myTurn ? Math.max(serverProgress, localProgress) : serverProgress
  const seconds = Math.ceil(remainingMs / 1000)

  const handleJoin = async () => {
    setJoining(true)
    setJoinFailed(false)
    lightHaptic()
    try {
      await joinHeist(heist.id)
    } catch {
      setJoinFailed(true)
    } finally {
      setJoining(false)
    }
  }

  let waitingKey = "juegos.heist.waitingPartner"
  if (isPartner && joined && heist.status === "starter_turn") waitingKey = "juegos.heist.waitingStarter"
  if (isStarter && heist.status === "partner_turn") waitingKey = "juegos.heist.partnerPlaying"
  if (isStarter && heist.status === "partner_waiting") waitingKey = "juegos.heist.waitingPartner"

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200/60 px-4 py-3">
        <div className="flex items-center gap-2 text-primary">
          <Users size={17} aria-hidden />
          <span className="text-xs font-bold">{t("juegos.heist.level", { level: heist.level })}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${seconds <= 10 ? "text-error" : "text-base-content/65"}`}>
          <Timer size={16} aria-hidden />
          <span className="text-sm font-black tabular-nums">{t("juegos.heist.timeLeft", { seconds })}</span>
        </div>
      </div>

      {isPartner && !joined ? (
        <div className="flex w-full flex-col items-center gap-4 py-6">
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-error/15 text-error"
          >
            <Vault size={44} aria-hidden />
          </motion.div>
          <div>
            <p className="font-black">{t("juegos.heist.incomingRaid")}</p>
            <p className="mt-1 text-xs text-base-content/50">{t("juegos.heist.joinDescription")}</p>
          </div>
          <button
            type="button"
            disabled={joining}
            onClick={handleJoin}
            className="btn btn-error min-h-12 w-full max-w-xs rounded-xl font-bold"
          >
            {joining ? <span className="loading loading-spinner loading-sm" /> : <LogIn size={19} aria-hidden />}
            {t("juegos.heist.joinNow")}
          </button>
          {joinFailed && <p className="text-xs font-semibold text-error" role="alert">{t("juegos.heist.joinFailed")}</p>}
        </div>
      ) : myTurn ? (
        <InteractionControl interaction={interaction} goal={goal} progress={progress} onAction={(amount) => void registerAction(amount)} />
      ) : (
        <div className="flex w-full flex-col items-center gap-4 py-8">
          <motion.div
            animate={{ rotate: [0, -4, 4, -2, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/15 text-primary"
          >
            <Vault size={44} aria-hidden />
          </motion.div>
          <p className="font-bold">{t(waitingKey)}</p>
          <p className="text-xs text-base-content/45">{t("juegos.heist.liveProgress")}</p>
          {heist.status === "partner_turn" && (
            <div className="w-full max-w-xs">
              <div className="mb-1.5 flex justify-between text-[11px] text-base-content/45">
                <span>{t(`juegos.heist.interactions.${heist.partner_interaction}`)}</span>
                <span>{heist.partner_progress}/{heist.partner_goal}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-base-300/70">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${Math.min(100, heist.partner_progress / heist.partner_goal * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
