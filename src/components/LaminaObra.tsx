import Image from "next/image";
import type { Obra } from "@/lib/schemas";
import s from "./LaminaObra.module.css";

type Props = {
  obra: Obra;
  sizes: string;
  prioridad?: boolean;
  /** Da continuidad visual entre la grilla y el detalle. */
  nombreDeVista?: string;
  /**
   * Los óleos de empaste comprimen mal: la textura de espátula es todo alta
   * frecuencia. En la portada, que es el LCP, baja a 62 — verificado
   * indistinguible a la escala en que se ve, y son ~45 KB menos.
   */
  calidad?: number;
  className?: string;
};

export function LaminaObra({
  obra,
  sizes,
  prioridad = false,
  nombreDeVista,
  calidad = 70,
  className,
}: Props) {
  const alto = Math.round(2400 / obra.proporcion);
  return (
    <div
      className={[s.lamina, obra.formato === "tondo" ? s.tondo : "", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--proporcion": String(obra.proporcion),
          ...(nombreDeVista ? { viewTransitionName: nombreDeVista } : {}),
        } as React.CSSProperties
      }
    >
      <Image
        src={obra.imagen}
        alt={obra.alt}
        width={2400}
        height={alto}
        sizes={sizes}
        priority={prioridad}
        quality={calidad}
      />
    </div>
  );
}
