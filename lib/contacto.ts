/**
 * Contenido de contacto.
 *
 * OJO: el telefono y el Instagram salen de las tarjetas que se ven en la foto
 * de "Primaveral" (contenido/Obras/Acuarelas). Son datos que Liliana ya
 * reparte impresos, pero fueron leidos de una foto y hay que confirmarlos con
 * ella antes de publicar el sitio. No hay email porque su tarjeta no lo trae.
 */

import medidasManchas from "./manchas.json";

export const TITULO = {
  antes: "Que una obra encuentre ",
  enfasis: "su lugar",
  despues: ".",
};

export const INVITACION =
  "Si te gusta alguna obra, querés encargar algo o simplemente escribirme, estoy del otro lado.";

export const FIRMA = "Liliana Donato";

export const CANALES = [
  {
    rotulo: "WhatsApp",
    valor: "+54 9 11 5560-4252",
    href: "https://wa.me/5491155604252",
  },
  {
    rotulo: "Instagram",
    valor: "@lilidonato.arte",
    href: "https://instagram.com/lilidonato.arte",
  },
] as const;

export const MANCHAS = {
  src: "/contacto/manchas.webp",
  ...medidasManchas,
} as const;
