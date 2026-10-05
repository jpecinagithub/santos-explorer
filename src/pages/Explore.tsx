import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import SaintCard, { SaintAvatar } from "../components/SaintCard";
import { EmptyState } from "../components/EmptyState";
import { useReader } from "../components/ReaderContext";
import { searchSaints } from "../lib/search";
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
      <Seo title={t("explore.title")} path="/explore" />
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

        <FilterBar
          filters={filters}
          onChange={update}
          resultCount={results.length}
        />

        {results.length === 0 ? (
          <EmptyState onClear={() => update({ ...filters, q: "", tag: "all", order: "all", country: null, century: null, status: "all", sex: "all" })} />
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
