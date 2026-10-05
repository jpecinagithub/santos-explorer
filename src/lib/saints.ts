import raw from "../data/saints.json";
import meta from "../data/meta.json";
import type { Saint, SaintOrder, SaintTag } from "../types/saint";
import { TAGS } from "../types/saint";

export const saints: Saint[] = raw as Saint[];

interface Meta {
  total: number;
  byCountry: { c: string; name: string; count: number }[];
  byOrder: Record<string, number>;
  byCentury: Record<string, number>;
  byTag: Record<string, number>;
  byStatus: Record<string, number>;
  orders: SaintOrder[];
  generated: string;
}

const m = meta as Meta;

export const TOTAL_SAINTS = m.total;
export const GENERATED = m.generated;

const byId = new Map<string, Saint>();
for (const s of saints) byId.set(s.id, s);

export function getSaintById(id: string): Saint | undefined {
  return byId.get(id);
}

/** Nombre de la orden en español (la app es 100% en español). */
export function orderName(orderId: string | null): string | null {
  if (!orderId) return null;
  const o = m.orders.find((x) => x.id === orderId);
  return o ? o.es : orderId;
}

export function allOrders(): { id: string; es: string; n: number }[] {
  return m.orders
    .map((o) => ({ ...o, n: m.byOrder[o.id] ?? 0 }))
    .filter((o) => o.n > 0)
    .sort((a, b) => b.n - a.n);
}

export function allCountries(): { c: string; name: string; count: number }[] {
  return m.byCountry;
}

export function topCountries(limit = 12) {
  return m.byCountry.slice(0, limit);
}

export function allCenturies(): { century: number; n: number }[] {
  return Object.entries(m.byCentury)
    .map(([k, n]) => ({ century: parseInt(k, 10), n }))
    .sort((a, b) => a.century - b.century);
}

export function tagCount(tag: SaintTag): number {
  return m.byTag[tag] ?? 0;
}

export function saintsByTag(tag: SaintTag): Saint[] {
  return saints
    .filter((s) => s.tags.includes(tag))
    .sort((a, b) => (a.death ?? a.birth ?? 9999) - (b.death ?? b.birth ?? 9999));
}

export function saintsByOrder(orderId: string): Saint[] {
  return saints
    .filter((s) => s.order === orderId)
    .sort((a, b) => (a.death ?? a.birth ?? 9999) - (b.death ?? b.birth ?? 9999));
}

export function saintsByCountry(code: string): Saint[] {
  return saints
    .filter((s) => s.country?.c === code)
    .sort((a, b) => (a.death ?? a.birth ?? 9999) - (b.death ?? b.birth ?? 9999));
}

export function saintsByCentury(century: number): Saint[] {
  return saints
    .filter((s) => s.century === century)
    .sort((a, b) => (a.death ?? a.birth ?? 9999) - (b.death ?? b.birth ?? 9999));
}

export function womenSaints(): Saint[] {
  return saints.filter((s) => s.sex === "f");
}

export function blessedList(): Saint[] {
  return saints.filter((s) => s.status === "blessed");
}

/** Santos muy conocidos presentes en el índice (por id, estable ante cambios de nombre). */
export function famousSaints(): Saint[] {
  const ids = [
    "francis-of-assisi",
    "teresa-of-avila",
    "thomas-aquinas",
    "augustine-of-hippo",
    "pope-john-paul-ii",
    "mother-teresa",
    "therese-of-lisieux",
    "ignatius-of-loyola",
    "catherine-of-siena",
    "anthony-of-padua",
    "saint-patrick",
    "francis-xavier",
    "john-of-the-cross",
    "padre-pio",
    "joan-of-arc",
    "thomas-more",
    "maximilian-kolbe",
    "oscar-romero",
  ];
  return ids.map((id) => byId.get(id)).filter((s): s is Saint => !!s);
}

export function randomSaint(exceptId?: string): Saint {
  const pool = exceptId ? saints.filter((s) => s.id !== exceptId) : saints;
  return pool[Math.floor(Math.random() * pool.length)];
}

export { TAGS };
