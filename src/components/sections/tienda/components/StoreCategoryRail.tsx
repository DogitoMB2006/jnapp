import { motion } from "framer-motion"
import { MessageCircle, Palette } from "lucide-react"
import { useTranslation } from "react-i18next"

export type StoreCategoryId = "themes" | "decor"

type CategoryDef = {
  id: StoreCategoryId
  labelKey: string
  icon: typeof Palette
}

const CATEGORIES: CategoryDef[] = [
  { id: "themes", labelKey: "store.categories.themes", icon: Palette },
  { id: "decor", labelKey: "store.categories.decor", icon: MessageCircle },
]

type StoreCategoryRailProps = {
  active: StoreCategoryId
  onSelect: (id: StoreCategoryId) => void
}

export function StoreCategoryRail({ active, onSelect }: StoreCategoryRailProps) {
  const { t } = useTranslation()

  return (
    <motion.nav
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, type: "spring", stiffness: 340, damping: 30 }}
      aria-label={t("store.categoriesLabel")}
      className="grid grid-cols-2 gap-0.5 rounded-xl border border-base-300/80 bg-base-200/55 p-0.5"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const isActive = cat.id === active

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`relative flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 ${
              isActive
                ? "text-primary-content"
                : "text-base-content/55 hover:bg-base-100/70 hover:text-base-content"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="store-active-category"
                className="absolute inset-0 rounded-lg bg-primary shadow-sm shadow-primary/25"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                aria-hidden
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
              <span className="whitespace-nowrap">{t(cat.labelKey)}</span>
            </span>
          </button>
        )
      })}
    </motion.nav>
  )
}
