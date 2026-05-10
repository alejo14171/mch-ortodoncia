export interface SeoMeta {
  title: string;
  description: string;
  ogImage?: string;
  canonical: string;
  lang?: string;
  alternateEn?: string;
}

const DEFAULTS = {
  title: "Dra. María Claudia Huertas · Ortodoncia y Retratamientos en Pereira",
  description:
    "Ortodoncista en Pereira con más de 25 años de experiencia. Especialista en retratamientos y ortopedia maxilar. Agenda tu valoración.",
  ogImage: "/og-default.png",
  lang: "es-CO",
};

export function buildSeo(input: Partial<SeoMeta> & { canonical: string }): SeoMeta {
  return {
    title: input.title || DEFAULTS.title,
    description: input.description || DEFAULTS.description,
    ogImage: input.ogImage || DEFAULTS.ogImage,
    canonical: input.canonical,
    lang: input.lang || DEFAULTS.lang,
    alternateEn: input.alternateEn,
  };
}

export function absoluteUrl(siteUrl: string, path: string): string {
  if (path.startsWith("http")) return path;
  return `${siteUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : "/" + path}`;
}
