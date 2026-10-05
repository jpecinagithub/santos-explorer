import { useTranslation } from "react-i18next";
import { HaloIcon } from "./icons";

export function EmptyState({ onClear }: { onClear: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16 px-6">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-soft text-accent-deep mb-5">
        <HaloIcon className="w-8 h-8" />
      </span>
      <h2 className="text-2xl font-bold mb-3">{t("explore.noResults")}</h2>
      <p className="text-muted mb-2">{t("explore.noResultsTips")}</p>
      <ul className="text-sm text-ink-soft space-y-1 mb-6 list-disc list-inside">
        <li>{t("explore.tip1")}</li>
        <li>{t("explore.tip2")}</li>
        <li>{t("explore.tip3")}</li>
      </ul>
      <button
        onClick={onClear}
        className="px-6 py-2.5 rounded-full bg-night text-white text-sm font-medium hover:bg-ink-soft transition-colors"
      >
        {t("explore.clearFilters")}
      </button>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-line rounded-2xl p-5" aria-hidden>
      <div className="flex items-start gap-4">
        <div className="skeleton w-16 h-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-4 w-full mt-4" />
      <div className="skeleton h-4 w-5/6 mt-2" />
    </div>
  );
}
