"""Recorta y publica las fotos de Liliana para la bio.

Las dos originales son cuadradas, que es el peor formato para maquetar: no
tiene direccion. Se recortan a proporciones con intencion -un retrato vertical
y una escena apaisada- eligiendo el encuadre a mano, porque un recorte
centrado le corta la cara en una y le saca la mano en la otra.

Como en los recortes del hero, las medidas quedan en un manifiesto que lee el
TypeScript en vez de tipearse.
"""

import json
import os

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "contenido", "fotos liliana")
SALIDA = os.path.join(RAIZ, "public", "bio")

CALIDAD = 84

FOTOS = {
    # ella mirando a camara, con su biblioteca de arte detras: es el retrato,
    # el que acompana al "hola, soy Liliana"
    "retrato": dict(
        archivo="liliana en living.jpg",
        # (izq, arriba, der, abajo) sobre el original de 1496x1496
        caja=(370, 330, 1420, 1496),
        ancho=1000,
    ),
    # las manos, el pincel y la acuarela a medio hacer: el oficio
    "pintando": dict(
        archivo="lili foto pintando.jpg",
        caja=(0, 60, 1080, 940),
        ancho=1400,
    ),
}


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)
    medidas = {}

    for nombre, cfg in FOTOS.items():
        ruta = os.path.join(ORIGEN, cfg["archivo"])
        im = ImageOps.exif_transpose(Image.open(ruta)).convert("RGB")
        im = im.crop(cfg["caja"])

        if im.width > cfg["ancho"]:
            alto = round(im.height * cfg["ancho"] / im.width)
            im = im.resize((cfg["ancho"], alto), Image.LANCZOS)

        im.save(os.path.join(SALIDA, nombre + ".webp"), quality=CALIDAD, method=6)
        medidas[nombre] = {"ancho": im.width, "alto": im.height}
        print("%-10s %4d x %4d" % (nombre, im.width, im.height))

    destino = os.path.join(RAIZ, "lib", "fotos.json")
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(medidas, f, indent=2, sort_keys=True)
        f.write("\n")


if __name__ == "__main__":
    main()
