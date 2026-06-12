import { corsHeaders, jsonResponse } from "../_shared/http.ts";

const cors = corsHeaders();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, cors);
  }

  // Layer 7: self-serve cancel removed; kept for potential internal/admin use only.
  return jsonResponse(
    { error: "Cancel booking is no longer available via this endpoint" },
    410,
    cors,
  );
});
