import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useStoreStore } from "../../../../store/storeStore"

export function CoinDisplay() {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { coins } = useStoreStore()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-warning/20"
      style={{ background: "rgba(253,230,138,0.07)" }}
    >
      <span className="text-xl leading-none">🪙</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider">
          {lang === "en" ? "Coins" : "Monedas"}
        </span>
        <span className="text-warning font-bold text-base tabular-nums">{coins}</span>
      </div>
    </motion.div>
  )
}
