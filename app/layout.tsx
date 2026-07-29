import type { Metadata, Viewport } from "next";

import { Navegacion } from "@/components/Navegacion";
import { Transicion } from "@/components/Transicion";

import { display, meta } from "./tipografia";
import "./globals.css";

export const metadata: Metadata = {
  title: "Liliana Donato — Artista visual",
  description:
    "Acuarela y óleo. Obra de Liliana Donato, artista visual argentina radicada en Buenos Aires.",
  authors: [{ name: "Liliana Donato" }],
};

export const viewport: Viewport = {
  themeColor: "#faf6ee",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${display.variable} ${meta.variable}`}>
      <head>
        {/* Los bloques que aparecen al entrar en pantalla se sirven en
            opacidad cero y los levanta JavaScript. Si no llega, se muestran
            igual: una pagina sin animacion es aceptable, una pagina en blanco
            no. */}
        <noscript>
          <style>{".revelable{opacity:1!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body>
        <Navegacion />
        {children}
        <Transicion />
      </body>
    </html>
  );
}
