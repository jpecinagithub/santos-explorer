#!/usr/bin/env node
/** Headless-Chromium E2E for santos-explorer. Serves dist/ and runs checks. */
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
    try { await stat(file); } catch { file = join(DIST, "index.html"); } // SPA fallback
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (e) {
    res.writeHead(404); res.end("nf");
  }
});

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const browser = await chromium.launch({
  executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 120)); });

try {
  // 1. Home
  await page.goto(base + "/", { waitUntil: "networkidle" });
  check("home loads", await page.locator("h1").count() > 0);
  check("hero search present", await page.locator('input[role="combobox"]').count() > 0);
  const statText = await page.locator("section").first().textContent();
  check("stats mention saints", /2,197|2197/.test(statText || ""), (statText || "").slice(0, 60));

  // 2. Autocomplete
  await page.locator('input[role="combobox"]').first().fill("Teresa");
  await page.waitForTimeout(600);
  const sugg = await page.locator('[role="option"]').count();
  check("autocomplete suggestions", sugg > 0, `${sugg} options`);

  // 3. Explore with query
  await page.goto(base + "/explore?q=martyr", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const cards = await page.locator("main a[href^='/saint/'], main button").count();
  check("explore results render", cards > 3, `${cards} cards/buttons`);

  // 4. Saint page
  await page.goto(base + "/saint/francis-of-assisi", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const h1 = await page.locator("h1").first().textContent();
  check("saint page title", (h1 || "").includes("Francis of Assisi"), h1 || "");
  check("quick facts present", (await page.locator("main").textContent() || "").includes("Italy"));

  // 5. Wiki reader states (sandbox has no external net → expect graceful error state)
  await page.waitForTimeout(2500);
  const mainText = await page.locator("main").textContent();
  const graceful = /Wikipedia could not be reached|wikipedia|Biography/i.test(mainText || "");
  check("wiki reader degrades gracefully offline", graceful);

  // 6. Taxonomy pages
  for (const [path, marker] of [["/tags", "Martyrs"], ["/orders", "Franciscans"], ["/centuries", "Siglo"], ["/statistics", "Statistics"], ["/discover", "Discover"]]) {
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const t = await page.locator("main").textContent();
    check(`${path} loads`, (t || "").length > 200, (t || "").slice(0, 40));
  }

  // 7. Tag page
  await page.goto(base + "/tag/doctors", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const tagText = await page.locator("main").textContent();
  check("tag page lists doctors", /Thomas Aquinas|Augustine/i.test(tagText || ""));

  // 8. Spanish
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.locator('button[aria-pressed]').first().waitFor({ timeout: 5000 }).catch(() => {});
  const langBtns = page.locator('header [role="group"] button');
  await langBtns.nth(1).click(); // ES
  await page.waitForTimeout(800);
  const esH1 = await page.locator("h1").first().textContent();
  check("spanish UI", /santos|búsqueda/i.test(esH1 || ""), esH1 || "");
  await langBtns.nth(0).click(); // back to EN

  // 9. Mobile viewport
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("mobile no horizontal overflow (home)", overflow <= 1, `overflow=${overflow}px`);
  await page.goto(base + "/explore?q=francis", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check("mobile no horizontal overflow (explore)", overflow2 <= 1, `overflow=${overflow2}px`);

  // 10. PWA manifest
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  check("manifest linked", !!manifestHref, manifestHref || "");
  if (manifestHref) {
    const mj = await (await fetch(base + manifestHref)).json();
    check("manifest has icons", mj.icons && mj.icons.length >= 3, `${mj.icons?.length} icons`);
  }

  // 11. Sitemap
  const sm = await (await fetch(base + "/sitemap.xml")).text();
  check("sitemap has saint urls", sm.includes("/saint/francis-of-assisi"), `${(sm.match(/<url>/g) || []).length} urls`);

  // 12. No page errors
  check("zero page/console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
} catch (e) {
  check("e2e completed", false, String(e).slice(0, 200));
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
