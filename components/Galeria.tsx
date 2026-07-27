"use client";

import Image from "next/image";
import { MotionConfig } from "motion/react";

import { SECCIONES, obrasDe, type Seccion } from "@/lib/obras";

import { Revelar } from "./Revelar";
import estilos from "./Galeria.module.css";

export function Galeria({ seccion }: { readonly seccion: Seccion }) {
  const { titulo, bajada } = SECCIONES[seccion];
  const obras = obrasDe(seccion);

  return (
    <MotionConfig reducedMotion="user">
      <article className={estilos.galeria}>
        <header className={estilos.encabezado}>
          <h1 className={estilos.titulo}>{titulo}</h1>
          <p className={estilos.bajada}>{bajada}</p>
          <p className={estilos.cuenta}>
            {obras.length} {obras.length === 1 ? "obra" : "obras"}
          </p>
        </header>

        {/*
          La columna derecha entra corrida hacia abajo. Con obras de proporcion
          parecida -casi todas verticales-, una grilla pareja se lee como
          planilla; el desfasaje la vuelve una pared colgada.
        */}
        <ul className={estilos.obras}>
          {obras.map((obra, i) => (
            <li key={obra.slug} className={estilos.celda}>
              <Revelar demora={(i % 2) * 0.08}>
                <figure className={estilos.obra}>
                  <Image
                    src={`/obras/${obra.slug}.webp`}
                    alt={`${obra.titulo}, ${obra.tecnica.toLowerCase()}${
                      obra.medidas ? `, ${obra.medidas}` : ""
                    }`}
                    width={obra.ancho}
                    height={obra.alto}
                    sizes="(max-width: 48rem) 86vw, 40vw"
                    className={estilos.imagen}
                  />

                  <figcaption className={estilos.ficha}>
                    <h2 className={estilos.nombre}>{obra.titulo}</h2>
                    <p className={estilos.datos}>
                      <span>{obra.tecnica}</span>
                      {obra.medidas ? <span>{obra.medidas}</span> : null}
                      {obra.vendida ? (
                        <span className={estilos.vendida}>Vendida</span>
                      ) : null}
                    </p>
                  </figcaption>
                </figure>
              </Revelar>
            </li>
          ))}
        </ul>
      </article>
    </MotionConfig>
  );
}
