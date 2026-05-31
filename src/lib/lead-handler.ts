// Shared, runtime-agnostic lead validation + delivery.
// Used by both the Vercel serverless function (api/lead.ts) and the
// Cloudflare Pages Function (functions/api/lead.ts).

import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2).max(120),
  whatsapp: z
    .string()
    .min(7)
    .max(30)
    .regex(/^(\+?57)?\s?3\d{2}\s?\d{3}\s?\d{4}$/, "WhatsApp inválido (debe ser número colombiano)"),
  email: z.string().email().max(160),
  forWhom: z.enum(["self", "child", "family"]).default("self"),
  patientAge: z.coerce.number().int().min(3).max(100),
  interest: z
    .enum(["not-sure", "brackets", "retratamiento", "ortopedia", "prequirurgica", "other"])
    .default("not-sure"),
  reason: z.string().max(300).optional().default(""),
  consent: z.union([z.literal("on"), z.literal("true"), z.boolean()]).transform(() => true),
  hp: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export interface LeadEnv {
  RESEND_API_KEY?: string;
  LEAD_NOTIFY_EMAIL?: string;
  WHATSAPP_WEBHOOK_URL?: string;
  TURNSTILE_SECRET_KEY?: string;
}

export interface LeadResult {
  ok: boolean;
  error?: string;
  status: number;
}

const INTEREST_LABEL: Record<LeadInput["interest"], string> = {
  "not-sure": "No está seguro/a",
  brackets: "Brackets",
  retratamiento: "Retratamiento",
  ortopedia: "Ortopedia maxilar (niños)",
  prequirurgica: "Ortodoncia prequirúrgica",
  other: "Otro",
};
const FOR_WHOM_LABEL: Record<LeadInput["forWhom"], string> = {
  self: "Para sí mismo/a",
  child: "Hijo/a",
  family: "Otro familiar",
};

export async function verifyTurnstile(token: string | null, secret: string | undefined, ip: string | null): Promise<boolean> {
  if (!secret) return true; // Turnstile not configured — skip in dev
  if (!token) return false;
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await r.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function deliverLead(input: LeadInput, env: LeadEnv): Promise<{ emailOk: boolean; webhookOk: boolean }> {
  const subject = `Nuevo lead: ${input.name} · ${INTEREST_LABEL[input.interest]}`;
  const body = `
Nombre: ${input.name}
WhatsApp: ${input.whatsapp}
Email: ${input.email}
Para: ${FOR_WHOM_LABEL[input.forWhom]}
Edad del paciente: ${input.patientAge}
Interés: ${INTEREST_LABEL[input.interest]}

Motivo:
${input.reason || "(sin mensaje)"}
  `.trim();

  let emailOk = false;
  let webhookOk = false;

  // Resend email
  if (env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MCH Ortodoncia <leads@mch-ortodoncia.com>",
          to: [env.LEAD_NOTIFY_EMAIL],
          reply_to: input.email,
          subject,
          text: body,
        }),
      });
      emailOk = r.ok;
    } catch {
      emailOk = false;
    }
  }

  // WhatsApp webhook (n8n)
  if (env.WHATSAPP_WEBHOOK_URL) {
    try {
      const r = await fetch(env.WHATSAPP_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, lead: input }),
      });
      webhookOk = r.ok;
    } catch {
      webhookOk = false;
    }
  }

  return { emailOk, webhookOk };
}

/**
 * Logs a lead with PII redacted — safe for production logs.
 * Replace name, email and phone with token-length markers.
 */
export function safeLog(input: LeadInput): Record<string, unknown> {
  const redact = (s: string) => `***[${s.length}]`;
  return {
    name: redact(input.name),
    whatsapp: redact(input.whatsapp),
    email: redact(input.email),
    forWhom: input.forWhom,
    patientAge: input.patientAge,
    interest: input.interest,
    reasonLength: input.reason?.length ?? 0,
  };
}
