const KEY = "santos-explorer:recent";
const MAX = 10;

/** Locally stored "recently viewed" saints (ids). No server involved. */
export function getRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecent(id: string): void {
  try {
    const arr = getRecent().filter((s) => s !== id);
    arr.unshift(id);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}
