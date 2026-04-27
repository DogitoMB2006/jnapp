import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import type { Profile } from "../../types";

interface ItemCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  creator?: Profile | null;
  editedBy?: Profile | null;
  lastEditedAt?: string | null;
  completed?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggle?: () => void;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
  itemId?: string;
  highlighted?: boolean;
}

export function ItemCard({
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
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      data-item-id={itemId}
      className={`relative mb-3 rounded-2xl overflow-hidden transition-all duration-200 ${
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
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{
          background: completed
            ? "rgba(255,255,255,0.1)"
            : "linear-gradient(180deg, #ff2d6b 0%, #c91aff 100%)",
        }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start gap-3">
          {onToggle !== undefined && (
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={completed}
                onChange={onToggle}
                className="checkbox checkbox-primary checkbox-sm"
                style={{ borderRadius: "50%" }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
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
            </div>

            {subtitle && (
              <p className="text-sm text-base-content/55 mt-1 leading-relaxed">{subtitle}</p>
            )}
            {meta && (
              <p className="text-xs text-base-content/40 mt-0.5 font-medium tracking-wide uppercase" style={{ fontSize: "10px" }}>
                {meta}
              </p>
            )}

            {children}

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
              <div className="flex items-center gap-1.5 min-w-0">
                {creator && (
                  <div className="flex items-center gap-1.5">
                    <Avatar profile={creator} size="xs" />
                    <span className="text-xs text-base-content/40 truncate" style={{ fontSize: "11px" }}>
                      {creator.display_name || creator.username}
                    </span>
                  </div>
                )}
                {editedBy && lastEditedAt && (
                  <span className="text-base-content/25 italic truncate" style={{ fontSize: "10px" }}>
                    · editado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                {onEdit && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onEdit}
                    className="btn btn-ghost btn-xs btn-circle"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Pencil size={12} />
                  </motion.button>
                )}
                {onDelete && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onDelete}
                    className="btn btn-ghost btn-xs btn-circle hover:text-error"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Trash2 size={12} />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
