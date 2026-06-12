import { getDb } from '../db';
import { mockDelay } from '../delay';

export async function fetchCategoriesMock() {
  await mockDelay();
  const db = getDb();
  return db.categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}
