// Revisa lo que necesita el juego en línea: que el estado de una partida se pueda mandar por la
// red (JSON) y, al reconstruirlo en otra pantalla, siga exactamente igual que el original.
//
// Uso:   node pruebas/probar_red.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const archivos = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => /^js\/(datos|config|motor)\//.test(p));
const ctx = vm.createContext({ console, Math, Date, JSON });
archivos.forEach(a => vm.runInContext(fs.readFileSync(path.join(RAIZ, a), 'utf8'), ctx, { filename: a }));

// Las mismas funciones que usa js/red/multijugador.js para mandar y reconstruir el estado.
vm.runInContext(`
function snapshot(G){ const c={}; for(const k in G){ if(k!=='rng'&&k!=='map') c[k]=G[k]; } c.rngState=G.rng.state(); return JSON.stringify(c); }
function restore(txt){ const g=JSON.parse(txt); g.rng=mulberry32(g.rngState); delete g.rngState; g.map=DATA.maps[g.mapIdx].v[String(g.N)]; return g; }
function step(g){ const o=[]; for(let f=0;f<g.N;f++) botOrders(g,f).forEach(x=>o.push(x)); resolveStep(g,o); recomputeMods(g); }
function huella(g){ const c={}; for(const k in g){ if(k!=='rng'&&k!=='map') c[k]=g[k]; } c.r=g.rng.state(); return JSON.stringify(c); }
`, ctx);

let fallas = 0, casos = 0;
for (const mapa of [0, 3, 7]) for (const N of [2, 4]) for (const corte of [1, 6, 15]) {
  casos++;
  const r = vm.runInContext(`(()=>{
    const a=newGame(${mapa},${N},${1000 + mapa * 10 + N},'normal');
    for(let s=1;s<${corte}&&!a.over;s++) step(a);
    const txt=snapshot(a), b=restore(txt);
    if(huella(a)!==huella(b)) return 'distinto justo después de reconstruir';
    for(let s=0;s<15&&!a.over;s++){ step(a); step(b); if(huella(a)!==huella(b)) return 'se separan en el paso '+a.step; }
    return 'ok '+Math.round(txt.length/1024)+' KB';
  })()`, ctx);
  if (!r.startsWith('ok')) { fallas++; console.log(`✗ mapa ${mapa}, ${N} jugadores, corte en el paso ${corte}: ${r}`); }
  else console.log(`✓ mapa ${mapa}, ${N} jugadores, corte en el paso ${corte}: ${r}`);
}
console.log(fallas ? `\n${fallas} de ${casos} casos fallaron.` : `\nEstado de red en orden: ${casos} casos siguen idénticos después de mandarse.`);
process.exit(fallas ? 1 : 0);
