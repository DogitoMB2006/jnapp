import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, CheckCircle, Coins, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import {
  watchRewardedAd,
  preloadAd,
  getCoinAdViewsRecent,
  getCoinAdCooldownMs,
  hasCoinAdSlots,
  AD_COINS,
  COIN_AD_LIMIT,
} from "../../../../lib/admob"
import { isRewardedAdsSupported } from "../../../../lib/admobBridge"
import { isMobileTauri } from "../../../../lib/platform"
import { useAdMobBridgeReady } from "../../../../hooks/useAdMobBridgeReady"
import { useStoreStore } from "../../../../store/storeStore"
import { useGroupStore } from "../../../../store/groupStore"

interface EarnCoinsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function EarnCoinsModal({ isOpen, onClose, userId }: EarnCoinsModalProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const group = useGroupStore((s) => s.group)
  const { earnCoins } = useStoreStore()

  const [watching, setWatching] = useState(false)
  const [viewsRecent, setViewsRecent] = useState(() => getCoinAdViewsRecent(userId))
  const [cooldownMs, setCooldownMs] = useState(() => getCoinAdCooldownMs(userId))
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setViewsRecent(getCoinAdViewsRecent(userId))
    setCooldownMs(getCoinAdCooldownMs(userId))

    tickRef.current = setInterval(() => {
      setViewsRecent(getCoinAdViewsRecent(userId))
      setCooldownMs(getCoinAdCooldownMs(userId))
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isOpen, userId])

  const bridgeReady = useAdMobBridgeReady(isOpen)
  const slotsLeft = hasCoinAdSlots(userId)
  const canWatch = isMobileTauri && bridgeReady && slotsLeft

  async function handleWatchAd() {
    if (!group || watching || !canWatch) return
    setWatching(true)
    try {
      await watchRewardedAd(userId)
      await earnCoins(group.id, AD_COINS)
      setViewsRecent(getCoinAdViewsRecent(userId))
      setCooldownMs(getCoinAdCooldownMs(userId))
      toast.success(lang === "en" ? `+${AD_COINS} coins earned` : `+${AD_COINS} monedas ganadas`)
      preloadAd()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "ad_not_ready" || msg === "bridge_not_ready") {
        toast(lang === "en" ? "Ad not ready, try again" : "Anuncio no listo, intenta de nuevo")
      } else if (msg === "not_available") {
        toast(
          lang === "en"
            ? "Ads are only available in the Android app"
            : "Los anuncios solo están en la app de Android",
        )
      } else if (msg !== "limit_reached") {
        toast.error(lang === "en" ? "Ad failed, try again" : "Error con el anuncio")
      }
    } finally {
      setWatching(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-base-200 border-t border-warning/20 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="flex items-center justify-between mb-6">
              <motion.div>
                <h3 className="font-bold text-base-content text-lg flex items-center gap-2">
                  <Coins size={18} className="text-warning" strokeWidth={2.5} />
                  {lang === "en" ? "Earn Coins" : "Ganar Monedas"}
                </h3>
                <p className="text-xs text-base-content/40 mt-0.5">
                  {lang === "en"
                    ? `Watch ads to earn coins · resets every 3h`
                    : `Mira anuncios para ganar monedas · se reinicia cada 3h`}
                </p>
              </motion.div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              {Array.from({ length: COIN_AD_LIMIT }).map((_, i) => {
                const watched = i < viewsRecent
                return (
                  <motion.div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        watched
                          ? "bg-warning/15 border border-warning/35"
                          : "bg-base-300 border border-base-300"
                      }`}
                    >
                      {watched ? (
                        <CheckCircle size={22} className="text-warning" />
                      ) : (
                        <span className="text-xs font-bold text-base-content/30">{i + 1}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-base-content/30">
                      {watched ? `+${AD_COINS}` : AD_COINS}
                      <Coins size={9} strokeWidth={2.5} aria-hidden />
                    </span>
                  </motion.div>
                )
              })}
            </div>

            <p className="text-center text-sm text-base-content/50 mb-5">
              {viewsRecent < COIN_AD_LIMIT ? (
                lang === "en"
                  ? `${COIN_AD_LIMIT - viewsRecent} ad${COIN_AD_LIMIT - viewsRecent > 1 ? "s" : ""} remaining this window`
                  : `${COIN_AD_LIMIT - viewsRecent} anuncio${COIN_AD_LIMIT - viewsRecent > 1 ? "s" : ""} restante${COIN_AD_LIMIT - viewsRecent > 1 ? "s" : ""} esta ventana`
              ) : cooldownMs > 0 ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Clock size={13} className="text-warning/70" />
                  {lang === "en"
                    ? `Resets in ${formatMs(cooldownMs)}`
                    : `Se reinicia en ${formatMs(cooldownMs)}`}
                </span>
              ) : (
                lang === "en"
                  ? "Slots refreshed! Watch another ad."
                  : "¡Espacios disponibles! Mira otro anuncio."
              )}
            </p>

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
                ? lang === "en"
                  ? "Loading..."
                  : "Cargando..."
                : canWatch
                  ? lang === "en"
                    ? `Watch Ad · +${AD_COINS} coins`
                    : `Ver anuncio · +${AD_COINS} monedas`
                  : !isRewardedAdsSupported()
                    ? lang === "en"
                      ? "Android app only"
                      : "Solo app Android"
                    : !bridgeReady
                      ? lang === "en"
                        ? "Preparing ads…"
                        : "Preparando anuncios…"
                      : lang === "en"
                        ? "Come back later"
                        : "Vuelve más tarde"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
