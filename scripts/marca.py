"""Recorta las piezas del logo y las deja listas para el sitio.

  python scripts/marca.py

Emite tres cosas:

- public/marca/trebol.webp, para el header y para el velo de transicion.
- public/marca/sello.webp, el sello entero, que cierra la pagina de contacto.
- app/icon.png, el favicon.

El logo que mando Liliana es un JPG de 1254x1254 con fondo blanco: un sello
circular con el nombre arriba, "ARTE" abajo, dos aros dorados, guardas y
destellos. Al header entra SOLO el trebol, por dos motivos: el sello ya trae
el nombre y al lado del nombre lo diria dos veces, y a 28 px los aros y las
guardas se hacen puré. Donde el sello entero SI entra es en contacto, en el
lugar de la firma: un sello es exactamente eso, y ahi tiene el tamano para que
se lean el nombre arqueado y el "ARTE" de abajo.

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

# El JPG tiene ruido de compresion alrededor de las letras y de los aros. Sin
# apagarlo, el sello sale con una neblina gris cuadrada donde estaba el fondo,
# y sobre el verde de contacto esa neblina se ve como un parche.
PISO_RUIDO = 0.035
RODILLA_RUIDO = 0.025

LADO_MAX = 512
LADO_MAX_SELLO = 640
LADO_ICONO = 256
CALIDAD = 92

# el mismo #faf6ee de --papel: el favicon se ve en la pestana, no sobre el sitio
PAPEL = (250, 246, 238)


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


def apagar_ruido(d: np.ndarray) -> np.ndarray:
    """Rampa suave contra el ruido de compresion, sin binarizar.

    Binarizar dejaria el borde con escalera; una rampa manda a cero lo que es
    ruido y deja intacto el antialias real, que esta muy por encima del piso.
    """
    t = np.clip((d - (PISO_RUIDO - RODILLA_RUIDO)) / (2 * RODILLA_RUIDO),
                0.0, 1.0)
    return d * (t * t * (3 - 2 * t))


def desmezclar(C: np.ndarray, a: np.ndarray) -> np.ndarray:
    """Despeja la tinta F sacandole el blanco que aporta el fondo."""
    seguro = np.maximum(a, 1e-3)[..., None]
    F = (C - (1.0 - a)[..., None]) / seguro
    # donde no hay tinta el color da igual, pero dejarlo en blanco evita que un
    # resample posterior arrastre oscuro hacia los bordes tenues
    return np.where(a[..., None] > 1e-3, np.clip(F, 0.0, 1.0), 1.0)


def pieza(im: Image.Image, mancha: np.ndarray | None,
          lado_max: int) -> tuple[Image.Image, float]:
    """Recorta con alfa, desmezcla y ajusta el tamano."""
    C = np.asarray(im, np.float32) / 255.0
    d = apagar_ruido(densidad(C))

    referencia = d[mancha] if mancha is not None else d[d > UMBRAL_TINTA]
    solido = float(np.percentile(referencia, PERCENTIL_SOLIDO))

    a = np.clip(d / max(solido, 1e-4), 0.0, 1.0)
    if mancha is not None:
        a = a * mancha
    F = desmezclar(C, a)

    rgba = np.concatenate([F, a[..., None]], axis=2)
    hoja = Image.fromarray(
        np.clip(rgba * 255 + 0.5, 0, 255).astype(np.uint8), "RGBA")

    hoja = hoja.crop(hoja.getbbox())
    if max(hoja.size) > lado_max:
        e = lado_max / max(hoja.size)
        hoja = hoja.resize((round(hoja.width * e), round(hoja.height * e)),
                           Image.LANCZOS)
    return hoja, solido


def icono(trebol: Image.Image, destino: str) -> None:
    """Favicon: el trebol sobre el papel del sitio.

    Lo escribe este script y no extraer_hero.py, que antes ponia ahi una flor
    de la pintura del hero. Un favicon es la marca, y desde que hay marca la
    flor competia con ella.
    """
    lienzo = Image.new("RGBA", (LADO_ICONO, LADO_ICONO), PAPEL + (255,))
    chico = trebol.copy()
    chico.thumbnail((round(LADO_ICONO * 0.78), round(LADO_ICONO * 0.78)),
                    Image.LANCZOS)
    lienzo.alpha_composite(chico, ((LADO_ICONO - chico.width) // 2,
                                   (LADO_ICONO - chico.height) // 2))
    lienzo.convert("RGB").save(destino)


def main() -> None:
    os.makedirs(SALIDA, exist_ok=True)

    im = Image.open(ORIGEN).convert("RGB")
    W, H = im.size

    # --- el trebol: ventana central y la mancha mas grande de adentro -------
    x0, y0, x1, y1 = VENTANA
    ventana = im.crop((round(x0 * W), round(y0 * H),
                       round(x1 * W), round(y1 * H)))
    C = np.asarray(ventana, np.float32) / 255.0
    mancha = solo_el_trebol(apagar_ruido(densidad(C)))
    trebol, solido = pieza(ventana, mancha, LADO_MAX)
    trebol.save(os.path.join(SALIDA, "trebol.webp"), quality=CALIDAD, method=6)
    print("trebol %3d x %3d  (densidad solida %.3f)"
          % (trebol.width, trebol.height, solido))

    # --- el sello entero: sin filtrar por mancha ---------------------------
    # el sello son muchas piezas sueltas -dos aros, las letras, las guardas,
    # los destellos y el trebol-, asi que quedarse con la mas grande dejaria
    # solo una de ellas
    sello, solido_sello = pieza(im, None, LADO_MAX_SELLO)
    sello.save(os.path.join(SALIDA, "sello.webp"), quality=CALIDAD, method=6)
    print("sello  %3d x %3d  (densidad solida %.3f)"
          % (sello.width, sello.height, solido_sello))

    with open(os.path.join(RAIZ, "lib", "marca.json"), "w",
              encoding="utf-8") as f:
        json.dump({
            "trebol": {"ancho": trebol.width, "alto": trebol.height},
            "sello": {"ancho": sello.width, "alto": sello.height},
        }, f, indent=2)
        f.write("\n")

    icono(trebol, os.path.join(RAIZ, "app", "icon.png"))
    print("favicon -> app/icon.png")

    # prueba de halo: las dos piezas sobre los dos fondos del sitio
    prueba(trebol, sello)


def prueba(trebol: Image.Image, sello: Image.Image) -> None:
    """Hoja de control sobre los dos papeles, a los tamanos en que se usan."""
    fondos = [PAPEL, (30, 44, 32)]
    piezas = [(trebol, 28), (trebol, 96), (sello, 128), (sello, 320)]
    pad = 24
    mayor = max(t for _, t in piezas)
    ancho = pad + sum(t + pad for _, t in piezas)
    alto_fila = mayor + pad * 2

    hoja = Image.new("RGB", (ancho, alto_fila * len(fondos)))
    for i, color in enumerate(fondos):
        fila = Image.new("RGB", (ancho, alto_fila), color)
        x = pad
        for original, t in piezas:
            chico = original.copy()
            chico.thumbnail((t, t), Image.LANCZOS)
            fila.paste(chico, (x, pad + (mayor - chico.height) // 2), chico)
            x += t + pad
        hoja.paste(fila, (0, i * alto_fila))

    ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                        "marca-prueba.png")
    hoja.save(ruta)
    print("prueba sobre los dos papeles ->", ruta)


if __name__ == "__main__":
    main()
