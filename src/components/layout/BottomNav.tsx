import { motion } from "framer-motion";
import { Map, ListChecks, Compass, Film, UserCircle, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next";
import { NAV_SECTION_ORDER } from "../../lib/sectionOrder";
import type { Section } from "../../types";

interface BottomNavProps {
  active: Section;
  onNavigate: (s: Section) => void;
}

const SECTION_ICONS: Record<Section, LucideIcon> = {
  planes: Map,
  lista: ListChecks,
  salidas: Compass,
  peliculas: Film,
  perfil: UserCircle,
};

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = NAV_SECTION_ORDER.map((id) => {
    const Icon = SECTION_ICONS[id]
    return { id, label: t(`nav.${id}`), Icon }
  })

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 p-1.5 sm:p-2 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]">
      <nav
        className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-white/10 bg-base-200/80 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.55)]"
        aria-label={t("a11y.bottomNav")}
      >
        <div className="flex items-center justify-around px-0.5 sm:px-1 py-1.5 min-h-[4.1rem]">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              aria-pressed={isActive}
              aria-label={label}
              onClick={() => onNavigate(id)}
              className="flex flex-col items-center justify-center gap-0.5 px-1.5 sm:px-2.5 py-2 min-h-[3.4rem] rounded-[0.9rem] relative min-w-0 flex-1 transition-transform active:scale-95"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-[0.85rem] border border-primary/20 bg-primary/[0.12]"
                  transition={{ type: "spring", damping: 22, stiffness: 360 }}
                />
              )}
              <span className="relative z-10 shrink-0 leading-none drop-shadow-sm" aria-hidden>
                <Icon size={isActive ? 25 : 23} strokeWidth={isActive ? 2.1 : 1.9} />
              </span>
              <span
                className={`relative z-10 text-[10.5px] sm:text-xs font-medium transition-colors leading-tight text-center px-0.5 line-clamp-2 ${
                  isActive ? "text-primary" : "text-base-content/38"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
