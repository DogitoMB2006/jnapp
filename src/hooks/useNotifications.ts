import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import insforge from "../lib/insforge";
import { parseNotificationInsertPayload } from "../lib/notificationPayload";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";
import type { Notification } from "../types";
import { useRealtime } from "./useRealtime";

const NOTIFICATION_REALTIME_EVENTS = [
  "NEW_NOTIFICATION",
  "INSERT",
  "new_notification",
  "insert",
] as const;

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function useNotifications() {
  const { user } = useAuthStore();
  const handledNotificationIds = useRef<Set<string>>(new Set());
  /** IDs we already showed an OS toast for (poll + realtime share this). */
  const osToastSeenIdsRef = useRef<Set<string>>(new Set());
  const pollBootstrappedRef = useRef(false);
  const {
    addNotification,
    setNotifications,
    markRead,
    markAllRead,
    notifications,
    unreadCount,
  } = useNotificationStore();

  useEffect(() => {
    if (!user) return;
    void insforge.realtime.connect().catch(() => {
      /* Realtime optional; polling still refreshes the bell */
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    osToastSeenIdsRef.current = new Set();
    pollBootstrappedRef.current = false;

    const sendOsToast = async (n: Pick<Notification, "title" | "message">) => {
      let permGranted = await isPermissionGranted();
      if (!permGranted) {
        const perm = await requestPermission();
        permGranted = perm === "granted";
      }
      if (permGranted) {
        await sendNotification({ title: n.title, body: n.message });
      }
    };

    const fetchList = async () => {
      const { data, error } = await insforge.database
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        return;
      }
      if (!data?.length) {
        setNotifications([]);
        if (!pollBootstrappedRef.current) {
          pollBootstrappedRef.current = true;
        }
        return;
      }
      const rows = data as Notification[];
      if (!pollBootstrappedRef.current) {
        rows.forEach((r) => osToastSeenIdsRef.current.add(r.id));
        pollBootstrappedRef.current = true;
        setNotifications(rows);
        return;
      }
      for (const r of rows) {
        if (osToastSeenIdsRef.current.has(r.id)) continue;
        osToastSeenIdsRef.current.add(r.id);
        await sendOsToast(r);
      }
      setNotifications(rows);
    };
    void fetchList();

    const pollMs = 12_000;
    /** Chromium throttles `setInterval` when minimized; Tauri emits ticks from Rust instead. */
    let intervalId: ReturnType<typeof setInterval> | undefined;
    if (!isTauriRuntime) {
      intervalId = window.setInterval(() => {
        void fetchList();
      }, pollMs);
    }

    let unlistenRustPromise: Promise<UnlistenFn> | undefined;
    if (isTauriRuntime) {
      unlistenRustPromise = listen("jnapp-notification-tick", () => {
        void fetchList();
      });
    }

    const onVis = () => {
      if (document.visibilityState === "visible") void fetchList();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      void unlistenRustPromise?.then((u) => u());
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, setNotifications]);

  useRealtime(
    user ? `notifications:${user.id}` : "__none__",
    async (payload) => {
      if (!user || !payload) return;
      const n = parseNotificationInsertPayload(payload, user.id);
      if (!n) {
        return;
      }
      if (handledNotificationIds.current.has(n.id)) return;
      handledNotificationIds.current.add(n.id);
      if (handledNotificationIds.current.size > 120) {
        const keep = [...handledNotificationIds.current].slice(-60);
        handledNotificationIds.current = new Set(keep);
      }

      addNotification(n);

      if (!osToastSeenIdsRef.current.has(n.id)) {
        osToastSeenIdsRef.current.add(n.id);
        let permGranted = await isPermissionGranted();
        if (!permGranted) {
          const perm = await requestPermission();
          permGranted = perm === "granted";
        }
        if (permGranted) {
          await sendNotification({ title: n.title, body: n.message });
        }
      }
    },
    { events: [...NOTIFICATION_REALTIME_EVENTS] }
  );

  const markAsRead = async (id: string) => {
    markRead(id);
    await insforge.database
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    markAllRead();
    await insforge.database
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
