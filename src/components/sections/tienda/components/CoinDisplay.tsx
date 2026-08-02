import { useState } from "react"
import { motion } from "framer-motion"
import { Coins, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useStoreStore } from "../../../../store/storeStore"
import { useAuthStore } from "../../../../store/authStore"
import { EarnCoinsModal } from "./EarnCoinsModal"

type CoinDisplayProps = {
  variant?: "default" | "pill" | "compact"
}

export function CoinDisplay({ variant = "default" }: CoinDisplayProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const coins = useStoreStore((s) => s.coins)
  const user = useAuthStore((s) => s.user)
  const [modalOpen, setModalOpen] = useState(false)

  const isPill = variant === "pill"
  const isCompact = variant === "compact"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={
          isCompact
            ? "inline-flex items-center gap-1 rounded-lg border border-warning/25 bg-warning/10 pl-1.5 pr-1 py-1"
            : isPill
              ? "inline-flex items-center gap-2.5 rounded-xl border border-base-300 bg-base-200/70 px-3.5 py-2"
              : "flex items-center gap-2 rounded-2xl border border-base-300 bg-base-200/70 px-4 py-2.5"
        }
      >
        {isCompact ? (
          <>
            <Coins className="h-3.5 w-3.5 text-warning shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-bold tabular-nums text-warning leading-none" aria-label={t("store.coins")}>
              {coins}
            </span>
            {user && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-warning/30 bg-warning/15 text-warning hover:bg-warning/25 active:scale-95 transition-colors"
                aria-label={lang === "en" ? "Earn coins" : "Ganar monedas"}
              >
                <Plus size={11} strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-300/40 text-base-content/65"
              aria-hidden
            >
              <Coins className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider">
                {t("store.coins")}
              </span>
              <span className="font-semibold text-base tabular-nums text-base-content">{coins}</span>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border border-base-300 bg-base-300/50 text-base-content/70 hover:bg-base-300 active:scale-95 transition-colors duration-150"
                aria-label={lang === "en" ? "Earn coins" : "Ganar monedas"}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}
      </motion.div>

      {user && (
        <EarnCoinsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={user.id}
        />
      )}
    </>
  )
}
