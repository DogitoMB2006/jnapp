import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Coins, Dices, Flame, Vault, ArrowLeft } from "lucide-react"
import { useAuthStore } from "../../../store/authStore"
import { useStoreStore } from "../../../store/storeStore"
import { useHeistStore, isHeistActive } from "../../../store/heistStore"
import { useNavigationStore } from "../../../store/navigationStore"
import { notifyPartnerHeist } from "../../../lib/notifyPartner"
import { lightHaptic } from "../../../lib/mobileHaptics"
import { HeistLobby } from "./heist/HeistLobby"
import { HeistArena } from "./heist/HeistArena"

type JuegosView = "hub" | "heist"

export function JuegosPage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const coins = useStoreStore((s) => s.coins)
  const activeHeist = useHeistStore((s) => s.activeHeist)
  const lastResult = useHeistStore((s) => s.lastResult)
  const fetchSession = useHeistStore((s) => s.fetchSession)
  const pendingItemId = useNavigationStore((s) => s.pendingItemId)
  const clearPendingItemId = useNavigationStore((s) => s.clearPendingItemId)

  const [view, setView] = useState<JuegosView>("hub")
  const notifiedResultRef = useRef<string | null>(null)

  // Deep-link / notification tap → jump straight into the heist view
  useEffect(() => {
    if (!pendingItemId) return
    void fetchSession(pendingItemId)
    setView("heist")
    clearPendingItemId()
  }, [pendingItemId, fetchSession, clearPendingItemId])

  // Incoming raid while on the hub → surface the heist view automatically
  useEffect(() => {
    if (isHeistActive(activeHeist) && user && activeHeist.partner_id === user.id) {
      setView("heist")
    }
  }, [activeHeist, user])

  // The partner who completes stage two sends one offline-safe result push.
  useEffect(() => {
    if (!lastResult?.settledLocally || !user) return
    if (notifiedResultRef.current === lastResult.heist.id) return
    notifiedResultRef.current = lastResult.heist.id
    void notifyPartnerHeist({
      actorUserId: user.id,
      event: lastResult.success ? "heist_completed" : "heist_expired",
      heistId: lastResult.heist.id,
      rewardCoins: lastResult.success ? lastResult.heist.reward_coins : undefined,
    })
  }, [lastResult, user])

  const handleOpenHeist = () => {
    lightHaptic()
    setView("heist")
  }

  const handleBackToHub = () => {
    lightHaptic()
    setView("hub")
  }

  return (
    <div className="flex flex-col gap-4 pb-6 sm:gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {view === "heist" && (
              <button
                type="button"
                onClick={handleBackToHub}
                aria-label={t("juegos.heist.playAgain")}
                className="btn btn-ghost btn-sm btn-square rounded-xl -ml-1.5"
              >
                <ArrowLeft size={19} />
              </button>
            )}
            <h2 className="text-lg font-bold truncate">
              {view === "heist" ? t("juegos.heist.lobbyTitle") : t("juegos.title")}
            </h2>
          </div>
          {view === "hub" && (
            <p className="text-xs text-base-content/50 mt-0.5">{t("juegos.subtitle")}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning/10 px-3 py-1.5 shrink-0">
          <Coins size={15} className="text-warning" aria-hidden />
          <span className="text-sm font-bold tabular-nums text-warning">{coins}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "hub" ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="grid grid-cols-2 gap-3"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={handleOpenHeist}
              aria-label={t("juegos.heist.title")}
              className="relative aspect-square rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-base-200 to-base-200 p-4 flex flex-col items-start justify-between text-left overflow-hidden"
            >
              {isHeistActive(activeHeist) && (
                <span className="absolute top-3 right-3 flex h-2.5 w-2.5" aria-hidden>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                </span>
              )}
              <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                <Vault size={22} className="text-primary" aria-hidden />
              </div>
              <div>
                <p className="font-bold text-sm">{t("juegos.heist.title")}</p>
                <p className="text-[11px] leading-tight text-base-content/50 mt-0.5">
                  {isHeistActive(activeHeist)
                    ? t("juegos.heist.activeRaid")
                    : t("juegos.heist.blurb")}
                </p>
              </div>
            </motion.button>

            <div
              className="aspect-square rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col items-start justify-between opacity-50"
              aria-hidden
            >
              <div className="w-11 h-11 rounded-xl bg-base-300/60 flex items-center justify-center">
                <Dices size={22} className="text-base-content/40" />
              </div>
              <div>
                <p className="font-bold text-sm text-base-content/60">Roulette</p>
                <p className="text-[11px] text-base-content/35 mt-0.5">{t("juegos.comingSoon")}</p>
              </div>
            </div>

            <div
              className="aspect-square rounded-2xl border border-base-300 bg-base-200/50 p-4 flex flex-col items-start justify-between opacity-50"
              aria-hidden
            >
              <div className="w-11 h-11 rounded-xl bg-base-300/60 flex items-center justify-center">
                <Flame size={22} className="text-base-content/40" />
              </div>
              <div>
                <p className="font-bold text-sm text-base-content/60">Hot Potato</p>
                <p className="text-[11px] text-base-content/35 mt-0.5">{t("juegos.comingSoon")}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="heist"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            {isHeistActive(activeHeist) ? <HeistArena /> : <HeistLobby />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
