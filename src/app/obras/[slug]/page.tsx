import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obra, obras, vecinas } from "@/lib/contenido";
import { Lavado } from "@/components/Lavado";
import { LaminaObra } from "@/components/LaminaObra";
import { EnlaceObra } from "@/components/EnlaceObra";
import { FichaTecnica } from "@/components/FichaTecnica";
import { Registro } from "@/components/Registro";
import { FijarRegistro } from "@/components/FijarRegistro";
import s from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return obras().map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const o = obra(slug);
  if (!o) return {};
  const alto = Math.round(2400 / o.proporcion);
  const ficha = [o.tecnica, o.medidas !== "TODO" ? o.medidas : null]
    .filter(Boolean)
    .join(", ");
  return {
    title: o.titulo,
    description: `${o.titulo}. ${ficha}. Obra de Liliana Donato.`,
    alternates: { canonical: `/obras/${o.slug}` },
    openGraph: {
      type: "article",
      title: `${o.titulo} · Liliana Donato`,
      description: ficha,
      images: [{ url: o.imagen, width: 2400, height: alto, alt: o.alt }],
    },
  };
}

export default async function PaginaDeObra({ params }: Props) {
  const { slug } = await params;
  const o = obra(slug);
  if (!o) notFound();

  const { anterior, siguiente, serie } = vecinas(slug);
  const esMateria = o.registro === "materia";
  const altoDetalle = o.proporcionDetalle ? Math.round(2000 / o.proporcionDetalle) : 0;

  return (
    <Registro
      registro={o.registro}
      subregistro={o.subregistro}
      serie={serie.slug}
      className={s.pagina}
      fijar
    >
      <FijarRegistro registro={o.registro} subregistro={o.subregistro} serie={serie.slug} />
      <p className={`${s.migas} versal`}>
        <Link href="/obra">Obra</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/series/${serie.slug}`}>{serie.titulo}</Link>
      </p>

      <div className={`${s.presentacion} pliego`}>
        <div className={s.pintura}>
          <Lavado registro={o.registro}>
            <LaminaObra
              obra={o}
              sizes="(max-width: 62rem) 92vw, 62vw"
              prioridad
              nombreDeVista={`obra-${o.slug}`}
            />
          </Lavado>
        </div>

        <div className={s.aparato}>
          <h1 className={`${s.titulo} display`}>{o.titulo}</h1>
          <div className={s.fichaCaja}>
            <FichaTecnica obra={o} serie={serie} />
          </div>
          {o.requiereCorreccion && o.notaCorreccion && (
            <p className={s.aviso}>
              <span className="versal">Sobre esta reproducción — </span>
              {o.notaCorreccion}
            </p>
          )}
        </div>
      </div>

      {/* Módulo de textura: sólo cuando el relieve lo justifica. */}
      {o.imagenDetalle && o.proporcionDetalle && (
        <div className={s.textura}>
          <p className={`${s.texturaRotulo} versal`}>
            <span>Detalle</span>
            <span>{esMateria ? "Empaste" : "Superficie"}</span>
          </p>
          <Lavado registro={o.registro} invertido>
            <div
              className={s.texturaImagen}
              style={{ "--proporcion": String(o.proporcionDetalle) } as React.CSSProperties}
            >
              <Image
                src={o.imagenDetalle}
                alt={`Detalle de ${o.titulo}: ${o.alt}`}
                width={2000}
                height={altoDetalle}
                sizes="100vw"
                quality={82}
              />
            </div>
          </Lavado>
          <p className={`${s.texturaPie} versal`}>
            {esMateria
              ? "Crop a sangre: la espátula deja el relieve a la vista."
              : "Crop a sangre: la trama del soporte atraviesa el lavado."}
          </p>
        </div>
      )}

      <div className={`${s.paso} pliego`}>
        <div className={s.pasoInterior}>
          {anterior ? (
            <EnlaceObra href={`/obras/${anterior.slug}`} className={s.pasoAtras}>
              <span aria-hidden="true">←</span>
              <span>
                <span className={`${s.pasoRotulo} versal`}>Anterior</span>
                <span className={s.pasoTitulo}>{anterior.titulo}</span>
              </span>
            </EnlaceObra>
          ) : (
            <span className={s.pasoVacio} aria-hidden="true" />
          )}

          <Link href={`/series/${serie.slug}`} className={`${s.pasoCentro} versal`}>
            {serie.titulo}
          </Link>

          {siguiente ? (
            <EnlaceObra href={`/obras/${siguiente.slug}`} className={s.pasoAdelante}>
              <span>
                <span className={`${s.pasoRotulo} versal`}>Siguiente</span>
                <span className={s.pasoTitulo}>{siguiente.titulo}</span>
              </span>
              <span aria-hidden="true">→</span>
            </EnlaceObra>
          ) : (
            <span className={s.pasoVacio} aria-hidden="true" />
          )}
        </div>
      </div>
    </Registro>
  );
}
