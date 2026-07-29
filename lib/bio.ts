/**
 * Contenido de la bio. El texto es de Liliana, tal como lo mando.
 *
 * Lo unico que se toco: espacios dobles, una concordancia ("cada una de mis
 * obras nacen" -> "nace") y el saludo, que pasa a ser el titulo de la seccion
 * para no repetir "soy Liliana" dos veces seguidas. Nada mas: una bio de
 * artista reescrita por otro deja de sonar a ella.
 */

import fotos from "./fotos.json";
import medidasMarca from "./marca.json";
import medidasManchas from "./manchas.json";
import medidasPublicaciones from "./publicaciones.json";

/**
 * Fondo de la frase de apertura. Son recortes reales de "Primaveral" y
 * "Cascada", desenfocados; el color es de ella. Lo genera scripts/manchas.py.
 */
export const MANCHAS = {
  src: "/bio/manchas.webp",
  ...medidasManchas,
} as const;

/** La frase que entra sola, enorme, y se achica al scrollear. */
export const FRASE = "Entre el color y la forma voy descubriendo imágenes.";

export const SALUDO = "Hola, soy Liliana";

export const INTRO =
  "Artista argentina y Licenciada en psicopedagogía. Inicié mis actividades plásticas en forma autodidacta. Cada una de mis obras nace de poder conectarme con mi interior y desde ahí expresarme y mostrar lo que siento; a través del encuentro entre color y forma voy descubriendo imágenes.";

export const PARRAFOS = [
  {
    rotulo: "Formación",
    texto:
      "Concurrí a distintos talleres de dibujo, pintura y cerámica con profesores reconocidos, entre ellos: Silvia Brewda, Diana Dreyfus, Carlos Sarkis Kahayan, Maximiliano Pedreira, Julia Funai y Diego Eguinlian, y en este momento con la artista Kira Mamontova.",
  },
  {
    rotulo: "Técnicas",
    texto:
      "Mis técnicas favoritas son el óleo, la acuarela, el acrílico y también poder experimentar con medios mixtos para expresar mis ideas.",
  },
] as const;

/**
 * Publicaciones en libros. Las fotos las mando ella por WhatsApp; no mando
 * texto, asi que el parrafo es descriptivo y solo dice lo que se ve en las
 * fotos: los titulos y el sello editorial salen de las tapas, y las obras de
 * las paginas interiores. Si Liliana manda su propio texto, va el de ella.
 * Las medidas las escribe scripts/publicaciones.py.
 */
export const PUBLICACIONES = {
  rotulo: "Publicaciones",
  texto:
    "Su obra fue publicada en tres libros de Ediciones Institucionales: El Arte Argentino del Bicentenario, Una Visión Actual del Arte Argentino y Panorama del Arte Argentino.",
  libros: {
    src: "/bio/publicacion-libros.webp",
    alt: "Los tres libros de Ediciones Institucionales que incluyen su obra, apoyados uno junto al otro.",
    ...medidasPublicaciones["publicacion-libros"],
  },
  paginas: [
    {
      src: "/bio/publicacion-barrio-gotico.webp",
      alt: "Página de Una Visión Actual del Arte Argentino con el óleo Barrio gótico, de Liliana I. Donato.",
      ...medidasPublicaciones["publicacion-barrio-gotico"],
    },
    {
      src: "/bio/publicacion-la-espera.webp",
      alt: "Página de libro con el óleo La espera, de Liliana I. Donato, 40 x 30 cm.",
      ...medidasPublicaciones["publicacion-la-espera"],
    },
  ],
} as const;

/** Su declaración de propósito: va sola, en cuerpo grande. */
export const PROPOSITO =
  "Mi propósito es que mis obras no sólo decoren sino que cada una de ellas acompañen a quien las elija, aportando calidez, armonía y una emoción que perdure con el paso del tiempo.";

export const CIERRE = {
  rotulo: "Más allá del lienzo",
  texto:
    "En estos últimos años, mis pinturas comenzaron a cobrar nuevas formas al transformarse en objetos que acompañan la vida cotidiana como almohadones, mantelería, cuadernos, tazas, agendas, y más, permitiendo que el arte trascienda el lienzo y forme parte de diferentes espacios.",
};

/**
 * El sello de Liliana, que cierra la pagina.
 *
 * Va aca y no en contacto, que era donde parecia ir. Sus letras son verde
 * bosque: dan 5.44:1 sobre el crema y 2.50:1 sobre el verde oscuro de
 * contacto, donde el nombre directamente se borra. El dorado y el trebol si
 * se lucen sobre el verde, pero un sello del que no se lee el nombre no es un
 * sello. Lo genera scripts/marca.py.
 */
export const SELLO = {
  src: "/marca/sello.webp",
  ...medidasMarca.sello,
} as const;

/**
 * Estas fotos no son decorativas: son contenido, y llevan alt de verdad.
 * Las medidas salen de scripts/fotos_bio.py, no se tipean.
 */
export const RETRATO = {
  src: "/bio/retrato.webp",
  alt: "Liliana Donato en su taller, delante de su biblioteca de arte y de una de sus pinturas.",
  ...fotos.retrato,
} as const;

export const PINTANDO = {
  src: "/bio/pintando.webp",
  alt: "Liliana Donato pintando una acuarela de flores, con los pinceles y la paleta sobre la mesa.",
  ...fotos.pintando,
} as const;
