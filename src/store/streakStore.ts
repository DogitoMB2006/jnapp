import { create } from "zustand"

interface StreakState {
  streak: number
  longestStreak: number
  loaded: boolean
  // Normal fire animation (streak continues / starts)
  showAnimation: boolean
  animationStreak: number
  // Break animation (slot-machine countdown)
  showBreakAnimation: boolean
  breakAnimationFromStreak: number
  setStreakResult: (streak: number, longestStreak: number) => void
  triggerAnimation: (streak: number) => void
  dismissAnimation: () => void
  triggerBreakAnimation: (fromStreak: number) => void
  dismissBreakAnimation: () => void
  reset: () => void
}

export const useStreakStore = create<StreakState>()((set) => ({
  streak: 0,
  longestStreak: 0,
  loaded: false,
  showAnimation: false,
  animationStreak: 0,
  showBreakAnimation: false,
  breakAnimationFromStreak: 0,

  setStreakResult: (streak, longestStreak) =>
    set({ streak, longestStreak, loaded: true }),

  triggerAnimation: (streak) =>
    set({ showAnimation: true, animationStreak: streak }),

  dismissAnimation: () => set({ showAnimation: false }),

  triggerBreakAnimation: (fromStreak) =>
    set({ showBreakAnimation: true, breakAnimationFromStreak: fromStreak }),

  dismissBreakAnimation: () => set({ showBreakAnimation: false }),

  reset: () =>
    set({
      streak: 0,
      longestStreak: 0,
      loaded: false,
      showAnimation: false,
      animationStreak: 0,
      showBreakAnimation: false,
      breakAnimationFromStreak: 0,
    }),
}))
