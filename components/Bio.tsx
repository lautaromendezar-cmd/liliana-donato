"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  MotionConfig,
  motion,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import {
  CIERRE,
  FRASE,
  INTRO,
  MANCHAS,
  PARRAFOS,
  PINTANDO,
  PROPOSITO,
  RETRATO,
  SALUDO,
  SELLO,
} from "@/lib/bio";
import { useConsulta } from "@/lib/useConsulta";
import { useModo } from "@/lib/usePuntero";

import { Revelar } from "./Revelar";
import estilos from "./Bio.module.css";

/**
 * Suavizado del scrub. Mas blando que esto y la frase se despega del dedo;
 * mas duro y copia el escalonado de la rueda del mouse.
 */
const RESORTE = { stiffness: 90, damping: 30, mass: 0.4 } as const;

/**
 * De ocupar la pantalla a ser un titulo mas.
 *
 * En movil se achica bastante menos: la frase ya arranca en un cuerpo chico
 * porque la pantalla es angosta, y llevarla al mismo factor que en escritorio
 * la deja en trece pixeles, ilegible.
 */
const ESCALA_FINAL = { ancho: 0.3, angosto: 0.52 } as const;

/** Cuanto sube, en vh, mientras se achica. */
const SUBIDA = { ancho: -33, angosto: -29 } as const;

export function Bio() {
  const modo = useModo();
  const quieto = modo === "quieto";
  const angosto = useConsulta("(max-width: 48rem)");
  const clave = angosto ? "angosto" : "ancho";

  const pista = useRef<HTMLDivElement>(null);
  // la frase esta fija mientras la pista pasa por la ventana: el progreso de
  // ese recorrido es lo que la achica
  const { scrollYProgress } = useScroll({
    target: pista,
    offset: ["start start", "end end"],
  });
  const avance = useSpring(scrollYProgress, RESORTE);
  const scale = useTransform(avance, [0, 1], [1, ESCALA_FINAL[clave]]);
  const vh = useTransform(avance, [0, 1], [0, SUBIDA[clave]]);
  const y = useMotionTemplate`${vh}vh`;

  const vhManchas = useTransform(avance, [0, 1], [0, SUBIDA[clave] * 0.22]);
  const yManchas = useMotionTemplate`${vhManchas}vh`;
  const escalaManchas = useTransform(avance, [0, 1], [1, 1.12]);

  return (
    <MotionConfig reducedMotion="user">
      <article className={estilos.bio}>
        <div ref={pista} className={estilos.pista}>
          <div className={estilos.fijo}>
            {/* Las manchas se mueven menos que la frase y se agrandan apenas:
                el desfasaje entre las dos es lo que las manda atras. */}
            <motion.div
              className={estilos.manchas}
              aria-hidden="true"
              style={quieto ? undefined : { y: yManchas, scale: escalaManchas }}
            >
              {/* La entrada va en un elemento propio: si compartiera transform
                  con el parallax, una de las dos pisaria a la otra. */}
              <div className={estilos.manchasEntrada}>
                <Image
                  src={MANCHAS.src}
                  alt=""
                  width={MANCHAS.ancho}
                  height={MANCHAS.alto}
                  // sin priority: el elemento de LCP es la frase, y precargar
                  // un fondo decorativo le compite el ancho de banda a la fuente
                  sizes="110vw"
                  className={estilos.manchasImagen}
                />
              </div>
            </motion.div>

            <motion.h1
              className={estilos.frase}
              style={quieto ? undefined : { scale, y }}
            >
              {FRASE}
            </motion.h1>
          </div>
        </div>

        <div className={estilos.cuerpo}>
          <section className={estilos.apertura}>
            <Revelar className={estilos.retrato}>
              <Image
                src={RETRATO.src}
                alt={RETRATO.alt}
                width={RETRATO.ancho}
                height={RETRATO.alto}
                sizes="(max-width: 48rem) 88vw, 42vw"
                className={estilos.foto}
              />
            </Revelar>

            {/* El texto se apoya contra el pie de la foto, no a media altura:
                dos columnas alineadas arriba y del mismo ancho serian una
                lamina de presentacion, no una pagina. */}
            <Revelar demora={0.12} className={estilos.presentacion}>
              <h2 className={estilos.saludo}>{SALUDO}</h2>
              <p className={estilos.intro}>{INTRO}</p>
            </Revelar>
          </section>

          <section className={estilos.fichas}>
            {PARRAFOS.map((p, i) => (
              <Revelar key={p.rotulo} demora={i * 0.08} className={estilos.ficha}>
                <h3 className={estilos.rotulo}>{p.rotulo}</h3>
                <p className={estilos.parrafo}>{p.texto}</p>
              </Revelar>
            ))}
          </section>

          <Revelar className={estilos.escena}>
            <Image
              src={PINTANDO.src}
              alt={PINTANDO.alt}
              width={PINTANDO.ancho}
              height={PINTANDO.alto}
              sizes="(max-width: 48rem) 100vw, 76rem"
              className={estilos.foto}
            />
          </Revelar>

          <Revelar>
            <p className={estilos.proposito}>{PROPOSITO}</p>
          </Revelar>

          <Revelar className={estilos.cierre}>
            <h3 className={estilos.rotulo}>{CIERRE.rotulo}</h3>
            <p className={estilos.parrafo}>{CIERRE.texto}</p>
          </Revelar>

          {/* Sin alt: el sello dice "Liliana Donato / Arte", que es lo que la
              pagina entera viene diciendo. Leerlo de nuevo al final no le
              suma nada a quien escucha. */}
          <Revelar demora={0.1} className={estilos.sello}>
            <Image
              src={SELLO.src}
              alt=""
              width={SELLO.ancho}
              height={SELLO.alto}
              sizes="12rem"
              className={estilos.selloImagen}
            />
          </Revelar>
        </div>
      </article>
    </MotionConfig>
  );
}
