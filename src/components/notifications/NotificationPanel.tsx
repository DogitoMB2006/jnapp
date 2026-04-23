import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X } from "lucide-react";
import { useLayoutEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../hooks/useNotifications";
import { formatDistanceToNow } from "../../lib/utils";

const PANEL_W = 288

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const { t } = useTranslation();

  const updatePanelPosition = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(r.right - PANEL_W, window.innerWidth - PANEL_W - 8)
    );
    setPanelPos({ top: r.bottom + 8, left });
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
        className="btn btn-ghost btn-sm btn-circle relative"
      >
        <Bell size={20} />
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
                  className="fixed inset-0 z-[10000] bg-base-100/30 backdrop-blur-[2px]"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  key="notif-popover"
                  role="dialog"
                  aria-label={t("notifications.title")}
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  style={{ top: panelPos.top, left: panelPos.left }}
                  className="fixed z-[10001] w-72 max-h-[min(24rem,calc(100vh-3rem))] flex flex-col bg-base-200 rounded-2xl shadow-2xl border border-base-300 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 border-b border-base-300 flex-shrink-0">
                    <h3 className="font-bold text-sm">{t("notifications.title")}</h3>
                    <div className="flex gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllAsRead}
                          className="btn btn-ghost btn-xs gap-1"
                        >
                          <Check size={12} /> {t("notifications.markAllRead")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="btn btn-ghost btn-xs btn-circle"
                        aria-label={t("notifications.close")}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto min-h-0">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-base-content/40 text-sm">
                        {t("notifications.empty")}
                      </div>
                    ) : (
                      notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              void markAsRead(n.id)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`p-3 border-b border-base-300 cursor-pointer hover:bg-base-300 transition-colors ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            )}
                            <div className={!n.read ? "" : "pl-4"}>
                              <p className="text-xs font-semibold text-base-content">
                                {n.title}
                              </p>
                              <p className="text-xs text-base-content/60 mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-base-content/40 mt-1">
                                {formatDistanceToNow(n.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
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
