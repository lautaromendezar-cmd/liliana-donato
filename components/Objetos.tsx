"use client";

import Image from "next/image";
import { MotionConfig } from "motion/react";

import { BAJADA, OBJETOS, TIENDA, TITULO } from "@/lib/objetos";

import { Revelar } from "./Revelar";
import estilos from "./Galeria.module.css";

/**
 * Misma pagina que una galeria de obra, con dos diferencias: la ficha es solo
 * el titulo (una foto de varios objetos no tiene tecnica ni medidas) y al pie
 * va el enlace a la tienda. Por eso comparte el CSS de Galeria en vez de
 * duplicarlo.
 */
export function Objetos() {
  return (
    <MotionConfig reducedMotion="user">
      <article className={estilos.galeria}>
        <header className={estilos.encabezado}>
          <h1 className={estilos.titulo}>{TITULO}</h1>
          <p className={estilos.bajada}>{BAJADA}</p>
        </header>

        <ul className={estilos.obras}>
          {OBJETOS.map((foto, i) => (
            <li key={foto.slug} className={estilos.celda}>
              <Revelar demora={(i % 2) * 0.08}>
                <figure className={estilos.obra}>
                  <Image
                    src={`/objetos/${foto.slug}.webp`}
                    alt={foto.alt}
                    width={foto.ancho}
                    height={foto.alto}
                    sizes="(max-width: 48rem) 86vw, 40vw"
                    className={estilos.imagen}
                  />

                  <figcaption className={estilos.ficha}>
                    <h2 className={estilos.nombre}>{foto.titulo}</h2>
                  </figcaption>
                </figure>
              </Revelar>
            </li>
          ))}
        </ul>

        <Revelar>
          <p className={estilos.nota}>
            {TIENDA.antes}
            <a
              className={estilos.notaEnlace}
              href={TIENDA.href}
              target="_blank"
              rel="noreferrer"
            >
              {TIENDA.rotulo}
            </a>
            {TIENDA.despues}
          </p>
        </Revelar>
      </article>
    </MotionConfig>
  );
}
