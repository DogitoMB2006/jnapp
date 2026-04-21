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
}: ItemCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`card bg-base-200 shadow-md mb-3 border border-base-300 transition-all ${
        completed ? "opacity-60" : ""
      }`}
    >
      <div className="card-body p-4">
        <div className="flex items-start gap-3">
          {onToggle !== undefined && (
            <input
              type="checkbox"
              checked={completed}
              onChange={onToggle}
              className="checkbox checkbox-primary checkbox-sm mt-1 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-medium text-base-content leading-snug ${
                  completed ? "line-through text-base-content/50" : ""
                }`}
              >
                {title}
              </p>
              {badge && (
                <span className={`badge ${badgeColor} badge-sm flex-shrink-0`}>
                  {badge}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="text-sm text-base-content/70 mt-0.5">{subtitle}</p>
            )}
            {meta && (
              <p className="text-xs text-base-content/50 mt-0.5">{meta}</p>
            )}
            {children}

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                {creator && (
                  <div className="flex items-center gap-1">
                    <Avatar profile={creator} size="xs" />
                    <span className="text-xs text-base-content/50">
                      {creator.display_name || creator.username}
                    </span>
                  </div>
                )}
                {editedBy && lastEditedAt && (
                  <span className="text-xs text-base-content/40 italic">
                    · editado por {editedBy.display_name || editedBy.username}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-primary"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
