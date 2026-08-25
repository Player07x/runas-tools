import type { MetadataRoute } from "next"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Runas Tools",
    short_name: "Runas Tools",
    id: ".",
    description: "Ficha e calculadoras para Runas: Livro Azul.",
    start_url: ".",
    scope: ".",
    display: "standalone",
    background_color: "#f3f4f8",
    theme_color: "#343b4e",
    lang: "pt-BR",
    categories: ["games", "utilities"],
    icons: [
      { src: "./icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "./icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "./icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
