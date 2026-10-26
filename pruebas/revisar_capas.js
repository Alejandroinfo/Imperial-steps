// Revisa la regla de capas del proyecto: datos → config → motor → interfaz.
// El motor y la configuración no pueden tocar la pantalla ni el navegador, para que se
// puedan probar en Node y pasar a Python sin reescribir las reglas.
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const CAPAS_PURAS = ['js/datos', 'js/config', 'js/motor'];
const PROHIBIDO = [
  [/\bdocument\./, 'usa document (la página)'],
  [/\bwindow\./, 'usa window (el navegador)'],
  [/\binnerHTML\b/, 'escribe HTML'],
  [/\bui\.[a-zA-Z]/, 'lee el estado de la interfaz (ui)'],
  [/<(svg|g|rect|circle|path|polygon|div|span)[\s>]/, 'genera SVG o HTML'],
];

let errores = 0;
for (const capa of CAPAS_PURAS) {
  for (const archivo of fs.readdirSync(path.join(RAIZ, capa)).filter(f => f.endsWith('.js'))) {
    const rel = `${capa}/${archivo}`;
    fs.readFileSync(path.join(RAIZ, rel), 'utf8').split('\n').forEach((linea, i) => {
      if (linea.trim().startsWith('//')) return;
      for (const [re, motivo] of PROHIBIDO) {
        if (re.test(linea)) { errores++; console.log(`✗ ${rel}:${i + 1} ${motivo}`); }
      }
    });
  }
}
console.log(errores ? `\n${errores} problemas de capas.` : 'Capas en orden: datos, config y motor no dependen de la interfaz.');
process.exit(errores ? 1 : 0);
