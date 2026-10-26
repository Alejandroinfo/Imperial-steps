// Corre partidas completas entre bots usando solo el motor (sin navegador) y revisa que
// el estado siga siendo válido después de cada paso.
//
// Uso:   node pruebas/simular_partidas.js            (12 mapas × 2, 3 y 4 jugadores, 2 semillas)
//        node pruebas/simular_partidas.js 10 60      (10 semillas por combinación, hasta 60 pasos)
//
// Sale con código 1 si encuentra un error, para poder usarlo en integración continua.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CARPETAS_MOTOR = ['js/datos/', 'js/config/', 'js/motor/'];

// Carga los archivos del motor en el mismo orden que index.html.
function cargarMotor() {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const archivos = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map(m => m[1])
    .filter(p => CARPETAS_MOTOR.some(c => p.startsWith(c)));
  const ctx = vm.createContext({ console, Math, Date, JSON });
  for (const a of archivos) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, a), 'utf8'), ctx, { filename: a });
  }
  return { ctx, archivos };
}

function revisar(G) {
  const errores = [];
  const ok = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;
  G.zones.forEach(z => {
    if (!ok(z.food) || !ok(z.prod)) errores.push(`zona ${z.id}: comida ${z.food}, producción ${z.prod}`);
    if (!ok(z.size)) errores.push(`zona ${z.id}: tamaño ${z.size}`);
    for (const f in z.units) z.units[f].forEach(u => {
      if (!ok(u.hp) || !ok(u.str)) errores.push(`zona ${z.id}: unidad ${u.t} con vida ${u.hp} y fuerza ${u.str}`);
    });
  });
  for (let f = 0; f < G.N; f++) {
    if (!ok(G.F[f].gold) || !ok(G.F[f].tech)) errores.push(`jugador ${f}: oro ${G.F[f].gold}, ciencia ${G.F[f].tech}`);
  }
  return errores;
}

function main() {
  const semillas = Number(process.argv[2] || 2);
  const maxPasos = Number(process.argv[3] || 40);
  const { ctx, archivos } = cargarMotor();
  console.log(`Motor cargado (${archivos.length} archivos).`);
  const run = code => vm.runInContext(code, ctx);
  const nMapas = run('DATA.maps.length');
  let partidas = 0, fallos = 0, ganadas = 0, pasosTot = 0;
  const combos = {};
  for (let mi = 0; mi < nMapas; mi++) for (const N of [2, 3, 4]) for (let s = 1; s <= semillas; s++) {
    ctx.__args = { mi, N, seed: 1000 * mi + 10 * N + s, maxPasos };
    let res;
    try {
      res = run(`(() => {
        const a = __args, G = newGame(a.mi, a.N, a.seed, 'prueba');
        while (!G.over && G.step <= a.maxPasos) {
          const ordenes = [];
          for (let f = 0; f < G.N; f++) botOrders(G, f).forEach(o => ordenes.push(Object.assign({ f }, o)));
          resolveStep(G, ordenes);
        }
        return G;
      })()`);
    } catch (e) {
      fallos++; console.log(`✗ mapa ${mi + 1}, ${N} jugadores, semilla ${s}: ${e.message}`); continue;
    }
    partidas++; pasosTot += res.step - 1;
    const errs = revisar(res);
    if (errs.length) { fallos++; console.log(`✗ mapa ${mi + 1}, ${N} jugadores: ${errs.slice(0, 3).join('; ')}`); }
    if (res.over && res.winner && res.winner.length) {
      ganadas++;
      ctx.__G = res;
      const conds = run(`victoryConds(__G, __G.winner[0]).filter(c => c.ok).map(c => c.k).join(' + ')`);
      combos[conds] = (combos[conds] || 0) + 1;
    }
  }
  const lista = Object.entries(combos).sort((a, b) => b[1] - a[1]);
  if (lista.length) { console.log('\nCon qué se ganó:'); lista.forEach(([k, n]) => console.log(`  ${k}: ${n}`)); }
  console.log(`\n${partidas} partidas, ${fallos} con errores, ${ganadas} con ganador, ${(pasosTot / Math.max(1, partidas)).toFixed(1)} pasos de media.`);
  process.exit(fallos ? 1 : 0);
}
main();
