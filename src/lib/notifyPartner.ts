import insforge from "./insforge"
import { requestPartnerFcmPush } from "./requestPartnerFcmPush"
import { useGroupStore } from "../store/groupStore"

export type PartnerNotifySection = "lista" | "planes" | "salidas" | "peliculas"

const SECTION_LABEL: Record<PartnerNotifySection, string> = {
  lista: "Lista para Hacer",
  planes: "Planes",
  salidas: "Salidas",
  peliculas: "Películas para Ver",
}

/**
 * Inserts an in-app notification for the partner in the same group.
 * If `VITE_PARTNER_FCM_FUNCTION_SLUG` is set, also asks your InsForge function to
 * send FCM so the partner gets a system notification when the app is killed.
 */
export const notifyPartnerNewContent = async (opts: {
  actorUserId: string
  displayName: string
  section: PartnerNotifySection
  detail?: string
}) => {
  const { group, partnerId } = useGroupStore.getState()

  if (!group || !partnerId) return

  const sectionName = SECTION_LABEL[opts.section]
  const who = opts.displayName.trim() || "Tu pareja"
  const base = `${who} ha subido algo nuevo en ${sectionName}`
  const message = opts.detail?.trim()
    ? `${base}: ${opts.detail.trim()}`
    : base

  const { error } = await insforge.database.from("notifications").insert([{
    user_id: partnerId,
    title: sectionName,
    message,
    type: opts.section,
    created_by: opts.actorUserId,
    group_id: group.id,
  }])

  if (error) {
    console.warn("[notifyPartnerNewContent]", error.message)
    return
  }
  void requestPartnerFcmPush({
    targetUserId: partnerId,
    title: sectionName,
    body: message,
  })
}
