"use client";

import { useInView } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./Lavado.module.css";

type Props = {
  children: ReactNode;
  /** En materia el gesto es corto y pesado; en aire, largo y flotante. */
  registro?: "materia" | "aire";
  /** Alterna el sentido del lavado para que la página no lata al unísono. */
  invertido?: boolean;
  retardoMs?: number;
  className?: string;
};

export function Lavado({
  children,
  registro = "aire",
  invertido = false,
  retardoMs = 0,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const enVista = useInView(ref, { once: true, margin: "-8% 0px -12% 0px" });
  const [armado, setArmado] = useState(false);
  const [terminado, setTerminado] = useState(false);

  // La máscara se monta recién en el cliente y sólo si vamos a animar: así el
  // HTML servido muestra la obra completa y nunca queda tapada.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!CSS.supports("mask-image", "linear-gradient(#000, #000)")) return;
    setArmado(true);
  }, []);

  // Al terminar el lavado la máscara se retira. La obra queda plana y entera:
  // ningún efecto puede quedarse recortando la pintura.
  useEffect(() => {
    if (!armado || !enVista) return;
    const ms = (registro === "materia" ? 620 : 1100) + retardoMs + 120;
    const t = window.setTimeout(() => setTerminado(true), ms);
    return () => window.clearTimeout(t);
  }, [armado, enVista, registro, retardoMs]);

  const clases = [
    armado && !terminado ? s.armado : null,
    registro === "materia" ? s.materia : null,
    invertido ? s.invertido : null,
    armado && enVista ? s.revelado : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={clases || undefined}
      style={retardoMs ? ({ "--retardo": `${retardoMs}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
