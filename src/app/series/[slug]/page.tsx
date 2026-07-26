import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serie, series } from "@/lib/contenido";
import type { Obra, SerieConObras } from "@/lib/schemas";
import { Lavado } from "@/components/Lavado";
import { LaminaObra } from "@/components/LaminaObra";
import { EnlaceObra } from "@/components/EnlaceObra";
import { Profundidad } from "@/components/Profundidad";
import { Registro } from "@/components/Registro";
import { FijarRegistro } from "@/components/FijarRegistro";
import s from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return series().map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const x = serie(slug);
  if (!x) return {};
  return {
    title: x.titulo,
    description: x.cuerpo.slice(0, 180),
    alternates: { canonical: `/series/${x.slug}` },
    openGraph: {
      title: `${x.titulo} · Liliana Donato`,
      description: x.cuerpo.slice(0, 180),
      images: [{ url: x.obraPortada.imagen }],
    },
  };
}

/**
 * Cuando una serie repite el mismo formato cuatro veces o más, el conjunto
 * pide una tira y no una columna. La regla es del material, no del slug.
 */
function esTira(x: SerieConObras): boolean {
  if (x.obras.length < 4) return false;
  const primera = x.obras[0]!.proporcion;
  return x.obras.every((o) => Math.abs(o.proporcion - primera) < 0.04);
}

/** El layout no asume rectángulos: el ancho sale de la proporción real. */
function anchoSegunProporcion(o: Obra): string | undefined {
  if (o.proporcion < 0.85) return s.anchoAlta;
  if (o.proporcion < 1.15) return s.anchoCuadrada;
  return s.anchoApaisada;
}

export default async function PaginaDeSerie({ params }: Props) {
  const { slug } = await params;
  const actual = serie(slug);
  if (!actual) notFound();

  const todas = series();
  const i = todas.findIndex((x) => x.slug === slug);
  const siguiente = todas[i + 1] ?? todas[0];
  const enTira = esTira(actual);

  return (
    <Registro
      registro={actual.registro}
      subregistro={actual.subregistro}
      serie={actual.slug}
      className={s.pagina}
      fijar
    >
      <FijarRegistro
        registro={actual.registro}
        subregistro={actual.subregistro}
        serie={actual.slug}
      />
      <div className={`${s.cabecera} pliego`}>
        <p className={`${s.migas} versal`}>
          <Link href="/obra">Obra</Link>
          <span aria-hidden="true">/</span>
          <span>{actual.registro === "materia" ? "Materia" : "Aire"}</span>
        </p>
        <h1 className={`${s.titulo} display`}>{actual.titulo}</h1>
        <p className={s.introduccion}>{actual.cuerpo}</p>
        <p className={`${s.datos} versal cifras`}>
          <span>
            {actual.obras.length} {actual.obras.length === 1 ? "obra" : "obras"}
          </span>
          <span>{actual.registro === "materia" ? "Materia" : "Aire"}</span>
          {actual.subregistro === "monocromo" && <span>Monocromo</span>}
          {actual.anios !== "TODO" && <span>{actual.anios}</span>}
        </p>
      </div>

      {enTira ? (
        <div className={s.tira}>
          <p className={`${s.tiraAviso} versal`}>
            <span>El mismo formato, cuatro veces</span>
            <span aria-hidden="true">Desplazar →</span>
          </p>
          <ul className={s.tiraPista} role="list" tabIndex={0} aria-label={`Obras de ${actual.titulo}`}>
            {actual.obras.map((o, n) => (
              <li key={o.slug} className={s.tiraPieza}>
                <Lavado
                  registro={actual.registro}
                  invertido={n % 2 === 1}
                  retardoMs={n * 90}
                >
                  <EnlaceObra href={`/obras/${o.slug}`} className={s.piezaEnlace}>
                    <LaminaObra
                      obra={o}
                      sizes="(max-width: 62rem) 72vw, 28vw"
                      prioridad={n === 0}
                      nombreDeVista={`obra-${o.slug}`}
                    />
                    <span className={`${s.tiraPie} versal`}>
                      <span>{o.titulo}</span>
                      <span className="cifras">{o.medidas === "TODO" ? "—" : o.medidas}</span>
                    </span>
                  </EnlaceObra>
                </Lavado>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={s.recorrido}>
          {actual.obras.map((o, n) => (
            /* El subregistro viaja con cada obra: cuando aparecen las grises,
               el fondo y el aire de la sección acompañan ese silencio. */
            <Registro
              key={o.slug}
              registro={o.registro}
              subregistro={o.subregistro}
              serie={actual.slug}
              className={s.pieza}
            >
              <div className={`${s.piezaInterior} pliego`}>
                <div
                  className={[anchoSegunProporcion(o), n % 2 === 1 ? s.desplazada : null]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Profundidad recorrido={actual.registro === "materia" ? -24 : -62}>
                    <Lavado registro={actual.registro} invertido={n % 2 === 1}>
                      <EnlaceObra href={`/obras/${o.slug}`} className={s.piezaEnlace}>
                        <LaminaObra
                          obra={o}
                          sizes="(max-width: 62rem) 92vw, 52vw"
                          prioridad={n === 0}
                          nombreDeVista={`obra-${o.slug}`}
                        />
                      </EnlaceObra>
                    </Lavado>
                  </Profundidad>
                </div>

                <div className={s.pieDePieza}>
                  <h2 className={s.piezaTitulo}>{o.titulo}</h2>
                  <span className={`${s.piezaMeta} versal cifras`}>
                    {o.medidas === "TODO" ? "—" : o.medidas}
                  </span>
                  {o.coleccionPrivada && (
                    <span className={`${s.piezaMeta} versal`}>Colección privada</span>
                  )}
                </div>
              </div>
            </Registro>
          ))}
        </div>
      )}

      {siguiente && siguiente.slug !== actual.slug && (
        <div className={`${s.siguienteSerie} pliego`}>
          <div className={s.siguienteInterior}>
            <span className="versal">Serie siguiente</span>
            <Link href={`/series/${siguiente.slug}`} className={s.siguienteEnlace}>
              {siguiente.titulo} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </Registro>
  );
}
