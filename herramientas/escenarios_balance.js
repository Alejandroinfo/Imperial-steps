// Compara escenarios de balance: cada uno cambia algunas reglas y corre partidas entre bots.
// Mide ritmo (población, tecnologías), tensión (tropas, combates, conquistas) y final (victorias).
// Uso:  node herramientas/escenarios_balance.js [semillas] [pasos]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const archivos = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => ['js/datos/', 'js/config/', 'js/motor/'].some(c => p.startsWith(c)));

// Cada escenario: nombre, cambios en el código fuente (texto → texto) y código extra después de cargar.
const ESCENARIOS = [
  { n: 'Actual', src: [], extra: '' },
  { n: 'Capital +4', src: [['const CAPITAL_BONUS = 2;', 'const CAPITAL_BONUS = 4;']], extra: '' },
  { n: 'Agricultor +3', src: [], extra: `const _cm=computeMods; computeMods=(g,f)=>{ const M=_cm(g,f); M.agrFood+=1; return M; };` },
  { n: 'Crecer más barato', src: [], extra: `growCost=(g,f,z)=>{ const M=g.M[f]; let c=4+2*z.size-M.growSub; if(M.growHalf) c=Math.ceil(c/2); if(g.growHalfEv) c=Math.ceil(c/2); return Math.max(1,c); };` },
  { n: 'Poblador da 2 de comida', src: [], extra: `const _cm=computeMods; computeMods=(g,f)=>{ const M=_cm(g,f); M.pobFood+=1; return M; };` },
  { n: 'Poblador 2 y agricultor 3', src: [], extra: `const _cm=computeMods; computeMods=(g,f)=>{ const M=_cm(g,f); M.pobFood+=1; M.agrFood+=1; return M; };` },
  { n: 'Poblador 2, agricultor 3 y capital +4', src: [['const CAPITAL_BONUS = 2;', 'const CAPITAL_BONUS = 4;']], extra: `const _cm=computeMods; computeMods=(g,f)=>{ const M=_cm(g,f); M.pobFood+=1; M.agrFood+=1; return M; };` },
  { n: 'Agricultor +3 y crecer más barato', src: [], extra: `const _cm=computeMods; computeMods=(g,f)=>{ const M=_cm(g,f); M.agrFood+=1; return M; };
      growCost=(g,f,z)=>{ const M=g.M[f]; let c=4+2*z.size-M.growSub; if(M.growHalf) c=Math.ceil(c/2); if(g.growHalfEv) c=Math.ceil(c/2); return Math.max(1,c); };` },
];

function cargar(esc) {
  const ctx = vm.createContext({ console, Math, Date, JSON });
  archivos.forEach(a => { let code = fs.readFileSync(path.join(RAIZ, a), 'utf8'); esc.src.forEach(([x, y]) => { code = code.split(x).join(y); }); vm.runInContext(code, ctx, { filename: a }); });
  if (esc.extra) vm.runInContext(esc.extra, ctx);
  return ctx;
}
function jugar(ctx, mi, N, seed, pasos) {
  ctx.__a = { mi, N, seed, pasos };
  return vm.runInContext(`(() => { const a=__a, G=newGame(a.mi,a.N,a.seed,'normal'); const m={pop20:0,pop40:0,pop60:0,tec40:0,mil:0,combates:0,conquistas:0,gana:null};
    for(let s=1;s<=a.pasos&&!G.over;s++){ const o=[]; for(let f=0;f<G.N;f++) botOrders(G,f).forEach(x=>o.push(Object.assign({f},x))); resolveStep(G,o);
      const pop=[...Array(G.N).keys()].map(f=>totalPop(G,f)); const avg=pop.reduce((x,y)=>x+y,0)/G.N;
      if(s===20) m.pop20=avg; if(s===40){ m.pop40=avg; m.tec40=[...Array(G.N).keys()].reduce((x,f)=>x+Object.keys(G.F[f].techs).length-9,0)/G.N; } if(s===60) m.pop60=avg;
      for(let f=0;f<G.N;f++){ const mm=G.zones.reduce((x,z)=>x+(z.units[f]||[]).filter(u=>!UT[u.t].civ).length,0); if(mm>m.mil) m.mil=mm; }
      G.log.forEach(l=>{ if(l.startsWith('Combate')) m.combates++; if(l.includes(' conquista ')) m.conquistas++; }); }
    if(G.over) m.gana=G.step-1; return m; })()`, ctx);
}
const semillas = Number(process.argv[2] || 2), pasos = Number(process.argv[3] || 60);
const filas = [];
for (const esc of ESCENARIOS) {
  const ctx = cargar(esc); const R = []; 
  for (let mi = 0; mi < 12; mi++) for (let s = 1; s <= semillas; s++) R.push(jugar(ctx, mi, 3, 100 * mi + s, pasos));
  const avg = k => (R.reduce((a, r) => a + (r[k] || 0), 0) / R.length);
  const ganadas = R.filter(r => r.gana);
  filas.push([esc.n, avg('pop20').toFixed(1), avg('pop40').toFixed(1), avg('pop60').toFixed(1), avg('tec40').toFixed(1), avg('mil').toFixed(1), avg('combates').toFixed(1), avg('conquistas').toFixed(1), `${ganadas.length}/${R.length}` + (ganadas.length ? ` (paso ${Math.round(ganadas.reduce((a, r) => a + r.gana, 0) / ganadas.length)})` : '')]);
}
const cab = ['Escenario', 'Pob. paso 20', 'Pob. paso 40', 'Pob. paso 60', 'Tecnologías nuevas (paso 40)', 'Máx. tropas', 'Combates', 'Conquistas', 'Partidas ganadas'];
console.log('| ' + cab.join(' | ') + ' |\n|' + cab.map(() => '---').join('|') + '|');
filas.forEach(f => console.log('| ' + f.join(' | ') + ' |'));
