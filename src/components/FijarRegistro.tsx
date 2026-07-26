/**
 * Componente de servidor: escribe el sustrato en <html> durante el parseo del
 * documento, antes del primer pintado. Las páginas de un solo registro —una
 * obra, una serie— no pueden esperar a la hidratación para saber si están en
 * papel o en penumbra: la barra superior quedaría un cuadro en el registro
 * anterior y se vería el salto.
 */
export function FijarRegistro({
  registro,
  subregistro,
  serie,
}: {
  registro: "materia" | "aire";
  subregistro?: "color" | "monocromo";
  serie?: string;
}) {
  const datos = JSON.stringify({ registro, subregistro: subregistro ?? "", serie: serie ?? "" });
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var d=${datos},e=document.documentElement;e.dataset.registro=d.registro;if(d.subregistro){e.dataset.subregistro=d.subregistro}else{delete e.dataset.subregistro}if(d.serie){e.dataset.serie=d.serie}else{delete e.dataset.serie}})();`,
      }}
    />
  );
}
