export function isStaging(): boolean {
  return (
    Deno.env.get("ENVIRONMENT") === "staging" ||
    Deno.env.get("NODE_ENV") === "staging"
  );
}
