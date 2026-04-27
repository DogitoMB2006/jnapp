import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { AppLayout } from "./components/layout/AppLayout";
import { GroupSetupPage } from "./components/group/GroupSetupPage";
import { CustomTitleBar } from "./components/layout/CustomTitleBar";
import { useAuth } from "./hooks/useAuth";
import { useAutoUpdater } from "./hooks/useAutoUpdater"
import { useAndroidAutoUpdater } from "./hooks/useAndroidAutoUpdater";
import { useInsforgeSessionHealth } from "./hooks/useInsforgeSessionHealth";
import { useInsforgeWakeOnForeground } from "./hooks/useInsforgeWakeOnForeground";
import { UpdateModal } from "./components/layout/UpdateModal"
import { AndroidUpdateModal } from "./components/layout/AndroidUpdateModal";
import { useAuthStore, registerClearGroup } from "./store/authStore";
import { useGroupStore } from "./store/groupStore";
import { isDesktopTauri, isMobileTauri } from "./lib/platform";
import { initFirebaseWebAnalytics } from "./lib/firebaseClient";
import { useAndroidFcmRegistration } from "./hooks/useAndroidFcmRegistration"
import { useDeepLinkNavigation } from "./hooks/useDeepLinkNavigation";
const AUTOSTART_PREF = "jnapp-autostart-pref"

function App() {
  const { user, loading } = useAuth();
  const { profile, fetchProfile } = useAuthStore();
  useAndroidFcmRegistration(user?.id);
  useDeepLinkNavigation(user?.id);
  const { group, loading: groupLoading, clearGroup } = useGroupStore();
  const [showRegister, setShowRegister] = useState(false);
  registerClearGroup(clearGroup);

  useInsforgeSessionHealth(!!user);
  useInsforgeWakeOnForeground(!!user);
  useAutoUpdater(!!user);
  useAndroidAutoUpdater(!!user);

  useEffect(() => {
    void initFirebaseWebAnalytics();
  }, []);

  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!isDesktopTauri) return
    if (localStorage.getItem(AUTOSTART_PREF) !== null) return
    void (async () => {
      const { enable } = await import("@tauri-apps/plugin-autostart");
      await enable();
      localStorage.setItem(AUTOSTART_PREF, "true");
    })();
  }, []);

  const mainContent =
    loading || (user && groupLoading) ? (
      <div className="min-h-screen bg-base-100 flex flex-col">
        <CustomTitleBar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <img src="/icono.png" alt="JNApp" className="w-12 h-12 animate-bounce-gentle" />
            <span className="loading loading-dots loading-md text-primary" />
          </div>
        </div>
      </div>
    ) : user ? (
      group ? (
        <AppLayout />
      ) : (
        <GroupSetupPage />
      )
    ) : showRegister ? (
      <RegisterPage onGoToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginPage onGoToRegister={() => setShowRegister(true)} />
    )

  return (
    <>
      {mainContent}
      {isDesktopTauri && user ? <UpdateModal /> : null}
      {isMobileTauri && user ? <AndroidUpdateModal /> : null}
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
