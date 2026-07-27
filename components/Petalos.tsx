"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { PETALOS } from "@/lib/hero";
import type { Modo, Puntero } from "@/lib/usePuntero";

import estilos from "./Petalos.module.css";

const CANTIDAD_ESCRITORIO = 18;
const CANTIDAD_MOVIL = 9;

/** Lado mayor en px antes de escalar. La escala la pone el bucle. */
const BASE = 26;

/** Los petalos arrancan cuando el resto de la entrada ya termino. */
const DEMORA = 1800;

/** Salto maximo por cuadro: si la pestana estuvo en segundo plano, no saltan. */
const DT_MAX = 0.05;

interface Estado {
  /** posicion horizontal como fraccion del ancho, 0..1 */
  x: number;
  y: number;
  /** caida en px/s */
  vy: number;
  giro: number;
  /** giro propio en grados/s */
  vgiro: number;
  fase: number;
  /** amplitud de la deriva senoidal, en px */
  amp: number;
  frec: number;
  escala: number;
}

function nuevoEstado(alto: number, arranque: boolean): Estado {
  return {
    x: Math.random(),
    // en el primer cuadro se reparten por toda la altura; despues siempre
    // vuelven a nacer arriba
    y: arranque ? Math.random() * alto : -60 - Math.random() * 160,
    vy: 16 + Math.random() * 26,
    giro: Math.random() * 360,
    vgiro: (Math.random() - 0.5) * 22,
    fase: Math.random() * Math.PI * 2,
    amp: 14 + Math.random() * 34,
    frec: 0.16 + Math.random() * 0.24,
    escala: 0.5 + Math.random() * 0.65,
  };
}

export function Petalos({
  puntero,
  modo,
}: {
  readonly puntero: Puntero;
  readonly modo: Modo;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const nodos = useRef<(HTMLDivElement | null)[]>([]);
  const estados = useRef<Estado[]>([]);
  const empuje = useRef(0);
  const [cantidad, setCantidad] = useState(0);

  // La cantidad depende del ancho, que no existe en el servidor. Hasta que se
  // mide no se renderiza ninguno, que ademas es lo que corresponde: los
  // petalos entran tarde.
  useEffect(() => {
    if (modo === "quieto") {
      setCantidad(0);
      return;
    }
    const angosto = window.matchMedia("(max-width: 48rem)");
    const ajustar = () => {
      setCantidad(angosto.matches ? CANTIDAD_MOVIL : CANTIDAD_ESCRITORIO);
    };
    ajustar();
    angosto.addEventListener("change", ajustar);
    return () => angosto.removeEventListener("change", ajustar);
  }, [modo]);

  // El puntero ya viene amortiguado; aca solo se lee su valor actual sin
  // provocar re-render.
  useEffect(() => {
    empuje.current = puntero.x.get();
    return puntero.x.on("change", (v) => {
      empuje.current = v;
    });
  }, [puntero.x]);

  useEffect(() => {
    const caja = contenedor.current;
    if (!caja || cantidad === 0) return;

    let ancho = caja.clientWidth;
    let alto = caja.clientHeight;

    estados.current = Array.from({ length: cantidad }, () =>
      nuevoEstado(alto, true),
    );

    const observador = new ResizeObserver(() => {
      ancho = caja.clientWidth;
      alto = caja.clientHeight;
    });
    observador.observe(caja);

    let cuadro = 0;
    let previo = performance.now();

    // Un solo bucle para todos los petalos. Uno por petalo multiplicaria por
    // veinte el trabajo de agenda del navegador sin animar nada mas.
    const paso = (ahora: number) => {
      const dt = Math.min((ahora - previo) / 1000, DT_MAX);
      previo = ahora;
      const t = ahora / 1000;

      for (let i = 0; i < estados.current.length; i += 1) {
        const p = estados.current[i];
        const el = nodos.current[i];
        if (!p || !el) continue;

        p.y += p.vy * dt;
        p.giro += p.vgiro * dt;

        if (p.y > alto + 80) {
          Object.assign(p, nuevoEstado(alto, false));
        }

        // deriva propia + empuje lateral del puntero: el seno evita la caida
        // en linea recta, que es lo que delata que esto es un bucle
        const deriva =
          Math.sin(t * p.frec * Math.PI * 2 + p.fase) * p.amp +
          empuje.current * p.amp * 1.7;

        el.style.transform = `translate3d(${p.x * ancho + deriva}px, ${p.y}px, 0) rotate(${p.giro}deg) scale(${p.escala})`;
      }

      cuadro = requestAnimationFrame(paso);
    };

    cuadro = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
    };
  }, [cantidad]);

  if (modo === "quieto" || cantidad === 0) return null;

  return (
    <div
      ref={contenedor}
      className={estilos.campo}
      aria-hidden="true"
      style={{ animationDelay: `${DEMORA}ms` }}
    >
      {Array.from({ length: cantidad }, (_, i) => {
        const fuente = PETALOS[i % PETALOS.length];
        if (!fuente) return null;
        return (
          <div
            key={i}
            ref={(el) => {
              nodos.current[i] = el;
            }}
            className={estilos.petalo}
            style={{ width: BASE }}
          >
            <Image
              src={`/hero/${fuente.id}.webp`}
              alt=""
              width={fuente.ancho}
              height={fuente.alto}
              sizes="48px"
              className={estilos.imagen}
            />
          </div>
        );
      })}
    </div>
  );
}
