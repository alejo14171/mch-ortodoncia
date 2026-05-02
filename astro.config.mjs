import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwind from "@tailwindcss/vite";

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://mch-ortodoncia.com";

export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "ignore",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "es",
        locales: { es: "es-CO", en: "en-US" },
      },
    }),
  ],
  vite: {
    plugins: [tailwind()],
  },
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    service: { entrypoint: "astro/assets/services/sharp" },
  },
});
