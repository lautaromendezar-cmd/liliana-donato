"""Manchas de acuarela para usar de fondo.

El color no se inventa: se toma de las obras de Liliana. Cada mancha es un
recorte real de una pintura suya, desenfocado hasta que solo queda la
transicion de color, recortado con una silueta organica de bordes blandos.

Un degradado CSS habria sido mas barato, pero un degradado tiene el centro
exacto y los bordes parejos, y eso se nota: parece software. Una mancha de
acuarela es irregular, se acumula de un lado y se va aguando del otro.

Dos capas, que es como funciona una acuarela de verdad:

  - Aguadas grandes y muy diluidas, que ocupan casi todo y solo sacan al papel
    de su crema plano.
  - Unos pocos toques chicos con mas pigmento encima.

Todas del mismo tamano y separadas quedan como lunares. Lo que las vuelve
creibles es que se pisen entre si: ahi los colores se mezclan como en una
paleta usada.

Uso:  python scripts/manchas.py
"""

import json
import os

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OBRAS = os.path.join(RAIZ, "contenido", "Obras", "Acuarelas")
SALIDA = os.path.join(RAIZ, "public", "bio")

LIENZO = (1800, 1000)

# En contacto el papel es verde profundo. Una mancha clara encima se lee como
# suciedad, asi que ahi el pigmento se aplica al reves: las manchas ACLARAN el
# fondo, como una veladura, en vez de oscurecerlo.
FONDO_OSCURO = np.array([30, 44, 32], np.float32) / 255

# Luminancia maxima que puede alcanzar la textura oscura. Sale de exigir 4.5:1
# para --tinta-suave (#ccd3be), que es el color del parrafo: (L+0.05)/(x+0.05)
# >= 4.5 con L = 0.6316 da x <= 0.101.
TOPE_CLARIDAD = 0.098

# Alto en pixeles del desvanecido superior. Arriba vive la navegacion: si la
# aguada llega hasta el borde hay que taparla con algo, y ese algo se ve. Que
# el propio pigmento se vaya aguando hacia arriba no deja costura, y ademas es
# lo que hace una aguada de verdad cuando se le termina el agua.
DESVANECIDO_ARRIBA = 230

# de que obra sale cada mancha y de que parte. La caja es la zona de la
# pintura, no de la foto: "Primaveral" esta fotografiada enmarcada sobre una
# mesa y hay que entrar al papel.
FUENTES = {
    "primaveral": dict(
        archivo="_Primaveral_acuarela,30x40cm, vendida.jpg",
        caja=(500, 520, 2180, 2990),
    ),
    "cascada": dict(
        archivo="_Cascada_ Acuarela, 37x55cm.jpg",
        caja=(0, 0, 3779, 6718),
    ),
}

# fuente, centro x, centro y, ancho, alto, giro, opacidad, tipo
#
# "aguada" es agua con un poco de color: ancha, difusa y sin borde.
# "toque" es pigmento casi puro: chico, definido, y con el borde marcado
# porque al secarse el pigmento se corre hacia afuera y se deposita ahi.
# Si las dos capas se tratan igual, todo termina siendo niebla de color.
MANCHAS = [
    ("primaveral", 0.36, 0.46, 1560, 1080, 0, 0.30, "aguada"),
    ("cascada", 0.72, 0.54, 1320, 980, 1, 0.22, "aguada"),
    ("primaveral", 0.58, 0.34, 1150, 820, 2, 0.20, "aguada"),
    ("primaveral", 0.21, 0.33, 480, 400, 3, 0.62, "toque"),
    ("primaveral", 0.66, 0.71, 560, 360, 0, 0.52, "toque"),
    ("cascada", 0.87, 0.31, 400, 470, 1, 0.44, "toque"),
    ("primaveral", 0.47, 0.62, 300, 260, 2, 0.46, "toque"),
]

# En contacto no hay una frase enorme que proteger, asi que las manchas pueden
# ser mas grandes y estar mas repartidas: llenan la pantalla entera.
MANCHAS_OSCURO = [
    ("primaveral", 0.22, 0.30, 1700, 1250, 0, 0.34, "aguada"),
    ("cascada", 0.78, 0.62, 1600, 1200, 1, 0.30, "aguada"),
    ("primaveral", 0.55, 0.20, 1250, 900, 2, 0.24, "aguada"),
    ("cascada", 0.40, 0.85, 1300, 850, 3, 0.22, "aguada"),
    ("primaveral", 0.12, 0.72, 620, 500, 3, 0.42, "toque"),
    ("primaveral", 0.88, 0.24, 540, 480, 0, 0.38, "toque"),
    ("cascada", 0.62, 0.56, 480, 420, 1, 0.30, "toque"),
]

SEMILLA = 11

# cuanto croma se le devuelve despues del desenfoque
SATURACION = 1.28


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3 - 2 * t)


def silueta(ancho: int, alto: int, tipo: str,
            rng: np.random.Generator) -> np.ndarray:
    """Contorno irregular de bordes blandos, como una aguada que se corrio.

    Dos octavas de ruido: la gruesa da el cuerpo de la mancha y la fina le
    come el borde. La caida radial es floja a proposito -empieza recien en
    0.55- porque si domina, todas las manchas terminan siendo el mismo
    circulo difuminado.

    El toque ademas lleva borde acentuado: en una acuarela que se seca, el
    pigmento migra hacia el perimetro y queda una orilla mas oscura. Es el
    detalle que separa una mancha de pintura de un degradado.
    """
    escala = max(ancho, alto)
    base = gaussian_filter(rng.random((alto, ancho)).astype(np.float32),
                           sigma=escala / 9)
    detalle = gaussian_filter(rng.random((alto, ancho)).astype(np.float32),
                              sigma=escala / 26)
    ruido = base * 0.72 + detalle * 0.28
    ruido -= ruido.min()
    ruido /= max(ruido.max(), 1e-6)

    ey = np.linspace(-1, 1, alto, dtype=np.float32)
    ex = np.linspace(-1, 1, ancho, dtype=np.float32)
    radio = np.sqrt(ey[:, None] ** 2 + ex[None, :] ** 2)
    forma = ruido * (1.0 - suave(radio, 0.55, 1.05))

    if tipo == "aguada":
        return gaussian_filter(suave(forma, 0.24, 0.56), sigma=escala / 22)

    alfa = suave(forma, 0.34, 0.52)
    alfa = gaussian_filter(alfa, sigma=escala / 55)
    # orilla: lo que el desenfoque le come al borde, devuelto como realce
    orilla = np.clip(alfa - gaussian_filter(alfa, sigma=escala / 22), 0, 1)
    return np.clip(alfa + orilla * 1.6, 0.0, 1.0)


def croma(a: np.ndarray) -> float:
    return float((a.max(axis=2) - a.min(axis=2)).mean())


def relleno(img: Image.Image, ancho: int, alto: int, giro: int, tipo: str,
            rng: np.random.Generator) -> Image.Image:
    """Un pedazo de la obra, desenfocado hasta que solo queda el color.

    Dos cuidados que la primera version no tenia y salio gris:

    - El recorte se elige por saturacion entre varios candidatos. Un recorte
      al azar cae la mitad de las veces en el margen de papel o en una zona
      aguada, y de ahi no sale color.
    - Despues de desenfocar se recupera el croma. Promediar pixeles mezcla
      colores complementarios y los lleva al gris; sin devolverle saturacion,
      una acuarela vibrante termina pareciendo humo.
    """
    maximo = min(img.width, img.height)
    mejor = None
    for _ in range(30):
        corte = int(maximo * (0.30 + rng.random() * 0.22))
        x = int(rng.integers(0, max(1, img.width - corte)))
        y = int(rng.integers(0, max(1, img.height - corte)))
        muestra = img.crop((x, y, x + corte, y + corte)).resize((24, 24),
                                                                Image.BOX)
        s = croma(np.asarray(muestra, np.float32) / 255.0)
        if mejor is None or s > mejor[0]:
            mejor = (s, (x, y, x + corte, y + corte))

    trozo = img.crop(mejor[1]).rotate(giro * 90)
    trozo = trozo.resize((ancho, alto), Image.LANCZOS)

    # la aguada se disuelve entera; el toque conserva algo de la veta del
    # pigmento, que es de donde sale que parezca pintura y no un degradado
    divisor = 14 if tipo == "aguada" else 34
    a = np.asarray(trozo, np.float32) / 255.0
    a = gaussian_filter(a, sigma=(alto / divisor, ancho / divisor, 0))

    gris = a.mean(axis=2, keepdims=True)
    a = np.clip(gris + (a - gris) * SATURACION, 0.0, 1.0)

    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8))


def aguar_arriba(lienzo: Image.Image, alto: int) -> Image.Image:
    """Diluye el pigmento hacia el borde superior hasta que no queda nada."""
    a = np.asarray(lienzo, np.float32) / 255.0
    rampa = np.clip(np.arange(a.shape[0], dtype=np.float32) / alto, 0.0, 1.0)
    a[..., 3] *= (rampa * rampa * (3 - 2 * rampa))[:, None]
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8),
                           "RGBA")


def luminancia(rgb: np.ndarray) -> np.ndarray:
    s = np.where(rgb <= 0.03928, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return 0.2126 * s[..., 0] + 0.7152 * s[..., 1] + 0.0722 * s[..., 2]


def limitar_claridad(lienzo: Image.Image, fondo: np.ndarray,
                     tope: float) -> Image.Image:
    """Baja el alfa hasta que el punto mas claro deje pasar el contraste.

    El texto de contacto va centrado y las manchas mas vivas quedan en los
    bordes, asi que "en la practica no se cruzan". Confiar en eso es fragil:
    basta reencuadrar una mancha o cambiar un salto de linea. Mejor que la
    textura no pueda aclararse mas alla de lo que el texto tolera.
    """
    a = np.asarray(lienzo, np.float32) / 255.0
    comp = a[..., :3] * a[..., 3:] + fondo * (1 - a[..., 3:])
    maximo = float(luminancia(comp).max())
    if maximo <= tope:
        return lienzo

    factor = 1.0
    for _ in range(24):
        factor *= 0.94
        alfa = a[..., 3:] * factor
        comp = a[..., :3] * alfa + fondo * (1 - alfa)
        if float(luminancia(comp).max()) <= tope:
            break

    a[..., 3] *= factor
    print("   textura atenuada al %d%% para no bajar del contraste minimo"
          % round(factor * 100))
    return Image.fromarray(np.clip(a * 255 + 0.5, 0, 255).astype(np.uint8),
                           "RGBA")


def componer(obras, manchas, rng, sobre_oscuro: bool) -> Image.Image:
    lienzo = Image.new("RGBA", LIENZO, (0, 0, 0, 0))

    for fuente, cx, cy, ancho, alto, giro, opacidad, tipo in manchas:
        color = np.asarray(relleno(obras[fuente], ancho, alto, giro, tipo, rng),
                           np.float32) / 255.0
        alfa = silueta(ancho, alto, tipo, rng) * opacidad

        if sobre_oscuro:
            # el pigmento se aclara hasta poder verse sobre el verde profundo,
            # conservando su tono; si no, sobre ese fondo es todo barro
            gris = color.mean(axis=2, keepdims=True)
            color = np.clip(FONDO_OSCURO + (color - gris) * 0.9 + gris * 0.55,
                            0.0, 1.0)

        pieza = np.concatenate([color, alfa[..., None]], axis=2)
        pieza = Image.fromarray(
            np.clip(pieza * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA")

        lienzo.alpha_composite(
            pieza,
            (int(cx * LIENZO[0]) - ancho // 2, int(cy * LIENZO[1]) - alto // 2))

    return lienzo


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)

    obras = {}
    for nombre, cfg in FUENTES.items():
        im = Image.open(os.path.join(OBRAS, cfg["archivo"])).convert("RGB")
        obras[nombre] = im.crop(cfg["caja"])

    salidas = {
        os.path.join(SALIDA, "manchas.webp"): (MANCHAS, False),
        os.path.join(RAIZ, "public", "contacto", "manchas.webp"):
            (MANCHAS_OSCURO, True),
    }

    for destino, (manchas, oscuro) in salidas.items():
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        rng = np.random.default_rng(SEMILLA)
        lienzo = componer(obras, manchas, rng, oscuro)
        lienzo = aguar_arriba(lienzo, DESVANECIDO_ARRIBA)
        if oscuro:
            lienzo = limitar_claridad(lienzo, FONDO_OSCURO, TOPE_CLARIDAD)
        lienzo.save(destino, quality=88, method=6)
        print("%-46s %d KB" % (os.path.relpath(destino, RAIZ),
                               os.path.getsize(destino) / 1024))

    manifiesto = os.path.join(RAIZ, "lib", "manchas.json")
    with open(manifiesto, "w", encoding="utf-8") as f:
        json.dump({"ancho": LIENZO[0], "alto": LIENZO[1]}, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    main()
