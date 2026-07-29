/**
 * Contenido de contacto.
 *
 * Liliana confirmo el Instagram y sumo la tienda de Redbubble. Tambien pidio
 * sacar la frase que encabezaba la pagina y dejar solo la invitacion a
 * escribirle, que pasa a ser el unico texto grande.
 *
 * OJO: el telefono sigue sin confirmar. Salio de las tarjetas que se ven en la
 * foto de "Primaveral" (contenido/Obras/Acuarelas), asi que es un dato que
 * ella ya reparte impreso, pero fue leido de una foto. No hay email porque su
 * tarjeta no lo trae.
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
    rotulo: "WhatsApp",
    valor: "+54 9 11 5560-4252",
    href: "https://wa.me/5491155604252",
  },
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
