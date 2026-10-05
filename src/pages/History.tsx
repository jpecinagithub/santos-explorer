import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";

export default function History() {
  const { t } = useTranslation();
  const paras = [t("history.p1"), t("history.p2"), t("history.p3"), t("history.p4")];
  return (
    <>
      <Seo title={t("history.title")} path="/history" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-3">
          {t("history.kicker")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">{t("history.title")}</h1>
        <div className="space-y-5 text-ink-soft leading-relaxed text-[1.05rem]">
          {paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </>
  );
}
