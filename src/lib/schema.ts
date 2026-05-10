// Schema.org JSON-LD generators. All output is plain JSON-serializable objects
// that can be dropped into a <script type="application/ld+json"> tag.

import { SITE } from "../content/site";

interface FaqEntry {
  question: string;
  answer: string;
}

interface ServiceEntry {
  name: string;
  description: string;
}

const ADDRESS = SITE.contact.address;

export function dentistSchema(siteUrl: string, services: ServiceEntry[]) {
  const openingHours = Object.entries(SITE.contact.hours)
    .filter(([, v]) => v !== null)
    .map(([day, v]) => {
      const dayMap: Record<string, string> = {
        mon: "Mo",
        tue: "Tu",
        wed: "We",
        thu: "Th",
        fri: "Fr",
        sat: "Sa",
        sun: "Su",
      };
      const slot = v as { open: string; close: string };
      return `${dayMap[day]} ${slot.open}-${slot.close}`;
    });

  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${siteUrl}/#dentist`,
    name: SITE.doctorFullName,
    alternateName: SITE.name,
    url: siteUrl,
    image: `${siteUrl}/og-default.png`,
    logo: `${siteUrl}/favicon.svg`,
    telephone: SITE.contact.whatsapp,
    email: SITE.contact.email,
    description:
      "Ortodoncista en Pereira con más de 25 años de experiencia. Especialista en retratamientos y ortopedia maxilar.",
    medicalSpecialty: "Orthodontics",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${ADDRESS.street}, ${ADDRESS.building}, ${ADDRESS.floor}, ${ADDRESS.office}`,
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.state,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: ADDRESS.coordinates.lat,
      longitude: ADDRESS.coordinates.lng,
    },
    openingHours,
    availableService: services.map((s) => ({
      "@type": "MedicalProcedure",
      name: s.name,
      description: s.description,
    })),
    areaServed: [
      { "@type": "City", name: "Pereira" },
      { "@type": "City", name: "Dosquebradas" },
      { "@type": "City", name: "Manizales" },
      { "@type": "City", name: "Armenia" },
      { "@type": "City", name: "Santa Rosa de Cabal" },
    ],
    knowsLanguage: ["es", "en"],
    sameAs: [SITE.socials.instagram, SITE.socials.facebook].filter(Boolean),
  };
}

export function personSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteUrl}/#doctor`,
    name: SITE.doctorFullName,
    jobTitle: "Ortodoncista",
    worksFor: { "@id": `${siteUrl}/#dentist` },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Universidad Nacional de Colombia" },
      { "@type": "CollegeOrUniversity", name: "Universidad El Bosque" },
    ],
    memberOf: {
      "@type": "Organization",
      name: "Sociedad Colombiana de Ortodoncia",
      alternateName: "SCO",
    },
    knowsLanguage: ["es", "en"],
    knowsAbout: [
      "Ortodoncia",
      "Retratamientos ortodóncicos",
      "Ortopedia maxilar",
      "Brackets metálicos",
      "Brackets estéticos",
      "Alineadores invisibles",
      "Ortodoncia prequirúrgica",
    ],
  };
}

export function faqPageSchema(faqs: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function breadcrumbSchema(_siteUrl: string, items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function websiteSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: SITE.name,
    inLanguage: "es-CO",
    publisher: { "@id": `${siteUrl}/#dentist` },
  };
}
