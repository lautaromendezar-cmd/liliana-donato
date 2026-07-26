# -*- coding: utf-8 -*-
"""Procesa el material crudo de Liliana Donato hacia /public.

- Grupo C: rectifica perspectiva con transformada QUAD hacia la proporcion real declarada.
- Grupo A: recorte de bordes de bastidor donde hace falta.
- Balance de grises parcial solo donde hay rebote de color medible (mesa de madera).
- Reduce a 2400px lado largo, calidad 88.
- Genera crops de detalle de textura.
"""
import os, math
from PIL import Image, ImageEnhance

SRC = "c:/Users/Lautaro/Desktop/Claude/liliana-donato/contenido/"
DST = "c:/Users/Lautaro/Desktop/Claude/liliana-donato/public/"
MAXDIM = 2400
Q = 88

A = SRC + "Obras/Acuarelas/"
O = SRC + "Obras/\u00d3leos/"
S = SRC + "Series/"
F = SRC + "Fotos Varias/"


def load(p):
    return Image.open(p).convert("RGB")


def quad(im, pts, ratio=None, out_long=2400):
    """pts = ((x,y) NW, SW, SE, NE) en % de la imagen."""
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
    """Neutraliza dominante global midiendo la media, aplicada parcialmente."""
    r, g, b = [sum(ch.getdata()) / (im.width * im.height) for ch in im.split()]
    avg = (r + g + b) / 3
    fr, fg, fb = avg / r, avg / g, avg / b
    fr = 1 + (fr - 1) * strength
    fg = 1 + (fg - 1) * strength
    fb = 1 + (fb - 1) * strength
    return im.point([min(255, int(i * fr)) for i in range(256)] +
                    [min(255, int(i * fg)) for i in range(256)] +
                    [min(255, int(i * fb)) for i in range(256)])


def save(im, rel, maxdim=MAXDIM, q=Q):
    p = os.path.join(DST, rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(p), exist_ok=True)
    im = im.copy()
    im.thumbnail((maxdim, maxdim), Image.LANCZOS)
    im.save(p, "JPEG", quality=q, optimize=True, progressive=True)
    print("  %-46s %dx%d  %dKB" % (rel, im.width, im.height, os.path.getsize(p) / 1024))


def crop_pct(im, box):
    W, H = im.size
    return im.crop((int(W * box[0]), int(H * box[1]), int(W * box[2]), int(H * box[3])))


# ---------------------------------------------------------------- GRUPO C
print("\n== GRUPO C: rectificacion de perspectiva ==")

C = [
    # slug, archivo, esquinas NW SW SE NE (%), proporcion real (ancho/alto) o None, balance
    ("calido-frio-calido", A + "C\u00e1lido-Frio, acuarelas, cada una de 28x4cm.jpg",
     ((17, 5), (18, 50), (78.5, 48), (77, 3.5)), None, 0.0),
    ("calido-frio-frio", A + "C\u00e1lido-Frio, acuarelas, cada una de 28x4cm.jpg",
     ((15, 56.5), (17, 99), (77.5, 96), (76, 53)), None, 0.0),
    ("jarron-colorido", A + "_Jarr\u00f3n colorido_ Acuarela, 28x36cm.jpg",
     ((17, 8), (22, 99.5), (85.5, 96), (80, 3)), 28 / 36, 0.0),
    ("nueva-york", A + "_Nueva York_, acuarela, 20x32 cm, vendida.jpg",
     ((13.5, 10), (13, 79.5), (87.5, 79), (86.5, 9.5)), 20 / 32, 0.0),
    ("primaveral", A + "_Primaveral_acuarela,30x40cm, vendida.jpg",
     ((12.5, 13.5), (13.5, 90), (68, 89), (67, 12.5)), 30 / 40, 0.0),
    ("paisaje-campestre", O + "_Paisaje campestre, \u00f3leo, 30x25cm.jpg",
     ((21.5, 30), (21.5, 73.5), (80.5, 73.5), (80, 30)), 30 / 25, 0.35),
    ("ventana-2", O + "_Ventana 2_ \u00f3leo y vitraux.jpg",
     ((5, 4), (8, 90), (75, 87), (71.5, 3)), None, 0.0),
    ("paisaje-urbano-i", S + "Serie_ _Paisaje Urbano_, \u00f3leo,30x30cm.jpg",
     ((14.5, 17.5), (14.5, 88.5), (87.5, 86.5), (86, 15.5)), 1.0, 0.5),
    ("paisaje-urbano-ii", S + "Serie_Paisaje Urbano_ \u00f3leo, 0x30cm.jpg",
     ((11.5, 13), (12, 85), (86, 83.5), (85, 11)), 1.0, 0.5),
    ("paisaje-urbano-iii", S + "Serie_Paisaje Urbano_ \u00f3leo, 30x30cm.jpg",
     ((13, 14.5), (13, 86.5), (87, 85), (86.5, 13)), 1.0, 0.5),
    ("paisaje-urbano-iv", S + "Serie_Paisaje urbano, \u00f3leo,30x30cm.jpg",
     ((12, 13), (12.5, 86), (87, 84.5), (86, 11.5)), 1.0, 0.5),
]

for slug, path, pts, ratio, bal in C:
    im = quad(load(path), pts, ratio)
    if bal > 0:
        im = graybalance(im, bal)
    save(im, "obras/%s.jpg" % slug)

# ---------------------------------------------------------------- GRUPO A
print("\n== GRUPO A: recorte de bordes de bastidor ==")

Acrops = [
    ("frutos", A + "_Frutos_ acuarela en bastidor, 30x30cm.jpg", (.012, .010, .875, .968), 1.0),
    ("orquideas", A + "_Orquideas_ Acuarela en bastidor 20x20cm.jpg", (.010, .012, .965, .982), 1.0),
    ("el-mirador", O + "El Mirador, \u00f3leo, 24x32cm.jpg", (.016, .026, .992, .992), 24 / 32),
    ("central-park-arboleda", S + "Central Park, \u00f3leo, 30x40cm(1).jpg", (.010, .008, .972, .986), 30 / 40),
]
for slug, path, box, ratio in Acrops:
    im = crop_pct(load(path), box)
    if ratio:
        w, h = im.size
        target_h = int(round(w / ratio))
        if target_h <= h:
            off = (h - target_h) // 2
            im = im.crop((0, off, w, off + target_h))
        else:
            target_w = int(round(h * ratio))
            off = (w - target_w) // 2
            im = im.crop((off, 0, off + target_w, h))
    save(im, "obras/%s.jpg" % slug)

# ---------------------------------------------------------------- SIN CROP
print("\n== GRUPO A: sin intervencion geometrica ==")

PLAIN = [
    ("aire-de-primavera", A + "_Aire de primavera_ acuarela, 31x41cm, Vendido.jpg", 0.0),
    ("camino-campestre", A + "_Camino Campestre_ acuarela, 27 x 37cm_.jpg", 0.0),
    ("campanita-con-colibri", A + "_Campanita con colibr\u00ed_, acuarela, 30x40cm.jpg", 0.0),
    ("cascada", A + "_Cascada_ Acuarela, 37x55cm.jpg", 0.0),
    ("entre-grises", A + "_Entre Grises_, acuarela, 36x55cm.jpg", 0.0),
    ("flores-palidas", A + "_Flores p\u00e1lidas_Acuarela, 28x4cm.jpg", 0.0),
    ("flores-rosas", A + "_Flores rosas_ acuarela, 45x5cm. Vendido.jpg", 0.0),
    ("flores", A + "_Flores_, acuarela  50x40cm.Vendido_.jpg", 0.0),
    ("margaritas-celestes", A + "_Margaritas celestes_ acuarela, vendida.jpg", 0.30),
    ("serenidad", A + "_Serenidad_ acuarela, 37x24,5cm.jpg", 0.0),
    ("ventana-con-hortensias", A + "_Ventana con Hortensias, Acuarela, 26,5cmx37,5cm.jpg", 0.0),
    ("calle-nortena", O + "Calle Norte\u00f1a.jpg", 0.0),
    ("flores-blancas", O + "Flores Blancas,\u00f3leo,, 51x36cm Vendido.jpg", 0.0),
    ("jarron-con-flores", O + "Jarr\u00f3n con flores, \u00f3leo, 30x40cm.jpg", 0.0),
    ("los-colorados", O + "Los colorados, \u00f3leo, 28x38cm.jpg", 0.0),
    ("luna-llena", O + "Luna llena, \u00f3leo, 26x37cm.jpg", 0.0),
    ("central-park-escalera", S + "Central Park, \u00f3leo, 30x40cm.jpg", 0.0),
]
for slug, path, bal in PLAIN:
    im = load(path)
    if bal > 0:
        im = graybalance(im, bal)
        im = ImageEnhance.Brightness(im).enhance(1.06)
    save(im, "obras/%s.jpg" % slug)

# ---------------------------------------------------------------- DETALLES
print("\n== CROPS DE TEXTURA ==")

DET = [
    ("ventana-2", DST + "obras/ventana-2.jpg", (.10, .09, .60, .68)),
    ("flores-blancas", O + "Flores Blancas,\u00f3leo,, 51x36cm Vendido.jpg", (.33, .03, .97, .44)),
    ("jarron-con-flores", O + "Jarr\u00f3n con flores, \u00f3leo, 30x40cm.jpg", (.28, .52, .88, .95)),
    ("los-colorados", O + "Los colorados, \u00f3leo, 28x38cm.jpg", (.02, .02, .58, .40)),
    ("calle-nortena", O + "Calle Norte\u00f1a.jpg", (.30, .30, .95, .72)),
    ("frutos", DST + "obras/frutos.jpg", (.00, .52, .52, 1.0)),
    ("orquideas", DST + "obras/orquideas.jpg", (.52, .08, 1.0, .58)),
    ("luna-llena", O + "Luna llena, \u00f3leo, 26x37cm.jpg", (.42, .02, 1.0, .38)),
    ("paisaje-urbano-iii", DST + "obras/paisaje-urbano-iii.jpg", (.30, .30, .95, .88)),
]
for slug, path, box in DET:
    save(crop_pct(load(path), box), "obras/%s-detalle.jpg" % slug, maxdim=2000, q=90)

# ---------------------------------------------------------------- ATELIER
print("\n== ATELIER ==")

AT = [
    ("pintando", F + "lili foto pintando.jpg", None),
    ("frasco-de-agua", A + "_Hortensias, acuarela,_ 30x40cm, vendida.jpg", None),
    ("vidrios-de-color", O + "_Ventana 2_ \u00f3leo y vitraux.jpg", (.60, .05, 1.0, .98)),
    ("godetes", A + "_Flores de atardecer_ Acuarela,28x34cm.jpg", None),
]
for slug, path, box in AT:
    im = load(path)
    if box:
        im = crop_pct(im, box)
    save(im, "atelier/%s.jpg" % slug)

save(load(F + "IMG-20260715-WA0027.jpg"), "sitio/retrato.jpg")

# ---------------------------------------------------------------- LOGO
print("\n== LOGO ==")
lg = load(SRC + "logo.jpg")
# recorte al contenido: el sello ocupa el centro
w, h = lg.size
lg = lg.crop((int(w * .045), int(h * .045), int(w * .955), int(h * .955)))
rgba = lg.convert("RGBA")
px = rgba.load()
W, H = rgba.size
for y in range(H):
    for x in range(W):
        r, g, b, _ = px[x, y]
        a = 255 - min(r, g, b)
        a = min(255, int(a * 1.35))
        px[x, y] = (r, g, b, a)
p = os.path.join(DST, "sitio", "sello.png")
os.makedirs(os.path.dirname(p), exist_ok=True)
rgba.thumbnail((900, 900), Image.LANCZOS)
rgba.save(p, "PNG", optimize=True)
print("  sitio/sello.png  %dx%d  %dKB" % (rgba.width, rgba.height, os.path.getsize(p) / 1024))
print("\nlisto.")
