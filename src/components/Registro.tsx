"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type Props = {
  registro: "materia" | "aire";
  subregistro?: "color" | "monocromo";
  serie?: string;
  children: ReactNode;
  className?: string;
  /**
   * Para páginas de un solo registro (una obra, una serie): aplica el sustrato
   * de inmediato, sin esperar al scroll, para que la barra superior y el fondo
   * del documento no queden en el registro anterior.
   */
  fijar?: boolean;
};

function aplicar(registro: string, subregistro?: string, serie?: string) {
  const raiz = document.documentElement;
  raiz.dataset["registro"] = registro;
  if (subregistro) raiz.dataset["subregistro"] = subregistro;
  else delete raiz.dataset["subregistro"];
  if (serie) raiz.dataset["serie"] = serie;
  else delete raiz.dataset["serie"];
}

/**
 * Marca una sección con su registro y propaga el sustrato al documento cuando
 * la sección domina el viewport. El cambio de papel a lino —y de luz a
 * penumbra— es el momento perceptible del recorrido.
 */
export function Registro({
  registro,
  subregistro,
  serie,
  children,
  className,
  fijar = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (fijar) aplicar(registro, subregistro, serie);
  }, [fijar, registro, subregistro, serie]);

  useEffect(() => {
    if (fijar) return;
    const nodo = ref.current;
    if (!nodo) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        aplicar(registro, subregistro, serie);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [fijar, registro, subregistro, serie]);

  return (
    <section
      ref={ref}
      className={className}
      data-registro={registro}
      data-subregistro={subregistro}
      data-serie={serie}
    >
      {children}
    </section>
  );
}
