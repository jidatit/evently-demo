/** Deno `npm:` specifier — minimal Sentry Deno SDK types for Edge usage. */
declare module "npm:@sentry/deno" {
  export function init(options: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
  }): void;

  export function setTag(key: string, value: string): void;

  export function captureException(
    error: unknown,
    context?: { extra?: Record<string, unknown> },
  ): void;
}
