import type { Metadata } from "next";

import { Galeria } from "@/components/Galeria";

export const metadata: Metadata = {
  title: "Acuarelas — Liliana Donato",
  description: "Acuarelas de Liliana Donato: obra sobre papel, en transparencias y veladuras.",
};

export default function Pagina() {
  return (
    <main>
      <Galeria seccion="acuarelas" />
    </main>
  );
}
