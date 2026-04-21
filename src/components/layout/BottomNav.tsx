import { motion } from "framer-motion";
import { Map, ListChecks, Compass, Film, UserCircle } from "lucide-react";
import type { Section } from "../../types";

interface BottomNavProps {
  active: Section;
  onChange: (s: Section) => void;
}

const tabs: { id: Section; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "planes", label: "Planes", Icon: Map },
  { id: "lista", label: "Lista", Icon: ListChecks },
  { id: "salidas", label: "Salidas", Icon: Compass },
  { id: "peliculas", label: "Películas", Icon: Film },
  { id: "perfil", label: "Perfil", Icon: UserCircle },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-base-200/90 backdrop-blur-md border-t border-base-300">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl relative min-w-0 flex-1 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-primary/15 rounded-xl"
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                />
              )}
              <Icon size={isActive ? 22 : 20} />
              <span
                className={`text-[10px] font-medium transition-colors leading-none ${
                  isActive ? "text-primary" : "text-base-content/40"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
