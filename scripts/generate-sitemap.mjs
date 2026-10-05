#!/usr/bin/env node
/** Build-time sitemap generator. Reads the saints index and writes public/sitemap.xml. */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://vidas-de-santos.app";

const saints = JSON.parse(readFileSync(join(root, "src/data/saints.json"), "utf-8"));

const staticRoutes = [
  "/",
  "/explore",
  "/discover",
  "/tags",
  "/orders",
  "/centuries",
  "/history",
  "/author",
  "/statistics",
  "/sources",
  "/privacy",
];

const tagRoutes = [
  "/tag/martyrs", "/tag/doctors", "/tag/popes", "/tag/apostles", "/tag/evangelists",
  "/tag/founders", "/tag/mystics", "/tag/missionaries", "/tag/virgins", "/tag/hermits",
  "/tag/theologians",
];

const centuries = new Set();
for (const s of saints) if (s.century) centuries.add(s.century);
const centuryRoutes = [...centuries].sort((a, b) => a - b).map((c) => `/century/${c}`);

const saintRoutes = saints.map((s) => `/saint/${s.id}`);

const urls = [...staticRoutes, ...tagRoutes, ...centuryRoutes, ...saintRoutes]
  .map((p) => `  <url><loc>${SITE}${p}</loc><changefreq>monthly</changefreq></url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`sitemap.xml written: ${staticRoutes.length + tagRoutes.length + centuryRoutes.length + saintRoutes.length} urls`);
