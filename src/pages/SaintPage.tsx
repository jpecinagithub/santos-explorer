import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Seo from "../components/Seo";
import { SaintHeader, WikiReaderBody } from "../components/WikiReader";
import SaintCard from "../components/SaintCard";
import { getSaintById, saintsByTag } from "../lib/saints";
import { useReader } from "../components/ReaderContext";
import { trackEvent } from "../lib/analytics";
import { useEffect } from "react";
import { pushRecent } from "../lib/recent";

export default function SaintPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { openSaint } = useReader();
  const saint = id ? getSaintById(id) : undefined;

  useEffect(() => {
    if (saint) {
      pushRecent(saint.id);
      trackEvent("saint_page_viewed", { name: saint.name });
    }
  }, [saint]);

  if (!saint) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">{t("common.notFound")}</h1>
        <Link to="/explorar" className="px-6 py-2.5 rounded-full bg-night text-white text-sm font-medium">
          {t("explore.title")}
        </Link>
      </div>
    );
  }

  const related = saint.tags.length
    ? saintsByTag(saint.tags[0]).filter((s) => s.id !== saint.id).slice(0, 3)
    : [];

  return (
    <>
      <Seo
        title={saint.name}
        description={saint.summary}
        path={`/santo/${saint.id}`}
        image={saint.thumb ?? undefined}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <SaintHeader saint={saint} />
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">{t("saint.biography")}</h2>
          <WikiReaderBody saint={saint} />
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-4">{t("common.readMore")}</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((s) => (
                <SaintCard key={s.id} saint={s} onOpen={openSaint} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
