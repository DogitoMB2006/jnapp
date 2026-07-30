import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Coins, LockKeyhole, ShieldAlert, Sparkles, Star, Vault } from "lucide-react"
import { useAuthStore } from "../../../../store/authStore"
import { useGroupStore } from "../../../../store/groupStore"
import { HEIST_XP_PER_LEVEL, rewardForLevel, useHeistStore } from "../../../../store/heistStore"
import { notifyPartnerHeist } from "../../../../lib/notifyPartner"
import { lightHaptic } from "../../../../lib/mobileHaptics"

export function HeistLobby() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const group = useGroupStore((state) => state.group)
  const partnerId = useGroupStore((state) => state.partnerId)
  const progression = useHeistStore((state) => state.progression)
  const startHeist = useHeistStore((state) => state.startHeist)
  const [starting, setStarting] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const level = progression?.level ?? 1
  const xpInLevel = (progression?.total_xp ?? 0) % HEIST_XP_PER_LEVEL
  const reward = rewardForLevel(level)
  const cooldownMs = Math.max(0, new Date(progression?.cooldown_until ?? 0).getTime() - now)
  const cooldownSeconds = Math.ceil(cooldownMs / 1000)
  const canStart = !!user && !!group && !!partnerId && cooldownMs <= 0 && !starting

  const handleStart = async () => {
    if (!user || !group || !partnerId) {
      setErrorKey("juegos.heist.noPartner")
      return
    }
    setErrorKey(null)
    setStarting(true)
    lightHaptic()
    try {
      const heist = await startHeist(group.id)
      void notifyPartnerHeist({
        actorUserId: user.id,
        event: "heist_started",
        heistId: heist.id,
        level: heist.level,
      })
    } catch (error) {
      const code = error instanceof Error ? error.message : ""
      setErrorKey(code === "heist_cooldown"
        ? "juegos.heist.cooldown"
        : code === "heist_in_progress"
          ? "juegos.heist.activeRaid"
          : code === "heist_partner_required"
            ? "juegos.heist.noPartner"
            : "juegos.heist.startFailed")
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/20 via-base-200 to-secondary/10 p-5">
        <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl" aria-hidden />
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ rotate: [0, -4, 4, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.5 }}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <Vault size={32} aria-hidden />
          </motion.div>
          <div className="min-w-0 text-left">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Star size={14} fill="currentColor" aria-hidden />
              {t("juegos.heist.level", { level })}
            </div>
            <p className="text-sm leading-relaxed text-base-content/65">{t("juegos.heist.lobbyDesc")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-base-content/60">{t("juegos.heist.sharedProgress")}</span>
          <span className="font-bold tabular-nums text-primary">{xpInLevel}/{HEIST_XP_PER_LEVEL} XP</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-base-300/70">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
            animate={{ width: `${xpInLevel}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-warning">
            <Coins size={17} aria-hidden />
            <span className="text-xs font-bold">+{reward.coins} {t("juegos.heist.coins")}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary/10 px-3 py-2.5 text-secondary">
            <Sparkles size={17} aria-hidden />
            <span className="text-xs font-bold">+{reward.xp} XP</span>
          </div>
        </div>
      </div>

      {errorKey && (
        <div className="flex items-center gap-2 rounded-xl border border-error/25 bg-error/10 px-3.5 py-2.5 text-sm text-error" role="alert">
          <ShieldAlert size={16} className="shrink-0" aria-hidden />
          {t(errorKey)}
        </div>
      )}

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={!canStart}
        onClick={handleStart}
        className="btn btn-primary min-h-12 w-full rounded-xl text-base font-bold disabled:opacity-40"
      >
        {starting ? <span className="loading loading-spinner loading-sm" aria-hidden /> : (
          <>
            {cooldownMs > 0 ? <LockKeyhole size={19} aria-hidden /> : <Vault size={19} aria-hidden />}
            {cooldownMs > 0
              ? t("juegos.heist.cooldownTimer", { seconds: cooldownSeconds })
              : t("juegos.heist.startRaid")}
          </>
        )}
      </motion.button>

      <p className="text-center text-[11px] text-base-content/40">{t("juegos.heist.noEntryCost")}</p>
    </div>
  )
}
