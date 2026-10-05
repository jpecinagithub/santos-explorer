import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import Seo from "../components/Seo";
import {
  saints, allCenturies, topCountries, allOrders, tagCount, TOTAL_SAINTS,
} from "../lib/saints";
import { TAGS, centuryLabel } from "../types/saint";

const ACCENT = "#b45309";
const ACCENT_SOFT = "#faeedc";
const INK_SOFT = "#3d434c";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-2xl p-6">
      <h2 className="text-lg font-bold mb-5">{title}</h2>
      {children}
    </section>
  );
}

export default function Statistics() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "es" ? "es" : "en";

  const byCentury = allCenturies().map((c) => ({
    name: centuryLabel(c.century, lang).replace(/^Siglo /, "s. "),
    n: c.n,
  }));
  const byCountry = topCountries(12).map((c) => ({
    name: lang === "es" ? c.es : c.en,
    n: c.n,
  }));
  const byOrder = allOrders().slice(0, 12).map((o) => ({
    name: lang === "es" ? o.es : o.en,
    n: o.n,
  }));
  const byTag = TAGS.map((tag) => ({ name: t(`tags.${tag}`), n: tagCount(tag) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const nSaints = saints.filter((s) => s.status === "saint").length;
  const nBlessed = saints.filter((s) => s.status === "blessed").length;
  const statusData = [
    { name: t("explore.statusSaint"), value: nSaints },
    { name: t("explore.statusBlessed"), value: nBlessed },
  ];

  const tooltipStyle = {
    background: "#fff",
    border: "1px solid #e6e2d8",
    borderRadius: 8,
    fontSize: 13,
  };

  return (
    <>
      <Seo title={t("statistics.title")} path="/statistics" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{t("statistics.title")}</h1>
        <p className="text-muted mb-8">{t("statistics.subtitle")}</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { n: TOTAL_SAINTS.toLocaleString(), l: t("statistics.total") },
            { n: String(nSaints.toLocaleString()), l: t("explore.statusSaint") },
            { n: String(nBlessed.toLocaleString()), l: t("explore.statusBlessed") },
            { n: String(allCenturies().length), l: t("home.statCenturies") },
          ].map((s) => (
            <div key={s.l} className="bg-white border border-line rounded-2xl p-5 text-center">
              <p className="text-3xl font-extrabold text-accent-deep">{s.n}</p>
              <p className="text-sm text-muted mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("statistics.byCentury")}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCentury} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d8" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: INK_SOFT }} interval={1} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11, fill: INK_SOFT }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" name={t("statistics.count")} fill={ACCENT} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={t("statistics.byCountry")}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCountry} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d8" />
                <XAxis type="number" tick={{ fontSize: 11, fill: INK_SOFT }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: INK_SOFT }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" name={t("statistics.count")} fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title={t("statistics.byOrder")}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={byOrder} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e2d8" />
                <XAxis type="number" tick={{ fontSize: 11, fill: INK_SOFT }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: INK_SOFT }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" name={t("statistics.count")} fill={ACCENT} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-4">
            <Card title={t("statistics.byStatus")}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    <Cell fill={ACCENT} />
                    <Cell fill={ACCENT_SOFT} stroke={ACCENT} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-sm mt-2">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: ACCENT }} />{t("explore.statusSaint")}: {nSaints.toLocaleString()}</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border" style={{ background: ACCENT_SOFT, borderColor: ACCENT }} />{t("explore.statusBlessed")}: {nBlessed.toLocaleString()}</span>
              </div>
            </Card>

            <Card title={t("statistics.byTag")}>
              <ul className="space-y-2.5">
                {byTag.map((x) => (
                  <li key={x.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{x.name}</span>
                      <span className="text-muted">{x.n.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent-soft overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${(x.n / byTag[0].n) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
