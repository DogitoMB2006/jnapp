const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

const detectMobileTauri = (): boolean => {
  if (!isTauriRuntime || typeof navigator === "undefined") return false

  const ua = navigator.userAgent
  if (/android|iphone|ipad|ipod/i.test(ua)) return true

  // Some Android WebViews report "Linux" without the Android token
  if (/linux/i.test(ua) && /mobile/i.test(ua)) return true

  const platform = (
    window as Window & { __TAURI_INTERNALS__?: { platform?: string } }
  ).__TAURI_INTERNALS__?.platform

  return platform === "android" || platform === "ios"
}

export const isMobileTauri = detectMobileTauri()
export const isDesktopTauri = isTauriRuntime && !isMobileTauri
export const isAnyTauri = isTauriRuntime
