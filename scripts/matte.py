"""
Matte de acuarela.

La acuarela es pigmento transparente sobre papel: el color observado es, en
buena aproximacion, un multiply del pigmento sobre el color del papel.

    C = B * T           C observado, B papel (el lavado ocre), T transmitancia
    a = 1 - min_c(T_c)  absorcion maxima entre canales -> alfa gradual
    F_c = P_c * (T_c - T_min) / (1 - T_min)

Con ese F y ese alfa, componer "over" sobre el papel nuevo P devuelve
exactamente P * T: el mismo pigmento, sobre otro papel. No hay halo posible
porque el color del borde no se hereda del fondo viejo, se deriva.

Todo depende de estimar bien B. Filtrarlo (polinomio, cierre morfologico) deja
un sesgo de 0.06 a 0.20 sobre el lavado real, y ese sesgo aparece como una
neblina ocre en el recorte. En vez de eso: se detecta el pigmento, se rellena
esa zona interpolando el lavado de alrededor, y fuera del pigmento se deja
B = C. Asi el lavado limpio da alfa cero exacto y la textura del papel no se
cuela en el matte.
"""

import numpy as np
from PIL import Image
from scipy.ndimage import (binary_dilation, binary_opening, gaussian_filter,
                           label, median_filter)

PAPEL = np.array([250, 246, 238], dtype=np.float32) / 255.0  # #FAF6EE


# --------------------------------------------------------------------------
# deteccion del pigmento
# --------------------------------------------------------------------------

def mediana_local(img: Image.Image, ventana: int = 51,
                  factor: int = 8) -> np.ndarray:
    """Nivel del lavado alrededor de cada pixel, robusto al pigmento encima."""
    chico = np.asarray(
        img.resize((img.width // factor, img.height // factor), Image.BOX),
        np.float32) / 255.0
    med = np.stack([median_filter(chico[..., c], size=ventana, mode="nearest")
                    for c in range(3)], axis=2)
    grande = Image.fromarray(
        np.clip(med * 255, 0, 255).astype(np.uint8)).resize(
        img.size, Image.BICUBIC)
    return np.asarray(grande, np.float32) / 255.0


def _sin_motas(m: np.ndarray, area_min: int) -> np.ndarray:
    """Descarta componentes chicas: el salpicado del lavado, no elementos."""
    etiquetas, n = label(m)
    if n == 0:
        return m
    areas = np.bincount(etiquetas.ravel())
    areas[0] = 0
    return (areas >= area_min)[etiquetas]


def _disco(r: int) -> np.ndarray:
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    return xx ** 2 + yy ** 2 <= r * r


def _reconstruir(semilla: np.ndarray, marco: np.ndarray) -> np.ndarray:
    """Componentes de `marco` que contienen al menos un pixel de `semilla`."""
    etiquetas, n = label(marco)
    if n == 0:
        return np.zeros_like(marco)
    vivas = np.unique(etiquetas[semilla & marco])
    conservar = np.zeros(n + 1, bool)
    conservar[vivas[vivas > 0]] = True
    return conservar[etiquetas]


def mascara_pigmento(C: np.ndarray, med: np.ndarray, rojo: float = 0.62,
                     oscuridad: float = 0.14, verde: float = 0.02,
                     magenta: float = -0.05, grosor: int = 16,
                     area_trazo: int = 1200, area_color: int = 300,
                     dilatar: int = 45) -> np.ndarray:
    """Donde hay pigmento, por senales que el ocre no dispara.

    El lavado es amarillo (R > G >> B) y nunca baja de ~0.65 en rojo, ni
    siquiera en su rincon mas oscuro; el tronco y el pasto si. Las flores y
    el pasto ademas cruzan ejes de color que el amarillo tiene del lado
    negativo: G por encima de R es verde, G por debajo de R y B es magenta.

    Las ramitas finas son demasiado claras para el umbral de rojo y hay que
    agregarlas por contraste local, pero el salpicado del lavado dispara ese
    mismo criterio. Se resuelve por histeresis: el contraste local solo cuenta
    si su componente toca un nucleo de rojo bajo. Las ramitas cuelgan del
    tronco, el salpicado no cuelga de nada. Y como algunas nubes de salpicado
    si tocan la rama, ademas se exige que sea estructura fina: una ramita mide
    veinte pixeles de ancho, una nube de salpicado cientos.

    La mascara es generosa a proposito: tiene que envolver no solo el trazo
    sino todo su halo tenue, porque su transicion no puede caer sobre un
    borde de acuarela sin apagarlo. No necesita ser precisa; el alfa real
    sale despues, de la transmitancia.
    """
    nucleo = _sin_motas(C[..., 0] < rojo, area_trazo)
    tenue = ((med - C) / np.maximum(med, 0.15)).max(axis=2) > oscuridad
    tenue &= ~binary_opening(tenue, structure=_disco(grosor))
    trazo = _reconstruir(nucleo, nucleo | tenue)

    color = ((C[..., 1] - C[..., 0]) > verde)
    color |= (np.minimum(C[..., 0], C[..., 2]) - C[..., 1]) > magenta

    m = trazo | _sin_motas(color, area_color)
    return binary_dilation(m, structure=_disco(dilatar)) if dilatar else m


# --------------------------------------------------------------------------
# relleno del lavado por piramide (pull-push)
# --------------------------------------------------------------------------

def _baja2(x: np.ndarray) -> np.ndarray:
    h, w = (x.shape[0] // 2) * 2, (x.shape[1] // 2) * 2
    r = x[:h, :w]
    r = r.reshape(h // 2, 2, w // 2, 2, *x.shape[2:])
    return r.mean(axis=(1, 3))


def _sube2(x: np.ndarray, forma) -> np.ndarray:
    a = np.repeat(np.repeat(x, 2, axis=0), 2, axis=1)
    a = a[:forma[0], :forma[1]]
    if a.shape[0] < forma[0]:
        a = np.concatenate([a, a[-1:]], axis=0)
    if a.shape[1] < forma[1]:
        a = np.concatenate([a, a[:, -1:]], axis=1)
    return a


def rellenar(C: np.ndarray, valido: np.ndarray, niveles: int = 10) -> np.ndarray:
    """Interpola el lavado adentro del hueco a partir de sus bordes."""
    cw = [C * valido[..., None]]
    ww = [valido.astype(np.float32)]
    for _ in range(niveles):
        if min(cw[-1].shape[:2]) < 4:
            break
        cw.append(_baja2(cw[-1]))
        ww.append(_baja2(ww[-1]))

    actual = cw[-1] / np.maximum(ww[-1][..., None], 1e-6)
    for nivel in range(len(cw) - 2, -1, -1):
        arriba = _sube2(actual, cw[nivel].shape[:2])
        arriba = gaussian_filter(arriba, sigma=(1.0, 1.0, 0))
        peso = np.clip(ww[nivel], 0.0, 1.0)[..., None]
        propio = cw[nivel] / np.maximum(ww[nivel][..., None], 1e-6)
        actual = propio * peso + arriba * (1 - peso)
    return actual


def estimar_papel(img: Image.Image, dilatar: int = 55, pluma: float = 16.0,
                  **umbrales) -> tuple[np.ndarray, np.ndarray]:
    """Devuelve (papel estimado, mascara de pigmento).

    Fuera del pigmento el papel es la imagen misma, asi que el lavado limpio
    da transmitancia 1 y alfa 0 exacto: ni neblina ocre ni textura del papel
    filtrandose al matte.
    """
    C = np.asarray(img, np.float32) / 255.0
    hueco = mascara_pigmento(C, mediana_local(img), dilatar=dilatar,
                             **umbrales)
    relleno = rellenar(C, ~hueco)
    m = np.clip(gaussian_filter(hueco.astype(np.float32), sigma=pluma) * 1.6,
                0.0, 1.0)[..., None]
    return C * (1 - m) + relleno * m, hueco


# --------------------------------------------------------------------------
# matte
# --------------------------------------------------------------------------

def transmitancia(img: Image.Image, papel: np.ndarray) -> np.ndarray:
    C = np.asarray(img, np.float32) / 255.0
    return np.clip(C / np.maximum(papel, 1e-4), 0.0, 1.0)


def suelo_suave(a: np.ndarray, piso: float, rodilla: float) -> np.ndarray:
    """Apaga el ruido de compresion sin binarizar: rampa smoothstep."""
    t = np.clip((a - (piso - rodilla)) / (2 * rodilla), 0.0, 1.0)
    return a * (t * t * (3 - 2 * t))


def _sin_ocre(T: np.ndarray, lo: float = 0.05, hi: float = 0.16) -> np.ndarray:
    """Descuenta el resto del lavado que queda dentro de la mascara.

    Adentro de la mascara el papel es una interpolacion lisa, mas lisa que el
    lavado real, y esa diferencia -el moteado del ocre- sobrevive como un velo
    amarillo. Se lo reconoce por la forma de su absorcion: creciente de rojo a
    azul, como todo amarillo, pero flojisima en rojo. El tronco tiene la misma
    forma con mucha mas fuerza, asi que alcanza con exigir rojo.
    """
    A = 1.0 - T
    amarillo = (A[..., 2] >= A[..., 1]) & (A[..., 1] >= A[..., 0])
    t = np.clip((A[..., 0] - lo) / (hi - lo), 0.0, 1.0)
    return np.where(amarillo, t * t * (3 - 2 * t), 1.0)


def rgba(T: np.ndarray, piso: float = 0.035, rodilla: float = 0.03,
         ganancia: float = 1.0, quitar_ocre: bool = True) -> np.ndarray:
    """Transmitancia -> RGBA listo para componer sobre --papel."""
    t_min = T.min(axis=2)
    a = np.clip(suelo_suave(1.0 - t_min, piso, rodilla) * ganancia, 0.0, 1.0)
    if quitar_ocre:
        a *= _sin_ocre(T)

    denom = np.maximum(1.0 - t_min, 1e-4)
    F = PAPEL[None, None, :] * np.clip(
        (T - t_min[..., None]) / denom[..., None], 0.0, 1.0)

    out = np.empty(T.shape[:2] + (4,), np.float32)
    out[..., :3] = F
    out[..., 3] = a
    # donde no hay pigmento el color da igual, pero dejarlo en papel evita
    # que un resample posterior arrastre oscuro hacia los bordes tenues
    out[..., :3][a < 1e-3] = PAPEL
    return out


def guardar(arr: np.ndarray, ruta: str) -> None:
    Image.fromarray(
        np.clip(arr * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA").save(ruta)


def sobre_papel(arr: np.ndarray, fondo: np.ndarray | None = None) -> Image.Image:
    p = PAPEL[None, None, :] if fondo is None else fondo
    a = arr[..., 3:4]
    comp = arr[..., :3] * a + p * (1 - a)
    return Image.fromarray(np.clip(comp * 255 + 0.5, 0, 255).astype(np.uint8))
