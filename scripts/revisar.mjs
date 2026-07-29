// Revisa el hero: captura en varios viewports y avisa si el follaje invade el
// texto.
//
//   node scripts/revisar.mjs [url]
//
// Dos decisiones que importan:
//
// 1. Emulacion de dispositivo por CDP y no --window-size. Chrome en Windows no
//    achica la ventana por debajo de ~500 px: pedirle 390 devuelve una pagina
//    maquetada a 500 y recortada a 390, o sea una captura que miente.
//
// 2. La invasion se mide por TINTA, no por bounding box. Un recorte de rama es
//    un PNG casi todo transparente; su caja se superpone con el nombre mucho
//    antes de que ningun pixel pintado se le acerque. Se dibuja el recorte en
//    un canvas y se mira el alfa dentro de la zona del texto.
//
// La medicion corre con prefers-reduced-motion, donde no hay transform, para
// que la caja en pantalla mapee 1:1 contra el pixel de la imagen. El recorrido
// del parallax se compensa con el margen de aire.

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as esperar } from "node:timers/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const URL_BASE = process.argv[2] ?? "http://localhost:3210";
const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "_capturas");
const PUERTO = 9333;

const VISTAS = [
  { n: "1920x1080", w: 1920, h: 1080, movil: false },
  { n: "1440x900", w: 1440, h: 900, movil: false },
  { n: "1280x800", w: 1280, h: 800, movil: false },
  { n: "834x1112", w: 834, h: 1112, movil: true },
  { n: "390x844", w: 390, h: 844, movil: true },
  { n: "360x740", w: 360, h: 740, movil: true },
];

/** Aire exigido alrededor del texto: 40 px cubren el recorrido del parallax. */
const AIRE = 52;

/** Alfa a partir del cual se considera que hay pigmento y no papel. */
const UMBRAL = 0.1;

const MEDIR = `(() => {
  const caja = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: b.x, y: b.y, r: b.right, b: b.bottom };
  };
  // contraste real de cada texto contra el papel, no contra lo que uno cree
  const lum = (c) => {
    const [r, g, b] = c.match(/\\d+/g).slice(0, 3).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const papel = lum(getComputedStyle(document.body).backgroundColor);
  const contraste = (el) => {
    const t = lum(getComputedStyle(el).color);
    const [a, b] = t > papel ? [t, papel] : [papel, t];
    return +((a + 0.05) / (b + 0.05)).toFixed(2);
  };
  const grande = (el) => {
    const cs = getComputedStyle(el);
    const px = parseFloat(cs.fontSize);
    return px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
  };

  const h1 = document.querySelector('h1');

  // En telefono el <nav> es el panel del menu: position:fixed y del alto de la
  // pantalla entera. Medir SU caja daria que todo el follaje lo invade, que es
  // falso -esta oculto- y ademas taparia invasiones de verdad. Ahi lo que vive
  // en la barra es el boton, y eso es lo que hay que proteger.
  const menu = document.querySelector('header nav');
  const enLaBarra = menu && getComputedStyle(menu).position !== 'fixed';
  const boton = document.querySelector('header button');

  const zonas = {
    nombre: caja(h1),
    statement: caja(h1.nextElementSibling),
    ubicacion: caja(h1.nextElementSibling.nextElementSibling),
    marca: caja(document.querySelector('header a')),
    ...(enLaBarra ? { nav: caja(menu) } : { boton: caja(boton) }),
  };

  const aire = ${AIRE};
  const invasion = {};
  const imagenes = [...document.querySelectorAll('section > div')]
    .filter((d) => !d.className.includes('campo'))
    .map((d) => d.querySelector('img'))
    .filter(Boolean);

  for (const img of imagenes) {
    const id = decodeURIComponent(img.getAttribute('src'))
      .split('/hero/')[1].split('.webp')[0];
    const c = img.getBoundingClientRect();
    const ex = img.naturalWidth / c.width;
    const ey = img.naturalHeight / c.height;

    for (const [nz, z] of Object.entries(zonas)) {
      if (!z) continue;
      const x0 = Math.max(c.x, z.x - aire), y0 = Math.max(c.y, z.y - aire);
      const x1 = Math.min(c.right, z.r + aire), y1 = Math.min(c.bottom, z.b + aire);
      if (x1 <= x0 || y1 <= y0) continue;

      const sw = Math.max(1, Math.round((x1 - x0) * ex));
      const sh = Math.max(1, Math.round((y1 - y0) * ey));
      const W = Math.min(sw, 300), H = Math.min(sh, 300);
      const lienzo = document.createElement('canvas');
      lienzo.width = W; lienzo.height = H;
      const g = lienzo.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, (x0 - c.x) * ex, (y0 - c.y) * ey, sw, sh, 0, 0, W, H);
      const d = g.getImageData(0, 0, W, H).data;
      let maximo = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > maximo) maximo = d[i];
      const a = maximo / 255;
      if (a > ${UMBRAL}) {
        const clave = id + ' invade ' + nz;
        invasion[clave] = Math.max(invasion[clave] ?? 0, a);
      }
    }
  }

  const flojos = {};
  const aEvaluar = [
    ['nombre', h1],
    ['statement', h1.nextElementSibling],
    ['ubicacion', h1.nextElementSibling.nextElementSibling],
    ['marca', document.querySelector('header a')],
    // los del menu solo cuando se ven: con el panel cerrado heredan
    // visibility:hidden y medirles el contraste seria medir contra un fondo
    // que nadie tiene delante
    ...[...document.querySelectorAll('header nav a')]
      .filter((a) => getComputedStyle(a).visibility !== 'hidden')
      .map((a, i) => ['nav ' + i, a]),
  ];
  for (const [n, el] of aEvaluar) {
    if (!el) continue;
    const c = contraste(el);
    const minimo = grande(el) ? 3 : 4.5;
    if (c < minimo) flojos[n] = c + ' < ' + minimo;
  }

  return JSON.stringify({
    ventana: { w: innerWidth, h: innerHeight },
    desborde: document.documentElement.scrollWidth > innerWidth + 1,
    fuenteNombre: getComputedStyle(h1).fontSize,
    lineasNombre: Math.round(h1.getBoundingClientRect().height /
      parseFloat(getComputedStyle(h1).lineHeight)),
    invasion, flojos,
  });
})()`;

class Sesion {
  #ws;
  #id = 0;
  #pendientes = new Map();

  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      const resolver = this.#pendientes.get(m.id);
      if (resolver) {
        this.#pendientes.delete(m.id);
        resolver(m.result);
      }
    });
  }

  enviar(method, params = {}) {
    const id = (this.#id += 1);
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok) => this.#pendientes.set(id, ok));
  }
}

async function conectar() {
  const chrome = spawn(
    `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      `--remote-debugging-port=${PUERTO}`,
      `--user-data-dir=${process.env.TEMP}\\perfil-revisar`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let objetivo = null;
  for (let i = 0; i < 80 && !objetivo; i += 1) {
    await esperar(250);
    try {
      const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
      objetivo = lista.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
    } catch {
      /* Chrome todavia no abrio el puerto */
    }
  }
  if (!objetivo) throw new Error("no se pudo hablar con Chrome");

  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
  return { chrome, sesion: new Sesion(ws) };
}

async function medios(sesion, quieto) {
  await sesion.enviar("Emulation.setEmulatedMedia", {
    features: [
      {
        name: "prefers-reduced-motion",
        value: quieto ? "reduce" : "no-preference",
      },
    ],
  });
}

async function capturar(sesion, archivo) {
  const { data } = await sesion.enviar("Page.captureScreenshot", { format: "png" });
  await writeFile(join(SALIDA, archivo), Buffer.from(data, "base64"));
}

async function principal() {
  await mkdir(SALIDA, { recursive: true });
  const { chrome, sesion } = await conectar();
  await sesion.enviar("Page.enable");
  await sesion.enviar("Runtime.enable");

  let problemas = 0;

  await medios(sesion, true);
  for (const v of VISTAS) {
    await sesion.enviar("Emulation.setDeviceMetricsOverride", {
      width: v.w,
      height: v.h,
      deviceScaleFactor: 1,
      mobile: v.movil,
    });
    await sesion.enviar("Page.navigate", { url: URL_BASE });
    await esperar(1900);

    await capturar(sesion, `hero-${v.n}.png`);

    const { result } = await sesion.enviar("Runtime.evaluate", {
      expression: MEDIR,
      returnByValue: true,
    });
    const m = JSON.parse(result.value);

    const avisos = Object.entries(m.invasion).map(
      ([k, a]) => `${k}  (alfa ${a.toFixed(2)})`,
    );
    for (const [k, v] of Object.entries(m.flojos)) {
      avisos.push(`contraste flojo en ${k}: ${v}`);
    }
    if (m.desborde) avisos.unshift("DESBORDE HORIZONTAL");
    problemas += avisos.length;

    console.log(
      `${v.n.padEnd(11)} nombre ${m.fuenteNombre.padStart(7)} en ${m.lineasNombre} linea(s)  ` +
        (avisos.length ? `\n   x ${avisos.join("\n   x ")}` : "limpio"),
    );
  }

  // una con movimiento, para ver la entrada y los petalos
  await medios(sesion, false);
  await sesion.enviar("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sesion.enviar("Page.navigate", { url: URL_BASE });
  await esperar(3400);
  await capturar(sesion, "hero-animado-1440x900.png");

  console.log(problemas === 0 ? "\nSIN INVASIONES" : `\n${problemas} a revisar`);
  chrome.kill();
}

await principal();
