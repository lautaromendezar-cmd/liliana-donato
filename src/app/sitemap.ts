import type { MetadataRoute } from "next";
import { obras, series } from "@/lib/contenido";

const BASE = "https://lilianadonato.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  const fijas = ["", "/obra", "/textos", "/sobre", "/contacto"].map((ruta) => ({
    url: `${BASE}${ruta}`,
    changeFrequency: "monthly" as const,
    priority: ruta === "" ? 1 : 0.8,
  }));

  return [
    ...fijas,
    ...series().map((s) => ({
      url: `${BASE}/series/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...obras().map((o) => ({
      url: `${BASE}/obras/${o.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
