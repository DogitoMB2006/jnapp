import { useEffect, useRef } from "react"
import insforge from "../lib/insforge"
import { healInsforgeConnection } from "../lib/insforgeConnectionHeal"
import { parseTableChangePayload } from "../lib/realtimePayload"
import { useStoreStore } from "../store/storeStore"
import type { ThemeId } from "../types"
import { useRealtime } from "./useRealtime"
import { useSectionDataSync } from "./useSectionDataSync"

/**
 * Keeps group theme in sync: realtime events + REST poll when socket lags or drops.
 */
export const useGroupThemeSync = (groupId: string | undefined) => {
  const { applyRemoteTheme, refreshEquippedThemeFromDb } = useStoreStore()
  const groupIdRef = useRef(groupId)
  groupIdRef.current = groupId

  useEffect(() => {
    if (!groupId) return
    void insforge.realtime.connect().catch(() => undefined)
    void healInsforgeConnection()
  }, [groupId])

  useSectionDataSync(
    () => {
      const id = groupIdRef.current
      if (id) void refreshEquippedThemeFromDb(id)
    },
    {
      enabled: !!groupId,
      fastPollMs: 800,
      slowPollMs: 4_000,
      backgroundPollMs: 2_000,
    }
  )

  useRealtime(
    groupId ? "group_equipped" : "__none__",
    (payload) => {
      const gid = groupIdRef.current
      if (!gid) return
      const msg = parseTableChangePayload(payload)
      if (!msg || (msg.op !== "INSERT" && msg.op !== "UPDATE")) return
      const row = msg.record
      const rowGroupId = typeof row.group_id === "string" ? row.group_id : undefined
      const themeId = typeof row.theme_id === "string" ? row.theme_id : undefined
      const updatedAt =
        typeof row.updated_at === "string" ? row.updated_at : undefined
      if (!rowGroupId || rowGroupId !== gid || !themeId) return
      applyRemoteTheme(themeId as ThemeId, updatedAt)
    },
    { events: ["theme_equipped", "INSERT", "UPDATE"] }
  )
}
