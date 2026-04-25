import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import type { Analytics } from "firebase/analytics"
import { isAnyTauri } from "./platform"

const readFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) {
    return null
  }
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
}

let cachedApp: FirebaseApp | null = null

export const getFirebaseApp = (): FirebaseApp | null => {
  const config = readFirebaseConfig()
  if (!config?.projectId) {
    return null
  }
  if (cachedApp) {
    return cachedApp
  }
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(config)
  return cachedApp
}

/**
 * Web-only Analytics (PWA / browser). Tauri (desktop + mobile) uses native FCM; skip here.
 *
 * Do not static-import `firebase/analytics`: it loads a separate chunk that ad blockers and
 * privacy tools often block (net::ERR_BLOCKED_BY_CLIENT), which can white-screen the whole app.
 * Dynamic import only on the non-Tauri web path, with try/catch if the chunk still fails.
 */
export const initFirebaseWebAnalytics = async (): Promise<Analytics | null> => {
  if (isAnyTauri) {
    return null
  }
  const app = getFirebaseApp()
  if (!app) {
    return null
  }
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics")
    if (!(await isSupported())) {
      return null
    }
    return getAnalytics(app)
  } catch {
    return null
  }
}
