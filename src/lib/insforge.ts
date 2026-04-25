import { createClient } from "@insforge/sdk"
import { isAnyTauri } from "./platform"

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
  isServerMode: isAnyTauri,
  // Bypass subhosting URL derivation (qmf54uhk.functions.insforge.app) which can fail
  // silently on Android. Force the stable proxy path instead.
  functionsUrl: `${import.meta.env.VITE_INSFORGE_URL as string}/functions`,
})

export default insforge;
