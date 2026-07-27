// Mide lo que el hero le cuesta al navegador mientras los petalos caen.
//   node scripts/rendimiento.mjs [url]
//
// Lo que importa: que el bucle de petalos no toque el layout. Si LayoutCount
// crece mientras corre, algo esta escribiendo geometria y no solo transform.

import { spawn } from "node:child_process";
import { setTimeout as esperar } from "node:timers/promises";

const URL_BASE = process.argv[2] ?? "http://localhost:3210";
const PUERTO = 9334;

const MEDIR_FPS = `new Promise((ok) => {
  let cuadros = 0;
  const inicio = performance.now();
  const contar = () => {
    cuadros += 1;
    if (performance.now() - inicio < 3000) requestAnimationFrame(contar);
    else ok(JSON.stringify({
      fps: +(cuadros / ((performance.now() - inicio) / 1000)).toFixed(1),
      cls: +(window.__cls ?? 0).toFixed(4),
    }));
  };
  requestAnimationFrame(contar);
})`;

const OBSERVAR_CLS = `window.__cls = 0;
new PerformanceObserver((l) => {
  for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
}).observe({ type: 'layout-shift', buffered: true });`;

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
    "--hide-scrollbars",
    `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${process.env.TEMP}\\perfil-rendimiento`,
    "--window-size=1440,900",
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

await s.enviar("Page.enable");
await s.enviar("Runtime.enable");
await s.enviar("Performance.enable");
await s.enviar("Network.enable");
await s.enviar("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await s.enviar("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVAR_CLS });

const pedidos = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.method === "Network.responseReceived") {
    pedidos.push({
      url: m.params.response.url,
      tipo: m.params.type,
      bytes: m.params.response.encodedDataLength,
      mime: m.params.response.mimeType,
    });
  }
});

await s.enviar("Page.navigate", { url: URL_BASE });
await esperar(4000); // que termine la entrada y arranquen los petalos

const antes = Object.fromEntries(
  (await s.enviar("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
);
const { result } = await s.enviar("Runtime.evaluate", {
  expression: MEDIR_FPS,
  awaitPromise: true,
  returnByValue: true,
});
const despues = Object.fromEntries(
  (await s.enviar("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]),
);

const { fps, cls } = JSON.parse(result.value);
console.log(`fps con petalos cayendo   ${fps}`);
console.log(`layouts en esos 3 s       ${despues.LayoutCount - antes.LayoutCount}`);
console.log(`recalculos de estilo      ${despues.RecalcStyleCount - antes.RecalcStyleCount}`);
console.log(`CLS acumulado             ${cls}`);

const img = pedidos.filter((p) => p.mime.startsWith("image/"));
const total = pedidos.reduce((a, p) => a + p.bytes, 0);
console.log(`\ntransferido               ${(total / 1024).toFixed(0)} KB en ${pedidos.length} pedidos`);
console.log(`  imagenes                ${(img.reduce((a, p) => a + p.bytes, 0) / 1024).toFixed(0)} KB en ${img.length}`);
const formatos = [...new Set(img.map((p) => p.mime))];
console.log(`  formatos servidos       ${formatos.join(", ") || "ninguno"}`);

chrome.kill();
