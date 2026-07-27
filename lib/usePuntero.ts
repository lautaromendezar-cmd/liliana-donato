"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";

/**
 * quieto   - prefers-reduced-motion: nada se mueve
 * puntero  - hay mouse: el follaje sigue el puntero
 * ambiente - no hay mouse: el follaje se mece solo, sin que nadie lo toque
 */
export type Modo = "quieto" | "puntero" | "ambiente";

/** Del brief: blando y con freno largo. Es lo que separa vivo de nervioso. */
const RESORTE = { stiffness: 40, damping: 20, mass: 1 } as const;

/** Periodo del vaiven en movil, en segundos. */
const PERIODO = 10;

export function useModo(): Modo {
  // arranca quieto: hasta que el cliente no midio, no se mueve nada
  const [modo, setModo] = useState<Modo>("quieto");

  useEffect(() => {
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");

    const decidir = () => {
      setModo(reducido.matches ? "quieto" : fino.matches ? "puntero" : "ambiente");
    };

    decidir();
    reducido.addEventListener("change", decidir);
    fino.addEventListener("change", decidir);
    return () => {
      reducido.removeEventListener("change", decidir);
      fino.removeEventListener("change", decidir);
    };
  }, []);

  return modo;
}

export interface Puntero {
  /** -1 a 1, ya amortiguado */
  readonly x: MotionValue<number>;
  readonly y: MotionValue<number>;
}

/**
 * Posicion del puntero normalizada a -1..1 y pasada por resorte.
 *
 * Todo el movimiento del hero cuelga de estos dos valores. Nada consume la
 * posicion cruda: sin el amortiguado el follaje copia el temblor de la mano
 * y el efecto se cae. En movil, donde no hay puntero, los mismos dos valores
 * los escribe un seno lento, asi que las capas de abajo no se enteran de la
 * diferencia y hay un solo camino de codigo.
 */
export function usePuntero(modo: Modo): Puntero {
  const crudoX = useMotionValue(0);
  const crudoY = useMotionValue(0);
  const x = useSpring(crudoX, RESORTE);
  const y = useSpring(crudoY, RESORTE);

  useEffect(() => {
    if (modo === "quieto") {
      crudoX.set(0);
      crudoY.set(0);
      return;
    }

    if (modo === "puntero") {
      const mover = (e: PointerEvent) => {
        crudoX.set((e.clientX / window.innerWidth) * 2 - 1);
        crudoY.set((e.clientY / window.innerHeight) * 2 - 1);
      };
      window.addEventListener("pointermove", mover, { passive: true });
      return () => window.removeEventListener("pointermove", mover);
    }

    let cuadro = 0;
    const inicio = performance.now();
    const mecer = (ahora: number) => {
      const t = (ahora - inicio) / 1000;
      crudoX.set(Math.sin((t / PERIODO) * Math.PI * 2));
      // el eje vertical va mas lento y con menos recorrido para que el
      // recorrido no se cierre en una elipse evidente
      crudoY.set(Math.sin((t / (PERIODO * 1.6)) * Math.PI * 2) * 0.45);
      cuadro = requestAnimationFrame(mecer);
    };
    cuadro = requestAnimationFrame(mecer);
    return () => cancelAnimationFrame(cuadro);
  }, [modo, crudoX, crudoY]);

  return { x, y };
}
