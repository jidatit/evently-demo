const CORS_BASE: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** CORS headers for POST + OPTIONS handlers; pass extra allowed header names if needed. */
export function corsHeaders(...extra: string[]): Record<string, string> {
  const base = CORS_BASE["Access-Control-Allow-Headers"] ?? "";
  const merged = extra.length > 0 ? `${base}, ${extra.join(", ")}` : base;
  return { ...CORS_BASE, "Access-Control-Allow-Headers": merged };
}

export function jsonResponse(
  body: unknown,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Server error";
}
