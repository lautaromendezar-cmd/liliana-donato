import { z } from "zod";

/** Registro: el eje conceptual del sitio. */
export const registro = z.enum(["materia", "aire"]);
export const subregistro = z.enum(["color", "monocromo"]);
export const formato = z.enum(["rectangular", "tondo"]);

export type Registro = z.infer<typeof registro>;
export type Subregistro = z.infer<typeof subregistro>;
export type Formato = z.infer<typeof formato>;

/** `TODO` marca un dato que la artista todavía no aportó. Nunca se inventa. */
const dato = z.string().min(1);

export const obraSchema = z.object({
  slug: dato,
  titulo: dato,
  serie: dato,
  anio: dato,
  tecnica: dato,
  medidas: dato,
  imagen: dato,
  proporcion: z.number().positive(),
  imagenDetalle: dato.optional(),
  proporcionDetalle: z.number().positive().optional(),
  orden: z.number().int(),
  destacada: z.boolean().default(false),
  registro,
  subregistro: subregistro.default("color"),
  formato: formato.default("rectangular"),
  coleccionPrivada: z.boolean().default(false),
  requiereCorreccion: z.boolean().default(false),
  notaCorreccion: z.string().optional(),
  nota: z.string().optional(),
  alt: dato,
});

export const serieSchema = z.object({
  slug: dato,
  titulo: dato,
  anios: dato,
  registro,
  subregistro: subregistro.default("color"),
  orden: z.number().int(),
  portada: dato,
  cuerpo: dato,
});

export const atelierSchema = z.object({
  slug: dato,
  titulo: dato,
  imagen: dato,
  proporcion: z.number().positive(),
  orden: z.number().int(),
  obraRelacionada: z.string().optional(),
  alt: dato,
});

export const textoSchema = z.object({
  slug: dato,
  titulo: dato,
  autor: dato,
  anio: dato,
  orden: z.number().int(),
  bajada: z.string().optional(),
  cuerpo: dato,
});

export const perfilSchema = z.object({
  nombre: dato,
  oficio: dato,
  lugar: dato,
  statement: dato,
  obraDeInicio: dato,
  retrato: dato,
  retratoAlt: dato,
  cuerpo: dato,
});

const entradaCv = z.object({
  anio: dato,
  titulo: dato,
  lugar: dato,
  ciudad: z.string().optional(),
});

export const cvSchema = z.object({
  formacion: z.array(z.object({ texto: dato, anio: dato })),
  individuales: z.array(entradaCv),
  colectivas: z.array(entradaCv),
  premios: z.array(entradaCv),
  colecciones: z.array(entradaCv),
});

export const contactoSchema = z.object({
  titulo: dato,
  entrada: dato,
  email: dato,
  instagram: dato,
  instagramUrl: dato,
  telefono: dato,
  ciudad: dato,
  cuerpo: dato,
});

export type Obra = z.infer<typeof obraSchema>;
export type Serie = z.infer<typeof serieSchema>;
export type Atelier = z.infer<typeof atelierSchema>;
export type Texto = z.infer<typeof textoSchema>;
export type Perfil = z.infer<typeof perfilSchema>;
export type Cv = z.infer<typeof cvSchema>;
export type Contacto = z.infer<typeof contactoSchema>;

/** Una serie con sus obras ya resueltas y ordenadas. */
export type SerieConObras = Serie & { obras: Obra[]; obraPortada: Obra };
