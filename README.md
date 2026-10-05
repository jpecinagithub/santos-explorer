# Vidas de Santos

**Descubre 1.690 santos — todos los santos, a una búsqueda.**

Portal en español para descubrir las vidas de los santos, con la misma arquitectura ligera que Nobel Explorer: un índice local compacto más biografías de Wikipedia bajo demanda. Sin backend — todo funciona en el navegador.

## Características

- **Buscador inteligente** (Fuse.js, insensible a tildes): nombres, órdenes religiosas, resúmenes. Entiende pistas estructuradas como `mártires siglo III`, `beato franciscano`, `s. XIII`.
- **Filtros**: 11 categorías (mártires, doctores, papas, apóstoles, fundadores, místicos, misioneros…), órdenes religiosas (franciscanos, dominicos, jesuitas, carmelitas…), países, siglos, santos y beatos, sexo.
- **Lector de Wikipedia**: biografías completas en español cargadas bajo demanda, saneadas con DOMPurify, cacheadas 24h en localStorage. Retratos desde Wikimedia Commons.
- **Páginas de exploración**: categorías, órdenes, siglos, estadísticas (Recharts), colecciones Descubrir, santo aleatorio, vistos recientemente.
- **PWA**: instalable, app shell offline + caché de imágenes, iconos + manifiesto.
- **SEO**: meta/OG por ruta, sitemap.xml generado en el build, rewrites SPA vía `vercel.json`.
- **Analytics**: Vercel Analytics + Speed Insights (anónimo, sin datos personales). Hay que activarlo en el panel de Vercel.
- **Autor**: página `/autor` + crédito en el pie (jpecina@gmail.com).

## Pipeline de datos

El índice se compila de fuentes públicas — sin scraping de contenido con copyright:

1. `scripts/fetch-saints.mjs` — lista de santos desde la *List of Catholic saints* de la Wikipedia en inglés; extractos por artículo, miniaturas y IDs de Wikidata (API de MediaWiki); claims estructurados de Wikidata (P27 país, P569/P570 fechas, P21 sexo, P463 orden religiosa); resolución de entidades para países (códigos ISO P298) y órdenes.
2. `scripts/repair-extracts.mjs` — recupera extractos truncados por el límite por petición de TextExtracts.
3. `scripts/fetch-es-summaries.mjs` — mapea cada artículo inglés a su artículo en español vía `langlinks` de la API (`lllimit=500`: por defecto solo devuelve 10) y descarga los resúmenes de es.wikipedia. Escribe `scripts/.cache/es-summaries.json` y `es-titles.json`.
4. `scripts/build-saints.mjs` — enriquecimiento: detección de órdenes (etiquetas Wikidata + 40 familias por palabras clave), país desde Wikidata con alternativa por gentilicios, los 37 Doctores de la Iglesia, apóstoles, evangelistas, mártires/fundadores/místicos/misioneros por análisis de palabras clave, estado santo/beato, siglos. **Solo incluye santos con resumen en español (1.690)**; nombres, resúmenes y países en español. Escribe `src/data/saints.json` + `src/data/meta.json`.

Las biografías completas no van empaquetadas — se cargan en directo desde Wikipedia en español, lo que las mantiene actualizadas y con la licencia correcta (CC BY-SA).

## Tecnología

Vite + React 19 + TypeScript + Tailwind CSS 4 · react-router-dom · Fuse.js · DOMPurify · Recharts · i18next (un solo idioma: español) · vite-plugin-pwa · @vercel/analytics + @vercel/speed-insights.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — sitemap + `tsc -b` + build de Vite
- `node scripts/fetch-saints.mjs [stage]` — etapas de datos: `titles|pages|claims|entities|all`
- `node scripts/repair-extracts.mjs` — recupera extractos perdidos
- `node scripts/fetch-es-summaries.mjs` — resúmenes y títulos en español
- `node scripts/build-saints.mjs` — construye el índice
- `node scripts/e2e.mjs` — E2E en Chromium headless

## Despliegue

Sitio estático — desplegar en Vercel desde el repo (lo despliega el dueño; el agente no toca Vercel). `vercel.json` incluye los rewrites SPA.

---

Creado por **Jon Peciña** · jpecina@gmail.com · [GitHub](https://github.com/jpecinagithub)
