import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { StoreHeader } from "./components/StoreHeader"
import { StoreCategoryRail, type StoreCategoryId } from "./components/StoreCategoryRail"
import { ThemesSection } from "./themes/ThemesSection"
import { useStoreStore } from "../../../store/storeStore"
import { preloadAd } from "../../../lib/admob"
import { isMobileTauri } from "../../../lib/platform"

export function TiendaPage() {
  const { t } = useTranslation()
  const { loading } = useStoreStore()
  const [activeTab, setActiveTab] = useState<StoreCategoryId>("themes")

  useEffect(() => {
    if (isMobileTauri) preloadAd()
  }, [])

  return (
    <div className="flex flex-col gap-6 pb-6">
      <StoreHeader />

      <StoreCategoryRail active={activeTab} onSelect={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <span className="loading loading-spinner loading-md text-primary" />
              <p className="text-xs text-base-content/40">{t("store.loading")}</p>
            </div>
          ) : (
            activeTab === "themes" && <ThemesSection />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
