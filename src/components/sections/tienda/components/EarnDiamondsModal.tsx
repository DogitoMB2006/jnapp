import { motion, AnimatePresence } from "framer-motion"
import { X, Gem, Sparkles, Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import { DIAMOND_PACKS, DIAMONDS_IAP_ENABLED, type DiamondPack } from "../../../../lib/diamonds"

interface EarnDiamondsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
}

/**
 * Diamond shop shell. Packs are display-only until Play Billing is wired.
 * Ads never grant diamonds.
 */
export function EarnDiamondsModal({ isOpen, onClose }: EarnDiamondsModalProps) {
  const { t } = useTranslation()

  const handleSelectPack = (_pack: DiamondPack) => {
    if (!DIAMONDS_IAP_ENABLED) {
      toast(t("store.diamondsShop.comingSoonToast"))
      return
    }
    // TODO: launch Google Play Billing for pack.productId
    // On success, a server-side receipt verifier credits the balance.
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
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="diamonds-shop-title"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-base-200 border-t border-sky-500/15 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3
                  id="diamonds-shop-title"
                  className="font-bold text-base-content text-lg flex items-center gap-2"
                >
                  <Gem size={18} className="text-sky-400 shrink-0" strokeWidth={2.5} aria-hidden />
                  {t("store.diamondsShop.title")}
                </h3>
                <p className="text-xs text-base-content/45 mt-1 leading-relaxed">
                  {t("store.diamondsShop.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-square rounded-xl shrink-0"
                aria-label={t("store.diamondsShop.close")}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="mb-4 flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5"
              role="status"
            >
              <Sparkles size={14} className="mt-0.5 shrink-0 text-sky-400" aria-hidden />
              <p className="text-[11px] leading-snug text-base-content/60">
                {t("store.diamondsShop.premiumNote")}
              </p>
            </div>

            <div className="flex flex-col gap-2.5" role="list" aria-label={t("store.diamondsShop.packsLabel")}>
              {DIAMOND_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  role="listitem"
                  onClick={() => handleSelectPack(pack)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/45 ${
                    pack.highlight
                      ? "border-sky-400/40 bg-sky-500/12"
                      : "border-base-300 bg-base-300/30 hover:border-sky-500/25"
                  }`}
                  aria-label={`${pack.amount} ${t("store.diamonds")}, ${pack.displayPrice}`}
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/25 bg-sky-400/10 text-sky-300"
                    aria-hidden
                  >
                    <Gem size={20} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-base-content tabular-nums">
                      {t("store.diamondsShop.packAmount", { count: pack.amount })}
                    </p>
                    {pack.highlight && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400 mt-0.5">
                        {t("store.diamondsShop.bestValue")}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-base-300 bg-base-100/50 px-2.5 py-1.5 text-xs font-bold text-base-content/70">
                    {!DIAMONDS_IAP_ENABLED && <Lock size={11} strokeWidth={2.5} aria-hidden />}
                    {pack.displayPrice}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-base-content/40">
              {t("store.diamondsShop.footer")}
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
