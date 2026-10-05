import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./i18n/en.json";
import es from "./i18n/es.json";

export type Lang = "en" | "es";

const stored = (() => {
  try {
    const v = localStorage.getItem("santos-explorer:lang");
    return v === "es" ? "es" : "en"; // EN default per standing spec
  } catch {
    return "en";
  }
})();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: stored,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setLang(lang: Lang): void {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem("santos-explorer:lang", lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
}

document.documentElement.lang = i18n.language === "es" ? "es" : "en";

export default i18n;
