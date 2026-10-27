// Genera docs/historias.md y docs/encuentros.md a partir de los datos del juego (no se editan a mano).
// Uso:  node herramientas/generar_catalogo.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const archivos = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]).filter(p => ['js/datos/', 'js/config/', 'js/motor/'].some(c => p.startsWith(c)));
const ctx = vm.createContext({ console, Math, Date, JSON });
for (const a of archivos) vm.runInContext(fs.readFileSync(path.join(RAIZ, a), 'utf8'), ctx, { filename: a });
const run = c => vm.runInContext(c, ctx);
const RI = { food: '🌾', prod: '⚒', gold: '🪙', tech: '🔬' };
const UNP = run('UN'), EQ = run('EQUIP_N'), RES = run('RES'), TI = run('TRAIT_INFO'), BT = run('BT');
const costo = c => c ? `${RI[c.res]} ${c.n}` : 'sin costo';
function gana(g) {
  if (!g) return '—'; const p = [];
  if (g.units) p.push(Object.keys(g.units).map(t => `${g.units[t]} ${UNP[t].toLowerCase()}`).join(' + '));
  if (g.res) p.push(`${RI[g.res]} +${g.n}`);
  if (g.eq) p.push(Object.keys(g.eq).map(t => `🛠 ${g.eq[t]} ${EQ[t][g.eq[t] > 1 ? 1 : 0]}`).join(' + '));
  if (g.prog) p.push(`👶 +${g.prog} de crecimiento`);
  if (g.rel) p.push('🤝 +1 de relación con la tribu vecina');
  if (g.tpob) p.push('🌟 poblador extraordinario (' + g.tpob.map(x => `${TI[x.k].n} ${x.l > 0 ? '+' : ''}${x.l}`).join(', ') + ')');
  if (g.saber) p.push(`📜 una tecnología gratis (hasta nivel ${g.saber})`);
  if (g.bld) p.push(`🏠 un ${BT[g.bld].n} ya construido`);
  if (g.tres) p.push(`💎 ${RES[g.tres.key].n} durante 40 pasos`);
  if (g.gamble) p.push(`🎲 ${Math.round(g.gamble.p * 100)} %: ${RI[g.gamble.res]} +${g.gamble.n}`);
  return p.join(' + ');
}
// ---- historias ----
const S = run('STORIES'), ids = run('STORY_IDS');
let h = `# Historias de 4 capítulos\n\nGenerado por \`node herramientas/generar_catalogo.js\` a partir de \`js/motor/historias.js\` y \`js/datos/historias_extra.js\` (**no se edita a mano**). Hay **${ids.length} historias**; los costos y las ganancias de recursos crecen con la partida, como en los encuentros (aquí se ven los montos básicos). Cada jugador vive varias por partida, una tras otra y sin repetir (hasta 4; lo normal son 2 o 3): el capítulo 1 de la primera llega hacia el paso 10, los demás cada 8 pasos, y entre una historia y la siguiente hay un descanso de 6 a 10 pasos. Siempre son oportunidades: dejarlo pasar no cuesta nada ni castiga. Lo que eliges en cada capítulo cambia el siguiente y el final (cada historia tiene dos caminos, marcados con una letra).\n\n`;
ids.forEach((id, k) => {
  const st = S[id], [a, b] = st.tags; h += `## ${k + 1}. «${st.n}»  (caminos: ${a} / ${b})\n\n`;
  const ops = os => os.map(o => `- (${o.t}) **${o.lbl}** — cuesta ${costo(o.cost)} → ${gana(o.gain)}`).join('\n') + '\n\n';
  h += `**Capítulo 1.** ${st[1].txt}\n` + ops(st[1].opts);
  [2, 3].forEach(c => st.tags.forEach(t => { h += `**Capítulo ${c}, si vienes del camino ${t}.** ${st[c][t].txt}\n` + ops(st[c][t].opts); }));
  st.tags.forEach(t => { h += `**Capítulo 4, final del camino ${t}.** ${st[4].txt[t]}\n` + st[4].opts.map(o => `- **${o.lbl}** — cuesta ${costo(o.cost)} → ${gana(o.g[t])}`).join('\n') + '\n\n'; });
});
fs.writeFileSync(path.join(RAIZ, 'docs', 'historias.md'), h);
// ---- encuentros ----
const E = run('ENCOUNTERS'), C = run('CHOICES'), nv = run('ENC_VARIANTS');
const T = run('TERRN');
let e = `# Encuentros\n\nGenerado por \`node herramientas/generar_catalogo.js\` a partir de \`js/motor/encuentros.js\` y \`js/datos/encuentros_extra.js\` (**no se edita a mano**). Llegan sin aviso a una de tus zonas, de preferencia de frontera. Son siempre oportunidades: rechazar o no responder no cuesta nada. Los montos que se ven son los básicos y crecen con la partida.\n\n- **${E.length} encuentros base** (${E.filter(x => x.k === 'oferta').length} ofertas y ${E.filter(x => x.k === 'apuesta').length} apuestas), con **${nv} variantes** de quién llega.\n- **${C.length} encuentros de elegir entre dos**, con **${C.reduce((a, x) => a + x.who.length, 0)} variantes**.\n- Los **tratos entre jugadores** llegan también como encuentro (ver las Reglas, sección 24).\n\n## Encuentros base\n\n| # | Tipo | Quién llega | Qué pasa | Piden | Dan | Terreno |\n|---|---|---|---|---|---|---|\n`;
E.forEach((x, i) => { e += `| ${i + 1} | ${x.k} | ${x.who.join(' / ')} | ${x.txt} | ${costo(x.cost)} | ${gana(x.gain)} | ${x.terr ? x.terr.map(t => T[t]).join(', ') : 'todos'} |\n`; });
e += `\n## Elegir entre dos\n\n| # | Quién llega | Qué pasa | Opción A | Opción B |\n|---|---|---|---|---|\n`;
C.forEach((x, i) => { e += `| ${i + 1} | ${x.who.join(' / ')} | ${x.txt} | **${x.opts[0].lbl}** (${costo(x.opts[0].cost)} → ${gana(x.opts[0].gain)}) | **${x.opts[1].lbl}** (${costo(x.opts[1].cost)} → ${gana(x.opts[1].gain)}) |\n`; });
fs.writeFileSync(path.join(RAIZ, 'docs', 'encuentros.md'), e);
console.log(`${ids.length} historias → docs/historias.md; ${E.length} encuentros y ${C.length} de elegir entre dos → docs/encuentros.md`);
