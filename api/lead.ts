// Vercel Serverless Function — Lead intake.
// Auto-detected by Vercel at /api/lead.
// Runs on Node 20+ runtime.

import {
  leadSchema,
  verifyTurnstile,
  deliverLead,
  safeLog,
} from "../src/lib/lead-handler";

interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}
interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  setHeader: (k: string, v: string) => VercelResponse;
  end: () => void;
}

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  let raw: Record<string, unknown> = {};
  try {
    if (req.body && typeof req.body === "object") {
      raw = req.body as Record<string, unknown>;
    } else if (typeof req.body === "string") {
      const params = new URLSearchParams(req.body);
      params.forEach((v, k) => {
        raw[k] = v;
      });
    }
  } catch {
    res.status(400).json({ ok: false, error: "Cuerpo de la solicitud inválido." });
    return;
  }

  // Honeypot
  if (typeof raw["hp"] === "string" && raw["hp"]) {
    res.status(200).json({ ok: true });
    return;
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: "Algún campo no es válido. Verifica nombre, email y WhatsApp colombiano.",
    });
    return;
  }
  const lead = parsed.data;

  const turnstileToken = (raw["cf-turnstile-response"] as string) || null;
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    null;

  const tsOk = await verifyTurnstile(turnstileToken, process.env.TURNSTILE_SECRET_KEY, ip);
  if (!tsOk) {
    res.status(400).json({ ok: false, error: "Verificación anti-spam falló. Refresca e intenta de nuevo." });
    return;
  }

  console.log("[lead]", safeLog(lead));

  const { emailOk, webhookOk } = await deliverLead(lead, {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    LEAD_NOTIFY_EMAIL: process.env.LEAD_NOTIFY_EMAIL,
    WHATSAPP_WEBHOOK_URL: process.env.WHATSAPP_WEBHOOK_URL,
  });
  console.log("[lead:delivery]", { emailOk, webhookOk });

  res.status(200).json({ ok: true });
}
