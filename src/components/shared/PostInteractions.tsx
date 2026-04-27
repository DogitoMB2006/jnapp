import { useMemo, useState } from "react"
import { AnimatePresence, motion, useAnimationControls } from "framer-motion"
import { MessageCircle, SmilePlus, Send, Pencil, Trash2, Reply } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Modal } from "./Modal"
import { Avatar } from "./Avatar"
import { usePostInteractions } from "../../hooks/usePostInteractions"
import type { PostCommentNode, PostTargetType } from "../../types"

type Props = {
  targetType: PostTargetType
  targetId: string
  groupId?: string
  userId?: string
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

function CommentNode({
  node,
  depth,
  currentUserId,
  editingId,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onReply,
  activeActionId,
  onActiveActionIdChange,
}: {
  node: PostCommentNode
  depth: number
  currentUserId?: string
  editingId: string | null
  editingValue: string
  onEditingValueChange: (value: string) => void
  onStartEdit: (node: PostCommentNode) => void
  onCancelEdit: () => void
  onSaveEdit: (commentId: string) => void
  onDelete: (commentId: string) => void
  onReply: (node: PostCommentNode) => void
  activeActionId: string | null
  onActiveActionIdChange: (commentId: string | null) => void
}) {
  const { t } = useTranslation()
  const indent = Math.min(depth * 10, 24)
  const isMine = currentUserId === node.user_id
  const isEditing = editingId === node.id
  const showActions = activeActionId === node.id
  const bubbleControls = useAnimationControls()
  const displayName =
    node.author?.display_name || node.author?.username || t("postInteractions.someone")

  const handleStartEdit = () => {
    onActiveActionIdChange(null)
    onStartEdit(node)
  }

  const handleDelete = () => {
    onActiveActionIdChange(null)
    onDelete(node.id)
  }

  const handleReply = () => {
    onActiveActionIdChange(null)
    onReply(node)
  }

  const bounceBubble = () => {
    bubbleControls.stop()
    void bubbleControls.start({
      y: [0, -6, 0, -3, 0],
      scaleX: [1, 1.015, 0.995, 1.008, 1],
      scaleY: [1, 0.985, 1.012, 0.995, 1],
      transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
    })
  }

  return (
    <motion.div
      className="w-full"
      style={{ paddingLeft: `${indent}px` }}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 24, stiffness: 360 }}
    >
      <div className="group relative flex gap-2.5">
        {depth > 0 ? <div className="absolute -left-2 top-2 h-[calc(100%-8px)] w-px bg-primary/20" /> : null}
        <Avatar profile={node.author} size="sm" className="mt-1 shrink-0" />
        <div className="relative min-w-0 flex-1">
          <motion.div
            animate={bubbleControls}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              if (isEditing) return
              bounceBubble()
              onActiveActionIdChange(showActions ? null : node.id)
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (isEditing) return
              bounceBubble()
              onActiveActionIdChange(showActions ? null : node.id)
            }}
            className={`rounded-[22px] border px-4 py-3 shadow-lg shadow-black/10 transition-colors duration-200 ${
              isMine
                ? "rounded-tr-md border-primary/25 bg-primary/20"
                : "rounded-tl-md border-white/10 bg-base-200/85"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-bold tracking-[-0.01em] text-base-content">
                {displayName}
              </span>
              <span className="shrink-0 text-[10px] font-medium text-base-content/45">
                {formatTime(node.created_at)}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-3">
                <textarea
                  value={editingValue}
                  onChange={(e) => onEditingValueChange(e.target.value)}
                  className="textarea textarea-bordered w-full min-h-24 rounded-2xl bg-base-100/70 text-base"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSaveEdit(node.id)}
                    className="btn btn-primary min-h-12 rounded-2xl px-4"
                  >
                    {t("postInteractions.save")}
                  </button>
                  <button
                    onClick={onCancelEdit}
                    className="btn btn-ghost min-h-12 rounded-2xl px-4"
                  >
                    {t("postInteractions.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-base-content/90">
                {node.content}
              </p>
            )}
          </motion.div>

          <AnimatePresence>
            {showActions ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.86 }}
                transition={{ type: "spring", damping: 24, stiffness: 320 }}
                className="absolute right-2 top-2 z-20 flex justify-end"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-base-100/90 p-1 shadow-xl shadow-black/30 backdrop-blur">
                  {isMine ? (
                    <>
                      <motion.button
                        onClick={(event) => {
                          event.stopPropagation()
                          handleStartEdit()
                        }}
                        whileTap={{ scale: 0.85 }}
                        className="btn btn-ghost btn-circle min-h-11 h-11 w-11 text-base-content/80"
                        aria-label={t("postInteractions.edit")}
                      >
                        <Pencil size={17} />
                      </motion.button>
                      <motion.button
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete()
                        }}
                        whileTap={{ scale: 0.85 }}
                        className="btn btn-ghost btn-circle min-h-11 h-11 w-11 text-error"
                        aria-label={t("postInteractions.delete")}
                      >
                        <Trash2 size={17} />
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleReply()
                      }}
                      whileTap={{ scale: 0.85 }}
                      className="btn btn-ghost btn-circle min-h-11 h-11 w-11 text-primary"
                      aria-label={t("postInteractions.reply")}
                    >
                      <Reply size={18} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {node.replies.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {node.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              node={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              editingId={editingId}
              editingValue={editingValue}
              onEditingValueChange={onEditingValueChange}
              onStartEdit={onStartEdit}
              onCancelEdit={onCancelEdit}
              onSaveEdit={onSaveEdit}
              onDelete={onDelete}
              onReply={onReply}
              activeActionId={activeActionId}
              onActiveActionIdChange={onActiveActionIdChange}
            />
          ))}
        </div>
      ) : null}
    </motion.div>
  )
}

export function PostInteractions({ targetType, targetId, groupId, userId }: Props) {
  const { t } = useTranslation()
  const {
    defaultEmojis,
    reactionsSummary,
    commentsCount,
    commentTree,
    savingComment,
    toggleReaction,
    addComment,
    editComment,
    deleteComment,
    refresh,
  } = usePostInteractions({
    targetType,
    targetId,
    groupId,
    userId,
  })

  const [showEmojiMenu, setShowEmojiMenu] = useState(false)
  const [customEmoji, setCustomEmoji] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [replyTarget, setReplyTarget] = useState<PostCommentNode | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentValue, setEditingCommentValue] = useState("")
  const [activeActionCommentId, setActiveActionCommentId] = useState<string | null>(null)

  const replyTargetName = useMemo(
    () =>
      replyTarget?.author?.display_name ||
      replyTarget?.author?.username ||
      t("postInteractions.someone"),
    [replyTarget, t],
  )

  const handleEmojiClick = async (emoji: string) => {
    if (!emoji.trim()) return
    await toggleReaction(emoji)
    setShowEmojiMenu(false)
    setCustomEmoji("")
  }

  const handleSendComment = async () => {
    if (!commentInput.trim()) return
    const ok = await addComment(commentInput, replyTarget?.id ?? null)
    if (!ok) return
    setCommentInput("")
    setReplyTarget(null)
  }

  const handleStartEdit = (node: PostCommentNode) => {
    setEditingCommentId(node.id)
    setEditingCommentValue(node.content)
    setReplyTarget(null)
  }

  const handleCancelEdit = () => {
    setEditingCommentId(null)
    setEditingCommentValue("")
  }

  const handleSaveEdit = async (commentId: string) => {
    const ok = await editComment(commentId, editingCommentValue)
    if (!ok) return
    setEditingCommentId(null)
    setEditingCommentValue("")
  }

  const handleDelete = async (commentId: string) => {
    const ok = await deleteComment(commentId)
    if (!ok) return
    if (editingCommentId === commentId) {
      setEditingCommentId(null)
      setEditingCommentValue("")
    }
    if (replyTarget?.id === commentId) {
      setReplyTarget(null)
    }
  }

  return (
    <>
      <div className="mt-4 border-t border-white/10 pt-3">
        {reactionsSummary.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {reactionsSummary.map((item) => (
              <motion.button
                key={item.emoji}
                onClick={() => void handleEmojiClick(item.emoji)}
                whileTap={{ scale: 0.9 }}
                className={`btn btn-sm min-h-12 rounded-full px-4 shadow-sm transition-all duration-200 ${
                  item.reactedByMe
                    ? "btn-primary shadow-primary/25 animate-pulse-heart"
                    : "btn-ghost border border-white/10 bg-base-200/60"
                }`}
              >
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-sm font-bold">{item.count}</span>
              </motion.button>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            onClick={() => setShowEmojiMenu((prev) => !prev)}
            whileTap={{ scale: 0.92 }}
            className="btn btn-sm min-h-12 w-full rounded-full border border-white/10 bg-base-200/70 px-3 shadow-sm"
          >
            <SmilePlus size={18} className="shrink-0" />
            <span className="min-w-0 truncate text-sm font-semibold">{t("postInteractions.react")}</span>
          </motion.button>

          <motion.button
            onClick={() => { setShowComments(true); void refresh() }}
            whileTap={{ scale: 0.92 }}
            className="btn btn-sm min-h-12 w-full rounded-full border border-primary/20 bg-primary/10 px-3 text-primary shadow-sm"
          >
            <MessageCircle size={18} className="shrink-0" />
            <span className="min-w-0 truncate text-sm font-semibold">
              {commentsCount > 0
                ? t("postInteractions.commentsWithCount", { count: commentsCount })
                : t("postInteractions.comments")}
            </span>
          </motion.button>
        </div>
      </div>

      <Modal open={showComments} onClose={() => setShowComments(false)} title={t("postInteractions.commentsTitle")}>
        <div
          className="-mx-2 flex flex-col gap-3 overflow-x-hidden sm:mx-0"
          onPointerDown={() => setActiveActionCommentId(null)}
        >
          <div className="flex max-h-[58vh] flex-col gap-4 overflow-y-auto overflow-x-hidden px-2 pb-1 pr-1">
            {commentTree.length ? (
              commentTree.map((node) => (
                <CommentNode
                  key={node.id}
                  node={node}
                  depth={0}
                  currentUserId={userId}
                  editingId={editingCommentId}
                  editingValue={editingCommentValue}
                  onEditingValueChange={setEditingCommentValue}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={(commentId) => void handleSaveEdit(commentId)}
                  onDelete={(commentId) => void handleDelete(commentId)}
                  onReply={(target) => setReplyTarget(target)}
                  activeActionId={activeActionCommentId}
                  onActiveActionIdChange={setActiveActionCommentId}
                />
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-white/12 bg-base-200/40 px-5 py-10 text-center shadow-inner">
                <MessageCircle className="mx-auto mb-3 text-primary/70" size={34} />
                <p className="text-sm font-semibold text-base-content/70">
                  {t("postInteractions.noComments")}
                </p>
              </div>
            )}
          </div>

          {replyTarget ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-2 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 shadow-sm"
            >
              <span className="min-w-0 truncate text-sm font-semibold text-primary">
                {t("postInteractions.replyingTo", { name: replyTargetName })}
              </span>
              <button
                onClick={() => setReplyTarget(null)}
                className="btn btn-ghost btn-sm min-h-10 shrink-0 rounded-full px-3"
              >
                {t("postInteractions.cancel")}
              </button>
            </motion.div>
          ) : null}

          <div className="sticky bottom-0 mx-2 flex items-end gap-2 rounded-[28px] border border-white/10 bg-base-200/95 p-2 shadow-2xl shadow-black/25 backdrop-blur sm:mx-0">
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={t("postInteractions.writeComment")}
              className="textarea textarea-ghost min-h-14 flex-1 resize-none rounded-[22px] bg-base-100/60 px-4 py-3 text-base leading-relaxed focus:outline-none"
            />
            <motion.button
              onClick={() => void handleSendComment()}
              disabled={!commentInput.trim() || savingComment}
              whileTap={{ scale: 0.9 }}
              className="btn btn-primary btn-circle h-14 min-h-14 w-14 shrink-0 shadow-lg shadow-primary/25"
            >
              {savingComment ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send size={20} />
              )}
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEmojiMenu}
        onClose={() => setShowEmojiMenu(false)}
        title={t("postInteractions.pickReaction")}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {defaultEmojis.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => void handleEmojiClick(emoji)}
                whileTap={{ scale: 0.85 }}
                className="btn btn-ghost min-h-14 rounded-2xl border border-white/10 bg-base-200/70 px-2 shadow-sm"
              >
                <span className="text-2xl leading-none">{emoji}</span>
              </motion.button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-base-200/70 p-2">
            <input
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder={t("postInteractions.customEmoji")}
              className="input input-ghost min-h-12 flex-1 rounded-xl bg-base-100/50 text-base"
            />
            <motion.button
              onClick={() => void handleEmojiClick(customEmoji)}
              whileTap={{ scale: 0.92 }}
              className="btn btn-primary min-h-12 rounded-xl px-5"
            >
              {t("postInteractions.add")}
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  )
}
