"use client";

import { MotionConfig, motion } from "motion/react";

import {
  BAJADA,
  CRONOLOGIA,
  DESDE,
  HASTA,
  TITULO,
  TOTAL,
} from "@/lib/exposiciones";

import { Revelar } from "./Revelar";
import estilos from "./Exposiciones.module.css";

export function Exposiciones() {
  return (
    <MotionConfig reducedMotion="user">
      <article className={estilos.pagina}>
        <header className={estilos.encabezado}>
          <h1 className={estilos.titulo}>{TITULO}</h1>
          <p className={estilos.bajada}>{BAJADA}</p>
          <p className={estilos.cuenta}>
            {TOTAL} muestras · {DESDE}–{HASTA}
          </p>
        </header>

        <ul className={estilos.cronologia}>
          {CRONOLOGIA.map((tramo) => (
            <li key={tramo.anio} className={estilos.tramo}>
              {/*
                El año se queda arriba mientras pasan sus muestras. En un año
                con tres, para cuando se lee la última el número ya salió de
                pantalla, y volver a subir para saber de cuándo es algo es lo
                que hace que una cronología se lea mal.

                Se anima solo la opacidad y NO con Revelar: Revelar mueve
                transform, y un transform en el ancestro de un sticky le cambia
                el bloque contenedor y lo deja clavado. La opacidad no.
              */}
              <div className={estilos.columna}>
                <motion.h2
                  className={estilos.anio}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tramo.anio}
                </motion.h2>
              </div>

              <ul className={estilos.muestras}>
                {tramo.muestras.map((m, i) => (
                  <li key={m.sede}>
                    <Revelar demora={i * 0.08}>
                      <h3 className={estilos.sede}>{m.sede}</h3>

                      {/* Sin comillas: el título de una muestra se marca con
                          la bastardilla, que es lo que ya hace la bajada. */}
                      {m.muestra ? (
                        <p className={estilos.muestra}>{m.muestra}</p>
                      ) : null}

                      {m.tipo ? (
                        <p
                          className={estilos.tipo}
                          // el punto magenta es el mismo que marca la obra
                          // vendida y la página actual: señala lo que se sale
                          // de la norma, y de veintitrés muestras dos son suyas
                          // solas
                          data-sola={m.tipo === "Individual" ? "" : undefined}
                        >
                          {m.tipo}
                        </p>
                      ) : null}
                    </Revelar>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </article>
    </MotionConfig>
  );
}
