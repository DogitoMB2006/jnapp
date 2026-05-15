/** Strip InsForge socket prefix so `realtime:group_equipped` matches subscribe `group_equipped`. */
const normalizeRealtimeChannel = (ch: string) => {
  const t = ch.trim().toLowerCase()
  const prefix = "realtime:"
  return t.startsWith(prefix) ? t.slice(prefix.length) : t
}

/**
 * InsForge delivers `meta.channel` on socket payloads; compare in a way that survives
 * UUID casing and minor formatting differences.
 */
export const channelsMatch = (
  metaChannel: string | undefined,
  subscribedChannel: string
): boolean => {
  if (metaChannel === undefined || metaChannel === "") {
    return true
  }
  const a = normalizeRealtimeChannel(metaChannel)
  const b = normalizeRealtimeChannel(subscribedChannel)
  if (a === b) {
    return true
  }
  const prefix = "notifications:"
  if (subscribedChannel.startsWith(prefix) && metaChannel.startsWith(prefix)) {
    const sa = subscribedChannel.slice(prefix.length).trim().toLowerCase()
    const ma = metaChannel.slice(prefix.length).trim().toLowerCase()
    return sa === ma
  }
  return false
}
