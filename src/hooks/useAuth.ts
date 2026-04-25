import { useEffect } from "react"
import toast from "react-hot-toast"
import i18n from "../i18n"
import insforge from "../lib/insforge"
import {
  captureTauriRefreshToStorageIfAny,
  processTauriOAuthUrlIfNeeded,
  resyncTauriTokenManagerIfHttpUserPresent,
  tryRestoreTauriSession,
} from "../lib/insforgeTauriSession"
import { isAnyTauri } from "../lib/platform"
import { useAuthStore } from "../store/authStore"
import { useGroupStore } from "../store/groupStore"

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, fetchProfile } =
    useAuthStore();
  const { fetchGroup } = useGroupStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Load persisted zustand state before the first API call (fixes cold start / process kill
      // where rehydration was slower than getCurrentUser, so cached user looked null and we logged out).
      await useAuthStore.persist.rehydrate()
      const cachedUser = useAuthStore.getState().user
      try {
        let skipRestoreFromStoredRefresh = false
        if (isAnyTauri) {
          const oauth = await processTauriOAuthUrlIfNeeded(insforge)
          if (oauth.kind === "handled" && oauth.errorMessage) {
            const msg =
              oauth.errorMessage === "Invalid OAuth session"
                ? i18n.t("login.oauthError")
                : oauth.errorMessage
            toast.error(msg)
          }
          // Fresh OAuth just wrote a new refresh token; tryRestore can run stale refresh+fail
          // and call clearPersistedRefreshTokenAsync, breaking this session.
          if (oauth.kind === "handled" && oauth.didSessionSyncFromCode) {
            skipRestoreFromStoredRefresh = true
          }
        }
        if (isAnyTauri && !skipRestoreFromStoredRefresh) {
          await tryRestoreTauriSession(insforge)
        }
        if (isAnyTauri) {
          await resyncTauriTokenManagerIfHttpUserPresent(insforge)
        }
        const { data } = await insforge.auth.getCurrentUser()
        if (!mounted) {
          return
        }

        if (data?.user) {
          if (isAnyTauri) {
            await captureTauriRefreshToStorageIfAny(insforge)
          }
          setUser({ id: data.user.id, email: data.user.email })
          try {
            await Promise.all([fetchProfile(data.user.id), fetchGroup(data.user.id)])
          } catch {
            // Profile or group can fail for new users; stay signed in; effects can retry
          }
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch {
        if (!mounted) {
          return;
        }
        if (!cachedUser) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!mounted) {
          return;
        }
        setLoading(false);
      }
    };

    const failSafe = window.setTimeout(() => {
      if (!mounted) {
        return;
      }
      setLoading(false);
    }, 8000);

    void initAuth().finally(() => {
      window.clearTimeout(failSafe);
    });

    return () => {
      mounted = false;
    };
  }, [fetchGroup, fetchProfile, setLoading, setProfile, setUser]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchGroup(user.id);
    if (!profile) {
      void fetchProfile(user.id);
    }
  }, [user?.id, profile, fetchGroup, fetchProfile]);

  return { user, profile, loading };
}
