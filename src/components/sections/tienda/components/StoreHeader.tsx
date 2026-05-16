import { motion } from "framer-motion"
import { ShoppingBag } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CoinDisplay } from "./CoinDisplay"

export function StoreHeader() {
  const { t } = useTranslation()

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
        <CoinDisplay variant="pill" />
      </div>
    </motion.header>
  )
}
