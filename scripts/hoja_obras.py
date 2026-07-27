"""Hoja de contactos de las obras, para ver todo el material de un vistazo.

  python scripts/hoja_obras.py [origen] [destino]

Sin argumentos arma la hoja de los originales tal como los mando la pintora.
"""

import glob
import os
import sys

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPEL = (250, 246, 238)
TINTA = (70, 84, 66)

CARPETAS = ["Obras/Acuarelas", "Obras/Óleos", "Series"]


def hoja(entradas, ruta, cols=5, celda=340, margen=18, rotulo=34):
    filas = (len(entradas) + cols - 1) // cols
    W = cols * celda + margen * (cols + 1)
    H = filas * (celda + rotulo) + margen * (filas + 1)
    lienzo = Image.new("RGB", (W, H), PAPEL)
    d = ImageDraw.Draw(lienzo)

    for k, (nombre, im) in enumerate(entradas):
        cx = margen + (k % cols) * (celda + margen)
        cy = margen + (k // cols) * (celda + rotulo + margen)
        d.rectangle([cx, cy, cx + celda, cy + celda], outline=(226, 216, 198))
        e = min(celda / im.width, celda / im.height)
        mini = im.resize((max(1, round(im.width * e)),
                          max(1, round(im.height * e))), Image.LANCZOS)
        lienzo.paste(mini, (cx + (celda - mini.width) // 2,
                            cy + (celda - mini.height) // 2))
        d.text((cx + 2, cy + celda + 6), "%02d  %s" % (k + 1, nombre[:44]),
               fill=TINTA)
        d.text((cx + 2, cy + celda + 18),
               "     %dx%d  ar %.2f" % (im.width, im.height,
                                        im.width / im.height), fill=TINTA)
    lienzo.save(ruta)
    return ruta


def main() -> None:
    # "recortadas" arma la hoja de lo que ya se publica en public/obras
    recortadas = len(sys.argv) > 1 and sys.argv[1] == "recortadas"
    entradas = []

    if recortadas:
        import json
        with open(os.path.join(RAIZ, "lib", "obras.json"), encoding="utf-8") as f:
            catalogo = json.load(f)
        for o in catalogo:
            im = Image.open(os.path.join(RAIZ, "public", "obras",
                                         o["slug"] + ".webp"))
            im.thumbnail((700, 700), Image.LANCZOS)
            rotulo = "%s  %s%s" % (o["titulo"], o["medidas"] or "SIN MEDIDAS",
                                   "  VENDIDA" if o["vendida"] else "")
            entradas.append((rotulo, im.convert("RGB")))
        destino = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "hoja-obras-recortadas.png")
    else:
        for carpeta in CARPETAS:
            for r in sorted(glob.glob(os.path.join(RAIZ, "contenido", carpeta,
                                                   "*.jpg"))):
                im = Image.open(r)
                im.thumbnail((700, 700), Image.LANCZOS)
                entradas.append((os.path.basename(r), im.convert("RGB")))
        destino = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               "hoja-obras.png")

    print("%d obras -> %s" % (len(entradas), hoja(entradas, destino)))


if __name__ == "__main__":
    main()
