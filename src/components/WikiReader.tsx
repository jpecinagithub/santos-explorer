import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Saint } from "../types/saint";
import { TAG_SLUG, centuryLabel, yearRange } from "../types/saint";
import { loadWikiArticle, type WikiContent } from "../lib/wiki";
import { trackEvent } from "../lib/analytics";
import { pushRecent } from "../lib/recent";
import { orderName } from "../lib/saints";
import { CloseIcon, ExternalIcon } from "./icons";
import { SaintAvatar } from "./SaintCard";

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="skeleton h-7 w-3/4" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-5/6" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}

export function WikiReaderBody({ saint }: { saint: Saint }) {
  const { t } = useTranslation();
  const [state, setState] = useState<{ status: "loading" } | { status: "ok"; data: WikiContent } | { status: "error" }>({
    status: "loading",
  });

  const load = () => {
    setState({ status: "loading" });
    // La app es 100% en español: biografía de Wikipedia en español.
    loadWikiArticle(saint.name, saint.wiki)
      .then((data) => setState({ status: "ok", data }))
      .catch(() => setState({ status: "error" }));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saint.id]);

  if (state.status === "loading") {
    return (
      <div role="status" aria-label={t("common.loading")}>
        <Skeleton />
      </div>
    );
  }

  if (state.status === "error") {
    const wikiUrl = saint.wiki
      ? `https://es.wikipedia.org/wiki/${encodeURIComponent(saint.wiki)}`
      : `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(saint.name)}`;
    return (
      <div className="text-center py-10">
        <p className="text-ink-soft mb-5">{t("saint.wikiError")}</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={load}
            className="px-5 py-2.5 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
          >
            {t("saint.retry")}
          </button>
          <a
            href={wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("wikipedia_external_link_clicked", { name: saint.name })}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-line text-sm font-medium text-ink hover:border-accent transition-colors"
          >
            {t("saint.readOnWikipedia")}
            <ExternalIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const { data } = state;
  return (
    <article>
      {data.description && (
        <p className="text-sm uppercase tracking-widest text-muted mb-2">{data.description}</p>
      )}
      {data.extract && !data.html && <p className="text-ink-soft leading-relaxed">{data.extract}</p>}
      {data.html ? (
        <div className="wiki-article" dangerouslySetInnerHTML={{ __html: data.html }} />
      ) : null}
      <div className="mt-8 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">Wikipedia (ES) · CC BY-SA</p>
        <a
          href={data.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("wikipedia_external_link_clicked", { name: saint.name })}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-deep hover:underline"
        >
          {t("saint.readOnWikipedia")}
          <ExternalIcon className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}

export function SaintHeader({ saint, compact }: { saint: Saint; compact?: boolean }) {
  const { t } = useTranslation();
  const dates = yearRange(saint);
  const statusLabel = saint.status === "beato" ? t("card.blessed") : t("card.saint");

  const facts: { label: string; value: string }[] = [];
  if (dates) facts.push({ label: t("saint.dates"), value: dates });
  if (saint.country) facts.push({ label: t("saint.country"), value: saint.country.n });
  const ord = orderName(saint.order);
  if (ord) facts.push({ label: t("saint.order"), value: ord });
  if (saint.century) facts.push({ label: t("saint.century"), value: centuryLabel(saint.century) });

  return (
    <div className={compact ? "" : "flex flex-col sm:flex-row gap-6 items-start"}>
      <SaintAvatar saint={saint} size={compact ? "md" : "lg"} />
      <div className="min-w-0 flex-1">
        <h1 className={`font-bold tracking-tight text-ink ${compact ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
          {saint.name}
        </h1>
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-deep mt-2">{statusLabel}</p>
        {facts.length > 0 && (
          <dl className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 text-sm">
            {facts.map((f) => (
              <div key={f.label} className="flex gap-1.5">
                <dt className="text-muted">{f.label}:</dt>
                <dd className="text-ink font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!compact && saint.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={t("saint.tags")}>
            {saint.tags.map((tag) => (
              <Link
                key={tag}
                to={`/categoria/${TAG_SLUG[tag]}`}
                className="text-xs px-3 py-1 rounded-full bg-accent-soft text-accent-deep font-medium hover:bg-accent hover:text-white transition-colors"
              >
                {t(`tags.${tag}`)}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Slide-over reader panel (desktop) / full-screen (mobile). */
export default function ReaderModal({
  saint,
  onClose,
}: {
  saint: Saint;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    pushRecent(saint.id);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [saint.id, onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={saint.name}>
      <div className="absolute inset-0 bg-night/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[min(720px,92vw)] bg-paper shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]">
        <div className="flex items-center justify-between gap-3 px-5 sm:px-8 py-4 border-b border-line shrink-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Vidas de Santos · {t("saint.biography")}
          </span>
          <div className="flex items-center gap-2">
            <Link
              to={`/santo/${saint.id}`}
              className="text-xs font-medium text-accent-deep hover:underline px-2 py-1"
            >
              {t("common.readMore")}
            </Link>
            <button
              onClick={onClose}
              aria-label={t("common.close")}
              className="p-2 rounded-full hover:bg-black/5 text-ink-soft"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="reader-scroll overflow-y-auto px-5 sm:px-8 py-6 grow">
          <SaintHeader saint={saint} compact />
          <div className="mt-6">
            <WikiReaderBody saint={saint} />
          </div>
        </div>
      </aside>
      <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </div>
  );
}
