import type { Metadata } from "next";

import { Objetos } from "@/components/Objetos";

export const metadata: Metadata = {
  title: "Objetos — Liliana Donato",
  description:
    "Las pinturas de Liliana Donato llevadas a objetos: cuadernos, agendas, cartucheras, tazas y más.",
};

export default function Pagina() {
  return (
    <main>
      <Objetos />
    </main>
  );
}
