import { createClient } from "@insforge/sdk"
import { isAnyTauri } from "./platform"

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
  isServerMode: isAnyTauri,
})

export default insforge;
