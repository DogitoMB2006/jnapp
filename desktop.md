# JNApp — Desktop Release Process

## How It Works

Releases are fully automated via GitHub Actions. You **never build locally** for releases.
Pushing a version tag triggers the workflow which:
1. Creates a GitHub release (draft)
2. Builds the app on a Windows runner with the signing key
3. Generates `latest.json` (used by the in-app auto-updater)
4. Publishes the release

---

## Step-by-Step: Releasing a New Version

### 1. Bump the version in 3 files

**`package.json`**
```json
"version": "1.23.0"
```

**`src-tauri/Cargo.toml`**
```toml
version = "1.23.0"
```

**`src-tauri/tauri.conf.json`**
```json
"version": "1.23.0"
```

All 3 must match exactly.

---

### 2. Commit the version bump

```bash
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore(release): v1.23.0"
```

---

### 3. Push commits to main

```bash
git push origin main
```

---

### 4. Create and push the version tag

```bash
git tag v1.23.0
git push origin main --tags
```

Pushing the tag **triggers the GitHub Actions release workflow automatically**.

---

### 5. Wait for GitHub Actions to finish

Monitor progress at:
```
https://github.com/DogitoMB2006/jnapp/actions
```

The workflow takes ~5–10 minutes. When done, the release is published at:
```
https://github.com/DogitoMB2006/jnapp/releases
```

Artifacts produced:
- `JNApp_1.23.0_x64_en-US.msi` — Windows MSI installer
- `JNApp_1.23.0_x64-setup.exe` — Windows NSIS installer
- `latest.json` — auto-updater manifest (signed)

---

## How the Auto-Updater Works

The app checks this URL on startup:
```
https://github.com/DogitoMB2006/jnapp/releases/latest/download/latest.json
```

`latest.json` contains the new version number + download URL + signature.
If version in `latest.json` > current installed version → update prompt shown.

The signing key lives as a GitHub repo secret (`TAURI_SIGNING_PRIVATE_KEY`).
**Never build locally for production** — the key is not stored locally.

---

## Android APK (separate process)

APK is built locally (not via GitHub Actions):

```bash
npm run tauri android build -- --apk
```

Output:
```
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
```

Upload the APK manually to the GitHub release page after the desktop workflow finishes.

---

## Quick Reference

| Task | Command |
|------|---------|
| Bump version | Edit `package.json`, `Cargo.toml`, `tauri.conf.json` |
| Commit bump | `git commit -m "chore(release): vX.X.X"` |
| Push + tag | `git push origin main && git tag vX.X.X && git push origin main --tags` |
| Monitor build | `https://github.com/DogitoMB2006/jnapp/actions` |
| Build APK locally | `npm run tauri android build -- --apk` |

---

## Troubleshooting

**Build fails with "TAURI_SIGNING_PRIVATE_KEY secret empty"**
→ Go to GitHub repo → Settings → Secrets and variables → Actions → verify `TAURI_SIGNING_PRIVATE_KEY` secret exists with the full minisign private key content.

**`latest.json` not found after release**
→ Check workflow ran successfully. The `includeUpdaterJson: true` flag in `release.yml` generates it automatically.

**Tag already exists error**
→ `git tag -d vX.X.X` (delete local) then `git push origin --delete vX.X.X` (delete remote), then re-tag.
