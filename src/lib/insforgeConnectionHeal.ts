import insforge from "./insforge"

/**
 * Refresh session (new JWT) then reconnect WebSocket with updated auth.
 * Call after long idle, tab focus, or realtime disconnect.
 */
export const healInsforgeConnection = async () => {
  await insforge.auth.refreshSession().catch(() => undefined)
  await insforge.realtime.connect().catch(() => undefined)
}

export const runInsforgeConnectionHeal = () => {
  void healInsforgeConnection()
}
