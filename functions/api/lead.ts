// Cloudflare Pages Function — Lead intake.
// Auto-detected at /api/lead by Cloudflare Pages.

import {
  leadSchema,
  verifyTurnstile,
  deliverLead,
  safeLog,
} from "../../src/lib/lead-handler";

interface PagesEnv {
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  WHATSAPP_WEBHOOK_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
}
interface EventCtx {
  request: Request;
  env: PagesEnv;
}

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export const onRequestPost = async (ctx: EventCtx): Promise<Response> => {
  const { request, env } = ctx;
  const ct = request.headers.get("content-type") || "";

  let raw: Record<string, unknown> = {};
  try {
    if (ct.includes("application/json")) {
      raw = (await request.json()) as Record<string, unknown>;
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => {
        raw[k] = typeof v === "string" ? v : "";
      });
    }
  } catch {
    return json(400, { ok: false, error: "Cuerpo de la solicitud inválido." });
  }

  if (typeof raw["hp"] === "string" && raw["hp"]) {
    return json(200, { ok: true });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    return json(400, {
      ok: false,
      error: "Algún campo no es válido. Verifica nombre, email y WhatsApp colombiano.",
    });
  }
  const lead = parsed.data;

  const turnstileToken = (raw["cf-turnstile-response"] as string) || null;
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const tsOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!tsOk) {
    return json(400, { ok: false, error: "Verificación anti-spam falló. Refresca e intenta de nuevo." });
  }

  console.log("[lead]", safeLog(lead));

  const { emailOk, webhookOk } = await deliverLead(lead, env);
  console.log("[lead:delivery]", { emailOk, webhookOk });

  return json(200, { ok: true });
};

export const onRequest = (ctx: EventCtx) => {
  if (ctx.request.method === "POST") return onRequestPost(ctx);
  return json(405, { ok: false, error: "Method not allowed" });
};
