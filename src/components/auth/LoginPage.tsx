import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Heart, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import insforge from "../../lib/insforge"
import { isAnyTauri } from "../../lib/platform"
import { syncTauriSessionFromAuthData } from "../../lib/insforgeTauriSession"
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { CustomTitleBar } from "../layout/CustomTitleBar"

interface LoginPageProps {
  onGoToRegister: () => void;
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function LoginPage({ onGoToRegister }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const { setUser, fetchProfile } = useAuthStore();
  const { fetchGroup } = useGroupStore();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      toast.error(t("login.error"));
      setLoading(false);
      return;
    }

    if (isAnyTauri) {
      await syncTauriSessionFromAuthData(insforge, data)
    }
    setUser({ id: data.user.id, email: data.user.email });
    await Promise.all([fetchProfile(data.user.id), fetchGroup(data.user.id)]);
    toast.success(t("login.welcome"));
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    try {
      const redirectTo =
        import.meta.env.VITE_INSFORGE_OAUTH_REDIRECT_URL ||
        (typeof window !== "undefined" ? window.location.origin : undefined);

      const { data, error } = await insforge.auth.signInWithOAuth({
        provider: "google",
        redirectTo,
        // Must stay in this WebView on desktop Tauri: opening the system browser sends the
        // callback to localhost in Chrome while this window never receives insforge_code.
        skipBrowserRedirect: false,
      });

      if (error) {
        throw new Error(error.message || t("register.errors.googleUnavailable"));
      }
      // InsForge only assigns window.location when !isServerMode. Tauri uses isServerMode, so the
      // SDK returns authUrl in data and expects the host to navigate (same as non-Tauri + skip true).
      if (isAnyTauri && data?.url) {
        window.location.href = data.url
        return
      }
      // Browser (non-Tauri): SDK set window.location to the provider
      return;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("register.errors.googleUnavailable");
      toast.error(message);
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-base-100 flex flex-col overflow-hidden pt-[env(safe-area-inset-top,0px)]">
      <CustomTitleBar />
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-8 relative overflow-hidden">
      {/* Background decorative hearts */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/10"
            style={{
              left: `${10 + i * 18}%`,
              top: `${5 + (i % 3) * 30}%`,
              fontSize: `${40 + i * 15}px`,
            }}
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          >
            ♥
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="mb-3"
          >
            <img src="/icono.png" alt="JNApp" className="w-20 h-20 drop-shadow-lg" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-base-content tracking-tight">
            JNApp
          </h1>
          <p className="text-base-content/50 text-sm mt-1 flex items-center gap-1">
            {t("login.tagline")} <Heart size={12} className="text-primary fill-primary" />
          </p>
        </div>

        {/* Card */}
        <div className="card bg-base-200 shadow-xl border border-base-300">
          <div className="card-body p-6 sm:p-7">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || loading}
              className="w-full min-h-[2.75rem] h-12 rounded-xl flex items-center justify-center gap-3 font-semibold text-base transition-colors mb-3"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {oauthLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleLogo />}
              {t("register.withGoogle")}
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-base-content/10" />
              <span className="text-base-content/30 text-xs font-medium">or</span>
              <div className="flex-1 h-px bg-base-content/10" />
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-sm font-medium">{t("login.email")}</span>
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    className="input input-bordered w-full pl-10 pr-3 h-12 min-h-12 text-base bg-base-100 focus:outline-primary"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-sm font-medium">{t("login.password")}</span>
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40"
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input input-bordered w-full pl-10 pr-11 h-12 min-h-12 text-base bg-base-100 focus:outline-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content p-1 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full min-h-12 h-12 text-base mt-2 gap-2"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-md" />
                ) : (
                  <>
                    <Heart size={20} className="fill-white" />
                    {t("login.submit")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/40 mt-4">
          {t("register.noAccount")}{" "}
          <button
            type="button"
            onClick={onGoToRegister}
            className="text-primary font-semibold hover:underline"
          >
            {t("register.createAccount")}
          </button>
        </p>
      </motion.div>
      </div>
    </div>
  );
}
