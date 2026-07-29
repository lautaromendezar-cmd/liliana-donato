/**
 * Contenido de la seccion Objetos.
 *
 * La idea es de Liliana: mando las fotos por WhatsApp con la frase "para q
 * vean que mis obras pasan a objeto". No mando texto, asi que la bajada y los
 * titulos son descriptivos y en tercera persona, como las bajadas de las
 * secciones de obra: se dice que hay, no se le inventa una frase.
 *
 * Las fotos van tal cual las armo ella, sin recortar: son bodegones con los
 * objetos en uso. Las procesa scripts/objetos.py, que tambien escribe las
 * medidas; nada se tipea a mano.
 */

import medidas from "./objetos.json";

export const TITULO = "Objetos";

export const BAJADA =
  "Sus pinturas, llevadas a objetos de uso cotidiano.";

/**
 * Cierra la pagina apuntando a la tienda. El enlace es el mismo que en
 * contacto (lib/contacto.ts); si cambia alla, cambia aca.
 */
export const TIENDA = {
  antes: "Parte de estos objetos se consiguen en su tienda de ",
  rotulo: "Redbubble",
  href: "https://www.redbubble.com/people/lilidonato/shop",
  despues: ".",
};

type IdFoto = keyof typeof medidas;
const medidasDe = (id: IdFoto) => medidas[id];

/**
 * Los titulos nombran los objetos; el alt ademas dice que pintura llevan,
 * que es lo que un lector de pantalla no puede ver.
 */
export const OBJETOS = [
  {
    slug: "accesorios-1",
    titulo: "Cartucheras y cuadernos",
    alt: "Cartucheras y cuadernos anillados con estampas de flores en acuarela, en rosas, naranjas y azules.",
    ...medidasDe("accesorios-1"),
  },
  {
    slug: "accesorios-2",
    titulo: "Cuaderno, estuche y cartuchera",
    alt: "Cuaderno de tapa dura, estuche y cartuchera con una acuarela de flores en tonos rosas y durazno.",
    ...medidasDe("accesorios-2"),
  },
  {
    slug: "accesorios-3",
    titulo: "Estuches y pad de mouse",
    alt: "Estuche de anteojos, funda y pad de mouse con la acuarela de tréboles y flores rojas.",
    ...medidasDe("accesorios-3"),
  },
  {
    slug: "accesorios-4",
    titulo: "Taza y cuaderno",
    alt: "Taza y cuaderno de tapa dura con acuarelas de rosas en rojos, naranjas y fucsias.",
    ...medidasDe("accesorios-4"),
  },
  {
    slug: "accesorios-5",
    titulo: "Agenda, señalador y stickers",
    alt: "Agenda 2026, señalador pintado a mano y stickers con un paisaje urbano en acuarela.",
    ...medidasDe("accesorios-5"),
  },
] as const;
