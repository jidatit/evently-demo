import { jsonResponse } from "./http.ts";

export type SupabaseUserEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

export type SupabaseServiceEnv = {
  url: string;
  serviceRoleKey: string;
};

export type EnvGuard<T> =
  | { ok: true; env: T }
  | { ok: false; response: Response };

/** Use instead of `!guard.ok` — TS does not narrow boolean negation on discriminated unions. */
export function isEnvGuardError<T>(
  guard: EnvGuard<T>,
): guard is { ok: false; response: Response } {
  return guard.ok === false;
}

function misconfigured(cors: Record<string, string>, missing: string): Response {
  console.error(`Missing required env: ${missing}`);
  return jsonResponse({ error: "Server misconfigured" }, 500, cors);
}

/** Validates SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY. */
export function requireSupabaseUserEnv(
  cors: Record<string, string>,
): EnvGuard<SupabaseUserEnv> {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) return { ok: false, response: misconfigured(cors, "SUPABASE_URL") };
  if (!anonKey) {
    return { ok: false, response: misconfigured(cors, "SUPABASE_ANON_KEY") };
  }
  if (!serviceRoleKey) {
    return {
      ok: false,
      response: misconfigured(cors, "SUPABASE_SERVICE_ROLE_KEY"),
    };
  }
  return { ok: true, env: { url, anonKey, serviceRoleKey } };
}

/** Validates SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (webhooks, cron). */
export function requireSupabaseServiceEnv(
  cors: Record<string, string>,
): EnvGuard<SupabaseServiceEnv> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url) return { ok: false, response: misconfigured(cors, "SUPABASE_URL") };
  if (!serviceRoleKey) {
    return {
      ok: false,
      response: misconfigured(cors, "SUPABASE_SERVICE_ROLE_KEY"),
    };
  }
  return { ok: true, env: { url, serviceRoleKey } };
}
