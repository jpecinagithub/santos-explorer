import DOMPurify from "dompurify";

// Vidas de Santos es 100% en español: las biografías se sirven siempre
// desde Wikipedia en español.

export interface WikiContent {
  title: string;
  description?: string;
  extract: string;
  html: string;
  thumbnail?: string;
  pageUrl: string;
}

interface CacheEntry {
  ts: number;
  data: WikiContent | null; // null = known missing
}

const TTL = 24 * 60 * 60 * 1000; // 24 hours
const UA = "SantosExplorer/1.0 (educational saint discovery; contact via site footer)";
const WIKI = "https://es.wikipedia.org";

function cacheKey(title: string): string {
  return `santoswiki:v1:es:${title}`;
}

function readCache(title: string): WikiContent | null | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(title));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > TTL) {
      localStorage.removeItem(cacheKey(title));
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeCache(title: string, data: WikiContent | null): void {
  try {
    const entry: CacheEntry = { ts: Date.now(), data };
    localStorage.setItem(cacheKey(title), JSON.stringify(entry));
  } catch {
    /* quota exceeded — skip caching silently */
  }
}

async function fetchSummary(title: string) {
  const url = `${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`summary:${res.status}`);
  const j = await res.json();
  if (j.type === "disambiguation") return { disambiguation: true as const, j };
  return { disambiguation: false as const, j };
}

async function fetchHtml(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    format: "json",
    origin: "*",
    redirects: "1",
    disablelimitreport: "1",
  });
  const res = await fetch(`${WIKI}/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`parse:${res.status}`);
  const j = await res.json();
  return j?.parse?.text?.["*"] ?? null;
}

function sanitize(rawHtml: string): string {
  const clean = DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ["style", "script", "iframe", "form", "input", "button"],
    FORBID_ATTR: ["onclick", "onload", "onerror"],
  });
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, "text/html");
  const root = doc.body.firstElementChild!;
  // Drop noisy elements.
  root.querySelectorAll(
    ".mw-editsection, .reflist, .mw-references-wrap, ol.references, .navbox, table.navbox, .metadata, .noprint, .ambox, .hatnote",
  ).forEach((el) => el.remove());
  // Rewrite links: everything opens Wikipedia in a new tab.
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    let abs: string | null = null;
    if (href.startsWith("/wiki/")) abs = `${WIKI}${href}`;
    else if (href.startsWith("//")) abs = `https:${href}`;
    else if (/^https?:\/\//.test(href)) abs = href;
    if (abs) {
      a.setAttribute("href", abs);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    } else {
      a.removeAttribute("href");
    }
  });
  // Fix protocol-relative and relative image URLs.
  root.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("//")) img.setAttribute("src", `https:${src}`);
    else if (src.startsWith("/")) img.setAttribute("src", `https://upload.wikimedia.org${src}`);
    img.removeAttribute("srcset");
    img.setAttribute("loading", "lazy");
  });
  return root.innerHTML;
}

/**
 * Carga el artículo de Wikipedia en español de un santo.
 * El resultado se cachea en localStorage durante 24h.
 */
export async function loadWikiArticle(name: string, wikiTitle: string | undefined): Promise<WikiContent> {
  const title = wikiTitle ?? name;

  const cached = readCache(title);
  if (cached !== undefined) {
    if (cached === null) throw new Error("missing");
    return cached;
  }

  const summary = await fetchSummary(title);
  if (!summary || summary.disambiguation) {
    writeCache(title, null);
    throw new Error("missing");
  }
  const j = summary.j;
  let html = "";
  try {
    const raw = await fetchHtml(j.title ?? title);
    if (raw) html = sanitize(raw);
  } catch {
    html = ""; // summary/extract still usable
  }
  const content: WikiContent = {
    title: j.title ?? title,
    description: j.description,
    extract: j.extract ?? "",
    html,
    thumbnail: j.thumbnail?.source,
    pageUrl: j.content_urls?.desktop?.page ?? `${WIKI}/wiki/${encodeURIComponent(j.title ?? title)}`,
  };
  writeCache(title, content);
  return content;
}
