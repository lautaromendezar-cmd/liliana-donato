/**
 * Cronología de muestras. La lista es de Liliana, tal como la mandó, de la más
 * reciente a la más vieja.
 *
 * Lo único que se hizo con su texto es separarlo en campos, que es lo que
 * permite maquetarlo como un índice en vez de como un párrafo por línea: el
 * año sale adelante, la sede queda en la serif y el tipo de muestra pasa a ser
 * el metadato de abajo. Sus palabras no se cambiaron ni se le agregó ninguna:
 * si una línea no dice si fue colectiva o individual, acá tampoco figura.
 *
 * Las mayúsculas de las sedes son las de ella y por eso conviven "Centro
 * cultural Borges" y "Centro de la Cultura Vasca". Igualarlas es una decisión
 * de ella, no del sitio.
 *
 * El total y el período NO se tipean: salen de contar la lista. Escritos a
 * mano quedarían viejos la próxima vez que agregue una muestra, que es
 * exactamente el dato que nadie vuelve a mirar.
 */

export const TITULO = "Exposiciones";

/** Su propio subtítulo. Solo se le cambió el dos puntos por un punto. */
export const BAJADA =
  "Muestras colectivas e individuales, nacionales e internacionales.";

export interface Muestra {
  /** Dónde. Es la línea grande, en la serif. */
  readonly sede: string;
  /** El título que ella entrecomilló. Va en bastardilla, sin las comillas. */
  readonly muestra?: string;
  /** Solo cuando ella lo dice. Sin inventar el de las que no lo aclaran. */
  readonly tipo?: "Colectiva" | "Individual" | "Colectiva internacional";
}

export interface Tramo {
  readonly anio: string;
  readonly muestras: readonly Muestra[];
}

export const CRONOLOGIA: readonly Tramo[] = [
  {
    anio: "2026",
    muestras: [
      {
        sede: "Galería de arte Winsor & Newton",
        tipo: "Colectiva internacional",
      },
    ],
  },
  {
    anio: "2025",
    muestras: [
      {
        sede: "RG en el arte, Galería Internacional",
        muestra: "Sintonías Encontradas",
        tipo: "Colectiva",
      },
    ],
  },
  {
    anio: "2018",
    muestras: [
      { sede: "Jardín japonés, con el taller Cielos", tipo: "Colectiva" },
    ],
  },
  {
    anio: "2017",
    muestras: [
      {
        sede: "Espacio para el arte RG",
        muestra: "Detrás de…",
        tipo: "Individual",
      },
    ],
  },
  {
    anio: "2016",
    muestras: [{ sede: "Centro cultural Borges", tipo: "Colectiva" }],
  },
  {
    anio: "2015",
    muestras: [
      {
        sede: "Superintendencia de Policía Federal",
        muestra: "Arte en Azul",
      },
      { sede: "Espacio de Arte Gisel Durán", tipo: "Colectiva" },
    ],
  },
  {
    anio: "2013",
    muestras: [{ sede: "Centro de la Cultura Vasca", tipo: "Colectiva" }],
  },
  {
    anio: "2012",
    muestras: [
      { sede: "Affordable Art Fair, New York City" },
      { sede: "Buenos Aires Open Art, Galería Hoy Arte hoy" },
    ],
  },
  {
    anio: "2011",
    muestras: [
      {
        sede: "Centro Cultural Tekeyan",
        muestra: "Semana del arte",
        tipo: "Colectiva",
      },
      {
        sede: "Espacio Vax",
        muestra: "Arte y diseño",
        tipo: "Individual",
      },
    ],
  },
  {
    anio: "2010",
    muestras: [
      { sede: "Galería Internacional RG", muestra: "Semana del arte" },
      { sede: "International Artexpo, Nueva York" },
      {
        sede: "Galería Foro de Arte",
        muestra: "Lo contemporáneo en las Artes 2010",
        tipo: "Colectiva",
      },
    ],
  },
  {
    anio: "2009",
    muestras: [
      {
        sede: "Feria de Arte Clásica y Contemporánea, Costa Salguero",
        muestra: "Proyecto 30x30",
      },
      {
        sede: "Centro Cultural Tekeyan",
        muestra: "Gallery Night, Semana del Arte",
        tipo: "Colectiva",
      },
    ],
  },
  {
    anio: "2008",
    muestras: [{ sede: "Centenario de Villa del Parque" }],
  },
  {
    anio: "2007",
    muestras: [
      {
        sede: "Galería Theo",
        muestra: "Grupo Solaris",
        tipo: "Colectiva",
      },
    ],
  },
  {
    anio: "2005",
    muestras: [
      { sede: "Primer Salón del Club Leones de Bs. As." },
      {
        sede: "Banco Credicoop",
        muestra: "Salón 25 de Mayo",
        tipo: "Colectiva",
      },
    ],
  },
  {
    anio: "2002",
    muestras: [
      {
        sede: "Antigua casa de la moneda",
        muestra: "Salón Crisis Argentina 2002",
      },
    ],
  },
  {
    anio: "1995",
    muestras: [
      { sede: "Loft Espacio Alfa, taller Silvia Brewda", tipo: "Colectiva" },
    ],
  },
];

export const TOTAL = CRONOLOGIA.reduce((n, t) => n + t.muestras.length, 0);

/**
 * Las puntas del período. Se sacan por mínimo y máximo y no de los extremos de
 * la lista: así siguen bien el día que se agregue una muestra en el medio, o
 * fuera de orden.
 */
const ANIOS = CRONOLOGIA.map((t) => Number(t.anio));
export const DESDE = String(Math.min(...ANIOS));
export const HASTA = String(Math.max(...ANIOS));
