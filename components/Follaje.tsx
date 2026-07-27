"use client";

import Image from "next/image";
import { motion, useTransform } from "motion/react";

import type { Capa, Recorte } from "@/lib/hero";
import type { Modo, Puntero } from "@/lib/usePuntero";

import estilos from "./Follaje.module.css";

/**
 * Cuanto se desplaza cada capa, en px. El fondo apenas y el frente bastante:
 * la diferencia entre las dos cifras es toda la profundidad que hay.
 */
const DESPLAZAMIENTO: Record<Capa, number> = {
  fondo: 10,
  medio: 22,
  frente: 35,
};

/** El eje vertical recorre la mitad que el horizontal. */
const RAZON_VERTICAL = 0.5;

/**
 * En ambiente el recorrido se acorta: con puntero el movimiento responde a un
 * gesto y se lee como causa y efecto, pero solo, en loop, la misma amplitud
 * pasa de respiracion a cabeceo.
 */
const FACTOR_AMBIENTE = 0.55;

interface Props {
  readonly recorte: Recorte;
  readonly puntero: Puntero;
  readonly modo: Modo;
}

function Rama({ recorte, puntero, modo }: Props) {
  const factor = modo === "ambiente" ? FACTOR_AMBIENTE : 1;
  const d = DESPLAZAMIENTO[recorte.capa] * factor;

  const x = useTransform(puntero.x, [-1, 1], [-d, d]);
  const y = useTransform(puntero.y, [-1, 1], [-d * RAZON_VERTICAL, d * RAZON_VERTICAL]);
  const rotate = useTransform(
    puntero.x,
    [-1, 1],
    [-recorte.giro * factor, recorte.giro * factor],
  );

  const quieto = modo === "quieto";

  return (
    <motion.div
      className={`${estilos.capa} ${estilos[recorte.id] ?? ""}`}
      aria-hidden="true"
      style={
        quieto
          ? { transformOrigin: recorte.origen }
          : { x, y, rotate, transformOrigin: recorte.origen }
      }
    >
      {/*
        La entrada vive en un elemento propio. Si compartiera transform con el
        parallax, una de las dos animaciones pisaria a la otra.
      */}
      <div
        className={estilos.entrada}
        style={
          {
            "--demora": `${recorte.demora}ms`,
            "--entra": recorte.entra,
          } as React.CSSProperties
        }
      >
        {/*
          Solo la rama principal se precarga. Con las seis en priority, las
          seis compiten con la fuente por el ancho de banda y retrasan el
          nombre, que es el elemento de LCP.
        */}
        <Image
          src={`/hero/${recorte.id}.webp`}
          alt=""
          width={recorte.ancho}
          height={recorte.alto}
          priority={recorte.prioritaria === true}
          sizes={recorte.medidas}
          className={estilos.recorte}
        />
      </div>
    </motion.div>
  );
}

export function Follaje({
  recortes,
  puntero,
  modo,
}: {
  readonly recortes: readonly Recorte[];
  readonly puntero: Puntero;
  readonly modo: Modo;
}) {
  return (
    <>
      {recortes.map((recorte) => (
        <Rama key={recorte.id} recorte={recorte} puntero={puntero} modo={modo} />
      ))}
    </>
  );
}
