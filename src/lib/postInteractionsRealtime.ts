/**
 * Refcounted shared subscription for post_comments / post_reactions.
 * Many PostInteractions instances mount at once; unmounting one must not drop the channel.
 */

import insforge from "./insforge"
import { channelsMatch } from "./realtimeChannel"

export type PostInteractionChannel = "post_comments" | "post_reactions"

type Listener = (channel: PostInteractionChannel, payload: unknown) => void

const CHANNELS: PostInteractionChannel[] = ["post_comments", "post_reactions"]
const EVENTS = ["INSERT", "UPDATE", "DELETE"] as const

const listeners = new Set<Listener>()
const reconnectListeners = new Set<() => void>()

let refCount = 0
let started = false
let cancelledStart = false

const channelHandlers = new Map<PostInteractionChannel, (raw: unknown) => void>()

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const unwrapPayload = (raw: unknown): unknown => {
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

const getMetaChannel = (raw: unknown): string | undefined => {
  if (!raw || typeof raw !== "object") return undefined
  const meta = (raw as Record<string, unknown>).meta
  if (!meta || typeof meta !== "object") return undefined
  const ch = (meta as Record<string, unknown>).channel
  return typeof ch === "string" ? ch : undefined
}

const subscribeWithRetry = async (channel: string, cancelled: () => boolean) => {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (cancelled()) return false
    const res = await insforge.realtime.subscribe(channel)
    if (res && typeof res === "object" && "ok" in res && (res as { ok: boolean }).ok) {
      return true
    }
    await sleep(Math.min(900 * 2 ** attempt, 8000))
  }
  return false
}

const makeHandler = (channel: PostInteractionChannel) => (raw: unknown) => {
  const metaCh = getMetaChannel(raw)
  if (!channelsMatch(metaCh, channel)) return
  const payload = unwrapPayload(raw)
  for (const listener of listeners) {
    listener(channel, payload)
  }
}

const onSocketReconnect = () => {
  void (async () => {
    for (const channel of CHANNELS) {
      await insforge.realtime.subscribe(channel)
    }
    for (const cb of reconnectListeners) {
      cb()
    }
  })()
}

const start = async () => {
  cancelledStart = false
  for (const channel of CHANNELS) {
    const ok = await subscribeWithRetry(channel, () => cancelledStart || refCount === 0)
    if (!ok && (cancelledStart || refCount === 0)) return
    if (!ok) {
      console.warn(
        `[postInteractionsRealtime] subscribe failed for "${channel}" — comments/reactions may lag until refresh`,
      )
    }
    const handler = makeHandler(channel)
    channelHandlers.set(channel, handler)
    for (const ev of EVENTS) {
      insforge.realtime.on(ev, handler)
    }
  }
  insforge.realtime.on("connect", onSocketReconnect)
  started = true
}

const stop = () => {
  cancelledStart = true
  insforge.realtime.off("connect", onSocketReconnect)
  for (const channel of CHANNELS) {
    const handler = channelHandlers.get(channel)
    if (handler) {
      for (const ev of EVENTS) {
        insforge.realtime.off(ev, handler)
      }
    }
    insforge.realtime.unsubscribe(channel)
  }
  channelHandlers.clear()
  started = false
}

export const subscribePostInteractionRealtime = (
  listener: Listener,
  options?: { onReconnect?: () => void },
): (() => void) => {
  listeners.add(listener)
  if (options?.onReconnect) {
    reconnectListeners.add(options.onReconnect)
  }
  refCount += 1
  if (refCount === 1 && !started) {
    void start()
  }

  return () => {
    listeners.delete(listener)
    if (options?.onReconnect) {
      reconnectListeners.delete(options.onReconnect)
    }
    refCount = Math.max(0, refCount - 1)
    if (refCount === 0) {
      stop()
    }
  }
}
