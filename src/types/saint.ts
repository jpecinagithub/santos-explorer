export type SaintTag =
  | "martyr"
  | "doctor"
  | "pope"
  | "apostle"
  | "evangelist"
  | "founder"
  | "mystic"
  | "missionary"
  | "virgin"
  | "hermit"
  | "theologian";

export interface SaintCountry {
  c: string; // ISO code (or Wikidata QID fallback)
  n: string; // nombre en español
}

export interface Saint {
  id: string;
  name: string; // nombre en español (título del artículo de Wikipedia en español)
  birth: number | null;
  death: number | null;
  century: number | null; // 1 = siglo I
  country: SaintCountry | null;
  order: string | null; // order id, see SaintOrder
  sex: "m" | "f" | null;
  status: "saint" | "blessed";
  tags: SaintTag[];
  roles: string[];
  summary: string; // resumen en español
  thumb: string | null;
  wiki: string; // título del artículo de Wikipedia en español
}

export interface SaintOrder {
  id: string;
  es: string;
}

export interface ExploreFilters {
  q: string;
  tag: SaintTag | "all";
  order: string | "all";
  country: string | null; // country code
  century: number | null;
  status: "all" | "saint" | "blessed";
  sex: "all" | "m" | "f";
}

export const TAGS: SaintTag[] = [
  "martyr",
  "doctor",
  "pope",
  "apostle",
  "evangelist",
  "founder",
  "mystic",
  "missionary",
  "virgin",
  "hermit",
  "theologian",
];

export const TAG_SLUG: Record<SaintTag, string> = {
  martyr: "martyrs",
  doctor: "doctors",
  pope: "popes",
  apostle: "apostles",
  evangelist: "evangelists",
  founder: "founders",
  mystic: "mystics",
  missionary: "missionaries",
  virgin: "virgins",
  hermit: "hermits",
  theologian: "theologians",
};

export const SLUG_TAG: Record<string, SaintTag> = Object.fromEntries(
  Object.entries(TAG_SLUG).map(([k, v]) => [v, k]),
) as Record<string, SaintTag>;

export function centuryLabel(n: number): string {
  const ord = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
  return `Siglo ${ord[n - 1] ?? n}`;
}

export function yearRange(s: Saint): string | null {
  if (s.birth && s.death) return `${s.birth}–${s.death}`;
  if (s.death) return `f. ${s.death}`;
  if (s.birth) return `n. ${s.birth}`;
  return null;
}
