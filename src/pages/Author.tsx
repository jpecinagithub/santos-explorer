import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import { ExternalIcon, HaloIcon } from "../components/icons";

export default function Author() {
  const { t } = useTranslation();
  return (
    <>
      <Seo title={t("author.title")} path="/autor" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-3">
          {t("author.kicker")}
        </p>

        <div className="flex items-center gap-5 mb-8">
          <span className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-soft text-accent-deep shrink-0">
            <HaloIcon className="w-10 h-10" />
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t("author.name")}</h1>
            <p className="text-accent-deep font-medium mt-1">{t("author.role")}</p>
          </div>
        </div>

        <div className="space-y-5 text-ink-soft leading-relaxed text-[1.05rem]">
          <p>{t("author.bio1")}</p>
          <p>{t("author.bio2")}</p>
          <p>{t("author.bio3")}</p>
        </div>

        <div className="mt-10 bg-white border border-line rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-2">{t("author.contactTitle")}</h2>
          <p className="text-sm text-muted mb-5">{t("author.contactText")}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:jpecina@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
            >
              {t("author.email")}: jpecina@gmail.com
            </a>
            <a
              href="https://github.com/jpecinagithub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-line text-sm font-medium hover:border-accent transition-colors"
            >
              {t("author.github")}
              <ExternalIcon className="w-4 h-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/jpecina/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-line text-sm font-medium hover:border-accent transition-colors"
            >
              {t("author.linkedin")}
              <ExternalIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 text-sm text-muted">
          <p className="font-medium text-ink mb-1">{t("author.moreProjects")}</p>
          <p>{t("author.moreProjectsText")}</p>
        </div>
      </div>
    </>
  );
}
