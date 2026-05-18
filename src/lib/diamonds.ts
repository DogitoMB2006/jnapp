import { isMobileTauri } from "./platform"

export const DIAMOND_PER_AD = 1
export const DIAMOND_AD_LIMIT = 3
export const DIAMOND_AD_WINDOW_MS = 3 * 60 * 60 * 1000 // 3 hours

interface JNAdMob {
  showRewardedAd: () => void
  preload: () => void
}
interface AdMobWindow extends Window {
  JNAdMob?: JNAdMob
  __admobCallback?: (success: boolean, error: string | null) => void
}
declare const window: AdMobWindow

// ─── 3-hour rolling window tracking ──────────────────────────────────────────

function viewsKey(userId: string): string {
  return `diamond_ad_views_${userId}`
}

function getAdTimestamps(userId: string): number[] {
  try {
    const raw = localStorage.getItem(viewsKey(userId))
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function getRecentTimestamps(userId: string): number[] {
  const cutoff = Date.now() - DIAMOND_AD_WINDOW_MS
  return getAdTimestamps(userId).filter((t) => t > cutoff)
}

export function getDiamondAdViewsRecent(userId: string): number {
  return getRecentTimestamps(userId).length
}

/** Ms until the oldest slot expires (i.e. next diamond ad available). 0 if slots free. */
export function getDiamondAdCooldownMs(userId: string): number {
  const recent = getRecentTimestamps(userId)
  if (recent.length < DIAMOND_AD_LIMIT) return 0
  const oldest = Math.min(...recent)
  return Math.max(0, oldest + DIAMOND_AD_WINDOW_MS - Date.now())
}

export function diamondAdsAvailable(userId: string): boolean {
  return isMobileTauri && getDiamondAdViewsRecent(userId) < DIAMOND_AD_LIMIT
}

function recordAdView(userId: string): void {
  const recent = getRecentTimestamps(userId)
  recent.push(Date.now())
  localStorage.setItem(viewsKey(userId), JSON.stringify(recent))
}

// ─── Ad bridge ────────────────────────────────────────────────────────────────

export function watchDiamondAd(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.JNAdMob) {
      reject(new Error("not_available"))
      return
    }
    if (getDiamondAdViewsRecent(userId) >= DIAMOND_AD_LIMIT) {
      reject(new Error("limit_reached"))
      return
    }
    window.__admobCallback = (success: boolean, error: string | null) => {
      window.__admobCallback = undefined
      if (success) {
        recordAdView(userId)
        resolve()
      } else {
        reject(new Error(error ?? "ad_failed"))
      }
    }
    window.JNAdMob.showRewardedAd()
  })
}
