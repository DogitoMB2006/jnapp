import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Eye, EyeOff, AtSign, Lock, ArrowLeft, ArrowRight,
  Heart, Check, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import insforge from "../../lib/insforge"
import { isAnyTauri } from "../../lib/platform"
import { syncTauriSessionFromAuthData } from "../../lib/insforgeTauriSession"
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { CustomTitleBar } from "../layout/CustomTitleBar"

/* ------------------------------------------------------------------ */
/*  Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Step = "method" | "email" | "username" | "password" | "verify";

const STEP_ORDER: Step[] = ["method", "email", "username", "password", "verify"];

const STEP_NUM: Record<Step, number> = {
  method: 0, email: 1, username: 2, password: 3, verify: 4,
};

/* ------------------------------------------------------------------ */
/*  Slide variants                                                      */
/* ------------------------------------------------------------------ */

const slide = {
  enter: (d: number) => ({ x: d * 48, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (d: number) => ({ x: d * -48, opacity: 0, scale: 0.97 }),
};

const spring = { type: "spring" as const, stiffness: 360, damping: 32 };

/* ------------------------------------------------------------------ */
/*  Google SVG logo                                                     */
/* ------------------------------------------------------------------ */

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ------------------------------------------------------------------ */
/*  OTP boxes                                                           */
/* ------------------------------------------------------------------ */

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").split("").slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i] !== " ") {
        next[i] = " ";
      } else if (i > 0) {
        next[i - 1] = " ";
        refs.current[i - 1]?.focus();
      }
      onChange(next.join("").trimEnd());
    }
  };

  const handleChange = (i: number, raw: string) => {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").trimEnd());
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(text);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i].trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onClick={() => refs.current[i]?.select()}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 bg-base-100 focus:outline-none transition-all duration-150"
          style={{
            borderColor: digits[i].trim()
              ? "hsl(var(--p))"
              : "rgba(255,255,255,0.1)",
            color: "hsl(var(--bc))",
            caretColor: "transparent",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

interface RegisterPageProps {
  onGoToLogin: () => void;
}

export function RegisterPage({ onGoToLogin }: RegisterPageProps) {
  const { t } = useTranslation();
  const { setUser, fetchProfile } = useAuthStore();
  const { fetchGroup } = useGroupStore();

  const [step, setStep]               = useState<Step>("method");
  const [dir, setDir]                 = useState(1);
  const [email, setEmail]             = useState("");
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPw, setConfirmPw]     = useState("");
  const [code, setCode]               = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy]               = useState(false);

  const goTo = useCallback((next: Step, forward = true) => {
    setDir(forward ? 1 : -1);
    setStep(next);
  }, []);

  /* ---- Google OAuth ---- */
  const handleGoogle = async () => {
    setBusy(true);
    try {
      const redirectTo =
        import.meta.env.VITE_INSFORGE_OAUTH_REDIRECT_URL ||
        (typeof window !== "undefined" ? window.location.origin : undefined);

      const { data, error } = await insforge.auth.signInWithOAuth({
        provider: "google",
        redirectTo,
        skipBrowserRedirect: false,
      });

      if (error) {
        throw new Error(error.message || t("register.errors.googleUnavailable"));
      }
      if (isAnyTauri && data?.url) {
        window.location.href = data.url
        return
      }
      return;
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t("register.errors.googleUnavailable");
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  /* ---- Email step ---- */
  const handleEmailNext = () => {
    const v = email.trim();
    if (!v || !v.includes("@") || !v.includes(".")) {
      toast.error(t("register.errors.invalidEmail")); return;
    }
    goTo("username");
  };

  /* ---- Username step ---- */
  const handleUsernameNext = () => {
    if (!username.trim()) {
      toast.error(t("register.errors.emptyUsername")); return;
    }
    goTo("password");
  };

  /* ---- Password step → register ---- */
  const handleRegister = async () => {
    if (password.length < 6) {
      toast.error(t("register.errors.shortPassword")); return;
    }
    if (password !== confirmPw) {
      toast.error(t("register.errors.passwordMismatch")); return;
    }
    setBusy(true);
    const { data, error } = await insforge.auth.signUp({ email: email.trim(), password });
    if (error) {
      toast.error(error.message || t("register.errors.registrationFailed"));
      setBusy(false); return;
    }
    if (data?.requireEmailVerification) {
      goTo("verify");
    } else if (data?.accessToken && data?.user) {
      if (isAnyTauri) {
        await syncTauriSessionFromAuthData(insforge, data)
      }
      await finishSignIn(data.user.id, data.user.email as string);
    }
    setBusy(false);
  };

  /* ---- Verify step ---- */
  const handleVerify = async () => {
    if (code.replace(/\s/g, "").length < 6) {
      toast.error(t("register.errors.shortCode")); return;
    }
    setBusy(true);
    const { error: verifyErr } = await insforge.auth.verifyEmail({
      email: email.trim(),
      otp: code.replace(/\s/g, ""),
    });
    if (verifyErr) {
      toast.error(verifyErr.message || t("register.errors.invalidCode"));
      setBusy(false); return;
    }
    const { data: signIn, error: signInErr } = await insforge.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInErr || !signIn?.user) {
      toast.success("Email verified! Please sign in.");
      onGoToLogin(); setBusy(false); return;
    }
    if (isAnyTauri) {
      await syncTauriSessionFromAuthData(insforge, signIn)
    }
    await finishSignIn(signIn.user.id, signIn.user.email as string);
    setBusy(false);
  };

  const finishSignIn = async (userId: string, userEmail: string) => {
    setUser({ id: userId, email: userEmail });
    await insforge.database.from("profiles").insert([{
      user_id: userId,
      username: username.trim().toLowerCase().replace(/\s+/g, "_"),
      display_name: username.trim(),
      avatar_url: null,
    }]);
    await Promise.all([fetchProfile(userId), fetchGroup(userId)]);
    toast.success(t("register.welcome"));
  };

  /* ---------------------------------------------------------------- */
  /*  Step content                                                      */
  /* ---------------------------------------------------------------- */

  const stepNum = STEP_NUM[step];

  const renderStep = () => {
    switch (step) {

      /* ---- METHOD ---- */
      case "method":
        return (
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col items-center gap-1 mb-2 text-center">
              <h1 className="text-2xl font-extrabold text-base-content tracking-tight">
                {t("register.methodTitle")}
              </h1>
              <p className="text-base-content/50 text-sm">{t("register.methodSubtitle")}</p>
            </div>

            {/* Google */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogle}
              disabled={busy}
              className="w-full min-h-[3rem] h-12 rounded-2xl flex items-center justify-center gap-3 font-semibold text-base transition-colors"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1.5px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleLogo />}
              {t("register.withGoogle")}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-base-content/10" />
              <span className="text-base-content/30 text-xs font-medium">or</span>
              <div className="flex-1 h-px bg-base-content/10" />
            </div>

            {/* Email */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => goTo("email")}
              className="w-full min-h-[3rem] h-12 btn btn-primary rounded-2xl flex items-center justify-center gap-3 font-semibold text-base"
            >
              <Mail size={20} />
              {t("register.withEmail")}
            </motion.button>

            <p className="text-center text-xs text-base-content/40 mt-1">
              {t("register.alreadyHaveAccount")}{" "}
              <button
                onClick={onGoToLogin}
                className="text-primary font-semibold hover:underline"
              >
                {t("register.signIn")}
              </button>
            </p>
          </div>
        );

      /* ---- EMAIL ---- */
      case "email":
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-extrabold text-base-content tracking-tight">
                {t("register.emailTitle")}
              </h2>
              <p className="text-base-content/45 text-xs">{t("register.emailSubtitle")}</p>
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailNext()}
                placeholder={t("register.emailPlaceholder")}
                className="input input-bordered w-full pl-10 h-12 bg-base-100 focus:outline-primary rounded-xl text-sm"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEmailNext}
              className="w-full h-12 btn btn-primary rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              {t("register.next")} <ArrowRight size={16} />
            </motion.button>
          </div>
        );

      /* ---- USERNAME ---- */
      case "username":
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-extrabold text-base-content tracking-tight">
                {t("register.usernameTitle")}
              </h2>
              <p className="text-base-content/45 text-xs">{t("register.usernameSubtitle")}</p>
            </div>

            <div className="relative">
              <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUsernameNext()}
                placeholder={t("register.usernamePlaceholder")}
                className="input input-bordered w-full pl-10 h-12 bg-base-100 focus:outline-primary rounded-xl text-sm"
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleUsernameNext}
              className="w-full h-12 btn btn-primary rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              {t("register.next")} <ArrowRight size={16} />
            </motion.button>
          </div>
        );

      /* ---- PASSWORD ---- */
      case "password":
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-xl font-extrabold text-base-content tracking-tight">
                {t("register.passwordTitle")}
              </h2>
              <p className="text-base-content/45 text-xs">{t("register.passwordSubtitle")}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("register.passwordPlaceholder")}
                  className="input input-bordered w-full pl-10 pr-10 h-12 bg-base-100 focus:outline-primary rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/35 hover:text-base-content/70 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !busy && handleRegister()}
                  placeholder={t("register.confirmPlaceholder")}
                  className="input input-bordered w-full pl-10 pr-10 h-12 bg-base-100 focus:outline-primary rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/35 hover:text-base-content/70 transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleRegister}
              disabled={busy}
              className="w-full h-12 btn btn-primary rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <><Heart size={15} className="fill-white" /> {t("register.createAccount")}</>}
            </motion.button>
          </div>
        );

      /* ---- VERIFY ---- */
      case "verify":
        return (
          <div className="flex flex-col gap-5 w-full">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-base-content tracking-tight">
                {t("register.verifyTitle")}
              </h2>
              <p className="text-base-content/45 text-xs leading-relaxed">
                {t("register.verifySubtitle")}{" "}
                <span className="text-primary font-medium">{email}</span>
              </p>
            </div>

            <OtpInput value={code} onChange={setCode} />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleVerify}
              disabled={busy || code.replace(/\s/g, "").length < 6}
              className="w-full h-12 btn btn-primary rounded-2xl flex items-center justify-center gap-2 font-semibold"
            >
              {busy
                ? <Loader2 size={18} className="animate-spin" />
                : <><Check size={16} /> {t("register.verify")}</>
              }
            </motion.button>
          </div>
        );
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen min-h-[100dvh] bg-base-100 flex flex-col overflow-hidden select-none pt-[env(safe-area-inset-top,0px)]">
      <CustomTitleBar />

      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 340, height: 340,
            top: -80, right: -80,
            background: "radial-gradient(circle, rgba(255,45,107,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 300, height: 300,
            bottom: -60, left: -60,
            background: "radial-gradient(circle, rgba(120,40,200,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Floating hearts */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-primary/8 select-none"
            style={{
              left: `${8 + i * 28}%`,
              top: `${10 + (i % 2) * 40}%`,
              fontSize: `${28 + i * 10}px`,
            }}
            animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
            transition={{ duration: 3.5 + i * 0.6, repeat: Infinity, delay: i * 0.5 }}
          >
            ♥
          </motion.div>
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-6 gap-1"
        >
          <motion.img
            src="/icono.png"
            alt="JNApp"
            className="w-14 h-14 drop-shadow-lg"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-base font-extrabold text-base-content/70 tracking-widest text-xs uppercase">
            JNApp
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Header: back + step indicator */}
            <div className="flex items-center justify-between px-5 pt-4 pb-1 min-h-[40px]">
              {stepNum > 0 && step !== "verify" ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => {
                    const prev = STEP_ORDER[STEP_ORDER.indexOf(step) - 1];
                    goTo(prev, false);
                  }}
                  className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
                >
                  <ArrowLeft size={15} />
                </motion.button>
              ) : <div className="w-7" />}

              {/* Step dots */}
              {stepNum > 0 && (
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <motion.div
                      key={n}
                      animate={{
                        width: n === stepNum ? 20 : 6,
                        opacity: n <= stepNum ? 1 : 0.25,
                      }}
                      transition={spring}
                      className="h-1.5 rounded-full bg-primary"
                    />
                  ))}
                </div>
              )}

              <div className="w-7" />
            </div>

            {/* Sliding content */}
            <div className="px-5 pb-6 pt-2 overflow-hidden">
              <AnimatePresence custom={dir} mode="wait">
                <motion.div
                  key={step}
                  custom={dir}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={spring}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
