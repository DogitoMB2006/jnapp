import { useCallback, useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import insforge from "../lib/insforge"
import { notifyPartnerInteraction } from "../lib/notifyPartner"
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
}

const sanitizeEmojiInput = (raw: string): string => raw.trim().slice(0, 8)

export const usePostInteractions = ({
  targetType,
  targetId,
  groupId,
  userId,
}: UsePostInteractionsArgs) => {
  const [reactions, setReactions] = useState<PostReaction[]>([])
  const [comments, setComments] = useState<PostComment[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [loading, setLoading] = useState(false)
  const [savingComment, setSavingComment] = useState(false)

  const isEnabled = Boolean(groupId && targetId)

  const loadProfiles = useCallback(async (ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    if (!uniqueIds.length) return
    const missingIds = uniqueIds.filter((id) => !profiles[id])
    if (!missingIds.length) return

    const { data, error } = await insforge.database
      .from("profiles")
      .select("*")
      .in("user_id", missingIds)
    if (error || !data) return

    const next: Record<string, Profile> = {}
    ;(data as Profile[]).forEach((profile) => {
      next[profile.user_id] = profile
    })
    setProfiles((prev) => ({ ...prev, ...next }))
  }, [profiles])

  const fetchAll = useCallback(async () => {
    if (!isEnabled) return
    setLoading(true)

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

    if (!reactionRes.error && reactionRes.data) {
      setReactions(reactionRes.data as PostReaction[])
      await loadProfiles((reactionRes.data as PostReaction[]).map((row) => row.user_id))
    }
    if (!commentRes.error && commentRes.data) {
      setComments(commentRes.data as PostComment[])
      await loadProfiles((commentRes.data as PostComment[]).map((row) => row.user_id))
    }

    setLoading(false)
  }, [isEnabled, targetType, targetId, loadProfiles])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

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

    const existing = reactions.find(
      (row) => row.user_id === userId && row.emoji === emoji,
    )
    if (existing) {
      setReactions((prev) => prev.filter((item) => item.id !== existing.id))
      const { error } = await insforge.database
        .from("post_reactions")
        .delete()
        .eq("id", existing.id)
      if (error) {
        toast.error("No se pudo quitar la reacción")
        await fetchAll()
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
    setReactions((prev) => [...prev, optimistic])

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
      setReactions((prev) => prev.filter((item) => item.id !== optimisticId))
      toast.error("No se pudo guardar la reacción")
      return
    }

    const created = data[0] as PostReaction
    setReactions((prev) =>
      prev
        .filter((item) => item.id !== optimisticId)
        .concat(prev.some((item) => item.id === created.id) ? [] : [created]),
    )
    void notifyPartnerInteraction({ actorUserId: userId, type: "reaction", targetType, emoji })
  }, [groupId, userId, targetId, reactions, targetType, fetchAll])

  const addComment = useCallback(async (content: string, parentCommentId?: string | null) => {
    const text = content.trim()
    if (!text || !groupId || !userId || !targetId) return false
    if (savingComment) return false

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
    setComments((prev) => [...prev, optimistic])

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
      setComments((prev) => prev.filter((item) => item.id !== optimisticId))
      toast.error("No se pudo publicar el comentario")
      return false
    }

    const created = data[0] as PostComment
    setComments((prev) =>
      prev
        .filter((item) => item.id !== optimisticId)
        .concat(prev.some((item) => item.id === created.id) ? [] : [created]),
    )
    void loadProfiles([created.user_id])
    void notifyPartnerInteraction({ actorUserId: userId, type: "comment", targetType })
    return true
  }, [groupId, userId, targetId, savingComment, targetType, loadProfiles])

  const editComment = useCallback(async (commentId: string, content: string) => {
    const text = content.trim()
    if (!text || !commentId || !userId) return false
    const current = comments.find((row) => row.id === commentId)
    if (!current || current.user_id !== userId) return false

    const previousContent = current.content
    setComments((prev) =>
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
      setComments((prev) =>
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
    setComments((prev) => prev.map((row) => (row.id === commentId ? updated : row)))
    return true
  }, [comments, userId])

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
    setComments((prev) => prev.filter((row) => !descendants.has(row.id)))

    const { error } = await insforge.database
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId)

    if (error) {
      setComments(snapshot)
      toast.error("No se pudo eliminar el comentario")
      return false
    }

    return true
  }, [comments, userId])

  return {
    loading,
    savingComment,
    defaultEmojis: DEFAULT_EMOJIS,
    reactionsSummary,
    commentsCount,
    commentTree,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    refresh: fetchAll,
  }
}
