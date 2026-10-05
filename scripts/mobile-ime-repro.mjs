#!/usr/bin/env node
/** Repro con IME real (composición como Gboard/SwiftKey) vía CDP. */
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
const cdp = await ctx.newCDPSession(page);
const check = (n, ok, d = "") => console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`);

await page.goto(base + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
const hero = page.locator("main form[role='search'] input");
await hero.tap();
await page.waitForTimeout(300);

// Simular escritura IME: composición progresiva como Gboard
for (const text of ["j", "jo", "jos", "jose"]) {
  await cdp.send("Input.imeSetComposition", { selectionStart: text.length, selectionEnd: text.length, text });
  await page.waitForTimeout(150); // deja que el debounce de 120ms dispare re-renders
}
const during = await hero.inputValue();
check("IME componiendo: el texto se mantiene", during === "jose", JSON.stringify(during));

// Commit de la composición (como al pulsar espacio en Gboard)
await cdp.send("Input.insertText", { text: "jose " });
await page.waitForTimeout(400);
const after = await hero.inputValue();
check("IME tras commit: valor en el input", after === "jose ", JSON.stringify(after));
check("sugerencias visibles tras IME", (await page.locator("[role='option']").count()) > 0);

await browser.close();
server.close();
