/**
 * Normalizes InsForge / Postgres trigger payloads for lista_items, planes, salidas, peliculas.
 * DELETE publishes only `{ id, op }`; INSERT/UPDATE merge `op` onto the row JSON.
 * Socket envelopes may nest `payload` more than once — DELETE id must still resolve.
 */

function coerceId(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v
  if (typeof v === "number" && Number.isFinite(v)) return String(v)
  return undefined
}

/** Unwrap nested `{ payload: ... }` layers from InsForge socket messages. */
function unwrapPayloadLayers(raw: unknown, maxDepth = 5): unknown {
  let cur: unknown = raw
  for (let d = 0; d < maxDepth; d++) {
    if (!cur || typeof cur !== "object") break
    const o = cur as Record<string, unknown>
    if ("payload" in o && o.payload !== null && typeof o.payload === "object") {
      cur = o.payload
    } else break
  }
  return cur
}

export function parseTableChangePayload(payload: unknown): {
  op: string
  id?: string
  record: Record<string, unknown>
} | null {
  const root = unwrapPayloadLayers(payload)
  if (!root || typeof root !== "object") return null

  const obj = root as Record<string, unknown>
  const opRaw = obj.op
  const op = (typeof opRaw === "string" ? opRaw : String(opRaw ?? "")).toUpperCase()

  let id = coerceId(obj.id)
  if (!id && obj.payload !== null && typeof obj.payload === "object") {
    id = coerceId((obj.payload as Record<string, unknown>).id)
  }
  if (!id && obj.record !== null && typeof obj.record === "object") {
    id = coerceId((obj.record as Record<string, unknown>).id)
  }

  return { op, id, record: obj }
}
