import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    desc: z.string(),
    icon: z.string(),
    duration: z.string(),
    order: z.number(),
    detail: z.string().optional(),
  }),
});

const cases = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/cases" }),
  schema: z.object({
    file: z.string(),
    title: z.string(),
    subtitle: z.string(),
    patient: z.string(),
    treatment: z.string(),
    duration: z.string(),
    outcome: z.string(),
    order: z.number(),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faqs" }),
  schema: z.object({
    q: z.string(),
    order: z.number(),
    featured: z.boolean().optional(),
  }),
});

const featuredCases = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/casos-destacados" }),
  schema: z.object({
    slug: z.string(),
    patient: z.string(),
    age_at_start: z.number(),
    age_at_end: z.number(),
    duration_months: z.number(),
    diagnosis: z.string(),
    treatment: z.string(),
    summary: z.string(),
    consent_informed: z.boolean().default(true),
    photos_dir: z.string(),
    hero_pair: z.string().default("sonrisa"),
    pairs: z.array(
      z.object({
        key: z.string(),
        title: z.string(),
        description: z.string().optional(),
      })
    ),
    order: z.number(),
    published: z.boolean().default(true),
  }),
});

export const collections = { services, cases, faqs, featuredCases };
