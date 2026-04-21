/** Notification rows vs section tables — lista uses `content`, notifications use `message` + `user_id` + `read`. */
export const isLikelyNotificationRealtimeRow = (row: Record<string, unknown>): boolean => {
  if (typeof row.message !== "string") return false
  if (typeof row.user_id !== "string") return false
  if (!("read" in row)) return false
  return typeof row.read === "boolean"
}
