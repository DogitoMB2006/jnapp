import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "./BottomNav";
import { CustomTitleBar } from "./CustomTitleBar";
import { NotificationPanel } from "../notifications/NotificationPanel";
import { Avatar } from "../shared/Avatar";
import { PlanesPage } from "../sections/planes/PlanesPage";
import { ListaPage } from "../sections/lista/ListaPage";
import { SalidasPage } from "../sections/salidas/SalidasPage";
import { PeliculasPage } from "../sections/peliculas/PeliculasPage";
import { ProfilePage } from "../profile/ProfilePage";
import { useAuthStore } from "../../store/authStore";
import type { Section } from "../../types";

const sectionTitles: Record<Section, string> = {
  planes: "Planes",
  lista: "Lista para Hacer",
  salidas: "Salidas",
  peliculas: "Películas para Ver",
  perfil: "Mi Perfil",
};

export function AppLayout() {
  const [section, setSection] = useState<Section>("lista");
  const { profile } = useAuthStore();

  return (
    <div className="flex flex-col h-screen bg-base-100 overflow-hidden select-none">
      <CustomTitleBar />
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-base-100/80 backdrop-blur-sm border-b border-base-300 flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="/icono.png" alt="JNApp" className="w-7 h-7" />
          </motion.div>
          <h1 className="font-bold text-base-content text-sm">
            {sectionTitles[section]}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPanel />
          <Avatar profile={profile} size="sm" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-y-auto pb-20 px-4 pt-4"
          >
            {section === "planes" && <PlanesPage />}
            {section === "lista" && <ListaPage />}
            {section === "salidas" && <SalidasPage />}
            {section === "peliculas" && <PeliculasPage />}
            {section === "perfil" && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={section} onChange={setSection} />
    </div>
  );
}
