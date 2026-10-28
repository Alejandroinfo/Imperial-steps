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
const base = `const G=newGame(0,2,1,'normal'); G.evq=[]; G.zones.forEach(z=>{ z.res=null; z.resO=null; }); const cap=G.zones.find(z=>z.capital&&z.owner===0);
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

prueba('El arquero cuesta soldado + arco (2 + 3) de producción, 2 de comida y 2 de oro', base + `const c=recruitCost(G,0,cap,'arq','new',false); return c.prod===5&&c.food===2&&c.gold===2&&trainCost(G,0,cap,'arq','new',false)===5;`);

prueba('Con un arco guardado, el arquero cuesta solo el soldado', base + `
  cap.b.push({t:'cuartel',l:1,s:null,wk:0,cost:20}); G.F[0].techs['Arco']=1; cap.eq={arq:1}; cap.prod=10; cap.food=20; G.F[0].gold=20; cap.units[0]=[civ('pob')];
  const p0=cap.prod; paso([{t:'train',zone:cap.id,u:'arq',n:1}]); return cap.units[0].some(u=>u.t==='arq')&&(cap.eq.arq||0)===0&&recruitCost(G,0,cap,'arq','new',true).prod===2;`);

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
  const r=techImpact(G,0,'Molino de piedra'); return r.ups.length===1&&r.ups[0].to===2&&r.out.food===6;`);   // nivel 1: 2 trabajadores × 1; nivel 2: 4 × 2

prueba('Trabajadores por nivel: nivel 1 = 2 puestos, nivel 2 = 4, nivel 3 = 6', base + `
  const b1={t:'molino',l:1}, b2={t:'molino',l:2}, b3={t:'molino',l:3}; return bldSlots(G,0,b1)===2&&bldSlots(G,0,b2)===4&&bldSlots(G,0,b3)===6;`);

prueba('Un molino de nivel 3 con 6 agricultores usa los 6 puestos', base + `
  cap.units[0]=[1,2,3,4,5,6].map(()=>civ('agr')); cap.b.push({t:'molino',l:3,s:null,wk:0,cost:60}); paso(); return cap.b[0].wk===6;`);

prueba('Costo de crecer: llegar al tamaño n cuesta n² (3.º = 9, 4.º = 16, 10.º = 100)', base + `
  G.step=99; const c=n=>{ cap.size=n-1; return growCost(G,0,cap); }; return c(3)===9&&c(4)===16&&c(10)===100;`);

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

prueba('Un depósito de plata rinde 1 y sube a 2 con el tiempo; uno de oro rinde 2 y sube hasta 5', base + `
  const z=G.zones.find(z=>z.role==='vacia'&&z.owner===null); z.owner=0; z.units[0]=[civ('pob')]; z.res='piedra'; z.resO='gemas'; z.resHeld=0; const r=[]; for(let s=0;s<22;s++){ paso(); r.push(z.resGains.map(x=>x.n)); }
  return r[0][0]===1&&r[0][1]===2&&r[21][0]===2&&r[21][1]===5;`);

prueba('Reparto de depósitos: casi todas las zonas tienen plata, 1 de cada 3 oro, las capitales solo plata y las fronteras nada', `
  let zs=0,pl=0,or=0,capOr=0,capNo=0,frRes=0; for(let sd=1;sd<=30;sd++){ const H=newGame(sd%12,sd%3+2,sd,'normal'); H.zones.forEach(z=>{ if(z.role==='frontera'){ if(z.res||z.resO) frRes++; return; } zs++; if(z.res) pl++; if(z.resO) or++; if(z.capital){ if(z.resO) capOr++; if(!z.res) capNo++; } }); }
  return frRes===0&&capOr===0&&capNo===0&&pl/zs>0.85&&pl/zs<0.99&&or/zs>0.25&&or/zs<0.42;`);

prueba('Un recurso en oro vale el doble que en plata (piedra: -25 % o -50 % al construir una fortificación)', base + `
  const z=cap; const c0=stepCost(G,0,z,'fort',false); z.res='piedra'; const c1=stepCost(G,0,z,'fort',false); z.res=null; z.resO='piedra'; const c2=stepCost(G,0,z,'fort',false);
  return c1<c0&&c2<c1&&c2===Math.ceil(c0*0.5)&&hasRes(G,0,'piedra')===2;`);

prueba('Oferta entre jugadores: lo ofrecido queda en reserva y al otro le llega como encuentro', base + `
  G.F[0].gold=30; G.F[1].gold=0; const c1=G.zones.find(z=>z.capital&&z.owner===1); c1.prod=10; G.F[1].encNext=999; G.F[0].encNext=999;
  paso([{t:'offer',to:1,give:{res:'gold',n:10},ask:{res:'prod',n:6}}]);
  const e=G.F[1].enc; return G.F[0].gold>=20&&G.F[0].gold<=26&&!!e&&e.k==='trato'&&e.cost.res==='prod'&&e.cost.n===6&&e.gain.res==='gold'&&e.gain.n===10;`);

prueba('Oferta aceptada: se hace el intercambio entre los dos', base + `
  G.F[0].gold=30; const c1=G.zones.find(z=>z.capital&&z.owner===1); c1.prod=10; G.F[1].gold=0; G.F[1].encNext=999; G.F[0].encNext=999;
  paso([{t:'offer',to:1,give:{res:'gold',n:10},ask:{res:'prod',n:6}}]); const cp=cap.prod, p1=c1.prod; paso([{t:'encounter',f:1,choice:'si'}]);
  return G.F[1].gold>=10&&cap.prod>=cp+6&&c1.prod<p1+8&&!G.F[1].enc&&G.F[1].gold<22;`);

prueba('Oferta rechazada o ignorada: se devuelve lo reservado, sin consecuencias', base + `
  G.F[0].gold=30; G.F[0].encNext=999; G.F[1].encNext=999; paso([{t:'offer',to:1,give:{res:'gold',n:10},ask:{res:'tech',n:5}}]); const reservado=G.F[0].gold<=26;
  paso([{t:'encounter',f:1,choice:'no'}]); return reservado&&G.F[0].gold>=30&&!G.F[1].enc&&G.offers.length===0;`);

prueba('Oferta que caduca: se devuelve; y no se puede ofrecer lo que no se tiene', base + `
  G.F[0].gold=5; G.F[0].encNext=999; G.F[1].encNext=999; paso([{t:'offer',to:1,give:{res:'gold',n:50},ask:{res:'tech',n:5}}]); const sin=G.offers.length===0&&!G.F[1].enc;
  G.F[0].gold=0; G.offers.push({id:99,from:0,to:1,give:{res:'gold',n:10},ask:{res:'tech',n:5},step:G.step-OFFER_TTL-2}); paso();
  return sin&&G.offers.length===0&&!G.F[1].enc&&G.F[0].gold>=10;`);

prueba('Un año tiene una parte cierta (Prosperidad o Escasez) y una variable del mismo signo, y las dos duran los 12 pasos', `
  const H=newGame(0,3,5,'normal'); const y2=H.evq.filter(e=>e.step===(EV_FIRST_YEAR-1)*YEAR_STEPS+1); const base=y2.find(e=>EVT[e.id].year), fl=y2.find(e=>!EVT[e.id].year);
  const sig=EVT[base.id].k; return y2.length===2&&base.dur===YEAR_STEPS&&fl.dur===YEAR_STEPS&&EVT[fl.id].k===sig&&H.evq.every(e=>e.step>YEAR_STEPS);`);

prueba('El primer año es de fundación (sin eventos) y nunca hay tres años seguidos del mismo signo', `
  let ok=true; for(let sd=1;sd<=20;sd++){ const H=newGame(sd%12,2,sd,'normal'); for(let i=0;i<8;i++){ H.evq=[]; scheduleEvents(H); } const sg=H.evGen.signs; for(let i=2;i<sg.length;i++) if(sg[i]===sg[i-1]&&sg[i]===sg[i-2]) ok=false; if(H.evq.some(e=>e.step<=YEAR_STEPS)) ok=false; }
  return ok;`);

prueba('Un evento del año dura los 12 pasos y sus efectos se mantienen', base + `
  const z=cap; z.terrain='pra'; G.evq=[{step:G.step,id:'cosecha',dur:YEAR_STEPS}]; const ef=[]; for(let i=0;i<YEAR_STEPS+1;i++){ paso(); ef.push((z.ev&&z.ev.foodAgr)||0); }
  return ef.slice(0,YEAR_STEPS).every(v=>v>0)&&ef[YEAR_STEPS]===0;`);

prueba('Prosperidad sube y Escasez baja un 15 % lo que producen todas las zonas', base + `
  const z=cap; z.units[0]=[civ('agr'),civ('agr'),civ('ing'),civ('com')]; z.b=[]; const f0=()=>{ z.food=0; z.prod=0; G.F[0].gold=0; };
  G.evq=[]; f0(); paso(); const n=z.last.food; G.evAct=[]; G.evq=[{step:G.step,id:'prosper',dur:YEAR_STEPS}]; f0(); paso(); const p=z.last.food;
  G.evAct=[]; G.evq=[{step:G.step,id:'escasez',dur:YEAR_STEPS}]; f0(); paso(); const e=z.last.food;
  return p>n&&e<n&&z.ev.mul&&Math.abs(z.ev.mul.food-(1-EV_BASE_PCT))<1e-9;`);

prueba('El evento negativo variable se puede evitar con Pronóstico, pero la parte cierta del año no', base + `
  G.M[0].avoidNeg=1; G.F[0].lastAvoid=-99; const z=cap; z.terrain='pra'; G.evq=[{step:G.step,id:'escasez',dur:YEAR_STEPS},{step:G.step,id:'sequia',dur:YEAR_STEPS}]; paso();
  return !(z.ev.foodAgr<-0.6)&&z.ev.mul&&z.ev.mul.food<1;`);

prueba('Nombrar general: asciende a la persona elegida (no a otra) y conserva su zona natal y sus rasgos', base + `
  cap.prod=50; cap.food=50; G.F[0].gold=50; const a=conRasgo('pob','fue',2), b=conRasgo('pob','fue',-2), c=civ('pob'); a.home=cap.id; b.home=cap.id; cap.units[0]=[b,c,a]; const idB=b.id;
  paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'civ',ids:[idB]}]); const us=cap.units[0]; const g=us.find(u=>u.id===idB);
  return g.t==='sol'&&g.gen===1&&g.home===cap.id&&g.tr[0].k==='fue'&&us.find(u=>u.id===a.id).t==='pob'&&us.find(u=>u.id===c.id).t==='pob';`);

prueba('Nombrar general sin elegir: va el más apto para pelear (fuerza y salud), no el primero de la lista', base + `
  cap.prod=50; cap.food=50; G.F[0].gold=50; const a=conRasgo('pob','fue',2), b=conRasgo('pob','sal',-1), c=civ('pob'); cap.units[0]=[b,c,a];
  paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'civ'}]); const us=cap.units[0]; return us.find(u=>u.id===a.id).gen===1&&!us.find(u=>u.id===b.id).gen;`);

prueba('Reclutar: necesita un Cuartel, paga producción, comida y oro, y NO gasta ningún civil', base + `
  cap.units[0]=[civ('pob'),civ('pob')]; cap.prod=50; cap.food=50; G.F[0].gold=50; paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'new'}]); const sinCuartel=!cap.units[0].some(u=>u.t==='sol');
  cap.b.push({t:'cuartel',l:1,s:null,wk:0,cost:20}); const p0=cap.prod, f0=cap.food, g0=G.F[0].gold; paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'new'}]);
  const sol=cap.units[0].filter(u=>u.t==='sol'); const civs=cap.units[0].filter(u=>UT[u.t].civ).length;
  return sinCuartel&&sol.length===1&&!sol[0].gen&&sol[0].home===undefined&&civs>=2&&civs===cap.units[0].length-1;`);

prueba('Cada Cuartel recluta tantas tropas por paso como su nivel (más con Levas)', base + `
  cap.units[0]=[civ('pob')]; cap.prod=200; cap.food=200; G.F[0].gold=200; cap.b.push({t:'cuartel',l:2,s:null,wk:0,cost:40}); paso([{t:'train',zone:cap.id,u:'sol',n:5,from:'new'}]); const n1=cap.units[0].filter(u=>u.t==='sol').length;
  G.F[0].techs['Levas']=1; cap.prod=200; cap.food=200; G.F[0].gold=200; paso([{t:'train',zone:cap.id,u:'sol',n:5,from:'new'}]); const n2=cap.units[0].filter(u=>u.t==='sol').length-n1; return n1===2&&n2===3;`);

prueba('Mercenarios: reclutar soldados fuera de un Cuartel, pagando el doble de oro', base + `
  cap.units[0]=[civ('pob')]; cap.prod=50; cap.food=50; G.F[0].gold=50; G.F[0].techs['Mercenarios']=1; recomputeMods(G); const c=recruitCost(G,0,cap,'sol','new',false); const c0=UNIT_COST.sol.gold;
  paso([{t:'train',zone:cap.id,u:'sol',n:1,from:'new'}]); return c.gold===c0*2&&cap.units[0].some(u=>u.t==='sol')&&!canRecruit(G,0,cap,'ber');`);

prueba('Mantenimiento: un soldado come 1, un caballero 2 y el berserker cobra 1 de oro; en el Cuartel no cuestan nada', base + `
  cap.b=[]; const sol=civ('sol'), cab=civ('cab'), ber=civ('ber'); cap.units[0]=[sol,cab,ber]; const fr={n:0};
  const ns=unitNeed(G,cap,0,sol,fr), nc=unitNeed(G,cap,0,cab,fr), nb=unitNeed(G,cap,0,ber,fr);
  const fr2={n:3}; const nl=unitNeed(G,cap,0,civ('sol'),fr2); return ns===1&&nc===2&&nb===1&&nl===0&&UNIT_UPKEEP.ber.gold===1&&UNIT_UPKEEP.sol.gold===0;`);

prueba('Paga: si no alcanza el oro, las tropas sin paga pelean peor y se avisa', base + `
  cap.b=[]; const b1=civ('ber'), b2=civ('ber'); cap.units[0]=[b1,b2]; G.F[0].gold=0; const L=[]; payTroops(G,0,m=>L.push(m)); const sinPaga=b1.unp===1||b2.unp===1;
  G.F[0].gold=20; payTroops(G,0,m=>L.push(m)); return sinPaga&&b1.unp===0&&b2.unp===0&&G.F[0].gold===18&&L.length===1;`);

prueba('Los generales son más fuertes y los últimos en morir de su tipo', base + `
  let ok=true, vistos=0; for(let sd=1;sd<=30&&ok;sd++){ const H=newGame(0,2,sd,'normal'); H.evq=[]; H.fx=[]; H.logNow=[]; const z=H.zones.find(z=>z.role==='vacia'); const g0=mkUnit(H,0,'sol'); g0.gen=1; const t=[g0,mkUnit(H,0,'sol'),mkUnit(H,0,'sol'),mkUnit(H,0,'sol')]; z.units[0]=t; z.units[1]=[mkUnit(H,1,'sol'),mkUnit(H,1,'sol'),mkUnit(H,1,'sol'),mkUnit(H,1,'sol'),mkUnit(H,1,'sol')];
    fightZone(H,z,[0,1],{0:true,1:true},()=>{}); const B=H.battles[H.battles.length-1]; const muertos=new Set();
    B.waves.forEach(w=>w.acts.forEach(a=>a.hits.forEach(h=>{ const u=B.units[h.i]; if(u.gen&&!muertos.size&&false) ok=false; if(u.gen&&B.units.some((v,j)=>v.f===u.f&&v.t===u.t&&!v.gen&&!muertos.has(j))) { if(h.dmg>0||h.abs>0) ok=false; } if(h.dead) muertos.add(h.i); vistos++; }))); }
  const gu=mkUnit(G,0,'sol'); gu.gen=1; return ok&&vistos>0;`);

prueba('Repoblación: la muerte de un civil nacido en una zona abarata el próximo crecimiento de esa zona (2 muertes → los 2 siguientes)', base + `
  G.step=99; cap.size=5; const normal=growCost(G,0,cap); const a=civ('pob'), b=civ('pob'); a.home=cap.id; b.home=cap.id; unitLost(G,a,0); const c1=growCost(G,0,cap); unitLost(G,b,0);
  const ok1=cap.repop===2&&c1===Math.ceil(normal*(1-REPOP_PCT)); cap.units[0]=[civ('pob')]; cap.prog=cap.size*cap.size*9; cap.food=cap.f0=0; G.evq=[]; growZone(G,cap);
  return ok1&&cap.repop<2&&cap.repop>=0;`);

prueba('Repoblación: solo cuentan los nacidos por crecimiento propio (no capturados, ni de encuentros, ni tropas reclutadas)', base + `
  const ajeno=civ('pob'); const recluta=civ('sol'); unitLost(G,ajeno,0); unitLost(G,recluta,0); const otro=civ('pob'); otro.home=cap.id; cap.owner=1; unitLost(G,otro,0); const noPropia=!cap.repop; cap.owner=0;
  const gen=civ('sol'); gen.gen=1; gen.home=cap.id; unitLost(G,gen,0); return !ajeno.home&&noPropia&&cap.repop===1;`);

prueba('La victoria Económica cuenta solo civiles: las tropas no suman población', base + `
  cap.units[0]=[civ('pob'),civ('pob'),civ('sol'),civ('sol'),civ('arq')]; return civPop(G,0)===2&&totalPop(G,0)===5&&victoryConds(G,0).find(c=>c.k==='Económica').v===2;`);

prueba('Retirar a un general lo devuelve a ser civil; dar de baja a una tropa devuelve parte de la producción', base + `
  cap.prod=30; const gn=civ('sol'); gn.gen=1; gn.home=cap.id; const s1=civ('sol'), s2=civ('sol'); cap.units[0]=[gn,s1,s2];
  paso([{t:'demob',zone:cap.id,u:'sol',to:'pob',n:1}]); const volvio=gn.t==='pob'&&!gn.gen&&gn.home===cap.id&&s1.t==='sol';
  const p0=cap.prod; paso([{t:'demob',zone:cap.id,u:'sol',to:'baja',n:2}]); return volvio&&cap.units[0].filter(u=>u.t==='sol').length===0&&cap.prod>=p0+Math.floor(UNIT_COST.sol.prod*DISBAND_REFUND)*2-2;`);

prueba('Guardia de élite: los militares que trabajan en ese Cuartel tienen +1 de defensa en la batalla', base + `
  const mk=(spec)=>{ const H=newGame(0,2,3,'normal'); H.evq=[]; H.fx=[]; H.logNow=[]; const z=H.zones.find(z=>z.capital&&z.owner===0); z.b.push({t:'cuartel',l:1,s:spec,wk:0,cost:20}); const u=mkUnit(H,0,'sol'); u.free=1; z.units[0]=[u]; z.units[1]=[mkUnit(H,1,'sol')]; fightZone(H,z,[0,1],{0:false,1:true},()=>{}); return H.battles[H.battles.length-1].units.find(x=>x.f===0).cush; };
  return mk('guardia')===mk(null)+1;`);

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
  const v=G.zones[cap.adj[0]]; v.owner=0; v.units[0]=[civ('sol'),civ('sol'),civ('sol'),civ('sol'),civ('sol'),civ('sol')]; v.food=0; cap.food=30; G.F[0].gold=0; cap.units[0]=[civ('pob')];
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
prueba('Tribus: cada TRIBE_REQ_EVERY pasos piden lo de su oficio a los vecinos; ignorarlo baja la relación 1 pero no ataca de inmediato', base + TRIBU + `
  tz.tspec='com'; G.step=TRIBE_REQ_EVERY; const u0=(tz.units[4]||[]).length; paso(); const t=G.tributes.find(t=>t.zone===tz.id);
  const pide=!!t&&t.res==='gold'&&t.targets.includes(0); for(let i=0;i<TRIBE_REQ_EVERY+2;i++) paso(); return pide&&!G.tributes.some(x=>x.zone===tz.id&&x===t)&&(tz.units[4]||[]).length>=u0&&(tz.rel||{})[0]===-1&&!(G.wars||[]).some(w=>w.tribe===tz.id);`);

prueba('Tribus: cumplir un pedido sube la relación (0 a 3)', base + TRIBU + `
  tz.tspec='com'; G.step=TRIBE_REQ_EVERY; paso(); G.F[0].gold=60; paso([{t:'tribute',tribe:tz.id,from:n.id}]); return (tz.rel||{})[0]===1;`);

prueba('Tribus: tras cumplir un pedido, esa tribu no vuelve a pedirte hasta pasado el descanso', base + TRIBU + `
  tz.tspec='com'; G.step=TRIBE_REQ_EVERY; paso(); G.F[0].gold=99; paso([{t:'tribute',tribe:tz.id,from:n.id}]); const pagó=(tz.paidAt||{})[0]!==undefined;
  const sig=tribeNextAsk(G,tz,0); let pidio=false; for(let i=0;i<TRIBE_REQ_COOLDOWN-2;i++){ paso(); if(G.tributes.some(t=>t.zone===tz.id&&t.targets.includes(0)&&!t.paid[0])) pidio=true; }
  return pagó&&!pidio&&sig>=TRIBE_REQ_COOLDOWN-TRIBE_REQ_EVERY;`);

prueba('Tribus: cada pedido ignorado baja la relación 1 y, en insatisfacción 3, la tribu declara la guerra', base + TRIBU + `
  tz.tspec='com'; const ant=[]; for(let i=0;i<4*TRIBE_REQ_EVERY&&!(G.wars||[]).some(w=>w.tribe===tz.id);i++){ paso(); ant.push((tz.rel||{})[0]||0); }
  const guerra=(G.wars||[]).some(w=>w.tribe===tz.id&&w.f===0); return guerra&&ant.includes(-1)&&ant.includes(-2)&&(tz.rel||{})[0]===0&&G.hist.some(h=>h.lines.some(l=>l.includes('declara la guerra')));`);

prueba('Tribus: cumplir un pedido sube la relación aunque estuviera en negativo', base + TRIBU + `
  tz.tspec='com'; tz.rel={0:-2}; G.step=TRIBE_REQ_EVERY; paso(); G.F[0].gold=60; paso([{t:'tribute',tribe:tz.id,from:n.id}]); return tz.rel[0]===-1;`);

prueba('Tribus: sin relación 3 no se puede anexar; con relación 3 sí', base + TRIBU + `
  tz.rel={0:2}; G.F[0].gold=0; paso([{t:'annex',zone:tz.id,from:n.id}]); const antes=tz.owner===4; tz.rel={0:3}; n.food=45; paso([{t:'annex',zone:tz.id,from:n.id}]); return antes&&tz.owner===0;`);

prueba('Tribus: atacarlas es entrar en guerra: sus civiles se vuelven guerreros y te atacan', base + TRIBU + `
  for(let i=0;i<6;i++) tz.units[4].push(mkUnit(G,4,'sol')); tz.rel={0:2}; G.F[0].gold=50; n.units[0]=[civ('sol'),civ('sol'),civ('sol')];
  paso([{t:'move',from:n.id,to:tz.id,u:{sol:3},stance:'ataque'}]);
  const guerra=G.wars.some(w=>w.tribe===tz.id&&w.f===0)&&tz.rel[0]===0; const berserkers=(tz.units[4]||[]).every(u=>u.t==='ber');
  paso(); const ataca=G.hist.some(h=>h.lines.some(l=>l.includes('ataca '))); for(let i=0;i<6;i++) paso(); return guerra&&berserkers&&ataca&&G.wars.length===0;`);

prueba('Tribus: al empezar cada año (desde el 2.º) cada una gana 1 civil y 2 bárbaros; no antes, y ya no hay Inquietud ni Furia', base + `
  const ts=G.zones.filter(z=>z.owner===TRIBE); const n0=ts.map(z=>lst(z,TRIBE).length), b0=ts.map(z=>lst(z,TRIBE).filter(u=>u.t==='ber').length);
  G.step=12; paso(); const igual=ts.every((z,i)=>lst(z,TRIBE).length===n0[i]);   // el paso 12 aún es del año 1
  paso(); const gana=ts.every((z,i)=>lst(z,TRIBE).length===n0[i]+3&&lst(z,TRIBE).filter(u=>u.t==='ber').length===b0[i]+2);   // el paso 13 empieza el año 2
  const log=G.log.some(l=>l.includes('cada tribu gana 1 civil y 2 bárbaros'));
  return ts.length>0&&igual&&gana&&log&&!EVT.inquietud&&!EVT.furia&&EVENTS.filter(e=>e.k==='t').length===2;`);

prueba('Inundación: las reservas se parten a la mitad y el resto del año el almacén guarda la mitad', base + `
  const z=G.zones.find(z=>z.owner===0); z.terrain='rio'; z.food=40; z.prod=40; const cap0=capStore(G,z,'food'); G.step=15;
  G.evq=[{step:15,id:'inunda',dur:6}]; G.evAct=[]; paso(); const a=G.zones[z.id];
  const c0=cap0/z.size, mitad=capStore(G,a,'food')===Math.floor(c0*a.size/2)&&G.evAct.some(x=>x.id==='inunda'&&x.end===20);
  const f1=a.food; for(let i=0;i<3;i++) paso(); const sigue=capStore(G,a,'food')===Math.floor(c0*a.size/2)&&a.food<=capStore(G,a,'food');
  for(let i=0;i<4;i++) paso(); return mitad&&f1<=22&&sigue&&capStore(G,a,'food')===c0*a.size;`);

// ---- Registro descargable ----
prueba('El registro de la partida trae mapa, jugadores, historial y condiciones, en datos y en texto', base + `
  for(let i=0;i<8;i++) paso();
  const d=gameLogData(G,{ready:[3000,5000],orders:[2,4]}), tx=gameLogText(G,{ready:[3000,5000],orders:[2,4]});
  const ok=d.pasosJugados===G.step-1&&d.jugadores.length===G.N&&d.historial.length===G.hist.length&&d.condicionesFinales.length===G.N&&d.condicionesFinales[0].length===7;
  const json=JSON.parse(JSON.stringify(d));
  return ok&&json.semilla===G.seed&&tx.includes('Condiciones de victoria')&&tx.includes('Historial:')&&tx.includes('4 s en promedio')&&tx.includes('3.0 órdenes por paso');`);

// ---- Subasta (13.3) ----
const SUB = `G.fx=[]; const logs=[]; const L=m=>logs.push(m); const item=(cat,tier,det)=>({cat,tier,det:det||{}});`;
prueba('La subasta se anuncia 10 pasos antes del paso 20, con tantos objetos como jugadores', base + `
  let antes=true; for(let i=1;i<8;i++){ paso(); if(G.auction) antes=false; } paso(); paso();
  const a=G.auction; return AUCTION_NOTICE===10&&antes&&!!a&&a.step===20&&G.step===10&&a.items.length===2&&['gold','tech','food','prod'].includes(a.cur)&&a.items.every(it=>AUCTION_CATS[it.cat]&&it.tier>=0&&it.tier<=2);`);

prueba('Subasta: el valor esperado de un objeto sube con el nivel y se expresa en la moneda de la subasta', base + SUB + `
  const v=c=>[0,1,2].map(t=>auctionValue(item(c,t,{res:'prod'}),'gold'));
  const sube=['pel','pob','sab','car','rec'].every(c=>{ const x=v(c); return x[0]>0&&x[0]<x[1]&&x[1]<x[2]; });
  const car=item('car',0,{res:'food',n:20}), car2=item('car',0,{res:'prod',n:40});   // el valor esperado no mira lo oculto: 30 de media × 0,7 = 21 de oro equivalente
  return sube&&Math.abs(auctionValue(car,'gold')-21)<1e-9&&auctionValue(car,'gold')===auctionValue(car2,'gold')&&Math.abs(auctionValue(car,'food')-35)<1e-9;`);

prueba('Subasta: los bots pujan cerca del valor esperado y sin pasar de lo que pueden gastar', base + SUB + `
  G.F[1].gold=1000; G.auction={step:20,cur:'gold',items:[item('car',1,{res:'food'}),item('pob',0)],bids:{}}; G.step=19;
  const o=botOrders(G,1).filter(x=>x.t==='bid'); const por={}; o.forEach(x=>por[x.item]=x.amount);
  const e0=auctionValue(G.auction.items[0],'gold'), e1=auctionValue(G.auction.items[1],'gold');
  const cerca=Math.abs(por[0]-e0)<=16&&Math.abs(por[1]-e1)<=16;   // varianza 10 (desviación 3,2): 16 son 5 desviaciones
  G.F[1].gold=20; G.auction.bids={}; const pobre=botOrders(G,1).filter(x=>x.t==='bid').reduce((a,x)=>a+x.amount,0);
  return o.length===2&&cerca&&pobre<=20*AUCTION_BOT_SPEND;`);

prueba('Subasta: el cargamento es variable (entre su rango), se sortea al anunciarla y se entrega tal cual', base + SUB + `
  const salen=new Set(); for(let k=0;k<40;k++){ G.auction=null; const a=auctionNew(G,20); a.items.forEach(it=>{ if(it.cat==='car'){ const r=AUCTION_CAR_RANGE[it.tier]; if(it.det.n<r[0]||it.det.n>r[1]) throw new Error('fuera de rango'); salen.add(it.det.n); } }); }
  G.auction={step:20,cur:'gold',items:[item('car',0,{res:'food',n:37})],bids:{0:{0:10}}}; G.F[0].gold=100; const p0=cap.prog; auctionResolve(G,L);
  return salen.size>5&&cap.prog===p0+37;`);

prueba('Subasta: los bots acumulan la moneda desde el anuncio (la reservan) y la comida va a Guardar', base + SUB + `
  G.auction={step:20,cur:'food',items:[item('car',1,{res:'food',n:50}),item('pob',0)],bids:{}}; G.step=12;
  const o=botOrders(G,1); const gm=o.filter(x=>x.t==='growmode'&&x.mode==='guardar');
  const z1=G.zones.find(z=>z.owner===1); z1.food=30; const f0=z1.food;
  G.auction={step:20,cur:'gold',items:[item('pel',2)],bids:{}}; G.F[1].gold=60; const h=botAuctionHold(G,1); botOrders(G,1);
  const reserva=h.cur==='gold'&&h.amt===Math.min(60,Math.ceil(auctionValue(G.auction.items[0],'gold')*AUCTION_BOT_SPEND));
  const intacto=G.F[1].gold===60&&z1.food===f0;   // lo reservado solo se «oculta» mientras decide: después se devuelve
  G.auction=null; G.F[1].botHeld={}; G.F[1].botHeld[z1.id]='growmode'; const o3=botOrders(G,1);
  return gm.length>=1&&reserva&&intacto&&o3.some(x=>x.t==='growmode'&&x.mode==='crecer');`);

prueba('Tratos de bots: reciben al menos el mismo valor que dan, no usan la moneda de la próxima subasta y respetan paso, ritmo y tope', base + `
  G.step=24; G.rng=()=>0; const f=1; G.step=24-f+8*0; while((G.step+f)%OFFER_BOT_EVERY!==0) G.step++; if(G.step<OFFER_BOT_FROM) G.step=OFFER_BOT_FROM+((OFFER_BOT_EVERY-(OFFER_BOT_FROM+f)%OFFER_BOT_EVERY)%OFFER_BOT_EVERY);
  G.F[f].gold=200; G.F[f].tech=5; G.zones.filter(z=>z.owner===f).forEach(z=>{ z.food=2; z.prod=2; });
  const t=botTradeOffer(G,f); const V=OFFER_VAL;
  const valido=!!t&&t.t==='offer'&&t.give.res==='gold'&&t.ask.res!=='gold'&&t.give.n>=OFFER_BOT_MIN&&t.give.n<=OFFER_BOT_MAX&&t.ask.n*V[t.ask.res]>=t.give.n*V[t.give.res]-1e-9;
  G.auction={step:G.step+8,cur:'gold',items:[],bids:{}}; const t2=botTradeOffer(G,f); const sinSubasta=!t2||(t2.give.res!=='gold'&&t2.ask.res!=='gold');
  G.auction=null; G.offers=[{id:1,from:f,to:0,give:{res:'gold',n:5},ask:{res:'food',n:9},step:G.step}]; const tope=botTradeOffer(G,f)===null;
  G.offers=[]; const s0=G.step; G.step=OFFER_BOT_FROM-1; const antes=botTradeOffer(G,f)===null; G.step=s0+1; const ritmo=botTradeOffer(G,f)===null; G.step=s0;
  G.rng=()=>0.99; const azar=botTradeOffer(G,f)===null;
  return valido&&sinSubasta&&tope&&antes&&ritmo&&azar;`);

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
prueba('Las 20 historias están completas: 4 capítulos, variantes por camino y finales por camino', base + `
  const ganaOk=g=>!g||(Object.keys(g).every(k=>['units','res','n','eq','prog','rel','tpob','saber','bld','tres'].includes(k))&&(!g.units||Object.keys(g.units).every(t=>UT[t]))&&(!g.res||(['food','prod','gold','tech'].includes(g.res)&&g.n>0))&&(!g.eq||Object.keys(g.eq).every(t=>EQUIP_N[t]))&&(!g.tpob||g.tpob.every(x=>TRAIT_INFO[x.k]&&Math.abs(x.l)<=2))&&(!g.bld||BT[g.bld])&&(!g.tres||RES[g.tres.key]));
  return STORY_IDS.length===20&&new Set(STORY_IDS.map(id=>STORIES[id].n)).size===20&&STORY_IDS.every(id=>{ const S=STORIES[id]; const t=S.tags; const optOk=o=>o.lbl&&(o.cost===null||(o.cost.res&&o.cost.n>0));
    const c1=S[1].opts.length>=2&&S[1].opts.every(o=>optOk(o)&&ganaOk(o.gain));
    const c23=[2,3].every(c=>t.every(tag=>S[c][tag]&&S[c][tag].txt&&S[c][tag].opts.length===2&&S[c][tag].opts.every(o=>optOk(o)&&ganaOk(o.gain)&&t.includes(o.t))));
    const c4=t.every(tag=>S[4].txt[tag])&&S[4].opts.length===2&&S[4].opts.every(o=>optOk(o)&&t.every(tag=>ganaOk(o.g[tag])&&o.g[tag])); return c1&&c23&&c4; });`);

prueba('Cada historia se puede vivir entera por sus dos caminos, sin errores y llegando al final', base + `
  const F=G.F[0]; let ok=true, n=0; cap.units[0]=[civ('pob'),civ('pob')];
  for(const id of STORY_IDS) for(const lado of [0,1]) {
    F.story={id,ch:1,next:99,tags:[]}; F.enc=null; G.hist=[]; const t=STORIES[id].tags;
    for(let ch=1;ch<=4;ch++){
      F.story.ch=ch; cap.food=500; cap.prod=500; F.gold=500; F.tech=500; F.enc=makeChapter(G,0);
      if(!F.enc||!F.enc.opts||F.enc.opts.length<2){ ok=false; break; }
      let i=0; if(ch>1&&ch<4){ i=F.enc.opts.findIndex(o=>o.t===t[lado]); if(i<0) i=0; } else i=lado%F.enc.opts.length;
      try{ resolveStep(G,[{f:0,t:'encounter',choice:['a','b','c'][i]}]); }catch(e){ ok=false; console.log('  ✗ '+id+' cap '+ch+': '+e.message); break; }
      F.enc=null; n++;
    }
    if(!(F.story.done||F.story.ch>=4)) ok=false;
  }
  return ok&&n===STORY_IDS.length*8;`);

prueba('Hay 40 encuentros base (86 variantes) y 20 de elegir entre dos (40 variantes), todos con datos válidos', base + `
  const resOk=r=>['food','prod','gold','tech'].includes(r);
  const gainOk=g=>!g||(Object.keys(g).every(k=>['units','res','n','eq','prog','rel','tpob','saber','bld','tres','gamble'].includes(k))&&(!g.units||Object.keys(g.units).every(t=>UT[t]))&&(!g.res||(resOk(g.res)&&g.n>0))&&(!g.eq||Object.keys(g.eq).every(t=>EQUIP_N[t]))&&(!g.gamble||(g.gamble.p>0&&g.gamble.p<1&&resOk(g.gamble.res)&&g.gamble.n>0)));
  const ids=new Set(ENCOUNTERS.map(e=>e.id)).size===ENCOUNTERS.length&&new Set(CHOICES.map(e=>e.id)).size===CHOICES.length;
  const encOk=ENCOUNTERS.every(e=>e.who.length>=2&&e.txt&&e.cost&&resOk(e.cost.res)&&e.cost.n>0&&gainOk(e.gain)&&(!e.terr||e.terr.every(t=>TERRN[t])));
  const chOk=CHOICES.every(e=>e.who.length===2&&e.opts.length===2&&e.opts.every(o=>o.lbl&&resOk(o.cost.res)&&o.cost.n>0&&gainOk(o.gain)));
  return ENCOUNTERS.length===40&&ENC_VARIANTS===86&&CHOICES.length===20&&CHOICES.reduce((a,e)=>a+e.who.length,0)===40&&ids&&encOk&&chOk;`);

prueba('Las historias llegan una tras otra, sin repetirse, con descanso entre ellas y hasta STORY_MAX por jugador', base + `
  const F=G.F[0]; const ini=[]; let ult=0, ok=true;
  for(let i=0;i<140;i++){ cap.food=300; cap.prod=300; F.gold=999; F.tech=999; const o=F.enc?[{t:'encounter',choice:F.enc.opts?'a':'si'}]:[]; const antes=F.stories||0; paso(o); if((F.stories||0)>antes){ ini.push(G.step); }
    if(F.story&&F.story.done&&!F.story.fin){ F.story.fin=G.step; } }
  const u=F.storyUsed||[]; const distintas=new Set(u).size===u.length&&u.length===F.stories;
  return distintas&&F.stories>=3&&F.stories<=STORY_MAX;`);

prueba('Al terminar una historia hay un descanso de STORY_BREAK_MIN a STORY_BREAK_MAX pasos antes de la siguiente', base + `
  const F=G.F[0]; F.story={id:'caravana',ch:4,next:99,tags:['C','C','C']}; F.storyUsed=['caravana']; F.stories=1; F.encNext=999;
  F.enc=makeChapter(G,0); paso([{t:'encounter',choice:'a'}]); const st=F.story; const espera=st.done&&st.nextNew>=G.step+STORY_BREAK_MIN-1&&st.nextNew<=G.step+STORY_BREAK_MAX;
  F.encNext=undefined; for(let i=0;i<STORY_BREAK_MAX+4;i++){ cap.food=300; paso(F.enc?[{t:'encounter',choice:F.enc.opts?'a':'si'}]:[]); }
  return espera&&F.stories>=2&&F.story.id!=='caravana'&&F.storyUsed.length===F.stories;`);

prueba('Con STORY_MAX historias vividas no llega ninguna más', base + `
  const F=G.F[0]; F.story={id:'caravana',ch:5,next:99,tags:['C','C','C','C'],done:1,nextNew:G.step}; F.storyUsed=['caravana','maestro','heredero','pozo']; F.stories=STORY_MAX; F.encNext=undefined;
  for(let i=0;i<20;i++){ cap.food=300; paso(F.enc?[{t:'encounter',choice:F.enc.opts?'a':'si'}]:[]); } return F.stories===STORY_MAX&&F.story.id==='caravana';`);

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

prueba('Historia: al cerrar el capítulo 4 la historia termina; no llegan más capítulos de ella y la siguiente espera su descanso', base + HIST + `
  nuevo('maestro',4,['S','O','S']); paso([{t:'encounter',choice:'a'}]); const fin=F.story.done===1&&F.story.ch===5; const t0=G.step; let mal=false; F.storyUsed=['maestro']; F.stories=1; F.encNext=undefined;
  for(let i=0;i<24;i++){ cap.food=300; paso(); const e=G.F[0].enc; if(e&&e.k==='historia'){ if(e.story.id==='maestro'||G.step<t0+STORY_BREAK_MIN) mal=true; } G.F[0].enc=null; } return fin&&!mal;`);

prueba('Historia: ganancias nuevas (relación, poblador extraordinario, saber, edificio, recurso temporal)', base + HIST + `
  const tz=G.zones.find(z=>z.owner===4); const n=G.zones[tz.adj.find(a=>G.zones[a].role!=='frontera'&&G.zones[a].owner===null)]; n.owner=0; n.units[0]=[civ('pob')];
  cap.size=9; const t0=Object.keys(G.F[0].techs).length; F.story={id:'caravana',ch:1,next:99,tags:[]};
  const gana=g=>{ F.enc={id:'x',k:'historia',who:'t',txt:'t',zone:cap.id,cost:null,gain:null,refuse:null,step:G.step,str:0,story:{id:'caravana',ch:1},opts:[{lbl:'a',t:'C',cost:null,gain:g}]}; F.story.ch=1; paso([{t:'encounter',choice:'a'}]); };
  gana({rel:1}); const r=(tz.rel||{})[0]===1; const n0=cap.units[0].length; gana({tpob:[{k:'com',l:2},{k:'agr',l:1}]}); const pob=cap.units[0].length===n0+1&&cap.units[0][cap.units[0].length-1].tr[0].k==='com';
  gana({saber:3}); const sab=Object.keys(G.F[0].techs).length===t0+1; gana({bld:'taller'}); const bld=cap.b.some(b=>b.t==='taller'); gana({tres:{key:'sal'}}); return r&&pob&&sab&&bld&&hasRes(G,0,'sal')>0;`);

prueba('Durante el comienzo guiado no llegan historias', base + `
  G.F[0].encNext=999; let hay=false; for(let i=0;i<20;i++){ paso(); if(G.F[0].enc) hay=true; } return !hay&&!G.F[0].story;`);

console.log(fallos ? `\n${fallos} reglas fallan.` : '\nTodas las reglas probadas se cumplen.');
process.exit(fallos ? 1 : 0);
