import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import SearchBar from "../components/SearchBar";
import SaintCard from "../components/SaintCard";
import { TAG_ICONS, DiceIcon, ArrowRightIcon } from "../components/icons";
import { useReader } from "../components/ReaderContext";
import {
  allOrders,
  allCountries,
  allCenturies,
  famousSaints,
  randomSaint,
  tagCount,
  getSaintById,
  orderName,
  TOTAL_SAINTS,
} from "../lib/saints";
import { getRecent, pushRecent } from "../lib/recent";
import { TAGS, TAG_SLUG, centuryLabel, type SaintTag } from "../types/saint";
import { trackEvent } from "../lib/analytics";

function SectionHead({ title, sub, linkTo, linkLabel }: { title: string; sub: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-muted mt-1">{sub}</p>}
      </div>
      <Link to={linkTo} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-accent-deep hover:gap-2.5 transition-all shrink-0">
        {linkLabel}
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openSaint } = useReader();

  const orders = allOrders().slice(0, 8);
  const countries = allCountries();
  const centuries = allCenturies();
  const famous = famousSaints().slice(0, 6);
  const recent = getRecent()
    .map((id) => getSaintById(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .slice(0, 4);

  const surprise = () => {
    const s = randomSaint();
    trackEvent("random_saint", { from: "home" });
    pushRecent(s.id);
    navigate(`/santo/${s.id}`);
  };

  const tagCards: { tag: SaintTag; n: number }[] = TAGS.map((tag) => ({ tag, n: tagCount(tag) })).sort((a, b) => b.n - a.n);

  return (
    <>
      <Seo path="/" />
      {/* Hero */}
      <section className="bg-night text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-5">{t("home.kicker")}</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            {t("home.title")}
          </h1>
          <p className="text-white/70 text-lg mt-5 max-w-2xl mx-auto leading-relaxed">{t("home.subtitle")}</p>
          <div className="mt-8 text-left">
            <SearchBar size="hero" />
            <p className="text-white/50 text-sm mt-3 text-center">{t("home.searchHint")}</p>
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { n: TOTAL_SAINTS.toLocaleString(), l: t("home.statSaints") },
              { n: String(countries.length), l: t("home.statCountries") },
              { n: String(allOrders().length), l: t("home.statOrders") },
              { n: String(centuries.length), l: t("home.statCenturies") },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-3xl font-extrabold text-accent">{s.n}</p>
                <p className="text-white/60 text-sm mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 space-y-20">
        {/* Categories */}
        <section>
          <SectionHead title={t("home.categoriesTitle")} sub={t("home.categoriesText")} linkTo="/categorias" linkLabel={t("common.viewAll")} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tagCards.slice(0, 8).map(({ tag, n }) => {
              const Icon = TAG_ICONS[tag];
              return (
                <Link
                  key={tag}
                  to={`/categoria/${TAG_SLUG[tag]}`}
                  className="group bg-white border border-line rounded-2xl p-5 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent-soft text-accent-deep mb-3 group-hover:bg-accent group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </span>
                  <h3 className="font-bold text-ink">{t(`tags.${tag}`)}</h3>
                  <p className="text-sm text-muted mt-0.5">{n.toLocaleString()} {t("common.saints")}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Religious orders */}
        <section>
          <SectionHead title={t("home.ordersTitle")} sub={t("home.ordersText")} linkTo="/ordenes" linkLabel={t("common.viewAll")} />
          <div className="flex flex-wrap gap-2.5">
            {orders.map((o) => (
              <Link
                key={o.id}
                to={`/orden/${o.id}`}
                className="px-4 py-2 rounded-full bg-white border border-line text-sm font-medium hover:border-accent hover:text-accent-deep transition-colors"
              >
                {o.es}
                <span className="text-muted ml-1.5">{o.n}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Centuries */}
        <section>
          <SectionHead title={t("home.centuriesTitle")} sub={t("home.centuriesText")} linkTo="/siglos" linkLabel={t("common.viewAll")} />
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {centuries.map((c) => (
              <Link
                key={c.century}
                to={`/siglo/${c.century}`}
                className="bg-white border border-line rounded-xl py-3 px-2 text-center hover:border-accent hover:shadow transition-all"
              >
                <p className="font-bold text-sm">{centuryLabel(c.century)}</p>
                <p className="text-xs text-muted mt-0.5">{c.n}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Famous */}
        <section>
          <SectionHead title={t("home.famousTitle")} sub="" linkTo="/descubrir" linkLabel={t("common.viewAll")} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {famous.map((s) => (
              <SaintCard key={s.id} saint={s} onOpen={openSaint} />
            ))}
          </div>
        </section>

        {/* Random + recent */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="bg-night text-white rounded-2xl p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t("home.randomTitle")}</h2>
              <p className="text-white/60 mt-2">{t("home.randomText")}</p>
            </div>
            <button
              onClick={surprise}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-deep transition-colors self-start"
            >
              <DiceIcon className="w-5 h-5" />
              {t("home.randomButton")}
            </button>
          </div>
          <div className="bg-white border border-line rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">{t("home.recentTitle")}</h2>
            {recent.length === 0 ? (
              <p className="text-muted text-sm">{t("home.randomText")}</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li key={s.id}>
                    <button onClick={() => openSaint(s)} className="text-left font-medium text-ink hover:text-accent-deep transition-colors">
                      {s.name}
                    </button>
                    <p className="text-xs text-muted">
                      {(s.country ? s.country.n + " · " : "")}
                      {orderName(s.order) ?? ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/explorar" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-deep mt-5 hover:gap-2.5 transition-all">
              {t("home.ctaExplore")}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
