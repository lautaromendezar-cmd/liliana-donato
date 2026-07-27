"use client";

import { motion, useTransform } from "motion/react";

import { NOMBRE, RECORTES, STATEMENT, UBICACION } from "@/lib/hero";
import { useModo, usePuntero } from "@/lib/usePuntero";

import { Follaje } from "./Follaje";
import { Petalos } from "./Petalos";
import estilos from "./Hero.module.css";

/** El texto tambien respira, pero apenas: lo justo para no quedar pegado. */
const DESPLAZAMIENTO_TEXTO = 4;

export function Hero() {
  const modo = useModo();
  const puntero = usePuntero(modo);

  const x = useTransform(
    puntero.x,
    [-1, 1],
    [DESPLAZAMIENTO_TEXTO, -DESPLAZAMIENTO_TEXTO],
  );
  const y = useTransform(
    puntero.y,
    [-1, 1],
    [DESPLAZAMIENTO_TEXTO / 2, -DESPLAZAMIENTO_TEXTO / 2],
  );

  return (
    <section className={estilos.hero}>
      <div className={estilos.grano} aria-hidden="true" />

      <Follaje recortes={RECORTES} puntero={puntero} modo={modo} />
      <Petalos puntero={puntero} modo={modo} />

      <motion.div
        className={estilos.centro}
        style={modo === "quieto" ? undefined : { x, y }}
      >
        <h1 className={estilos.nombre}>{NOMBRE}</h1>
        <p className={estilos.statement}>{STATEMENT}</p>
        <p className={estilos.ubicacion}>{UBICACION}</p>
      </motion.div>
    </section>
  );
}
