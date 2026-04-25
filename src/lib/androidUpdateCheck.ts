import { getVersion } from "@tauri-apps/api/app"
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification"

const GITHUB_API = "https://api.github.com/repos/DogitoMB2006/jnapp/releases/latest"

export interface AndroidUpdateInfo {
  version: string
  downloadUrl: string
  body: string | null
}

/** Compare semver strings, returns true if remote > local */
function isNewer(remote: string, local: string): boolean {
  const parse = (v: string) =>
    v.replace(/^v/, "").split(".").map((n) => parseInt(n, 10) || 0)
  const r = parse(remote)
  const l = parse(local)
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] ?? 0
    const lv = l[i] ?? 0
    if (rv > lv) return true
    if (rv < lv) return false
  }
  return false
}

export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo | null> {
  const res = await fetch(GITHUB_API, {
    headers: { Accept: "application/vnd.github+json" },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}`)
  const data = (await res.json()) as {
    tag_name: string
    body: string | null
    assets: { name: string; browser_download_url: string }[]
  }

  const remoteVersion = data.tag_name.replace(/^v/, "")
  const localVersion = await getVersion()

  if (!isNewer(remoteVersion, localVersion)) return null

  // Find APK asset
  const apkAsset = data.assets.find((a) => a.name.endsWith(".apk"))
  const downloadUrl =
    apkAsset?.browser_download_url ??
    `https://github.com/DogitoMB2006/jnapp/releases/tag/v${remoteVersion}`

  return { version: remoteVersion, downloadUrl, body: data.body }
}

export async function sendAndroidUpdateNotification(version: string): Promise<void> {
  let granted = await isPermissionGranted()
  if (!granted) {
    const p = await requestPermission()
    granted = p === "granted"
  }
  if (!granted) return
  await sendNotification({
    title: "JNApp — nueva versión disponible",
    body: `v${version} disponible. Toca para abrir JNApp y descargar.`,
    channelId: "jnapp_push",
  })
}
