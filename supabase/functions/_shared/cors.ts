// CORS restricted to the origins in the ALLOWED_ORIGINS secret (comma separated),
// e.g. "https://tamkeen.example.sa,http://localhost:8080". Unset means no browser origin is allowed.

const ALLOW_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn("ALLOWED_ORIGINS is not set: browser requests to this function will be rejected");
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && allowedOrigins.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

/** Preflight answer, or a 403 for a browser origin outside the list. Null when the request may proceed. */
export function handleCors(req: Request): Response | null {
  const origin = req.headers.get("Origin");
  const allowed = !origin || allowedOrigins.includes(origin);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: allowed ? 204 : 403, headers: corsHeaders(req) });
  }
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
  return null;
}
