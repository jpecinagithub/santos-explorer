#!/usr/bin/env node
/**
 * Stage 1-4: fetch saint data from Wikipedia + Wikidata.
 * Usage: node scripts/fetch-saints.mjs [stage]
 * Stages: titles | pages | claims | entities | all
 * Intermediate files live in scripts/.cache/
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".cache");
mkdirSync(ROOT, { recursive: true });

const UA = "SantosExplorer/1.0 (educational saint discovery; contact via site footer)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        const wait = Math.min(30000, 4000 * (i + 1));
        console.log(`429 rate-limited, waiting ${wait}ms…`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

function save(name, data) {
  writeFileSync(join(ROOT, name), JSON.stringify(data));
  console.log(`saved ${name} (${JSON.stringify(data).length} bytes)`);
}
function load(name) {
  return JSON.parse(readFileSync(join(ROOT, name), "utf8"));
}

/** Run async fn over items with limited concurrency, in order-preserving chunks. */
async function mapPool(items, size, fn, label) {
  const out = [];
  let done = 0;
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const res = await Promise.all(chunk.map(fn));
    out.push(...res);
    done += chunk.length;
    if (label && done % (size * 4) === 0) console.log(`${label}: ${done}/${items.length}`);
  }
  return out;
}

// ------------------------------------------------------------------ stage 1
async function stageTitles() {
  const j = await fetchJson(
    "https://en.wikipedia.org/w/api.php?action=parse&page=List_of_Catholic_saints&prop=links&format=json"
  );
  const seen = new Set();
  const titles = [];
  for (const l of j.parse.links) {
    if (l.ns !== 0) continue;
    const t = l["*"];
    if (/^(List of|Lists of|Timeline of)/.test(t)) continue;
    if (!seen.has(t)) {
      seen.add(t);
      titles.push(t);
    }
  }
  save("titles.json", titles);
}

// ------------------------------------------------------------------ stage 2
async function stagePages() {
  const titles = load("titles.json");
  const results = {};
  const chunks = [];
  for (let i = 0; i < titles.length; i += 50) chunks.push(titles.slice(i, i + 50));

  await mapPool(chunks, 4, async (chunk) => {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts|pageimages|pageprops|langlinks",
      exintro: "1",
      explaintext: "1",
      exsectionformat: "plain",
      piprop: "thumbnail",
      pithumbsize: "400",
      lllang: "es",
      lllimit: "1",
      ppprop: "wikibase_item|disambiguation",
      redirects: "1",
      titles: chunk.join("|"),
    });
    const j = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
    const pages = j.query.pages;
    const redir = {};
    for (const r of j.query.redirects || []) redir[r.from] = r.to;
    for (const id of Object.keys(pages)) {
      const p = pages[id];
      results[p.title] = {
        title: p.title,
        missing: !!p.missing,
        disamb: !!(p.pageprops && p.pageprops.disambiguation),
        wikibase: (p.pageprops && p.pageprops.wikibase_item) || null,
        thumb: (p.thumbnail && p.thumbnail.source) || null,
        esTitle: (p.langlinks && p.langlinks[0] && p.langlinks[0]["*"]) || null,
        extract: p.extract || "",
      };
    }
    return null;
  }, "pages");
  save("pages.json", results);
}

// ------------------------------------------------------------------ stage 3
async function stageClaims() {
  const pages = load("pages.json");
  const ids = [...new Set(Object.values(pages).map((p) => p.wikibase).filter(Boolean))];
  // Resume: skip ids already fetched in a previous partial run.
  let claims = {};
  try {
    claims = load("claims.json");
    console.log(`resuming claims: ${Object.keys(claims).length} already done`);
  } catch { /* fresh start */ }
  const todo = ids.filter((id) => !claims[id]);
  console.log(`wikibase ids: ${ids.length}, remaining: ${todo.length}`);
  const chunks = [];
  for (let i = 0; i < todo.length; i += 50) chunks.push(todo.slice(i, i + 50));

  let doneChunks = 0;
  await mapPool(chunks, 2, async (chunk) => {
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      ids: chunk.join("|"),
      props: "claims",
      formatversion: "2",
    });
    const j = await fetchJson(`https://www.wikidata.org/w/api.php?${params}`);
    for (const id of Object.keys(j.entities || {})) {
      const e = j.entities[id];
      if (e.missing) continue;
      const c = e.claims || {};
      const val = (p) =>
        (c[p] || [])
          .map((x) => x.mainsnak && x.mainsnak.datavalue && x.mainsnak.datavalue.value)
          .filter(Boolean)
          .map((v) => (typeof v === "object" && v.id ? v.id : v.time || v));
      claims[id] = {
        country: val("P27").filter((v) => typeof v === "string" && /^Q\d+$/.test(v)),
        birth: val("P569").filter((v) => typeof v === "string" && /^\+\d/.test(v)),
        death: val("P570").filter((v) => typeof v === "string" && /^\+\d/.test(v)),
        sex: val("P21").filter((v) => typeof v === "string" && /^Q\d+$/.test(v)),
        memberOf: val("P463").filter((v) => typeof v === "string" && /^Q\d+$/.test(v)),
        canonized: val("P411").filter((v) => typeof v === "string" && /^Q\d+$/.test(v)),
      };
    }
    doneChunks++;
    if (doneChunks % 8 === 0) save("claims.json", claims); // incremental checkpoint
    await sleep(400); // be gentle with Wikidata
    return null;
  }, "claims");
  save("claims.json", claims);
}

// ------------------------------------------------------------------ stage 4
async function stageEntities() {
  const claims = load("claims.json");
  const countryQ = new Set();
  const memberQ = new Set();
  for (const id of Object.keys(claims)) {
    claims[id].country.forEach((q) => countryQ.add(q));
    claims[id].memberOf.forEach((q) => memberQ.add(q));
  }
  const all = [...countryQ, ...memberQ];
  console.log(`distinct entities: ${all.length} (${countryQ.size} countries, ${memberQ.size} memberOf)`);
  const entities = {};
  const chunks = [];
  for (let i = 0; i < all.length; i += 50) chunks.push(all.slice(i, i + 50));

  await mapPool(chunks, 2, async (chunk) => {
    const params = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      ids: chunk.join("|"),
      props: "labels|claims",
      languages: "en|es",
      formatversion: "2",
    });
    const j = await fetchJson(`https://www.wikidata.org/w/api.php?${params}`);
    for (const id of Object.keys(j.entities || {})) {
      const e = j.entities[id];
      if (e.missing) continue;
      const p298 =
        (e.claims && e.claims.P298 && e.claims.P298[0] && e.claims.P298[0].mainsnak.datavalue.value) || null;
      entities[id] = {
        label: (e.labels && e.labels.en && e.labels.en.value) || null,
        labelEs: (e.labels && e.labels.es && e.labels.es.value) || null,
        iso: p298,
      };
    }
    return null;
  }, "entities");
  save("entities.json", entities);
}

// --------------------------------------------------------------------------
const stage = process.argv[2] || "all";
const run = async () => {
  if (stage === "titles" || stage === "all") {
    if (!existsSync(join(ROOT, "titles.json")) || stage !== "all") await stageTitles();
  }
  if (stage === "pages" || stage === "all") {
    if (!existsSync(join(ROOT, "pages.json")) || stage !== "all") await stagePages();
  }
  if (stage === "claims" || stage === "all") {
    if (!existsSync(join(ROOT, "claims.json")) || stage !== "all") await stageClaims();
  }
  if (stage === "entities" || stage === "all") {
    if (!existsSync(join(ROOT, "entities.json")) || stage !== "all") await stageEntities();
  }
  console.log("done:", stage);
};
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
