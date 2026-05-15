import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Palette } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CoinDisplay } from "./components/CoinDisplay"
import { ThemesSection } from "./themes/ThemesSection"
import { useStoreStore } from "../../../store/storeStore"
import { preloadAd } from "../../../lib/admob"
import { isMobileTauri } from "../../../lib/platform"

type StoreTab = "themes"

const TABS: { id: StoreTab; labelEn: string; labelEs: string; Icon: typeof Palette }[] = [
  { id: "themes", labelEn: "Themes", labelEs: "Temas", Icon: Palette },
]

export function TiendaPage() {
  const { i18n } = useTranslation()
  const lang = i18n.language === "en" ? "en" : "es"
  const { loading } = useStoreStore()
  const [activeTab, setActiveTab] = useState<StoreTab>("themes")

  useEffect(() => {
    if (isMobileTauri) preloadAd()
  }, [])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="font-bold text-base-content text-lg leading-tight">
            {lang === "en" ? "Store" : "Tienda"}
          </h2>
          <p className="text-xs text-base-content/40 mt-0.5">
            {lang === "en"
              ? "Customize your shared space"
              : "Personaliza su espacio compartido"}
          </p>
        </div>
        <CoinDisplay />
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 rounded-2xl bg-base-200 p-1 border border-base-300"
      >
        {TABS.map(({ id, labelEn, labelEs, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/40 hover:text-base-content"
              }`}
            >
              <Icon size={13} strokeWidth={2.2} />
              {lang === "en" ? labelEn : labelEs}
            </button>
          )
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
      >
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : (
          activeTab === "themes" && <ThemesSection />
        )}
      </motion.div>
    </div>
  )
}
