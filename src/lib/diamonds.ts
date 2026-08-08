/**
 * Diamonds are a paid premium currency.
 * They are NOT earned via ads. Client grant only after a verified purchase (IAP)
 * or admin credit. Until Play Billing is wired, do not grant diamonds from the UI.
 */

/** Placeholder pack ids for future Google Play Billing products. */
export type DiamondPackId = "diamonds_10" | "diamonds_50" | "diamonds_120"

export type DiamondPack = {
  id: DiamondPackId
  /** Amount granted after a successful verified purchase. */
  amount: number
  /** Display-only price string until Billing Client supplies localized price. */
  displayPrice: string
  /** Future Play product id (must match Play Console). */
  productId: string
  highlight?: boolean
}

/** Catalog shaped for the future shop; purchase is not live yet. */
export const DIAMOND_PACKS: readonly DiamondPack[] = [
  {
    id: "diamonds_10",
    amount: 10,
    displayPrice: "$0.99",
    productId: "diamonds_10",
  },
  {
    id: "diamonds_50",
    amount: 50,
    displayPrice: "$3.99",
    productId: "diamonds_50",
    highlight: true,
  },
  {
    id: "diamonds_120",
    amount: 120,
    displayPrice: "$7.99",
    productId: "diamonds_120",
  },
] as const

/**
 * Purchases are not enabled yet.
 * When live: open Billing flow, verify the receipt server-side, then credit diamonds through a protected RPC.
 */
export const DIAMONDS_IAP_ENABLED = false
