import { useEffect } from "react";
import insforge from "../lib/insforge";
import { useAuthStore } from "../store/authStore";
import { useGroupStore } from "../store/groupStore";

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, fetchProfile } =
    useAuthStore();
  const { fetchGroup } = useGroupStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const cachedUser = useAuthStore.getState().user;
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (!mounted) return;

        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email });
          await Promise.all([
            fetchProfile(data.user.id),
            fetchGroup(data.user.id),
          ]);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch {
        if (!mounted) return;
        // Keep persisted session if backend is temporarily unreachable on app start.
        if (!cachedUser) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    // Safety net: never allow endless splash loading on slow/failed first auth check.
    const failSafe = window.setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
    }, 8000);

    void initAuth().finally(() => window.clearTimeout(failSafe));

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
