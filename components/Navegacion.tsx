"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MARCA, NAVEGACION, TREBOL } from "@/lib/hero";

import estilos from "./Navegacion.module.css";

/** Cuanto hay que bajar para que el carril valga la pena. */
const UMBRAL = 24;

export function Navegacion() {
  const ruta = usePathname();

  // Arriba de todo no hay nada que proteger y el carril solo se veria como
  // una franja pegada al borde. Aparece recien cuando hay algo subiendo.
  const [desplazado, setDesplazado] = useState(false);

  useEffect(() => {
    const mirar = () => setDesplazado(window.scrollY > UMBRAL);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  return (
    <header className={estilos.barra} data-carril={desplazado ? "" : undefined}>
      <Link href="/" className={estilos.marca}>
        {/*
          Sin alt a proposito: el nombre esta escrito al lado, y describir el
          trebol haria que un lector de pantalla diga la marca dos veces.
        */}
        <Image
          src={TREBOL.src}
          alt=""
          width={TREBOL.ancho}
          height={TREBOL.alto}
          className={estilos.trebol}
          priority
        />
        <span>{MARCA}</span>
      </Link>

      <nav aria-label="Secciones">
        <ul className={estilos.lista}>
          {NAVEGACION.map((item) => {
            const actual = ruta === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={estilos.enlace}
                  aria-current={actual ? "page" : undefined}
                >
                  {item.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
