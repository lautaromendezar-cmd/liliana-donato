/** Contenido y composicion del hero. */

import recortes from "./recortes.json";

/**
 * Las dimensiones las escribe scripts/extraer_hero.py al recortar. Tipearlas
 * aca las dejaria viejas el dia que se reencuadre una rama, y next/image las
 * usa para reservar el espacio: el sintoma seria un salto de layout sin causa
 * aparente.
 */
type IdRecorte = keyof typeof recortes;
const medidasDe = (id: IdRecorte) => recortes[id];

export const NOMBRE = "Liliana Donato";

export const STATEMENT =
  "Acuarela y óleo. Trabajo con el agua más que contra ella: dejo que el color se abra en el papel y me quedo con lo que la transparencia decide.";

export const UBICACION = "Pintora · Buenos Aires, Argentina";

export const MARCA = "Liliana Donato · Arte";

export const NAVEGACION = [
  { rotulo: "Series", href: "/series" },
  { rotulo: "Acuarelas", href: "/acuarelas" },
  { rotulo: "Óleos", href: "/oleos" },
  { rotulo: "Bio", href: "/bio" },
  { rotulo: "Contacto", href: "/contacto" },
] as const;

/** Las tres profundidades. El nombre de la capa decide cuanto se desplaza. */
export type Capa = "fondo" | "medio" | "frente";

export interface Recorte {
  readonly id: string;
  readonly ancho: number;
  readonly alto: number;
  readonly capa: Capa;
  /** grados de balanceo a cada lado; se lee como viento, no como deslizamiento */
  readonly giro: number;
  /** transform-origin: el punto por donde la rama entra al borde */
  readonly origen: string;
  /** retardo de entrada, en ms */
  readonly demora: number;
  /** desplazamiento inicial de la entrada, hacia afuera del borde por el que entra */
  readonly entra: string;
  /**
   * Tiene que reflejar el ancho que le da el CSS en cada punto de quiebre.
   * Un `sizes` unico para todos hace que el optimizador sirva una mata de
   * pasto de 94 px de ancho como una imagen de 480: cien kilobytes de mas por
   * un elemento decorativo.
   */
  readonly medidas: string;
  /** solo la rama que domina la composicion se precarga */
  readonly prioritaria?: boolean;
}

/**
 * Orden de pintado: del fondo al frente. Las medidas y posiciones viven en
 * el CSS module, que es donde se pueden recomponer por media query; aca solo
 * esta lo que necesita JavaScript para animarlas.
 */
export const RECORTES: readonly Recorte[] = [
  {
    id: "rama-alta",
    ...medidasDe("rama-alta"),
    capa: "fondo",
    giro: 1,
    origen: "100% 45%",
    demora: 520,
    entra: "translate3d(5%, -3%, 0)",
    // en movil no se muestra: no tiene sentido bajarla grande
    medidas: "(max-width: 48rem) 64px, 34vw",
  },
  {
    id: "pasto-2",
    ...medidasDe("pasto-2"),
    capa: "fondo",
    giro: 1.8,
    origen: "50% 100%",
    demora: 900,
    entra: "translate3d(0, 14%, 0)",
    medidas: "(max-width: 48rem) 26vw, 15vw",
  },
  {
    id: "rama-derecha",
    ...medidasDe("rama-derecha"),
    capa: "medio",
    giro: 1.6,
    origen: "88% 12%",
    demora: 340,
    entra: "translate3d(7%, 0, 0)",
    medidas: "(max-width: 48rem) 62vw, 27vw",
  },
  {
    id: "rama-principal",
    ...medidasDe("rama-principal"),
    capa: "frente",
    giro: 2.2,
    origen: "42% 100%",
    demora: 160,
    entra: "translate3d(-5%, 6%, 0)",
    medidas: "(max-width: 48rem) 62vw, 29vw",
    prioritaria: true,
  },
  {
    id: "pasto-3",
    ...medidasDe("pasto-3"),
    capa: "frente",
    giro: 2.6,
    origen: "50% 100%",
    demora: 760,
    entra: "translate3d(0, 16%, 0)",
    medidas: "(max-width: 48rem) 24vw, 10vw",
  },
  {
    id: "pasto-1",
    ...medidasDe("pasto-1"),
    capa: "frente",
    giro: 2.4,
    origen: "50% 100%",
    demora: 640,
    entra: "translate3d(0, 16%, 0)",
    medidas: "(max-width: 48rem) 30vw, 16vw",
  },
];

/** Los petalos sueltos que se reciclan cayendo. */
export const PETALOS = [
  { id: "petalo-1", ...medidasDe("petalo-1") },
  { id: "petalo-2", ...medidasDe("petalo-2") },
  { id: "petalo-3", ...medidasDe("petalo-3") },
  { id: "petalo-4", ...medidasDe("petalo-4") },
  { id: "petalo-5", ...medidasDe("petalo-5") },
  { id: "petalo-6", ...medidasDe("petalo-6") },
] as const;

