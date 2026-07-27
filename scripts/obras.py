"""Prepara las obras para el sitio: recorta, publica y arma la ficha.

  python scripts/obras.py

Dos problemas del material de origen:

1. Varias fotos no son reproducciones sino fotos de contexto: la obra sobre
   una mesa, a veces enmarcada, con frascos y pinceles al lado. Publicarlas
   asi seria mostrar la mesa. Se recortan.
2. La ficha tecnica (titulo, tecnica, medidas, si esta vendida) vive en el
   nombre del archivo, con erratas. Se parsea y se reporta lo dudoso.

El recorte se detecta por TEXTURA y no por bordes: una pintura tiene varianza
local alta en toda su superficie, mientras que la mesa, el passepartout y el
marco son lisos. Un detector de bordes, en cambio, encuentra el marco antes
que el cuadro y termina recortando por afuera.

Donde el automatico falla hay una caja a mano en RECORTES. La deteccion
automatica se equivoca sobre todo cuando la obra esta en angulo, que ademas es
un problema que ningun recorte arregla.
"""

import glob
import json
import os
import re
import unicodedata

import numpy as np
from PIL import Image
from scipy.ndimage import (binary_closing, binary_fill_holes, label,
                           uniform_filter)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, "public", "obras")

SECCIONES = {
    "acuarelas": "Obras/Acuarelas",
    "oleos": "Obras/Óleos",
    "series": "Series",
}

LADO_MAX = 1600
CALIDAD = 84

# Cajas a mano, en fraccion del ancho y del alto de la foto: (x0, y0, x1, y1).
#
# Son las que el detector por textura no resuelve, y son casi todas obras
# enmarcadas: la veta de la madera y las tarjetas apoyadas al lado tienen
# tanta varianza local como la pintura, asi que la mancha detectada se come la
# mesa entera. Aca se entra al cuadro por dentro del marco y del passepartout.
RECORTES: dict[str, tuple[float, float, float, float]] = {
    "Cálido-Frio, acuarelas, cada una de 28x4cm.jpg": (0.13, 0.02, 0.81, 0.53),
    "_Flores de atardecer_ Acuarela,28x34cm.jpg": (0.305, 0.16, 0.73, 0.70),
    "_Nueva York_, acuarela, 20x32 cm, vendida.jpg": (0.16, 0.09, 0.87, 0.80),
    "_Primaveral_acuarela,30x40cm, vendida.jpg": (0.14, 0.11, 0.64, 0.87),
    "_Paisaje campestre, óleo, 30x25cm.jpg": (0.215, 0.315, 0.795, 0.775),
    # el marco labrado es parte de la pieza; lo que sobra es el vidrio suelto
    # sobre la mesa, a la derecha
    "_Ventana 2_ óleo y vitraux.jpg": (0.025, 0.02, 0.80, 0.975),
    "Serie_ _Paisaje Urbano_, óleo,30x30cm.jpg": (0.155, 0.175, 0.855, 0.865),
    "Serie_Paisaje Urbano_ óleo, 0x30cm.jpg": (0.13, 0.13, 0.85, 0.88),
    "Serie_Paisaje Urbano_ óleo, 30x30cm.jpg": (0.10, 0.10, 0.90, 0.86),
    "Serie_Paisaje urbano, óleo,30x30cm.jpg": (0.12, 0.12, 0.86, 0.90),
}

# Fotos que no sirven aunque se recorten, y por que.
A_REFOTOGRAFIAR = {
    "Cálido-Frio, acuarelas, cada una de 28x4cm.jpg":
        "son dos obras en una sola foto, superpuestas y en angulo; se publica "
        "solo la de arriba",
}

# Obras que no entran al sitio, con el motivo.
DESCARTADAS: dict[str, str] = {}


def sin_tildes(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s)
                   if unicodedata.category(c) != "Mn")


def slug(s: str) -> str:
    s = sin_tildes(s).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def ficha(archivo: str, seccion: str) -> dict:
    """Titulo, tecnica, medidas y estado, sacados del nombre del archivo."""
    t = os.path.splitext(archivo)[0]

    vendida = bool(re.search(r"vendid[oa]", t, re.I))
    t = re.sub(r"[,. ]*vendid[oa][,. ]*", " ", t, flags=re.I)

    medidas = None
    # el "cm" puede aparecer tambien entre las dos cifras: "26,5cmx37,5cm"
    m = re.search(
        r"(\d+(?:[,.]\d+)?)\s*(?:cm)?\s*[xX]\s*(\d+(?:[,.]\d+)?)\s*cm", t)
    if m:
        medidas = "%s x %s cm" % (m.group(1).replace(".", ","),
                                  m.group(2).replace(".", ","))
        t = t[:m.start()] + " " + t[m.end():]
    t = re.sub(r"\bcada una de\b", " ", t, flags=re.I)

    # los patrones aceptan la vocal con y sin tilde para poder buscar sobre el
    # texto ORIGINAL: normalizarlo antes le comeria los acentos al titulo
    tecnica = None
    for patron, nombre in (
        (r"[oó]leo\s*y\s*vitraux", "Óleo y vitraux"),
        (r"acuarela\s*en\s*bastidor", "Acuarela en bastidor"),
        (r"acuarelas?", "Acuarela"),
        (r"[oó]leo", "Óleo"),
    ):
        if re.search(patron, t, re.I):
            tecnica = nombre
            t = re.sub(patron, " ", t, flags=re.I)
            break
    if tecnica is None:
        tecnica = "Óleo" if seccion in ("oleos", "series") else "Acuarela"

    # los guiones bajos primero: en "Serie_ _Paisaje" el \b de la palabra no
    # cierra contra el guion bajo, que para una regex es caracter de palabra
    t = re.sub(r"[\s_]+", " ", t)
    t = re.sub(r"\bserie\b", " ", t, flags=re.I)
    titulo = re.sub(r"[\s,.\-]+", " ", t).strip(" ,.-")
    titulo = re.sub(r"\(\d+\)", "", titulo).strip()
    if titulo:
        titulo = titulo[0].upper() + titulo[1:]

    return {"titulo": titulo, "tecnica": tecnica, "medidas": medidas,
            "vendida": vendida}


def caja_por_textura(im: Image.Image, umbral: float = 0.16) -> tuple:
    """Bounding box de la zona pintada.

    La varianza local separa pintura de mesa: el pigmento tiene grano y
    dibujo en toda su superficie, la madera y el passepartout no. Se mide a
    resolucion baja porque lo que interesa es la mancha, no el detalle.
    """
    chico = im.convert("L")
    chico.thumbnail((480, 480), Image.LANCZOS)
    a = np.asarray(chico, np.float32) / 255.0

    v = max(7, (int(min(a.shape) * 0.035) | 1))
    media = uniform_filter(a, size=v)
    varianza = np.maximum(uniform_filter(a * a, size=v) - media * media, 0)
    textura = np.sqrt(varianza)
    textura /= max(textura.max(), 1e-6)

    m = textura > umbral
    m = binary_closing(m, structure=np.ones((9, 9)))
    m = binary_fill_holes(m)

    etiquetas, n = label(m)
    if n == 0:
        return (0.0, 0.0, 1.0, 1.0)
    areas = np.bincount(etiquetas.ravel())
    areas[0] = 0
    ys, xs = np.where(etiquetas == int(areas.argmax()))
    if len(xs) == 0:
        return (0.0, 0.0, 1.0, 1.0)

    h, w = a.shape
    return (xs.min() / w, ys.min() / h, (xs.max() + 1) / w, (ys.max() + 1) / h)


def recortar(im: Image.Image, caja: tuple, aire: float = 0.006) -> Image.Image:
    x0, y0, x1, y1 = caja
    x0 = max(0.0, x0 - aire)
    y0 = max(0.0, y0 - aire)
    x1 = min(1.0, x1 + aire)
    y1 = min(1.0, y1 + aire)
    return im.crop((round(x0 * im.width), round(y0 * im.height),
                    round(x1 * im.width), round(y1 * im.height)))


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)
    catalogo = []
    dudosas = []

    for seccion, carpeta in SECCIONES.items():
        rutas = sorted(glob.glob(os.path.join(RAIZ, "contenido", carpeta,
                                              "*.jpg")))
        for ruta in rutas:
            archivo = os.path.basename(ruta)
            if archivo in DESCARTADAS:
                continue

            datos = ficha(archivo, seccion)
            nombre = slug(datos["titulo"]) or slug(os.path.splitext(archivo)[0])
            if any(o["slug"] == nombre for o in catalogo):
                nombre = "%s-%d" % (nombre, sum(
                    1 for o in catalogo if o["slug"].startswith(nombre)) + 1)

            im = Image.open(ruta).convert("RGB")
            antes = (im.width, im.height)

            a_mano = archivo in RECORTES
            caja = RECORTES[archivo] if a_mano else caja_por_textura(im)
            # la caja a mano ya viene ajustada; darle aire volveria a meter marco
            im = recortar(im, caja, aire=0.0 if a_mano else 0.006)

            recorto = (im.width, im.height) != antes
            if im.width > LADO_MAX or im.height > LADO_MAX:
                e = LADO_MAX / max(im.width, im.height)
                im = im.resize((round(im.width * e), round(im.height * e)),
                               Image.LANCZOS)

            im.save(os.path.join(SALIDA, nombre + ".webp"), quality=CALIDAD,
                    method=6)

            catalogo.append({
                "slug": nombre,
                "seccion": seccion,
                "ancho": im.width,
                "alto": im.height,
                **datos,
            })

            if datos["medidas"] is None:
                dudosas.append((archivo, "sin medidas"))
            else:
                a, b = [float(x.replace(",", ".")) for x in
                        re.findall(r"[\d,]+", datos["medidas"])]
                if a < 8 or b < 8 or max(a, b) / min(a, b) > 3:
                    dudosas.append((archivo, "medidas raras: %s"
                                    % datos["medidas"]))

            print("%-9s %-26s %-22s %-14s %s%s"
                  % (seccion, nombre[:26], datos["titulo"][:22],
                     datos["medidas"] or "-",
                     "VENDIDA " if datos["vendida"] else "",
                     "recortada" if recorto else ""))

    # Cuatro obras llamadas "Paisaje Urbano" en la misma pagina no se pueden
    # nombrar entre si. Se numeran, que es como se cataloga una serie.
    # se agrupa sin distinguir mayusculas: en los archivos conviven "Paisaje
    # Urbano" y "Paisaje urbano", y son la misma serie
    ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]
    cuenta: dict[tuple[str, str], int] = {}
    canonico: dict[tuple[str, str], str] = {}
    for o in catalogo:
        clave = (o["seccion"], o["titulo"].lower())
        cuenta[clave] = cuenta.get(clave, 0) + 1
        canonico.setdefault(clave, o["titulo"])
    visto: dict[tuple[str, str], int] = {}
    for o in catalogo:
        clave = (o["seccion"], o["titulo"].lower())
        if cuenta[clave] > 1:
            visto[clave] = visto.get(clave, 0) + 1
            o["titulo"] = "%s %s" % (canonico[clave], ROMANOS[visto[clave] - 1])

    catalogo.sort(key=lambda o: (o["seccion"], o["titulo"]))
    with open(os.path.join(RAIZ, "lib", "obras.json"), "w",
              encoding="utf-8") as f:
        json.dump(catalogo, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("\n%d obras" % len(catalogo))
    for seccion in SECCIONES:
        print("  %-10s %d" % (seccion,
                              sum(1 for o in catalogo
                                  if o["seccion"] == seccion)))
    if dudosas:
        print("\nficha a confirmar con la pintora:")
        for archivo, motivo in dudosas:
            print("  %-52s %s" % (archivo[:52], motivo))

    if A_REFOTOGRAFIAR:
        print("\nfotos que convendria rehacer:")
        for archivo, motivo in A_REFOTOGRAFIAR.items():
            print("  %s\n    %s" % (archivo, motivo))


if __name__ == "__main__":
    main()
