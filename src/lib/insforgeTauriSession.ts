import type { InsForgeClient } from "@insforge/sdk"
import {
  getPersistedRefreshTokenAsync,
  setPersistedRefreshTokenAsync,
  clearPersistedRefreshTokenAsync,
} from "./insforgeTauriRefreshStorage"
import { isAnyTauri } from "./platform"

type AuthPayload = {
  accessToken?: string | null
  user?: { id: string; email: string; [k: string]: unknown }
  refreshToken?: string | null
}

type Tm = { saveSession: (s: { accessToken: string; user: { id: string; email: string; [k: string]: unknown } }) => void; getAccessToken: () => string | null }
type Ht = { userToken: string | null; refreshToken: string | null; setAuthToken: (t: string | null) => void; setRefreshToken: (t: string | null) => void; get: (p: string) => Promise<unknown> }

const getTokenManager = (client: InsForgeClient) => {
  return (client as unknown as { tokenManager: Tm }).tokenManager
}

const getHttpPrivate = (client: InsForgeClient) =>
  client.getHttpClient() as unknown as Ht

const persistRefreshFromHttp = async (client: InsForgeClient) => {
  if (!isAnyTauri) {
    return
  }
  const h = getHttpPrivate(client)
  if (h.refreshToken) {
    await setPersistedRefreshTokenAsync(h.refreshToken)
  }
}

/**
 * Tauri: mobile auth returns refresh in JSON; the SDK's server mode also skips
 * tokenManager.saveSession, which breaks getCurrentUser and Realtime. Sync both
 * and persist the refresh token for the next cold start.
 */
export const syncTauriSessionFromAuthData = async (client: InsForgeClient, data: AuthPayload | null | undefined) => {
  const at = data?.accessToken
  if (!isAnyTauri || at == null || at === "" || !data?.user) {
    return
  }
  getTokenManager(client).saveSession({ accessToken: at, user: data.user })
  getHttpPrivate(client).setAuthToken(at)
  if (data.refreshToken) {
    getHttpPrivate(client).setRefreshToken(data.refreshToken)
  }
  if (data.refreshToken) {
    await setPersistedRefreshTokenAsync(data.refreshToken)
  } else {
    await persistRefreshFromHttp(client)
  }
}

/** Same as InsForge SDK `cleanUrlParams` (not exported) — remove OAuth query params from the WebView URL. */
const cleanUrlParams = (...paramNames: string[]) => {
  if (typeof window === "undefined") {
    return
  }
  const url = new URL(window.location.href)
  paramNames.forEach((p) => url.searchParams.delete(p))
  window.history.replaceState({}, document.title, url.toString())
}

export type TauriOAuthUrlResult =
  | { kind: "none" }
  | { kind: "handled"; errorMessage?: string; didSessionSyncFromCode?: boolean }

/**
 * Tauri + `isServerMode`: the SDK's `detectAuthCallback` is a no-op, so
 * `?insforge_code=` from the Google redirect is never exchanged and the
 * app stays on a blank / stuck screen after account pick.
 * Run this on startup before getCurrentUser.
 */
export const processTauriOAuthUrlIfNeeded = async (client: InsForgeClient): Promise<TauriOAuthUrlResult> => {
  if (!isAnyTauri || typeof window === "undefined") {
    return { kind: "none" }
  }
  const search = new URLSearchParams(window.location.search)
  const err = search.get("error")
  if (err) {
    const desc = search.get("error_description")
    cleanUrlParams("error", "error_description", "insforge_code")
    return { kind: "handled", errorMessage: (desc && decodeURIComponent(desc.replace(/\+/g, " "))) || err }
  }
  const code = search.get("insforge_code")
  if (!code) {
    return { kind: "none" }
  }
  cleanUrlParams("insforge_code")
  const { data, error } = await client.auth.exchangeOAuthCode(code)
  if (error) {
    return { kind: "handled", errorMessage: error.message }
  }
  if (!data?.accessToken || !data.user) {
    return { kind: "handled", errorMessage: "Invalid OAuth session" }
  }
  await syncTauriSessionFromAuthData(client, {
    accessToken: data.accessToken,
    user: data.user,
    refreshToken: data.refreshToken,
  })
  return { kind: "handled", didSessionSyncFromCode: true }
}

/** After OAuth (or any path where the SDK set http but not tokenManager in server mode). */
export const resyncTauriTokenManagerIfHttpUserPresent = async (client: InsForgeClient) => {
  if (!isAnyTauri) {
    return
  }
  const http = getHttpPrivate(client)
  const tm = getTokenManager(client)
  if (tm.getAccessToken() || !http.userToken) {
    return
  }
  try {
    const res = (await http.get("/api/auth/sessions/current")) as { user?: { id: string; email: string; [k: string]: unknown } }
    if (res?.user && http.userToken) {
      tm.saveSession({ accessToken: http.userToken, user: res.user })
    }
  } catch {
    /* ignore */
  }
}

export const tryRestoreTauriSession = async (client: InsForgeClient) => {
  if (!isAnyTauri) {
    return
  }
  const stored = await getPersistedRefreshTokenAsync()
  if (!stored) {
    return
  }
  getHttpPrivate(client).setRefreshToken(stored)
  const { data, error } = await client.auth.refreshSession({ refreshToken: stored })
  if (error || !data?.accessToken || !data?.user) {
    await clearPersistedRefreshTokenAsync()
    return
  }
  await syncTauriSessionFromAuthData(client, {
    accessToken: data.accessToken,
    user: data.user,
    refreshToken: data.refreshToken,
  })
}

export const captureTauriRefreshToStorageIfAny = async (client: InsForgeClient) => {
  if (!isAnyTauri) {
    return
  }
  await persistRefreshFromHttp(client)
}

export { clearPersistedRefreshTokenAsync } from "./insforgeTauriRefreshStorage"

export const healInsforgeConnection = async (client: InsForgeClient) => {
  if (isAnyTauri) {
    const r = await getPersistedRefreshTokenAsync()
    if (r) {
      getHttpPrivate(client).setRefreshToken(r)
      const { data, error } = await client.auth.refreshSession({ refreshToken: r })
      if (!error && data?.accessToken && data?.user) {
        await syncTauriSessionFromAuthData(client, {
          accessToken: data.accessToken,
          user: data.user,
          refreshToken: data.refreshToken,
        })
      }
    }
    await client.realtime.connect().catch(() => undefined)
    return
  }
  await client.auth.refreshSession().catch(() => undefined)
  await client.realtime.connect().catch(() => undefined)
}
