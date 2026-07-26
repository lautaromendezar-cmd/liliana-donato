import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { recorrido } from "@/lib/contenido";
import { Lavado } from "@/components/Lavado";
import { LaminaObra } from "@/components/LaminaObra";
import { Profundidad } from "@/components/Profundidad";
import { Registro } from "@/components/Registro";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Obra",
  description:
    "Las series de Liliana Donato agrupadas en dos registros: materia —óleo de empaste y vitraux— y aire —acuarela de lavados transparentes.",
  alternates: { canonical: "/obra" },
};

export default function IndiceDeObra() {
  const secuencia = recorrido();
  let cuenta = 0;
  let registroAnterior: "materia" | "aire" | null = null;

  return (
    <>
      <Registro registro="aire">
        <div className={`${s.cabecera} pliego`}>
          <h1 className={`${s.titulo} display`}>La obra</h1>
          <p className={s.entrada}>
            Dos registros opuestos que conviven. El recorrido baja del óleo cargado a la
            acuarela y termina en los grises; entre serie y serie se cuela el taller.
          </p>
        </div>
      </Registro>

      {secuencia.map((tramo) => {
        if (tramo.tipo === "atelier") {
          const { foto } = tramo;
          const alto = Math.round(2400 / foto.proporcion);
          return (
            <Registro key={`atelier-${foto.slug}`} registro="aire" className={s.atelier}>
              <Lavado registro="aire" className={s.atelierSangrado}>
                <div
                  className={s.atelierImagen}
                  style={{ "--proporcion": String(foto.proporcion) } as React.CSSProperties}
                >
                  <Image
                    src={foto.imagen}
                    alt={foto.alt}
                    width={2400}
                    height={alto}
                    sizes="100vw"
                    quality={70}
                  />
                </div>
              </Lavado>
              <p className={`${s.atelierPie} versal`}>
                <span>{foto.titulo}</span>
                <span>Taller</span>
              </p>
            </Registro>
          );
        }

        const { serie } = tramo;
        cuenta += 1;
        const impar = cuenta % 2 === 1;
        const esMateria = serie.registro === "materia";
        const abreRegistro = registroAnterior !== serie.registro;
        registroAnterior = serie.registro;

        return (
          <div key={serie.slug}>
            {abreRegistro && (
              <Registro
                registro={serie.registro}
                serie={esMateria ? serie.slug : undefined}
                className={s.corte}
              >
                <div id={serie.registro} className={`${s.corteInterior} pliego`}>
                  <h2 className={`${s.corteRotulo} display`}>
                    {esMateria ? "Materia" : "Aire"}
                  </h2>
                  <p className={s.corteNota}>
                    {esMateria
                      ? "Pigmento entero, superficie con relieve, composición apretada."
                      : "Lavados transparentes, papel respirando, márgenes largos."}
                  </p>
                </div>
              </Registro>
            )}

            <Registro
              registro={serie.registro}
              subregistro={serie.subregistro}
              serie={serie.slug}
              className={s.capitulo}
            >
              <div className={`${s.capituloInterior} pliego`}>
                <div className={impar ? s.imagenIzquierda : s.imagenDerecha}>
                  <Profundidad recorrido={esMateria ? -26 : -68}>
                    <Lavado registro={serie.registro} invertido={!impar}>
                      <Link
                        href={`/series/${serie.slug}`}
                        aria-label={`Ver la serie ${serie.titulo}`}
                      >
                        <LaminaObra
                          obra={serie.obraPortada}
                          sizes="(max-width: 62rem) 92vw, 56vw"
                          prioridad={cuenta === 1}
                        />
                      </Link>
                    </Lavado>
                  </Profundidad>
                </div>

                <div className={impar ? s.textoDerecha : s.textoIzquierda}>
                  <span className={`${s.numero} versal cifras`}>
                    Serie {String(cuenta).padStart(2, "0")}
                  </span>
                  <h3 className={`${s.nombreSerie} display`}>{serie.titulo}</h3>
                  <p className={s.cuerpo}>{serie.cuerpo}</p>
                  <p className={`${s.meta} versal cifras`}>
                    <span>
                      {serie.obras.length} {serie.obras.length === 1 ? "obra" : "obras"}
                    </span>
                    <span>{esMateria ? "Materia" : "Aire"}</span>
                    {serie.subregistro === "monocromo" && <span>Monocromo</span>}
                  </p>
                  <Link href={`/series/${serie.slug}`} className={`${s.entrar} versal`}>
                    Entrar en la serie <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </Registro>
          </div>
        );
      })}
    </>
  );
}
