"use client";

import { useEffect, useState } from "react";

/**
 * Media query como estado de React.
 *
 * Arranca en false porque en el servidor no hay ventana que medir. Todo lo
 * que dependa de esto tiene que verse bien tambien en su version falsa: aca
 * se usa para elegir cuanto se achica la frase al scrollear, que en el primer
 * cuadro todavia no scrolleo nadie.
 */
export function useConsulta(consulta: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const ajustar = () => setCoincide(mq.matches);
    ajustar();
    mq.addEventListener("change", ajustar);
    return () => mq.removeEventListener("change", ajustar);
  }, [consulta]);

  return coincide;
}
