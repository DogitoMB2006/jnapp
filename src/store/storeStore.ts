import { create } from "zustand"
import insforge from "../lib/insforge"
import { applyTheme, DEFAULT_THEME } from "../lib/themes"
import type { ThemeId } from "../types"

interface StoreState {
  coins: number
  /** Set of purchased item IDs (themes etc.) */
  purchases: Set<string>
  equippedTheme: ThemeId
  loading: boolean

  fetchStore: (groupId: string) => Promise<void>
  buyTheme: (groupId: string, themeId: ThemeId, cost: number) => Promise<void>
  equipTheme: (groupId: string, themeId: ThemeId) => Promise<void>
  /** Called by realtime handler — apply theme locally without DB write. */
  syncTheme: (themeId: ThemeId) => void
}

export const useStoreStore = create<StoreState>()((set, get) => ({
  coins: 0,
  purchases: new Set<string>(["jnapp"]), // default always owned
  equippedTheme: DEFAULT_THEME.id,
  loading: true,

  fetchStore: async (groupId: string) => {
    set({ loading: true })
    try {
      // Ensure coins row exists
      await insforge.database
        .from("group_coins")
        .upsert({ group_id: groupId, amount: 0 }, { onConflict: "group_id", ignoreDuplicates: true })

      // Ensure equipped row exists
      await insforge.database
        .from("group_equipped")
        .upsert({ group_id: groupId, theme_id: "jnapp" }, { onConflict: "group_id", ignoreDuplicates: true })

      const [coinsRes, purchasesRes, equippedRes] = await Promise.all([
        insforge.database.from("group_coins").select("amount").eq("group_id", groupId).single(),
        insforge.database.from("group_purchases").select("item_id").eq("group_id", groupId),
        insforge.database.from("group_equipped").select("theme_id").eq("group_id", groupId).single(),
      ])

      const coins = (coinsRes.data as { amount: number } | null)?.amount ?? 0
      const boughtIds = ((purchasesRes.data as { item_id: string }[] | null) ?? []).map((r) => r.item_id)
      const equippedTheme = ((equippedRes.data as { theme_id: string } | null)?.theme_id ?? "jnapp") as ThemeId

      applyTheme(equippedTheme)

      set({
        coins,
        purchases: new Set(["jnapp", ...boughtIds]),
        equippedTheme,
        loading: false,
      })
    } catch (e) {
      console.error("[storeStore] fetchStore error:", e)
      set({ loading: false })
    }
  },

  buyTheme: async (groupId: string, themeId: ThemeId, cost: number) => {
    const { coins, purchases } = get()
    if (coins < cost) throw new Error("not_enough_coins")
    if (purchases.has(themeId)) throw new Error("already_owned")

    // Deduct coins
    const { error: coinsErr } = await insforge.database
      .from("group_coins")
      .update({ amount: coins - cost, updated_at: new Date().toISOString() })
      .eq("group_id", groupId)
    if (coinsErr) throw new Error(coinsErr.message)

    // Record purchase
    const { error: purchaseErr } = await insforge.database
      .from("group_purchases")
      .insert({ group_id: groupId, item_id: themeId, item_type: "theme" })
    if (purchaseErr) throw new Error(purchaseErr.message)

    set((s) => ({
      coins: coins - cost,
      purchases: new Set([...s.purchases, themeId]),
    }))
  },

  equipTheme: async (groupId: string, themeId: ThemeId) => {
    const { error } = await insforge.database
      .from("group_equipped")
      .upsert(
        { group_id: groupId, theme_id: themeId, updated_at: new Date().toISOString() },
        { onConflict: "group_id" }
      )
    if (error) throw new Error(error.message)

    applyTheme(themeId)
    set({ equippedTheme: themeId })
  },

  syncTheme: (themeId: ThemeId) => {
    applyTheme(themeId)
    set({ equippedTheme: themeId })
  },
}))
