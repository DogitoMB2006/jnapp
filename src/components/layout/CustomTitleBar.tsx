import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Download, Maximize2, Minus, Square, X } from "lucide-react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useUpdaterStore } from "../../store/updaterStore"

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window

export const CustomTitleBar = () => {
  const [maximized, setMaximized] = useState(false)
  const { status: updateStatus, checkForUpdate, openModal } = useUpdaterStore()

  useEffect(() => {
    if (!isTauriRuntime) return

    const win = getCurrentWindow()
    let unlistenResize: (() => void) | undefined

    void (async () => {
      try {
        setMaximized(await win.isMaximized())
      } catch {
        /* ignore */
      }
      try {
        unlistenResize = await win.onResized(async () => {
          try {
            setMaximized(await win.isMaximized())
          } catch {
            /* ignore */
          }
        })
      } catch {
        /* ignore */
      }
    })()

    return () => {
      unlistenResize?.()
    }
  }, [])

  if (!isTauriRuntime) {
    return null
  }

  const refreshMaximized = async () => {
    try {
      setMaximized(await getCurrentWindow().isMaximized())
    } catch {
      /* ignore */
    }
  }

  const handleMinimize = async () => {
    try {
      await getCurrentWindow().minimize()
    } catch {
      /* ignore */
    }
  }

  const handleToggleMaximize = async () => {
    try {
      await getCurrentWindow().toggleMaximize()
      await refreshMaximized()
    } catch {
      /* ignore */
    }
  }

  const handleClose = async () => {
    try {
      await getCurrentWindow().close()
    } catch {
      /* ignore */
    }
  }

  const handleUpdatesClick = async () => {
    if (updateStatus === "available") {
      openModal()
      return
    }
    if (updateStatus === "checking") return
    await checkForUpdate()
    const latest = useUpdaterStore.getState()
    if (latest.status === "up-to-date") {
      toast("Ya tienes la última actualización ✓", { duration: 2500 })
    } else if (latest.status === "error") {
      toast.error(latest.error ?? "Error al buscar actualizaciones", { duration: 3000 })
    }
    // if available, the store already set modalOpen = true
  }

  const handleUpdatesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    void handleUpdatesClick()
  }

  return (
    <div className="flex h-9 flex-shrink-0 items-stretch border-b border-base-300 bg-base-200/90 text-base-content">
      <div
        className="flex min-w-0 flex-1 cursor-grab items-center gap-2 px-3 select-none active:cursor-grabbing"
        data-tauri-drag-region=""
      >
        <img src="/icono.png" alt="" className="h-5 w-5 opacity-90" draggable={false} />
        <span className="truncate text-xs font-semibold tracking-tight text-base-content/80">
          JNApp
        </span>
      </div>

      <div className="flex flex-shrink-0 items-stretch">
        <button
          type="button"
          disabled={updateStatus === "checking"}
          className="flex items-center gap-1.5 px-3 text-xs font-medium text-base-content/80 transition-colors hover:bg-base-300 hover:text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 disabled:opacity-50"
          aria-label="Buscar actualizaciones"
          tabIndex={0}
          onClick={() => void handleUpdatesClick()}
          onKeyDown={handleUpdatesKeyDown}
        >
          {updateStatus === "checking"
            ? <span className="loading loading-spinner loading-xs" aria-hidden />
            : <Download size={14} aria-hidden />}
          <span className="hidden min-[380px]:inline">Actualizar</span>
        </button>

        <button
          type="button"
          className="flex w-11 items-center justify-center text-base-content/80 transition-colors hover:bg-base-300 hover:text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          aria-label="Minimizar ventana"
          tabIndex={0}
          onClick={handleMinimize}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return
            e.preventDefault()
            void handleMinimize()
          }}
        >
          <Minus size={14} strokeWidth={2.25} aria-hidden />
        </button>

        <button
          type="button"
          className="flex w-11 items-center justify-center text-base-content/80 transition-colors hover:bg-base-300 hover:text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          aria-label={maximized ? "Restaurar ventana" : "Maximizar ventana"}
          tabIndex={0}
          onClick={handleToggleMaximize}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return
            e.preventDefault()
            void handleToggleMaximize()
          }}
        >
          {maximized ? (
            <Square size={11} strokeWidth={2.5} aria-hidden />
          ) : (
            <Maximize2 size={13} strokeWidth={2.25} aria-hidden />
          )}
        </button>

        <button
          type="button"
          className="flex w-11 items-center justify-center text-base-content/80 transition-colors hover:bg-error hover:text-error-content focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-inset"
          aria-label="Cerrar aplicación"
          tabIndex={0}
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return
            e.preventDefault()
            void handleClose()
          }}
        >
          <X size={14} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  )
}
