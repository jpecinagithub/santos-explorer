import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Saint } from "../types/saint";
import { centuryLabel, yearRange } from "../types/saint";
import { orderName } from "../lib/saints";
import { ArrowRightIcon } from "./icons";

export function SaintAvatar({ saint, size = "md" }: { saint: Saint; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-28 h-28 text-4xl" : size === "sm" ? "w-10 h-10 text-base" : "w-16 h-16 text-2xl";
  if (saint.thumb) {
    return (
      <img
        src={saint.thumb}
        alt={saint.name}
        loading="lazy"
        className={`${cls} rounded-2xl object-cover border border-line bg-white shrink-0`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${cls} rounded-2xl bg-accent-soft text-accent-deep font-bold flex items-center justify-center shrink-0 border border-line`}
    >
      {saint.name.charAt(0)}
    </span>
  );
}

export function saintSubtitle(s: Saint): string {
  const bits: string[] = [];
  if (s.country) bits.push(s.country.n);
  const ord = orderName(s.order);
  if (ord) bits.push(ord);
  if (s.century) bits.push(centuryLabel(s.century));
  return bits.join(" · ");
}

export default function SaintCard({
  saint,
  onOpen,
}: {
  saint: Saint;
  onOpen?: (s: Saint) => void;
}) {
  const { t } = useTranslation();
  const dates = yearRange(saint);
  const statusLabel = saint.status === "beato" ? t("card.blessed") : t("card.saint");

  const inner = (
    <>
      <div className="flex items-start gap-4">
        <SaintAvatar saint={saint} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-ink group-hover:text-accent-deep transition-colors">
            {saint.name}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep mt-1">
            {statusLabel}
            {dates ? ` · ${dates}` : ""}
          </p>
          <p className="text-xs text-muted mt-0.5">{saintSubtitle(saint)}</p>
        </div>
      </div>
      {saint.summary && (
        <p className="text-sm text-ink-soft leading-relaxed mt-3 line-clamp-3">
          {saint.summary}
        </p>
      )}
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-deep mt-4 group-hover:gap-2.5 transition-all">
        {t("card.readBiography")}
        <ArrowRightIcon className="w-4 h-4" />
      </span>
    </>
  );

  const cls =
    "group block bg-white border border-line rounded-2xl p-5 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all text-left w-full";

  if (onOpen) {
    return (
      <button onClick={() => onOpen(saint)} className={cls} aria-label={`${t("card.readBiography")}: ${saint.name}`}>
        {inner}
      </button>
    );
  }
  return (
    <Link to={`/santo/${saint.id}`} className={cls}>
      {inner}
    </Link>
  );
}
