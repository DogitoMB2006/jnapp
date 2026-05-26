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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, type: "spring", stiffness: 320, damping: 28 }}
      aria-label={t("store.categoriesLabel")}
      className="grid grid-cols-2 gap-1 rounded-2xl border border-base-300/80 bg-base-200/55 p-1 shadow-sm shadow-black/5"
    >
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon
        const isActive = cat.id === active

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`relative flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 ${
              isActive
                ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                : "text-base-content/55 hover:bg-base-100/70 hover:text-base-content"
            }`}
            aria-current={isActive ? "true" : undefined}
          >
            {isActive && (
              <motion.span
                layoutId="store-active-category"
                className="absolute inset-0 rounded-xl bg-primary"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                aria-hidden
              />
            )}
            <span className="relative inline-flex items-center gap-2">
              <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              <span className="whitespace-nowrap">{t(cat.labelKey)}</span>
            </span>
          </button>
        )
      })}
    </motion.nav>
  )
}
