import { useEffect } from "react";
import insforge from "../lib/insforge";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading, fetchProfile } =
    useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (!mounted) return;

        if (data?.user) {
          setUser({ id: data.user.id, email: data.user.email });
          await fetchProfile(data.user.id);
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
