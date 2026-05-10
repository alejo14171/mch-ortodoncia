# MCH Ortodoncia — Landing page

Sitio web profesional de la **Dra. María Claudia Huertas**, ortodoncista en Pereira (Colombia) con más de 25 años de experiencia. Especialidad: retratamientos y ortopedia maxilar.

> **Posicionamiento:** *"La ortodoncista a la que llegan los casos difíciles."*
> **Tagline:** *"Sonrisas que respiran tranquilidad."*

---

## Stack

- **Astro 5** (`output: "static"`) + **TypeScript estricto**
- **Tailwind CSS v4** con `@theme` y design tokens
- **Astro Content Collections** (services, cases, faqs) — escalable sin tocar componentes
- **Zod** para validación de formularios
- **Cloudflare Turnstile** anti-spam (privacy-first, sin reCAPTCHA)
- **Plausible** analytics (sin cookies)
- **Cal.com** embed (placeholder hasta configurar cuenta)
- **Schema.org** completo: Dentist · Person · FAQPage · BreadcrumbList · WebSite
- Fuentes self-hosted: `@fontsource/fraunces` + `@fontsource/inter` con `font-display: swap`

---

## Estructura del proyecto

```
mch-ortodoncia/
├── api/                          ← Vercel Serverless Functions
│   └── lead.ts                   ← endpoint /api/lead (Vercel)
├── functions/                    ← Cloudflare Pages Functions
│   └── api/lead.ts               ← endpoint /api/lead (Cloudflare)
├── public/                       ← assets estáticos servidos tal cual
│   ├── favicon.svg
│   ├── og-default.svg            ← imagen Open Graph
│   ├── _headers                  ← cabeceras de seguridad para Cloudflare
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── logo/                 ← monograma, horizontal, isotipo
│   │   └── casos/                ← 6 SVG antes/después
│   ├── components/
│   │   ├── nav/                  ← Header.astro, Footer.astro
│   │   ├── ui/                   ← Button, Card, Eyebrow, CookieBanner
│   │   ├── icons/Icon.astro      ← icon set centralizado
│   │   ├── forms/LeadForm.astro
│   │   └── sections/             ← Hero, AuthorityStrip, Retratamientos, …
│   ├── content/
│   │   ├── config.ts             ← schemas Zod de las collections
│   │   ├── site.ts               ← datos globales (single source of truth)
│   │   ├── services/*.md         ← 6 tratamientos
│   │   ├── cases/*.md            ← 6 casos clínicos
│   │   └── faqs/*.md             ← 10 FAQs (cuestiones SEO Google)
│   ├── layouts/BaseLayout.astro  ← head, JSON-LD, OG, security
│   ├── lib/
│   │   ├── schema.ts             ← generadores Schema.org tipados
│   │   ├── seo.ts                ← helpers meta + canonical
│   │   └── lead-handler.ts       ← validación Zod + email/WhatsApp
│   ├── pages/
│   │   ├── index.astro           ← landing principal (es-CO)
│   │   ├── politica-privacidad.astro
│   │   ├── aviso-cookies.astro
│   │   └── en/index.astro        ← versión inglés simplificada
│   └── styles/global.css         ← Tailwind v4 @theme tokens
├── astro.config.mjs
├── vercel.json                   ← cabeceras de seguridad para Vercel
├── wrangler.toml                 ← config Cloudflare Pages
├── .env.example                  ← variables de entorno
└── package.json
```

---

## Comandos

```bash
npm install            # instalar dependencias
npm run dev            # servidor local en http://localhost:4321
npm run build          # build de producción a /dist (incluye astro check)
npm run preview        # servir el build localmente para verificar
```

---

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores reales:

```bash
PUBLIC_SITE_URL=https://mch-ortodoncia.com
PUBLIC_PLAUSIBLE_DOMAIN=mch-ortodoncia.com
PUBLIC_ENABLE_ANALYTICS=true

# Cal.com (cuando esté configurada la cuenta)
PUBLIC_CAL_COM_LINK=mch-ortodoncia/valoracion
PUBLIC_ENABLE_CAL_EMBED=false

# Cloudflare Turnstile (anti-spam)
PUBLIC_TURNSTILE_SITE_KEY=             # público — visible en HTML
TURNSTILE_SECRET_KEY=                  # privado — solo backend

# Lead handling (server-side)
RESEND_API_KEY=                        # https://resend.com (envío de email)
LEAD_NOTIFY_EMAIL=maclaudiahuertas@hotmail.com
WHATSAPP_WEBHOOK_URL=                  # webhook de n8n para notificación WhatsApp
```

Variables `PUBLIC_*` se exponen al cliente. Las demás solo viven en el servidor.

---

## Deploy

### Opción A — Vercel (recomendada)

1. Conecta el repositorio en [vercel.com/new](https://vercel.com/new). Vercel detecta Astro automáticamente.
2. En **Settings → Environment Variables** agrega las variables de `.env.example`.
3. Deploy: cada push a `main` despliega producción; los PRs reciben previews.

`vercel.json` ya configura:
- Build command y output dir
- Cabeceras de seguridad (CSP, HSTS, X-Frame-Options DENY, Referrer-Policy)
- Cache-control agresivo para `/_astro/*` y `/assets/*`
- Endpoint serverless en `api/lead.ts` (auto-detectado)

### Opción B — Cloudflare Pages

1. `npm install -g wrangler && wrangler login`
2. `wrangler pages deploy dist` (después de `npm run build`), o conectar el repo en el dashboard de Cloudflare.
3. Setear secretos:
   ```bash
   wrangler pages secret put RESEND_API_KEY
   wrangler pages secret put TURNSTILE_SECRET_KEY
   wrangler pages secret put WHATSAPP_WEBHOOK_URL
   ```
4. Las variables públicas (`PUBLIC_*`) se setean en `wrangler.toml` o en el dashboard.

`public/_headers` aplica las mismas cabeceras de seguridad. `functions/api/lead.ts` actúa como Pages Function.

### Configurar dominio propio

- Compra el dominio (Namecheap, Cloudflare, Porkbun…).
- En Vercel/Cloudflare → agregar `mch-ortodoncia.com` como dominio personalizado.
- Apuntar registros DNS según indique la plataforma.
- Actualizar `PUBLIC_SITE_URL` y redeploy para que canonicals/sitemap usen el dominio real.

---

## Cómo agregar contenido (sin tocar componentes)

Las **content collections** permiten escalar el sitio sin código:

### Agregar un tratamiento

Crear `src/content/services/nuevo-tratamiento.md`:

```markdown
---
id: nuevo-tratamiento
title: Nombre del tratamiento
desc: Descripción corta para la card.
icon: refresh-tooth      # nombre de icono en src/components/icons/Icon.astro
duration: "12–18 meses"
order: 7
---

Descripción detallada (opcional).
```

### Agregar una FAQ

Crear `src/content/faqs/faq-NN-tema.md`:

```markdown
---
q: "¿La pregunta tal cual la haría un paciente?"
order: 11
featured: true   # opcional, para marcarla como destacada
---

Respuesta clara, en lenguaje natural. La respuesta se incluye automáticamente en el JSON-LD `FAQPage` para SEO.
```

### Agregar un caso clínico

1. Colocar el SVG en `src/assets/casos/caso-NN-nombre.svg`.
2. Crear `src/content/cases/caso-NN.md`:

```markdown
---
file: caso-NN-nombre
title: Título del caso
subtitle: Categoría clínica
patient: "Adulta · 35 años"
treatment: "Brackets autoligado + alineadores"
duration: "14 meses"
outcome: Descripción del resultado.
order: 7
---
```

Los componentes `Services`, `Cases` y `FAQ` los recogen automáticamente — no hay que tocar nada más.

---

## Restricciones éticas (NO NEGOCIABLES)

> **Importante: la landing NO afirma ni sugiere** que la ortodoncia produce:
> - Elevación de pómulos · contorno mandibular · reducción de flacidez del cuello.
> - Cambios faciales tipo *"armonización"*.
> - Resultados estéticos faciales fuera de la ortopedia maxilar pediátrica.
>
> Los **antes/después** llevan disclaimer obligatorio: *"Imágenes esquemáticas de referencia clínica. Cada caso es único; los resultados varían según diagnóstico y compromiso del paciente."*

Esta política está alineada con la **Resolución 1416/2016 del MinSalud** y el código de la SCO. Cualquier copy nuevo debe respetarla.

---

## Performance & accesibilidad — objetivos

| Métrica | Objetivo |
|--|--|
| Lighthouse Performance (mobile) | ≥ 95 |
| LCP | < 2.0 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| Lighthouse A11y | 100 |
| Lighthouse Best Practices | ≥ 95 |
| Lighthouse SEO | 100 |

Ya implementado:
- Fuentes self-hosted con `font-display: swap`.
- Imágenes con `loading="lazy"` salvo el hero.
- Astro inlinea CSS y purga lo no usado en producción.
- IntersectionObserver para reveal-on-scroll (respeta `prefers-reduced-motion`).
- Skip-link para teclado, foco visible global.
- Tap targets ≥ 44 px (botones con `min-h-[44px]`).
- Headings con jerarquía correcta y un único H1 por página.
- Lang `es-CO` (`/`) y `en-US` (`/en`), con `hreflang` cruzado.

---

## SEO checklist

- [x] Meta title/description único por página
- [x] OG image único por página (`/og-default.svg`)
- [x] Canonical correcto (lee `PUBLIC_SITE_URL`)
- [x] JSON-LD: `Dentist`, `Person`, `FAQPage`, `BreadcrumbList`, `WebSite`
- [x] `sitemap-index.xml` + `sitemap-0.xml` generados al build
- [x] `robots.txt` apuntando al sitemap
- [x] Geo tags (`geo.region`, `geo.placename`, `ICBM`)
- [x] FAQs con preguntas que coinciden con búsquedas reales en Google
- [x] `availableService` en JSON-LD para cada tratamiento
- [x] `areaServed` con ciudades del Eje Cafetero

---

## Lead form & endpoint

`POST /api/lead` (mismo path en Vercel y Cloudflare):

1. Valida con Zod (`src/lib/lead-handler.ts`).
2. Verifica el token de Cloudflare Turnstile.
3. Envía email a `LEAD_NOTIFY_EMAIL` vía Resend.
4. POST a `WHATSAPP_WEBHOOK_URL` (n8n) para notificación WhatsApp.
5. Logs estructurados sin PII en claro (`safeLog` redacta nombre/email/tel).
6. Honeypot anti-bot (`hp` field).

Mensaje de éxito al usuario: *"Recibí tu mensaje. Te responderé personalmente por WhatsApp en menos de 24 horas hábiles."*

---

## Banderas (feature flags)

En `src/content/site.ts → SITE.flags`:

```ts
flags: {
  showTestimonials: false,  // activar cuando haya testimonios reales con consentimiento
  enableCalEmbed: false,    // activar cuando se configure cuenta Cal.com
  enableAnalytics: true,    // Plausible activo
}
```

---

## Placeholders pendientes

Los siguientes ítems están como **placeholder** en el sitio. Reemplazar antes de hacer pública la URL:

| Item | Dónde | Cómo reemplazar |
|--|--|--|
| **Foto profesional de la doctora** (hero + about) | `src/components/sections/Hero.astro`, `About.astro` | Reemplazar el SVG ilustrativo por `<Image>` de Astro con foto real (sesión profesional) — proceso en `_assets/PROMPTS-IA.md` |
| **Imágenes del consultorio** | (no usadas aún en componente) | Crear sección `Office` con galería 4 imágenes en `src/assets/consultorio/` |
| **Casos antes/después reales** | `src/content/cases/*.md` | Sustituir SVGs esquemáticos por fotografías clínicas con consentimiento informado por escrito |
| **Testimonios reales** | `src/components/sections/Testimonials.astro` | Recopilar quotes con consentimiento, agregarlos al array, activar `flags.showTestimonials = true` |
| **Cal.com embed** | `src/components/forms/LeadForm.astro` | Crear cuenta en cal.com, setear `PUBLIC_CAL_COM_LINK` y `PUBLIC_ENABLE_CAL_EMBED=true` |
| **Registro profesional MinSalud** | `src/components/nav/Footer.astro` | Reemplazar `[Pendiente publicación]` por número real |
| **Coordenadas exactas del consultorio** | `src/content/site.ts → contact.address.coordinates` | Verificar lat/lng exactas (actualmente Pereira centro) |
| **Horarios de atención exactos** | `src/content/site.ts → contact.hours` | Confirmar con la doctora |
| **Plausible site** | dashboard Plausible | Crear sitio en plausible.io con dominio real, setear `PUBLIC_PLAUSIBLE_DOMAIN` |
| **OG image PNG** (opcional) | `public/og-default.svg` actualmente SVG | Para máxima compatibilidad social, generar PNG 1200×630 (Figma export del SVG, o `npx satori-cli` con la plantilla) |

Ver `_assets/INFO-PLACEHOLDER.md` (en el ZIP de contexto) para detalles adicionales.

---

## Diseño y marca

Tokens en `src/styles/global.css → @theme`:

```
--color-bone:           #F7F2EA   crema base
--color-bone-soft:      #FBF8F3   crema cálido
--color-ink:            #1A2238   azul tinta
--color-champagne:      #B8965A   acento dorado
--color-champagne-deep: #8E6F3E   acento dorado oscuro
--color-rosewood:       #B8746B   acento cálido (warning/error)
--color-clay:           #E8D5C8   neutral cálido
```

Tipografía:

- **Fraunces** (display) — pesos 300/400/500 + cursivas. Headlines y números.
- **Inter** (sans) — pesos 300/400/500/600. Body, UI, microcopy.

Componente-pattern: el énfasis dorado en cursiva se aplica en headlines con `<em>...</em>` dentro de `.font-display`.

---

## Licencia

Código propietario de la Dra. María Claudia Huertas. Uso interno del consultorio.

---

## Créditos

Diseño y desarrollo realizado con un enfoque clínico — pensado para informar honestamente, no para vender lo que no es.
