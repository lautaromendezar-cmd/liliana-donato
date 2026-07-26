"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Scroll suave y largo, del lado de la acuarela.
 * Se desactiva por completo si el sistema pide movimiento reducido.
 */
export function SuavizadorScroll() {
  useEffect(() => {
    const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (sinMovimiento.matches) return;

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6,
      smoothWheel: true,
    });

    let cuadro = 0;
    const animar = (tiempo: number) => {
      lenis.raf(tiempo);
      cuadro = requestAnimationFrame(animar);
    };
    cuadro = requestAnimationFrame(animar);

    return () => {
      cancelAnimationFrame(cuadro);
      lenis.destroy();
    };
  }, []);

  return null;
}
