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

export const collections = { services, cases, faqs };
