// Captura una pagina a varias alturas de scroll.
//
//   node scripts/capturar.mjs /bio 1440x900 0 0.25 0.5 0.75 1
//
// El ultimo argumento puede ser "quieto" para emular prefers-reduced-motion.
// Sirve para revisar cualquier seccion que dependa del scroll, no solo la bio.

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as esperar } from "node:timers/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(AQUI, "_capturas");
const PUERTO = 9335;
const BASE = process.env.URL_BASE ?? "http://localhost:3210";

const args = process.argv.slice(2);
const quieto = args.includes("quieto");
// con "tiempos" los numbers son milisegundos desde que carga, no fracciones de
// scroll: sirve para mirar una secuencia de entrada cuadro por cuadro
const porTiempo = args.includes("tiempos");
const resto = args.filter((a) => a !== "quieto" && a !== "tiempos");
const ruta = resto[0] ?? "/";
const [ancho, alto] = (resto[1] ?? "1440x900").split("x").map(Number);
const posiciones = resto.slice(2).map(Number);
if (posiciones.length === 0) posiciones.push(0, 0.5, 1);

class Sesion {
  #ws;
  #id = 0;
  #pendientes = new Map();
  constructor(ws) {
    this.#ws = ws;
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      const r = this.#pendientes.get(m.id);
      if (r) {
        this.#pendientes.delete(m.id);
        r(m.result);
      }
    });
  }
  enviar(method, params = {}) {
    const id = (this.#id += 1);
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok) => this.#pendientes.set(id, ok));
  }
}

const chrome = spawn(
  `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
  [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${process.env.TEMP}\\perfil-capturar`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let objetivo = null;
for (let i = 0; i < 80 && !objetivo; i += 1) {
  await esperar(250);
  try {
    const l = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json();
    objetivo = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
  } catch {
    /* todavia no */
  }
}
const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
await new Promise((ok) => ws.addEventListener("open", ok, { once: true }));
const s = new Sesion(ws);

await mkdir(SALIDA, { recursive: true });
await s.enviar("Page.enable");
await s.enviar("Runtime.enable");
await s.enviar("Emulation.setEmulatedMedia", {
  features: [
    {
      name: "prefers-reduced-motion",
      value: quieto ? "reduce" : "no-preference",
    },
  ],
});
await s.enviar("Emulation.setDeviceMetricsOverride", {
  width: ancho,
  height: alto,
  deviceScaleFactor: 1,
  mobile: ancho < 700,
});
const slug =
  (ruta === "/" ? "inicio" : ruta.replace(/\//g, "")) +
  (quieto ? "-quieto" : "") +
  `-${ancho}x${alto}`;

if (porTiempo) {
  for (const ms of posiciones) {
    // recarga limpia por cada instante: la entrada corre una sola vez
    await s.enviar("Page.navigate", { url: BASE + ruta });
    await s.enviar("Page.navigate", { url: "about:blank" });
    await s.enviar("Page.navigate", { url: BASE + ruta });
    await esperar(ms);
    const { data } = await s.enviar("Page.captureScreenshot", { format: "png" });
    const nombre = `${slug}-t${String(ms).padStart(4, "0")}.png`;
    await writeFile(join(SALIDA, nombre), Buffer.from(data, "base64"));
    console.log(`${nombre}   ${ms} ms desde la carga`);
  }
  chrome.kill();
  process.exit(0);
}

await s.enviar("Page.navigate", { url: BASE + ruta });
await esperar(2600);

for (const p of posiciones) {
  const { result } = await s.enviar("Runtime.evaluate", {
    expression: `(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = Math.round(max * ${p});
      scrollTo({ top: y, behavior: 'instant' });
      return JSON.stringify({ y, max, alto: document.documentElement.scrollHeight });
    })()`,
    returnByValue: true,
  });
  // el scrub pasa por resorte: hay que dejarlo asentar antes de disparar
  await esperar(1100);
  const { data } = await s.enviar("Page.captureScreenshot", { format: "png" });
  const nombre = `${slug}-${String(Math.round(p * 100)).padStart(3, "0")}.png`;
  await writeFile(join(SALIDA, nombre), Buffer.from(data, "base64"));
  const m = JSON.parse(result.value);
  console.log(`${nombre}   scroll ${m.y} de ${m.max}  (pagina ${m.alto}px)`);
}

chrome.kill();
