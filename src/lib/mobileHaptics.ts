/**
 * Short haptic for tab changes / success paths (Vibration API).
 * Respects `navigator.vibrate` availability; no-ops on desktop and iOS WebKit (no vibrate).
 */
export const lightHaptic = () => {
  if (typeof navigator === "undefined" || !navigator.vibrate) {
    return
  }
  try {
    navigator.vibrate(12)
  } catch {
    /* */
  }
}
