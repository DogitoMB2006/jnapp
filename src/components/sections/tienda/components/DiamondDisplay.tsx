import { useState } from "react"
import { motion } from "framer-motion"
import { Gem, ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useDiamondStore } from "../../../../store/diamondStore"
import { useAuthStore } from "../../../../store/authStore"
import { EarnDiamondsModal } from "./EarnDiamondsModal"

type DiamondDisplayProps = {
  variant?: "default" | "compact"
}

export function DiamondDisplay({ variant = "default" }: DiamondDisplayProps) {
  const { t } = useTranslation()
  const { diamonds } = useDiamondStore()
  const { user } = useAuthStore()
  const [modalOpen, setModalOpen] = useState(false)
  const isCompact = variant === "compact"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={
          isCompact
            ? "inline-flex items-center gap-1 rounded-lg border border-sky-500/25 bg-sky-500/10 pl-1.5 pr-1 py-1"
            : "inline-flex items-center gap-2.5 rounded-xl border border-sky-500/20 bg-sky-500/6 px-3.5 py-2"
        }
      >
        {isCompact ? (
          <>
            <Gem className="h-3.5 w-3.5 text-sky-400 shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="text-xs font-bold tabular-nums text-sky-300 leading-none" aria-label={t("store.diamonds")}>
              {diamonds}
            </span>
            {user && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex h-5 w-5 items-center justify-center rounded-md border border-sky-400/30 bg-sky-400/15 text-sky-400 hover:bg-sky-400/25 active:scale-95 transition-colors"
                aria-label={t("store.diamondsShop.openShop")}
              >
                <ShoppingBag size={11} strokeWidth={2.5} />
              </button>
            )}
          </>
        ) : (
          <>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-400"
              aria-hidden
            >
              <Gem className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-sky-400/70 font-medium uppercase tracking-wider">
                {t("store.diamonds")}
              </span>
              <span className="font-semibold text-base tabular-nums text-sky-300">{diamonds}</span>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/12 text-sky-400 hover:bg-sky-400/20 active:scale-95 transition-colors duration-150"
                aria-label={t("store.diamondsShop.openShop")}
              >
                <ShoppingBag size={14} strokeWidth={2.5} />
              </button>
            )}
          </>
        )}
      </motion.div>

      {user && (
        <EarnDiamondsModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userId={user.id}
        />
      )}
    </>
  )
}
