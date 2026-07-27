import type { Metadata } from "next";

import { Contacto } from "@/components/Contacto";

export const metadata: Metadata = {
  title: "Contacto — Liliana Donato",
  description:
    "Escribile a Liliana Donato por WhatsApp o Instagram para consultar por una obra o encargar una pintura.",
};

export default function PaginaContacto() {
  return (
    <main>
      <Contacto />
    </main>
  );
}
