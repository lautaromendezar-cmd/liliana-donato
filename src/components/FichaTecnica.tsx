import type { Obra, SerieConObras } from "@/lib/schemas";
import s from "./FichaTecnica.module.css";

const ES_PENDIENTE = "TODO";

function Valor({ children }: { children: string }) {
  if (children === ES_PENDIENTE) {
    return (
      <dd className={`${s.valor} ${s.pendiente}`}>
        <span aria-hidden="true">—</span>
        <span className="solo-lectores">dato no disponible</span>
      </dd>
    );
  }
  return <dd className={`${s.valor} cifras`}>{children}</dd>;
}

function Linea({ clave, valor }: { clave: string; valor: string }) {
  return (
    <div className={s.linea}>
      <dt className={`${s.clave} versal`}>{clave}</dt>
      <Valor>{valor}</Valor>
    </div>
  );
}

export function FichaTecnica({ obra, serie }: { obra: Obra; serie: SerieConObras }) {
  return (
    <div>
      <dl className={s.ficha}>
        <Linea clave="Serie" valor={serie.titulo} />
        <Linea clave="Año" valor={obra.anio} />
        <Linea clave="Técnica" valor={obra.tecnica} />
        <Linea clave="Medidas" valor={obra.medidas} />
        {obra.formato === "tondo" && <Linea clave="Formato" valor="Tondo sobre papel" />}
        {obra.coleccionPrivada && <Linea clave="Situación" valor="Colección privada" />}
      </dl>
      {obra.nota && <p className={s.nota}>{obra.nota}</p>}
    </div>
  );
}
