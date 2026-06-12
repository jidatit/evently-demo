export const STORAGE_KEYS = {
  DB: 'evently_demo_db',
  SESSION: 'evently_demo_session',
} as const;

export const ALL_DEMO_KEYS = [STORAGE_KEYS.DB, STORAGE_KEYS.SESSION] as const;

export function getJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function mergeJson<T extends object>(key: string, patch: Partial<T>): T {
  const current = getJson<T>(key, {} as T);
  const next = { ...current, ...patch };
  setJson(key, next);
  return next;
}

export function removeKeys(keys: readonly string[]): void {
  keys.forEach((key) => localStorage.removeItem(key));
}

export function clearDemoStorage(): void {
  removeKeys(ALL_DEMO_KEYS);
}
