import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import SaintCard from "../components/SaintCard";
import { TAG_ICONS, DiceIcon } from "../components/icons";
import { useReader } from "../components/ReaderContext";
import {
  saintsByTag,
  womenSaints,
  blessedList,
  famousSaints,
  randomSaint,
} from "../lib/saints";
import { pushRecent } from "../lib/recent";
import { TAG_SLUG } from "../types/saint";
import { trackEvent } from "../lib/analytics";

export default function Discover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { openSaint } = useReader();

  const collections: { key: string; title: string; text: string; to: string; icon: keyof typeof TAG_ICONS | null }[] = [
    { key: "martyrs", title: t("discover.martyrsTitle"), text: t("discover.martyrsText"), to: "/tag/martyrs", icon: "martyr" },
    { key: "doctors", title: t("discover.doctorsTitle"), text: t("discover.doctorsText"), to: "/tag/doctors", icon: "doctor" },
    { key: "founders", title: t("discover.foundersTitle"), text: t("discover.foundersText"), to: "/tag/founders", icon: "founder" },
    { key: "popes", title: t("discover.popesTitle"), text: t("discover.popesText"), to: "/tag/popes", icon: "pope" },
    { key: "mystics", title: t("discover.mysticsTitle"), text: t("discover.mysticsText"), to: "/tag/mystics", icon: "mystic" },
    { key: "missionaries", title: t("discover.missionariesTitle"), text: t("discover.missionariesText"), to: "/tag/missionaries", icon: "missionary" },
  ];

  const women = womenSaints().slice(0, 3);
  const blessed = blessedList().slice(0, 3);
  const famous = famousSaints().slice(0, 3);

  const surprise = () => {
    const s = randomSaint();
    trackEvent("random_saint", { from: "discover" });
    pushRecent(s.id);
    navigate(`/saint/${s.id}`);
  };

  return (
    <>
      <Seo title={t("discover.title")} path="/discover" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("discover.title")}</h1>
        <p className="text-muted mb-10">{t("discover.subtitle")}</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {collections.map((c) => {
            const Icon = c.icon ? TAG_ICONS[c.icon] : null;
            return (
              <Link
                key={c.key}
                to={c.to}
                className="group bg-white border border-line rounded-2xl p-6 hover:shadow-lg hover:border-accent/50 hover:-translate-y-0.5 transition-all"
              >
                {Icon && (
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent-soft text-accent-deep mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </span>
                )}
                <h2 className="text-xl font-bold">{c.title}</h2>
                <p className="text-sm text-muted mt-1">{c.text}</p>
              </Link>
            );
          })}
        </div>

        <CollectionRow title={t("discover.womenTitle")} text={t("discover.womenText")} saints={women} onOpen={openSaint} link="/explore?sex=f" linkLabel={t("common.viewAll")} />
        <div className="mt-12">
          <CollectionRow title={t("discover.blessedTitle")} text={t("discover.blessedText")} saints={blessed} onOpen={openSaint} link="/explore?status=blessed" linkLabel={t("common.viewAll")} />
        </div>
        <div className="mt-12">
          <CollectionRow title={t("discover.doctorsTitle")} text={t("discover.doctorsText")} saints={saintsByTag("doctor").slice(0, 3)} onOpen={openSaint} link={`/tag/${TAG_SLUG.doctor}`} linkLabel={t("common.viewAll")} />
        </div>

        <div className="mt-16 bg-night text-white rounded-2xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">{t("home.randomTitle")}</h2>
            <p className="text-white/60 mt-1">{t("home.randomText")}</p>
          </div>
          <button
            onClick={surprise}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-deep transition-colors shrink-0"
          >
            <DiceIcon className="w-5 h-5" />
            {t("home.randomButton")}
          </button>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-5">{t("home.famousTitle")}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {famous.map((s) => (
              <SaintCard key={s.id} saint={s} onOpen={openSaint} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function CollectionRow({ title, text, saints, onOpen, link, linkLabel }: {
  title: string;
  text: string;
  saints: Parameters<typeof SaintCard>[0]["saint"][];
  onOpen: (s: Parameters<typeof SaintCard>[0]["saint"]) => void;
  link: string;
  linkLabel: string;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted mt-1">{text}</p>
        </div>
        <Link to={link} className="text-sm font-semibold text-accent-deep hover:underline shrink-0">{linkLabel}</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {saints.map((s) => (
          <SaintCard key={s.id} saint={s} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
