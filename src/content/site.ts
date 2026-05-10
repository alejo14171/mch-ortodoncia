// Global site data — single source of truth for the landing.
// Keep in sync with src/lib/schema.ts when changing structured data.

export const SITE = {
  name: "MCH Ortodoncia",
  doctorFullName: "Dra. María Claudia Huertas",
  doctorShort: "Dra. Huertas",
  tagline: "Sonrisas que respiran tranquilidad",
  positioning: "La ortodoncista a la que llegan los casos difíciles",
  yearsExperience: 25,
  practiceSince: 2000,
  city: "Pereira",
  region: "Risaralda",
  country: "CO",
  languages: ["es", "en"] as const,

  contact: {
    whatsapp: "+573146167263",
    whatsappDigits: "573146167263",
    whatsappDisplay: "+57 314 616 7263",
    email: "maclaudiahuertas@hotmail.com",
    address: {
      street: "Calle 17 #6-42",
      building: "Centro Comercial Rialto",
      floor: "Piso 2",
      office: "Consultorio 3",
      city: "Pereira",
      state: "Risaralda",
      country: "CO",
      countryName: "Colombia",
      postalCode: "660001",
      coordinates: { lat: 4.8126, lng: -75.6938 },
    },
    hours: {
      mon: { open: "08:00", close: "18:00" },
      tue: { open: "08:00", close: "18:00" },
      wed: { open: "08:00", close: "18:00" },
      thu: { open: "08:00", close: "18:00" },
      fri: { open: "08:00", close: "18:00" },
      sat: { open: "08:00", close: "12:00" },
      sun: null,
    },
  },

  consult: {
    price: 60000,
    currency: "COP",
    deductible: true,
    note: "La consulta inicial se descuenta de tu tratamiento si decides empezar.",
  },

  legal: {
    type: "natural-person",
    professionalCard: "[PENDIENTE]",
    privacyPolicyVersion: "1.0",
    privacyPolicyDate: "2026-05-01",
    holderName: "María Claudia Huertas",
  },

  socials: {
    instagram: null,
    facebook: null,
    tiktok: null,
  },

  flags: {
    showTestimonials: false,
    enableCalEmbed: false,
    enableAnalytics: true,
  },
} as const;

export type Site = typeof SITE;

export const NAV_LINKS = [
  { href: "/#retratamientos", label: "Retratamientos" },
  { href: "/#salud", label: "Salud" },
  { href: "/casos-destacados", label: "Casos sin cirugía" },
  { href: "/#tratamientos", label: "Tratamientos" },
  { href: "/#sobre", label: "Sobre la doctora" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const HERO = {
  eyebrow: "ORTODONCIA · PEREIRA · DESDE 2000",
  titlePre: "Sonrisas que",
  titleEmphasis: "respiran",
  titlePost: "tranquilidad.",
  subtitle:
    "Más de 25 años atendiendo casos complejos que otros colegas refieren: retratamientos, ortopedia maxilar y ortodoncia compleja. Aquí tu caso recibe el tiempo que merece.",
  ctaPrimary: "Agendar valoración",
  ctaSecondary: "WhatsApp directo",
  microcopy: "La consulta inicial se descuenta de tu tratamiento.",
} as const;

export const AUTHORITY_ITEMS = [
  { icon: "graduation-cap", text: "Odontóloga · Universidad Nacional" },
  { icon: "graduation-cap", text: "Ortodoncista · Universidad El Bosque" },
  { icon: "badge", text: "Miembro SCO — Soc. Colombiana de Ortodoncia" },
  { icon: "globe", text: "Atención en español e inglés" },
] as const;

export const RETRATAMIENTOS = {
  eyebrow: "ESPECIALIDAD",
  titlePre: "Cuando tu ortodoncia",
  titleEmphasis: "no",
  titlePost: "funcionó.",
  intro:
    "Una ortodoncia donde te sacaron dientes y se te volvieron a abrir los espacios. Un alambre fijo retirado y los dientes inferiores que se torcieron. Una mordida que se abrió de nuevo. Un caso detenido a la mitad por un cambio de ciudad o de doctor.",
  closing: "Si tu boca ya tiene historia clínica, aquí escribimos un mejor capítulo.",
  bullets: [
    {
      title: "Recidivas post-ortodoncia",
      text: "Apiñamiento o espacios que volvieron después de retirar el retenedor. Solucionable en muchos casos en menos de un año.",
    },
    {
      title: "Tratamientos detenidos",
      text: "Casos que quedaron a la mitad por mudanza, cambio de doctor o pérdida de seguimiento.",
    },
    {
      title: "Espacios que se reabrieron",
      text: "Ortodoncias con extracciones donde los espacios se volvieron a abrir años después. Se vuelven a cerrar con un plan estable.",
    },
    {
      title: "Cirugía ortognática postergada",
      text: "¿Te recomendaron cirugía y no pudiste hacerla? Revisemos tu caso. Hay rutas no quirúrgicas para muchos casos.",
    },
  ],
  cta: "Agenda una valoración honesta",
} as const;

export const PROCESS_STEPS = [
  {
    n: "01",
    title: "Agendamiento",
    desc: "Por WhatsApp o formulario. Te respondemos en menos de 24 horas hábiles para confirmar fecha.",
  },
  {
    n: "02",
    title: "Diagnóstico clínico",
    desc: "45–60 minutos. Examen oral, fotografías y, si aplica, modelos digitales y radiografías.",
  },
  {
    n: "03",
    title: "Plan personalizado",
    desc: "Te explico qué tienes, las opciones, duración estimada y cotización clara.",
  },
  {
    n: "04",
    title: "Decisión sin presión",
    desc: "Te llevas el plan a casa. Si decides empezar, la consulta se descuenta del tratamiento.",
  },
] as const;

export const ABOUT = {
  eyebrow: "SOBRE LA DOCTORA",
  title: "María Claudia Huertas",
  subtitle: "Ortodoncista · U. Nacional · U. El Bosque · Miembro SCO",
  paragraphs: [
    "Más de 25 años en Pereira. Pregrado en la Universidad Nacional de Colombia, especialización en Ortodoncia en la Universidad El Bosque, y formación continua a través de la Sociedad Colombiana de Ortodoncia.",
    "Con los años, su consultorio se ha convertido en el lugar al que colegas refieren los casos que requieren más tiempo, más experiencia, o un nuevo abordaje después de tratamientos que no funcionaron como se esperaba.",
    "Atiende pacientes locales, de la región, y de otras ciudades del país y del exterior. Trabaja en español y en inglés.",
  ],
  quote: "Mi motivo es darle a las personas un motivo más para sonreír.",
} as const;

export const OFFICE = {
  eyebrow: "EL CONSULTORIO",
  title: "Un espacio para escucharte sin prisa.",
  features: [
    "Atención solo con cita previa",
    "Ascensor disponible",
    "Accesible para silla de ruedas",
    "Ubicación céntrica con fácil acceso",
  ],
  cta: "Cómo llegar",
} as const;

export const CTA_FINAL = {
  titlePre: "Tu sonrisa merece",
  titleEmphasis: "tiempo,",
  titlePost: "no atajos.",
  subtitle:
    "Más de 25 años atendiendo casos uno por uno. Si tu caso tiene historia, o si vienes por primera vez, mereces un diagnóstico completo y un plan diseñado para ti.",
  ctaPrimary: "Agendar valoración",
  ctaSecondary: "Escribir por WhatsApp",
} as const;
