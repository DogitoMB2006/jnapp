import insforge from "./insforge"

export type PartnerNotifySection = "lista" | "planes" | "salidas" | "peliculas"

const SECTION_LABEL: Record<PartnerNotifySection, string> = {
  lista: "Lista para Hacer",
  planes: "Planes",
  salidas: "Salidas",
  peliculas: "Películas para Ver",
}

/**
 * Inserts in-app notifications for every other profile (partner) when the current user adds content.
 */
export const notifyPartnerNewContent = async (opts: {
  actorUserId: string
  displayName: string
  section: PartnerNotifySection
  /** Optional extra line (e.g. task text, title) */
  detail?: string
}) => {
  const { data: others } = await insforge.database
    .from("profiles")
    .select("user_id")
    .neq("user_id", opts.actorUserId)

  if (!others?.length) return

  const sectionName = SECTION_LABEL[opts.section]
  const who = opts.displayName.trim() || "Tu pareja"
  const base = `${who} ha subido algo nuevo en ${sectionName}`
  const message = opts.detail?.trim()
    ? `${base}: ${opts.detail.trim()}`
    : base

  const rows = (others as { user_id: string }[]).map((p) => ({
    user_id: p.user_id,
    title: sectionName,
    message,
    type: opts.section,
    created_by: opts.actorUserId,
  }))

  const { error } = await insforge.database.from("notifications").insert(rows)
  if (error) {
    console.warn("[notifyPartnerNewContent]", error.message)
  }
}
