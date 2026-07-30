import { motion, AnimatePresence } from "framer-motion";
import {
  AlarmClock,
  Bell,
  CalendarDays,
  Check,
  Film,
  Heart,
  ListChecks,
  MessageCircle,
  Vault,
  X,
} from "lucide-react";
import { useLayoutEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../hooks/useNotifications";
import { useNavigationStore } from "../../store/navigationStore";
import { formatDistanceToNow } from "../../lib/utils";
import type { Notification, Section } from "../../types";

const SECTION_TYPES = new Set<string>(["planes", "lista", "peliculas"])
const HEIST_TYPES = new Set<string>(["heist_started", "heist_completed", "heist_expired"])

function normalizeSection(section: string): string {
  return section === "salidas" ? "planes" : section
}

function getNavTarget(n: Notification): { section: Section; itemId: string | null } | null {
  const type = normalizeSection(n.type)
  if (SECTION_TYPES.has(type)) {
    return { section: type as Section, itemId: n.reference_id }
  }
  const referenceType = n.reference_type ? normalizeSection(n.reference_type) : null
  if ((n.type === "comment" || n.type === "reaction" || n.type === "reminder") && referenceType && SECTION_TYPES.has(referenceType)) {
    return { section: referenceType as Section, itemId: n.reference_id }
  }
  if (HEIST_TYPES.has(n.type) || referenceType === "juegos") {
    return { section: "juegos", itemId: n.reference_id }
  }
  return null
}

const PANEL_W = 352
const MOBILE_BREAKPOINT = 640

function getNotificationIcon(type: string, referenceType?: string | null) {
  const target = normalizeSection(referenceType || type)
  if (type === "comment") return MessageCircle
  if (type === "reaction") return Heart
  if (type === "reminder") return AlarmClock
  if (HEIST_TYPES.has(type) || target === "juegos") return Vault
  if (target === "planes") return CalendarDays
  if (target === "lista") return ListChecks
  if (target === "peliculas") return Film
  return Bell
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [isMobileSheet, setIsMobileSheet] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { t } = useTranslation();
  const { navigateTo } = useNavigationStore();

  const updatePanelPosition = () => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobileSheet(isMobile)
    if (isMobile) return
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(
      12,
      Math.min(r.right - PANEL_W, window.innerWidth - PANEL_W - 12)
    );
    setPanelPos({ top: r.bottom + 10, left });
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
    const onResize = () => updatePanelPosition()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [open])

  const handleToggleOpen = () => {
    setOpen((o) => !o)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleToggleOpen()
    }
  }

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={handleToggleOpen}
        onKeyDown={handleKeyDown}
        aria-label={t("notifications.title")}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="btn btn-ghost btn-circle relative min-h-11 min-w-11 h-11 w-11"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-bold"
            aria-hidden
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="notif-scrim"
                  role="presentation"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="fixed inset-0 z-[10000] bg-black/25 backdrop-blur-md sm:bg-base-100/20"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  key="notif-popover"
                  role="dialog"
                  aria-label={t("notifications.title")}
                  initial={isMobileSheet ? { opacity: 0, y: "100%" } : { opacity: 0, y: -8, scale: 0.98 }}
                  animate={isMobileSheet ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={isMobileSheet ? { opacity: 0, y: "100%" } : { opacity: 0, y: -8, scale: 0.98 }}
                  transition={isMobileSheet ? { type: "spring", stiffness: 360, damping: 32 } : { duration: 0.16 }}
                  style={
                    isMobileSheet
                      ? { left: 0, right: 0, bottom: 0 }
                      : { top: panelPos.top, left: panelPos.left }
                  }
                  className="fixed z-[10001] flex max-h-[min(82vh,42rem)] flex-col overflow-hidden rounded-t-[28px] border border-base-300/80 bg-base-200/85 shadow-2xl backdrop-blur-2xl sm:w-[22rem] sm:rounded-2xl"
                >
                  <div className="flex justify-center pb-1 pt-3 sm:hidden">
                    <div className="h-1 w-10 rounded-full bg-base-content/15" />
                  </div>

                  <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-base-300 px-5 pb-4 pt-3 sm:p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <Bell size={18} strokeWidth={2.4} />
                        </span>
                        <div>
                          <h3 className="text-base font-bold leading-tight text-base-content sm:text-sm">
                            {t("notifications.title")}
                          </h3>
                          <p className="text-xs text-base-content/45">
                            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="btn btn-ghost btn-sm min-h-10 rounded-full px-3 text-xs sm:btn-xs sm:min-h-0"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span className="hidden min-[380px]:inline">{t("notifications.markAllRead")}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="btn btn-ghost btn-circle btn-sm min-h-10 min-w-10 border border-base-300 bg-base-100/60"
                        aria-label={t("notifications.close")}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:max-h-72">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-base-300 bg-base-100/35 px-6 py-12 text-center text-base-content/45">
                        <Bell className="mb-3 text-primary/55" size={34} strokeWidth={2.2} />
                        <p className="text-sm font-semibold">{t("notifications.empty")}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-0">
                        {notifications.slice(0, 20).map((n) => {
                          const Icon = getNotificationIcon(n.type, n.reference_type)
                          const nav = getNavTarget(n)
                          const localizedHeist = HEIST_TYPES.has(n.type)
                            ? {
                                title: t(`juegos.heist.notificationPanel.${n.type}.title`),
                                message: t(`juegos.heist.notificationPanel.${n.type}.message`),
                              }
                            : null
                          const openNotification = () => {
                            void markAsRead(n.id)
                            if (nav) {
                              navigateTo(nav.section, nav.itemId)
                              setOpen(false)
                            }
                          }

                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={openNotification}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault()
                                  openNotification()
                                }
                              }}
                              className={`group flex w-full items-start gap-3 rounded-3xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 ${
                                !n.read
                                  ? "border-primary/20 bg-primary/10 shadow-sm shadow-primary/10"
                                  : "border-base-300/80 bg-base-100/30 hover:border-base-content/15 hover:bg-base-100/50"
                              }`}
                            >
                              <span
                                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                  !n.read ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/55"
                                }`}
                              >
                                <Icon size={18} strokeWidth={2.35} />
                                {!n.read && (
                                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-200 bg-primary" />
                                )}
                              </span>

                              <span className="min-w-0 flex-1 pt-0.5">
                                <span className="block text-sm font-bold leading-snug text-base-content">
                                  {localizedHeist?.title ?? n.title}
                                </span>
                                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-base-content/62">
                                  {localizedHeist?.message ?? n.message}
                                </span>
                                <span className="mt-2 block text-[11px] font-medium text-base-content/40">
                                  {formatDistanceToNow(n.created_at)}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
