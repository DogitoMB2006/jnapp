import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="relative z-10 w-full overflow-hidden rounded-t-[28px] border-t border-base-300 bg-base-200/95 shadow-[0_-8px_48px_rgba(0,0,0,0.45),0_-1px_0_hsl(var(--p)/0.18)] backdrop-blur-xl"
            style={{ maxHeight: "88vh" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-9 rounded-full bg-base-content/15" />
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: "auto", maxHeight: "calc(88vh - 20px)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-4 pt-3 sm:px-6">
                <h3 className="text-lg font-bold tracking-tight text-base-content">
                  {title}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="btn btn-ghost btn-sm btn-circle border border-base-300 bg-base-100/60 text-base-content/60 hover:text-base-content"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-6">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
