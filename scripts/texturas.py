# -*- coding: utf-8 -*-
"""Genera las texturas del sitio como PNG.

feTurbulence rasterizado en vivo a pantalla completa cuesta caro en móvil, y
el grano y la máscara de lavado son estáticos: no hay ninguna razón para
recalcularlos en cada pintado. Se generan una vez, acá, con el mismo ruido
fractal, y el navegador sólo compone bitmaps.
"""
import numpy as np
from PIL import Image

DST = "c:/Users/Lautaro/Desktop/Claude/liliana-donato/public/textura/"
import os
os.makedirs(DST, exist_ok=True)
rng = np.random.default_rng(11)


def guardar_grano(a, nombre, niveles=32):
    """Escala de grises y pocos niveles: el grano no necesita 8 bits ni RGB."""
    q = np.round(a * (niveles - 1)) / (niveles - 1)
    im = Image.fromarray((q * 255).astype(np.uint8), "L")
    im.save(DST + nombre, optimize=True, bits=8)


def ruido_fractal(alto, ancho, octavas=4, base=8, persistencia=0.55, semilla=11,
                  base_y=None):
    """Ruido de valor fractal, periódico en ambos ejes (tileable).

    `base_y` distinto de `base` da anisotropía: celdas anchas en un eje y
    finas en el otro, que es lo que hace que una trama parezca tejida.
    """
    r = np.random.default_rng(semilla)
    by = base if base_y is None else base_y
    acum = np.zeros((alto, ancho), dtype=np.float64)
    amp, total = 1.0, 0.0
    for o in range(octavas):
        nx = max(2, base * (2**o))
        ny = max(2, by * (2**o))
        grilla = r.random((ny, nx))
        # wrap: repetir la primera fila/columna cierra el mosaico
        grilla = np.vstack([grilla, grilla[:1]])
        grilla = np.hstack([grilla, grilla[:, :1]])
        img = Image.fromarray((grilla * 255).astype(np.uint8), "L")
        img = img.resize((ancho + 1, alto + 1), Image.BILINEAR)
        capa = np.asarray(img, dtype=np.float64)[:alto, :ancho] / 255.0
        acum += capa * amp
        total += amp
        amp *= persistencia
    acum /= total
    return (acum - acum.min()) / (acum.max() - acum.min())


# ---------------------------------------------------------------- grano papel
# fibra de algodón: grano casi por píxel, con una nubosidad muy leve debajo
papel = ruido_fractal(260, 260, octavas=2, base=130, persistencia=0.4, semilla=11)
nube = ruido_fractal(260, 260, octavas=3, base=9, persistencia=0.55, semilla=29)
papel = np.clip(papel * 0.82 + nube * 0.18, 0, 1)
papel = np.clip((papel - 0.5) * 1.25 + 0.5, 0, 1)
guardar_grano(papel, "papel.png")

# ---------------------------------------------------------------- grano lino
# trama tejida: celdas finas en horizontal, largas en vertical, y viceversa
urdimbre = ruido_fractal(220, 220, octavas=2, base=110, base_y=7, persistencia=0.45, semilla=5)
trama = ruido_fractal(220, 220, octavas=2, base=7, base_y=110, persistencia=0.45, semilla=17)
lino = np.clip(urdimbre * 0.5 + trama * 0.5, 0, 1)
lino = np.clip((lino - 0.5) * 1.7 + 0.5, 0, 1)
guardar_grano(lino, "lino.png")

# ------------------------------------------------------------ máscara lavado
ANCHO, ALTO = 600, 240


def lavado(semilla, espejo=False):
    """Frente de agua: un gradiente cuyo borde se desplaza con ruido suave."""
    x = np.linspace(0, 1, ANCHO)[None, :].repeat(ALTO, axis=0)
    n = ruido_fractal(ALTO, ANCHO, octavas=4, base=5, persistencia=0.6, semilla=semilla)
    # el ruido corre el frente hacia adelante y hacia atrás
    x = x + (n - 0.5) * 0.17
    # opaco hasta 0.42, transparente pasando 0.70
    a = np.clip((0.70 - x) / (0.70 - 0.42), 0, 1)
    # borde con salpicaduras: un segundo ruido fino muerde el frente
    fino = ruido_fractal(ALTO, ANCHO, octavas=3, base=34, persistencia=0.5, semilla=semilla + 3)
    borde = (a > 0.02) & (a < 0.98)
    a[borde] = np.clip(a[borde] - (fino[borde] - 0.45) * 0.42, 0, 1)
    a = np.clip(a * 1.06, 0, 1)
    if espejo:
        a = a[:, ::-1]
    rgba = np.zeros((ALTO, ANCHO, 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


lavado(9).save(DST + "lavado.png", optimize=True)
lavado(23, espejo=True).save(DST + "lavado-inv.png", optimize=True)

for f in ["papel.png", "lino.png", "lavado.png", "lavado-inv.png"]:
    print("  %-16s %5d KB" % (f, os.path.getsize(DST + f) / 1024))
