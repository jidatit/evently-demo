import type { Session } from '@supabase/supabase-js';

type AuthListener = (event: string, session: Session | null) => void;

const listeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAuthChange(event: string, session: Session | null): void {
  listeners.forEach((listener) => listener(event, session));
}
