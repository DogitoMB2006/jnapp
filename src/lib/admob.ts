import { getJNAdMob, isAdMobBridgeReady } from "./admobBridge"
import { isMobileTauri } from "./platform"

export const AD_COINS = 10
export const COIN_AD_LIMIT = 3
export const COIN_AD_WINDOW_MS = 3 * 60 * 60 * 1000 // 3 hours

/** @deprecated Use COIN_AD_LIMIT */
export const MAX_ADS_PER_DAY = COIN_AD_LIMIT

// ─── 3-hour rolling window tracking ───────────────────────────────────────────

function viewsKey(userId: string): string {
  return `coin_ad_views_${userId}`
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
  const cutoff = Date.now() - COIN_AD_WINDOW_MS
  return getAdTimestamps(userId).filter((t) => t > cutoff)
}

export function getCoinAdViewsRecent(userId: string): number {
  return getRecentTimestamps(userId).length
}

/** @deprecated Use getCoinAdViewsRecent */
export function getAdViewsToday(userId: string): number {
  return getCoinAdViewsRecent(userId)
}

/** Ms until the oldest slot expires (next coin ad available). 0 if slots free. */
export function getCoinAdCooldownMs(userId: string): number {
  const recent = getRecentTimestamps(userId)
  if (recent.length < COIN_AD_LIMIT) return 0
  const oldest = Math.min(...recent)
  return Math.max(0, oldest + COIN_AD_WINDOW_MS - Date.now())
}

export function hasCoinAdSlots(userId: string): boolean {
  return getCoinAdViewsRecent(userId) < COIN_AD_LIMIT
}

export function coinAdsAvailable(userId: string): boolean {
  return isMobileTauri && isAdMobBridgeReady() && hasCoinAdSlots(userId)
}

/** @deprecated Use coinAdsAvailable */
export function adsAvailable(userId: string): boolean {
  return coinAdsAvailable(userId)
}

function recordAdView(userId: string): void {
  const recent = getRecentTimestamps(userId)
  recent.push(Date.now())
  localStorage.setItem(viewsKey(userId), JSON.stringify(recent))
}

// ─── Ad bridge ────────────────────────────────────────────────────────────────

/**
 * Show a rewarded ad. Resolves when the user earns the reward.
 * Rejects with an Error if the ad isn't ready, fails, or limit reached.
 */
export function watchRewardedAd(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const bridge = getJNAdMob()
    if (!bridge) {
      reject(new Error(isMobileTauri ? "bridge_not_ready" : "not_available"))
      return
    }

    if (getCoinAdViewsRecent(userId) >= COIN_AD_LIMIT) {
      reject(new Error("limit_reached"))
      return
    }

    const win = window as Window & {
      __admobCallback?: (success: boolean, error: string | null) => void
    }

    win.__admobCallback = (success: boolean, error: string | null) => {
      win.__admobCallback = undefined
      if (success) {
        recordAdView(userId)
        resolve()
      } else {
        reject(new Error(error ?? "ad_failed"))
      }
    }

    bridge.showRewardedAd()
  })
}

/** Preload next ad (call after the store tab mounts on mobile). */
export function preloadAd(): void {
  getJNAdMob()?.preload()
}
