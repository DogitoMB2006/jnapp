import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../i18n";
import insforge from "../lib/insforge";
import { useAuthStore } from "./authStore";

type Lang = "en" | "es";

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: (i18n.language as Lang) ?? "es",
      setLang: (lang) => {
        set({ lang });
        void i18n.changeLanguage(lang);
        // Persist lang to profile so backend cron generates reminders in correct language
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          void insforge.database
            .from("profiles")
            .update({ lang })
            .eq("user_id", userId);
        }
      },
    }),
    { name: "jnapp-lang" }
  )
);
