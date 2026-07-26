import type { Metadata } from "next";
import { contacto } from "@/lib/contenido";
import { Registro } from "@/components/Registro";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Consultas sobre obra disponible, encargos y exposiciones.",
  alternates: { canonical: "/contacto" },
};

function Dato({ clave, children }: { clave: string; children: React.ReactNode }) {
  return (
    <li className={s.dato}>
      <span className={`${s.clave} versal`}>{clave}</span>
      <span className={s.valor}>{children}</span>
    </li>
  );
}

export default function Contacto() {
  const c = contacto();
  const hayEmail = c.email !== "TODO";
  const hayTelefono = c.telefono !== "TODO";

  return (
    <Registro registro="aire">
      <div className={`${s.pagina} pliego`}>
        <h1 className={`${s.titulo} display`}>{c.titulo}</h1>
        <p className={s.entrada}>{c.entrada}</p>

        <ul className={s.datos}>
          <Dato clave="Instagram">
            <a href={c.instagramUrl} target="_blank" rel="me noopener noreferrer">
              @{c.instagram}
            </a>
          </Dato>

          <Dato clave="Correo">
            {hayEmail ? (
              <a href={`mailto:${c.email}`}>{c.email}</a>
            ) : (
              <span className={`${s.pendiente} versal`}>A confirmar</span>
            )}
          </Dato>

          <Dato clave="Teléfono">
            {hayTelefono ? (
              <a href={`tel:${c.telefono.replace(/[^\d+]/g, "")}`} className="cifras">
                {c.telefono}
              </a>
            ) : (
              <span className={`${s.pendiente} versal`}>A confirmar</span>
            )}
          </Dato>

          <Dato clave="Ciudad">{c.ciudad}</Dato>
        </ul>

        <p className={s.nota}>{c.cuerpo}</p>
      </div>
    </Registro>
  );
}
