import { motion, AnimatePresence } from "framer-motion"
import { Download, X, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { openUrl } from "@tauri-apps/plugin-opener"
import { useAndroidUpdaterStore } from "../../store/androidUpdaterStore"

export function AndroidUpdateModal() {
  const { updateInfo, error, modalOpen, closeModal } = useAndroidUpdaterStore()
  const { t } = useTranslation()

  const handleDownload = async () => {
    if (!updateInfo?.downloadUrl) return
    try {
      await openUrl(updateInfo.downloadUrl)
    } catch {
      // fallback
      window.open(updateInfo.downloadUrl, "_blank")
    }
    closeModal()
  }

  return (
    <AnimatePresence>
      {modalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[10050]"
            onClick={closeModal}
          />
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
              <button onClick={closeModal} className="opacity-50 hover:opacity-100 transition-opacity">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {error ? (
                <p className="text-error text-sm">{error}</p>
              ) : (
                <div className="text-center">
                  <p className="text-base-content/60 text-xs mb-1">{t("updates.versionAvailable")}</p>
                  <p className="text-2xl font-bold text-primary">v{updateInfo?.version}</p>
                  {updateInfo?.body && (
                    <p className="text-xs text-base-content/60 mt-2 leading-relaxed">
                      {updateInfo.body.slice(0, 300)}
                    </p>
                  )}
                  <p className="text-xs text-base-content/40 mt-3">
                    {t("updates.androidDownloadHint")}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              {!error && (
                <button
                  onClick={() => void handleDownload()}
                  className="btn btn-primary w-full gap-2"
                >
                  <Download size={16} />
                  {t("updates.downloadApk")}
                </button>
              )}
              <button
                onClick={closeModal}
                className="btn btn-ghost btn-sm w-full text-base-content/60"
              >
                {error ? t("updates.close") : t("updates.later")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
