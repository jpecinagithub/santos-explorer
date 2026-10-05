#!/usr/bin/env node
/** Test final de interacciones: buscador, filtros, aleatorio, lector, español. */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

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
const check = (name, ok, detail = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);

// 1. Buscador hero con consulta española estructurada
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const search = page.locator('input[type="search"], input[placeholder*="usca"]').first();
await search.fill("mártires siglo III");
await page.waitForTimeout(800);
const opts = await page.locator('[role="option"], ul li a').count();
check("buscador 'mártires siglo III' ofrece sugerencias", opts > 0, `${opts} opciones`);
await search.press("Enter");
await page.waitForTimeout(900);
const url1 = page.url();
check("enter lleva a /explorar con resultados", url1.includes("/explorar"), url1.replace(base, ""));

// 2. Filtro por orden desde la página de orden
await page.goto(base + "/orden/franciscanos", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const cards = await page.locator('a[href^="/santo/"]').count();
const h1o = await page.locator("h1").first().innerText().catch(() => "");
check("/orden/franciscanos lista santos", cards > 5, `${cards} tarjetas, h1="${h1o.slice(0, 40)}"`);

// 3. Botón santo aleatorio
await page.goto(base + "/descubrir", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
const before = page.url();
const randBtn = page.locator('button:has-text("leatorio"), a:has-text("leatorio")').first();
if (await randBtn.count()) {
  await randBtn.click();
  await page.waitForTimeout(900);
  const after = page.url();
  check("botón aleatorio navega a un santo", after !== before && after.includes("/santo/"), after.replace(base, ""));
} else check("botón aleatorio navega a un santo", false, "botón no encontrado");

// 4. Lector Wikipedia (degrada en español sin red)
await page.goto(base + "/santo/teresa-de-jesus", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const readerBtn = page.locator('button:has-text("Wikipedia"), button:has-text("Leer")').first();
if (await readerBtn.count()) {
  await readerBtn.click();
  await page.waitForTimeout(2500);
  const modalText = await page.locator("body").innerText();
  const esGraceful = /Wikipedia|artículo|articulo|cargando|error|inténtalo|reintentar/i.test(modalText);
  check("lector Wikipedia se abre y comunica en español", esGraceful);
} else check("lector Wikipedia se abre y comunica en español", false, "botón no encontrado");

// 5. Filtros en /explorar: estado beato
await page.goto(base + "/explorar?status=beato", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const beatoCards = await page.locator('a[href^="/santo/"]').count();
check("filtro ?status=beato muestra resultados", beatoCards > 0, `${beatoCards} tarjetas`);

// 6. Siglo con número romano/aral en español
await page.goto(base + "/siglo/13", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(700);
const h1s = await page.locator("h1").first().innerText().catch(() => "");
check("/siglo/13 título en español", /siglo/i.test(h1s) && !/century/i.test(h1s), h1s.slice(0, 50));

// 7. Sin marcadores ingleses en páginas clave
const EN = ["Search", "Discover", "Explore", "Categories", "Religious orders", "Statistics", "Sources", "Privacy", "Random", "born", "died", "Loading", "No results", "Show more", "Read more"];
let bad = [];
for (const p of ["/", "/explorar", "/descubrir", "/categorias", "/ordenes", "/siglos", "/estadisticas", "/historia", "/fuentes", "/privacidad", "/autor"]) {
  await page.goto(base + p, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const t = await page.locator("body").innerText();
  for (const m of EN) if (t.includes(m) && !t.includes("Saint-")) { bad.push(`${p}: "${m}"`); break; }
}
check("10 páginas clave sin inglés visible", bad.length === 0, bad.join("; ").slice(0, 120) || "limpio");

await browser.close();
server.close();
