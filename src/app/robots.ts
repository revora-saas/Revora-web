import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora.fr";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // On n'indexe pas l'application ni les API.
      disallow: ["/tableau-de-bord", "/agenda", "/clientes", "/caisse", "/stock", "/finance", "/reglages", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
