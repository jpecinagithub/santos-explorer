#!/usr/bin/env node
/** Repro: escritura en inputs con emulación móvil táctil. */
import { chromium, devices } from "playwright-core";
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
const ctx = await browser.newContext({ ...devices["iPhone 13"], hasTouch: true });
const page = await ctx.newPage();
const check = (n, ok, d = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`);

// 1. Hero home (input visible dentro de main)
await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const hero = page.locator('main form[role="search"] input');
await hero.tap();
await page.waitForTimeout(300);
await page.keyboard.type("tere", { delay: 120 });
await page.waitForTimeout(400);
check("hero móvil: escribe", (await hero.inputValue()) === "tere", JSON.stringify(await hero.inputValue()));
check("hero móvil: mantiene foco", await hero.evaluate((el) => document.activeElement === el));

// 2. Menú móvil del header
await page.locator('button[aria-label="Menú"]').tap();
await page.waitForTimeout(400);
const mInput = page.locator('header form[role="search"] input:visible');
await mInput.tap();
await page.waitForTimeout(300);
await page.keyboard.type("jose", { delay: 120 });
await page.waitForTimeout(400);
check("input menú móvil: escribe", (await mInput.inputValue()) === "jose", JSON.stringify(await mInput.inputValue()));

// 3. Explorar
await page.goto(base + "/explorar", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const ex = page.locator('main form[role="search"] input');
await ex.tap();
await page.waitForTimeout(300);
await page.keyboard.type("fran", { delay: 120 });
await page.waitForTimeout(400);
check("explorar móvil: escribe", (await ex.inputValue()) === "fran", JSON.stringify(await ex.inputValue()));

await browser.close();
server.close();
