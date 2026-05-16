import { motion } from "framer-motion"
import { Palette, Sparkles, Gift, Zap } from "lucide-react"
import { useTranslation } from "react-i18next"

export type StoreCategoryId = "themes"

type CategoryDef = {
  id: StoreCategoryId | "decor" | "gifts" | "boosts"
  labelKey: string
  icon: typeof Palette
  available: boolean
}

const CATEGORIES: CategoryDef[] = [
  { id: "themes", labelKey: "store.categories.themes", icon: Palette, available: true },
  { id: "decor", labelKey: "store.categories.decor", icon: Sparkles, available: false },
  { id: "gifts", labelKey: "store.categories.gifts", icon: Gift, available: false },
  { id: "boosts", labelKey: "store.categories.boosts", icon: Zap, available: false },
]

type StoreCategoryRailProps = {
  active: StoreCategoryId
  onSelect: (id: StoreCategoryId) => void
}

export function StoreCategoryRail({ active, onSelect }: StoreCategoryRailProps) {
  const { t } = useTranslation()

  return (
    <motion.nav
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 28 }}
      aria-label={t("store.categoriesLabel")}
      className="-mx-1 flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const isActive = cat.available && cat.id === active

        if (!cat.available) {
          return (
            <motion.div
              key={cat.id}
              layout
              className="flex shrink-0 items-center gap-2 rounded-2xl border border-base-300/80 bg-base-200/40 px-3.5 py-2.5 opacity-55"
              aria-disabled
            >
              <Icon className="h-4 w-4 text-base-content/35" strokeWidth={2} aria-hidden />
              <span className="text-xs font-medium text-base-content/40 whitespace-nowrap">
                {t(cat.labelKey)}
              </span>
              <span className="rounded-md bg-base-300/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-base-content/35">
                {t("store.comingSoon")}
              </span>
            </motion.div>
          )
        }

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id as StoreCategoryId)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? "border-primary/30 bg-primary text-primary-content"
                : "border-base-300 bg-base-200/60 text-base-content/50 hover:border-base-content/20 hover:text-base-content"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            <span className="whitespace-nowrap">{t(cat.labelKey)}</span>
          </button>
        )
      })}
    </motion.nav>
  )
}
