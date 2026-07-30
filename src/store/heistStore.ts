import { create } from "zustand"
import insforge from "../lib/insforge"
import type { Heist, HeistProgression, HeistStatus } from "../types"
import { useAuthStore } from "./authStore"

export const HEIST_JOIN_WINDOW_MS = 60_000
export const HEIST_XP_PER_LEVEL = 100

const ACTIVE_STATUSES: readonly HeistStatus[] = ["starter_turn", "partner_waiting", "partner_turn"]
const TERMINAL_STATUSES: readonly HeistStatus[] = ["completed", "expired", "cancelled"]

export const isHeistActive = (heist: Heist | null): heist is Heist =>
  !!heist && ACTIVE_STATUSES.includes(heist.status)

export const rewardForLevel = (level: number) => ({
  coins: Math.min(50, 10 + (Math.max(1, level) - 1) * 2),
  xp: Math.min(50, 25 + (Math.max(1, level) - 1) * 5),
})

export interface HeistResult {
  heist: Heist
  success: boolean
  leveledUp: boolean
  settledLocally: boolean
}

interface HeistState {
  activeHeist: Heist | null
  progression: HeistProgression | null
  loading: boolean
  localProgress: number
  lastResult: HeistResult | null
  fetchState: (groupId: string, includeRecentResult?: boolean) => Promise<void>
  fetchSession: (sessionId: string, resetLocalProgress?: boolean) => Promise<void>
  startHeist: (groupId: string) => Promise<Heist>
  joinHeist: (sessionId: string) => Promise<void>
  registerAction: (amount?: number) => Promise<void>
  expireHeist: (sessionId: string) => Promise<void>
  applyRemote: (row: Heist, localUserId: string, settledLocally?: boolean) => void
  clearResult: () => void
}

const firstRow = <T>(data: unknown): T | null => {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null
  return data && typeof data === "object" ? data as T : null
}

let fetchSequence = 0
let reconciliationSequence = 0

const errorCode = (error: unknown): string => {
  const message = error && typeof error === "object" && "message" in error
    ? String((error as { message?: unknown }).message)
    : String(error ?? "")
  return [
    "heist_cooldown",
    "heist_in_progress",
    "heist_partner_required",
    "heist_wrong_turn",
    "heist_not_partner",
    "heist_not_found",
  ].find((code) => message.includes(code)) ?? "heist_failed"
}

const roleProgress = (heist: Heist, userId: string): number =>
  heist.starter_id === userId ? heist.starter_progress : heist.partner_progress

const seenResultsKey = (userId: string) => `heist_seen_results_${userId}`

const getSeenResults = (userId: string): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(seenResultsKey(userId)) ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

const hasSeenResult = (userId: string, sessionId: string) =>
  getSeenResults(userId).includes(sessionId)

const rememberSeenResult = (userId: string, sessionId: string) => {
  const ids = getSeenResults(userId).filter((id) => id !== sessionId)
  try {
    localStorage.setItem(seenResultsKey(userId), JSON.stringify([...ids, sessionId].slice(-30)))
  } catch {
    // Result acknowledgement is best-effort when storage is unavailable.
  }
}

const resultFor = (
  heist: Heist,
  progression: HeistProgression | null,
  settledLocally: boolean,
): HeistResult | null => {
  if (!TERMINAL_STATUSES.includes(heist.status)) return null
  return {
    heist,
    success: heist.status === "completed",
    leveledUp: heist.status === "completed" && !!progression && progression.level > heist.level,
    settledLocally,
  }
}

export const useHeistStore = create<HeistState>()((set, get) => ({
  activeHeist: null,
  progression: null,
  loading: false,
  localProgress: 0,
  lastResult: null,

  fetchState: async (groupId, includeRecentResult = false) => {
    const sequence = ++fetchSequence
    const reconciliationAtStart = reconciliationSequence
    set({ loading: true })
    try {
      let sessionQuery = insforge.database
        .from("heist_sessions")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(1)
      if (!includeRecentResult) sessionQuery = sessionQuery.in("status", [...ACTIVE_STATUSES])

      const [progressResponse, sessionResponse] = await Promise.all([
        insforge.database.from("heist_progression").select("*").eq("group_id", groupId).maybeSingle(),
        sessionQuery,
      ])
      if (sequence !== fetchSequence) return
      if (progressResponse.error) throw progressResponse.error
      if (sessionResponse.error) throw sessionResponse.error
      const progression = firstRow<HeistProgression>(progressResponse.data)
      const heist = firstRow<Heist>(sessionResponse.data)
      set((state) => ({
        progression,
        activeHeist: reconciliationAtStart !== reconciliationSequence
          ? state.activeHeist
          : isHeistActive(heist) && state.lastResult?.heist.id !== heist.id
          ? state.activeHeist?.id === heist.id && state.activeHeist.revision > heist.revision
            ? state.activeHeist
            : heist
          : null,
        localProgress: 0,
        loading: false,
        lastResult: state.lastResult?.success && progression
          ? {
              ...state.lastResult,
              leveledUp: progression.level > state.lastResult.heist.level,
            }
          : state.lastResult,
      }))
      if (isHeistActive(heist) && new Date(heist.expires_at).getTime() <= Date.now()) {
        await get().expireHeist(heist.id)
      } else if (
        includeRecentResult
        && heist
        && TERMINAL_STATUSES.includes(heist.status)
        && new Date(heist.completed_at ?? 0).getTime() >= Date.now() - 5 * 60_000
      ) {
        const userId = useAuthStore.getState().user?.id
        if (userId) get().applyRemote(heist, userId)
      }
    } catch (error) {
      console.error("[heistStore] fetchState:", error)
      set({ loading: false })
    }
  },

  fetchSession: async (sessionId, resetLocalProgress = false) => {
    const { data, error } = await insforge.database
      .from("heist_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle()
    if (error) {
      console.warn("[heistStore] fetchSession:", error.message)
      return
    }
    const heist = firstRow<Heist>(data)
    const userId = useAuthStore.getState().user?.id
    if (!heist || !userId) return
    if (resetLocalProgress || get().activeHeist?.id !== heist.id) {
      set({ localProgress: roleProgress(heist, userId) })
    }
    get().applyRemote(heist, userId)
  },

  startHeist: async (groupId) => {
    if (isHeistActive(get().activeHeist)) throw new Error("heist_in_progress")
    const { data, error } = await insforge.database.rpc("start_coop_heist", { p_group_id: groupId })
    if (error) throw new Error(errorCode(error))
    const heist = firstRow<Heist>(data)
    if (!heist) throw new Error("heist_failed")
    set((state) => ({
      activeHeist: state.activeHeist?.id === heist.id && state.activeHeist.revision > heist.revision
        ? state.activeHeist
        : heist,
      localProgress: 0,
      lastResult: null,
    }))
    return heist
  },

  joinHeist: async (sessionId) => {
    const { data, error } = await insforge.database.rpc("join_coop_heist", { p_session_id: sessionId })
    if (error) throw new Error(errorCode(error))
    const heist = firstRow<Heist>(data)
    const userId = useAuthStore.getState().user?.id
    if (heist && userId) get().applyRemote(heist, userId)
  },

  registerAction: async (amount = 1) => {
    const heist = get().activeHeist
    if (!heist) return
    const userId = useAuthStore.getState().user?.id
    if (!userId) return
    const goal = heist.starter_id === userId ? heist.starter_goal : heist.partner_goal
    set((state) => ({ localProgress: Math.min(goal, state.localProgress + amount) }))

    const { data, error } = await insforge.database.rpc("advance_coop_heist", {
      p_session_id: heist.id,
      p_amount: amount,
    })
    if (error) {
      console.warn("[heistStore] registerAction:", error.message)
      void get().fetchSession(heist.id, true)
      return
    }
    const row = firstRow<Heist>(data)
    if (row) get().applyRemote(row, userId, row.status === "completed")
  },

  expireHeist: async (sessionId) => {
    const { data, error } = await insforge.database.rpc("expire_coop_heist", { p_session_id: sessionId })
    if (error) {
      console.warn("[heistStore] expireHeist:", error.message)
      return
    }
    const row = firstRow<Heist>(data)
    const userId = useAuthStore.getState().user?.id
    if (row && userId) get().applyRemote(row, userId, row.status === "expired")
  },

  applyRemote: (row, localUserId, settledLocally = false) => {
    reconciliationSequence += 1
    const { activeHeist, lastResult, progression } = get()
    if (TERMINAL_STATUSES.includes(row.status)) {
      if (hasSeenResult(localUserId, row.id)) {
        if (activeHeist?.id === row.id) set({ activeHeist: null, localProgress: 0 })
        return
      }
      if (lastResult?.heist.id !== row.id) {
        set({
          activeHeist: activeHeist?.id === row.id ? null : activeHeist,
          localProgress: 0,
          lastResult: resultFor(row, progression, settledLocally),
        })
        void get().fetchState(row.group_id)
      }
      return
    }

    if (lastResult?.heist.id === row.id) return
    if (activeHeist && activeHeist.id !== row.id) return
    if (activeHeist?.id === row.id && row.revision < activeHeist.revision) {
      return
    }
    const remoteProgress = roleProgress(row, localUserId)
    set((state) => ({
      activeHeist: row,
      localProgress: Math.max(state.localProgress, remoteProgress),
    }))
  },

  clearResult: () => {
    const result = get().lastResult
    const userId = useAuthStore.getState().user?.id
    if (result && userId) rememberSeenResult(userId, result.heist.id)
    set({ lastResult: null })
  },
}))
