import { create } from "zustand"
import type { Section } from "../types"

interface NavState {
  pendingSection: Section | null
  pendingItemId: string | null
  navigateTo: (section: Section, itemId?: string | null) => void
  clearPendingSection: () => void
  clearPendingItemId: () => void
}

export const useNavigationStore = create<NavState>()((set) => ({
  pendingSection: null,
  pendingItemId: null,
  navigateTo: (section, itemId) =>
    set({ pendingSection: section, pendingItemId: itemId ?? null }),
  clearPendingSection: () => set({ pendingSection: null }),
  clearPendingItemId: () => set({ pendingItemId: null }),
}))
