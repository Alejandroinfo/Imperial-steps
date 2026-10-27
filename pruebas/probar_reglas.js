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
  const civ=t=>{ const u=mkUnit(G,0,t); u.tr=[]; return u; }; const conRasgo=(t,k,l)=>{ const u=mkUnit(G,0,t); u.tr=[{k,l}]; return u; }; const paso=(o)=>resolveStep(G,(o||[]).map(x=>Object.assign({f:0},x)));`;

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
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing'),civ('ing'),civ('ing'),civ('ing')]; cap.prod=40;
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

prueba('Zona peligrosa en paz: cada jugador con tropas gana el bono compartido', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol')]; fz.units[1]=[mkUnit(G,1,'sol')]; const g0=G.F[0].gold, g1=G.F[1].gold;
  paso(); return fz.frontGain[0]===FRONTIER_SHARED&&fz.frontGain[1]===FRONTIER_SHARED&&fz.owner===null;`);

prueba('Zona peligrosa con uno solo: gana el bono mayor, pero nunca se adueña de la zona', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol')]; paso(); return fz.owner===null&&fz.frontGain[0]===FRONTIER_ALONE;`);

prueba('Zona peligrosa: el bono sube un 10 % por paso hasta +100 % mientras mantengas tropas', base + `
  G.F[0].gold=500; cap.food=40; cap.units[0]=[civ('agr'),civ('agr'),civ('agr'),civ('agr')]; const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol')]; const g=[]; for(let i=0;i<13;i++){ paso(); g.push(fz.frontGain[0]); cap.food=40; G.F[0].gold=500; }
  return g[0]===FRONTIER_ALONE&&g[1]===Math.round(FRONTIER_ALONE*1.1)&&g[5]===Math.round(FRONTIER_ALONE*1.5)&&g[10]===FRONTIER_ALONE*2&&g[12]===FRONTIER_ALONE*2;`);

prueba('Zona peligrosa: si pierdes la presencia, el bono empieza otra vez de 0', base + `
  G.F[0].gold=500; cap.food=40; cap.units[0]=[civ('agr'),civ('agr'),civ('agr'),civ('agr')]; const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol')]; for(let i=0;i<5;i++){ paso(); cap.food=40; G.F[0].gold=500; }
  const alto=fz.frontGain[0]>FRONTIER_ALONE; fz.units[0]=[]; paso(); const sin=!fz.frontGain[0]&&!(fz.fh||{})[0]; fz.units[0]=[civ('sol')]; paso(); return alto&&sin&&fz.frontGain[0]===FRONTIER_ALONE;`);

prueba('Zona peligrosa: compartida también crece, y la racha sigue aunque haya pelea (si echas al otro, pasas al bono de estar solo)', base + `
  G.F[0].gold=500; G.F[1].gold=500; const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol')]; fz.units[1]=[mkUnit(G,1,'sol')]; cap.food=40;
  paso(); const a=fz.frontGain[0]===FRONTIER_SHARED; cap.food=40; paso(); const b=fz.frontGain[0]===Math.round(FRONTIER_SHARED*1.1)&&fz.frontGain[1]===Math.round(FRONTIER_SHARED*1.1); const fuertes=[civ('sol'),civ('sol'),civ('sol'),civ('sol')]; fuertes.forEach(u=>{u.str=4;}); fz.units[0]=fuertes; paso([{t:'stance',target:1,stance:'alerta'}]); const c=(fz.fh||{})[0]===3&&fz.frontGain[0]===Math.round(FRONTIER_ALONE*1.2); return a&&b&&c;`);

prueba('Frontera con traición: si alguien ataca, ese paso nadie gana el bono', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('sol'),civ('sol'),civ('sol')]; fz.units[1]=[mkUnit(G,1,'pob'),mkUnit(G,1,'sol')];
  paso([{t:'stance',target:1,stance:'alerta'}]); return !fz.frontGain[1];`);

prueba('Una tribu que se queda sin gente deja su zona libre', base + `
  const t=G.zones.find(z=>z.owner===4); t.units={}; paso(); return t.owner===null;`);

prueba('Se puede empezar una maravilla si tienes la tecnología de su rama (La Plaza Mayor ← Maravillas)', base + `
  cap.size=6; G.F[0].techs['Maravillas']=1; paso([{t:'wonder',zone:cap.id,w:'urb'}]); return cap.proj.some(p=>p.k==='w'&&p.w==='urb'&&p.tot>=300);`);

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

// ---- Ingenieros automáticos (15.2) ----
prueba('Con la misma eficiencia, sin nada guardado, la mitad produce para que la otra mitad construya', base + `
  cap.terrain='lla'; cap.capital=false; cap.units[0]=[civ('ing'),civ('ing')]; cap.prod=0; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.ing===1&&pl.cap===2;`);

prueba('Con producción guardada de sobra, todos pueden construir', base + `
  cap.terrain='lla'; cap.capital=false; cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=20; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.ing===3&&pl.cap===6;`);

prueba('Si la cuenta queda en negativo, producen primero los que mejor producen (pobladores en Montañas)', base + `
  cap.terrain='mon'; cap.capital=false; cap.units[0]=[civ('ing'),civ('pob'),civ('pob')]; cap.prod=0; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.pob===0&&pl.ing===1;`);

prueba('Sin obra en cola, todos los ingenieros producen', base + `
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=4; cap.proj=[];
  const pl=buildPlan(G,cap,0,false); paso(); return pl.ing===0&&cap.last.prod>=8;`);

prueba('Los pobladores también construyen solos si hay obra (1 cada uno) y, si no, producen', base + `
  cap.units[0]=[civ('pob'),civ('pob'),civ('pob')]; cap.prod=10; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  const pl=buildPlan(G,cap,0,false); const con=pl.pob===3&&pl.cap===3;
  cap.proj=[]; const pl2=buildPlan(G,cap,0,false); return con&&pl2.pob===0&&pl2.cap===0;`);

prueba('Pausar las obras de una zona: nadie construye y todos producen', base + `
  cap.units[0]=[civ('ing'),civ('ing')]; cap.prod=20; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  paso([{t:'pausebuild',zone:cap.id,on:true}]); const parada=cap.proj[0].left===40&&cap.pauseBuild===true&&cap.bplan.cap===0;
  paso([{t:'pausebuild',zone:cap.id,on:false}]); return parada&&cap.proj[0].left<40;`);

prueba('Con la pausa, la producción se acumula en el almacén', base + `
  cap.units[0]=[civ('ing'),civ('ing')]; cap.prod=0; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  paso([{t:'pausebuild',zone:cap.id,on:true}]); const a=cap.prod; paso(); return cap.prod>a&&a>0;`);

prueba('Mover comida desde otra zona cuesta oro de logística', base + `
  const v=G.zones[cap.adj[0]]; v.owner=0; v.units[0]=[civ('sol'),civ('sol')]; v.food=0; cap.food=30; G.F[0].gold=20;
  paso(); return (v.units[0]||[]).every(u=>u.hg===0)&&G.F[0].gold<20+cap.last.gold;`);

prueba('Sin oro para mover la comida, la gente de la otra zona pasa hambre', base + `
  const v=G.zones[cap.adj[0]]; v.owner=0; v.units[0]=[civ('sol'),civ('sol')]; v.food=0; cap.food=30; G.F[0].gold=0; cap.units[0]=[civ('pob')];
  paso(); return (v.units[0]||[]).some(u=>u.hg>0);`);

prueba('Solo construyen los ingenieros que hacen falta para terminar la obra', base + `
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=30; cap.proj=[{k:'b',bt:'molino',left:3,tot:20,dup:0,lvl:1,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.ing===2&&pl.cap===3;`);

prueba('Zona de Producción: su bono cuenta como capacidad de obra mientras se construye', base + `
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing'),civ('ing')]; cap.prod=40; cap.proj=[{k:'b',bt:'molino',left:60,tot:60,dup:0,lvl:3,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.ing===4&&pl.bonus===4&&pl.cap===12;`);

prueba('Gremios de ingenieros: las obras cuestan un 10 % menos', base + `
  G.F[0].techs['Gremios de ingenieros']=1; recomputeMods(G); cap.units[0]=[civ('ing')]; cap.prod=40; G.F[0].techs['Molino de piedra']=1; recomputeMods(G);
  paso([{t:'build',zone:cap.id,bt:'molino'}]); const p=cap.proj.find(p=>p.bt==='molino'); return !!p&&p.tot===Math.max(10,Math.round(20*p.lvl*0.9));`);

prueba('Grandes obras: mejorar a nivel 3 o más cuesta 10 menos', base + `
  const sin=stepCost(G,0,cap,'molino',0); G.F[0].techs['Grandes obras']=1; recomputeMods(G); return G.M[0].upgRebate===10&&sin-G.M[0].upgRebate>=10;`);

prueba('El oficio de constructor ya no existe (5 oficios civiles)', `return CIV.length===5&&!CIV.includes('con')&&!UT.con;`);

prueba('Dos anexiones en el mismo paso no pueden gastar más ciencia de la que hay', base + `
  const ts=G.zones.filter(z=>z.owner===TRIBE).slice(0,2); if(ts.length<2) return false;
  ts.forEach(t=>{ t.tspec='cie'; });
  const orden=ts.map(t=>({t:'annex',zone:t.id})); G.F[0].tech=annexPrice(G,0,ts[0])+1;
  const antes=G.F[0].tech; try{ paso(orden); }catch(e){ return 'error '+e.message; } return G.F[0].tech>=0&&ts.filter(t=>t.owner===0).length<=1;`);

prueba('Un poblador que construye no produce su 1 de producción, pero sigue dando su comida', base + `
  cap.units[0]=[civ('pob'),civ('pob'),civ('pob')]; cap.prod=10; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  paso(); const con=cap.lastBy.jobs.pob; const a=con.prod===0&&con.food===3;
  cap.proj=[]; cap.prod=10; paso(); const sin=cap.lastBy.jobs.pob; return a&&sin.prod>=3&&sin.food===3;`);

// ---- Rasgos de las personas (fases A y B) ----
prueba('Rasgos: cada persona tiene 2 rasgos distintos y en promedio hay más positivos que negativos', base + `
  let suma=0,n=0,ext=0,com=0,dist=true; for(let i=0;i<4000;i++){ const r=rollTraits(G); if(r.length!==2||r[0].k===r[1].k) dist=false; r.forEach(t=>{ suma+=t.l; n++; if(Math.abs(t.l)===2) ext++; else com++; }); }
  return dist&&suma/n>0&&ext/n>0.15&&ext/n<0.35&&com/n>0.65;`);

prueba('Rasgos: un agricultor con rasgo bueno de agricultura da un 25 % más de comida', base + `
  cap.units[0]=[conRasgo('agr','agr',1)]; paso(); return cap.lastBy.jobs.agr.food===2.5;`);

prueba('Rasgos: un rasgo de otro oficio no afecta (el comerciante no ayuda al agricultor)', base + `
  cap.units[0]=[conRasgo('agr','com',2)]; paso(); return cap.lastBy.jobs.agr.food===2;`);

prueba('Rasgos: un rasgo muy malo quita la mitad', base + `
  cap.units[0]=[conRasgo('agr','agr',-2)]; paso(); return cap.lastBy.jobs.agr.food===1;`);

prueba('Rasgos: el rasgo de agricultura vale también para el poblador sin oficio (su comida)', base + `
  cap.units[0]=[conRasgo('pob','agr',2)]; paso(); return cap.lastBy.jobs.pob.food===1.5;`);

prueba('Rasgos: el comerciante con rasgo de comercio da más oro', base + `
  cap.units[0]=[conRasgo('com','com',1)]; G.F[0].gold=0; paso(); return cap.lastBy.jobs.com.gold===2.5;`);

prueba('Rasgos: apetito bueno hace comer menos (4 personas comen 3 en vez de 4)', base + `
  const a=()=>{ const u=civ('pob'); u.tr=[{k:'apt',l:1}]; return u; }; cap.units[0]=[a(),a(),a(),a()]; cap.food=20; paso();
  const bueno=cap.feed[0].need; cap.units[0]=[civ('pob'),civ('pob'),civ('pob'),civ('pob')]; cap.food=20; paso(); return bueno===3&&cap.feed[0].need===4;`);

prueba('Rasgos: las personas tienen identificador único', base + `
  const ids=G.zones.reduce((a,z)=>a.concat(Object.keys(z.units).reduce((b,f)=>b.concat(z.units[f].map(u=>u.id)),[])),[]); return ids.length>0&&ids.every(x=>x>0)&&new Set(ids).size===ids.length;`);

prueba('Elegir personas: la orden especializa a las personas elegidas y no a otras', base + `
  const a=conRasgo('pob','agr',2), b=civ('pob'), c=civ('pob'); cap.units[0]=[a,b,c]; cap.prod=10;
  paso([{t:'spec',zone:cap.id,from:'pob',to:'agr',n:1,ids:[c.id]}]);
  return c.t==='agr'&&a.t==='pob'&&b.t==='pob';`);

prueba('Los rasgos viajan con la persona al cambiar de oficio', base + `
  const a=conRasgo('pob','agr',2); cap.units[0]=[a]; cap.prod=10; paso([{t:'spec',zone:cap.id,from:'pob',to:'agr',n:1,ids:[a.id]}]);
  return a.t==='agr'&&a.tr.length===1&&a.tr[0].k==='agr'&&a.tr[0].l===2;`);

prueba('Obras: el reparto usa el rendimiento de cada persona y guarda a quién elige', base + `
  cap.terrain='lla'; cap.capital=false; const a=conRasgo('ing','ing',2), b=civ('ing'); cap.units[0]=[a,b]; cap.prod=0; cap.proj=[{k:'b',bt:'molino',left:40,tot:40,dup:0,lvl:2,spec:null}];
  const pl=buildPlan(G,cap,0,false); return pl.ing===1&&pl.ids.length===1&&(pl.ids[0]===a.id||pl.ids[0]===b.id);`);

// ---- Fase C: salud y fuerza (enteros) ----
prueba('Fuerza buena: un soldado pelea con 1 dado más; muy mala: nunca baja de 1 dado', base + `
  const v=G.zones.find(z=>z.owner===null&&z.role!=='frontera'); const a=civ('sol'), b=civ('sol'); a.str=2; b.str=2; a.tr=[{k:'fue',l:1}]; b.tr=[{k:'fue',l:-2}];
  v.units[0]=[a,b]; v.units[1]=[mkUnit(G,1,'sol')]; G.fx=[]; G.battles=[]; fightZone(G,v,[0,1],{0:true,1:true},()=>{});
  const us=G.battles[0].units.filter(u=>u.f===0); return us.some(u=>u.dice===3)&&us.some(u=>u.dice===1);`);

prueba('Salud buena o mala: +1 o −1 de vida, siempre entera y de al menos 1', base + `
  const v=G.zones.find(z=>z.owner===null&&z.role!=='frontera'); const a=civ('sol'), b=civ('sol'), c=civ('sol'); a.tr=[{k:'sal',l:2}]; b.tr=[{k:'sal',l:-1}]; c.tr=[{k:'sal',l:-2}];
  v.units[0]=[a,b,c]; v.units[1]=[mkUnit(G,1,'sol')]; G.fx=[]; G.battles=[]; fightZone(G,v,[0,1],{0:true,1:true},()=>{});
  const hs=G.battles[0].units.filter(u=>u.f===0).map(u=>u.hpMax).sort(); return JSON.stringify(hs)===JSON.stringify([1,2,5])&&hs.every(Number.isInteger);`);

// ---- Maravillas únicas (15.3) ----
const maravilla = `cap.size=6; cap.terrain='lla'; `;
prueba('Sin la tecnología de la rama no se puede empezar su maravilla', base + `
  cap.size=6; paso([{t:'wonder',zone:cap.id,w:'agr'}]); return !cap.proj.some(p=>p.k==='w');`);

prueba('Una maravilla ya construida no se puede empezar ni investigar de nuevo', base + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); c1.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'agr'});
  cap.size=6; G.F[0].techs['Cosecha comunal']=1; return researchBlock(G,0,'Granjas modelo')==='Su maravilla ya fue construida'&&(G.F[0].techs['Granjas modelo']=1,paso([{t:'wonder',zone:cap.id,w:'agr'}]),!cap.proj.some(p=>p.k==='w'));`);

prueba('La vertebral de nivel 5 ya no da su efecto: lo da la maravilla mientras la controlas', base + `
  G.F[0].techs['Granjas modelo']=1; recomputeMods(G); const sin=G.M[0].agrFood;
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'agr'}); recomputeMods(G); const con=G.M[0].agrFood;
  cap.owner=1; recomputeMods(G); const rival=G.M[1].agrFood, yo=G.M[0].agrFood; cap.owner=0; return sin===0&&con===1&&rival===1&&yo===0;`);

prueba('Terminar una maravilla cancela la de los rivales: conservan la tecnología y recuperan la mitad de la producción', base + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); G.F[0].techs['Granjas modelo']=1; G.F[1].techs['Granjas modelo']=1; recomputeMods(G);
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=60; cap.proj=[{k:'w',w:'agr',left:4,tot:500}];
  c1.prod=0; c1.proj=[{k:'w',w:'agr',left:300,tot:500}]; const t1=G.F[1].tech;
  paso(); const hecha=cap.b.some(b=>b.t==='mar'&&b.w==='agr'); return hecha&&!c1.proj.some(p=>p.k==='w')&&!!G.F[1].techs['Granjas modelo']&&G.F[1].tech<t1+20&&c1.prod>0&&G.M[1].agrFood===0;`);

prueba('Si la tecnología aún estaba en la cola cuando otro termina la maravilla, se cancela y se recupera la mitad de la ciencia gastada', base + `
  G.F[0].techs['Granjas modelo']=1; cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=60; cap.proj=[{k:'w',w:'agr',left:4,tot:500}];
  G.F[1].rq=[{name:'Granjas modelo',left:40,tot:100}]; const t1=G.F[1].tech; paso(); return G.F[1].rq.length===0&&!G.F[1].techs['Granjas modelo']&&G.F[1].tech>=t1+30;`);

prueba('Quien tenía la tecnología pero no había empezado la obra la conserva (sin efecto)', base + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); G.F[0].techs['Granjas modelo']=1; G.F[1].techs['Granjas modelo']=1;
  cap.units[0]=[civ('ing'),civ('ing'),civ('ing')]; cap.prod=60; cap.proj=[{k:'w',w:'agr',left:4,tot:500}]; paso();
  return !!G.F[1].techs['Granjas modelo']&&G.M[1].agrFood===0;`);

prueba('Empate: gana quien podía destinar más producción a terminarla ese paso', base + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); [cap,c1].forEach(z=>{ z.terrain='lla'; z.size=6; });
  cap.units[0]=[civ('ing'),civ('ing')]; c1.units[1]=[mkUnit(G,1,'ing'),mkUnit(G,1,'ing')]; c1.units[1].forEach(u=>{u.tr=[];});
  cap.prod=40; c1.prod=30; cap.proj=[{k:'w',w:'agr',left:3,tot:500}]; c1.proj=[{k:'w',w:'agr',left:3,tot:500}];
  G.F[0].techs['Granjas modelo']=1; G.F[1].techs['Granjas modelo']=1; paso();
  return cap.b.some(b=>b.t==='mar'&&b.w==='agr')&&!c1.b.some(b=>b.t==='mar')&&!c1.proj.some(p=>p.k==='w');`);

prueba('Empate exacto: nadie la logra, se deshace el último paso y lo que falta se duplica', base + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); [cap,c1].forEach(z=>{ z.terrain='lla'; z.size=6; });
  cap.units[0]=[civ('ing'),civ('ing')]; c1.units[1]=[mkUnit(G,1,'ing'),mkUnit(G,1,'ing')]; c1.units[1].forEach(u=>{u.tr=[];});
  cap.prod=40; c1.prod=40; cap.proj=[{k:'w',w:'agr',left:3,tot:500}]; c1.proj=[{k:'w',w:'agr',left:3,tot:500}];
  G.F[0].techs['Granjas modelo']=1; G.F[1].techs['Granjas modelo']=1; paso();
  return !cap.b.some(b=>b.t==='mar')&&!c1.b.some(b=>b.t==='mar')&&cap.proj[0].left===6&&c1.proj[0].left===6;`);

prueba('La Plaza Mayor abarata las obras un 25 % pero no las maravillas', base + `
  cap.size=9; cap.units[0]=[civ('ing')]; cap.prod=40; G.F[0].techs['Molino de piedra']=1; recomputeMods(G); const c0=wonderCostOf(G,0,cap);
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'urb'}); recomputeMods(G); paso([{t:'build',zone:cap.id,bt:'molino'}]); const p=cap.proj.find(p=>p.bt==='molino');
  return G.M[0].bPct===0.75&&!!p&&p.tot===Math.max(10,Math.round(20*p.lvl*0.75))&&wonderCostOf(G,0,cap)===c0;`);

prueba('La Torre de los Sabios: cada científico usa 3 en vez de 2 al investigar', base + `
  cap.units[0]=[civ('cie'),civ('cie')]; G.F[0].tech=5; G.F[0].rq=[{name:'Arado',left:20,tot:20}]; const sin=researchPlan(G,0)[cap.id].n;
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'cie'}); recomputeMods(G); const con=researchPlan(G,0)[cap.id].n; return sin===2&&con===1&&G.M[0].cieTech===1;`);

prueba('Las Termas de la Salud: todas las unidades con 2 de vida más', base + `
  const v=G.zones.find(z=>z.owner===null&&z.role!=='frontera'); const a=civ('sol'); v.units[0]=[a]; v.units[1]=[mkUnit(G,1,'sol')];
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'san'}); recomputeMods(G); G.fx=[]; G.battles=[]; fightZone(G,v,[0,1],{0:true,1:true},()=>{});
  return G.battles[0].units.find(u=>u.f===0).hpMax===5;`);

prueba('El Bastión Eterno: los defensores tienen +4 de defensa y +1 de vida', base + `
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'def'}); recomputeMods(G); const v=cap; v.units[0]=[civ('sol')]; v.units[1]=[mkUnit(G,1,'sol')]; G.fx=[]; G.battles=[];
  fightZone(G,v,[0,1],{0:false,1:true},()=>{}); const u=G.battles[0].units.find(x=>x.f===0); return u.cush>=4&&u.hpMax===4;`);

prueba('La Puerta de los Estandartes: los atacantes tienen +1 de fuerza', base + `
  cap.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'gue'}); recomputeMods(G); const v=G.zones.find(z=>z.owner===null&&z.role!=='frontera'); const a=civ('sol'); a.str=2; v.units[0]=[a]; v.units[1]=[mkUnit(G,1,'sol')];
  G.fx=[]; G.battles=[]; fightZone(G,v,[0,1],{0:true,1:false},()=>{}); return G.battles[0].units.find(u=>u.f===0).dice>=3;`);

prueba('La Calzada sin Fin: mover recursos por su zona es gratis', base + `
  const v=G.zones[cap.adj[0]]; const antes=shipFactor(G,[v.id]); v.b.push({t:'mar',l:1,s:null,wk:0,cost:500,w:'log'}); return antes>0&&shipFactor(G,[v.id])===0;`);

prueba('Las vertebrales de nivel 5 de Camino, Hospital y Fortificación ya no dan nivel 5 del edificio', base + `
  G.F[0].techs['Hospital imperial']=1; G.F[0].techs['Red de caminos II']=1; G.F[0].techs['Ciudadela']=1;
  return capLevel(G,0,'hospital')<5&&capLevel(G,0,'camino')<5&&capLevel(G,0,'fort')<5;`);

prueba('Las 12 maravillas tienen su tecnología y hay una por rama', base + `
  const rs=Object.keys(WONDERS).map(k=>TECH[WONDERS[k].tech]); return rs.length===12&&rs.every(t=>t&&t.l===5&&t.v===1)&&new Set(rs.map(t=>t.r)).size===12;`);

// ---- Parte 3: zonas peligrosas, elegir entre dos, tribus ----
prueba('Zona peligrosa: los civiles no cuentan, solo las tropas', base + `
  const fz=G.zones.find(z=>z.role==='frontera'); fz.units[0]=[civ('pob'),civ('pob')]; paso(); const sinTropas=!fz.frontGain[0];
  fz.units[1]=[mkUnit(G,1,'sol')]; paso(); return sinTropas&&fz.frontGain[1]===FRONTIER_ALONE&&!fz.frontGain[0];`);

prueba('Los mapas de 2 jugadores tienen 2 zonas peligrosas; los de 3 y 4, una por pareja vecina', base + `
  let ok=true; for(let mi=0;mi<12;mi++){ const a=newGame(mi,2,1,'normal').zones.filter(z=>z.role==='frontera'); if(a.length!==2||a.some(z=>z.adj.length<2)) ok=false; }
  const t3=newGame(0,3,1,'normal').zones.filter(z=>z.role==='frontera').length, t4=newGame(0,4,1,'normal').zones.filter(z=>z.role==='frontera').length; return ok&&t3===3&&t4===4;`);

const OPCIONES = `[{lbl:'Mercenarios',cost:{res:'gold',n:5},gain:{units:{sol:2}}},{lbl:'Arqueros',cost:{res:'gold',n:7},gain:{units:{arq:2}}}]`;
prueba('Encuentro de elegir entre dos: pagas y recibes solo la opción elegida', base + `
  cap.units[0]=[civ('pob')]; G.F[0].gold=50; G.F[0].enc={id:'ch_tropas',k:'eleccion',who:'Dos emisarios',txt:'',zone:cap.id,cost:null,gain:null,refuse:null,step:1,str:0,opts:${OPCIONES}};
  paso([{t:'encounter',choice:'b'}]); return cap.units[0].filter(u=>u.t==='arq').length===2&&!cap.units[0].some(u=>u.t==='sol')&&G.F[0].gold<=43+cap.last.gold;`);

prueba('Encuentro de elegir: no elegir ninguna no tiene consecuencias, y una opción que no te alcanza no se cobra', base + `
  cap.units[0]=[civ('pob')]; G.F[0].gold=6; G.F[0].enc={id:'ch_tropas',k:'eleccion',who:'Dos emisarios',txt:'',zone:cap.id,cost:null,gain:null,refuse:null,step:1,str:0,opts:${OPCIONES}};
  paso([{t:'encounter',choice:'b'}]); const sinAlcanzar=cap.units[0].length===1;
  G.F[0].enc={id:'ch_tropas',k:'eleccion',who:'Dos emisarios',txt:'',zone:cap.id,cost:null,gain:null,refuse:null,step:2,str:0,opts:${OPCIONES}}; paso(); return sinAlcanzar&&cap.units[0].length===1;`);

prueba('Entre los encuentros de la partida aparecen los de elegir entre dos', base + `
  cap.units[0]=[civ('pob')]; let visto=false; for(let i=0;i<160&&!visto;i++){ paso(); const e=G.F[0].enc; if(e&&e.k==='eleccion'&&e.opts&&e.opts.length===2) visto=true; if(e) G.F[0].enc=null; } return visto;`);

const TRIBU = `const tz=G.zones.find(z=>z.owner===4); tz.tspec='agr'; const n=G.zones[tz.adj.find(a=>G.zones[a].role!=='frontera'&&G.zones[a].owner===null)]; n.owner=0; n.size=6; n.units[0]=[civ('pob'),civ('pob')]; n.food=45;`;
prueba('Tribus: cada 5 pasos piden lo de su oficio a los vecinos, y rechazar no tiene castigo', base + TRIBU + `
  tz.tspec='com'; G.step=5; const u0=(tz.units[4]||[]).length; paso(); const t=G.tributes.find(t=>t.zone===tz.id);
  const pide=!!t&&t.res==='gold'&&t.targets.includes(0); for(let i=0;i<7;i++) paso(); return pide&&!G.tributes.some(x=>x.zone===tz.id&&x===t)&&(tz.units[4]||[]).length>=u0&&!G.hist.some(h=>h.lines.some(l=>l.includes('ataca '+zname(n))));`);

prueba('Tribus: cumplir un pedido sube la relación (0 a 3)', base + TRIBU + `
  tz.tspec='com'; G.step=5; paso(); G.F[0].gold=60; paso([{t:'tribute',tribe:tz.id,from:n.id}]); return (tz.rel||{})[0]===1;`);

prueba('Tribus: sin relación 3 no se puede anexar; con relación 3 sí', base + TRIBU + `
  tz.rel={0:2}; G.F[0].gold=0; paso([{t:'annex',zone:tz.id,from:n.id}]); const antes=tz.owner===4; tz.rel={0:3}; n.food=45; paso([{t:'annex',zone:tz.id,from:n.id}]); return antes&&tz.owner===0;`);

prueba('Tribus: atacarlas es entrar en guerra: sus civiles se vuelven guerreros y te atacan', base + TRIBU + `
  for(let i=0;i<6;i++) tz.units[4].push(mkUnit(G,4,'sol')); tz.rel={0:2}; G.F[0].gold=50; n.units[0]=[civ('sol'),civ('sol'),civ('sol')];
  paso([{t:'move',from:n.id,to:tz.id,u:{sol:3},stance:'ataque'}]);
  const guerra=G.wars.some(w=>w.tribe===tz.id&&w.f===0)&&tz.rel[0]===0; const berserkers=(tz.units[4]||[]).every(u=>u.t==='ber');
  paso(); const ataca=G.hist.some(h=>h.lines.some(l=>l.includes('ataca '))); for(let i=0;i<6;i++) paso(); return guerra&&berserkers&&ataca&&G.wars.length===0;`);

// ---- Subasta (13.3) ----
const SUB = `G.fx=[]; const logs=[]; const L=m=>logs.push(m); const item=(cat,tier,det)=>({cat,tier,det:det||{}});`;
prueba('La subasta se anuncia 2 pasos antes del paso 20, con tantos objetos como jugadores', base + `
  let antes=true; for(let i=1;i<17;i++){ paso(); if(G.auction) antes=false; } paso();
  const a=G.auction; return antes&&!!a&&a.step===20&&a.items.length===2&&['gold','tech','food','prod'].includes(a.cur)&&a.items.every(it=>AUCTION_CATS[it.cat]&&it.tier>=0&&it.tier<=2);`);

prueba('Subasta: gana la oferta más alta y solo el ganador paga', base + SUB + `
  G.auction={step:20,cur:'gold',items:[item('car',0,{res:'food'})],bids:{0:{0:30},1:{0:20}}}; G.F[0].gold=100; G.F[1].gold=100; const p0=cap.prog; auctionResolve(G,L);
  return G.F[0].gold===70&&G.F[1].gold===100&&cap.prog===p0+30&&G.auction===null;`);

prueba('Subasta: si empatan arriba, todos los empatados se lo llevan y cada uno paga lo suyo', base + SUB + `
  const c1=G.zones.find(z=>z.capital&&z.owner===1); G.auction={step:20,cur:'gold',items:[item('car',0,{res:'food'})],bids:{0:{0:25},1:{0:25}}}; G.F[0].gold=100; G.F[1].gold=100; const a0=cap.prog, a1=c1.prog; auctionResolve(G,L);
  return G.F[0].gold===75&&G.F[1].gold===75&&cap.prog===a0+30&&c1.prog===a1+30;`);

prueba('Subasta: solo cuentan las ofertas que puedes pagar (se conservan las más altas)', base + SUB + `
  G.auction={step:20,cur:'gold',items:[item('car',0,{res:'prod'}),item('car',0,{res:'prod'})],bids:{0:{0:60,1:50}}}; G.F[0].gold=80; auctionResolve(G,L);
  return G.F[0].gold===20&&logs.some(l=>l.includes('nadie ofreció'));`);

prueba('Subasta: la comida se paga de todo el imperio, en igual porcentaje de cada zona', base + SUB + `
  const n=G.zones[cap.adj[0]]; n.owner=0; n.units[0]=[civ('pob')]; n.size=6; cap.size=9; cap.food=60; n.food=20; G.auction={step:20,cur:'food',items:[item('pel',0)],bids:{0:{0:40}}};
  auctionResolve(G,L); return cap.food===30&&n.food===10&&cap.units[0].filter(u=>u.t==='sol').length===2;`);

prueba('Subasta: un saber regala una tecnología sin pagar su costo', base + SUB + `
  const t0=Object.keys(G.F[0].techs).length, c0=G.F[0].tech; G.auction={step:20,cur:'gold',items:[item('sab',0)],bids:{0:{0:5}}}; G.F[0].gold=50; auctionResolve(G,L);
  return Object.keys(G.F[0].techs).length===t0+1&&G.F[0].tech===c0;`);

prueba('Subasta: un poblador extraordinario trae 2 rasgos de oficio distintos de nivel alto', base + `
  G.fx=[]; const L=()=>{}; G.auction={step:20,cur:'gold',items:[{cat:'pob',tier:2,det:{}}],bids:{0:{0:5}}}; G.F[0].gold=50; const n0=cap.units[0].length; auctionResolve(G,L);
  const u=cap.units[0][cap.units[0].length-1]; return cap.units[0].length===n0+1&&u.t==='pob'&&u.tr.length===2&&u.tr[0].k!==u.tr[1].k&&u.tr.every(x=>x.l===2&&['agr','ing','com','cie'].includes(x.k));`);

prueba('Subasta: un pelotón de oro trae 7 soldados con su equipo', base + SUB + `
  G.auction={step:20,cur:'gold',items:[item('pel',2)],bids:{0:{0:5}}}; G.F[0].gold=50; const n0=cap.units[0].length; auctionResolve(G,L); return cap.units[0].length===n0+7;`);

prueba('Subasta: un recurso temporal funciona 40 pasos y luego se acaba', base + SUB + `
  G.auction={step:20,cur:'gold',items:[item('rec',2,{key:'ruinas'})],bids:{0:{0:5}}}; G.F[0].gold=50; const antes=hasRes(G,0,'ruinas'); G.step=20; auctionResolve(G,L);
  const ahora=hasRes(G,0,'ruinas'); G.step=61; return !antes&&ahora&&!hasRes(G,0,'ruinas');`);

prueba('Subasta: se puede ofertar con una orden y cambiarla hasta el paso de la subasta', base + `
  G.step=19; G.auction={step:20,cur:'gold',items:[{cat:'car',tier:0,det:{res:'food'}}],bids:{}}; G.F[0].gold=100;
  paso([{t:'bid',item:0,amount:10}]); const a=G.auction&&G.auction.bids[0]&&G.auction.bids[0][0]; paso([{t:'bid',item:0,amount:40}]); return a===10&&G.F[0].gold<=70+30&&G.F[0].gold>=50;`);

// ---- Historias de 4 capítulos (13.3) ----
const HIST = `const F=G.F[0]; const nuevo=(id,ch,tags)=>{ F.story={id,ch,next:0,tags}; F.enc=null; F.encNext=999; F.enc=makeChapter(G,0); return F.enc; };`;
prueba('Las 3 historias están completas: 4 capítulos, variantes por camino y finales por camino', base + `
  const ganaOk=g=>!g||Object.keys(g).every(k=>['units','res','n','eq','prog','rel','tpob','saber','bld','tres'].includes(k));
  return STORY_IDS.length===3&&STORY_IDS.every(id=>{ const S=STORIES[id]; const t=S.tags; const optOk=o=>o.lbl&&(o.cost===null||(o.cost.res&&o.cost.n>0));
    const c1=S[1].opts.length>=2&&S[1].opts.every(o=>optOk(o)&&ganaOk(o.gain));
    const c23=[2,3].every(c=>t.every(tag=>S[c][tag]&&S[c][tag].txt&&S[c][tag].opts.length===2&&S[c][tag].opts.every(o=>optOk(o)&&ganaOk(o.gain)&&t.includes(o.t))));
    const c4=t.every(tag=>S[4].txt[tag])&&S[4].opts.length===2&&S[4].opts.every(o=>optOk(o)&&t.every(tag=>ganaOk(o.g[tag])&&o.g[tag])); return c1&&c23&&c4; });`);

prueba('Cada jugador recibe su primer capítulo hacia el paso 10, como un encuentro de historia', base + `
  let visto=0; for(let i=0;i<16&&!visto;i++){ paso(); const e=G.F[0].enc; if(e&&e.k==='historia') visto=G.step; else if(e) G.F[0].enc=null; }
  const e=G.F[0].enc; return visto>=9&&visto<=14&&e.story.ch===1&&e.who.includes('capítulo 1 de 4')&&e.opts.length>=2;`);

prueba('Historia: lo que eliges cambia el siguiente capítulo y se programa 8 pasos después', base + HIST + `
  nuevo('caravana',1,[]); paso([{t:'encounter',choice:'a'}]); const a=F.story.ch===2&&F.story.tags[0]==='C'&&F.story.next===G.step-1+STORY_GAP;
  const t1=nuevo('caravana',2,['C']).txt, t2=nuevo('caravana',2,['T']).txt; return a&&t1.includes('mercaderes')&&t2.includes('tribu vecina')&&t1!==t2;`);

prueba('Historia: dejarlo pasar no cuesta nada ni castiga, y la historia sigue', base + HIST + `
  nuevo('maestro',1,[]); const oro=F.gold===undefined?G.F[0].gold:0; const c0=cap.units[0].length; paso([{t:'encounter',choice:'no'}]);
  return F.story.ch===2&&F.story.tags.length===1&&cap.units[0].length===c0&&!G.hist.some(h=>h.lines.some(l=>l.includes('pierde')||l.includes('muere')));`);

prueba('Historia: una opción que no te alcanza cuenta como dejarlo pasar', base + HIST + `
  nuevo('caravana',2,['T']); G.F[0].gold=0; paso([{t:'encounter',choice:'b'}]); const sin=F.story.tags[1]==='T';
  nuevo('caravana',2,['T']); F.story.tags=['T']; F.story.ch=2; G.F[0].gold=60; F.enc=makeChapter(G,0); paso([{t:'encounter',choice:'b'}]); return sin&&F.story.tags[1]==='C';`);

prueba('Historia: el capítulo final depende del camino que más tomaste', base + HIST + `
  const c=nuevo('caravana',4,['C','C','T']).opts[0].gain, t=nuevo('caravana',4,['T','T','C']).opts[0].gain; const p1=nuevo('heredero',4,['R','T','R']).txt, p2=nuevo('heredero',4,['T','R','T']).txt;
  return c.res==='gold'&&c.n>=30&&t.rel===1&&p1!==p2;`);

prueba('Historia: al cerrar el capítulo 4 la historia termina y no llegan más capítulos', base + HIST + `
  nuevo('maestro',4,['S','O','S']); paso([{t:'encounter',choice:'a'}]); const fin=F.story.done===1&&F.story.ch===5; let mas=false; F.encNext=undefined; for(let i=0;i<24;i++){ paso(); if(G.F[0].enc&&G.F[0].enc.k==='historia') mas=true; G.F[0].enc=null; } return fin&&!mas;`);

prueba('Historia: ganancias nuevas (relación, poblador extraordinario, saber, edificio, recurso temporal)', base + HIST + `
  const tz=G.zones.find(z=>z.owner===4); const n=G.zones[tz.adj.find(a=>G.zones[a].role!=='frontera'&&G.zones[a].owner===null)]; n.owner=0; n.units[0]=[civ('pob')];
  cap.size=9; const t0=Object.keys(G.F[0].techs).length; F.story={id:'caravana',ch:1,next:99,tags:[]};
  const gana=g=>{ F.enc={id:'x',k:'historia',who:'t',txt:'t',zone:cap.id,cost:null,gain:null,refuse:null,step:G.step,str:0,story:{id:'caravana',ch:1},opts:[{lbl:'a',t:'C',cost:null,gain:g}]}; F.story.ch=1; paso([{t:'encounter',choice:'a'}]); };
  gana({rel:1}); const r=(tz.rel||{})[0]===1; const n0=cap.units[0].length; gana({tpob:[{k:'com',l:2},{k:'agr',l:1}]}); const pob=cap.units[0].length===n0+1&&cap.units[0][cap.units[0].length-1].tr[0].k==='com';
  gana({saber:3}); const sab=Object.keys(G.F[0].techs).length===t0+1; gana({bld:'taller'}); const bld=cap.b.some(b=>b.t==='taller'); gana({tres:{key:'sal'}}); return r&&pob&&sab&&bld&&hasRes(G,0,'sal');`);

prueba('Durante el comienzo guiado no llegan historias', base + `
  G.F[0].encNext=999; let hay=false; for(let i=0;i<20;i++){ paso(); if(G.F[0].enc) hay=true; } return !hay&&!G.F[0].story;`);

console.log(fallos ? `\n${fallos} reglas fallan.` : '\nTodas las reglas probadas se cumplen.');
process.exit(fallos ? 1 : 0);
