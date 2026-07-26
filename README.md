# Liliana Donato — sitio de obra

Portfolio de Liliana Donato, pintora argentina. Next.js 15 (App Router), TypeScript
estricto, CSS Modules y contenido en markdown. Todo estático, sin base de datos.

## Concepto

La obra vive en dos registros opuestos y el sitio los hace convivir:

- **Materia** — óleos de empaste grueso trabajados con espátula, y una serie de
  ensamblajes con vidrios de colores incrustados en el bastidor.
- **Aire** — acuarelas de lavados transparentes, con un sub-registro monocromo que
  funciona como silencio dentro del conjunto.

La tensión se resuelve **por sustrato**: en aire el fondo es papel de algodón; en
materia se invierte a penumbra y el grano pasa a ser lino. El cambio de material se
percibe antes de entenderse. Entre ambos hay dos bisagras: *Paisaje urbano* (óleo que
toma prestada la luz de la acuarela) y *Sobre bastidor* (acuarela que gana cuerpo).

La saturación pura aparece **una sola vez** en todo el recorrido: el vidrio de la serie
*Ventanas*, sobre fondo casi negro.

## Correr el proyecto

```bash
npm install
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # tsc estricto
```

## Agregar una obra

Poner la imagen en `public/obras/` y escribir un markdown en `content/obras/`. El slug
sale del nombre del archivo. Nada más:

```markdown
---
titulo: "Título con acentos"
serie: "botanica-en-agua"
anio: "2019"
tecnica: "Acuarela sobre papel"
medidas: "30 × 40 cm"
imagen: "/obras/mi-obra.jpg"
proporcion: 0.75
orden: 9
registro: "aire"
alt: "Descripción real de lo que se ve en la pintura."
---
```

Campos opcionales: `imagenDetalle` + `proporcionDetalle` (activa el módulo de textura a
sangre), `destacada`, `subregistro` (`color` | `monocromo`), `formato`
(`rectangular` | `tondo`), `coleccionPrivada`, `requiereCorreccion` + `notaCorreccion`,
`nota`.

Todo se valida con Zod en build: si falta un campo o el tipo no corresponde, el build
falla con el archivo y el campo señalados. `TODO` es un valor válido y marca un dato que
la artista todavía no aportó — la ficha lo muestra como `—`, nunca inventado.

La estructura permite enchufar un CMS después sin rehacer nada: sólo hay que cambiar el
lector de `src/lib/contenido.ts`; los esquemas y las páginas quedan igual.

## Estructura

```
content/          obras, series, atelier, textos, sitio (bio, CV, contacto)
public/obras/     reproducciones + crops de detalle
public/atelier/   fotos de taller (nunca mezcladas con el registro de obra)
public/textura/   grano de papel, grano de lino y las dos máscaras de lavado
scripts/          procesamiento de las fotos crudas y generación de texturas
src/lib/          lectura de contenido y esquemas Zod
src/components/   Lavado, LaminaObra, FichaTecnica, Registro, Profundidad…
```

Los scripts de `scripts/` necesitan la carpeta `contenido/` con el material crudo, que
**no está versionada** (~134 MB de fotos de cámara). `texturas.py` sí es autónomo.

## Decisiones que conviene no revertir sin pensarlo

- **Los tondos no se recortan a círculo.** Son círculos pintados sobre papel
  rectangular: el papel crudo alrededor es parte de la obra.
- **El layout no asume proporciones.** El ancho de cada pieza sale de su proporción
  real; hay obras de 0.56 a 1.39.
- **Las fotos de taller nunca entran en la grilla de obra.** Van a su propia colección y
  se intercalan como respiro, máximo una cada dos series.
- **Las texturas son PNG pre-generados, no filtros SVG en vivo.** `feTurbulence` a
  pantalla completa se rasteriza en cada pintado y en móvil cuesta caro.
- **El lavado se retira al terminar.** La máscara de revelado desaparece cuando la
  animación termina: ningún efecto puede quedarse recortando una pintura.
- **Sin JS, la obra se ve entera.** La máscara se monta sólo en el cliente y sólo si va
  a animar.

## Estado de las mediciones

Medido con Lighthouse sobre `next start` local, mediana de 3 corridas:

- **Desktop:** 100 / 100 / 100 / 100 en las cuatro categorías.
- **Móvil:** rendimiento 92–95; accesibilidad, buenas prácticas y SEO en 100.
- Contraste AA verificado sobre el render real de 11 rutas: sin fallas.
- Sin desborde horizontal de 320 px a 2560 px.

El techo de rendimiento en móvil es que el LCP siempre es una pintura a media pantalla.
Falta volver a medir en producción, donde el CDN cambia el panorama.

## Pendiente de la artista

Datos que faltan y están marcados como `TODO` en el contenido:

1. **Los años de las obras.** Ninguna de las 32 los tiene. Es el dato faltante más
   importante: sin años no hay línea de tiempo ni orden curatorial.
2. **La foto de *Ventana 1*.** El archivo con ese nombre contiene en realidad una
   segunda toma de *Los colorados*. Falta la mitad de la serie de ensamblajes.
3. **Medidas con un dígito faltante:** *Cálido-Frío* y *Flores pálidas* (`28x4`),
   *Flores rosas* (`45x5`). Y faltan las de *Calle Norteña*, *Ventana 1*, *Ventana 2* y
   *Margaritas celestes*.
4. **Contacto:** el email. El Instagram (`@lilidonato.arte`) y el teléfono se leyeron de
   una tarjeta fotografiada y hay que confirmarlos.
5. **Textos críticos.** `Textos.docx` llegó vacío; la sección hoy sólo tiene el texto de
   la artista.
6. **Premios y colecciones.** No hay datos en el material.

## Fotografías que necesitan rehacerse

- ***Aire de primavera*** — la toma corta la obra por los cuatro lados.
- ***Central Park* (la escalera)** — única toma disponible a 638 × 800 px.
- ***Cálido-Frío*, la pieza fría** — el marco de la otra pieza tapa parte del papel.
- ***Serenidad*** y ***Flores rosas*** — verificar contra la obra si la dominante sepia
  y la amarilla son decisión de la artista o de la luz. No se tocaron.

Las obras afectadas llevan `requiereCorreccion: true` y su nota, que se muestra en la
página de la obra bajo «Sobre esta reproducción».
