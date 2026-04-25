fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .app_manifest(tauri_build::AppManifest::new().commands(&["fcm_get_stored_token"])),
    )
    .expect("failed to run tauri-build");
}
