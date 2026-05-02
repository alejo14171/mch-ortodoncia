/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
  readonly PUBLIC_CAL_COM_LINK?: string;
  readonly PUBLIC_ENABLE_CAL_EMBED?: string;
  readonly PUBLIC_ENABLE_ANALYTICS?: string;
  readonly RESEND_API_KEY?: string;
  readonly LEAD_NOTIFY_EMAIL?: string;
  readonly WHATSAPP_WEBHOOK_URL?: string;
  readonly TURNSTILE_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
