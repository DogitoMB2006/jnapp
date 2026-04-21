import type { Notification } from "../types"

const coerceId = (v: unknown): string | undefined => {
  if (typeof v === "string" && v.length > 0) return v
  if (typeof v === "number" && Number.isFinite(v)) return String(v)
  return undefined
}

function unwrapPayloadLayers(raw: unknown, maxDepth = 8): unknown {
  let cur: unknown = raw
  for (let d = 0; d < maxDepth; d++) {
    if (!cur || typeof cur !== "object") break
    const o = cur as Record<string, unknown>
    if ("payload" in o && o.payload !== null && typeof o.payload === "object") {
      cur = o.payload
      continue
    }
    if ("new" in o && o.new !== null && typeof o.new === "object") {
      cur = o.new
      continue
    }
    if ("record" in o && o.record !== null && typeof o.record === "object") {
      cur = o.record
      continue
    }
    break
  }
  return cur
}

function collectObjects(obj: unknown, out: Record<string, unknown>[], depth: number) {
  if (depth > 10 || obj === null || obj === undefined) return
  if (typeof obj !== "object") return
  if (Array.isArray(obj)) {
    for (const x of obj) collectObjects(x, out, depth + 1)
    return
  }
  out.push(obj as Record<string, unknown>)
  for (const v of Object.values(obj as Record<string, unknown>)) {
    if (v !== null && typeof v === "object") collectObjects(v, out, depth + 1)
  }
}

function pickNotificationCandidate(
  raw: unknown,
  forUserId: string
): Record<string, unknown> | null {
  const normalizedUser = forUserId.trim().toLowerCase()
  const primary = unwrapPayloadLayers(raw)
  const candidates: Record<string, unknown>[] = []
  collectObjects(primary, candidates, 0)
  collectObjects(raw, candidates, 0)

  for (const o of candidates) {
    const uid = coerceId(o.user_id)
    if (!uid || uid.trim().toLowerCase() !== normalizedUser) continue
    if (typeof o.title !== "string" || typeof o.message !== "string") continue
    const id = coerceId(o.id)
    if (!id) continue
    return o
  }
  return null
}

/**
 * Normalizes InsForge realtime payloads into a Notification row for the current user.
 */
export const parseNotificationInsertPayload = (
  raw: unknown,
  forUserId: string
): Notification | null => {
  const o = pickNotificationCandidate(raw, forUserId)
  if (!o) return null

  const id = coerceId(o.id)!
  const user_id = coerceId(o.user_id)!
  const createdRaw = o.created_by
  const created_by =
    createdRaw === null || createdRaw === undefined
      ? null
      : coerceId(createdRaw) ?? null

  return {
    id,
    user_id,
    title: o.title as string,
    message: o.message as string,
    type: typeof o.type === "string" ? o.type : "info",
    read: Boolean(o.read),
    created_by,
    reference_id:
      o.reference_id === null || o.reference_id === undefined
        ? null
        : coerceId(o.reference_id) ?? null,
    reference_type:
      typeof o.reference_type === "string" ? o.reference_type : null,
    created_at:
      typeof o.created_at === "string" ? o.created_at : new Date().toISOString(),
  }
}
