import insforge from "./insforge"
import { requestPartnerFcmPush } from "./requestPartnerFcmPush"
import i18n from "../i18n"
import { useGroupStore } from "../store/groupStore"
import { useAuthStore } from "../store/authStore"

export type PartnerNotifySection = "lista" | "planes" | "peliculas"

const TARGET_LABEL: Record<string, string> = {
  planes: "Planes",
  peliculas: "Películas",
}

const SECTION_LABEL: Record<PartnerNotifySection, string> = {
  lista: "Lista para Hacer",
  planes: "Planes",
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
  itemId?: string | null
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
    reference_id: opts.itemId ?? null,
    reference_type: opts.section,
  }])

  if (error) {
    console.warn("[notifyPartnerNewContent]", error.message)
    return
  }
  void requestPartnerFcmPush({
    targetUserId: partnerId,
    title: sectionName,
    body: message,
    referenceId: opts.itemId ?? null,
    referenceType: opts.section,
  })
}

/**
 * Sends an in-app + FCM push notification when the current user comments or
 * reacts to a post in a shared section. Skips silently if the user has no group/partner.
 */
export const notifyPartnerInteraction = async (opts: {
  actorUserId: string
  type: "comment" | "reaction"
  targetType: string
  targetId: string
  emoji?: string
}) => {
  const { group, partnerId } = useGroupStore.getState()
  if (!group || !partnerId) return

  const profile = useAuthStore.getState().profile
  const who = profile?.display_name?.trim() || profile?.username?.trim() || "Tu pareja"
  const targetLabel = TARGET_LABEL[opts.targetType] ?? opts.targetType

  const title = opts.type === "comment" ? "Nuevo comentario" : "Nueva reacción"
  const message =
    opts.type === "comment"
      ? `${who} comentó en ${targetLabel}`
      : opts.emoji
        ? `${who} reaccionó con ${opts.emoji} en ${targetLabel}`
        : `${who} reaccionó en ${targetLabel}`

  const { error } = await insforge.database.from("notifications").insert([{
    user_id: partnerId,
    title,
    message,
    type: opts.type,
    created_by: opts.actorUserId,
    group_id: group.id,
    reference_id: opts.targetId,
    reference_type: opts.targetType,
  }])

  if (error) {
    console.warn("[notifyPartnerInteraction]", error.message)
    return
  }

  void requestPartnerFcmPush({
    targetUserId: partnerId,
    title,
    body: message,
    referenceId: opts.targetId,
    referenceType: opts.targetType,
  })
}

export type HeistNotifyEvent = "heist_started" | "heist_completed" | "heist_expired"

/**
 * Cooperative heist pushes. Every notification deep-links to the exact session.
 */
export const notifyPartnerHeist = async (opts: {
  actorUserId: string
  event: HeistNotifyEvent
  heistId: string
  level?: number
  rewardCoins?: number
}) => {
  const { partnerId } = useGroupStore.getState()
  if (!partnerId) return

  const profile = useAuthStore.getState().profile
  const who = profile?.display_name?.trim() || profile?.username?.trim() || "Tu pareja"

  let title: string
  let message: string
  if (opts.event === "heist_started") {
    title = i18n.t("juegos.heist.notifications.startedTitle")
    message = i18n.t("juegos.heist.notifications.startedBody", { who, level: opts.level ?? 1 })
  } else if (opts.event === "heist_completed") {
    title = i18n.t("juegos.heist.notifications.completedTitle")
    message = i18n.t("juegos.heist.notifications.completedBody", { who, coins: opts.rewardCoins ?? 0 })
  } else {
    title = i18n.t("juegos.heist.notifications.expiredTitle")
    message = i18n.t("juegos.heist.notifications.expiredBody")
  }

  void requestPartnerFcmPush({
    targetUserId: partnerId,
    title,
    body: message,
    referenceId: opts.heistId,
    referenceType: "juegos",
  })
}
