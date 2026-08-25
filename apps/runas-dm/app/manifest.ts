import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Runas DM",
    short_name: "Runas DM",
    description: "Bestiário e mesa rápida offline para mestres do sistema Runas.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071112",
    theme_color: "#071112",
    lang: "pt-BR",
    categories: ["games", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
