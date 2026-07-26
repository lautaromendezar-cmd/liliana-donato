import Link from "next/link";
import { obra, perfil, series, seriesPorRegistro } from "@/lib/contenido";
import { Lavado } from "@/components/Lavado";
import { LaminaObra } from "@/components/LaminaObra";
import { EnlaceObra } from "@/components/EnlaceObra";
import { Profundidad } from "@/components/Profundidad";
import { Registro } from "@/components/Registro";
import s from "./page.module.css";

export default function Inicio() {
  const p = perfil();
  const apertura = obra(p.obraDeInicio);
  if (!apertura) throw new Error(`La obra de inicio "${p.obraDeInicio}" no existe.`);

  const { materia, aire } = seriesPorRegistro();
  const puertaMateria = materia[0];
  const puertaAire = aire[0];
  const todas = series();

  return (
    <>
      {/* --- portada: nombre, una línea, y la obra revelándose ------------ */}
      <Registro registro="aire">
        <div className={`${s.portada} pliego`}>
          <div className={s.palabra}>
            <h1 className={`${s.nombre} display`}>
              <span>Liliana</span>
              <span className={s.apellido}>Donato</span>
            </h1>
            <p className={s.statement}>{p.statement}</p>
            <p className={s.pieDePortada}>
              <span className="versal versal-ancho">{p.oficio}</span>
              <span className={s.filete} aria-hidden="true">
                ·
              </span>
              <span className="versal">{p.lugar}</span>
            </p>
          </div>

          <div className={s.obraDePortada}>
            <Profundidad recorrido={-70}>
              <Lavado registro="aire">
                <EnlaceObra href={`/obras/${apertura.slug}`} aria-label={`Ver ${apertura.titulo}`}>
                  <LaminaObra
                    obra={apertura}
                    sizes="(max-width: 62rem) 92vw, 40vw"
                    prioridad
                    calidad={62}
                    nombreDeVista={`obra-${apertura.slug}`}
                  />
                </EnlaceObra>
              </Lavado>
            </Profundidad>
            <p className={`${s.creditoPortada} versal`}>
              <span>{apertura.titulo}</span>
              <span>{apertura.tecnica}</span>
            </p>
          </div>
        </div>
      </Registro>

      {/* --- la tesis: dos registros, dos sustratos ----------------------- */}
      {puertaMateria && (
        <Registro registro="materia" serie={puertaMateria.slug} className={s.tesis}>
          <div className={`${s.tesisInterior} pliego`}>
            <div className={s.tesisObraIzquierda}>
              <Profundidad recorrido={-28}>
                <Lavado registro="materia" invertido>
                  <LaminaObra
                    obra={puertaMateria.obraPortada}
                    sizes="(max-width: 62rem) 92vw, 48vw"
                  />
                </Lavado>
              </Profundidad>
            </div>
            <div className={s.tesisTextoDerecha}>
              <span className={`${s.rotulo} versal versal-ancho`}>Registro I</span>
              <h2 className={`${s.tesisTitulo} display`}>Materia</h2>
              <p className={s.tesisCuerpo}>
                Óleo cargado, trabajado con espátula. El pigmento va entero y el relieve
                se ve a contraluz. En una serie el vidrio de color queda incrustado en el
                bastidor y la pintura se vuelve objeto.
              </p>
              <Link href="/obra#materia" className={`${s.verTodo} versal`}>
                Ver las series <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </Registro>
      )}

      {puertaAire && (
        <Registro registro="aire" className={s.tesis}>
          <div className={`${s.tesisInterior} pliego`}>
            <div className={s.tesisTexto}>
              <span className={`${s.rotulo} versal versal-ancho`}>Registro II</span>
              <h2 className={`${s.tesisTitulo} display`}>Aire</h2>
              <p className={s.tesisCuerpo}>
                Acuarela de lavados transparentes: el blanco del papel trabaja como luz y
                el gesto queda suelto. Hacia el final del recorrido el color se retira y
                queda el silencio de los grises.
              </p>
              <Link href="/obra#aire" className={`${s.verTodo} versal`}>
                Ver las series <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className={s.tesisObra}>
              <Profundidad recorrido={-70}>
                <Lavado registro="aire">
                  <LaminaObra
                    obra={puertaAire.obraPortada}
                    sizes="(max-width: 62rem) 92vw, 48vw"
                  />
                </Lavado>
              </Profundidad>
            </div>
          </div>
        </Registro>
      )}

      {/* --- índice de series -------------------------------------------- */}
      <Registro registro="aire">
        <div className={`${s.indice} pliego`}>
          <div className={s.indiceCabeza}>
            <h2 className="versal versal-ancho">Índice de series</h2>
            <span className="versal cifras">{todas.length} series</span>
          </div>

          <ul className={s.indiceLista}>
            {todas.map((serie, i) => (
              <li key={serie.slug}>
                <Link href={`/series/${serie.slug}`} className={s.indiceFila}>
                  <span className={`${s.indiceNumero} versal cifras`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={s.indiceTitulo}>{serie.titulo}</span>
                  <span className={`${s.indiceRegistro} versal`}>
                    {serie.registro === "materia" ? "Materia" : "Aire"}
                  </span>
                  <span className={`${s.indiceCantidad} versal cifras`}>
                    {String(serie.obras.length).padStart(2, "0")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link href="/obra" className={`${s.verTodo} versal`}>
            Recorrer la obra <span aria-hidden="true">→</span>
          </Link>
        </div>
      </Registro>
    </>
  );
}
