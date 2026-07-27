/**
 * Catalogo de obra.
 *
 * El JSON lo escribe scripts/obras.py a partir de las fotos originales: ahi se
 * recorta la obra, se parsea la ficha del nombre del archivo y se publica el
 * WebP. Nada de esto se tipea a mano.
 */

import catalogo from "./obras.json";

export type Seccion = "acuarelas" | "oleos" | "series";

export interface Obra {
  readonly slug: string;
  readonly seccion: string;
  readonly titulo: string;
  readonly tecnica: string;
  readonly medidas: string | null;
  readonly vendida: boolean;
  readonly ancho: number;
  readonly alto: number;
}

export const OBRAS: readonly Obra[] = catalogo;

export function obrasDe(seccion: Seccion): readonly Obra[] {
  return OBRAS.filter((o) => o.seccion === seccion);
}

/**
 * Encabezado de cada seccion. Las bajadas son descriptivas a proposito y van
 * en tercera persona: el resto del sitio habla con la voz de Liliana, y no
 * corresponde inventarle frases donde solo hace falta decir que hay.
 */
export const SECCIONES: Record<
  Seccion,
  { readonly titulo: string; readonly bajada: string }
> = {
  acuarelas: {
    titulo: "Acuarelas",
    bajada: "Obra sobre papel, en transparencias y veladuras.",
  },
  oleos: {
    titulo: "Óleos",
    bajada: "Obra sobre tela y bastidor, de materia más densa.",
  },
  series: {
    titulo: "Series",
    bajada: "Conjuntos que vuelven sobre un mismo motivo.",
  },
};
