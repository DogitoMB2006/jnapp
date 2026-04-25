import insforge from "./insforge"
import { healInsforgeConnection as runHeal } from "./insforgeTauriSession"

/**
 * Refresh session (new JWT) then reconnect WebSocket with updated auth.
 * Call after long idle, tab focus, or realtime disconnect.
 */
export const healInsforgeConnection = async () => {
  await runHeal(insforge)
}

export const runInsforgeConnectionHeal = () => {
  void healInsforgeConnection()
}
