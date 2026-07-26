import Image from "next/image";
import { contacto } from "@/lib/contenido";
import s from "./PieDePagina.module.css";

export function PieDePagina({ nombre }: { nombre: string }) {
  const c = contacto();
  const anio = new Date().getFullYear();

  return (
    <footer className={s.pie}>
      {/* El sello se usa chico y con aire. Nunca gigante. */}
      <Image
        src="/sitio/sello.png"
        alt=""
        width={900}
        height={900}
        className={s.sello}
        sizes="78px"
      />

      <p className={`${s.centro} versal`}>
        {nombre} · {c.ciudad}
      </p>

      <p className={`${s.derecha} versal cifras`}>
        <a
          href={c.instagramUrl}
          className={s.enlace}
          rel="me noopener noreferrer"
          target="_blank"
        >
          @{c.instagram}
        </a>
        <br />
        <span>© {anio}</span>
      </p>
    </footer>
  );
}
