"use client";

import Image from "next/image";
import { MotionConfig } from "motion/react";

import { CANALES, FIRMA, INVITACION, MANCHAS } from "@/lib/contacto";

import { Revelar } from "./Revelar";
import estilos from "./Contacto.module.css";

export function Contacto() {
  return (
    <MotionConfig reducedMotion="user">
      {/*
        data-tema invierte los tokens para toda la pagina. La navegacion vive
        en el layout y no sabe en que ruta esta, pero como lee los mismos
        tokens, cambia sola a claro sobre verde.
      */}
      <section className={estilos.contacto} data-tema="oscuro">
        <div className={estilos.manchas} aria-hidden="true">
          <Image
            src={MANCHAS.src}
            alt=""
            width={MANCHAS.ancho}
            height={MANCHAS.alto}
            sizes="110vw"
            className={estilos.manchasImagen}
          />
        </div>

        <div className={estilos.centro}>
          {/*
            La invitacion es el h1: Liliana pidio sacar la frase que iba
            arriba, y si esto quedara como un simple parrafo la pagina se
            publicaria sin encabezado.
          */}
          <Revelar>
            <h1 className={estilos.invitacion}>
              {INVITACION.antes}
              <em className={estilos.enfasis}>{INVITACION.enfasis}</em>
              {INVITACION.despues}
            </h1>
          </Revelar>

          <Revelar demora={0.14}>
            <p className={estilos.firma}>{FIRMA}</p>
            <ul className={estilos.canales}>
              {CANALES.map((c) => (
                <li key={c.rotulo}>
                  <a
                    className={estilos.canal}
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={estilos.rotulo}>{c.rotulo}</span>
                    <span className={estilos.valor}>{c.valor}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Revelar>
        </div>

        <p className={estilos.pie}>
          © {new Date().getFullYear()} · {FIRMA}
        </p>
      </section>
    </MotionConfig>
  );
}
