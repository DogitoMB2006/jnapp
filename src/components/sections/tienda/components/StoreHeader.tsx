import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { CoinDisplay } from "./CoinDisplay"
import { DiamondDisplay } from "./DiamondDisplay"

export function StoreHeader() {
  const { t } = useTranslation()

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="flex items-start justify-between gap-3 px-0.5"
    >
      <div className="min-w-0">
        <h2
          className="font-serif text-xl font-bold tracking-tight text-base-content sm:text-2xl"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          {t("store.title")}
        </h2>
        <p className="mt-0.5 text-xs leading-snug text-base-content/45 truncate max-w-[12rem] sm:max-w-[16rem]">
          {t("store.tagline")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <CoinDisplay variant="compact" />
        <DiamondDisplay variant="compact" />
      </div>
    </motion.header>
  )
}
