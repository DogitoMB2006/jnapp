import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdaterState {
  update: Update | null;
  downloading: boolean;
  progress: number;
  error: string | null;
}

export function useUpdater() {
  const [state, setState] = useState<UpdaterState>({
    update: null,
    downloading: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const update = await check();
        if (update?.available) {
          setState((s) => ({ ...s, update }));
        }
      } catch {
        // Silent — don't interrupt app if update check fails
      }
    };

    // Delay check so app fully loads first
    const timer = setTimeout(checkForUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  const installUpdate = async () => {
    if (!state.update) return;
    setState((s) => ({ ...s, downloading: true, progress: 0 }));

    let downloaded = 0;
    let total = 0;

    try {
      await state.update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setState((s) => ({
            ...s,
            progress: total > 0 ? Math.round((downloaded / total) * 100) : 0,
          }));
        } else if (event.event === "Finished") {
          setState((s) => ({ ...s, progress: 100 }));
        }
      });
      await relaunch();
    } catch (err) {
      setState((s) => ({
        ...s,
        downloading: false,
        error: err instanceof Error ? err.message : "Error al actualizar",
      }));
    }
  };

  const dismiss = () => setState((s) => ({ ...s, update: null, error: null }));

  return { ...state, installUpdate, dismiss };
}
