"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { MARCA, NAVEGACION } from "@/lib/hero";

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
      <a href="/" className={`${estilos.enlace} ${estilos.marca}`}>
        {MARCA}
      </a>

      <nav aria-label="Secciones">
        <ul className={estilos.lista}>
          {NAVEGACION.map((item) => {
            const actual = item.href.startsWith("/") && ruta === item.href;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={estilos.enlace}
                  aria-current={actual ? "page" : undefined}
                >
                  {item.rotulo}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
