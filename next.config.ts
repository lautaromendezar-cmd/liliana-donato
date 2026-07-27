import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // los recortes se muestran chicos; no hace falta que el optimizador
    // genere variantes gigantes de cada rama
    imageSizes: [64, 96, 128, 192, 256, 384],
    deviceSizes: [480, 640, 828, 1080, 1200, 1600],
  },
};

export default nextConfig;
