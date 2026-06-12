/** Ambient Deno for Edge Functions — TS/ESLint in this repo do not use the Deno LSP for `supabase/functions`. */
export {};

declare global {
  const Deno: {
    readonly env: {
      get(key: string): string | undefined;
    };
    serve(
      handler: (req: Request) => Response | Promise<Response>,
    ): void;
  };
}
