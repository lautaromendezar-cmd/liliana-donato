"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Aparicion al entrar en pantalla. Una sola vez: que un bloque se desvanezca
 * de nuevo al volver a subir se lee como un error, no como un efecto.
 *
 * El recorrido vertical es corto a proposito. Con prefers-reduced-motion el
 * MotionConfig de la pagina anula el desplazamiento y deja solo la opacidad.
 */
export function Revelar({
  children,
  demora = 0,
  className,
}: {
  readonly children: ReactNode;
  readonly demora?: number;
  readonly className?: string;
}) {
  return (
    <motion.div
      // clase sin hashear: la usa el <noscript> del layout para desactivar el
      // estado inicial. Sin eso, si el JS no llega, la bio entera queda en
      // opacidad cero, que es peor que no tener la animacion.
      className={className ? `revelable ${className}` : "revelable"}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 1, delay: demora, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
