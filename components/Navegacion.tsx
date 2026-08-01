"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MARCA, NAVEGACION, TREBOL } from "@/lib/hero";

import estilos from "./Navegacion.module.css";

/** Cuanto hay que bajar para que el carril valga la pena. */
const UMBRAL = 24;

/** El mismo corte que usa el CSS para pasar al menu de telefono. */
const ANCHO_ESCRITORIO = "(min-width: 64.0625rem)";

export function Navegacion() {
  const ruta = usePathname();

  // Arriba de todo no hay nada que proteger y el carril solo se veria como
  // una franja pegada al borde. Aparece recien cuando hay algo subiendo.
  const [desplazado, setDesplazado] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const mirar = () => setDesplazado(window.scrollY > UMBRAL);
    mirar();
    window.addEventListener("scroll", mirar, { passive: true });
    return () => window.removeEventListener("scroll", mirar);
  }, []);

  // Navegar cierra. Con navegacion de cliente la pagina cambia debajo del
  // panel, asi que sin esto el menu quedaria abierto sobre la pagina nueva.
  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  useEffect(() => {
    if (!abierto) return;

    const cerrar = () => setAbierto(false);

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cerrar();
        boton.current?.focus();
      }
    };

    // Si la ventana crece hasta donde el menu ya se muestra desplegado, el
    // boton desaparece y el panel quedaria abierto sin nada que lo cierre.
    const ancho = window.matchMedia(ANCHO_ESCRITORIO);

    document.addEventListener("keydown", tecla);
    ancho.addEventListener("change", cerrar);
    // el bloqueo del scroll vive en el CSS: tocar body.style desde aca se
    // pelearia con el overflow-x que globals.css necesita para el hero
    document.documentElement.dataset.menu = "abierto";

    // el foco entra al panel; al cerrar vuelve al boton
    panel.current?.querySelector("a")?.focus();

    return () => {
      document.removeEventListener("keydown", tecla);
      ancho.removeEventListener("change", cerrar);
      delete document.documentElement.dataset.menu;
    };
  }, [abierto]);

  return (
    <header
      className={estilos.barra}
      data-carril={desplazado ? "" : undefined}
      data-abierto={abierto ? "" : undefined}
    >
      {/*
        La marca y el boton van juntos en una fila propia porque la animacion
        de entrada mueve transform, y un transform en la barra la convierte en
        bloque contenedor de los position:fixed de adentro: el panel dejaria de
        medirse contra la pantalla y se mediria contra la barra.
      */}
      <div className={estilos.fila}>
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

        {/*
          El boton solo existe en telefono, y lo decide el CSS. Decidirlo en
          JavaScript obligaria a medir la ventana antes de pintar, que es
          justamente lo que hace que un menu parpadee al cargar.
        */}
        <button
          ref={boton}
          type="button"
          className={estilos.boton}
          aria-expanded={abierto}
          aria-controls="menu-secciones"
          aria-label={abierto ? "Cerrar el menú" : "Abrir el menú"}
          onClick={() => setAbierto((v) => !v)}
        >
          <span className={estilos.trazos} aria-hidden="true" />
        </button>
      </div>

      <nav
        ref={panel}
        id="menu-secciones"
        aria-label="Secciones"
        className={estilos.panel}
      >
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
