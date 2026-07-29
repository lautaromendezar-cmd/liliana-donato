"""Publica las fotos de los libros donde aparece su obra, para la bio.

  python scripts/publicaciones.py

Tres fotos de WhatsApp: los tres libros de Ediciones Institucionales juntos, y
dos paginas interiores con obras suyas ("Barrio gotico" y "La espera"). Se
renombran a lo que muestran, se pasan a WebP sin recortar y las medidas quedan
en un manifiesto que lee lib/bio.ts, como en fotos_bio.py.
"""

import json
import os

from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "contenido", "Publicaciones")
SALIDA = os.path.join(RAIZ, "public", "bio")

LADO_MAX = 1600
CALIDAD = 84

FOTOS = {
    # pagina de "Una Vision Actual del Arte Argentino" con "Barrio gotico"
    "publicacion-barrio-gotico": "publicacion-1.jfif",
    # pagina con "La espera" (oleo, 40 x 30 cm), del mismo sello editorial
    "publicacion-la-espera": "publicacion-2.jfif",
    # los tres libros juntos, apaisada: es la que encabeza el bloque
    "publicacion-libros": "publicacion-3.jfif",
}


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)
    medidas = {}

    for nombre, archivo in FOTOS.items():
        ruta = os.path.join(ORIGEN, archivo)
        im = ImageOps.exif_transpose(Image.open(ruta)).convert("RGB")

        if im.width > LADO_MAX or im.height > LADO_MAX:
            e = LADO_MAX / max(im.width, im.height)
            im = im.resize((round(im.width * e), round(im.height * e)),
                           Image.LANCZOS)

        im.save(os.path.join(SALIDA, nombre + ".webp"), quality=CALIDAD,
                method=6)
        medidas[nombre] = {"ancho": im.width, "alto": im.height}
        print("%-26s %4d x %4d" % (nombre, im.width, im.height))

    with open(os.path.join(RAIZ, "lib", "publicaciones.json"), "w",
              encoding="utf-8") as f:
        json.dump(medidas, f, indent=2, sort_keys=True)
        f.write("\n")


if __name__ == "__main__":
    main()
