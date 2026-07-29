/**
 * Contenido de contacto.
 *
 * Liliana confirmo el Instagram y sumo la tienda de Redbubble. Tambien pidio
 * sacar la frase que encabezaba la pagina y dejar solo la invitacion a
 * escribirle, que pasa a ser el unico texto grande.
 *
 * No hay telefono ni email. Habia un WhatsApp, pero el numero se habia leido
 * de las tarjetas que se ven en la foto de "Primaveral"
 * (contenido/Obras/Acuarelas) y ella nunca lo confirmo; el Instagram salio de
 * la misma foto y resulto mal escrito, asi que el numero se saca hasta que lo
 * confirme. No reponerlo desde esa foto.
 */

import medidasManchas from "./manchas.json";

export const INVITACION = {
  antes:
    "Si te gusta alguna obra, querés encargar algo o simplemente escribirme, ",
  enfasis: "estoy del otro lado",
  despues: ".",
};

export const FIRMA = "Liliana Donato";

export const CANALES = [
  {
    rotulo: "Instagram",
    valor: "@lilidonatoarte",
    href: "https://instagram.com/lilidonatoarte",
  },
  // ella lo paso como "lilidonato.redbuble", que es el usuario y el nombre del
  // sitio pegados; el usuario solo es "lilidonato"
  {
    rotulo: "Redbubble",
    valor: "lilidonato",
    href: "https://www.redbubble.com/people/lilidonato/shop",
  },
] as const;

export const MANCHAS = {
  src: "/contacto/manchas.webp",
  ...medidasManchas,
} as const;
