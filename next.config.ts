import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    // Sólo WebP. AVIF comprime mejor pero decodifica bastante más lento en
    // móviles de gama media, y acá el LCP siempre es una pintura a pantalla
    // casi completa: la diferencia de decodificación pesa más que los bytes.
    formats: ["image/webp"],
    // 700 evita el salto de 640 a 828: un móvil de 390px a DPR 1.75 necesita
    // ~683px y estaba pidiendo 828 al pedo, que en una pintura son ~70 KB.
    deviceSizes: [360, 480, 640, 700, 828, 1080, 1280, 1600, 1920, 2400],
    imageSizes: [180, 240, 320, 420],
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default config;
