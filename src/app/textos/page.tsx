import type { Metadata } from "next";
import { textos } from "@/lib/contenido";
import { Registro } from "@/components/Registro";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Textos",
  description: "Textos sobre la obra de Liliana Donato.",
  alternates: { canonical: "/textos" },
};

export default function Textos() {
  const lista = textos();

  return (
    <Registro registro="aire">
      <div className={`${s.cabecera} pliego`}>
        <h1 className={`${s.titulo} display`}>Textos</h1>
      </div>

      {lista.map((t) => {
        const parrafos = t.cuerpo.split(/\n\s*\n/).filter(Boolean);
        return (
          <article key={t.slug} className={`${s.texto} pliego`}>
            <header className={s.credito}>
              <h2 className={s.creditoTitulo}>{t.titulo}</h2>
              <span className={`${s.creditoLinea} versal`}>{t.autor}</span>
              {t.anio !== "TODO" && (
                <span className={`${s.creditoLinea} versal cifras`}>{t.anio}</span>
              )}
              {t.bajada && <span className={`${s.creditoLinea} versal`}>{t.bajada}</span>}
            </header>
            <div className={s.cuerpo}>
              {parrafos.map((p, i) => (
                <p key={i}>{p.replace(/\n/g, " ")}</p>
              ))}
            </div>
          </article>
        );
      })}

      <div className="pliego">
        <p className={`${s.pendiente} versal`}>
          Esta sección está preparada para alojar textos críticos de terceros. Por ahora
          reúne únicamente el texto de la artista.
        </p>
      </div>
    </Registro>
  );
}
