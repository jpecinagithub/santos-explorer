import { saints, orderName, allOrders, allCountries } from "./saints";
import type { ExploreFilters, Saint, SaintTag } from "../types/saint";
import { TAGS, centuryLabel } from "../types/saint";

/** Normalize for diacritic-insensitive matching. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

interface SearchDoc extends Saint {
  nameNorm: string;
}

const docs: SearchDoc[] = saints.map((s) => ({ ...s, nameNorm: norm(s.name) }));

// ---------------------------------------------------------------- matching --
/**
 * Strict name matching. Every query token must be a word-prefix of the name,
 * or the concatenated query must appear in the spaceless name
 * ("josemaria" matches "Josemaría Escrivá"). Returns a tier (lower is better)
 * or -1 when there is no match. No fuzzy / typo tolerance by design.
 */
export function nameTier(query: string, nameNorm: string): number {
  const tokens = norm(query).split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length) return -1;
  const qn = tokens.join(" ");
  const words = nameNorm.split(/\s+/);
  const joined = words.join("");
  const concatQ = tokens.join("");
  const allWordPrefix = tokens.every((t) => words.some((w) => w.startsWith(t)));
  if (!allWordPrefix && !joined.includes(concatQ)) return -1;
  if (nameNorm === qn) return 0;
  if (nameNorm.startsWith(qn)) return 1;
  if (allWordPrefix) return 2;
  return 3;
}

// ---------------------------------------------------------------- parsing --
// Palabras en español para el parseo de consultas ("mártires siglo III", "beato franciscano").
const TAG_WORDS: { words: string[]; tag: SaintTag }[] = [
  { words: ["martir", "mártir", "martires", "mártires"], tag: "martir" },
  { words: ["doctor", "doctores", "doctora", "doctoras"], tag: "doctor" },
  { words: ["papa", "papas"], tag: "papa" },
  { words: ["apostol", "apóstol", "apostoles", "apóstoles"], tag: "apostol" },
  { words: ["evangelista", "evangelistas"], tag: "evangelista" },
  { words: ["fundador", "fundadora", "fundadores", "fundadoras"], tag: "fundador" },
  { words: ["mistico", "místico", "mistica", "mística", "misticos", "místicos"], tag: "mistico" },
  { words: ["misionero", "misionera", "misioneros", "misioneras"], tag: "misionero" },
  { words: ["virgen", "virgenes", "vírgenes"], tag: "virgen" },
  { words: ["ermitaño", "ermitano", "ermitaños", "anacoreta", "anacoretas"], tag: "ermitano" },
  { words: ["teologo", "teólogo", "teologos", "teólogos"], tag: "teologo" },
];

const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20, xxi: 21,
};

// Tratamientos que no forman parte del nombre en el índice.
const STOPWORDS = new Set([
  "san", "santa", "santo", "sor", "fray", "frei", "padre", "madre",
  "don", "dona", "doña",
]);

export interface ParsedQuery {
  text: string;
  century: number | null;
  tag: SaintTag | null;
  status: "santo" | "beato" | null;
  order: string | null;
  country: string | null;
}

/** Extract structured hints (century, tag, status, order, country) from free text. Deterministic, no LLM. */
export function parseQuery(q: string): ParsedQuery {
  const n = norm(q);
  let text = n;
  let century: number | null = null;
  let tag: SaintTag | null = null;
  let status: "santo" | "beato" | null = null;
  let order: string | null = null;
  let country: string | null = null;

  // Siglo: "siglo xiii", "s. xiii", "s xiii"
  const sigloMatch = n.match(/\b(?:siglo|s\.?)\s*([ivxl]+|\d{1,2})\b/);
  if (sigloMatch) {
    const raw = sigloMatch[1];
    century = /^\d+$/.test(raw) ? parseInt(raw, 10) : (ROMAN[raw] ?? null);
    if (century && century >= 1 && century <= 21) text = text.replace(sigloMatch[0], " ");
    else century = null;
  }

  // Estado: beato/a/os/as
  if (/\bbeat[oa]s?\b/.test(text)) {
    status = "beato";
    text = text.replace(/\bbeat[oa]s?\b/g, " ");
  }

  for (const tw of TAG_WORDS) {
    for (const w of tw.words) {
      if (text.split(/\s+/).includes(w)) {
        tag = tw.tag;
        text = text.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
        break;
      }
    }
    if (tag) break;
  }

  // Orden religiosa: "franciscano", "carmelitas", "de la salle"...
  for (const o of allOrders()) {
    const on = norm(o.es);
    const words = text.split(/\s+/).filter(Boolean);
    const hitWord = words.some((t) => t.length >= 4 && (on.startsWith(t) || t.startsWith(on)));
    const hitFull = on.length > 3 && text.includes(on);
    if (hitWord || hitFull) {
      order = o.id;
      text = text.replace(on, " ");
      for (const w of words) {
        if (w.length >= 4 && (on.startsWith(w) || w.startsWith(on))) {
          text = text.replace(new RegExp(`\\b${w}\\b`, "g"), " ");
        }
      }
      break;
    }
  }

  // País: "italia", "españa", "méxico"...
  for (const c of allCountries()) {
    const cn = norm(c.name);
    if (cn.length > 2 && new RegExp(`\\b${cn}\\b`).test(text)) {
      country = c.c;
      text = text.replace(new RegExp(`\\b${cn}\\b`, "g"), " ");
      break;
    }
  }

  // Tratamientos fuera.
  text = text
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, century, tag, status, order, country };
}

// ---------------------------------------------------------------- search ---
export interface SearchResult {
  saint: Saint;
  score: number;
}

function matchesFilters(s: Saint, f: ExploreFilters): boolean {
  if (f.tag !== "all" && !s.tags.includes(f.tag)) return false;
  if (f.order !== "all" && s.order !== f.order) return false;
  if (f.country && s.country?.c !== f.country) return false;
  if (f.century != null && s.century !== f.century) return false;
  if (f.status !== "all" && s.status !== f.status) return false;
  if (f.sex !== "all" && s.sex !== f.sex) return false;
  return true;
}

export function searchSaints(filters: ExploreFilters): SearchResult[] {
  const parsed = parseQuery(filters.q);
  const eff: ExploreFilters = {
    ...filters,
    tag: filters.tag !== "all" ? filters.tag : (parsed.tag ?? "all"),
    century: filters.century ?? parsed.century,
    status: filters.status !== "all" ? filters.status : (parsed.status ?? "all"),
    order: filters.order !== "all" ? filters.order : (parsed.order ?? "all"),
    country: filters.country ?? parsed.country,
  };

  const pool: SearchDoc[] = docs.filter((s) => matchesFilters(s, eff));

  if (!parsed.text) {
    // No free text: structured results, chronological.
    return pool
      .map((saint) => ({ saint, score: 1 }))
      .sort((a, b) => (a.saint.death ?? a.saint.birth ?? 9999) - (b.saint.death ?? b.saint.birth ?? 9999));
  }

  // Strict name matching only: no fuzzy, no summary trawling.
  return pool
    .map((s) => ({ saint: s as Saint, tier: nameTier(parsed.text, s.nameNorm) }))
    .filter((r) => r.tier >= 0)
    .sort((a, b) => a.tier - b.tier || a.saint.name.localeCompare(b.saint.name, "es"))
    .map(({ saint, tier }) => ({ saint, score: tier }));
}

// ------------------------------------------------------------ autocomplete --
export interface Suggestion {
  kind: "saint" | "topic" | "hint";
  label: string;
  sub?: string;
  saint?: Saint;
  query?: string;
}

/** Nombres de categoría en español para las pistas del autocompletado. */
const TAG_ES: Record<SaintTag, string> = {
  martir: "mártires",
  doctor: "doctores",
  papa: "papas",
  apostol: "apóstoles",
  evangelista: "evangelistas",
  fundador: "fundadores",
  mistico: "místicos",
  misionero: "misioneros",
  virgen: "vírgenes",
  ermitano: "ermitaños",
  teologo: "teólogos",
};

/** Fast suggestions for the command-style autocomplete panel. */
export function suggest(query: string, limit = 8): Suggestion[] {
  const qn = norm(query);
  if (qn.length < 2) return [];
  const out: Suggestion[] = [];

  const starts: Saint[] = [];
  const contains: Saint[] = [];
  for (const s of saints) {
    const n = norm(s.name);
    if (n.startsWith(qn)) starts.push(s);
    else if (n.includes(qn)) contains.push(s);
    if (starts.length + contains.length > 40) break;
  }
  const nameHits = [...starts, ...contains].slice(0, 5);
  for (const s of nameHits) {
    const bits: string[] = [];
    if (s.country) bits.push(s.country.n);
    const ord = orderName(s.order);
    if (ord) bits.push(ord);
    if (s.century) bits.push(centuryLabel(s.century));
    out.push({ kind: "saint", label: s.name, sub: bits.join(" · "), saint: s });
  }

  // Coincidencias por tema: categorías y órdenes (en español).
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const s of saints) {
    const cand = [...s.tags.map((tg) => TAG_ES[tg]), orderName(s.order) ?? ""].filter(Boolean);
    for (const k of cand) {
      const kn = norm(k);
      if (kn.includes(qn) && !seen.has(kn) && kn.length > 2) {
        seen.add(kn);
        topics.push(k);
        if (topics.length > 12) break;
      }
    }
    if (topics.length > 12) break;
  }
  for (const k of topics.slice(0, 3)) {
    if (out.length >= limit) break;
    out.push({ kind: "topic", label: k, query: k });
  }

  // Pista estructurada (p. ej. "mártires siglo iii").
  const parsed = parseQuery(query);
  if ((parsed.century || parsed.tag || parsed.status || parsed.order || parsed.country) && out.length < limit) {
    const bits: string[] = [];
    if (parsed.tag) bits.push(TAG_ES[parsed.tag]);
    if (parsed.order) bits.push(orderName(parsed.order) ?? parsed.order);
    if (parsed.country) bits.push(allCountries().find((c) => c.c === parsed.country)?.name ?? "");
    if (parsed.century) bits.push(centuryLabel(parsed.century));
    if (parsed.status) bits.push("beatos");
    out.push({ kind: "hint", label: bits.filter(Boolean).join(" · "), query });
  }

  return out.slice(0, limit);
}

export { TAGS };
