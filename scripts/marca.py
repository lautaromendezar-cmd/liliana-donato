"""Recorta el trebol del logo y lo deja listo para el header.

  python scripts/marca.py

El logo que mando Liliana es un JPG de 1254x1254 con fondo blanco: un sello
circular con el nombre arriba, "ARTE" abajo, dos aros dorados, guardas y
destellos. Al header entra SOLO el trebol, por dos motivos: el sello ya trae
el nombre y al lado del nombre lo diria dos veces, y a 28 px los aros y las
guardas se hacen puré.

No usa matte.py. Ese modulo resuelve acuarela real sobre papel ocre texturado,
donde el color observado es un multiply del pigmento sobre el lavado. Aca el
fondo es blanco plano y la pintura es opaca, asi que el modelo correcto es el
otro: cobertura sobre blanco.

    C = F*a + 1*(1-a)      C observado, F tinta, a cobertura
    (1 - C_c) = a*(1 - F_c)

De ahi la densidad d = max_c(1 - C_c), que vale 0 en el blanco y crece con la
tinta. Normalizada contra la densidad de una zona solida da el alfa, y con ese
alfa se despeja F = (C - (1-a))/a.

Ese despeje es el punto: sin el, el borde antialiaseado se queda con el blanco
del JPG adentro y aparece un halo. Sobre el crema del home casi no se notaria,
pero la pagina de contacto es verde oscuro y ahi un halo blanco se ve como un
recorte hecho a las apuradas.
"""

import json
import os

import numpy as np
from PIL import Image
from scipy.ndimage import binary_fill_holes, label

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = os.path.join(RAIZ, "contenido", "logo.jpg")
SALIDA = os.path.join(RAIZ, "public", "marca")

# Ventana donde vive el trebol, en fraccion del lado. Deja afuera el texto y
# los aros; los destellos y las guardas que rozan el borde los descarta despues
# quedarse con la mancha mas grande.
VENTANA = (0.26, 0.24, 0.74, 0.78)

# Densidad que se considera tinta solida. Se toma un percentil alto y no el
# maximo porque el maximo lo fijan las venas oscuras del trebol, que son cuatro
# pixeles: normalizar contra ellas dejaria translucido todo el resto.
PERCENTIL_SOLIDO = 96.0
UMBRAL_TINTA = 0.06

LADO_MAX = 512
CALIDAD = 92


def densidad(C: np.ndarray) -> np.ndarray:
    """0 en el blanco del fondo, crece con la tinta."""
    return (1.0 - C).max(axis=2)


def solo_el_trebol(d: np.ndarray) -> np.ndarray:
    """La mancha de tinta mas grande de la ventana.

    El trebol es una sola pieza -las cuatro hojas se tocan en el centro y el
    tallo cuelga de ahi-, mientras que los destellos y los trocitos de guarda
    que entran por las esquinas son manchas sueltas y chicas.
    """
    etiquetas, n = label(d > UMBRAL_TINTA)
    if n == 0:
        raise SystemExit("no se encontro tinta en la ventana del trebol")
    areas = np.bincount(etiquetas.ravel())
    areas[0] = 0
    return binary_fill_holes(etiquetas == int(areas.argmax()))


def desmezclar(C: np.ndarray, a: np.ndarray) -> np.ndarray:
    """Despeja la tinta F sacandole el blanco que aporta el fondo."""
    seguro = np.maximum(a, 1e-3)[..., None]
    F = (C - (1.0 - a)[..., None]) / seguro
    # donde no hay tinta el color da igual, pero dejarlo en blanco evita que un
    # resample posterior arrastre oscuro hacia los bordes tenues
    return np.where(a[..., None] > 1e-3, np.clip(F, 0.0, 1.0), 1.0)


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)

    im = Image.open(ORIGEN).convert("RGB")
    W, H = im.size
    x0, y0, x1, y1 = VENTANA
    ventana = im.crop((round(x0 * W), round(y0 * H),
                       round(x1 * W), round(y1 * H)))

    C = np.asarray(ventana, np.float32) / 255.0
    d = densidad(C)
    mancha = solo_el_trebol(d)

    solido = np.percentile(d[mancha], PERCENTIL_SOLIDO)
    a = np.clip(d / max(solido, 1e-4), 0.0, 1.0) * mancha
    F = desmezclar(C, a)

    rgba = np.concatenate([F, a[..., None]], axis=2)
    hoja = Image.fromarray(
        np.clip(rgba * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA")

    # al recorte le sobra ventana por los cuatro lados
    hoja = hoja.crop(hoja.getbbox())
    if max(hoja.size) > LADO_MAX:
        e = LADO_MAX / max(hoja.size)
        hoja = hoja.resize((round(hoja.width * e), round(hoja.height * e)),
                           Image.LANCZOS)

    hoja.save(os.path.join(SALIDA, "trebol.webp"), quality=CALIDAD, method=6)
    with open(os.path.join(RAIZ, "lib", "marca.json"), "w",
              encoding="utf-8") as f:
        json.dump({"ancho": hoja.width, "alto": hoja.height}, f, indent=2)
        f.write("\n")

    print("trebol %d x %d  (densidad solida %.3f)"
          % (hoja.width, hoja.height, solido))

    # prueba de halo: el mismo trebol sobre los dos fondos del sitio
    prueba(hoja)


def prueba(trebol: Image.Image) -> None:
    """Hoja de control sobre los dos papeles, al tamano del header y grande."""
    fondos = [(250, 246, 238), (30, 44, 32)]
    tamanos = [28, 96, 320]
    pad = 24
    ancho = pad + sum(t + pad for t in tamanos)
    alto_fila = max(tamanos) + pad * 2

    hoja = Image.new("RGB", (ancho, alto_fila * len(fondos)))
    for i, color in enumerate(fondos):
        fila = Image.new("RGB", (ancho, alto_fila), color)
        x = pad
        for t in tamanos:
            chico = trebol.copy()
            chico.thumbnail((t, t), Image.LANCZOS)
            fila.paste(chico, (x, pad + (max(tamanos) - chico.height) // 2),
                       chico)
            x += t + pad
        hoja.paste(fila, (0, i * alto_fila))

    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "marca-prueba.png")
    hoja.save(ruta)
    print("prueba sobre los dos papeles ->", ruta)


if __name__ == "__main__":
    main()
