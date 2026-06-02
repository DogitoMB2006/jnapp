import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Play, CheckCircle, Gem, Clock } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import {
  watchDiamondAd,
  getDiamondAdViewsRecent,
  getDiamondAdCooldownMs,
  hasDiamondAdSlots,
  DIAMOND_AD_LIMIT,
  DIAMOND_PER_AD,
  preloadDiamondAd,
} from "../../../../lib/diamonds"
import { formatAdError, isRewardedAdsSupported } from "../../../../lib/admobBridge"
import { isMobileTauri } from "../../../../lib/platform"
import { useRewardedAdReady } from "../../../../hooks/useAdMobBridgeReady"
import { useDiamondStore } from "../../../../store/diamondStore"

interface EarnDiamondsModalProps {
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

export function EarnDiamondsModal({ isOpen, onClose, userId }: EarnDiamondsModalProps) {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { earnDiamonds } = useDiamondStore()

  const [watching, setWatching] = useState(false)
  const [viewsRecent, setViewsRecent] = useState(() => getDiamondAdViewsRecent(userId))
  const [cooldownMs, setCooldownMs] = useState(() => getDiamondAdCooldownMs(userId))
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Refresh countdown every second when at limit
  useEffect(() => {
    if (!isOpen) return
    preloadDiamondAd()
    setViewsRecent(getDiamondAdViewsRecent(userId))
    setCooldownMs(getDiamondAdCooldownMs(userId))

    tickRef.current = setInterval(() => {
      const views = getDiamondAdViewsRecent(userId)
      const cd = getDiamondAdCooldownMs(userId)
      setViewsRecent(views)
      setCooldownMs(cd)
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isOpen, userId])

  const { bridgeReady, adReady, adLoading } = useRewardedAdReady("diamond", isOpen)
  const slotsLeft = hasDiamondAdSlots(userId)
  const canWatch = isMobileTauri && bridgeReady && slotsLeft && adReady

  async function handleWatchAd() {
    if (watching || !isMobileTauri || !bridgeReady || !slotsLeft) return
    setWatching(true)
    try {
      await watchDiamondAd(userId)
      await earnDiamonds(userId, DIAMOND_PER_AD)
      setViewsRecent(getDiamondAdViewsRecent(userId))
      setCooldownMs(getDiamondAdCooldownMs(userId))
      toast.success(
        lang === "en"
          ? `+${DIAMOND_PER_AD} diamond earned`
          : `+${DIAMOND_PER_AD} diamante ganado`
      )
      preloadDiamondAd()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "not_available") {
        toast(
          lang === "en"
            ? "Ads are only available in the Android app"
            : "Los anuncios solo están en la app de Android",
        )
      } else if (msg !== "limit_reached") {
        toast.error(formatAdError(msg, lang))
      }
      preloadDiamondAd()
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
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-base-200 border-t border-sky-500/15 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-base-content text-lg flex items-center gap-2">
                  <Gem size={18} className="text-sky-400" strokeWidth={2.5} />
                  {lang === "en" ? "Earn Diamonds" : "Ganar Diamantes"}
                </h3>
                <p className="text-xs text-base-content/40 mt-0.5">
                  {lang === "en"
                    ? `Watch ads to earn diamonds · resets every 3h`
                    : `Mira anuncios para ganar diamantes · se reinicia cada 3h`}
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

            {/* Slot dots */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {Array.from({ length: DIAMOND_AD_LIMIT }).map((_, i) => {
                const watched = i < viewsRecent
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                        watched
                          ? "bg-sky-500/15 border border-sky-500/30"
                          : "bg-base-300 border border-base-300"
                      }`}
                    >
                      {watched ? (
                        <CheckCircle size={22} className="text-sky-400" />
                      ) : (
                        <span className="text-xs font-bold text-base-content/30">{i + 1}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-base-content/30">
                      {watched ? `+${DIAMOND_PER_AD}` : DIAMOND_PER_AD}
                      <Gem size={9} strokeWidth={2.5} aria-hidden />
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Status text */}
            <p className="text-center text-sm text-base-content/50 mb-5">
              {viewsRecent < DIAMOND_AD_LIMIT ? (
                lang === "en"
                  ? `${DIAMOND_AD_LIMIT - viewsRecent} ad${DIAMOND_AD_LIMIT - viewsRecent > 1 ? "s" : ""} remaining this window`
                  : `${DIAMOND_AD_LIMIT - viewsRecent} anuncio${DIAMOND_AD_LIMIT - viewsRecent > 1 ? "s" : ""} restante${DIAMOND_AD_LIMIT - viewsRecent > 1 ? "s" : ""} esta ventana`
              ) : cooldownMs > 0 ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Clock size={13} className="text-sky-400/60" />
                  {lang === "en"
                    ? `Resets in ${formatMs(cooldownMs)}`
                    : `Se reinicia en ${formatMs(cooldownMs)}`}
                </span>
              ) : (
                lang === "en" ? "Slots refreshed! Watch another ad." : "¡Espacios disponibles! Mira otro anuncio."
              )}
            </p>

            {/* Watch button */}
            <button
              type="button"
              onClick={handleWatchAd}
              disabled={!canWatch || watching}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-default"
              style={{
                background: canWatch
                  ? "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)"
                  : undefined,
                color: canWatch ? "#0c1a2e" : undefined,
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
                    ? `Watch Ad · +${DIAMOND_PER_AD} diamond`
                    : `Ver anuncio · +${DIAMOND_PER_AD} diamante`
                  : !isRewardedAdsSupported()
                    ? lang === "en"
                      ? "Android app only"
                      : "Solo app Android"
                    : !bridgeReady
                      ? lang === "en"
                        ? "Preparing ads…"
                        : "Preparando anuncios…"
                      : adLoading || !adReady
                        ? lang === "en"
                          ? "Loading ad from Google…"
                          : "Cargando anuncio de Google…"
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
