import type { Metadata } from "next";

import { Bio } from "@/components/Bio";

export const metadata: Metadata = {
  title: "Bio — Liliana Donato",
  description:
    "Liliana Donato, artista argentina y Licenciada en psicopedagogía. Óleo, acuarela, acrílico y medios mixtos.",
};

export default function PaginaBio() {
  return (
    <main>
      <Bio />
    </main>
  );
}
