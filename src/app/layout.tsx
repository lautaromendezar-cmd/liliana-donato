import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { perfil } from "@/lib/contenido";
import { SuavizadorScroll } from "@/components/SuavizadorScroll";
import { Navegacion } from "@/components/Navegacion";
import { PieDePagina } from "@/components/PieDePagina";
import "./globals.css";

// Sólo opsz: es el eje que da el contraste óptico real y el motivo de elegir
// Fraunces. SOFT y WONK quedan afuera —cada eje extra engorda el archivo
// variable, y es ese archivo el que retrasa el primer texto grande.
const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--fuente-display",
});

const cuerpo = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--fuente-cuerpo",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lilianadonato.com.ar"),
  title: {
    default: "Liliana Donato — Pintora",
    template: "%s · Liliana Donato",
  },
  description:
    "Obra de Liliana Donato, pintora argentina. Óleos de empaste y ensamblajes con vitraux, acuarelas de lavado transparente y una serie en grises.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Liliana Donato",
    title: "Liliana Donato — Pintora",
    description:
      "Óleos de empaste y ensamblajes con vitraux, acuarelas de lavado transparente y una serie en grises.",
    images: [{ url: "/obras/flores-blancas.jpg", width: 1692, height: 2400 }],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f1ebe0",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const p = perfil();
  return (
    <html lang="es-AR" className={`${display.variable} ${cuerpo.variable}`}>
      <body>
        <SuavizadorScroll />
        <a href="#contenido" className="solo-lectores">
          Ir al contenido
        </a>
        <Navegacion nombre={p.nombre} />
        <main id="contenido">{children}</main>
        <PieDePagina nombre={p.nombre} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: p.nombre,
              jobTitle: p.oficio,
              nationality: "AR",
              address: { "@type": "PostalAddress", addressLocality: p.lugar },
              url: "https://lilianadonato.com.ar",
            }),
          }}
        />
      </body>
    </html>
  );
}
