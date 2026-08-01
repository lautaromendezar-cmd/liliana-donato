import type { Metadata } from "next";

import { Exposiciones } from "@/components/Exposiciones";

export const metadata: Metadata = {
  title: "Exposiciones — Liliana Donato",
  description:
    "Muestras colectivas e individuales de Liliana Donato en Buenos Aires y el exterior, de 1995 a hoy.",
};

export default function Pagina() {
  return (
    <main>
      <Exposiciones />
    </main>
  );
}
