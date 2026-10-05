import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import es from "./i18n/es.json";

// Vidas de Santos es una app 100% en español: un único idioma, sin selector.
i18n.use(initReactI18next).init({
  resources: { es: { translation: es } },
  lng: "es",
  fallbackLng: "es",
  interpolation: { escapeValue: false },
});

document.documentElement.lang = "es";

export default i18n;
