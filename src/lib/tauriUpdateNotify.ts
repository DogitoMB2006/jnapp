import { getCurrentWindow } from "@tauri-apps/api/window"
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification"

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

/**
 * Minimized, hidden to tray, or document not visible — user likely not seeing the in-app modal.
 */
export const isTauriWindowInBackground = async (): Promise<boolean> => {
  if (!isTauriRuntime) return false
  try {
    if (document.visibilityState === "hidden") return true
    const w = getCurrentWindow()
    if (!(await w.isVisible())) return true
    if (await w.isMinimized()) return true
  } catch {
    return true
  }
  return false
}

export const sendUpdateAvailableNotification = async (version: string) => {
  if (!isTauriRuntime) return
  let granted = await isPermissionGranted()
  if (!granted) {
    const p = await requestPermission()
    granted = p === "granted"
  }
  if (!granted) return
  await sendNotification({
    title: "JNApp — nueva versión",
    body: `v${version} disponible. Abre JNApp para instalar la actualización.`,
  })
}
