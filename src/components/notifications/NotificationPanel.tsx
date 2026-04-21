import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import { useState } from "react";
import { formatDistanceToNow } from "../../lib/utils";

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-ghost btn-sm btn-circle relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-10 w-72 bg-base-200 rounded-2xl shadow-2xl border border-base-300 z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-base-300">
                <h3 className="font-bold text-sm">Notificaciones</h3>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="btn btn-ghost btn-xs gap-1"
                    >
                      <Check size={12} /> Todo leído
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="btn btn-ghost btn-xs btn-circle"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-base-content/40 text-sm">
                    Sin notificaciones
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
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
      </AnimatePresence>
    </div>
  );
}
