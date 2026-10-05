import Fuse from "fuse.js";
import { saints, orderName } from "./saints";
import type { ExploreFilters, Saint, SaintTag } from "../types/saint";
import { TAGS } from "../types/saint";

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
  nameNorm: norm(s.name + " " + (s.nameEs ?? "")),
  blob: norm(
    [
      s.nameEs ?? "",
      s.tags.join(" "),
      s.roles.join(" "),
      s.country?.en ?? "",
      s.country?.es ?? "",
      orderName(s.order, "en") ?? "",
      orderName(s.order, "es") ?? "",
      s.patron ?? "",
      s.summary,
      s.status,
      s.sex === "f" ? "woman female" : s.sex === "m" ? "man male" : "",
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
const TAG_WORDS: { words: string[]; tag: SaintTag }[] = [
  { words: ["martyr", "martir", "mártir", "martyrs", "martires", "mártires"], tag: "martyr" },
  { words: ["doctor", "doctores", "doctors"], tag: "doctor" },
  { words: ["pope", "papa", "popes", "papas"], tag: "pope" },
  { words: ["apostle", "apostol", "apóstol", "apostles", "apostoles", "apóstoles"], tag: "apostle" },
  { words: ["evangelist", "evangelista", "evangelists"], tag: "evangelist" },
  { words: ["founder", "fundador", "fundadora", "founders", "fundadores", "foundress"], tag: "founder" },
  { words: ["mystic", "mistico", "místico", "mystics", "misticos", "místicos"], tag: "mystic" },
  { words: ["missionary", "misionero", "misionera", "missionaries", "misioneros"], tag: "missionary" },
  { words: ["virgin", "virgen", "virgins", "virgenes", "vírgenes"], tag: "virgin" },
  { words: ["hermit", "ermitaño", "ermitano", "hermits", "anchorite", "anacoreta"], tag: "hermit" },
  { words: ["theologian", "teologo", "teólogo", "theologians"], tag: "theologian" },
];

const ROMAN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10,
  xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20, xxi: 21,
};

export interface ParsedQuery {
  text: string;
  century: number | null;
  tag: SaintTag | null;
  status: "saint" | "blessed" | null;
}

/** Extract structured hints (century, tag, status) from free text. Deterministic, no LLM. */
export function parseQuery(q: string): ParsedQuery {
  const n = norm(q);
  let text = n;
  let century: number | null = null;
  let tag: SaintTag | null = null;
  let status: "saint" | "blessed" | null = null;

  // Century: "siglo xiii", "s. xiii", "13th century", "1300s", "s xiii"
  const sigloMatch = n.match(/\b(?:siglo|s\.?)\s*([ivxl]+|\d{1,2})\b/);
  if (sigloMatch) {
    const raw = sigloMatch[1];
    century = /^\d+$/.test(raw) ? parseInt(raw, 10) : (ROMAN[raw] ?? null);
    if (century && century >= 1 && century <= 21) text = text.replace(sigloMatch[0], " ");
    else century = null;
  } else {
    const centMatch = n.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*century\b/) ?? n.match(/\b(1\d|20)\d\ds\b/);
    if (centMatch) {
      const raw = centMatch[1];
      century = raw.length >= 3 ? Math.floor(parseInt(raw, 10) / 100) + 1 : parseInt(raw, 10);
      if (century >= 1 && century <= 21) text = text.replace(centMatch[0], " ");
      else century = null;
    }
  }

  // Status: blessed / beato
  if (/\bbeat[oa]s?\b/.test(text) || /\bblessed\b/.test(text)) {
    status = "blessed";
    text = text.replace(/\bbeat[oa]s?\b/g, " ").replace(/\bblessed\b/g, " ");
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
    if (s.country) bits.push(s.country.en);
    const ord = orderName(s.order, "en");
    if (ord) bits.push(ord);
    if (s.century) bits.push(`${s.century}th c.`);
    out.push({ kind: "saint", label: s.name, sub: bits.join(" · "), saint: s });
  }

  // Topic matches from tags / orders / patronage.
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const s of saints) {
    const cand = [
      ...(s.tags as string[]),
      orderName(s.order, "en") ?? "",
      s.patron ?? "",
    ].filter(Boolean);
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

  // Parsed structured hint (e.g. "martyrs siglo iii").
  const parsed = parseQuery(query);
  if ((parsed.century || parsed.tag || parsed.status) && out.length < limit) {
    const bits: string[] = [];
    if (parsed.tag) bits.push(parsed.tag);
    if (parsed.century) bits.push(`${parsed.century}th c.`);
    if (parsed.status) bits.push(parsed.status);
    out.push({ kind: "hint", label: bits.join(" · "), query });
  }

  return out.slice(0, limit);
}

export { TAGS };
