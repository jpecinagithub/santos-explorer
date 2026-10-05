#!/usr/bin/env node
/**
 * Fetch Spanish (es.wikipedia) summaries for all saints in src/data/saints.json.
 *
 * 1. Maps each saint's English Wikipedia title to its Spanish title via
 *    en.wikipedia langlinks (batched, 50 titles per request).
 * 2. Fetches intro extracts from es.wikipedia for the mapped titles
 *    (batched, 20 titles per request).
 * 3. Writes scripts/.cache/es-summaries.json: { saintId: summaryEs }
 *
 * build-saints.mjs merges this cache into saints.json as `summaryEs`.
 *
 * IMPORTANT: MediaWiki may normalize titles ("Joaquina Vedruna de Mas" ->
 * canonical form) or follow redirects. The `query.normalized` and
 * `query.redirects` arrays are used to correlate every response page back
 * to the requested title; without this, mappings are silently lost.
 *
 * Usage: node scripts/fetch-es-summaries.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = join(HERE, ".cache");
const SAINTS = join(HERE, "..", "src", "data", "saints.json");
mkdirSync(CACHE, { recursive: true });

const UA = "SantosExplorer/1.0 (saint discovery portal; contact: jpecina@gmail.com)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params, retries = 5) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: "json", origin: "*", ...params })}`;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (i + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${host}`);
    return res.json();
  }
  throw new Error(`gave up after ${retries} retries: ${host}`);
}

/** Build a resolver requested-title -> canonical page title from an API response. */
function aliasResolver(query) {
  const alias = new Map();
  for (const n of query?.normalized || []) alias.set(n.from, n.to);
  for (const r of query?.redirects || []) alias.set(r.from, r.to);
  return (t) => {
    let cur = t;
    const seen = new Set();
    while (alias.has(cur) && !seen.has(cur)) {
      seen.add(cur);
      cur = alias.get(cur);
    }
    return cur;
  };
}

function shortSummary(extract, max = 300) {
  const one = (extract || "").replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  const cut = one.slice(0, max);
  const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(" "));
  return (last > 120 ? cut.slice(0, last) : cut).trim() + "…";
}

const saints = JSON.parse(readFileSync(SAINTS, "utf8"));
console.log(`saints: ${saints.length}`);

const needMap = saints.filter((s) => !s.wikiEs && s.wiki);
const haveEs = saints.filter((s) => s.wikiEs);
console.log(`with wikiEs already: ${haveEs.length}, need langlinks: ${needMap.length}`);

// ---- 1. langlinks: en title -> es title (with alias resolution) ----
const enToEs = new Map();
for (let i = 0; i < needMap.length; i += 50) {
  const batch = needMap.slice(i, i + 50);
  const data = await api("en.wikipedia.org", {
    action: "query",
    prop: "langlinks",
    lllang: "es",
    lllimit: "500", // default is 10 per query — without this, most mappings are silently lost
    titles: batch.map((s) => s.wiki).join("|"),
    redirects: "1",
  });
  const q = data?.query || {};
  const resolve = aliasResolver(q);
  const byTitle = new Map(Object.values(q.pages || {}).map((p) => [p.title, p]));
  for (const s of batch) {
    const page = byTitle.get(resolve(s.wiki));
    const ll = (page?.langlinks || []).find((l) => l.lang === "es");
    if (ll) enToEs.set(s.id, ll["*"]);
  }
  process.stdout.write(`\rlanglinks ${Math.min(i + 50, needMap.length)}/${needMap.length} (resolved ${enToEs.size})`);
  await sleep(250);
}
console.log(`\nlanglinks resolved: ${enToEs.size}`);

// id -> es title
const idToEsTitle = new Map();
for (const s of haveEs) idToEsTitle.set(s.id, s.wikiEs);
for (const [id, t] of enToEs) idToEsTitle.set(id, t);
console.log(`saints with a Spanish title: ${idToEsTitle.size}`);

// ---- 2. extracts from es.wikipedia (with alias resolution) ----
const entries = [...idToEsTitle.entries()];
const summaries = {};
for (let i = 0; i < entries.length; i += 20) {
  const batch = entries.slice(i, i + 20);
  const data = await api("es.wikipedia.org", {
    action: "query",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exsectionformat: "plain",
    titles: batch.map(([, t]) => t).join("|"),
    redirects: "1",
  });
  const q = data?.query || {};
  const resolve = aliasResolver(q);
  const byTitle = new Map(Object.values(q.pages || {}).map((p) => [p.title, p]));
  for (const [id, t] of batch) {
    const page = byTitle.get(resolve(t));
    if (page && !page.missing && page.extract) summaries[id] = shortSummary(page.extract);
  }
  process.stdout.write(`\rextracts ${Math.min(i + 20, entries.length)}/${entries.length} (ok ${Object.keys(summaries).length})`);
  await sleep(250);
}
console.log(`\nSpanish summaries fetched: ${Object.keys(summaries).length}`);

writeFileSync(join(CACHE, "es-summaries.json"), JSON.stringify(summaries), "utf8");
console.log("wrote scripts/.cache/es-summaries.json");
