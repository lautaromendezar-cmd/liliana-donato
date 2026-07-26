# -*- coding: utf-8 -*-
"""Segunda pasada: ajusta los encuadres que quedaron con marco visible."""
import os, math
from PIL import Image

SRC = "c:/Users/Lautaro/Desktop/Claude/liliana-donato/contenido/"
DST = "c:/Users/Lautaro/Desktop/Claude/liliana-donato/public/"
A = SRC + "Obras/Acuarelas/"
O = SRC + "Obras/\u00d3leos/"
S = SRC + "Series/"


def load(p):
    return Image.open(p).convert("RGB")


def quad(im, pts, ratio=None, out_long=2400):
    W, H = im.size
    px = [(x / 100 * W, y / 100 * H) for x, y in pts]
    if ratio is None:
        top = math.dist(px[0], px[3]); bot = math.dist(px[1], px[2])
        lef = math.dist(px[0], px[1]); rig = math.dist(px[3], px[2])
        ratio = ((top + bot) / 2) / ((lef + rig) / 2)
    if ratio >= 1:
        ow, oh = out_long, int(round(out_long / ratio))
    else:
        oh, ow = out_long, int(round(out_long * ratio))
    data = (px[0][0], px[0][1], px[1][0], px[1][1], px[2][0], px[2][1], px[3][0], px[3][1])
    return im.transform((ow, oh), Image.QUAD, data, Image.BICUBIC)


def graybalance(im, strength=0.55):
    n = im.width * im.height
    r, g, b = [sum(ch.getdata()) / n for ch in im.split()]
    avg = (r + g + b) / 3
    f = [1 + (avg / c - 1) * strength for c in (r, g, b)]
    return im.point([min(255, int(i * f[0])) for i in range(256)] +
                    [min(255, int(i * f[1])) for i in range(256)] +
                    [min(255, int(i * f[2])) for i in range(256)])


def save(im, rel, maxdim=2400, q=88):
    p = os.path.join(DST, rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im = im.copy()
    im.thumbnail((maxdim, maxdim), Image.LANCZOS)
    im.save(p, "JPEG", quality=q, optimize=True, progressive=True)
    print("  %-40s %dx%d" % (rel, im.width, im.height))


def crop_pct(im, box):
    W, H = im.size
    return im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3])))


FIX = [
    ("calido-frio-frio", A + "C\u00e1lido-Frio, acuarelas, cada una de 28x4cm.jpg",
     ((16.5, 57), (18.5, 93), (77, 90), (75.5, 53.5)), None, 0.0),
    ("jarron-colorido", A + "_Jarr\u00f3n colorido_ Acuarela, 28x36cm.jpg",
     ((18.5, 10), (23, 98), (84, 94.5), (79, 5)), 28 / 36, 0.0),
    ("ventana-2", O + "_Ventana 2_ \u00f3leo y vitraux.jpg",
     ((5, 6), (8, 89), (71, 86), (68, 4.5)), None, 0.0),
    ("paisaje-campestre", O + "_Paisaje campestre, \u00f3leo, 30x25cm.jpg",
     ((22, 31), (22, 73), (79.5, 73), (79, 31)), 30 / 25, 0.35),
    ("paisaje-urbano-i", S + "Serie_ _Paisaje Urbano_, \u00f3leo,30x30cm.jpg",
     ((17, 19), (17, 87), (85, 85.5), (84, 17.5)), 1.0, 0.5),
    ("paisaje-urbano-ii", S + "Serie_Paisaje Urbano_ \u00f3leo, 0x30cm.jpg",
     ((13.5, 15), (14, 83.5), (84.5, 82), (83.5, 13)), 1.0, 0.5),
    ("paisaje-urbano-iii", S + "Serie_Paisaje Urbano_ \u00f3leo, 30x30cm.jpg",
     ((14, 16), (14, 86), (86, 84.5), (85.5, 14.5)), 1.0, 0.5),
    ("paisaje-urbano-iv", S + "Serie_Paisaje urbano, \u00f3leo,30x30cm.jpg",
     ((13.5, 14.5), (14, 84.5), (85.5, 83), (84.5, 13)), 1.0, 0.5),
]

for slug, path, pts, ratio, bal in FIX:
    im = quad(load(path), pts, ratio)
    if bal > 0:
        im = graybalance(im, bal)
    save(im, "obras/%s.jpg" % slug)

for slug, box in [("ventana-2", (.10, .09, .60, .68)),
                  ("paisaje-urbano-iii", (.30, .30, .95, .88))]:
    save(crop_pct(load(DST + "obras/%s.jpg" % slug), box), "obras/%s-detalle.jpg" % slug, maxdim=2000, q=90)
print("listo")
