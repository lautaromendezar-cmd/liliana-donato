"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import s from "./Navegacion.module.css";

const SECCIONES = [
  { href: "/obra", texto: "Obra" },
  { href: "/textos", texto: "Textos" },
  { href: "/sobre", texto: "Sobre" },
  { href: "/contacto", texto: "Contacto" },
] as const;

export function Navegacion({ nombre }: { nombre: string }) {
  const ruta = usePathname();

  return (
    <header className={s.barra}>
      {/* El nombre accesible sale del texto visible: nada de aria-label que
          contradiga lo que se lee en pantalla. */}
      <Link href="/" className={s.marca}>
        <span className={s.nombre}>{nombre}</span>
        <span className={s.punto} aria-hidden="true">
          ·
        </span>
        <span className={`${s.oficio} versal`}>Arte</span>
      </Link>

      <nav aria-label="Secciones">
        <ul className={s.menu}>
          {SECCIONES.map(({ href, texto }) => {
            const activo = ruta === href || ruta.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${s.enlace} ${activo ? s.activo : ""} versal`}
                  aria-current={activo ? "page" : undefined}
                >
                  {texto}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
