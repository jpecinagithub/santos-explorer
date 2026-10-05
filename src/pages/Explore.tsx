import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import SearchBar from "../components/SearchBar";
import SaintCard, { SaintAvatar } from "../components/SaintCard";
import { EmptyState } from "../components/EmptyState";
import { useReader } from "../components/ReaderContext";
import { searchSaints } from "../lib/search";
import { allCountries, orderName } from "../lib/saints";
import { centuryLabel } from "../types/saint";
import type { ExploreFilters } from "../types/saint";

const PAGE_SIZE = 24;

export default function Explore() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { openSaint } = useReader();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filters: ExploreFilters = useMemo(
    () => ({
      q: params.get("q") ?? "",
      tag: (params.get("tag") as ExploreFilters["tag"]) ?? "all",
      order: params.get("order") ?? "all",
      country: params.get("country"),
      century: params.get("century") ? Number(params.get("century")) : null,
      status: (params.get("status") as ExploreFilters["status"]) ?? "all",
      sex: (params.get("sex") as ExploreFilters["sex"]) ?? "all",
    }),
    [params],
  );

  const results = useMemo(() => searchSaints(filters), [filters]);
  const shown = results.slice(0, visible);

  const hasActiveFilter =
    filters.tag !== "all" ||
    filters.order !== "all" ||
    filters.country != null ||
    filters.century != null ||
    filters.status !== "all" ||
    filters.sex !== "all";

  const activeLabels: string[] = [];
  if (filters.tag !== "all") activeLabels.push(t(`tags.${filters.tag}`));
  if (filters.order !== "all") activeLabels.push(orderName(filters.order) ?? filters.order);
  if (filters.country) activeLabels.push(allCountries().find((c) => c.c === filters.country)?.name ?? filters.country);
  if (filters.century != null) activeLabels.push(centuryLabel(filters.century));
  if (filters.status !== "all")
    activeLabels.push(filters.status === "beato" ? t("explore.statusBlessed") : t("explore.statusSaint"));
  if (filters.sex !== "all") activeLabels.push(filters.sex === "f" ? t("explore.sexF") : t("explore.sexM"));

  const clearAll = () =>
    update({ ...filters, q: "", tag: "all", order: "all", country: null, century: null, status: "all", sex: "all" });

  const update = (f: ExploreFilters) => {
    setVisible(PAGE_SIZE);
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.tag !== "all") p.set("tag", f.tag);
    if (f.order !== "all") p.set("order", f.order);
    if (f.country) p.set("country", f.country);
    if (f.century != null) p.set("century", String(f.century));
    if (f.status !== "all") p.set("status", f.status);
    if (f.sex !== "all") p.set("sex", f.sex);
    setParams(p, { replace: true });
  };

  return (
    <>
      <Seo title={t("explore.title")} path="/explorar" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("explore.title")}</h1>
        <p className="text-muted mb-6">{t("explore.subtitle")}</p>

        <div className="mb-5 max-w-2xl">
          <SearchBar
            key={filters.q}
            initialValue={filters.q}
            onSelectSaint={(s) => openSaint(s)}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="text-muted">
            {t("explore.results", { n: results.length.toLocaleString() })}
          </span>
          {hasActiveFilter && (
            <>
              <span className="text-line">·</span>
              <span className="text-ink-soft">{activeLabels.join(" · ")}</span>
              <button
                onClick={clearAll}
                className="text-accent-deep font-medium hover:underline"
              >
                {t("explore.clearFilters")}
              </button>
            </>
          )}
        </div>

        {results.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shown.map(({ saint }) => (
                <SaintCard key={saint.id} saint={saint} onOpen={openSaint} />
              ))}
            </div>
            {visible < results.length && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="px-8 py-3 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
                >
                  {t("common.viewAll")} ({(results.length - visible).toLocaleString()})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export { SaintAvatar };
