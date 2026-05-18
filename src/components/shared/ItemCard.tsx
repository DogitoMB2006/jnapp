import { memo } from "react"
import { motion } from "framer-motion"
import { Pencil, Trash2 } from "lucide-react"
import { springSnappy } from "../../lib/motion"
import { Avatar } from "./Avatar"
import type { Profile } from "../../types"

interface ItemCardProps {
  title: string
  subtitle?: string
  meta?: string
  creator?: Profile | null
  editedBy?: Profile | null
  lastEditedAt?: string | null
  completed?: boolean
  onEdit?: (itemId: string) => void
  onDelete?: (itemId: string) => void
  onToggle?: (itemId: string) => void
  badge?: string
  badgeColor?: string
  children?: React.ReactNode
  itemId: string
  highlighted?: boolean
}

export const ItemCard = memo(function ItemCard({
  title,
  subtitle,
  meta,
  creator,
  editedBy,
  lastEditedAt,
  completed,
  onEdit,
  onDelete,
  onToggle,
  badge,
  badgeColor = "badge-primary",
  children,
  itemId,
  highlighted,
}: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={springSnappy}
      data-item-id={itemId}
      className={`relative mb-3 rounded-2xl overflow-hidden transition-shadow duration-200 ${
        completed ? "opacity-50" : ""
      }`}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        border: highlighted
          ? "1px solid rgba(255,45,107,0.6)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: highlighted
          ? "0 4px 24px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,45,107,0.18), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{
          background: completed
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(180deg, #ff2d6b 0%, #c91aff 100%)",
        }}
      />

      <motion.div className="pl-5 pr-4 py-4">
        <motion.div className="flex items-start gap-3">
          {onToggle !== undefined && (
            <motion.div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={completed}
                onChange={() => onToggle(itemId)}
                className="checkbox checkbox-primary checkbox-sm"
                style={{ borderRadius: "50%" }}
              />
            </motion.div>
          )}
          <motion.div className="flex-1 min-w-0">
            <motion.div className="flex items-start justify-between gap-2">
              <p
                className={`font-semibold leading-snug tracking-tight ${
                  completed
                    ? "line-through text-base-content/30"
                    : "text-base-content"
                }`}
                style={{ fontSize: "15px" }}
              >
                {title}
              </p>
              {badge && (
                <span
                  className={`badge ${badgeColor} badge-sm flex-shrink-0 font-medium`}
                  style={{ fontSize: "10px", letterSpacing: "0.04em" }}
                >
                  {badge}
                </span>
              )}
            </motion.div>

            {subtitle && (
              <p className="text-sm text-base-content/55 mt-1 leading-relaxed">{subtitle}</p>
            )}
            {meta && (
              <p
                className="text-xs text-base-content/40 mt-0.5 font-medium tracking-wide uppercase"
                style={{ fontSize: "10px" }}
              >
                {meta}
              </p>
            )}

            {children}

            <motion.div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
              <motion.div className="flex items-center gap-1.5 min-w-0">
                {creator && (
                  <motion.div className="flex items-center gap-1.5">
                    <Avatar profile={creator} size="xs" />
                    <span className="text-xs text-base-content/40 truncate" style={{ fontSize: "11px" }}>
                      {creator.display_name || creator.username}
                    </span>
                  </motion.div>
                )}
                {editedBy && lastEditedAt && (
                  <span className="text-base-content/25 italic truncate" style={{ fontSize: "10px" }}>
                    · editado
                  </span>
                )}
              </motion.div>

              <motion.div className="flex items-center gap-0.5 flex-shrink-0">
                {onEdit && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => onEdit(itemId)}
                    className="btn btn-ghost btn-xs btn-circle"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Pencil size={12} />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => onDelete(itemId)}
                    className="btn btn-ghost btn-xs btn-circle hover:text-error"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Trash2 size={12} />
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
})
