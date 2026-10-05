import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";

export function Sources() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("sources.title")} path="/sources" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-3">
          {t("sources.kicker")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">{t("sources.title")}</h1>
        <div className="space-y-5 text-ink-soft leading-relaxed text-[1.05rem]">
          <p>{t("sources.p1")}</p>
          <p>{t("sources.p2")}</p>
          <p>{t("sources.p3")}</p>
        </div>
      </div>
    </>
  );
}

export function Privacy() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("privacy.title")} path="/privacy" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-3">
          {t("privacy.kicker")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">{t("privacy.title")}</h1>
        <div className="space-y-5 text-ink-soft leading-relaxed text-[1.05rem]">
          <p>{t("privacy.p1")}</p>
          <p>{t("privacy.p2")}</p>
          <p>{t("privacy.p3")}</p>
        </div>
      </div>
    </>
  );
}
