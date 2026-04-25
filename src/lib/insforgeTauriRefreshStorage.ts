import { isAnyTauri } from "./platform"

/** Same name previously used in localStorage (migration) */
const LEGACY_LOCAL_KEY = "jnapp-insforge-refresh-v1"
const STORE_FILE = "insforge_auth.json"
const STORE_KEY = "insforgeRefreshToken"

let storeSingleton: { store: import("@tauri-apps/plugin-store").LazyStore; inited: boolean } | null = null

const getTauriStore = async () => {
  if (!isAnyTauri) {
    return null
  }
  if (!storeSingleton) {
    const { LazyStore } = await import("@tauri-apps/plugin-store")
    const store = new LazyStore(STORE_FILE, { defaults: {}, autoSave: false })
    storeSingleton = { store, inited: false }
  }
  if (!storeSingleton.inited) {
    await storeSingleton.store.init()
    storeSingleton.inited = true
  }
  return storeSingleton.store
}

const migrateFromLocalStorage = async (store: import("@tauri-apps/plugin-store").LazyStore) => {
  if (typeof localStorage === "undefined") {
    return
  }
  try {
    const legacy = localStorage.getItem(LEGACY_LOCAL_KEY)
    if (legacy) {
      await store.set(STORE_KEY, legacy)
      await store.save()
      localStorage.removeItem(LEGACY_LOCAL_KEY)
    }
  } catch {
    /* ignore */
  }
}

/** Prefer native app store on Tauri; APK WebView localStorage is unreliable. */
export const getPersistedRefreshTokenAsync = async (): Promise<string | null> => {
  if (!isAnyTauri) {
    return null
  }
  try {
    const store = await getTauriStore()
    if (!store) {
      return null
    }
    await migrateFromLocalStorage(store)
    const v = await store.get<string>(STORE_KEY)
    if (typeof v === "string" && v.length > 0) {
      return v
    }
    return null
  } catch {
    return null
  }
}

export const setPersistedRefreshTokenAsync = async (token: string) => {
  if (!isAnyTauri) {
    return
  }
  const store = await getTauriStore()
  if (!store) {
    return
  }
  await store.set(STORE_KEY, token)
  await store.save()
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(LEGACY_LOCAL_KEY)
    } catch {
      /* ignore */
    }
  }
}

export const clearPersistedRefreshTokenAsync = async () => {
  if (!isAnyTauri) {
    return
  }
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(LEGACY_LOCAL_KEY)
    } catch {
      /* ignore */
    }
  }
  try {
    const store = await getTauriStore()
    if (store) {
      await store.delete(STORE_KEY)
      await store.save()
    }
  } catch {
    /* ignore */
  }
}
