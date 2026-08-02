import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslation } from "react-i18next"
import { StoreHeader } from "./components/StoreHeader"
import { StoreCategoryRail, type StoreCategoryId } from "./components/StoreCategoryRail"
import { ThemesSection } from "./themes/ThemesSection"
import { DecorationsSection } from "./decorations/DecorationsSection"
import { useStoreStore } from "../../../store/storeStore"
import { preloadAd } from "../../../lib/admob"
import { preloadDiamondAd } from "../../../lib/diamonds"
import { isMobileTauri } from "../../../lib/platform"

export function TiendaPage() {
  const { t } = useTranslation()
  const { loading } = useStoreStore()
  const [activeTab, setActiveTab] = useState<StoreCategoryId>("themes")

  useEffect(() => {
    if (isMobileTauri) {
      preloadAd()
      preloadDiamondAd()
    }
  }, [])

  return (
    <div className="flex flex-col gap-3 pb-6">
      <StoreHeader />

      <StoreCategoryRail active={activeTab} onSelect={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          {activeTab === "themes" && (
            loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <span className="loading loading-spinner loading-md text-primary" />
                <p className="text-xs text-base-content/40">{t("store.loading")}</p>
              </div>
            ) : (
              <ThemesSection />
            )
          )}
          {activeTab === "decor" && <DecorationsSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
