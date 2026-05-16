import { useState } from "react"
import { motion } from "framer-motion"
import { Coins, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useStoreStore } from "../../../../store/storeStore"
import { useAuthStore } from "../../../../store/authStore"
import { EarnCoinsModal } from "./EarnCoinsModal"

type CoinDisplayProps = {
  variant?: "default" | "pill"
}

export function CoinDisplay({ variant = "default" }: CoinDisplayProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { coins } = useStoreStore()
  const { user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)

  const isPill = variant === "pill"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={
          isPill
            ? "inline-flex items-center gap-2.5 rounded-xl border border-base-300 bg-base-200/70 px-3.5 py-2"
            : "flex items-center gap-2 rounded-2xl border border-base-300 bg-base-200/70 px-4 py-2.5"
        }
      >
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
