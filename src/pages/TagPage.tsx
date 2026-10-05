import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Seo from "../components/Seo";
import SaintCard from "../components/SaintCard";
import { TAG_ICONS } from "../components/icons";
import { useReader } from "../components/ReaderContext";
import { saintsByTag, tagCount } from "../lib/saints";
import { TAGS, TAG_SLUG, SLUG_TAG } from "../types/saint";
import { trackEvent } from "../lib/analytics";

export function TagsPage() {
  const { t } = useTranslation();
  const tags = TAGS.map((tag) => ({ tag, n: tagCount(tag) })).sort((a, b) => b.n - a.n);
  return (
    <>
      <Seo title={t("tags.title")} path="/categorias" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("tags.title")}</h1>
        <p className="text-muted mb-8">{t("tags.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map(({ tag, n }) => {
            const Icon = TAG_ICONS[tag];
            return (
              <Link
                key={tag}
                to={`/categoria/${TAG_SLUG[tag]}`}
                className="group bg-white border border-line rounded-2xl p-6 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all"
              >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-soft text-accent-deep mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </span>
                <h2 className="text-xl font-bold">{t(`tags.${tag}`)}</h2>
                <p className="text-sm text-muted mt-1 mb-3">{t(`tags.${tag}Desc`)}</p>
                <p className="text-sm font-semibold text-accent-deep">{n.toLocaleString()} {t("common.saints")}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function TagPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { openSaint } = useReader();
  const tag = slug ? SLUG_TAG[slug] : undefined;

  useEffect(() => {
    if (tag) trackEvent("tag_selected", { tag });
  }, [tag]);

  if (!tag) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">{t("common.notFound")}</h1>
        <Link to="/categorias" className="px-6 py-2.5 rounded-full bg-night text-white text-sm font-medium">
          {t("tags.title")}
        </Link>
      </div>
    );
  }

  const list = saintsByTag(tag);
  const Icon = TAG_ICONS[tag];

  return (
    <>
      <Seo title={t(`tags.${tag}`)} description={t(`tags.${tag}Desc`)} path={`/categoria/${slug}`} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-2">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent-soft text-accent-deep">
            <Icon className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t(`tags.${tag}`)}</h1>
            <p className="text-muted">{list.length.toLocaleString()} {t("common.saints")}</p>
          </div>
        </div>
        <p className="text-ink-soft mb-8 max-w-2xl">{t(`tags.${tag}Desc`)}</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 60).map((s) => (
            <SaintCard key={s.id} saint={s} onOpen={openSaint} />
          ))}
        </div>
        {list.length > 60 && (
          <div className="text-center mt-10">
            <Link
              to={`/explore?tag=${tag}`}
              className="px-8 py-3 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
            >
              {t("common.viewAll")} ({list.length.toLocaleString()})
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
