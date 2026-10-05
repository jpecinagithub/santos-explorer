import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TAGS, centuryLabel, type ExploreFilters, type SaintTag } from "../types/saint";
import { allCountries, allOrders, allCenturies } from "../lib/saints";
import { FilterIcon, CloseIcon } from "./icons";

interface Props {
  filters: ExploreFilters;
  onChange: (f: ExploreFilters) => void;
  resultCount: number;
}

export default function FilterBar({ filters, onChange, resultCount }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "es" ? "es" : "en";
  const [open, setOpen] = useState(false);
  const countries = allCountries();
  const orders = allOrders();
  const centuries = allCenturies();

  const set = (patch: Partial<ExploreFilters>) => onChange({ ...filters, ...patch });

  const activeCount =
    (filters.tag !== "all" ? 1 : 0) +
    (filters.order !== "all" ? 1 : 0) +
    (filters.country ? 1 : 0) +
    (filters.century != null ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.sex !== "all" ? 1 : 0);

  const reset = () =>
    onChange({ q: filters.q, tag: "all", order: "all", country: null, century: null, status: "all", sex: "all" });

  const body = (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{t("explore.fTag")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("explore.fTag")}>
          <FilterPill active={filters.tag === "all"} onClick={() => set({ tag: "all" })}>
            {t("explore.all")}
          </FilterPill>
          {TAGS.map((tag: SaintTag) => (
            <FilterPill key={tag} active={filters.tag === tag} onClick={() => set({ tag: filters.tag === tag ? "all" : tag })}>
              {t(`tags.${tag}`)}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="f-order" className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block">
            {t("explore.fOrder")}
          </label>
          <select
            id="f-order"
            value={filters.order}
            onChange={(e) => set({ order: e.target.value })}
            className="w-full text-sm bg-white border border-line rounded-lg px-2.5 py-2 text-ink focus:border-accent focus:outline-none"
          >
            <option value="all">{t("explore.all")}</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {lang === "es" ? o.es : o.en} ({o.n})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-country" className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block">
            {t("explore.fCountry")}
          </label>
          <select
            id="f-country"
            value={filters.country ?? ""}
            onChange={(e) => set({ country: e.target.value || null })}
            className="w-full text-sm bg-white border border-line rounded-lg px-2.5 py-2 text-ink focus:border-accent focus:outline-none"
          >
            <option value="">{t("explore.all")}</option>
            {countries.map((c) => (
              <option key={c.c} value={c.c}>
                {lang === "es" ? c.es : c.en} ({c.n})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-century" className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 block">
            {t("explore.fCentury")}
          </label>
          <select
            id="f-century"
            value={filters.century ?? ""}
            onChange={(e) => set({ century: e.target.value ? Number(e.target.value) : null })}
            className="w-full text-sm bg-white border border-line rounded-lg px-2.5 py-2 text-ink focus:border-accent focus:outline-none"
          >
            <option value="">{t("explore.all")}</option>
            {centuries.map((c) => (
              <option key={c.century} value={c.century}>
                {centuryLabel(c.century, lang)} ({c.n})
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">{t("explore.fStatus")}</p>
          <div className="flex gap-2" role="group" aria-label={t("explore.fStatus")}>
            {(
              [
                ["all", t("explore.all")],
                ["saint", t("explore.statusSaint")],
                ["blessed", t("explore.statusBlessed")],
              ] as const
            ).map(([v, label]) => (
              <FilterPill key={v} active={filters.status === v} onClick={() => set({ status: v })}>
                {label}
              </FilterPill>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2 mt-4">{t("explore.fSex")}</p>
          <div className="flex gap-2" role="group" aria-label={t("explore.fSex")}>
            {(
              [
                ["all", t("explore.all")],
                ["m", t("explore.sexM")],
                ["f", t("explore.sexF")],
              ] as const
            ).map(([v, label]) => (
              <FilterPill key={v} active={filters.sex === v} onClick={() => set({ sex: v })}>
                {label}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-muted" aria-live="polite">
          {resultCount === 1 ? t("explore.result", { n: resultCount }) : t("explore.results", { n: resultCount.toLocaleString() })}
        </span>
        {activeCount > 0 && (
          <button onClick={reset} className="text-sm font-medium text-accent-deep hover:underline">
            {t("explore.clearFilters")}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      {/* Desktop: inline collapsible panel */}
      <div className="hidden md:block bg-white border border-line rounded-xl p-5">{body}</div>
      {/* Mobile: bottom sheet */}
      <div className="md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-line rounded-full text-sm font-medium shadow-sm"
          aria-haspopup="dialog"
        >
          <FilterIcon className="w-4 h-4" />
          {t("explore.filters")}
          {activeCount > 0 && (
            <span className="bg-accent text-white text-xs font-bold rounded-full w-5 h-5 inline-flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {open && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("explore.filters")}>
            <div className="absolute inset-0 bg-night/50" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute bottom-0 left-0 right-0 bg-paper rounded-t-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-line">
                <span className="font-bold text-lg">{t("explore.filters")}</span>
                <button onClick={() => setOpen(false)} aria-label={t("common.close")} className="p-2">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-5 grow">{body}</div>
              <div className="px-5 py-4 border-t border-line">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-3 rounded-full bg-night text-white font-medium"
                >
                  {t("explore.filters")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`text-sm px-3.5 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-night text-white border-night"
          : "bg-white text-ink-soft border-line hover:border-accent hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
