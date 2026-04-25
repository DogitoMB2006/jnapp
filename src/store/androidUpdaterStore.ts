import { create } from "zustand"
import { checkAndroidUpdate, sendAndroidUpdateNotification, type AndroidUpdateInfo } from "../lib/androidUpdateCheck"

type Status = "idle" | "checking" | "available" | "up-to-date" | "error"
type CheckSource = "auto" | "manual"

interface AndroidUpdaterStore {
  status: Status
  updateInfo: AndroidUpdateInfo | null
  error: string | null
  modalOpen: boolean
  lastAutoModalVersion: string | null
  lastNotifiedVersion: string | null
  checkForUpdate: (source?: CheckSource) => Promise<void>
  nudgeUpdateModal: () => void
  openModal: () => void
  closeModal: () => void
}

export const useAndroidUpdaterStore = create<AndroidUpdaterStore>((set, get) => ({
  status: "idle",
  updateInfo: null,
  error: null,
  modalOpen: false,
  lastAutoModalVersion: null,
  lastNotifiedVersion: null,

  checkForUpdate: async (source: CheckSource = "auto") => {
    set({ status: "checking", error: null })
    try {
      const info = await checkAndroidUpdate()
      if (info) {
        const { lastAutoModalVersion, lastNotifiedVersion } = get()
        const shouldOpenModal = source === "manual" || lastAutoModalVersion !== info.version
        if (shouldOpenModal) {
          set({
            status: "available",
            updateInfo: info,
            modalOpen: true,
            lastAutoModalVersion: info.version,
          })
        } else {
          set({ status: "available", updateInfo: info })
        }
        // Send local notification once per version (so it stays in tray when app backgrounds)
        if (lastNotifiedVersion !== info.version) {
          set({ lastNotifiedVersion: info.version })
          await sendAndroidUpdateNotification(info.version).catch(() => undefined)
        }
      } else {
        set({ status: "up-to-date", updateInfo: null })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set({ status: "error", error: msg })
    }
  },

  nudgeUpdateModal: () => {
    const { updateInfo, status, modalOpen } = get()
    if (!updateInfo) return
    if (status === "checking") return
    if (modalOpen) return
    set({ modalOpen: true })
  },

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
}))
