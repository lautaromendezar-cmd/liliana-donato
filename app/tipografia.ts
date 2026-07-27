import { Inter, Instrument_Serif } from "next/font/google";

/**
 * Instrument Serif tiene el contraste de trazo que pide un nombre a 10rem:
 * la diferencia entre asta y perfil se ve de verdad a ese tamano. Trae un
 * solo peso, que es todo lo que hace falta cuando el display no compite con
 * nada.
 */
export const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--fuente-display",
  display: "swap",
});

/**
 * Inter para metadatos y navegacion: neutra de verdad, sin gestos propios.
 * Va chica, en caja alta y con mucho tracking, dialogando con el
 * "LILIANA DONATO / ARTE" del logo.
 */
export const meta = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--fuente-meta",
  display: "swap",
});
