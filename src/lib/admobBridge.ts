import { isMobileTauri } from "./platform"

export type JNAdMobBridge = {
  showRewardedAd: () => void
  preload: () => void
  showDiamondAd: () => void
  preloadDiamond: () => void
  isCoinAdReady?: () => boolean
  isDiamondAdReady?: () => boolean
  isCoinAdLoading?: () => boolean
  isDiamondAdLoading?: () => boolean
}

type AdMobHost = Window & { JNAdMob?: JNAdMobBridge }

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

export function isCoinAdReady(): boolean {
  const bridge = getJNAdMob()
  if (!bridge?.isCoinAdReady) return false
  try {
    return Boolean(bridge.isCoinAdReady())
  } catch {
    return false
  }
}

export function isDiamondAdReady(): boolean {
  const bridge = getJNAdMob()
  if (!bridge?.isDiamondAdReady) return false
  try {
    return Boolean(bridge.isDiamondAdReady())
  } catch {
    return false
  }
}

export function isCoinAdLoading(): boolean {
  const bridge = getJNAdMob()
  if (!bridge?.isCoinAdLoading) return false
  try {
    return Boolean(bridge.isCoinAdLoading())
  } catch {
    return false
  }
}

export function isDiamondAdLoading(): boolean {
  const bridge = getJNAdMob()
  if (!bridge?.isDiamondAdLoading) return false
  try {
    return Boolean(bridge.isDiamondAdLoading())
  } catch {
    return false
  }
}

export function isRewardedAdsSupported(): boolean {
  return isMobileTauri
}

export function formatAdError(code: string, lang: "en" | "es"): string {
  if (code === "ad_not_ready") {
    return lang === "en"
      ? "Ad still loading — wait a few seconds and try again"
      : "El anuncio aún carga — espera unos segundos e intenta de nuevo"
  }
  if (code.startsWith("load_3") || code.includes("No fill") || code.includes("no fill")) {
    return lang === "en"
      ? "No ads available right now. New AdMob units can take up to 24h to start serving."
      : "No hay anuncios disponibles ahora. Las unidades nuevas de AdMob pueden tardar hasta 24h."
  }
  if (code.startsWith("load_") || code.startsWith("show_")) {
    return lang === "en" ? "Ad failed to load. Try again in a moment." : "Error al cargar el anuncio. Intenta en un momento."
  }
  return lang === "en" ? "Ad failed, try again" : "Error con el anuncio, intenta de nuevo"
}

export function parseAdErrorMessage(msg: string): string {
  if (msg.startsWith("load_")) return msg
  if (msg.startsWith("show_")) return msg
  return msg
}
