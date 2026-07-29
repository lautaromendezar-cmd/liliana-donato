import type { Metadata } from "next";

import { Contacto } from "@/components/Contacto";

export const metadata: Metadata = {
  title: "Contacto — Liliana Donato",
  description:
    "Escribile a Liliana Donato por Instagram para consultar por una obra o encargar una pintura. Sus obras también están en Redbubble.",
};

export default function PaginaContacto() {
  return (
    <main>
      <Contacto />
    </main>
  );
}
