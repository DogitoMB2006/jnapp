import type { PostComment, PostReaction, PostTargetType, Profile } from "../types"

export type PostInteractionsCacheEntry = {
  reactions: PostReaction[]
  comments: PostComment[]
  profiles: Record<string, Profile>
  fetchedAt: number
}

const cache = new Map<string, PostInteractionsCacheEntry>()

export const postInteractionsCacheKey = (
  targetType: PostTargetType,
  targetId: string,
) => `${targetType}:${targetId}`

export const getPostInteractionsCache = (
  targetType: PostTargetType,
  targetId: string,
): PostInteractionsCacheEntry | undefined => {
  return cache.get(postInteractionsCacheKey(targetType, targetId))
}

export const setPostInteractionsCache = (
  targetType: PostTargetType,
  targetId: string,
  entry: Omit<PostInteractionsCacheEntry, "fetchedAt">,
) => {
  cache.set(postInteractionsCacheKey(targetType, targetId), {
    ...entry,
    fetchedAt: Date.now(),
  })
}

export const patchPostInteractionsCache = (
  targetType: PostTargetType,
  targetId: string,
  patch: Partial<Pick<PostInteractionsCacheEntry, "reactions" | "comments" | "profiles">>,
) => {
  const key = postInteractionsCacheKey(targetType, targetId)
  const prev = cache.get(key)
  if (!prev) return
  cache.set(key, { ...prev, ...patch, fetchedAt: Date.now() })
}
