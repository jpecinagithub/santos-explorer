# Vidas de Santos

**Discover 2,000+ saints — every saint, one search away.**

Bilingual EN/ES (EN default) discovery portal for the lives of the saints, built with the same lightweight architecture as Nobel Explorer: a compact local index plus on-demand Wikipedia biographies. No backend — everything runs in the browser.

## Features

- **Smart search** (Fuse.js, diacritic-insensitive, EN/ES): names, religious orders, patronages, summaries. Understands structured hints like `mártires siglo III`, `13th century mystics`, `beato`.
- **Filters**: 11 holiness categories (martyrs, doctors, popes, apostles, founders, mystics, missionaries…), 40+ religious orders (Franciscans, Dominicans, Jesuits, Carmelites…), countries, centuries, saints vs. blesseds, sex.
- **Wikipedia reader**: full biographies loaded on demand in Spanish (fallback to English), sanitized with DOMPurify, cached 24h in localStorage. Every portrait hotlinked from Wikimedia Commons.
- **Explore pages**: tags, orders, centuries, statistics (Recharts), curated Discover collections, random saint, recently viewed.
- **PWA**: installable, offline app shell + wiki-image cache, icons + manifest.
- **SEO**: per-route meta/OG tags, sitemap.xml generated at build time, SPA rewrites via `vercel.json`.
- **Analytics**: Vercel Analytics + Speed Insights (anonymous, no PII). Enable in the Vercel dashboard.
- **Author**: `/author` page + footer credit (jpecina@gmail.com).

## Data pipeline

The saint index is compiled from public sources — no scraping of copyrighted content:

1. `scripts/fetch-saints.mjs` — saint list from the English Wikipedia *List of Catholic saints*; per-article extracts, thumbnails, Spanish titles and Wikidata IDs (MediaWiki API); structured claims from Wikidata (P27 country, P569/P570 dates, P21 sex, P463 religious-order membership); entity resolution for countries (P298 ISO codes) and orders.
2. `scripts/repair-extracts.mjs` — re-fetches extracts truncated by the TextExtracts per-request limit.
3. `scripts/build-saints.mjs` — enrichment: order detection (Wikidata member-of labels + 40 keyword families in EN/ES), country from Wikidata with demonym fallback, the 37 Doctors of the Church, apostles, evangelists, martyrs/founders/mystics/missionaries via keyword analysis, saint-vs-blessed status, patronages, centuries. Writes `src/data/saints.json` + `src/data/meta.json`.

Biographies themselves are never bundled — they load live from Wikipedia, which keeps them current and correctly licensed (CC BY-SA).

## Tech

Vite + React 19 + TypeScript + Tailwind CSS 4 · react-router-dom · Fuse.js · DOMPurify · Recharts · i18next · vite-plugin-pwa · @vercel/analytics + @vercel/speed-insights.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — sitemap + `tsc -b` + Vite build
- `node scripts/fetch-saints.mjs [stage]` — data stages: `titles|pages|claims|entities|all`
- `node scripts/repair-extracts.mjs` — backfill missing extracts
- `node scripts/build-saints.mjs` — build the index

## Deploy

Static site — deploy to Vercel from the repo (owner deploys; the agent does not touch Vercel). `vercel.json` ships SPA rewrites.

---

Created by **Jon Peciña** · jpecina@gmail.com · [GitHub](https://github.com/jpecinagithub)
