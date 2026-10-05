import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HaloIcon } from "./icons";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-night text-white/70 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-accent">
                <HaloIcon className="w-7 h-7" />
              </span>
              <span className="text-lg font-bold text-white">Vidas de Santos</span>
            </div>
            <p className="text-sm leading-relaxed">{t("footer.tagline")}</p>
            <p className="text-xs leading-relaxed mt-4 text-white/50">{t("footer.disclaimer")}</p>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t("footer.sections")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explorar" className="hover:text-accent">{t("nav.explore")}</Link></li>
              <li><Link to="/categorias" className="hover:text-accent">{t("nav.tags")}</Link></li>
              <li><Link to="/ordenes" className="hover:text-accent">{t("nav.orders")}</Link></li>
              <li><Link to="/siglos" className="hover:text-accent">{t("nav.centuries")}</Link></li>
              <li><Link to="/historia" className="hover:text-accent">{t("nav.history")}</Link></li>
              <li><Link to="/estadisticas" className="hover:text-accent">{t("nav.statistics")}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {t("footer.project")}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/fuentes" className="hover:text-accent">{t("footer.sources")}</Link></li>
              <li><Link to="/autor" className="hover:text-accent">{t("footer.author")}</Link></li>
              <li><Link to="/privacidad" className="hover:text-accent">{t("footer.privacy")}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>Vidas de Santos · <Link to="/autor" className="hover:text-accent">{t("footer.madeBy")}</Link> · jpecina@gmail.com</span>
          <span>Data: Wikipedia &amp; Wikidata · Biographies: Wikipedia (CC BY-SA)</span>
        </div>
      </div>
    </footer>
  );
}
