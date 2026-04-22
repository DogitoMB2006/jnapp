import { create } from "zustand";
import { persist } from "zustand/middleware";
import insforge from "../lib/insforge";
import type { Profile } from "../types";
// Lazily imported to avoid circular deps
let _clearGroup: (() => void) | null = null;
export function registerClearGroup(fn: () => void) { _clearGroup = fn; }

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      loading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (loading) => set({ loading }),
      logout: async () => {
        await insforge.auth.signOut();
        set({ user: null, profile: null });
        _clearGroup?.();
      },
      fetchProfile: async (userId: string) => {
        const { data } = await insforge.database
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (data) set({ profile: data as Profile });
      },
    }),
    {
      name: "jnapp-auth",
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);
