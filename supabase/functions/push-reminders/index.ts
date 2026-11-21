import { createClient } from "npm:@supabase/supabase-js@2.112.4";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE_ORIGIN = "https://mm050692.github.io";
const SITE_URL = `${SITE_ORIGIN}/our-budget/`;
const ALLOWED_SLOTS = new Set(["15:00", "21:00"]);

const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function response(body: unknown, status = 200, origin = SITE_ORIGIN) {
  const allowedOrigin = origin === SITE_ORIGIN ? origin : SITE_ORIGIN;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-our-dhan-generation",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  });
}

function isValidSubscription(value: any) {
  return value && typeof value.endpoint === "string" && value.endpoint.startsWith("https://") && value.endpoint.length <= 2048 &&
    typeof value.keys?.p256dh === "string" && value.keys.p256dh.length <= 256 &&
    typeof value.keys?.auth === "string" && value.keys.auth.length <= 128;
}

function maldivesDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Indian/Maldives",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function authenticatedUser(req: Request) {
  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: member, error: memberError } = await service
    .from("household_members")
    .select("household_id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (memberError || !member) return null;
  return { user: data.user, householdId: member.household_id as string };
}

async function runtimeConfig() {
  let { data, error } = await service
    .from("push_runtime_config")
    .select("cron_secret,vapid_public_key,vapid_private_key")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) throw error || new Error("Push runtime configuration is missing");

  if (!data.vapid_public_key || !data.vapid_private_key) {
    const keys = webpush.generateVAPIDKeys();
    const updated = await service
      .from("push_runtime_config")
      .update({
        vapid_public_key: keys.publicKey,
        vapid_private_key: keys.privateKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .is("vapid_public_key", null)
      .select("cron_secret,vapid_public_key,vapid_private_key")
      .maybeSingle();
    if (updated.error) throw updated.error;
    if (updated.data) data = updated.data;
    else {
      const reread = await service
        .from("push_runtime_config")
        .select("cron_secret,vapid_public_key,vapid_private_key")
        .eq("id", 1)
        .single();
      if (reread.error) throw reread.error;
      data = reread.data;
    }
  }

  return data;
}

async function register(req: Request, body: any, origin: string) {
  const identity = await authenticatedUser(req);
  if (!identity) return response({ error: "unauthorized" }, 401, origin);
  if (!isValidSubscription(body.subscription)) return response({ error: "invalid_subscription" }, 400, origin);

  const subscription = body.subscription;
  const deviceName = String(body.deviceName || "This phone").slice(0, 60);
  const { error } = await service.from("push_subscriptions").upsert({
    household_id: identity.householdId,
    user_id: identity.user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth_key: subscription.keys.auth,
    device_name: deviceName,
    timezone: "Indian/Maldives",
    enabled: true,
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return response({ error: "registration_failed" }, 500, origin);
  const config = await runtimeConfig();
  return response({ enabled: true, publicKey: config.vapid_public_key, slots: ["15:00", "21:00"] }, 200, origin);
}

async function unregister(req: Request, body: any, origin: string) {
  const identity = await authenticatedUser(req);
  if (!identity) return response({ error: "unauthorized" }, 401, origin);
  const endpoint = String(body.endpoint || "");
  if (!endpoint || endpoint.length > 2048) return response({ error: "invalid_endpoint" }, 400, origin);
  const { error } = await service
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", identity.user.id);
  if (error) return response({ error: "unregister_failed" }, 500, origin);
  return response({ enabled: false }, 200, origin);
}

async function dispatch(req: Request, body: any, origin: string) {
  const slot = String(body.slot || "");
  if (!ALLOWED_SLOTS.has(slot)) return response({ error: "invalid_slot" }, 400, origin);
  const config = await runtimeConfig();
  const suppliedSecret = req.headers.get("x-cron-secret") || "";
  if (!suppliedSecret || suppliedSecret !== config.cron_secret) return response({ error: "unauthorized" }, 401, origin);

  webpush.setVapidDetails(SITE_URL, config.vapid_public_key, config.vapid_private_key);
  const reminderKey = `${maldivesDate()}|${slot}`;
  const { data: subscriptions, error } = await service
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth_key")
    .eq("enabled", true);
  if (error) return response({ error: "subscription_read_failed" }, 500, origin);

  const payload = slot === "15:00"
    ? { title: "Our DHAN", body: "Record any income or spending so far today.", slot, url: `${SITE_URL}?source=reminder` }
    : { title: "Our DHAN", body: "Add anything missed and finish today’s money check-in.", slot, url: `${SITE_URL}?source=reminder` };
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions || []) {
    const claim = await service.rpc("claim_push_reminder", {
      p_subscription_id: subscription.id,
      p_reminder_key: reminderKey,
    });
    if (claim.error || claim.data !== true) continue;
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
      }, JSON.stringify(payload), { TTL: 7200, urgency: "normal" });
      sent += 1;
      await service.from("push_subscriptions").update({
        last_sent_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", subscription.id);
    } catch (sendError: any) {
      failed += 1;
      const expired = sendError?.statusCode === 404 || sendError?.statusCode === 410;
      await service.from("push_subscriptions").update({
        enabled: expired ? false : true,
        last_error: String(sendError?.message || "delivery_failed").slice(0, 300),
        updated_at: new Date().toISOString(),
      }).eq("id", subscription.id);
    }
  }

  return response({ ok: true, slot, sent, failed }, 200, origin);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || SITE_ORIGIN;
  if (req.method === "OPTIONS") return response({}, 204, origin);
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405, origin);

  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === "dispatch") return await dispatch(req, body, origin);
    if (origin !== SITE_ORIGIN) return response({ error: "origin_not_allowed" }, 403, origin);
    if (body.action === "config") {
      const identity = await authenticatedUser(req);
      if (!identity) return response({ error: "unauthorized" }, 401, origin);
      const config = await runtimeConfig();
      return response({ publicKey: config.vapid_public_key, slots: ["15:00", "21:00"] }, 200, origin);
    }
    if (body.action === "register") return await register(req, body, origin);
    if (body.action === "unregister") return await unregister(req, body, origin);
    return response({ error: "unknown_action" }, 400, origin);
  } catch (_error) {
    return response({ error: "push_service_unavailable" }, 500, origin);
  }
});
