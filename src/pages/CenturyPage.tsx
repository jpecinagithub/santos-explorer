import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import Seo from "../components/Seo";
import SaintCard from "../components/SaintCard";
import { useReader } from "../components/ReaderContext";
import { allCenturies, saintsByCentury } from "../lib/saints";
import { centuryLabel } from "../types/saint";
import { trackEvent } from "../lib/analytics";

export function CenturiesPage() {
  const { t } = useTranslation();
  const centuries = allCenturies();
  return (
    <>
      <Seo title={t("centuries.title")} path="/siglos" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("centuries.title")}</h1>
        <p className="text-muted mb-8">{t("centuries.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {centuries.map((c) => (
            <Link
              key={c.century}
              to={`/siglo/${c.century}`}
              className="group bg-white border border-line rounded-2xl p-6 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all"
            >
              <h2 className="text-xl font-bold group-hover:text-accent-deep transition-colors">
                {centuryLabel(c.century)}
              </h2>
              <p className="text-sm font-semibold text-accent-deep mt-2">
                {c.n.toLocaleString()} {t("common.saints")}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function CenturyPage() {
  const { t } = useTranslation();
  const { n } = useParams<{ n: string }>();
  const { openSaint } = useReader();
  const century = n ? parseInt(n, 10) : NaN;

  useEffect(() => {
    if (century >= 1 && century <= 21) trackEvent("century_selected", { century });
  }, [century]);

  if (!century || century < 1 || century > 21) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">{t("common.notFound")}</h1>
        <Link to="/siglos" className="px-6 py-2.5 rounded-full bg-night text-white text-sm font-medium">
          {t("centuries.title")}
        </Link>
      </div>
    );
  }

  const list = saintsByCentury(century);

  return (
    <>
      <Seo title={centuryLabel(century)} path={`/siglo/${century}`} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-deep mb-2">{t("centuries.title")}</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{centuryLabel(century)}</h1>
        <p className="text-muted mb-8">{list.length.toLocaleString()} {t("common.saints")}</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 60).map((s) => (
            <SaintCard key={s.id} saint={s} onOpen={openSaint} />
          ))}
        </div>
        {list.length > 60 && (
          <div className="text-center mt-10">
            <Link
              to={`/explorar?century=${century}`}
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
