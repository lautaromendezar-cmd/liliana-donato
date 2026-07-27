import type { Metadata } from "next";

import { Galeria } from "@/components/Galeria";

export const metadata: Metadata = {
  title: "Series — Liliana Donato",
  description: "Series de Liliana Donato: conjuntos que vuelven sobre un mismo motivo.",
};

export default function Pagina() {
  return (
    <main>
      <Galeria seccion="series" />
    </main>
  );
}
