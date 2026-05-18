import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { crossfadeTransition } from "../../lib/motion";
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
import { TiendaPage } from "../sections/tienda/TiendaPage";
import { ProfilePage } from "../profile/ProfilePage";
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { useNavigationStore } from "../../store/navigationStore";
import { useStoreStore } from "../../store/storeStore";
import { useGroupThemeSync } from "../../hooks/useGroupThemeSync";
import { useRealtime } from "../../hooks/useRealtime";
import { useSectionSwipe } from "../../hooks/useSectionSwipe";
import { parseTableChangePayload } from "../../lib/realtimePayload";
import { emitSectionRefresh } from "../../lib/sectionRefreshEvent";
import { lightHaptic } from "../../lib/mobileHaptics";
import type { Section } from "../../types";

export function AppLayout() {
  const [section, setSection] = useState<Section>("lista");
  const profile = useAuthStore((s) => s.profile);
  const { t } = useTranslation();
  const group = useGroupStore((s) => s.group);
  const pendingSection = useNavigationStore((s) => s.pendingSection);
  const clearPendingSection = useNavigationStore((s) => s.clearPendingSection);
  const fetchStore = useStoreStore((s) => s.fetchStore);

  // Bootstrap store when group is known
  useEffect(() => {
    if (group?.id) void fetchStore(group.id)
  }, [group?.id, fetchStore])

  useGroupThemeSync(group?.id)

  // Sync coins — when partner buys something, shared pool decreases
  useRealtime(
    group?.id ? "group_coins" : "__none__",
    (payload) => {
      const msg = parseTableChangePayload(payload)
      if (!msg) return
      const row = msg.record
      if (row.group_id !== group?.id) return
      if (typeof row.amount === "number") {
        useStoreStore.setState({ coins: row.amount })
      }
    },
    { events: ["UPDATE", "coins_change"] }
  )

  // Sync purchases — when partner buys a theme, mark it owned here too
  useRealtime(
    group?.id ? "group_purchases" : "__none__",
    (payload) => {
      const msg = parseTableChangePayload(payload)
      if (!msg) return
      const row = msg.record
      if (row.group_id !== group?.id) return
      if (typeof row.item_id === "string") {
        useStoreStore.setState((s) => ({
          purchases: new Set([...s.purchases, row.item_id as string]),
        }))
      }
    },
    { events: ["INSERT", "purchase_change"] }
  )

  useEffect(() => {
    if (!pendingSection) return;
    setSection(pendingSection);
    clearPendingSection();
  }, [pendingSection, clearPendingSection]);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const swipe = useSectionSwipe(section, setSection);

  const scrollContentToTop = useCallback(() => {
    contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleHeaderSync = useCallback(() => {
    emitSectionRefresh(section);
    lightHaptic();
  }, [section]);

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

  return (
    <div className="flex flex-col h-screen bg-base-100 overflow-hidden select-none">
      <CustomTitleBar />
      <header className="flex items-center justify-between gap-1.5 px-3.5 sm:px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top,0px))] bg-base-100/80 backdrop-blur-sm border-b border-base-300 flex-shrink-0 min-h-[3.25rem]">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={crossfadeTransition}
            className="shrink-0"
          >
            <img src="/icono.png" alt="Planivy" className="w-9 h-9" loading="lazy" decoding="async" />
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
        <AnimatePresence mode="sync">
          <motion.div
            key={section}
            ref={contentScrollRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={crossfadeTransition}
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
            {section === "tienda" && <TiendaPage />}
            {section === "perfil" && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav active={section} onNavigate={handleTabRequest} />
    </div>
  );
}
