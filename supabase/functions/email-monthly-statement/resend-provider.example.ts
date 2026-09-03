// INACTIVE EXAMPLE: do not deploy without the household owner's explicit approval
// of the external email relay and its message-retention policy.
import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const APP_ORIGIN = "https://mm050692.github.io";
const ALLOWED_ORIGINS = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") || `${APP_ORIGIN},http://localhost:8000,http://127.0.0.1:8000`)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || APP_ORIGIN;
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : APP_ORIGIN,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(request: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function configuredKey(mapName: string, legacyName: string) {
  const legacy = Deno.env.get(legacyName);
  if (legacy) return legacy;
  try {
    const mapping = JSON.parse(Deno.env.get(mapName) || "{}") as Record<string, string>;
    return mapping.default ? Deno.env.get(mapping.default) || "" : "";
  } catch (_error) {
    return "";
  }
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousCalendarMonth(salaryDate: string) {
  const salary = new Date(`${salaryDate.slice(0, 10)}T12:00:00Z`);
  const currentStart = new Date(Date.UTC(salary.getUTCFullYear(), salary.getUTCMonth(), 1));
  const end = new Date(currentStart.getTime() - 86_400_000);
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  return { start: isoDate(start), end: isoDate(end) };
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;",
  })[character] || character);
}

function safeCsvText(value: unknown) {
  const text = String(value ?? "");
  const protectedText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "verified login email";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
}

function rateFor(currency: string, settings: Record<string, unknown>) {
  if (currency === "USD") return 1;
  if (currency === "AED") return Number(settings.usd_to_aed) || 3.6725;
  if (currency === "MVR") return Number(settings.usd_to_mvr) || 15.42;
  if (currency === "INR") return Number(settings.usd_to_inr) || 88;
  return 1;
}

function inBase(amount: number, currency: string, settings: Record<string, unknown>) {
  const base = String(settings.base_currency || "MVR");
  return amount / rateFor(currency, settings) * rateFor(base, settings);
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch (_error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

async function allMonthlyTransactions(
  service: ReturnType<typeof createClient>,
  householdId: string,
  start: string,
  end: string,
) {
  const rows: Record<string, unknown>[] = [];
  let cursor = "";
  const pageSize = 500;
  while (true) {
    let query = service.from("transactions")
      .select("id,date,type,category,amount,currency,paid_by,account_id,account,note,created_at")
      .eq("household_id", householdId)
      .gte("date", start)
      .lte("date", end)
      .in("type", ["income", "expense"])
      .neq("category", "Balance adjustment")
      .order("id", { ascending: true })
      .limit(pageSize);
    if (cursor) query = query.gt("id", cursor);
    const { data, error } = await query;
    if (error) throw error;
    const batch = (data || []) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    cursor = String(batch.at(-1)?.id || "");
    if (!cursor) break;
  }
  return rows.sort((left, right) =>
    `${left.date || ""}${left.created_at || ""}`.localeCompare(`${right.date || ""}${right.created_at || ""}`)
  );
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method_not_allowed" }, 405);
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin && !ALLOWED_ORIGINS.has(requestOrigin)) return json(request, { error: "origin_not_allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const publishableKey = configuredKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const serviceRoleKey = configuredKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization") || "";
  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !authorization.startsWith("Bearer ")) {
    return json(request, { error: "server_configuration" }, 503);
  }

  try {
    const userClient = createClient(supabaseUrl, publishableKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authorization.slice("Bearer ".length);
    const { data: authData, error: authError } = await userClient.auth.getUser(token);
    if (authError || !authData.user) return json(request, { error: "not_authenticated" }, 401);

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: member, error: memberError } = await service.from("household_members")
      .select("household_id")
      .eq("user_id", authData.user.id)
      .limit(1)
      .maybeSingle();
    if (memberError || !member) return json(request, { error: "household_not_found" }, 403);

    const { data: settings, error: settingsError } = await service.from("household_settings")
      .select("base_currency,usd_to_aed,usd_to_mvr,usd_to_inr,email_statements_enabled,statement_recipient_user_id")
      .eq("household_id", member.household_id)
      .maybeSingle();
    if (settingsError || !settings) return json(request, { error: "settings_not_found" }, 404);

    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const recipientId = String(settings.statement_recipient_user_id || "");
    let recipientEmail = "";
    let recipientVerified = false;
    if (recipientId) {
      const { data: recipientData } = await service.auth.admin.getUserById(recipientId);
      recipientEmail = recipientData.user?.email || "";
      recipientVerified = Boolean(recipientData.user?.email_confirmed_at);
    }

    const payload = await request.json().catch(() => ({})) as { action?: string; transactionId?: string };
    if (payload.action === "status") {
      return json(request, {
        status: "ok",
        enabled: settings.email_statements_enabled === true,
        providerReady: Boolean(resendKey),
        recipientReady: Boolean(recipientEmail && recipientVerified),
        recipient: recipientEmail ? maskEmail(recipientEmail) : "",
      });
    }

    if (settings.email_statements_enabled !== true) return json(request, { status: "disabled" });
    if (!resendKey) return json(request, { status: "setup_required", reason: "email_provider" });
    if (!recipientEmail || !recipientVerified) return json(request, { status: "setup_required", reason: "verified_recipient" });
    if (!payload.transactionId) return json(request, { status: "ignored", reason: "salary_transaction_required" });

    const { data: salary, error: salaryError } = await service.from("transactions")
      .select("id,date,type,category")
      .eq("id", payload.transactionId)
      .eq("household_id", member.household_id)
      .maybeSingle();
    if (salaryError || !salary || salary.type !== "income" || salary.category !== "Salary") {
      return json(request, { status: "ignored", reason: "valid_salary_transaction_required" });
    }

    const period = previousCalendarMonth(salary.date);
    const { data: existing } = await service.from("statement_delivery_log")
      .select("id,status,updated_at,attempt_count")
      .eq("household_id", member.household_id)
      .eq("period_start", period.start)
      .maybeSingle();
    if (existing?.status === "sent") return json(request, { status: "already_sent", period });
    if (existing?.status === "processing" && Date.now() - new Date(existing.updated_at).getTime() < 10 * 60_000) {
      return json(request, { status: "processing", period });
    }

    let deliveryId = existing?.id || "";
    if (existing) {
      const { error } = await service.from("statement_delivery_log").update({
        status: "processing",
        requested_by: authData.user.id,
        trigger_transaction_id: salary.id,
        recipient_user_id: recipientId,
        error_code: null,
        attempt_count: Math.min(20, Number(existing.attempt_count || 1) + 1),
      }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { data, error } = await service.from("statement_delivery_log").insert({
        household_id: member.household_id,
        recipient_user_id: recipientId,
        requested_by: authData.user.id,
        trigger_transaction_id: salary.id,
        period_start: period.start,
        period_end: period.end,
      }).select("id").single();
      if (error) {
        if (error.code === "23505") return json(request, { status: "processing", period });
        throw error;
      }
      deliveryId = data.id;
    }

    const transactions = await allMonthlyTransactions(service, member.household_id, period.start, period.end);
    const { data: accounts, error: accountsError } = await service.from("accounts")
      .select("id,name")
      .eq("household_id", member.household_id);
    if (accountsError) throw accountsError;
    const accountNames = new Map((accounts || []).map((account) => [account.id, account.name]));
    const base = String(settings.base_currency || "MVR");
    const income = transactions.filter((item) => item.type === "income")
      .reduce((sum, item) => sum + inBase(Number(item.amount), String(item.currency), settings), 0);
    const spending = transactions.filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + inBase(Number(item.amount), String(item.currency), settings), 0);
    const difference = income - spending;
    const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(`${period.start}T12:00:00Z`));

    const csvRows: unknown[][] = [
      ["Our DHAN monthly statement"],
      ["Period", period.start, period.end],
      ["Dashboard currency", base],
      ["Income total", income.toFixed(2), base],
      ["Spending total", spending.toFixed(2), base],
      ["Difference", difference.toFixed(2), base],
      [],
      ["Date", "Type", "Category", "Amount", "Currency", `Amount in ${base}`, "Person", "Account", "Note"],
      ...transactions.map((item) => [
        item.date,
        item.type,
        item.category,
        Number(item.amount).toFixed(2),
        item.currency,
        (inBase(Number(item.amount), String(item.currency), settings) * (item.type === "expense" ? -1 : 1)).toFixed(2),
        item.paid_by || "Shared",
        accountNames.get(item.account_id) || item.account || "Not linked",
        item.note || "",
      ]),
    ];
    const csv = csvRows.map((row) => row.map(safeCsvText).join(",")).join("\n");
    const allocation = [
      ["Essentials", 40], ["Debt", 30], ["Future", 20], ["Wants", 10],
    ] as const;
    const allocationHtml = allocation.map(([label, percent]) =>
      `<tr><td style="padding:7px 0;color:#6e6e73">${percent}% ${label}</td><td style="padding:7px 0;text-align:right;font-weight:700">${escapeHtml(money(income * percent / 100, base))}</td></tr>`
    ).join("");
    const html = `<!doctype html><html><body style="margin:0;background:#f5f5f7;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><div style="max-width:560px;margin:0 auto;padding:24px"><div style="background:#176b50;color:white;border-radius:22px;padding:24px"><div style="font-size:12px;opacity:.7">OUR DHAN · ${escapeHtml(monthLabel)}</div><h1 style="margin:8px 0 4px;font-size:28px">Monthly money statement</h1><p style="margin:0;opacity:.78">Prepared after this month’s salary was recorded.</p></div><div style="background:white;border-radius:22px;padding:22px;margin-top:12px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:9px 0;color:#6e6e73">Income</td><td style="padding:9px 0;text-align:right;font-weight:700;color:#176b50">${escapeHtml(money(income, base))}</td></tr><tr><td style="padding:9px 0;color:#6e6e73">Spending</td><td style="padding:9px 0;text-align:right;font-weight:700;color:#b84a3d">${escapeHtml(money(spending, base))}</td></tr><tr><td style="padding:12px 0;border-top:1px solid #e5e5e7;font-weight:700">Balance</td><td style="padding:12px 0;border-top:1px solid #e5e5e7;text-align:right;font-weight:800;color:#654783">${escapeHtml(money(difference, base))}</td></tr></table></div><div style="background:white;border-radius:22px;padding:22px;margin-top:12px"><h2 style="margin:0 0 8px;font-size:17px">40–30–20–10 guide</h2><table style="width:100%;border-collapse:collapse">${allocationHtml}</table></div><p style="font-size:12px;line-height:1.5;color:#6e6e73;margin:16px 4px">The attached CSV contains ${transactions.length} income and spending record${transactions.length === 1 ? "" : "s"}. Transfers and balance corrections are excluded to prevent double-counting. Keep the attachment private.</p></div></body></html>`;
    const text = `Our DHAN — ${monthLabel}\nIncome: ${money(income, base)}\nSpending: ${money(spending, base)}\nBalance: ${money(difference, base)}\n\nThe attached CSV contains ${transactions.length} records. Transfers and balance corrections are excluded.`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `our-dhan-${member.household_id}-${period.start}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("STATEMENT_FROM_EMAIL") || "Our DHAN <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: `Our DHAN · ${monthLabel} statement`,
        html,
        text,
        attachments: [{ filename: `our-dhan-statement-${period.start}-to-${period.end}.csv`, content: bytesToBase64(new TextEncoder().encode(csv)) }],
        tags: [{ name: "statement_month", value: period.start.slice(0, 7) }],
      }),
    });
    const providerResult = await response.json().catch(() => ({})) as { id?: string; message?: string; name?: string };
    if (!response.ok || !providerResult.id) {
      const code = String(providerResult.name || response.status || "provider_error").slice(0, 200);
      await service.from("statement_delivery_log").update({ status: "failed", error_code: code }).eq("id", deliveryId);
      return json(request, { error: "delivery_failed", code }, 502);
    }

    const { error: logError } = await service.from("statement_delivery_log").update({
      status: "sent",
      provider_message_id: providerResult.id.slice(0, 200),
      error_code: null,
      sent_at: new Date().toISOString(),
    }).eq("id", deliveryId);
    if (logError) throw logError;
    return json(request, { status: "sent", period, recipient: maskEmail(recipientEmail) });
  } catch (_error) {
    console.error("monthly statement delivery failed");
    return json(request, { error: "statement_delivery_error" }, 500);
  }
});
