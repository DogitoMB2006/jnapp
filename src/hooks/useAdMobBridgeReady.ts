import { useEffect, useState } from "react"
import { isAdMobBridgeReady } from "../lib/admobBridge"
import { isMobileTauri } from "../lib/platform"

/** Poll until Android injects JNAdMob into the WebView. */
export function useAdMobBridgeReady(active = true): boolean {
  const [ready, setReady] = useState(() => isAdMobBridgeReady())

  useEffect(() => {
    if (!active || !isMobileTauri) {
      setReady(false)
      return
    }

    setReady(isAdMobBridgeReady())
    const id = setInterval(() => {
      const next = isAdMobBridgeReady()
      setReady(next)
    }, 400)

    return () => clearInterval(id)
  }, [active])

  return ready
}
