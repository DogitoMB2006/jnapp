import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import es from "./locales/es.json";

// Read persisted lang before Zustand is constructed
const stored = localStorage.getItem("jnapp-lang");
const parsedLang = (() => {
  try {
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { state?: { lang?: string } };
    return parsed?.state?.lang ?? null;
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: parsedLang === "en" ? "en" : "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

export default i18n;
