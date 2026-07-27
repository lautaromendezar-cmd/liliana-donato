"""Recorta los elementos del hero de cerezo.jpg a PNG con alfa gradual.

Uso:  python extraer_hero.py [carpeta_salida]

Las ramas se separan con regiones dibujadas a mano, porque en la pintura son
un solo arbol y ninguna deteccion automatica las va a partir por donde
conviene a la composicion. Los cortes caen siempre donde la rama es fina y se
difuminan largo: una acuarela que se desvanece no se lee como un tijeretazo.

Los petalos sueltos si salen solos: son las componentes chicas y magentas que
no tocan el arbol.
"""

import json
import os
import pickle
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import (binary_closing, find_objects, gaussian_filter,
                           label)

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from matte import (PAPEL, _disco, estimar_papel, rgba, suelo_suave,
                   transmitancia)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(RAIZ, "hero", "cerezo.jpg")

# ---------------------------------------------------------------------------
# regiones, en pixeles de la imagen original (4194 x 3053)
# ---------------------------------------------------------------------------

REGIONES = {
    # tronco curvo entero, con su rama izquierda florecida, las hojas de la
    # base y la rama del medio. Se corta justo despues de la horquilla.
    "rama-principal": dict(pluma=110, poly=[
        (430, 3053), (430, 1250), (560, 780), (720, 380), (940, 190),
        (1240, 250), (1470, 520), (1610, 660), (1700, 980), (1770, 1400),
        (2100, 1440), (2480, 1500), (2560, 1780), (2200, 1930),
        (1850, 2020), (1700, 2350), (1700, 3053),
    ]),
    # la rama que baja en curva hacia la derecha y termina en el racimo
    # grande del borde. Entra por el costado derecho.
    "rama-derecha": dict(pluma=120, poly=[
        (2860, 1180), (3010, 1120), (3190, 1420), (3330, 1560),
        (3900, 1520), (4194, 1500), (4194, 2620), (3750, 2600),
        (3400, 2380), (3170, 1900), (2980, 1560),
    ]),
    # la rama alta y fina que cruza hasta el borde: poca materia, va al fondo
    "rama-alta": dict(pluma=110, poly=[
        (1900, 560), (2400, 380), (3000, 330), (3600, 430), (4194, 380),
        (4194, 1180), (3500, 1200), (3150, 1080), (2700, 830), (2150, 800),
        (1880, 760),
    ]),
    # tres matas distintas y no dos: repetir la misma dos veces al pie del
    # hero se nota enseguida
    "pasto-1": dict(pluma=70, poly=[
        (1900, 3053), (1930, 2560), (2120, 2300), (2380, 2340),
        (2540, 2620), (2560, 3053),
    ]),
    "pasto-2": dict(pluma=70, poly=[
        (2570, 3053), (2600, 2640), (2790, 2420), (3010, 2450),
        (3180, 2720), (3190, 3053),
    ]),
    "pasto-3": dict(pluma=70, poly=[
        (40, 3053), (40, 1180), (250, 1130), (560, 1780), (700, 2420),
        (760, 3053),
    ]),
}

# la firma de la autora y el liquen del angulo no son elementos
VEDADO = [(3700, 2740, 4194, 3053), (3900, 2380, 4194, 2760)]

# el lado largo se dimensiona para el doble del tamano en que se muestra cada
# pieza en el hero, que es lo que pide una pantalla densa. Mas que eso es peso
# muerto: next/image igual sirve una variante mas chica.
MAX_LADO = {"rama-principal": 1600, "rama-alta": 1600, "rama-derecha": 1400}
MAX_LADO_DEF = 1100
CALIDAD_WEBP = 86

# los petalos se muestran a ~26 px, que en un telefono denso son 78 reales
MIN_LADO_PETALO = 120

# de los candidatos ordenados por rosa, cuales quedan. Cuatro flores enteras y
# dos petalos lisos: los lisos son los que la pintura ya tiene cayendo, y sin
# ellos la lluvia queda toda de la misma forma. Descartados: el 5 arrastra una
# mancha beige de liquen y el 11 sale turbio.
SELECCION_PETALOS = [3, 4, 6, 8, 9, 12]


# ---------------------------------------------------------------------------

def matte_completo(cache: str) -> np.ndarray:
    if os.path.exists(cache):
        with open(cache, "rb") as f:
            return pickle.load(f)
    img = Image.open(SRC).convert("RGB")
    papel, _ = estimar_papel(img)
    arr = rgba(transmitancia(img, papel))
    with open(cache, "wb") as f:
        pickle.dump(arr, f, protocol=4)
    return arr


def mascara_poly(forma, poly, pluma: float) -> np.ndarray:
    m = Image.new("L", (forma[1], forma[0]), 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return gaussian_filter(np.asarray(m, np.float32) / 255.0, sigma=pluma)


def sin_borde(arr: np.ndarray, ancho: int = 26) -> np.ndarray:
    """Apaga el marco del escaneo, que no es pintura."""
    h, w = arr.shape[:2]
    ry = np.clip(np.minimum(np.arange(h), h - 1 - np.arange(h)) / ancho, 0, 1)
    rx = np.clip(np.minimum(np.arange(w), w - 1 - np.arange(w)) / ancho, 0, 1)
    arr[..., 3] *= np.minimum(ry[:, None], rx[None, :])
    return arr


def recortar(arr: np.ndarray, umbral: float = 0.035):
    """Bounding box del contenido, sin margenes vacios."""
    filas = np.where(arr[..., 3].max(axis=1) > umbral)[0]
    cols = np.where(arr[..., 3].max(axis=0) > umbral)[0]
    if not len(filas) or not len(cols):
        return None
    return arr[filas[0]:filas[-1] + 1, cols[0]:cols[-1] + 1]


def a_imagen(arr: np.ndarray, max_lado: int | None = None) -> Image.Image:
    """RGBA -> PIL, redimensionando en espacio premultiplicado.

    Sin premultiplicar, un resample mezcla el color de los pixeles casi
    transparentes con el de los opacos y ensucia el borde. Es la misma razon
    por la que aparecen los halos.
    """
    a = arr[..., 3:4]
    pre = np.concatenate([arr[..., :3] * a, a], axis=2)
    im = Image.fromarray(np.clip(pre * 255 + 0.5, 0, 255).astype(np.uint8))
    if max_lado and max(im.size) > max_lado:
        e = max_lado / max(im.size)
        im = im.resize((max(1, round(im.width * e)), max(1, round(im.height * e))),
                       Image.LANCZOS)
    p = np.asarray(im, np.float32) / 255.0
    a = p[..., 3:4]
    rgb = np.where(a > 1e-4, p[..., :3] / np.maximum(a, 1e-4),
                   PAPEL[None, None, :])
    salida = np.concatenate([np.clip(rgb, 0, 1), a], axis=2)
    return Image.fromarray(
        np.clip(salida * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA")


def agrandar(im: Image.Image, min_lado: int) -> Image.Image:
    """Lleva el petalo a un tamano que aguante una pantalla densa.

    Los petalos sueltos miden 34 px en el original y se muestran a 26: en un
    telefono con DPR 3 eso es un cuarto de la resolucion que hace falta.
    Ampliarlos no inventa nada, porque en una mancha de acuarela no hay
    detalle fino que reconstruir; solo evita que se vean pixelados.
    """
    if max(im.size) >= min_lado:
        return im
    e = min_lado / max(im.size)
    return im.resize((round(im.width * e), round(im.height * e)), Image.LANCZOS)


def icono(arr: np.ndarray, destino: str, lado: int = 256) -> None:
    """Favicon: una flor de la pintura sobre el papel del sitio."""
    piezas = buscar_petalos(arr, [1])
    if not piezas:
        return
    flor = a_imagen(recortar(piezas[0]), lado)
    lienzo = Image.new(
        "RGBA", (lado, lado),
        tuple(np.clip(PAPEL * 255 + 0.5, 0, 255).astype(int)) + (255,))
    e = (lado * 0.76) / max(flor.size)
    flor = flor.resize((max(1, round(flor.width * e)),
                        max(1, round(flor.height * e))), Image.LANCZOS)
    lienzo.alpha_composite(flor, ((lado - flor.width) // 2,
                                  (lado - flor.height) // 2))
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    lienzo.convert("RGB").save(destino)


def buscar_petalos(arr: np.ndarray, seleccion):
    """Componentes chicas, magentas y sueltas: los petalos ya caidos.

    El magenta se mide sobre el pigmento ya extraido, no sobre la imagen
    cruda. Ahi el criterio es limpio: al normalizar, el canal mas absorbido
    queda en cero, y para un rosa ese canal es el verde, asi que rojo y azul
    quedan los dos por encima. Un marron o un verde dejan el minimo en cero y
    dan negativo. Sobre la imagen cruda, en cambio, un petalo palido sobre
    papel crema apenas se despega del papel.
    """
    F, a = arr[..., :3], arr[..., 3]
    rosa = np.minimum(F[..., 0], F[..., 2]) - F[..., 1]

    etiquetas, n = label(binary_closing(a > 0.10, structure=_disco(4)))
    if n == 0:
        return []
    cajas = find_objects(etiquetas)
    areas = np.bincount(etiquetas.ravel())

    fuera = np.zeros(arr.shape[:2], bool)
    for x0, y0, x1, y1 in VEDADO:
        fuera[y0:y1, x0:x1] = True

    cand = []
    for i in range(1, n + 1):
        if not (350 <= areas[i] <= 9000):
            continue
        sy, sx = cajas[i - 1]
        alto, ancho = sy.stop - sy.start, sx.stop - sx.start
        if max(alto, ancho) > 160 or min(alto, ancho) < 16:
            continue
        if areas[i] < 0.30 * alto * ancho:       # ramita, no petalo
            continue
        sel = etiquetas[sy, sx] == i
        if fuera[sy, sx][sel].any():
            continue
        peso = a[sy, sx][sel]
        m = float((rosa[sy, sx][sel] * peso).sum() / max(peso.sum(), 1e-6))
        if m < 0.06:
            continue
        cand.append((m * float(peso.sum()), i, sy, sx))

    cand.sort(reverse=True, key=lambda t: t[0])
    piezas = []
    for puesto in seleccion:
        if puesto > len(cand):
            continue
        _, i, sy, sx = cand[puesto - 1]
        trozo = arr[sy, sx].copy()
        trozo[..., 3] = trozo[..., 3] * (etiquetas[sy, sx] == i)
        piezas.append(trozo)
    return piezas


def contact_sheet(piezas, ruta, cols=4, celda=460, margen=26):
    filas = (len(piezas) + cols - 1) // cols
    W = cols * celda + margen * (cols + 1)
    H = filas * (celda + 34) + margen * (filas + 1)
    hoja = Image.new("RGB", (W, H), tuple((PAPEL * 255).astype(int)))
    d = ImageDraw.Draw(hoja)
    for k, (nombre, im) in enumerate(piezas):
        cx = margen + (k % cols) * (celda + margen)
        cy = margen + (k // cols) * (celda + 34 + margen)
        d.rectangle([cx, cy, cx + celda, cy + celda], outline=(226, 216, 198))
        e = min(celda / im.width, celda / im.height)
        mini = im.resize((max(1, round(im.width * e)),
                          max(1, round(im.height * e))), Image.LANCZOS)
        hoja.paste(mini, (cx + (celda - mini.width) // 2,
                          cy + (celda - mini.height) // 2), mini)
        d.text((cx + 2, cy + celda + 8),
               "%s   %d x %d" % (nombre, im.width, im.height), fill=(70, 84, 66))
    hoja.save(ruta)


def escribir_manifiesto(medidas: dict) -> None:
    """Las dimensiones las publica el script, no se copian a mano.

    next/image necesita ancho y alto exactos para reservar el espacio. Si esa
    cifra vive tipeada en el codigo, el dia que se reencuadre un recorte queda
    vieja y aparece un salto de layout que nadie relaciona con esto.
    """
    destino = os.path.join(RAIZ, "lib", "recortes.json")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(medidas, f, indent=2, sort_keys=True)
        f.write("\n")


def main():
    salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        RAIZ, "public", "hero")
    os.makedirs(salida, exist_ok=True)
    cache = os.path.join(tempfile.gettempdir(), "liliana-hero-matte.pkl")

    arr = sin_borde(matte_completo(cache))

    for x0, y0, x1, y1 in VEDADO:
        arr[y0:y1, x0:x1, 3] = 0.0

    piezas = []
    for nombre, cfg in REGIONES.items():
        m = mascara_poly(arr.shape[:2], cfg["poly"], cfg["pluma"])
        trozo = arr.copy()
        # el piso posterior mata los fantasmas que deja la pluma al cruzar un
        # lavado tenue, sin tocar los bordes de acuarela que si tienen materia
        trozo[..., 3] = suelo_suave(trozo[..., 3] * m, 0.035, 0.03)
        trozo = recortar(trozo)
        if trozo is None:
            print("  vacio:", nombre)
            continue
        im = a_imagen(trozo, MAX_LADO.get(nombre, MAX_LADO_DEF))
        im.save(os.path.join(salida, nombre + ".png"))
        im.save(os.path.join(salida, nombre + ".webp"), quality=CALIDAD_WEBP, method=6)
        piezas.append((nombre, im))
        print("%-16s %4d x %4d" % (nombre, im.width, im.height))

    for k, trozo in enumerate(buscar_petalos(arr, SELECCION_PETALOS), 1):
        nombre = "petalo-%d" % k
        im = a_imagen(recortar(trozo), 240)
        im = agrandar(im, MIN_LADO_PETALO)
        im.save(os.path.join(salida, nombre + ".png"))
        im.save(os.path.join(salida, nombre + ".webp"), quality=CALIDAD_WEBP, method=6)
        piezas.append((nombre, im))
        print("%-16s %4d x %4d" % (nombre, im.width, im.height))

    icono(arr, os.path.join(RAIZ, "app", "icon.png"))
    escribir_manifiesto(
        {n: {"ancho": im.width, "alto": im.height} for n, im in piezas})

    hoja = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "contact-sheet.png")
    contact_sheet(piezas, hoja)
    print("\ncontact sheet ->", hoja)


if __name__ == "__main__":
    main()


