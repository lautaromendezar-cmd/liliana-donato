"""Publica las fotos de objetos: cuadernos, cartucheras, tazas y demas.

  python scripts/objetos.py

Las fotos son de la propia Liliana, bajadas de WhatsApp en .jfif ("para q vean
que mis obras pasan a objeto"). Al reves que las obras, aca no se recorta
nada: son bodegones armados por ella, y la mesa y los utiles alrededor son
parte de la foto. Solo se pasa a WebP y se deja el manifiesto de medidas que
lee lib/objetos.ts, como en fotos_bio.py.
"""

import glob
import json
import os

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "contenido", "Objetos")
SALIDA = os.path.join(RAIZ, "public", "objetos")

LADO_MAX = 1600
CALIDAD = 84


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)
    medidas = {}

    for ruta in sorted(glob.glob(os.path.join(ORIGEN, "*.jfif"))):
        nombre = os.path.splitext(os.path.basename(ruta))[0]
        im = ImageOps.exif_transpose(Image.open(ruta)).convert("RGB")

        if im.width > LADO_MAX or im.height > LADO_MAX:
            e = LADO_MAX / max(im.width, im.height)
            im = im.resize((round(im.width * e), round(im.height * e)),
                           Image.LANCZOS)

        im.save(os.path.join(SALIDA, nombre + ".webp"), quality=CALIDAD,
                method=6)
        medidas[nombre] = {"ancho": im.width, "alto": im.height}
        print("%-14s %4d x %4d" % (nombre, im.width, im.height))

    with open(os.path.join(RAIZ, "lib", "objetos.json"), "w",
              encoding="utf-8") as f:
        json.dump(medidas, f, indent=2, sort_keys=True)
        f.write("\n")


if __name__ == "__main__":
    main()
