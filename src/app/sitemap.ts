import type { MetadataRoute } from "next";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";
import { DOCS_LEGAUX } from "@/lib/vitrine-legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora.fr";
  const pages = ["", "/fonctionnalites", "/metiers", "/tarifs", "/contact"];

  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.8 })),
    ...METIERS_VITRINE.map((m) => ({
      url: `${base}/metiers/${m.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...DOCS_LEGAUX.map((d) => ({
      url: `${base}/legal/${d.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
