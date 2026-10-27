// Balance de tecnologías: mide cuánto aporta cada una con las reglas actuales.
//  - Económicas: ganancia por paso en tres imperios de referencia (temprano, medio, avanzado)
//    y cuántos pasos tarda en recuperar su costo.
//  - Militares: cambio en el % de victorias en batallas idénticas con y sin la tecnología.
// Escribe la tabla completa en docs/balance_tecnologias.md
// Uso:  node herramientas/balance_tecnologias.js [batallas]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const ctx = vm.createContext({ console, Math, Date, JSON });
[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(p => /js\/(datos|config|motor)\//.test(p))
  .forEach(a => vm.runInContext(fs.readFileSync(path.join(RAIZ, a), 'utf8'), ctx, { filename: a }));
ctx.__BATALLAS = Number(process.argv[2] || 300);
const res = vm.runInContext(`(() => {
  const civ=(G,t)=>mkUnit(G,0,t);
  // Imperios de referencia: misma partida, distintas etapas.
  function imperio(etapa){
    const G=newGame(0,3,7,'normal'); G.evq=[]; const cap=G.zones.find(z=>z.capital&&z.owner===0);
    const vac=G.zones.filter(z=>z.owner===null&&z.role==='vacia').slice(0,2);
    const set=(z,lista)=>{ z.owner=0; z.units[0]=[]; Object.keys(lista).forEach(t=>{ for(let i=0;i<lista[t];i++) z.units[0].push(civ(G,t)); }); };
    if(etapa==='temprano'){ set(cap,{agr:2,pob:2,cie:1}); cap.size=5; cap.b=[{t:'molino',l:1,s:null,wk:0,cost:20}]; }
    if(etapa==='medio'){ cap.size=9; set(cap,{agr:3,ing:3,com:2,cie:2,pob:2,sol:2,arq:1}); cap.b=['molino','taller','mercado'].map(t=>({t,l:1,s:null,wk:0,cost:20}));
      set(vac[0],{agr:4,pob:1}); vac[0].size=5; vac[0].b=[{t:'almacen',l:1,s:null,wk:0,cost:20}]; }
    if(etapa==='avanzado'){ cap.size=12; set(cap,{agr:4,ing:5,com:3,cie:3,pob:2,sol:3,arq:2,esc:1}); cap.b=['molino','taller','mercado','biblio'].map(t=>({t,l:2,s:null,wk:0,cost:60}));
      set(vac[0],{agr:5,pob:1}); vac[0].size=6; vac[0].b=['almacen','molino'].map(t=>({t,l:1,s:null,wk:0,cost:20}));
      set(vac[1],{com:4,pob:1}); vac[1].size=5; vac[1].b=[{t:'mercado',l:1,s:null,wk:0,cost:20}]; }
    cap.food=20; cap.prod=20; G.F[0].tech=60; G.F[0].gold=40; recomputeMods(G);
    // un paso previo para que existan los datos del último paso
    const o=[]; resolveStep(G,o); return G;
  }
  const EMP={temprano:imperio('temprano'),medio:imperio('medio'),avanzado:imperio('avanzado')};
  const val=o=>(o.food||0)+(o.prod||0)+(o.gold||0)+(o.tech||0);

  // Batallas: dos ejércitos mixtos iguales; el jugador 0 tiene la tecnología. Se pelea hasta que uno quede solo.
  const EJ=['sol','sol','arq','arq','esc','cab','ber'];
  const EXTRA=['sol','ber'];
  function batallas(name, terrenos, defensa){
    let gan=0, tot=0;
    for(const terr of terrenos) for(let k=0;k<__BATALLAS/terrenos.length;k++){
      const G=newGame(0,2,1000+k,"normal"); G.evq=[]; G.fx=[]; G.battles=[]; if(name) G.F[0].techs[name]=1; recomputeMods(G); G.rng=mulberry32(5000+k*7+terr.length);
      const z=G.zones.find(z=>z.owner===null); z.terrain=terr; G.zones.forEach(x=>{ x.units={}; });
      const mk=f=>EJ.map(t=>{ const u=mkUnit(G,f,t); u.str=4; return u; });
      z.units[0]=mk(0); z.units[1]=mk(1); z.owner=defensa?0:null;
      // defendiendo: Fortificación en el nivel que permiten las tecnologías; el atacante trae más tropas para que quede parejo
      if(defensa){ z.b=[{t:'fort',l:Math.max(1,capLevel(G,0,'fort')),s:null,wk:2,cost:20}]; EXTRA.forEach(t=>{ const u=mkUnit(G,1,t); u.str=4; z.units[1].push(u); }); }
      for(let r=0;r<8;r++){ const facs=presentF(z); if(facs.length<2) break; fightZone(G,z,facs,{0:true,1:true},()=>{}); }
      const a=(z.units[0]||[]).length, b=(z.units[1]||[]).length; if(a>b) gan++; else if(a===b) gan+=0.5; tot++;
    }
    return 100*gan/tot;
  }
  const TERR=['mon','pra','bos','rio','col','lla'];
  const base={ataque:batallas(null,TERR,false), defensa:batallas(null,TERR,true)};
  const out=[];
  TECHS.forEach(t=>{
    const row={n:t.n,l:t.l,r:t.r,t:t.t,v:t.v,impl:t.impl,cost:20*t.l,val:t.val,rk:t.rk};
    const imps=['temprano','medio','avanzado'].map(e=>{ const G=EMP[e]; const had=!!G.F[0].techs[t.n]; if(had) return null; const r=techImpact(G,0,t.n); return r; });
    row.eco=imps.map(r=>r?val(r.out):0); row.store=imps.map(r=>r&&r.out.store||0);
    row.grow=imps.map(r=>r&&r.growth?r.growth.cost0-r.growth.cost1:0);
    if(t.t==='Militar'&&t.impl){ row.atk=batallas(t.n,TERR,false)-base.ataque; row.def=batallas(t.n,TERR,true)-base.defensa; }
    out.push(row);
  });
  return {out,base};
})()`, ctx);

// ---------- informe ----------
const R = res.out;
const best = r => Math.max(...r.eco);
const payback = r => best(r) > 0 ? Math.round(r.cost / best(r)) : null;
const INICIALES=new Set(['Almacenes','Caminos','Hospitales','Cuarteles','Fortificaciones','Bibliotecas','Molinos','Talleres','Mercados']);
function veredicto(r) {
  if (INICIALES.has(r.n)) return 'viene de inicio';
  if (!r.impl) return 'sin efecto simulado';
  const pb = payback(r), mil = r.atk !== undefined ? Math.max(Math.abs(r.atk), Math.abs(r.def)) : 0;
  if (pb !== null) { if (pb <= 5) return '⚠ muy fuerte'; if (pb <= 15) return 'fuerte'; if (pb <= 40) return 'normal'; return 'débil'; }
  if (r.atk !== undefined) { if (mil >= 25) return '⚠ muy fuerte'; if (mil >= 10) return 'fuerte'; if (mil >= 3) return 'normal'; return 'situacional (no se nota en batalla)'; }
  if (r.store.some(x => x) || r.grow.some(x => x)) return 'normal (almacén o crecimiento)';
  return 'situacional (no medible así)';
}
const cont = {}; R.forEach(r => { const v = veredicto(r); cont[v] = (cont[v] || 0) + 1; });
let md = `# Balance de tecnologías (simulación)\n\nGenerado por \`herramientas/balance_tecnologias.js\` con las reglas actuales. Fecha: ${new Date().toISOString().slice(0, 10)}.\n\n`;
md += `**Cómo se mide**\n\n- **Económicas:** la tecnología se aplica a tres imperios de referencia (temprano: 5 personas; medio: unas 20 en 2 zonas; avanzado: unas 35 en 3 zonas) y se mide la ganancia de un paso (comida + producción + oro + ciencia). Si mejora un edificio que ya existe, se cuenta como mejorado. **Pasos para recuperar** = costo en ciencia ÷ mejor ganancia por paso.\n- **Militares:** ${ctx.__BATALLAS} batallas por caso entre dos ejércitos iguales (2 soldados, 2 arqueros, 1 escudero, 1 caballero, 1 berserker, fuerza 4) repartidas en los 6 terrenos, en campo abierto y defendiendo con la Fortificación al nivel que permiten las tecnologías (el atacante trae 2 tropas más para que el caso base quede parejo). Se informa cuántos puntos sube el % de victorias del que tiene la tecnología (sin tecnología: ${res.base.ataque.toFixed(0)} % y ${res.base.defensa.toFixed(0)} %).\n\n`;
md += `**Resumen:** ` + Object.entries(cont).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(' · ') + '.\n\n';
const fuertes = R.filter(r => veredicto(r).startsWith('⚠')), debiles = R.filter(r => veredicto(r) === 'débil');
md += `## Las más fuertes (revisar primero)\n\n| Tecnología | Nivel | Costo | Ganancia por paso (temprano / medio / avanzado) | Pasos para recuperar | Combate (campo / defensa) |\n|---|---|---|---|---|---|\n`;
fuertes.sort((a, b) => (payback(a) || 999) - (payback(b) || 999)).forEach(r => { md += `| ${r.n} | ${r.l} | ${r.cost} | ${r.eco.join(' / ')} | ${payback(r) ?? '—'} | ${r.atk !== undefined ? `${r.atk >= 0 ? '+' : ''}${r.atk.toFixed(0)} / ${r.def >= 0 ? '+' : ''}${r.def.toFixed(0)}` : '—'} |\n`; });
md += `\n## Las más débiles\n\n| Tecnología | Nivel | Costo | Ganancia por paso | Pasos para recuperar |\n|---|---|---|---|---|\n`;
debiles.sort((a, b) => payback(b) - payback(a)).forEach(r => { md += `| ${r.n} | ${r.l} | ${r.cost} | ${r.eco.join(' / ')} | ${payback(r)} |\n`; });
md += `\n## Todas\n\n| Tecnología | Rama | Nivel | Costo | Ganancia por paso (T / M / A) | Recupera en | Almacén (+) | Crecer (−costo) | Combate campo | Combate defensa | Veredicto |\n|---|---|---|---|---|---|---|---|---|---|---|\n`;
R.slice().sort((a, b) => a.r.localeCompare(b.r) || a.l - b.l).forEach(r => { md += `| ${r.n} | ${r.r} | ${r.l} | ${r.cost} | ${r.eco.join(' / ')} | ${payback(r) ?? '—'} | ${Math.max(...r.store) || ''} | ${Math.max(...r.grow) || ''} | ${r.atk !== undefined ? (r.atk >= 0 ? '+' : '') + r.atk.toFixed(0) : ''} | ${r.def !== undefined ? (r.def >= 0 ? '+' : '') + r.def.toFixed(0) : ''} | ${veredicto(r)} |\n`; });
fs.writeFileSync(path.join(RAIZ, 'docs', 'balance_tecnologias.md'), md);
console.log('Resumen:', cont); console.log('Base de combate:', res.base);
console.log('Más fuertes:', fuertes.map(r => `${r.n} (${payback(r) ?? (r.atk.toFixed(0) + '/' + r.def.toFixed(0))})`).join(', '));
console.log('Más débiles:', debiles.slice(0, 15).map(r => `${r.n} (${payback(r)})`).join(', '));
