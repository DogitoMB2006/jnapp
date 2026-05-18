import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CoinDisplay } from "./CoinDisplay"
import { DiamondDisplay } from "./DiamondDisplay"
import type { StoreCategoryId } from "./StoreCategoryRail"

interface StoreHeaderProps {
  activeTab: StoreCategoryId
}

export function StoreHeader({ activeTab }: StoreHeaderProps) {
  const { t } = useTranslation()
  const showDiamonds = activeTab === "decor"

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="relative flex flex-col items-center text-center px-2 pt-1 pb-2"
    >
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-base-300 bg-base-200/80 text-base-content/70"
        aria-hidden
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={2} />
      </div>

      <h2
        className="relative font-serif text-2xl font-bold tracking-tight text-base-content sm:text-[1.65rem]"
        style={{ fontFamily: "'Fraunces', Georgia, serif" }}
      >
        {t("store.title")}
      </h2>
      <p className="relative mt-1.5 max-w-[16rem] text-sm leading-relaxed text-base-content/50">
        {t("store.tagline")}
      </p>

      <div className="relative mt-4">
        <AnimatePresence mode="wait">
          {showDiamonds ? (
            <motion.div
              key="diamond"
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
            >
              <DiamondDisplay />
            </motion.div>
          ) : (
            <motion.div
              key="coin"
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
            >
              <CoinDisplay variant="pill" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}
