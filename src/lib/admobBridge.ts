import { isMobileTauri } from "./platform"

export type JNAdMobBridge = {
  showRewardedAd: () => void
  preload: () => void
  showDiamondAd: () => void
  preloadDiamond: () => void
}

type AdMobHost = Window & { JNAdMob?: JNAdMobBridge }

/**
 * Android @JavascriptInterface objects are injected as globals (JNAdMob),
 * not always as window.JNAdMob. Resolve and mirror onto window when found.
 */
export function getJNAdMob(): JNAdMobBridge | null {
  if (typeof window === "undefined") return null

  const win = window as AdMobHost
  if (win.JNAdMob) return win.JNAdMob

  try {
    const host = globalThis as unknown as AdMobHost
    if (host.JNAdMob) {
      win.JNAdMob = host.JNAdMob
      return host.JNAdMob
    }
  } catch {
    // Bridge not exposed in this context
  }

  return null
}

export function isAdMobBridgeReady(): boolean {
  return getJNAdMob() !== null
}

export function isRewardedAdsSupported(): boolean {
  return isMobileTauri
}
