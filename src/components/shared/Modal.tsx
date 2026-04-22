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
            className="relative w-full z-10 overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #1a0825 0%, #150620 100%)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "28px 28px 0 0",
              boxShadow: "0 -8px 48px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,45,107,0.15)",
              maxHeight: "88vh",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="rounded-full"
                style={{
                  width: "36px",
                  height: "4px",
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: "auto", maxHeight: "calc(88vh - 20px)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-3 pb-4">
                <h3
                  className="font-bold text-base-content"
                  style={{
                    fontSize: "18px",
                    letterSpacing: "-0.02em",
                    background: "linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.5) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {title}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={onClose}
                  className="btn btn-ghost btn-sm btn-circle"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-6 pb-8">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
