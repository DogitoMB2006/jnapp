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
        setUser(null);
        setProfile(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  return { user, profile, loading };
}
