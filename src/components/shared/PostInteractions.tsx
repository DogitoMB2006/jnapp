import { useMemo, useState } from "react"
import { MessageCircle, SmilePlus, Send, Pencil, Trash2 } from "lucide-react"
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
}) {
  const { t } = useTranslation()
  const indent = Math.min(depth * 12, 36)
  const isMine = currentUserId === node.user_id
  const isEditing = editingId === node.id
  const displayName =
    node.author?.display_name || node.author?.username || t("postInteractions.someone")

  return (
    <div className="w-full" style={{ paddingLeft: `${indent}px` }}>
      <div className="rounded-xl bg-base-200/50 border border-base-300/40 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar profile={node.author} size="xs" />
            <span className="text-xs font-semibold truncate">{displayName}</span>
          </div>
          <span className="text-[10px] text-base-content/55 shrink-0">
            {formatTime(node.created_at)}
          </span>
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editingValue}
              onChange={(e) => onEditingValueChange(e.target.value)}
              className="textarea textarea-bordered w-full min-h-20"
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onSaveEdit(node.id)}
                className="btn btn-primary btn-sm min-h-10 px-3"
              >
                {t("postInteractions.save")}
              </button>
              <button
                onClick={onCancelEdit}
                className="btn btn-ghost btn-sm min-h-10 px-3"
              >
                {t("postInteractions.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-base-content/85 mt-1.5 whitespace-pre-wrap break-words">
              {node.content}
            </p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <button
                onClick={() => onReply(node)}
                className="btn btn-ghost btn-xs min-h-9 px-3 rounded-full"
              >
                {t("postInteractions.reply")}
              </button>
              {isMine ? (
                <>
                  <button
                    onClick={() => onStartEdit(node)}
                    className="btn btn-ghost btn-xs min-h-9 px-3 rounded-full"
                  >
                    <Pencil size={12} />
                    {t("postInteractions.edit")}
                  </button>
                  <button
                    onClick={() => onDelete(node.id)}
                    className="btn btn-ghost btn-xs min-h-9 px-3 rounded-full text-error"
                  >
                    <Trash2 size={12} />
                    {t("postInteractions.delete")}
                  </button>
                </>
              ) : null}
            </div>
          </>
        )}
      </div>
      {node.replies.length > 0 ? (
        <div className="mt-2 flex flex-col gap-2">
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
            />
          ))}
        </div>
      ) : null}
    </div>
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

  const replyTargetName = useMemo(
    () =>
      replyTarget?.author?.display_name ||
      replyTarget?.author?.username ||
      t("postInteractions.someone"),
    [replyTarget, t],
  )

  const handleEmojiClick = async (emoji: string) => {
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
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {reactionsSummary.map((item) => (
            <button
              key={item.emoji}
              onClick={() => void handleEmojiClick(item.emoji)}
              className={`btn btn-sm rounded-full min-h-11 px-3 ${
                item.reactedByMe ? "btn-primary" : "btn-ghost"
              }`}
            >
              <span className="text-base leading-none">{item.emoji}</span>
              <span className="text-xs">{item.count}</span>
            </button>
          ))}

          <div className="relative">
            <button
              onClick={() => setShowEmojiMenu((prev) => !prev)}
              className="btn btn-sm rounded-full min-h-11 px-3 btn-ghost"
            >
              <SmilePlus size={16} />
              <span className="text-xs">{t("postInteractions.react")}</span>
            </button>
          </div>

          <button
            onClick={() => { setShowComments(true); void refresh() }}
            className="btn btn-sm rounded-full min-h-11 px-3 btn-ghost ml-auto"
          >
            <MessageCircle size={16} />
            <span className="text-xs">
              {commentsCount > 0
                ? t("postInteractions.commentsWithCount", { count: commentsCount })
                : t("postInteractions.comments")}
            </span>
          </button>
        </div>
      </div>

      <Modal open={showComments} onClose={() => setShowComments(false)} title={t("postInteractions.commentsTitle")}>
        <div className="flex flex-col gap-3">
          <div className="max-h-[52vh] overflow-y-auto pr-1 flex flex-col gap-2">
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
                />
              ))
            ) : (
              <p className="text-sm text-base-content/55 py-3 text-center">
                {t("postInteractions.noComments")}
              </p>
            )}
          </div>

          {replyTarget ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-primary">
                {t("postInteractions.replyingTo", { name: replyTargetName })}
              </span>
              <button
                onClick={() => setReplyTarget(null)}
                className="btn btn-ghost btn-xs min-h-8 px-2"
              >
                {t("postInteractions.cancel")}
              </button>
            </div>
          ) : null}

          <div className="flex items-end gap-2">
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder={t("postInteractions.writeComment")}
              className="textarea textarea-bordered flex-1 min-h-24"
            />
            <button
              onClick={() => void handleSendComment()}
              disabled={!commentInput.trim() || savingComment}
              className="btn btn-primary min-h-11 px-4"
            >
              {savingComment ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showEmojiMenu}
        onClose={() => setShowEmojiMenu(false)}
        title={t("postInteractions.pickReaction")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {defaultEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => void handleEmojiClick(emoji)}
                className="btn btn-ghost btn-sm min-h-11 px-3 rounded-xl"
              >
                <span className="text-xl leading-none">{emoji}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder={t("postInteractions.customEmoji")}
              className="input input-bordered flex-1"
            />
            <button
              onClick={() => void handleEmojiClick(customEmoji)}
              className="btn btn-primary min-h-11 px-4"
            >
              {t("postInteractions.add")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
