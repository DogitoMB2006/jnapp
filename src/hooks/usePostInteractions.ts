import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import insforge from "../lib/insforge"
import {
  getPostInteractionsCache,
  patchPostInteractionsCache,
  setPostInteractionsCache,
} from "../lib/postInteractionsCache"
import { subscribePostInteractionRealtime } from "../lib/postInteractionsRealtime"
import { notifyPartnerInteraction } from "../lib/notifyPartner"
import { parseTableChangePayload } from "../lib/realtimePayload"
import { isLikelyNotificationRealtimeRow } from "../lib/realtimeGuards"
import type {
  PostComment,
  PostCommentNode,
  PostReaction,
  PostTargetType,
  Profile,
} from "../types"

type ReactionSummary = {
  emoji: string
  count: number
  reactedByMe: boolean
}

const DEFAULT_EMOJIS = ["❤️", "🔥", "😂", "😍", "😮", "👏", "😭", "👍"]

type UsePostInteractionsArgs = {
  targetType: PostTargetType
  targetId: string
  groupId?: string
  userId?: string
  /** When false, no network fetch until user interaction or visibility. */
  shouldLoad?: boolean
}

const sanitizeEmojiInput = (raw: string): string => raw.trim().slice(0, 8)

const matchesTarget = (
  row: Record<string, unknown>,
  targetType: PostTargetType,
  targetId: string,
  groupId?: string,
) => {
  const rowType = typeof row.target_type === "string" ? row.target_type : ""
  const rowId =
    typeof row.target_id === "string"
      ? row.target_id
      : row.target_id != null
        ? String(row.target_id)
        : ""
  if (rowType !== targetType || rowId !== targetId) return false
  if (groupId && typeof row.group_id === "string" && row.group_id !== groupId) {
    return false
  }
  return true
}

export const usePostInteractions = ({
  targetType,
  targetId,
  groupId,
  userId,
  shouldLoad = false,
}: UsePostInteractionsArgs) => {
  const [reactions, setReactions] = useState<PostReaction[]>([])
  const [comments, setComments] = useState<PostComment[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const profilesRef = useRef(profiles)
  profilesRef.current = profiles
  const fetchGenRef = useRef(0)

  const isEnabled = Boolean(groupId && targetId)

  const syncCache = useCallback(
    (
      nextReactions: PostReaction[],
      nextComments: PostComment[],
      nextProfiles: Record<string, Profile>,
    ) => {
      setPostInteractionsCache(targetType, targetId, {
        reactions: nextReactions,
        comments: nextComments,
        profiles: nextProfiles,
      })
    },
    [targetType, targetId],
  )

  const loadProfiles = useCallback(async (ids: string[], options?: { force?: boolean }) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (!uniqueIds.length) return
    const idsToLoad = options?.force
      ? uniqueIds
      : uniqueIds.filter((id) => !profilesRef.current[id])
    if (!idsToLoad.length) return

    const { data, error } = await insforge.database
      .from("profiles")
      .select("*")
      .in("user_id", idsToLoad)
    if (error || !data) return

    const next: Record<string, Profile> = {}
    ;(data as Profile[]).forEach((profile) => {
      next[profile.user_id] = profile
    })
    setProfiles((prev) => {
      const merged = { ...prev, ...next }
      patchPostInteractionsCache(targetType, targetId, { profiles: merged })
      return merged
    })
  }, [targetType, targetId])

  const fetchAll = useCallback(async (opts?: { silent?: boolean }) => {
    if (!isEnabled) return

    const gen = ++fetchGenRef.current
    const cached = getPostInteractionsCache(targetType, targetId)
    if (cached) {
      setReactions(cached.reactions)
      setComments(cached.comments)
      setProfiles(cached.profiles)
      setHasLoaded(true)
    } else if (!opts?.silent) {
      setLoading(true)
    }

    const [reactionRes, commentRes] = await Promise.all([
      insforge.database
        .from("post_reactions")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId),
      insforge.database
        .from("post_comments")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true }),
    ])

    if (gen !== fetchGenRef.current) return

    let nextReactions: PostReaction[] = cached?.reactions ?? []
    let nextComments: PostComment[] = cached?.comments ?? []
    const nextProfiles: Record<string, Profile> = { ...profilesRef.current }

    if (!reactionRes.error && reactionRes.data) {
      nextReactions = reactionRes.data as PostReaction[]
      setReactions(nextReactions)
      const ids = nextReactions.map((row) => row.user_id)
      const uniqueIds = [...new Set(ids.filter(Boolean))]
      const missingIds = uniqueIds.filter((id) => !nextProfiles[id])
      if (missingIds.length) {
        const { data, error } = await insforge.database
          .from("profiles")
          .select("*")
          .in("user_id", missingIds)
        if (gen !== fetchGenRef.current) return
        if (!error && data) {
          ;(data as Profile[]).forEach((profile) => {
            nextProfiles[profile.user_id] = profile
          })
        }
      }
    }
    if (!commentRes.error && commentRes.data) {
      nextComments = commentRes.data as PostComment[]
      setComments(nextComments)
      const ids = [...new Set(nextComments.map((row) => row.user_id).filter(Boolean))]
      if (ids.length) {
        const { data, error } = await insforge.database
          .from("profiles")
          .select("*")
          .in("user_id", ids)
        if (gen !== fetchGenRef.current) return
        if (!error && data) {
          ;(data as Profile[]).forEach((profile) => {
            nextProfiles[profile.user_id] = profile
          })
        }
      }
    }

    setProfiles(nextProfiles)
    syncCache(nextReactions, nextComments, nextProfiles)
    setHasLoaded(true)
    setLoading(false)
  }, [isEnabled, targetType, targetId, syncCache])

  const ensureLoaded = useCallback(async () => {
    if (loading || hasLoaded) return
    await fetchAll()
  }, [fetchAll, hasLoaded, loading])

  useEffect(() => {
    if (!shouldLoad || !isEnabled) return
    void fetchAll()
  }, [shouldLoad, isEnabled, fetchAll])

  useEffect(() => {
    if (!shouldLoad) return
    const cached = getPostInteractionsCache(targetType, targetId)
    if (cached && !hasLoaded) {
      setReactions(cached.reactions)
      setComments(cached.comments)
      setProfiles(cached.profiles)
      setHasLoaded(true)
    }
  }, [shouldLoad, targetType, targetId, hasLoaded])

  const updateReactions = useCallback(
    (updater: (prev: PostReaction[]) => PostReaction[]) => {
      setReactions((prev) => {
        const next = updater(prev)
        patchPostInteractionsCache(targetType, targetId, { reactions: next })
        return next
      })
    },
    [targetType, targetId],
  )

  const updateComments = useCallback(
    (updater: (prev: PostComment[]) => PostComment[]) => {
      setComments((prev) => {
        const next = updater(prev)
        patchPostInteractionsCache(targetType, targetId, { comments: next })
        return next
      })
    },
    [targetType, targetId],
  )

  // Live partner comments / reactions while the app is open
  useEffect(() => {
    if (!isEnabled) return

    const applyPayload = (
      channel: "post_comments" | "post_reactions",
      payload: unknown,
    ) => {
      const msg = parseTableChangePayload(payload)
      if (!msg) return

      if (msg.op === "DELETE") {
        const id = msg.id
        if (!id) return
        // DELETE may only include id; drop by id for this post's lists
        if (channel === "post_comments") {
          if (matchesTarget(msg.record, targetType, targetId, groupId) || msg.record.id) {
            // Prefer scoped delete when target fields present; else id-only delete if known
            if (
              msg.record.target_type != null ||
              msg.record.target_id != null
            ) {
              if (!matchesTarget(msg.record, targetType, targetId, groupId)) return
            }
            updateComments((prev) => {
              if (!prev.some((c) => c.id === id)) return prev
              return prev.filter((c) => c.id !== id)
            })
          }
        } else {
          if (
            msg.record.target_type != null ||
            msg.record.target_id != null
          ) {
            if (!matchesTarget(msg.record, targetType, targetId, groupId)) return
          }
          updateReactions((prev) => {
            if (!prev.some((r) => r.id === id)) return prev
            return prev.filter((r) => r.id !== id)
          })
        }
        setHasLoaded(true)
        return
      }

      const row = msg.record
      if (isLikelyNotificationRealtimeRow(row)) return
      if (!matchesTarget(row, targetType, targetId, groupId)) return

      if (channel === "post_comments") {
        const comment = row as unknown as PostComment
        if (!comment.id) return
        if (msg.op === "INSERT") {
          updateComments((prev) =>
            prev.some((c) => c.id === comment.id) ? prev : [...prev, comment],
          )
          if (comment.user_id) void loadProfiles([comment.user_id])
        } else if (msg.op === "UPDATE") {
          updateComments((prev) =>
            prev.map((c) => (c.id === comment.id ? { ...c, ...comment } : c)),
          )
        }
      } else {
        const reaction = row as unknown as PostReaction
        if (!reaction.id) return
        if (msg.op === "INSERT") {
          updateReactions((prev) =>
            prev.some((r) => r.id === reaction.id) ? prev : [...prev, reaction],
          )
        } else if (msg.op === "UPDATE") {
          updateReactions((prev) =>
            prev.map((r) => (r.id === reaction.id ? { ...r, ...reaction } : r)),
          )
        }
      }
      setHasLoaded(true)
    }

    return subscribePostInteractionRealtime(applyPayload, {
      onReconnect: () => {
        void fetchAll({ silent: true })
      },
    })
  }, [
    isEnabled,
    targetType,
    targetId,
    groupId,
    updateComments,
    updateReactions,
    loadProfiles,
    fetchAll,
  ])

  const reactionsSummary = useMemo<ReactionSummary[]>(() => {
    const map = new Map<string, ReactionSummary>()
    for (const row of reactions) {
      const existing = map.get(row.emoji)
      if (!existing) {
        map.set(row.emoji, {
          emoji: row.emoji,
          count: 1,
          reactedByMe: row.user_id === userId,
        })
        continue
      }
      existing.count += 1
      existing.reactedByMe = existing.reactedByMe || row.user_id === userId
      map.set(row.emoji, existing)
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [reactions, userId])

  const commentsCount = comments.length

  const commentTree = useMemo<PostCommentNode[]>(() => {
    const byParent = new Map<string | null, PostCommentNode[]>()
    for (const comment of comments) {
      const node: PostCommentNode = {
        ...comment,
        replies: [],
        author: profiles[comment.user_id],
      }
      const bucket = byParent.get(comment.parent_comment_id) ?? []
      bucket.push(node)
      byParent.set(comment.parent_comment_id, bucket)
    }

    const build = (parentId: string | null): PostCommentNode[] => {
      const nodes = byParent.get(parentId) ?? []
      return nodes.map((node) => ({
        ...node,
        replies: build(node.id),
      }))
    }
    return build(null)
  }, [comments, profiles])

  const toggleReaction = useCallback(async (emojiInput: string) => {
    const emoji = sanitizeEmojiInput(emojiInput)
    if (!emoji || !groupId || !userId || !targetId) return

    if (!hasLoaded) await ensureLoaded()

    const existing = reactions.find(
      (row) => row.user_id === userId && row.emoji === emoji,
    )
    if (existing) {
      updateReactions((prev) => prev.filter((item) => item.id !== existing.id))
      const { error } = await insforge.database
        .from("post_reactions")
        .delete()
        .eq("id", existing.id)
      if (error) {
        toast.error("No se pudo quitar la reacción")
        await fetchAll({ silent: true })
      }
      return
    }

    const optimisticId = `optimistic-${emoji}-${Date.now()}`
    const optimistic: PostReaction = {
      id: optimisticId,
      group_id: groupId,
      target_type: targetType,
      target_id: targetId,
      user_id: userId,
      emoji,
      created_at: new Date().toISOString(),
    }
    updateReactions((prev) => [...prev, optimistic])

    const { data, error } = await insforge.database
      .from("post_reactions")
      .insert([{
        group_id: groupId,
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
        emoji,
      }])
      .select("*")

    if (error || !data?.length) {
      updateReactions((prev) => prev.filter((item) => item.id !== optimisticId))
      toast.error("No se pudo guardar la reacción")
      return
    }

    const created = data[0] as PostReaction
    updateReactions((prev) =>
      prev
        .filter((item) => item.id !== optimisticId)
        .concat(prev.some((item) => item.id === created.id) ? [] : [created]),
    )
    void notifyPartnerInteraction({ actorUserId: userId, type: "reaction", targetType, targetId, emoji })
  }, [groupId, userId, targetId, reactions, targetType, fetchAll, hasLoaded, ensureLoaded, updateReactions])

  const addComment = useCallback(async (content: string, parentCommentId?: string | null) => {
    const text = content.trim()
    if (!text || !groupId || !userId || !targetId) return false
    if (savingComment) return false

    if (!hasLoaded) await ensureLoaded()

    setSavingComment(true)
    const optimisticId = `optimistic-comment-${Date.now()}`
    const optimistic: PostComment = {
      id: optimisticId,
      group_id: groupId,
      target_type: targetType,
      target_id: targetId,
      user_id: userId,
      parent_comment_id: parentCommentId ?? null,
      content: text,
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    updateComments((prev) => [...prev, optimistic])

    const { data, error } = await insforge.database
      .from("post_comments")
      .insert([{
        group_id: groupId,
        target_type: targetType,
        target_id: targetId,
        user_id: userId,
        parent_comment_id: parentCommentId ?? null,
        content: text,
      }])
      .select("*")

    setSavingComment(false)

    if (error || !data?.length) {
      updateComments((prev) => prev.filter((item) => item.id !== optimisticId))
      toast.error("No se pudo publicar el comentario")
      return false
    }

    const created = data[0] as PostComment
    updateComments((prev) =>
      prev
        .filter((item) => item.id !== optimisticId)
        .concat(prev.some((item) => item.id === created.id) ? [] : [created]),
    )
    void loadProfiles([created.user_id])
    void notifyPartnerInteraction({ actorUserId: userId, type: "comment", targetType, targetId })
    return true
  }, [groupId, userId, targetId, savingComment, targetType, loadProfiles, hasLoaded, ensureLoaded, updateComments])

  const editComment = useCallback(async (commentId: string, content: string) => {
    const text = content.trim()
    if (!text || !commentId || !userId) return false
    const current = comments.find((row) => row.id === commentId)
    if (!current || current.user_id !== userId) return false

    const previousContent = current.content
    updateComments((prev) =>
      prev.map((row) =>
        row.id === commentId
          ? {
              ...row,
              content: text,
              updated_at: new Date().toISOString(),
            }
          : row,
      ),
    )

    const { data, error } = await insforge.database
      .from("post_comments")
      .update({
        content: text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", userId)
      .select("*")

    if (error || !data?.length) {
      updateComments((prev) =>
        prev.map((row) =>
          row.id === commentId
            ? {
                ...row,
                content: previousContent,
              }
            : row,
        ),
      )
      toast.error("No se pudo editar el comentario")
      return false
    }

    const updated = data[0] as PostComment
    updateComments((prev) => prev.map((row) => (row.id === commentId ? updated : row)))
    return true
  }, [comments, userId, updateComments])

  const deleteComment = useCallback(async (commentId: string) => {
    if (!commentId || !userId) return false
    const current = comments.find((row) => row.id === commentId)
    if (!current || current.user_id !== userId) return false

    const descendants = new Set<string>([commentId])
    let changed = true
    while (changed) {
      changed = false
      for (const row of comments) {
        if (row.parent_comment_id && descendants.has(row.parent_comment_id) && !descendants.has(row.id)) {
          descendants.add(row.id)
          changed = true
        }
      }
    }
    const snapshot = comments
    updateComments((prev) => prev.filter((row) => !descendants.has(row.id)))

    const { error } = await insforge.database
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      updateComments(() => snapshot)
      toast.error("No se pudo eliminar el comentario")
      return false
    }

    return true
  }, [comments, userId, updateComments])

  return {
    loading,
    savingComment,
    hasLoaded,
    defaultEmojis: DEFAULT_EMOJIS,
    reactionsSummary,
    commentsCount,
    commentTree,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    refresh: fetchAll,
    ensureLoaded,
  }
}
