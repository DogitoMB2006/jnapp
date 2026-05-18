import { create } from "zustand"
import insforge from "../lib/insforge"

interface DiamondState {
  diamonds: number
  /** IDs of owned decoration items */
  ownedDecor: Set<string>
  /** Currently equipped decoration ID, null = none */
  equippedDecor: string | null
  loading: boolean

  fetchDiamonds: (userId: string) => Promise<void>
  earnDiamonds: (userId: string, amount: number) => Promise<void>
  buyDecoration: (userId: string, decorId: string, cost: number) => Promise<void>
  equipDecoration: (userId: string, decorId: string | null) => Promise<void>
}

async function ensureUserRow(userId: string) {
  const { error } = await insforge.database
    .from("user_diamonds")
    .insert({ user_id: userId, amount: 0 })
  if (error) {
    const msg = (error as { message?: string }).message ?? ""
    if (!msg.includes("23505") && !msg.includes("duplicate") && !msg.includes("unique")) {
      console.warn("[diamondStore] ensureUserRow:", msg)
    }
  }
}

export const useDiamondStore = create<DiamondState>()((set, get) => ({
  diamonds: 0,
  ownedDecor: new Set<string>(),
  equippedDecor: null,
  loading: true,

  fetchDiamonds: async (userId: string) => {
    set({ loading: true })
    try {
      await ensureUserRow(userId)

      const [diamondRes, purchasesRes] = await Promise.all([
        insforge.database
          .from("user_diamonds")
          .select("amount, equipped_decor")
          .eq("user_id", userId)
          .single(),
        insforge.database
          .from("user_decoration_purchases")
          .select("item_id")
          .eq("user_id", userId),
      ])

      const row = diamondRes.data as { amount: number; equipped_decor: string | null } | null
      const purchases = (purchasesRes.data as { item_id: string }[] | null) ?? []

      set({
        diamonds: row?.amount ?? 0,
        equippedDecor: row?.equipped_decor ?? null,
        ownedDecor: new Set(purchases.map((p) => p.item_id)),
        loading: false,
      })
    } catch (e) {
      console.error("[diamondStore] fetchDiamonds:", e)
      set({ loading: false })
    }
  },

  earnDiamonds: async (userId: string, amount: number) => {
    const newAmount = get().diamonds + amount
    const { error } = await insforge.database
      .from("user_diamonds")
      .update({ amount: newAmount, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
    if (error) throw new Error((error as { message?: string }).message ?? "earn_failed")
    set({ diamonds: newAmount })
  },

  buyDecoration: async (userId: string, decorId: string, cost: number) => {
    const { diamonds, ownedDecor } = get()
    if (diamonds < cost) throw new Error("not_enough_diamonds")
    if (ownedDecor.has(decorId)) throw new Error("already_owned")

    const newAmount = diamonds - cost

    const { error: coinsErr } = await insforge.database
      .from("user_diamonds")
      .update({ amount: newAmount, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
    if (coinsErr) throw new Error((coinsErr as { message?: string }).message ?? "deduct_failed")

    const { error: purchaseErr } = await insforge.database
      .from("user_decoration_purchases")
      .insert({ user_id: userId, item_id: decorId })
    if (purchaseErr) throw new Error((purchaseErr as { message?: string }).message ?? "purchase_failed")

    set((s) => ({
      diamonds: newAmount,
      ownedDecor: new Set([...s.ownedDecor, decorId]),
    }))
  },

  equipDecoration: async (userId: string, decorId: string | null) => {
    const updatedAt = new Date().toISOString()
    const [diamondsErr, profileErr] = await Promise.all([
      insforge.database
        .from("user_diamonds")
        .update({ equipped_decor: decorId, updated_at: updatedAt })
        .eq("user_id", userId),
      insforge.database
        .from("profiles")
        .update({ equipped_decor: decorId, updated_at: updatedAt })
        .eq("user_id", userId),
    ])
    if (diamondsErr.error) {
      throw new Error((diamondsErr.error as { message?: string }).message ?? "equip_failed")
    }
    if (profileErr.error) {
      throw new Error((profileErr.error as { message?: string }).message ?? "equip_profile_failed")
    }
    set({ equippedDecor: decorId })
  },
}))
