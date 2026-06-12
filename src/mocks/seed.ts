import { createInitialDatabase } from './db';
import { getJson, setJson, STORAGE_KEYS } from './storage';
import type { DemoDatabase } from './types';

export function seedIfEmpty(): void {
  const existing = getJson<DemoDatabase | null>(STORAGE_KEYS.DB, null);
  if (!existing) {
    setJson(STORAGE_KEYS.DB, createInitialDatabase());
  }
}

export function reseedDatabase(): void {
  setJson(STORAGE_KEYS.DB, createInitialDatabase());
}
