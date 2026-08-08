import { create } from "zustand"
import insforge from "../lib/insforge"
import type { DecorationTarget } from "../components/sections/tienda/decorations/decorationDefs"

interface DiamondState {
  diamonds: number
  /** IDs of owned decoration items */
  ownedDecor: Set<string>
  /** Currently equipped decoration ID, null = none */
  equippedDecor: string | null
  equippedCardDecor: string | null
  loading: boolean

  fetchDiamonds: (userId: string) => Promise<void>
  buyDecoration: (decorId: string) => Promise<void>
  equipDecoration: (decorId: string, target: DecorationTarget) => Promise<void>
}

function rpcError(error: unknown, fallback: string): Error {
  const message = (error as { message?: string } | null)?.message ?? fallback
  for (const code of ["not_enough_diamonds", "already_owned", "decoration_not_owned", "invalid_decoration"]) {
    if (message.includes(code)) return new Error(code)
  }
  return new Error(message)
}

export const useDiamondStore = create<DiamondState>()((set, get) => ({
  diamonds: 0,
  ownedDecor: new Set<string>(),
  equippedDecor: null,
  equippedCardDecor: null,
  loading: true,

  fetchDiamonds: async (userId: string) => {
    set({ loading: true })
    try {
      const [diamondRes, purchasesRes] = await Promise.all([
        insforge.database
          .from("user_diamonds")
          .select("amount, equipped_decor, equipped_card_decor")
          .eq("user_id", userId)
          .single(),
        insforge.database
          .from("user_decoration_purchases")
          .select("item_id")
          .eq("user_id", userId),
      ])

      const row = diamondRes.data as {
        amount: number
        equipped_decor: string | null
        equipped_card_decor: string | null
      } | null
      const purchases = (purchasesRes.data as { item_id: string }[] | null) ?? []

      set({
        diamonds: row?.amount ?? 0,
        equippedDecor: row?.equipped_decor ?? null,
        equippedCardDecor: row?.equipped_card_decor ?? null,
        ownedDecor: new Set(purchases.map((p) => p.item_id)),
        loading: false,
      })
    } catch (e) {
      console.error("[diamondStore] fetchDiamonds:", e)
      set({ loading: false })
    }
  },

  buyDecoration: async (decorId: string) => {
    const { ownedDecor } = get()
    if (ownedDecor.has(decorId)) throw new Error("already_owned")

    const { data, error } = await insforge.database.rpc("purchase_decoration", { p_item_id: decorId })
    if (error) throw rpcError(error, "purchase_failed")
    const result = data as { amount?: number } | null

    set((s) => ({
      diamonds: result?.amount ?? s.diamonds,
      ownedDecor: new Set([...s.ownedDecor, decorId]),
    }))
  },

  equipDecoration: async (decorId: string, target: DecorationTarget) => {
    const { error } = await insforge.database.rpc("equip_decoration", { p_item_id: decorId })
    if (error) throw rpcError(error, "equip_failed")
    set(target === "card" ? { equippedCardDecor: decorId } : { equippedDecor: decorId })
  },
}))
