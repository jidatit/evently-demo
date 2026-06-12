export function getAppBaseUrl(req?: Request): string {
  const env = Deno.env.get("APP_BASE_URL")?.replace(/\/$/, "");
  if (env) return env;
  if (req) {
    const origin = req.headers.get("origin");
    if (origin) return origin.replace(/\/$/, "");
  }
  return "http://127.0.0.1:5173";
}
