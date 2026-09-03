const APP_ORIGIN = "https://mm050692.github.io";
const ALLOWED_ORIGINS = new Set([
  APP_ORIGIN,
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(request, { error: "origin_not_allowed" }, 403);

  const payload = await request.json().catch(() => ({})) as { action?: string };
  if (payload.action === "status") {
    return json(request, {
      status: "ok",
      enabled: false,
      providerReady: false,
      recipientReady: false,
      recipient: "",
      reason: "external_email_not_authorized",
    });
  }

  return json(request, {
    status: "setup_required",
    reason: "external_email_not_authorized",
  });
});
