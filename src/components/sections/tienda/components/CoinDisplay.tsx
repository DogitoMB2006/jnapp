import { motion } from "framer-motion"
import { Coins } from "lucide-react"
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
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/25"
        aria-hidden
      >
        <Coins className="w-5 h-5" strokeWidth={2.25} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] text-base-content/40 font-medium uppercase tracking-wider">
          {lang === "en" ? "Coins" : "Monedas"}
        </span>
        <span className="text-warning font-bold text-base tabular-nums">{coins}</span>
      </div>
    </motion.div>
  )
}
