import { useEffect, useState } from "react"
import {
  isAdMobBridgeReady,
  isCoinAdReady,
  isDiamondAdReady,
  isCoinAdLoading,
  isDiamondAdLoading,
} from "../lib/admobBridge"
import { isMobileTauri } from "../lib/platform"

type AdKind = "coin" | "diamond"

function isAdReady(kind: AdKind): boolean {
  return kind === "coin" ? isCoinAdReady() : isDiamondAdReady()
}

function isAdLoading(kind: AdKind): boolean {
  return kind === "coin" ? isCoinAdLoading() : isDiamondAdLoading()
}

/** Poll until Android bridge exists and the rewarded ad is loaded. */
export function useRewardedAdReady(kind: AdKind, active = true) {
  const [bridgeReady, setBridgeReady] = useState(() => isAdMobBridgeReady())
  const [adReady, setAdReady] = useState(() => isAdReady(kind))
  const [adLoading, setAdLoading] = useState(() => isAdLoading(kind))

  useEffect(() => {
    if (!active || !isMobileTauri) {
      setBridgeReady(false)
      setAdReady(false)
      setAdLoading(false)
      return
    }

    const tick = () => {
      setBridgeReady(isAdMobBridgeReady())
      setAdReady(isAdReady(kind))
      setAdLoading(isAdLoading(kind))
    }

    tick()
    const id = setInterval(tick, 400)
    return () => clearInterval(id)
  }, [active, kind])

  return { bridgeReady, adReady, adLoading }
}

/** @deprecated Use useRewardedAdReady */
export function useAdMobBridgeReady(active = true): boolean {
  const { bridgeReady } = useRewardedAdReady("coin", active)
  return bridgeReady
}
