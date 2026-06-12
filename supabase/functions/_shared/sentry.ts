import * as Sentry from "npm:@sentry/deno";

let initialized = false;

export function initSentry(functionName: string): void {
  if (initialized) return;
  const dsn = Deno.env.get("SENTRY_DSN");
  if (!dsn) return;
  try {
    Sentry.init({
      dsn,
      environment: Deno.env.get("ENVIRONMENT") ?? "production",
      tracesSampleRate: 0,
    });
    Sentry.setTag("function", functionName);
    initialized = true;
  } catch {
    // never let Sentry init crash the function
  }
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) return;
  try {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // swallow Sentry transport errors
  }
}
