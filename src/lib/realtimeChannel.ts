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
  const a = metaChannel.trim().toLowerCase()
  const b = subscribedChannel.trim().toLowerCase()
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
