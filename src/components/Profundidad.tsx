"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Desplazamiento total en píxeles a lo largo del recorrido. Negativo = sube. */
  recorrido?: number;
  className?: string;
};

/**
 * Parallax por planos. En aire los planos se separan mucho y vuelven lento;
 * en materia apenas se despegan. La diferencia se controla desde afuera con
 * el valor de `recorrido`.
 */
export function Profundidad({ children, recorrido = -60, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sinMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, recorrido]);

  if (sinMovimiento) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, willChange: "transform" }}>{children}</motion.div>
    </div>
  );
}
