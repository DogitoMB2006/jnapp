import { useEffect, useRef } from "react"
import insforge from "../lib/insforge"
import { channelsMatch } from "../lib/realtimeChannel"

type RealtimeCallback = (payload: unknown) => void

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

async function subscribeChannelWithRetry(channel: string, cancelled: () => boolean) {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (cancelled()) return false
    const res = await insforge.realtime.subscribe(channel)
    if (res && typeof res === "object" && "ok" in res && (res as { ok: boolean }).ok) {
      return true
    }
    const errMsg =
      res &&
      typeof res === "object" &&
      "error" in res &&
      (res as { error?: { message?: string } }).error?.message
    console.warn(
      `[useRealtime] subscribe "${channel}" attempt ${attempt + 1}/${maxAttempts}`,
      errMsg ?? res
    )
    const backoff = Math.min(900 * 2 ** attempt, 8000)
    await sleep(backoff)
  }
  return false
}

const TABLE_CHANGE_EVENTS = ["INSERT", "UPDATE", "DELETE"] as const

/** DB publish() uses TG_OP as the event name (INSERT / UPDATE / DELETE). */
const defaultTableEvents = [...TABLE_CHANGE_EVENTS]

/** Strip one or more `{ payload: ... }` wrappers so triggers’ row / DELETE JSON is visible. */
function unwrapPayload(raw: unknown): unknown {
  let cur: unknown = raw
  for (let d = 0; d < 6; d++) {
    if (!cur || typeof cur !== "object") break
    const o = cur as Record<string, unknown>
    if ("payload" in o && o.payload !== null && typeof o.payload === "object") {
      cur = o.payload
    } else break
  }
  return cur
}

/** InsForge socket envelopes include `meta.channel` so we only handle messages for our subscription. */
function getMetaChannel(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const meta = (raw as Record<string, unknown>).meta
  if (!meta || typeof meta !== "object") return undefined
  const ch = (meta as Record<string, unknown>).channel
  return typeof ch === "string" ? ch : undefined
}

type UseRealtimeOptions = {
  /** Defaults to INSERT, UPDATE, DELETE (matches Postgres trigger publish event names). */
  events?: string[]
}

/**
 * Subscribe to realtime on `channel` and invoke `callback` with row-shaped payloads.
 * Guards against duplicate listeners when React Strict Mode remounts before async subscribe finishes.
 */
export function useRealtime(
  channel: string,
  callback: RealtimeCallback,
  options?: UseRealtimeOptions
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const eventsList = options?.events ?? defaultTableEvents
  const eventsDep = eventsList.join("|")

  useEffect(() => {
    if (channel === "__none__") return

    let cancelled = false

    const handler = (raw: unknown) => {
      const metaCh = getMetaChannel(raw)
      if (!channelsMatch(metaCh, channel)) {
        return
      }
      callbackRef.current(unwrapPayload(raw))
    }

    const onSocketReconnect = () => {
      if (cancelled) return
      void (async () => {
        const res = await insforge.realtime.subscribe(channel)
        if (
          res &&
          typeof res === "object" &&
          "ok" in res &&
          !(res as { ok: boolean }).ok
        ) {
          console.warn(
            `[useRealtime] re-subscribe after connect failed for "${channel}"`,
            res
          )
        }
      })()
    }

    const setup = async () => {
      const ok = await subscribeChannelWithRetry(channel, () => cancelled)
      if (cancelled) {
        insforge.realtime.unsubscribe(channel)
        return
      }
      if (!ok) {
        console.warn(
          `[useRealtime] subscribe failed for "${channel}" after retries — updates may lag until refresh (check WebSocket/firewall).`
        )
      }
      for (const ev of eventsList) {
        insforge.realtime.on(ev, handler)
      }
      insforge.realtime.on("connect", onSocketReconnect)
    }

    void setup()

    return () => {
      cancelled = true
      insforge.realtime.off("connect", onSocketReconnect)
      for (const ev of eventsList) {
        insforge.realtime.off(ev, handler)
      }
      insforge.realtime.unsubscribe(channel)
    }
  }, [channel, eventsDep])
}
