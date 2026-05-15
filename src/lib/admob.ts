import { isMobileTauri } from "./platform"

export const AD_COINS = 10
export const MAX_ADS_PER_DAY = 3

interface JNAdMob {
  showRewardedAd: () => void
  preload: () => void
}

interface AdMobWindow extends Window {
  JNAdMob?: JNAdMob
  __admobCallback?: (success: boolean, error: string | null) => void
}

declare const window: AdMobWindow

// ─── Daily view tracking (per user, resets each calendar day) ─────────────────

function todayKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `admob_views_${userId}_${today}`
}

export function getAdViewsToday(userId: string): number {
  const raw = localStorage.getItem(todayKey(userId))
  const n = parseInt(raw ?? "0", 10)
  return isNaN(n) ? 0 : n
}

function incrementAdViews(userId: string): number {
  const next = getAdViewsToday(userId) + 1
  localStorage.setItem(todayKey(userId), String(next))
  return next
}

export function adsAvailable(userId: string): boolean {
  return isMobileTauri && getAdViewsToday(userId) < MAX_ADS_PER_DAY
}

// ─── Ad bridge ────────────────────────────────────────────────────────────────

/**
 * Show a rewarded ad. Resolves when the user earns the reward.
 * Rejects with an Error if the ad isn't ready, fails, or the user
 * closes it without earning (error.message = "ad_not_ready" | "ad_failed" | etc.)
 */
export function watchRewardedAd(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.JNAdMob) {
      reject(new Error("not_available"))
      return
    }

    if (getAdViewsToday(userId) >= MAX_ADS_PER_DAY) {
      reject(new Error("daily_limit_reached"))
      return
    }

    // One-shot callback — cleaned up on either path
    window.__admobCallback = (success: boolean, error: string | null) => {
      window.__admobCallback = undefined
      if (success) {
        incrementAdViews(userId)
        resolve()
      } else {
        reject(new Error(error ?? "ad_failed"))
      }
    }

    window.JNAdMob.showRewardedAd()
  })
}

/** Preload next ad (call after the store tab mounts on mobile). */
export function preloadAd(): void {
  window.JNAdMob?.preload()
}
