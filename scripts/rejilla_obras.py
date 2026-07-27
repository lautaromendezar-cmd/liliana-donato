"""Hoja con rejilla de coordenadas para leer a mano el encuadre de una obra.

  python scripts/rejilla_obras.py archivo1.jpg archivo2.jpg ...

Las coordenadas van en fraccion del ancho y del alto, que es como las espera
RECORTES en obras.py.
"""

import glob
import os
import sys

from PIL import Image, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPEL = (250, 246, 238)
LADO = 560


def con_rejilla(ruta: str) -> Image.Image:
    im = Image.open(ruta).convert("RGB")
    im.thumbnail((LADO, LADO), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for i in range(1, 10):
        x = im.width * i / 10
        y = im.height * i / 10
        color = (255, 60, 60) if i == 5 else (90, 190, 255)
        d.line([(x, 0), (x, im.height)], fill=color, width=1)
        d.line([(0, y), (im.width, y)], fill=color, width=1)
        d.text((x + 2, 2), ".%d" % i, fill=(255, 60, 60))
        d.text((2, y + 2), ".%d" % i, fill=(255, 60, 60))
    return im


def main() -> None:
    patrones = sys.argv[1:]
    rutas = []
    for p in patrones:
        rutas += glob.glob(os.path.join(RAIZ, "contenido", "**", p),
                           recursive=True)
    if not rutas:
        print("sin coincidencias")
        return

    cols = 3
    filas = (len(rutas) + cols - 1) // cols
    W = cols * LADO + 16 * (cols + 1)
    H = filas * (LADO + 26) + 16 * (filas + 1)
    hoja = Image.new("RGB", (W, H), PAPEL)
    d = ImageDraw.Draw(hoja)

    for k, r in enumerate(sorted(rutas)):
        im = con_rejilla(r)
        cx = 16 + (k % cols) * (LADO + 16)
        cy = 16 + (k // cols) * (LADO + 26 + 16)
        hoja.paste(im, (cx, cy))
        d.text((cx, cy + LADO + 6), os.path.basename(r)[:56], fill=(70, 84, 66))

    destino = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "rejilla-obras.png")
    hoja.save(destino)
    print("%d -> %s" % (len(rutas), destino))


if __name__ == "__main__":
    main()
