import { create } from "zustand";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type Status = "idle" | "checking" | "available" | "up-to-date" | "downloading" | "error";

interface UpdaterStore {
  status: Status;
  update: Update | null;
  progress: number;
  error: string | null;
  modalOpen: boolean;
  checkForUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
}

export const useUpdaterStore = create<UpdaterStore>((set, get) => ({
  status: "idle",
  update: null,
  progress: 0,
  error: null,
  modalOpen: false,

  checkForUpdate: async () => {
    set({ status: "checking", error: null });
    try {
      const update = await check();
      if (update?.available) {
        set({ status: "available", update, modalOpen: true });
      } else {
        set({ status: "up-to-date", update: null });
      }
    } catch (err) {
      // In dev builds the updater isn't available — treat as up-to-date silently
      const msg = err instanceof Error ? err.message : String(err);
      const isDevBuild = msg.toLowerCase().includes("not supported") ||
        msg.toLowerCase().includes("no updater") ||
        msg.toLowerCase().includes("after compilation") ||
        msg.toLowerCase().includes("release");
      if (isDevBuild) {
        set({ status: "up-to-date" });
      } else {
        set({ status: "error", error: msg });
      }
    }
  },

  installUpdate: async () => {
    const { update } = get();
    if (!update) return;
    set({ status: "downloading", progress: 0 });

    let downloaded = 0;
    let total = 0;

    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          set({ progress: total > 0 ? Math.round((downloaded / total) * 100) : 0 });
        } else if (event.event === "Finished") {
          set({ progress: 100 });
        }
      });
      await relaunch();
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Error al instalar actualización",
      });
    }
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}));
