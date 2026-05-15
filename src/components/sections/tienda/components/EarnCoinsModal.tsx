import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, CheckCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import {
  watchRewardedAd,
  preloadAd,
  getAdViewsToday,
  adsAvailable,
  AD_COINS,
  MAX_ADS_PER_DAY,
} from "../../../../lib/admob"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"

interface EarnCoinsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export function EarnCoinsModal({ isOpen, onClose, userId }: EarnCoinsModalProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { group } = useGroupStore()
  const { earnCoins } = useStoreStore()

  const [watching, setWatching] = useState(false)
  const [viewsToday, setViewsToday] = useState(() => getAdViewsToday(userId))

  const remaining = MAX_ADS_PER_DAY - viewsToday
  const canWatch = adsAvailable(userId)

  async function handleWatchAd() {
    if (!group || watching || !canWatch) return
    setWatching(true)
    try {
      await watchRewardedAd(userId)
      await earnCoins(group.id, AD_COINS)
      const newViews = getAdViewsToday(userId)
      setViewsToday(newViews)
      toast.success(
        lang === "en" ? `+${AD_COINS} coins earned!` : `+${AD_COINS} monedas ganadas!`,
        { icon: "🪙" }
      )
      // Preload next ad
      preloadAd()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "ad_not_ready") {
        toast(
          lang === "en" ? "Ad not ready, try again in a moment" : "Anuncio no listo, intenta en un momento",
          { icon: "⏳" }
        )
      } else if (msg !== "daily_limit_reached") {
        toast.error(lang === "en" ? "Ad failed, try again" : "Error con el anuncio, intenta de nuevo")
      }
    } finally {
      setWatching(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-base-200 border-t border-base-300 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base-content text-lg">
                  {lang === "en" ? "Earn Coins" : "Ganar Monedas"}
                </h3>
                <p className="text-xs text-base-content/40 mt-0.5">
                  {lang === "en"
                    ? `Watch a short ad to earn ${AD_COINS} coins`
                    : `Mira un anuncio corto y gana ${AD_COINS} monedas`}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {Array.from({ length: MAX_ADS_PER_DAY }).map((_, i) => {
                const watched = i < viewsToday
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        watched
                          ? "bg-warning/20 border border-warning/40"
                          : "bg-base-300 border border-base-300"
                      }`}
                    >
                      {watched ? (
                        <CheckCircle size={20} className="text-warning" />
                      ) : (
                        <span className="text-xs font-bold text-base-content/30">
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-base-content/30 font-medium">
                      {watched ? `+${AD_COINS}` : `🪙${AD_COINS}`}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Remaining label */}
            <p className="text-center text-sm text-base-content/50 mb-5">
              {remaining > 0
                ? lang === "en"
                  ? `${remaining} ad${remaining > 1 ? "s" : ""} remaining today`
                  : `${remaining} anuncio${remaining > 1 ? "s" : ""} disponible${remaining > 1 ? "s" : ""} hoy`
                : lang === "en"
                  ? "You've watched all ads for today. Come back tomorrow!"
                  : "Ya viste todos los anuncios de hoy. ¡Vuelve mañana!"}
            </p>

            {/* Watch button */}
            <button
              type="button"
              onClick={handleWatchAd}
              disabled={!canWatch || watching}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-default"
              style={{
                background: canWatch
                  ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                  : undefined,
                color: canWatch ? "#1a1000" : undefined,
              }}
            >
              {watching ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Play size={16} strokeWidth={2.5} fill="currentColor" />
              )}
              {watching
                ? lang === "en" ? "Loading..." : "Cargando..."
                : canWatch
                  ? lang === "en"
                    ? `Watch Ad · +${AD_COINS} coins`
                    : `Ver anuncio · +${AD_COINS} monedas`
                  : lang === "en"
                    ? "Come back tomorrow"
                    : "Vuelve mañana"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
