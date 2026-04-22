import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { LoginPage } from "./components/auth/LoginPage";
import { AppLayout } from "./components/layout/AppLayout";
import { GroupSetupPage } from "./components/group/GroupSetupPage";
import { CustomTitleBar } from "./components/layout/CustomTitleBar";
import { useAuth } from "./hooks/useAuth";
import { useInsforgeSessionHealth } from "./hooks/useInsforgeSessionHealth";
import { useInsforgeWakeOnForeground } from "./hooks/useInsforgeWakeOnForeground";
import { useAuthStore, registerClearGroup } from "./store/authStore";
import { useGroupStore } from "./store/groupStore";

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
const AUTOSTART_PREF = "jnapp-autostart-pref"

function App() {
  const { user, loading } = useAuth();
  const { profile, fetchProfile } = useAuthStore();
  const { group, loading: groupLoading, clearGroup } = useGroupStore();
  registerClearGroup(clearGroup);

  useInsforgeSessionHealth(!!user);
  useInsforgeWakeOnForeground(!!user);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!isTauriRuntime) return
    if (localStorage.getItem(AUTOSTART_PREF) !== null) return
    void (async () => {
      const { enable } = await import("@tauri-apps/plugin-autostart");
      await enable();
      localStorage.setItem(AUTOSTART_PREF, "true");
    })();
  }, []);

  if (loading || (user && groupLoading)) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col">
        <CustomTitleBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <img src="/icono.png" alt="JNApp" className="w-12 h-12 animate-bounce-gentle" />
            <span className="loading loading-dots loading-md text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (group ? <AppLayout /> : <GroupSetupPage />) : <LoginPage />}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: "#230d2b",
            color: "#f5e6ff",
            border: "1px solid #2d1238",
            borderRadius: "12px",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#ff2d6b", secondary: "#fff" } },
          error: { iconTheme: { primary: "#fca5a5", secondary: "#fff" } },
        }}
      />
    </>
  );
}

export default App;
