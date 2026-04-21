import { motion, AnimatePresence } from "framer-motion";
import { Download, X, RefreshCw } from "lucide-react";
import { useUpdater } from "../../hooks/useUpdater";

export function UpdateBanner() {
  const { update, downloading, progress, error, installUpdate, dismiss } = useUpdater();

  return (
    <AnimatePresence>
      {(update || error) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`flex items-center gap-2 px-3 py-2 text-xs ${error ? "bg-error/20 text-error" : "bg-primary/15 text-primary"}`}>
            {error ? (
              <span className="flex-1">Error al actualizar: {error}</span>
            ) : (
              <>
                <RefreshCw size={13} className="flex-shrink-0" />
                <span className="flex-1">
                  {downloading
                    ? `Descargando... ${progress}%`
                    : `Nueva versión disponible: v${update?.version}`}
                </span>
                {!downloading && (
                  <button
                    onClick={installUpdate}
                    className="flex items-center gap-1 bg-primary text-primary-content px-2 py-0.5 rounded text-xs font-medium"
                  >
                    <Download size={11} />
                    Actualizar
                  </button>
                )}
                {downloading && (
                  <div className="w-16 bg-base-300 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </>
            )}
            {!downloading && (
              <button onClick={dismiss} className="opacity-60 hover:opacity-100">
                <X size={13} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
