import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUpdaterStore } from "../../store/updaterStore";

export function UpdateModal() {
  const { status, update, progress, error, modalOpen, installUpdate, closeModal } = useUpdaterStore();
  const { t } = useTranslation();

  const downloading = status === "downloading";

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[10050]"
            onClick={!downloading ? closeModal : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[10051] bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary/10 px-5 py-4 flex items-center justify-between border-b border-base-300">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <span className="font-bold text-base-content text-sm">{t("updates.modalTitle")}</span>
              </div>
              {!downloading && (
                <button onClick={closeModal} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {error ? (
                <p className="text-error text-sm">{error}</p>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-base-content/60 text-xs mb-1">{t("updates.versionAvailable")}</p>
                    <p className="text-2xl font-bold text-primary">v{update?.version}</p>
                    {update?.body && (
                      <p className="text-xs text-base-content/60 mt-2 leading-relaxed">{update.body}</p>
                    )}
                  </div>

                  {downloading && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-base-content/60">
                        <span>{t("updates.downloading")}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-center text-base-content/40 mt-1">
                        {t("updates.willRestart")}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            {!downloading && (
              <div className="px-5 pb-5 flex flex-col gap-2">
                {!error && (
                  <button
                    onClick={installUpdate}
                    className="btn btn-primary w-full gap-2"
                  >
                    <Download size={16} />
                    {t("updates.installNow")}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="btn btn-ghost btn-sm w-full text-base-content/60"
                >
                  {error ? t("updates.close") : t("updates.later")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
