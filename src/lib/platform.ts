const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

const isMobileUserAgent =
  typeof navigator !== "undefined" &&
  /android|iphone|ipad|ipod/i.test(navigator.userAgent)

export const isDesktopTauri = isTauriRuntime && !isMobileUserAgent
/** Android or iOS Tauri WebView */
export const isMobileTauri = isTauriRuntime && isMobileUserAgent
export const isAnyTauri = isTauriRuntime
