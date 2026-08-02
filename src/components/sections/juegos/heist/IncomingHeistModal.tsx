import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { LogIn, Timer, Vault, X } from "lucide-react"
import { useAuthStore } from "../../../../store/authStore"
import { useHeistStore, isHeistActive } from "../../../../store/heistStore"
import { useNavigationStore } from "../../../../store/navigationStore"
import { lightHaptic } from "../../../../lib/mobileHaptics"
import type { Section } from "../../../../types"

const secondsRemaining = (expiresAt: string) =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))

export function IncomingHeistModal({ currentSection }: { currentSection: Section }) {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const heist = useHeistStore((state) => state.activeHeist)
  const navigateTo = useNavigationStore((state) => state.navigateTo)
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(() => heist ? secondsRemaining(heist.expires_at) : 0)

  const isIncoming = isHeistActive(heist)
    && !!user
    && heist.partner_id === user.id
    && !heist.partner_joined_at
    && dismissedId !== heist.id
    && currentSection !== "juegos"

  useEffect(() => {
    if (!isIncoming || !heist) return
    lightHaptic()
    setSeconds(secondsRemaining(heist.expires_at))
    const interval = window.setInterval(() => setSeconds(secondsRemaining(heist.expires_at)), 250)
    return () => window.clearInterval(interval)
  }, [isIncoming, heist?.id, heist?.expires_at])

  if (!isIncoming || !heist || seconds <= 0) return null

  const dismiss = () => {
    lightHaptic()
    setDismissedId(heist.id)
  }

  const openHeist = () => {
    lightHaptic()
    setDismissedId(heist.id)
    navigateTo("juegos", heist.id)
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        key={`incoming-heist-${heist.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={t("juegos.heist.incomingAlert.title")}
      >
        <motion.div
          initial={{ scale: 0.82, y: 28, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 330, damping: 25 }}
          className="relative flex w-full max-w-sm flex-col items-center gap-4 overflow-hidden rounded-3xl border border-error/25 bg-base-200 p-6 text-center shadow-2xl"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-error via-warning to-error" aria-hidden />
          <button
            type="button"
            onClick={dismiss}
            className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3 text-base-content/50"
            aria-label={t("juegos.heist.incomingAlert.later")}
          >
            <X size={17} aria-hidden />
          </button>

          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
            transition={{ duration: 1.1, repeat: Infinity }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-error/15 text-error"
          >
            <Vault size={40} aria-hidden />
          </motion.div>

          <div>
            <h3 className="text-xl font-black">{t("juegos.heist.incomingAlert.title")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-base-content/60">
              {t("juegos.heist.incomingAlert.message")}
            </p>
          </div>

          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${seconds <= 10 ? "border-error/30 bg-error/10 text-error" : "border-warning/30 bg-warning/10 text-warning"}`}>
            <Timer size={17} aria-hidden />
            <span className="font-black tabular-nums">{t("juegos.heist.incomingAlert.seconds", { seconds })}</span>
          </div>

          <button
            type="button"
            onClick={openHeist}
            autoFocus
            className="btn btn-error min-h-12 w-full rounded-xl text-base font-black"
          >
            <LogIn size={19} aria-hidden />
            {t("juegos.heist.incomingAlert.join")}
          </button>
          <button type="button" onClick={dismiss} className="btn btn-ghost btn-sm text-base-content/50">
            {t("juegos.heist.incomingAlert.later")}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}
