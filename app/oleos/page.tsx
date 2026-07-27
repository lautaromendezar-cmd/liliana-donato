import type { Metadata } from "next";

import { Galeria } from "@/components/Galeria";

export const metadata: Metadata = {
  title: "Óleos — Liliana Donato",
  description: "Óleos de Liliana Donato: obra sobre tela y bastidor.",
};

export default function Pagina() {
  return (
    <main>
      <Galeria seccion="oleos" />
    </main>
  );
}
