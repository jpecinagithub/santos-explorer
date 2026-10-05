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
  en: string;
  es: string;
}

export interface Saint {
  id: string;
  name: string;
  nameEs: string | null;
  birth: number | null;
  death: number | null;
  century: number | null; // 1 = 1st century
  country: SaintCountry | null;
  order: string | null; // order id, see SaintOrder
  sex: "m" | "f" | null;
  status: "saint" | "blessed";
  tags: SaintTag[];
  roles: string[];
  patron: string | null;
  summary: string;
  thumb: string | null;
  wiki: string; // English Wikipedia title
  wikiEs: string | null; // Spanish Wikipedia title
}

export interface SaintOrder {
  id: string;
  en: string;
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

export function centuryLabel(n: number, lang: "en" | "es"): string {
  if (lang === "es") {
    const ord = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
    return `Siglo ${ord[n - 1] ?? n}`;
  }
  const suf = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suf} century`;
}

export function yearRange(s: Saint): string | null {
  if (s.birth && s.death) return `${s.birth}–${s.death}`;
  if (s.death) return `d. ${s.death}`;
  if (s.birth) return `b. ${s.birth}`;
  return null;
}
