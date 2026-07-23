import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Revora — gestion beauté",
    short_name: "Revora",
    description:
      "Rendez-vous, clientes, caisse et anti no-show pour les professionnels de la beauté.",
    lang: "fr",
    start_url: "/tableau-de-bord",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1020",
    theme_color: "#0B1020",
    icons: [
      { src: "/icones/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["business", "productivity"],
  };
}
