import { useState, useRef, useEffect, useCallback } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { motion } from "framer-motion";
import { Camera, Save, LogOut, UserCircle, RefreshCw, CheckCircle, Monitor, Users, Copy, DoorOpen, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import insforge from "../../lib/insforge";
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { Avatar } from "../shared/Avatar";
import { useUpdaterStore } from "../../store/updaterStore";
import { useAndroidUpdaterStore } from "../../store/androidUpdaterStore";
import { useLangStore } from "../../store/langStore";
import { isDesktopTauri, isMobileTauri } from "../../lib/platform";
import { useOnSectionRefresh } from "../../hooks/useOnSectionRefresh";
const AUTOSTART_PREF = "jnapp-autostart-pref"

export function ProfilePage() {
  const { user, profile, setProfile, logout, fetchProfile } = useAuthStore();
  const { group, partnerId, leaveGroup } = useGroupStore();
  const { status: updateStatus, checkForUpdate, openModal, update } = useUpdaterStore();
  const { status: androidUpdateStatus, updateInfo: androidUpdateInfo, checkForUpdate: androidCheckForUpdate, openModal: androidOpenModal } = useAndroidUpdaterStore();
  const { lang, setLang } = useLangStore();
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autostart, setAutostart] = useState(true);
  const [autostartBusy, setAutostartBusy] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<{ display_name: string | null; username: string | null; avatar_url: string | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isDesktopTauri) return
    void (async () => {
      const { isEnabled } = await import("@tauri-apps/plugin-autostart");
      setAutostart(await isEnabled());
    })();
  }, []);

  const loadPartnerProfile = useCallback(async () => {
    if (!partnerId) return
    const { data } = await insforge.database
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("user_id", partnerId)
      .single();
    if (data) setPartnerProfile(data as typeof partnerProfile);
  }, [partnerId]);

  useEffect(() => {
    if (!partnerId) return;
    void loadPartnerProfile();
  }, [partnerId, loadPartnerProfile]);

  useOnSectionRefresh("perfil", () => {
    if (user) void fetchProfile(user.id);
    void loadPartnerProfile();
  });

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
      toast.success(t("profile.created"));
    } else {
      toast.success(t("profile.saved"));
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
      toast.error(t("profile.uploadError"));
      setUploading(false);
      return;
    }

    const avatarUrl = uploadData.url || null;

    await insforge.database.from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (profile) setProfile({ ...profile, avatar_url: avatarUrl });
    toast.success(t("profile.photoUpdated"));
    setUploading(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t("profile.loggedOut"));
  };

  const handleLeaveGroup = async () => {
    if (leavingGroup) return;
    setLeavingGroup(true);
    try {
      await leaveGroup();
      toast.success(t("profile.group.left"));
    } catch (e) {
      toast.error((e as Error).message || t("profile.group.leaveError"));
    } finally {
      setLeavingGroup(false);
    }
  };

  const handleCopyCode = () => {
    if (!group?.invite_code) return;
    void navigator.clipboard.writeText(group.invite_code);
    toast.success(t("profile.group.codeCopied"));
  };

  const handleAutostartChange = async (on: boolean) => {
    if (!isDesktopTauri) return
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
      toast.error(t("profile.autostart.error"));
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

      {/* Profile form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="w-full card bg-base-200 border border-base-300 shadow-md">
        <div className="card-body p-5 gap-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle size={18} className="text-primary" />
            <h2 className="font-bold text-base-content">{t("profile.title")}</h2>
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">{t("profile.displayName")}</span></label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("profile.displayNamePlaceholder")}
              className="input input-bordered w-full bg-base-100 input-sm h-10 focus:outline-primary"
            />
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">{t("profile.username")}</span></label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="@usuario"
              className="input input-bordered w-full bg-base-100 input-sm h-10 focus:outline-primary"
            />
          </div>

          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs font-medium">{t("profile.email")}</span></label>
            <input value={user?.email || ""} disabled className="input input-bordered w-full bg-base-100 input-sm h-10 opacity-50 cursor-not-allowed" />
          </div>

          <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full gap-2 mt-1">
            {saving ? <span className="loading loading-spinner loading-sm" /> : <><Save size={16} /> {t("profile.save")}</>}
          </button>
        </div>
      </motion.div>

      {/* Language switcher */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.105 }}
        className="w-full card bg-base-200 border border-base-300 shadow-md"
      >
        <div className="card-body p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              <span className="font-bold text-base-content text-sm">{t("profile.language")}</span>
            </div>
            <div className="flex items-center gap-1 bg-base-300 rounded-full p-1">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  lang === "en"
                    ? "bg-primary text-white shadow-sm"
                    : "text-base-content/50 hover:text-base-content"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("es")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  lang === "es"
                    ? "bg-primary text-white shadow-sm"
                    : "text-base-content/50 hover:text-base-content"
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {group && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          className="w-full card bg-base-200 border border-base-300 shadow-md"
        >
          <div className="card-body p-5 gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-primary" />
              <h2 className="font-bold text-base-content text-sm">{t("profile.group.title")}</h2>
            </div>

            {/* Partner info */}
            {partnerId ? (
              <div className="flex items-center gap-3 py-1">
                <div className="avatar placeholder">
                  <div className="w-9 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center">
                    {partnerProfile?.avatar_url ? (
                      <img src={partnerProfile.avatar_url} alt="pareja" className="w-9 h-9 object-cover rounded-full" />
                    ) : (
                      <span>{(partnerProfile?.display_name || partnerProfile?.username || "?")[0].toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-base-content">
                    {partnerProfile?.display_name || partnerProfile?.username || t("profile.group.partner")}
                  </p>
                  {partnerProfile?.username && (
                    <p className="text-xs text-base-content/50">@{partnerProfile.username}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-base-content/50">{t("profile.group.waiting")}</p>
            )}

            {/* Invite code */}
            <div className="form-control">
              <label className="label py-0">
                <span className="label-text text-xs font-medium">{t("profile.group.inviteCode")}</span>
              </label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={group.invite_code}
                  className="input input-bordered w-full bg-base-100 input-sm h-10 font-mono tracking-widest text-center text-base"
                />
                <button
                  onClick={handleCopyCode}
                  className="btn btn-outline btn-sm h-10 px-3"
                  title={t("profile.group.copyCode")}
                >
                  <Copy size={15} />
                </button>
              </div>
            </div>

            {/* Leave group */}
            <button
              onClick={handleLeaveGroup}
              disabled={leavingGroup}
              className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10 w-full mt-1"
            >
              {leavingGroup ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <DoorOpen size={15} />
              )}
              {t("profile.group.leaveGroup")}
            </button>
          </div>
        </motion.div>
      )}

      {isDesktopTauri && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="w-full card bg-base-200 border border-base-300 shadow-md"
        >
          <div className="card-body p-5 gap-2">
            <div className="flex items-center gap-2 mb-1">
              <Monitor size={18} className="text-primary" />
              <h2 className="font-bold text-base-content text-sm">{t("profile.autostart.title")}</h2>
            </div>
            <p className="text-xs text-base-content/50 mb-2">
              {t("profile.autostart.description")}
            </p>
            <label className="label cursor-pointer justify-between gap-4 py-1">
              <span className="label-text text-sm">
                {t("profile.autostart.label")}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={autostart}
                disabled={autostartBusy}
                onChange={(e) => void handleAutostartChange(e.target.checked)}
                aria-label={t("profile.autostart.label")}
              />
            </label>
          </div>
        </motion.div>
      )}

      {/* Update check — desktop */}
      {isDesktopTauri && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="w-full">
          {updateStatus === "available" ? (
            <button
              onClick={openModal}
              className="btn btn-primary btn-sm gap-2 w-full"
            >
              <RefreshCw size={14} />
              {t("profile.updates.available", { version: update?.version })}
            </button>
          ) : updateStatus === "up-to-date" ? (
            <div className="flex items-center justify-center gap-2 text-success text-sm py-2">
              <CheckCircle size={15} />
              <span>{t("profile.updates.upToDate")}</span>
            </div>
          ) : (
            <button
              onClick={() => void checkForUpdate("manual")}
              disabled={updateStatus === "checking"}
              className="btn btn-ghost btn-sm gap-2 w-full text-base-content/60"
            >
              {updateStatus === "checking"
                ? <><span className="loading loading-spinner loading-xs" /> {t("profile.updates.checking")}</>
                : <><RefreshCw size={14} /> {t("profile.updates.check")}</>}
            </button>
          )}
        </motion.div>
      )}

      {/* Update check — Android */}
      {isMobileTauri && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="w-full">
          {androidUpdateStatus === "available" ? (
            <button
              onClick={androidOpenModal}
              className="btn btn-primary btn-sm gap-2 w-full"
            >
              <RefreshCw size={14} />
              {t("profile.updates.available", { version: androidUpdateInfo?.version })}
            </button>
          ) : androidUpdateStatus === "up-to-date" ? (
            <div className="flex items-center justify-center gap-2 text-success text-sm py-2">
              <CheckCircle size={15} />
              <span>{t("profile.updates.upToDate")}</span>
            </div>
          ) : (
            <button
              onClick={() => void androidCheckForUpdate("manual")}
              disabled={androidUpdateStatus === "checking"}
              className="btn btn-ghost btn-sm gap-2 w-full text-base-content/60"
            >
              {androidUpdateStatus === "checking"
                ? <><span className="loading loading-spinner loading-xs" /> {t("profile.updates.checking")}</>
                : <><RefreshCw size={14} /> {t("profile.updates.check")}</>}
            </button>
          )}
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        onClick={handleLogout}
        className="btn btn-ghost btn-sm gap-2 text-error hover:bg-error/10 w-full max-w-xs"
      >
        <LogOut size={16} /> {t("profile.logout")}
      </motion.button>

      <AppVersion />
      {isMobileTauri && <FcmDebug />}
    </div>
  );
}

function AppVersion() {
  const [version, setVersion] = useState<string | null>(null)
  useEffect(() => {
    getVersion().then(setVersion).catch(() => undefined)
  }, [])
  if (!version) return null
  return (
    <p className="text-xs text-base-content/30 text-center select-none mt-1">
      v{version}
    </p>
  )
}

function FcmDebug() {
  const [result, setResult] = useState<string>("tap to check")
  const check = async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core")
      const token = await invoke<string | null>("fcm_get_stored_token")
      setResult(token ? `token: ${token.slice(0, 24)}...` : "null / not found")
    } catch (e) {
      setResult(`error: ${String(e)}`)
    }
  }
  return (
    <button onClick={() => void check()}
      className="text-xs text-base-content/20 text-center w-full mt-1 py-1"
    >
      FCM: {result}
    </button>
  )
}
