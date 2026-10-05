import DOMPurify from "dompurify";

export interface WikiContent {
  title: string;
  description?: string;
  extract: string;
  html: string;
  thumbnail?: string;
  pageUrl: string;
  lang: "en" | "es";
  fallbackFromEs: boolean;
}

interface CacheEntry {
  ts: number;
  data: WikiContent | null; // null = known missing
}

const TTL = 24 * 60 * 60 * 1000; // 24 hours
const UA = "SantosExplorer/1.0 (educational saint discovery; contact via site footer)";

function cacheKey(lang: string, title: string): string {
  return `santoswiki:v1:${lang}:${title}`;
}

function readCache(lang: string, title: string): WikiContent | null | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(lang, title));
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.ts > TTL) {
      localStorage.removeItem(cacheKey(lang, title));
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

function writeCache(lang: string, title: string, data: WikiContent | null): void {
  try {
    const entry: CacheEntry = { ts: Date.now(), data };
    localStorage.setItem(cacheKey(lang, title), JSON.stringify(entry));
  } catch {
    /* quota exceeded — skip caching silently */
  }
}

async function fetchSummary(lang: "en" | "es", title: string) {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`summary:${res.status}`);
  const j = await res.json();
  if (j.type === "disambiguation") return { disambiguation: true as const, j };
  return { disambiguation: false as const, j };
}

async function fetchHtml(lang: "en" | "es", title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    format: "json",
    origin: "*",
    redirects: "1",
    disablelimitreport: "1",
  });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`parse:${res.status}`);
  const j = await res.json();
  return j?.parse?.text?.["*"] ?? null;
}

async function searchTitle(lang: "en" | "es", name: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: name,
    srlimit: "1",
    format: "json",
    origin: "*",
  });
  const res = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j?.query?.search?.[0]?.title ?? null;
}

function sanitize(rawHtml: string, lang: "en" | "es"): string {
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
    if (href.startsWith("/wiki/")) abs = `https://${lang}.wikipedia.org${href}`;
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
 * Load a saint's Wikipedia article. Tries `lang` first; when Spanish is
 * requested and the article does not exist there, falls back to English.
 * Results are cached in localStorage for 24h.
 */
export async function loadWikiArticle(
  name: string,
  wikiTitle: string | undefined,
  lang: "en" | "es",
): Promise<WikiContent> {
  const langs: ("en" | "es")[] = lang === "es" ? ["es", "en"] : ["en"];
  let fallbackFromEs = false;

  for (const l of langs) {
    let title = wikiTitle;
    if (!title) {
      const cachedSearch = readCache(l, `__search__${name}`);
      if (cachedSearch === null) continue;
      title = (await searchTitle(l, name)) ?? undefined;
      writeCache(l, `__search__${name}`, title ? ({ ...({} as WikiContent), title } as WikiContent) : null);
      if (!title) continue;
    }

    const cached = readCache(l, title);
    if (cached !== undefined) {
      if (cached === null) {
        if (l === "es") { fallbackFromEs = true; continue; }
        throw new Error("missing");
      }
      return { ...cached, fallbackFromEs: fallbackFromEs || cached.fallbackFromEs };
    }

    const summary = await fetchSummary(l, title);
    if (!summary) {
      writeCache(l, title, null);
      if (l === "es") { fallbackFromEs = true; continue; }
      throw new Error("missing");
    }
    if (summary.disambiguation) {
      writeCache(l, title, null);
      if (l === "es") { fallbackFromEs = true; continue; }
      throw new Error("missing");
    }
    const j = summary.j;
    let html = "";
    try {
      const raw = await fetchHtml(l, j.title ?? title);
      if (raw) html = sanitize(raw, l);
    } catch {
      html = ""; // summary/extract still usable
    }
    const content: WikiContent = {
      title: j.title ?? title,
      description: j.description,
      extract: j.extract ?? "",
      html,
      thumbnail: j.thumbnail?.source,
      pageUrl: j.content_urls?.desktop?.page ?? `https://${l}.wikipedia.org/wiki/${encodeURIComponent(j.title ?? title)}`,
      lang: l,
      fallbackFromEs,
    };
    writeCache(l, title, content);
    return content;
  }
  throw new Error("missing");
}
