import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "../i18n";

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
      },
    }),
    { name: "jnapp-lang" }
  )
);
