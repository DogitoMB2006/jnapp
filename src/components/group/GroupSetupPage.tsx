import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, KeyRound, Plus, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useGroupStore } from "../../store/groupStore";
import { useAuthStore } from "../../store/authStore";
import { CustomTitleBar } from "../layout/CustomTitleBar";

type View = "home" | "join";

export function GroupSetupPage() {
  const { user } = useAuthStore();
  const { createGroup, joinGroup } = useGroupStore();
  const [view, setView] = useState<View>("home");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await createGroup(user.id);
      toast.success("¡Grupo creado!");
    } catch (e) {
      toast.error((e as Error).message || "Error al crear grupo");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!user || !code.trim() || busy) return;
    setBusy(true);
    try {
      await joinGroup(code.trim(), user.id);
      toast.success("¡Te uniste al grupo!");
    } catch (e) {
      toast.error((e as Error).message || "Código inválido");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <CustomTitleBar />
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <img src="/icono.png" alt="JNApp" className="w-14 h-14" />
            <h1 className="text-xl font-bold text-base-content">JNApp</h1>
            <p className="text-sm text-base-content/50 text-center">
              Tu espacio juntos
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {view === "home" ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col gap-3"
              >
                <p className="text-center text-sm text-base-content/60 mb-2">
                  Para comenzar, crea un grupo o únete al de tu pareja
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={busy}
                  className="btn btn-primary w-full gap-2 h-14 text-base"
                >
                  {busy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Plus size={20} />
                  )}
                  Crear grupo
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView("join")}
                  disabled={busy}
                  className="btn btn-outline w-full gap-2 h-14 text-base"
                >
                  <KeyRound size={20} />
                  Unirse con código
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => { setView("home"); setCode(""); }}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <p className="text-sm font-medium text-base-content/80">
                    Ingresa el código de tu pareja
                  </p>
                </div>

                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Ej: AB12CD34"
                  maxLength={8}
                  className="input input-bordered w-full bg-base-100 text-center text-xl tracking-widest font-mono focus:outline-primary uppercase"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleJoin();
                  }}
                />

                <button
                  onClick={handleJoin}
                  disabled={code.length < 6 || busy}
                  className="btn btn-primary w-full gap-2"
                >
                  {busy ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <>
                      <Users size={18} /> Unirse
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
