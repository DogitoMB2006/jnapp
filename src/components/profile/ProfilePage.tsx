import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Save, LogOut, UserCircle, RefreshCw, CheckCircle, Monitor } from "lucide-react";
import toast from "react-hot-toast";
import insforge from "../../lib/insforge";
import { useAuthStore } from "../../store/authStore";
import { Avatar } from "../shared/Avatar";
import { useUpdaterStore } from "../../store/updaterStore";

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
const AUTOSTART_PREF = "jnapp-autostart-pref"

export function ProfilePage() {
  const { user, profile, setProfile, logout } = useAuthStore();
  const { status: updateStatus, checkForUpdate, openModal, update } = useUpdaterStore();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autostart, setAutostart] = useState(true);
  const [autostartBusy, setAutostartBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isTauriRuntime) return
    void (async () => {
      const { isEnabled } = await import("@tauri-apps/plugin-autostart");
      setAutostart(await isEnabled());
    })();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    if (!profile) {
      const { data, error } = await insforge.database.from("profiles").insert([{
        user_id: user.id,
        display_name: displayName.trim() || null,
        username: username.trim() || null,
        avatar_url: null,
      }]);
      if (!error && data) setProfile((data as typeof profile[])[0]);
    } else {
      const { data, error } = await insforge.database.from("profiles")
        .update({ display_name: displayName.trim() || null, username: username.trim() || null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (!error && data) setProfile(data as typeof profile);
    }

    if (!profile?.username && username.trim()) {
      toast.success("¡Perfil creado!");
    } else {
      toast.success("Perfil actualizado");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const key = `avatars/${user.id}.${ext}`;

    const { data: uploadData, error: uploadError } = await insforge.storage
      .from("avatars")
      .upload(key, file);

    if (uploadError || !uploadData) {
      toast.error("Error al subir imagen");
      setUploading(false);
      return;
    }

    const avatarUrl = uploadData.url || null;

    await insforge.database.from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (profile) setProfile({ ...profile, avatar_url: avatarUrl });
    toast.success("Foto actualizada");
    setUploading(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Hasta pronto");
  };

  const handleAutostartChange = async (on: boolean) => {
    if (!isTauriRuntime) return
    setAutostartBusy(true);
    try {
      const { enable, disable, isEnabled } = await import(
        "@tauri-apps/plugin-autostart"
      );
      if (on) await enable();
      else await disable();
      localStorage.setItem(AUTOSTART_PREF, on ? "true" : "false");
      setAutostart(await isEnabled());
    } catch {
      toast.error("No se pudo cambiar el inicio con Windows");
    } finally {
      setAutostartBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 max-w-sm mx-auto">
      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
        <Avatar profile={profile} size="lg" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 btn btn-primary btn-circle btn-xs shadow"
        >
          {uploading ? <span className="loading loading-spinner loading-xs" /> : <Camera size={12} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="w-full card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5 gap-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle size={18} className="text-primary" />
            <h2 className="font-bold text-base-content">Mi perfil</h2>
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">Nombre para mostrar</span></label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="¿Cómo te llaman?"
              className="input input-bordered w-full bg-base-100 input-sm h-10 focus:outline-primary"
            />
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">Nombre de usuario</span></label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="@usuario"
              className="input input-bordered w-full bg-base-100 input-sm h-10 focus:outline-primary"
            />
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">Correo</span></label>
            <input value={user?.email || ""} disabled className="input input-bordered w-full bg-base-100 input-sm h-10 opacity-50 cursor-not-allowed" />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full gap-2 mt-1">
            {saving ? <span className="loading loading-spinner loading-sm" /> : <><Save size={16} /> Guardar</>}
          </button>
        </div>
      </motion.div>

      {isTauriRuntime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="w-full card bg-base-200 border border-base-300 shadow-md"
        >
          <div className="card-body p-5 gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Monitor size={18} className="text-primary" />
              <h2 className="font-bold text-base-content text-sm">Inicio con Windows</h2>
            </div>
            <p className="text-xs text-base-content/50 mb-2">
              JNApp puede abrirse al encender el equipo. Puedes apagarlo aquí.
            </p>
            <label className="label cursor-pointer justify-between gap-4 py-1">
              <span className="label-text text-sm">
                Arrancar cuando empiece Windows
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={autostart}
                disabled={autostartBusy}
                onChange={(e) => void handleAutostartChange(e.target.checked)}
                aria-label="Abrir JNApp al iniciar Windows"
              />
            </label>
          </div>
        </motion.div>
      )}

      {/* Update check */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="w-full">
        {updateStatus === "available" ? (
          <button
            onClick={openModal}
            className="btn btn-primary btn-sm gap-2 w-full"
          >
            <RefreshCw size={14} />
            Actualizar a v{update?.version}
          </button>
        ) : updateStatus === "up-to-date" ? (
          <div className="flex items-center justify-center gap-2 text-success text-sm py-2">
            <CheckCircle size={15} />
            <span>Tienes la última actualización</span>
          </div>
        ) : (
          <button
            onClick={checkForUpdate}
            disabled={updateStatus === "checking"}
            className="btn btn-ghost btn-sm gap-2 w-full text-base-content/60"
          >
            {updateStatus === "checking"
              ? <><span className="loading loading-spinner loading-xs" /> Buscando...</>
              : <><RefreshCw size={14} /> Buscar actualizaciones</>}
          </button>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        onClick={handleLogout}
        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10 w-full max-w-xs"
      >
        <LogOut size={16} /> Cerrar sesión
      </motion.button>
    </div>
  );
}
