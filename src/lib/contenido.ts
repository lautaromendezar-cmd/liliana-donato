import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  atelierSchema,
  contactoSchema,
  cvSchema,
  obraSchema,
  perfilSchema,
  serieSchema,
  textoSchema,
  type Atelier,
  type Contacto,
  type Cv,
  type Obra,
  type Perfil,
  type Serie,
  type SerieConObras,
  type Texto,
} from "./schemas";

const RAIZ = path.join(process.cwd(), "content");

/**
 * Lee una carpeta de markdown y valida cada archivo contra su esquema.
 * El slug sale del nombre del archivo, así que agregar una obra es poner la
 * imagen en /public y escribir el frontmatter. Nada más.
 */
function leerCarpeta<S extends z.ZodTypeAny>(carpeta: string, esquema: S): z.infer<S>[] {
  const dir = path.join(RAIZ, carpeta);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((archivo) => {
      const crudo = fs.readFileSync(path.join(dir, archivo), "utf8");
      const { data, content } = matter(crudo);
      const slug = archivo.replace(/\.md$/, "");
      const resultado = esquema.safeParse({ ...data, slug, cuerpo: content.trim() });
      if (!resultado.success) {
        throw new Error(
          `content/${carpeta}/${archivo} no valida:\n${resultado.error.issues
            .map((i) => `  · ${i.path.join(".") || "(raíz)"}: ${i.message}`)
            .join("\n")}`,
        );
      }
      return resultado.data;
    });
}

function leerArchivo<S extends z.ZodTypeAny>(rel: string, esquema: S): z.infer<S> {
  const crudo = fs.readFileSync(path.join(RAIZ, rel), "utf8");
  const { data, content } = matter(crudo);
  const resultado = esquema.safeParse({ ...data, cuerpo: content.trim() });
  if (!resultado.success) {
    throw new Error(
      `content/${rel} no valida:\n${resultado.error.issues
        .map((i) => `  · ${i.path.join(".") || "(raíz)"}: ${i.message}`)
        .join("\n")}`,
    );
  }
  return resultado.data;
}

/** Cachea en el módulo: en build estático se lee una sola vez. */
function unaVez<T>(fn: () => T): () => T {
  let valor: T | undefined;
  return () => (valor ??= fn());
}

export const obras = unaVez((): Obra[] =>
  leerCarpeta("obras", obraSchema).sort((a, b) => a.orden - b.orden),
);

export const atelier = unaVez((): Atelier[] =>
  leerCarpeta("atelier", atelierSchema).sort((a, b) => a.orden - b.orden),
);

export const textos = unaVez((): Texto[] =>
  leerCarpeta("textos", textoSchema).sort((a, b) => a.orden - b.orden),
);

export const perfil = unaVez((): Perfil => leerArchivo("sitio/perfil.md", perfilSchema));
export const cv = unaVez((): Cv => leerArchivo("sitio/cv.md", cvSchema));
export const contacto = unaVez((): Contacto => leerArchivo("sitio/contacto.md", contactoSchema));

/** Series con sus obras resueltas, en el orden curatorial del sitio. */
export const series = unaVez((): SerieConObras[] => {
  const todas = obras();
  return leerCarpeta("series", serieSchema)
    .sort((a, b) => a.orden - b.orden)
    .map((serie) => {
      const propias = todas
        .filter((o) => o.serie === serie.slug)
        .sort((a, b) => a.orden - b.orden);
      if (propias.length === 0) {
        throw new Error(`La serie "${serie.slug}" no tiene obras asignadas.`);
      }
      const obraPortada = propias.find((o) => o.slug === serie.portada);
      if (!obraPortada) {
        throw new Error(
          `La portada "${serie.portada}" de la serie "${serie.slug}" no pertenece a la serie.`,
        );
      }
      return { ...serie, obras: propias, obraPortada };
    });
});

export function serie(slug: string): SerieConObras | undefined {
  return series().find((s) => s.slug === slug);
}

export function obra(slug: string): Obra | undefined {
  return obras().find((o) => o.slug === slug);
}

/** Vecinas dentro de la serie, para la navegación anterior/siguiente. */
export function vecinas(slug: string): { anterior?: Obra; siguiente?: Obra; serie: SerieConObras } {
  const actual = obra(slug);
  if (!actual) throw new Error(`Obra desconocida: ${slug}`);
  const s = serie(actual.serie);
  if (!s) throw new Error(`Serie desconocida: ${actual.serie}`);
  const i = s.obras.findIndex((o) => o.slug === slug);
  return { anterior: s.obras[i - 1], siguiente: s.obras[i + 1], serie: s };
}

/** Series agrupadas por registro, respetando el orden curatorial. */
export function seriesPorRegistro() {
  const todas = series();
  return {
    materia: todas.filter((s) => s.registro === "materia"),
    aire: todas.filter((s) => s.registro === "aire"),
  };
}

/**
 * Intercala momentos de atelier entre series: máximo uno cada dos.
 * Devuelve la secuencia lista para renderizar el índice de obra.
 */
export function recorrido(): Array<
  { tipo: "serie"; serie: SerieConObras } | { tipo: "atelier"; foto: Atelier }
> {
  const fotos = atelier();
  const salida: Array<
    { tipo: "serie"; serie: SerieConObras } | { tipo: "atelier"; foto: Atelier }
  > = [];
  let usadas = 0;
  series().forEach((s, i) => {
    salida.push({ tipo: "serie", serie: s });
    const esPar = (i + 1) % 2 === 0;
    const quedanSeries = i < series().length - 1;
    if (esPar && quedanSeries && usadas < fotos.length) {
      salida.push({ tipo: "atelier", foto: fotos[usadas]! });
      usadas += 1;
    }
  });
  return salida;
}

/** Los datos que todavía faltan, para el aviso de build. */
export function pendientes(): string[] {
  const faltan: string[] = [];
  for (const o of obras()) {
    if (o.anio === "TODO") faltan.push(`obra "${o.titulo}": año`);
    if (o.medidas === "TODO") faltan.push(`obra "${o.titulo}": medidas`);
  }
  const c = contacto();
  if (c.email === "TODO") faltan.push("contacto: email");
  if (c.telefono === "TODO") faltan.push("contacto: teléfono");
  return faltan;
}
