import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Heart, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import insforge from "../../lib/insforge";
import { useAuthStore } from "../../store/authStore";
import { CustomTitleBar } from "../layout/CustomTitleBar";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, fetchProfile } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    const { data, error } = await insforge.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      toast.error("Correo o contraseña incorrectos");
      setLoading(false);
      return;
    }

    setUser({ id: data.user.id, email: data.user.email });
    await fetchProfile(data.user.id);
    toast.success("¡Bienvenido!");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col overflow-hidden">
      <CustomTitleBar />
      <div className="flex flex-1 flex-col items-center justify-center p-6 relative overflow-hidden">
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
            Nuestro espacio <Heart size={12} className="text-primary fill-primary" />
          </p>
        </div>

        {/* Card */}
        <div className="card bg-base-200 shadow-xl border border-base-300">
          <div className="card-body p-6">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-medium">Correo</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="input input-bordered w-full pl-9 input-sm h-10 bg-base-100 focus:outline-primary"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-medium">Contraseña</span>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
                  />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input input-bordered w-full pl-9 pr-9 input-sm h-10 bg-base-100 focus:outline-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full mt-2 gap-2"
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <Heart size={16} className="fill-white" />
                    Entrar
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
