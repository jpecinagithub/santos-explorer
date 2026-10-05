#!/usr/bin/env node
/**
 * Repair: re-fetch extracts for pages that came back empty (TextExtracts
 * per-request limit truncated the original 50-title batches).
 * Usage: node scripts/repair-extracts.mjs
 */
import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CACHE = join(dirname(fileURLToPath(import.meta.url)), ".cache");
const UA = "SantosExplorer/1.0 (educational saint discovery; contact via site footer)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        const wait = Math.min(30000, 4000 * (i + 1));
        console.log(`429, waiting ${wait}ms…`);
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

const pages = JSON.parse(readFileSync(join(CACHE, "pages.json"), "utf8"));
const todo = Object.keys(pages).filter((k) => !(pages[k].extract || "").trim() && !pages[k].missing);
console.log(`pages needing extracts: ${todo.length}`);

let fixed = 0;
for (let i = 0; i < todo.length; i += 20) {
  const chunk = todo.slice(i, i + 20);
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "extracts",
    exintro: "1",
    explaintext: "1",
    exsectionformat: "plain",
    redirects: "1",
    titles: chunk.join("|"),
  });
  const j = await fetchJson(`https://en.wikipedia.org/w/api.php?${params}`);
  const redir = {};
  for (const r of j.query.redirects || []) redir[r.from] = r.to;
  for (const id of Object.keys(j.query.pages)) {
    const p = j.query.pages[id];
    if (p.extract && p.extract.trim()) {
      // find the cache key (source title) that maps to this page
      const target = p.title;
      const src = chunk.find((t) => t === target || redir[t] === target);
      if (src && pages[src]) {
        pages[src].extract = p.extract;
        fixed++;
      }
    }
  }
  if (i % 200 === 0) console.log(`progress: ${i}/${todo.length} (fixed ${fixed})`);
  await sleep(300);
}

writeFileSync(join(CACHE, "pages.json"), JSON.stringify(pages));
const still = Object.keys(pages).filter((k) => !(pages[k].extract || "").trim() && !pages[k].missing).length;
console.log(`done. fixed ${fixed}, still empty: ${still}`);
