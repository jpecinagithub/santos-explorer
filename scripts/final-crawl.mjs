#!/usr/bin/env node
/** Rastreo final: todos los enlaces internos sin 404 y todo en español. */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { readFileSync } from "node:fs";

const DIST = new URL("../dist/", import.meta.url).pathname;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p === "/") p = "/index.html";
    let file = join(DIST, p);
    try { await stat(file); } catch { file = join(DIST, "index.html"); }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end("nf"); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();

const EN_MARKERS = ["Search", "Discover", "Explore", "Categories", "Orders", "Centuries", "Statistics", "Sources", "Privacy", "Author", "Home", "Random", "Read more", "Show more", "born", "died", "century", "saints found", "No results", "Loading", "All saints", "Religious orders", "Saint of the day"];
const EXCLUDE = ["Saint-Beno", "Saint-", "Saint "]; // topónimos franceses legítimos

const urls = JSON.parse(readFileSync("/tmp/crawl-urls.json", "utf8"));
const visited = new Set();
const queue = [...urls];
const fails = [];
let checked = 0;

while (queue.length) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  visited.add(path);
  checked++;
  try {
    await page.goto(base + path, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => ({
      notfound: /Página no encontrada|No se ha encontrado/i.test(document.body.innerText),
      title: document.title,
      h1: document.querySelector("h1")?.innerText?.slice(0, 80) || "(sin h1)",
      text: document.body.innerText,
      links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute("href").split("#")[0]).filter(Boolean),
    }));
    if (data.notfound) { fails.push(`${path} → Página no encontrada`); continue; }
    for (const m of EN_MARKERS) {
      const re = new RegExp(`\\b${m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      if (re.test(data.text)) { fails.push(`${path} → marcador inglés "${m}"`); break; }
    }
    if (!data.h1 || data.h1 === "(sin h1)") fails.push(`${path} → sin h1`);
    for (const l of data.links) {
      if (!visited.has(l) && queue.length < 4000) queue.push(l);
    }
  } catch (e) {
    fails.push(`${path} → error de navegación: ${String(e).slice(0, 80)}`);
  }
}

console.log(`\n=== RASTREO: ${checked} URLs visitadas ===`);
console.log(`Fallos: ${fails.length}`);
for (const f of fails.slice(0, 40)) console.log("FAIL  " + f);
await browser.close();
server.close();
process.exit(fails.length ? 1 : 0);
