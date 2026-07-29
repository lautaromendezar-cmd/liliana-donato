"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { TREBOL } from "@/lib/hero";

import estilos from "./Transicion.module.css";

/**
 * Velo de transicion entre paginas.
 *
 * Escucha el click en captura sobre todo el documento en vez de recibir una
 * prop en cada enlace: asi cualquier enlace interno que se agregue despues
 * -en una ficha, en un pie, donde sea- entra solo a la transicion y nadie
 * tiene que acordarse de conectarlo.
 *
 * El trebol no aparece con un fundido cualquiera: se descubre con el mismo
 * barrido de mascara que usan el nombre del hero, la frase de la bio y los
 * titulos de seccion. Es el gesto propio del sitio, y hace que la transicion
 * se lea como parte de la casa y no como un plugin.
 *
 * Si el visitante pidio menos movimiento no se intercepta nada y los enlaces
 * navegan como cualquier enlace.
 */

/** Por si la navegacion nunca resuelve: mejor destapar que quedar tapado. */
const RESCATE = 2500;

type Estado = "quieto" | "entrando" | "saliendo";

export function Transicion() {
  const router = useRouter();
  const ruta = usePathname();
  const [estado, setEstado] = useState<Estado>("quieto");
  const destino = useRef<string | null>(null);

  useEffect(() => {
    const alClick = (e: MouseEvent) => {
      // click con modificador o rueda: el visitante quiere otra pestana
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const enlace = (e.target as Element | null)?.closest("a");
      if (!(enlace instanceof HTMLAnchorElement)) return;
      if (enlace.hasAttribute("download")) return;
      if (enlace.target && enlace.target !== "_self") return;

      // solo navegacion interna: Instagram y Redbubble se van del sitio, y
      // taparlos con el velo dejaria el velo puesto sobre una pagina que ya
      // no es nuestra
      const href = enlace.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (href === ruta) return;

      e.preventDefault();
      destino.current = href;
      setEstado("entrando");
    };

    // En captura, que corre antes que el handler de <Link>. Alcanza con
    // preventDefault: Link mira defaultPrevented y se hace a un lado, asi que
    // la navegacion queda de este lado sin tener que cortar la propagacion
    // -cortarla dejaria sin clicks a todo lo que cuelgue mas abajo-.
    document.addEventListener("click", alClick, true);
    return () => document.removeEventListener("click", alClick, true);
  }, [ruta]);

  // La ruta ya cambio: el contenido nuevo esta montado debajo del velo.
  useEffect(() => {
    setEstado((previo) => (previo === "entrando" ? "saliendo" : previo));
  }, [ruta]);

  useEffect(() => {
    if (estado !== "entrando") return;
    const id = setTimeout(() => setEstado("saliendo"), RESCATE);
    return () => clearTimeout(id);
  }, [estado]);

  const alTerminar = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      // el trebol tiene su propia animacion y burbujea hasta aca
      if (e.target !== e.currentTarget) return;
      if (estado === "entrando") {
        const a = destino.current;
        destino.current = null;
        if (a) router.push(a);
      } else if (estado === "saliendo") {
        setEstado("quieto");
      }
    },
    [estado, router],
  );

  if (estado === "quieto") return null;

  return (
    <div
      className={`${estilos.velo} ${
        estado === "entrando" ? estilos.entrando : estilos.saliendo
      }`}
      onAnimationEnd={alTerminar}
      aria-hidden="true"
    >
      <Image
        src={TREBOL.src}
        alt=""
        width={TREBOL.ancho}
        height={TREBOL.alto}
        className={estilos.trebol}
      />
    </div>
  );
}
