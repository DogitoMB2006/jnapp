import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
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
import { useSectionSwipe } from "../../hooks/useSectionSwipe";
import { NAV_SECTION_ORDER } from "../../lib/sectionOrder";
import { emitSectionRefresh } from "../../lib/sectionRefreshEvent";
import { lightHaptic } from "../../lib/mobileHaptics";
import type { Section } from "../../types";

export function AppLayout() {
  const [section, setSection] = useState<Section>("lista");
  const { profile } = useAuthStore();
  const { t } = useTranslation();
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const prevSectionRef = useRef<Section>(section);
  const [slideDir, setSlideDir] = useState(0);
  const swipe = useSectionSwipe(section, setSection);

  const scrollContentToTop = useCallback(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleHeaderSync = useCallback(() => {
    emitSectionRefresh(section);
    lightHaptic();
  }, [section]);

  useLayoutEffect(() => {
    const prev = prevSectionRef.current
    const a = NAV_SECTION_ORDER.indexOf(prev)
    const b = NAV_SECTION_ORDER.indexOf(section)
    if (a >= 0 && b >= 0) {
      setSlideDir(b > a ? 1 : b < a ? -1 : 0)
    } else {
      setSlideDir(0)
    }
    prevSectionRef.current = section
  }, [section])

  const handleTabRequest = useCallback(
    (id: Section) => {
      if (id === section) {
        scrollContentToTop();
        lightHaptic();
        return
      }
      setSection(id);
      lightHaptic();
    },
    [section, scrollContentToTop],
  );

  const enterX = slideDir * 36
  const exitX = enterX === 0 ? 0 : -enterX * 0.9

  return (
    <div className="flex flex-col h-screen bg-base-100 overflow-hidden select-none">
      <CustomTitleBar />
      <header className="flex items-center justify-between gap-1.5 px-3.5 sm:px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] bg-base-100/80 backdrop-blur-sm border-b border-base-300 flex-shrink-0 min-h-[3.25rem]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="shrink-0"
          >
            <img src="/icono.png" alt="JNApp" className="w-9 h-9" />
          </motion.div>
          <button
            type="button"
            onClick={scrollContentToTop}
            className="min-w-0 text-left group rounded-xl -mx-1.5 px-1.5 py-0.5 -my-0.5"
            title={t("a11y.tapToScrollTop")}
          >
            <h1 className="font-bold text-base-content text-base sm:text-lg truncate transition-transform group-active:scale-[0.99] group-active:opacity-90">
              {t(`sections.${section}`)}
            </h1>
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleHeaderSync}
            className="btn btn-ghost btn-sm btn-square min-h-10 min-w-10 rounded-xl text-base-content/70 hover:text-primary hover:bg-primary/10 border-0"
            title={t("a11y.syncSection")}
            aria-label={t("a11y.syncSection")}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <NotificationPanel />
          <Avatar profile={profile} size="md" />
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            ref={contentScrollRef}
            initial={{
              opacity: 0,
              x: slideDir === 0 ? 0 : enterX,
              y: slideDir === 0 ? 8 : 0,
            }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              x: slideDir === 0 ? 0 : exitX,
              y: slideDir === 0 ? -4 : 0,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 34, mass: 0.6 }}
            className="h-full overflow-y-auto overscroll-behavior-y-contain pb-[max(6.25rem,env(safe-area-inset-bottom,0px))] px-4 pt-4 sm:pt-5"
            onPointerDown={swipe.onPointerDown}
            onPointerUp={swipe.onPointerUp}
            onPointerCancel={swipe.onPointerCancel}
            style={{ touchAction: "pan-y" }}
            role="presentation"
          >
            {section === "planes" && <PlanesPage />}
            {section === "lista" && <ListaPage />}
            {section === "salidas" && <SalidasPage />}
            {section === "peliculas" && <PeliculasPage />}
            {section === "perfil" && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={section} onNavigate={handleTabRequest} />
    </div>
  );
}
