// Casos concretos de las reglas: cada prueba arma una situación pequeña y revisa el resultado.
// Uso:  node pruebas/probar_reglas.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const archivos = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1])
  .filter(p => ['js/datos/', 'js/config/', 'js/motor/'].some(c => p.startsWith(c)));
const ctx = vm.createContext({ console, Math, Date, JSON });
archivos.forEach(a => vm.runInContext(fs.readFileSync(path.join(RAIZ, a), 'utf8'), ctx, { filename: a }));
const run = code => vm.runInContext(code, ctx);

let fallos = 0;
function prueba(nombre, codigo) {
  try { const r = run(`(() => { ${codigo} })()`); if (r === true) console.log('✓ ' + nombre); else { fallos++; console.log('✗ ' + nombre + ' → ' + JSON.stringify(r)); } }
  catch (e) { fallos++; console.log('✗ ' + nombre + ' → ' + e.message); }
}
// Partida base: mapa 1, 2 jugadores; la capital del jugador 0 sin eventos.
const base = `const G=newGame(0,2,1,'normal'); G.evq=[]; const cap=G.zones.find(z=>z.capital&&z.owner===0);
  const civ=t=>mkUnit(G,0,t); const paso=(o)=>resolveStep(G,(o||[]).map(x=>Object.assign({f:0},x)));`;

prueba('El almacén base es 10 por tamaño', base + `return capStore(G,cap,'food')===10*cap.size;`);

prueba('Con 4 de ciencia y 3 científicos, 2 investigan y 1 genera', base + `
  cap.units[0]=[civ('cie'),civ('cie'),civ('cie')]; G.F[0].tech=4; G.F[0].rq=[{name:'Arado',left:20,tot:20}];
  const p=researchPlan(G,0)[cap.id]; return p.sci===3&&p.n===2;`);

prueba('Sin nada en cola, ningún científico investiga', base + `
  cap.units[0]=[civ('cie'),civ('cie')]; G.F[0].tech=50; G.F[0].rq=[]; return researchPlan(G,0)[cap.id].n===0;`);

prueba('Una zona sin comida se alimenta de la zona propia más cercana', base + `
  const v=G.zones[cap.adj[0]]; v.owner=0; v.units[0]=[civ('sol'),civ('sol')]; v.food=0; cap.food=30;
  paso(); return (v.units[0]||[]).every(u=>u.hg===0)&&cap.food<30;`);

prueba('La capital da +2 de cada recurso (con 1 poblador)', base + `
  cap.units[0]=[civ('pob')]; G.F[0].gold=0; paso(); return cap.last.gold===2;`);

prueba('El arquero cuesta soldado + arco (1 + 2)', base + `return trainCost(G,0,cap,'arq',null,false)===3;`);

prueba('Con un arco guardado, el arquero cuesta solo el soldado', base + `
  cap.b.push({t:'cuartel',l:1,s:null,wk:0,cost:20}); G.F[0].techs['Arco']=1; cap.eq={arq:1}; cap.prod=10; cap.units[0]=[civ('pob')];
  paso([{t:'train',zone:cap.id,u:'arq',n:1,from:'pob'}]); return cap.units[0].some(u=>u.t==='arq')&&(cap.eq.arq||0)===0;`);

prueba('Sin tecnología de nivel 3, no se puede construir un segundo molino', base + `
  cap.size=6; cap.b.push({t:'molino',l:1,s:null,wk:0,cost:20}); paso([{t:'build',zone:cap.id,bt:'molino'}]);
  return cap.proj.filter(p=>p.bt==='molino').length===0;`);

prueba('Con una tecnología de nivel 3 del molino, sí se puede un segundo (nivel 3, +50 %: 30 × 3)', base + `
  cap.size=6; cap.b.push({t:'molino',l:1,s:null,wk:0,cost:20}); G.F[0].techs['Molino-granero']=1; recomputeMods(G);
  paso([{t:'build',zone:cap.id,bt:'molino'}]); const p=cap.proj.find(p=>p.bt==='molino'); return !!p&&p.lvl===3&&p.tot===90&&p.dup===1;`);

prueba('Dos edificios toman trabajadores distintos (sin perder a nadie)', base + `
  cap.size=6; cap.units[0]=[civ('pob'),civ('pob'),civ('pob'),civ('pob')];
  cap.b.push({t:'molino',l:1,s:null,wk:0,cost:20},{t:'taller',l:1,s:null,wk:0,cost:20}); paso();
  const b=cap.lastBy.blds; return b.length===2&&b.every(x=>x.wk===2)&&cap.lastBy.jobs.pob.n===4;`);

prueba('En Paz, dos jugadores conviven en una zona sin pelear', base + `
  const v=G.zones.find(z=>z.owner===null); v.units[0]=[civ('sol')]; v.units[1]=[mkUnit(G,1,'sol')];
  paso(); return (v.units[0]||[]).length===1&&(v.units[1]||[]).length===1;`);

prueba('Con Alerta hacia otro jugador, sus tropas pelean donde coinciden', base + `
  const v=G.zones.find(z=>z.owner===null); v.units[0]=[civ('sol'),civ('sol')]; v.units[1]=[mkUnit(G,1,'sol')];
  paso([{t:'stance',target:1,stance:'alerta'}]); return stanceOf(G,0,1)==='alerta'&&G.hist.some(h=>h.lines.some(l=>l.includes('Combate')));`);

prueba('Un edificio se construye en el nivel más alto desbloqueado y con su especialización', base + `
  cap.units[0]=[civ('con'),civ('con'),civ('con'),civ('con'),civ('con'),civ('con')]; cap.prod=40;
  G.F[0].techs['Molino de piedra']=1; G.F[0].techs['Molino-granero']=1; recomputeMods(G);
  paso([{t:'build',zone:cap.id,bt:'molino',spec:'granero'}]); const p=cap.proj.find(p=>p.bt==='molino');
  return !!p&&p.lvl===3&&p.tot===60&&p.spec==='granero';`);

prueba('Cada combate queda registrado golpe por golpe, por orden de iniciativa', base + `
  const v=G.zones.find(z=>z.owner===null); v.units[0]=[civ('sol'),civ('sol'),civ('arq')]; v.units[1]=[mkUnit(G,1,'sol'),mkUnit(G,1,'esc')];
  paso([{t:'stance',target:1,stance:'alerta'}]); const B=G.battles[G.battles.length-1];
  const inits=B.waves.map(w=>w.init); return B.units.length===5&&inits.every((x,k)=>k===0||x>inits[k-1])&&B.waves.some(w=>w.acts.some(a=>a.hits.length));`);

prueba('Proyección: con 3 agricultores, el Arado daría +3 de comida por paso', base + `
  cap.units[0]=[civ('agr'),civ('agr'),civ('agr')]; const r=techImpact(G,0,'Arado'); return r.out.food===3;`);

prueba('Proyección: no cambia la partida real', base + `
  cap.units[0]=[civ('agr'),civ('agr'),civ('agr')]; const f0=cap.food, t0=Object.keys(G.F[0].techs).length; techImpact(G,0,'Arado');
  return cap.food===f0&&Object.keys(G.F[0].techs).length===t0&&!G.F[0].techs['Arado'];`);

prueba('Proyección: Molino de piedra se nota al mejorar el molino que ya tienes', base + `
  cap.units[0]=[civ('pob'),civ('pob'),civ('pob'),civ('pob')]; cap.b.push({t:'molino',l:1,s:null,wk:0,cost:20});
  const r=techImpact(G,0,'Molino de piedra'); return r.ups.length===1&&r.ups[0].to===2&&r.out.food===2;`);

prueba('Prioridad «crecer»: todo el sobrante va al crecimiento', base + `
  cap.units[0]=[civ('agr'),civ('agr'),civ('pob')]; cap.food=10; const p0=cap.prog; paso(); return cap.food===10&&cap.prog>p0;`);

prueba('Prioridad «guardar»: el sobrante se queda en el almacén', base + `
  cap.units[0]=[civ('agr'),civ('agr'),civ('pob')]; cap.food=10; paso([{t:'growmode',zone:cap.id,mode:'guardar'}]); return cap.food>10&&cap.prog===0;`);

prueba('Envío automático: cada paso se manda el sobrante a otra zona', base + `
  const v=G.zones[cap.adj[0]]; v.owner=0; v.units[0]=[civ('pob')]; v.food=0; cap.units[0]=[civ('agr'),civ('agr'),civ('agr')]; G.F[0].gold=50;
  const s0=v.size; paso([{t:"route",from:cap.id,to:v.id,res:"food",q:"sobrante"}]); paso(); return (cap.routes||[]).length===1&&(v.food+v.prog>0||v.size>s0);`);

prueba('Los que nacen se especializan solos si hay producción', base + `
  cap.units[0]=[civ('pob')]; cap.prod=10; cap.grow=1; paso([{t:'autospec',zone:cap.id,to:'agr'}]); paso(); cap.grow=1; paso();
  return cap.units[0].filter(u=>u.t==='agr').length>=1;`);

prueba('Encuentro aceptado: se paga y llega la recompensa', base + `
  cap.units[0]=[civ('pob')]; G.F[0].gold=50; G.F[0].enc={id:'mercenarios',k:'oferta',who:'Unos mercenarios',txt:'',zone:cap.id,cost:{res:'gold',n:5},gain:{units:{sol:2}},refuse:null,step:1};
  paso([{t:'encounter',choice:'si'}]); return cap.units[0].filter(u=>u.t==='sol').length===2&&G.F[0].gold<50&&!G.F[0].enc;`);

prueba('Encuentro sin responder o rechazado: no pasa nada malo', base + `
  cap.units[0]=[civ('pob')]; G.F[0].gold=40; const n0=cap.units[0].length;
  G.F[0].enc={id:'mercenarios',k:'oferta',who:'Unos mercenarios',txt:'',zone:cap.id,cost:{res:'gold',n:5},gain:{units:{sol:2}},refuse:null,step:1};
  paso(); return !G.F[0].enc&&cap.units[0].length===n0&&G.F[0].gold>=40;`);

prueba('No hay encuentros de amenaza: todos son ofertas o apuestas', base + `return ENCOUNTERS.every(e=>(e.k==='oferta'||e.k==='apuesta')&&!e.refuse);`);

prueba('Los encuentros llegan solos cada pocos pasos', base + `
  for(let s=0;s<12;s++) paso(); return G.hist.some(h=>h.lines.some(l=>l.includes('trato con')||l.includes('se rechaza')||l.includes('se pierden')||l.includes('ataque de')||l.includes('evita')||l.includes('muere una')||l.includes('el encuentro con')||l.includes('salió')));`);

prueba('Un recurso estratégico rinde más mientras más tiempo se controla', base + `
  const z=G.zones.find(z=>z.res&&z.owner===null); z.owner=0; z.units[0]=[civ('pob')]; z.resHeld=0; const r=[]; for(let s=0;s<12;s++){ paso(); r.push(z.resGain.n); } return r[0]===1&&r[11]>r[0];`);

prueba('Cada mapa tiene zonas de frontera entre imperios vecinos', base + `
  const fr=G.zones.filter(z=>z.role==='frontera'); return fr.length>=1&&fr.every(z=>z.adj.length>=2&&z.owner===null);`);

prueba('Frontera en paz: cada jugador presente gana el bono compartido', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('pob')]; fz.units[1]=[mkUnit(G,1,'pob')]; const g0=G.F[0].gold, g1=G.F[1].gold;
  paso(); return fz.frontGain[0]===FRONTIER_SHARED&&fz.frontGain[1]===FRONTIER_SHARED&&fz.owner===null;`);

prueba('Frontera con uno solo: gana el bono mayor, pero nunca se adueña de la zona', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('pob')]; paso(); paso(); return fz.owner===null&&fz.frontGain[0]===FRONTIER_ALONE;`);

prueba('Frontera con traición: si alguien ataca, ese paso nadie gana el bono', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol'),civ('sol'),civ('sol')]; fz.units[1]=[mkUnit(G,1,'pob'),mkUnit(G,1,'sol')];
  paso([{t:'stance',target:1,stance:'alerta'}]); return !fz.frontGain[1];`);

prueba('Una tribu que se queda sin gente deja su zona libre', base + `
  const t=G.zones.find(z=>z.owner===4); t.units={}; paso(); return t.owner===null;`);

prueba('Se puede empezar una Maravilla (antes la orden se perdía)', base + `
  cap.size=6; G.F[0].techs['Maravillas']=1; paso([{t:'wonder',zone:cap.id}]); return cap.proj.some(p=>p.k==='w'&&p.tot>=300);`);

prueba('Tropas lejos del territorio propio reciben suministro si el camino es corto', base + `
  const v=G.zones[cap.adj[0]]; v.units[0]=[civ('sol'),civ('sol')]; cap.food=30;
  paso(); return v.units[0].every(u=>u.hg===0)&&cap.food<30;`);

prueba('Sin camino seguro, las tropas quedan aisladas y pasan hambre', base + `
  // un soldado dentro del territorio rival, a 2 zonas de lo propio y con el paso cortado
  const lejos=G.zones.find(z=>z.role!=='frontera'&&!z.capital&&!z.adj.includes(cap.id)&&z.owner===null);
  lejos.owner=1; lejos.units[0]=[civ('sol')]; cap.food=40;
  lejos.adj.forEach(a=>{ const z=G.zones[a]; if(z.owner!==0&&z.role!=='frontera'){ z.owner=1; } });
  const fuentes=supplySources(G,0,lejos.id); paso();
  return fuentes.length===0 && ((lejos.units[0]||[]).every(u=>u.hg>0) || !(lejos.units[0]||[]).length);`);

prueba('Una tropa con hambre pelea con la mitad de los dados', base + `
  const v=G.zones.find(z=>z.owner===null&&z.role!=='frontera'); const a=civ('sol'); a.str=4; a.hg=1;
  v.units[0]=[a]; v.units[1]=[mkUnit(G,1,'sol')]; G.fx=[]; G.battles=[];
  fightZone(G,v,[0,1],{0:true,1:true},()=>{});   // combate directo, sin que coma antes
  const B=G.battles[0]; return B.units.find(u=>u.f===0).dice===2;`);

prueba('Entrenar ya no necesita Cuartel', base + `
  cap.units[0]=[civ('pob'),civ('pob')]; cap.prod=10; paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'pob'}]);
  return cap.units[0].some(u=>u.t==='sol');`);

prueba('Etapa de fundación: crecer cuesta la mitad hasta el paso 12', base + `
  const antes=growCost(G,0,cap); G.step=20; const despues=growCost(G,0,cap); return antes<despues;`);

console.log(fallos ? `\n${fallos} reglas fallan.` : '\nTodas las reglas probadas se cumplen.');
process.exit(fallos ? 1 : 0);
