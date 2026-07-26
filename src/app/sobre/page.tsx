import type { Metadata } from "next";
import Image from "next/image";
import { cv, perfil } from "@/lib/contenido";
import { Lavado } from "@/components/Lavado";
import { Registro } from "@/components/Registro";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Liliana Donato, pintora argentina. Formación, exposiciones individuales y colectivas desde 1995.",
  alternates: { canonical: "/sobre" },
};

type Entrada = { anio: string; titulo: string; lugar: string; ciudad?: string };

function Bloque({
  titulo,
  entradas,
  vacioTexto,
}: {
  titulo: string;
  entradas: Entrada[];
  vacioTexto: string;
}) {
  return (
    <section className={s.bloque}>
      <div className={s.bloqueCabeza}>
        <h2 className={s.bloqueTitulo}>{titulo}</h2>
        <span className={`${s.bloqueCuenta} versal cifras`}>
          {entradas.length > 0 ? String(entradas.length).padStart(2, "0") : "—"}
        </span>
      </div>
      {entradas.length === 0 ? (
        <p className={`${s.vacio} versal`}>{vacioTexto}</p>
      ) : (
        <ul className={s.lista}>
          {entradas.map((e, i) => (
            <li key={`${e.anio}-${i}`} className={s.fila}>
              <span className={`${s.anio} versal cifras`}>{e.anio}</span>
              <span className={s.obraTitulo}>{e.titulo}</span>
              <span className={`${s.lugar} versal`}>
                {e.lugar}
                {e.ciudad && <span className={s.ciudad}> · {e.ciudad}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Sobre() {
  const p = perfil();
  const c = cv();
  const parrafos = p.cuerpo.split(/\n\s*\n/).filter(Boolean);

  return (
    <Registro registro="aire">
      <div className={`${s.cabecera} pliego`}>
        <h1 className={`${s.titulo} display`}>Liliana Donato</h1>

        <div className={s.retrato}>
          <Lavado registro="aire">
            <Image
              src={p.retrato}
              alt={p.retratoAlt}
              width={1496}
              height={1496}
              sizes="(max-width: 62rem) 92vw, 46vw"
              priority
              quality={70}
            />
          </Lavado>
          <p className={`${s.retratoPie} versal`}>En el taller</p>
        </div>

        <div className={s.bio}>
          {parrafos.map((texto, i) => (
            <p key={i}>{texto.replace(/\n/g, " ")}</p>
          ))}
        </div>
      </div>

      <div className={`${s.trayectoria} pliego`}>
        <section className={s.bloque}>
          <div className={s.bloqueCabeza}>
            <h2 className={s.bloqueTitulo}>Formación</h2>
            <span className={`${s.bloqueCuenta} versal cifras`}>
              {String(c.formacion.length).padStart(2, "0")}
            </span>
          </div>
          <ul className={s.lista}>
            {c.formacion.map((f, i) => (
              <li key={i} className={s.fila}>
                <span className={`${s.anio} versal cifras`}>
                  {f.anio === "TODO" ? "—" : f.anio}
                </span>
                <span className={s.formacionTexto}>{f.texto}</span>
              </li>
            ))}
          </ul>
        </section>

        <Bloque
          titulo="Exposiciones individuales"
          entradas={c.individuales}
          vacioTexto="Sin datos cargados"
        />
        <Bloque
          titulo="Exposiciones colectivas"
          entradas={c.colectivas}
          vacioTexto="Sin datos cargados"
        />
        <Bloque
          titulo="Premios y distinciones"
          entradas={c.premios}
          vacioTexto="Sin datos aportados"
        />
        <Bloque
          titulo="Colecciones"
          entradas={c.colecciones}
          vacioTexto="Sin datos aportados"
        />
      </div>
    </Registro>
  );
}
