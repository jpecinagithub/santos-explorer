import Fuse from "fuse.js";
import { saints, orderName } from "./saints";
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
  blob: string;
}

const docs: SearchDoc[] = saints.map((s) => ({
  ...s,
  nameNorm: norm(s.name),
  blob: norm(
    [
      s.tags.join(" "),
      s.roles.join(" "),
      s.country?.n ?? "",
      orderName(s.order) ?? "",
      s.summary,
      s.status,
      s.sex === "f" ? "mujer femenina" : s.sex === "m" ? "hombre masculino" : "",
    ].join(" "),
  ),
}));

const fuse = new Fuse(docs, {
  keys: [
    { name: "nameNorm", weight: 0.55 },
    { name: "blob", weight: 0.45 },
  ],
  threshold: 0.38,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
});

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

export interface ParsedQuery {
  text: string;
  century: number | null;
  tag: SaintTag | null;
  status: "santo" | "beato" | null;
}

/** Extract structured hints (century, tag, status) from free text. Deterministic, no LLM. */
export function parseQuery(q: string): ParsedQuery {
  const n = norm(q);
  let text = n;
  let century: number | null = null;
  let tag: SaintTag | null = null;
  let status: "santo" | "beato" | null = null;

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

  text = text.replace(/\s+/g, " ").trim();
  return { text, century, tag, status };
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
  const effTag = filters.tag !== "all" ? filters.tag : parsed.tag;
  const effCentury = filters.century ?? parsed.century;
  const effStatus = filters.status !== "all" ? filters.status : (parsed.status ?? "all");
  const eff: ExploreFilters = { ...filters, tag: effTag ?? "all", century: effCentury, status: effStatus };

  const pool: SearchDoc[] = docs.filter((s) => matchesFilters(s, eff));

  if (!parsed.text) {
    // No free text: structured results, chronological.
    return pool
      .map((saint) => ({ saint, score: 1 }))
      .sort((a, b) => (a.saint.death ?? a.saint.birth ?? 9999) - (b.saint.death ?? b.saint.birth ?? 9999));
  }

  const hits = fuse.search(parsed.text, { limit: 400 });
  const poolIds = new Set(pool.map((s) => s.id));
  const qn = norm(parsed.text);
  const ranked = hits
    .filter((h) => poolIds.has(h.item.id))
    .map((h) => {
      let boost = 0;
      if (h.item.nameNorm.startsWith(qn)) boost -= 0.25;
      else if (h.item.nameNorm.includes(qn)) boost -= 0.12;
      return { saint: h.item as Saint, score: (h.score ?? 1) + boost };
    })
    .sort((a, b) => a.score - b.score);
  return ranked;
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
  if ((parsed.century || parsed.tag || parsed.status) && out.length < limit) {
    const bits: string[] = [];
    if (parsed.tag) bits.push(TAG_ES[parsed.tag]);
    if (parsed.century) bits.push(centuryLabel(parsed.century));
    if (parsed.status) bits.push("beatos");
    out.push({ kind: "hint", label: bits.join(" · "), query });
  }

  return out.slice(0, limit);
}

export { TAGS };
