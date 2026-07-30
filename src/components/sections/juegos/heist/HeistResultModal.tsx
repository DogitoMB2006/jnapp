import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Coins, PartyPopper, Sparkles, TimerOff, Trophy } from "lucide-react"
import { useHeistStore } from "../../../../store/heistStore"
import { lightHaptic } from "../../../../lib/mobileHaptics"

export function HeistResultModal() {
  const { t } = useTranslation()
  const result = useHeistStore((state) => state.lastResult)
  const clearResult = useHeistStore((state) => state.clearResult)

  if (!result) return null
  const { heist, success, leveledUp } = result
  const Icon = success ? PartyPopper : TimerOff

  const close = () => {
    lightHaptic()
    clearResult()
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="heist-result"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-6 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={t(success ? "juegos.heist.coopWon" : "juegos.heist.expired")}
        onClick={close}
      >
        <motion.div
          initial={{ scale: 0.82, y: 26, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 25 }}
          className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-base-300 bg-base-200 p-6 text-center"
          onClick={(event) => event.stopPropagation()}
        >
          <motion.div
            initial={{ rotate: -12, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            className={`flex h-20 w-20 items-center justify-center rounded-3xl ${success ? "bg-success/15 text-success" : "bg-error/15 text-error"}`}
          >
            <Icon size={42} aria-hidden />
          </motion.div>
          <div>
            <h3 className="text-xl font-black">{t(success ? "juegos.heist.coopWon" : "juegos.heist.expired")}</h3>
            <p className="mt-1 text-sm text-base-content/55">{t(success ? "juegos.heist.coopWonDesc" : "juegos.heist.expiredDesc")}</p>
          </div>

          {success && (
            <div className="grid w-full grid-cols-2 gap-2.5">
              <div className="flex items-center justify-center gap-2 rounded-xl bg-warning/10 px-3 py-3 text-warning">
                <Coins size={17} aria-hidden />
                <span className="text-sm font-bold">+{heist.reward_coins}</span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary/10 px-3 py-3 text-secondary">
                <Sparkles size={17} aria-hidden />
                <span className="text-sm font-bold">+{heist.reward_xp} XP</span>
              </div>
            </div>
          )}

          {leveledUp && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-primary"
            >
              <Trophy size={17} aria-hidden />
              <span className="text-sm font-black">{t("juegos.heist.levelUp", { level: heist.level + 1 })}</span>
            </motion.div>
          )}

          <button type="button" onClick={close} className="btn btn-primary min-h-11 w-full rounded-xl font-bold">
            {t("juegos.heist.playAgain")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
