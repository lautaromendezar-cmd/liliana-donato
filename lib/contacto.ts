/**
 * Contenido de contacto.
 *
 * Liliana confirmo el Instagram y sumo la tienda de Redbubble. Tambien pidio
 * sacar la frase que encabezaba la pagina y dejar solo la invitacion a
 * escribirle, que pasa a ser el unico texto grande.
 *
 * El email y el celular los paso ella misma (julio 2026), asi que ya se pueden
 * mostrar. Ojo con el historial: antes hubo un WhatsApp leido de las tarjetas
 * de la foto "Primaveral" (contenido/Obras/Acuarelas) que nunca confirmo y se
 * saco; el numero valido es el que figura aca, no el de esa foto.
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
  {
    rotulo: "Email",
    valor: "lili.donato1959@gmail.com",
    href: "mailto:lili.donato1959@gmail.com",
  },
  {
    rotulo: "Celular",
    valor: "11 5560-4252",
    href: "tel:+541155604252",
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
