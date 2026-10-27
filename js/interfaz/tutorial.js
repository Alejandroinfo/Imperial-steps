'use strict';
// Comienzo guiado: los primeros 20 pasos de una partida, con un sistema nuevo en cada paso.
// Al terminar, la partida sigue normal (con encuentros). Antes era un tutorial de 5 pasos. Una tarjeta sobre el mapa dice qué hacer y resalta el botón
// exacto; cada objetivo se cumple cuando el jugador lo hace de verdad (no basta con leer).

const TUT={on:false,i:0,seen:{}};
const TUT_MAP=0, TUT_N=2, TUT_SEED=777;

const tutCap=()=>myCapital();
const tutOrders=t=>ui.orders.filter(o=>o.t===t);
const tutSpecTo=to=>tutOrders('spec').filter(o=>o.to===to&&o.zone===tutCap()).reduce((a,o)=>a+o.n,0)+((G.zones[tutCap()].units[ME]||[]).filter(u=>u.t===to).length);

// Cada etapa: en qué paso del juego ocurre, qué dice, qué resaltar y cuándo se da por cumplida.
//   done: se cumple sola cuando el jugador lo hace · wait: avanza al presionar ¡Listo! · opt: se puede saltar
const LISTO=' Presiona <b>¡Listo!</b>.';
const tutFreeSlotZone=()=>{ const z=zonesOf(G,ME).find(z=>slotsOf(G,z)>z.b.length+z.proj.filter(p=>p.k!=='u').length); return z?z.id:tutCap(); };
const tutBarracks=()=>{ const z=zonesOf(G,ME).find(z=>z.b.some(b=>b.t==='cuartel')); return z?z.id:null; };
const TUT_STEPS=[
  // ---- paso 1: oficios ----
  {step:1, t:'👋 Bienvenida', x:'Esta es <b>Adrianópolis</b>, tu capital (borde rojo). Tienes 4 pobladores. El juego avanza por <b>pasos</b>: das órdenes y presionas <b>¡Listo!</b>; cuando todos están listos, se resuelve el paso. Este comienzo guiado dura 20 pasos y después sigues jugando normal.', hl:'#tabBody .zhead', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='resumen'; }},
  {step:1, t:'🌾 Haz 2 agricultores', x:'Abre <b>Población</b> y arrastra 2 pobladores, uno por uno, a la <b>Granja</b> (o tócalos y luego toca la Granja). Cada persona tiene rasgos (íconos y bordes): tú eliges a quién especializar. Cada agricultor da 🌾 2; la comida que sobra hace crecer la zona.', hl:'.subtabs button[data-s="poblacion"], .station[data-st="agr"]', done:()=>tutSpecTo('agr')>=2},
  {step:1, t:'🔬 Haz 1 científico', x:'Ahora 1 poblador al <b>Laboratorio</b>. Los científicos investigan solos cuando hay una tecnología en cola.', hl:'.station[data-st="cie"]', done:()=>tutSpecTo('cie')>=1},
  {step:1, t:'✅ ¡Listo!', x:'Tus órdenes están en cola (pestaña <b>Órdenes</b>).'+LISTO+' También sirve la tecla Enter.', hl:'#readyBtn', wait:true},
  // ---- paso 2: tecnología ----
  {step:2, t:'📜 Elige una tecnología', x:'Abre <b>Tecnologías</b>. En <b>⭐ Te ayudan ahora</b> el juego calcula cuáles te sirven más hoy. Toca <b>Investigar</b> en una (el Arado va bien con tus agricultores).', hl:'.tabs button[data-tab="tec"], .trecs button[data-act="research"]', done:()=>tutOrders('research').length>0||G.F[ME].rq.length>0},
  {step:2, t:'👀 Tu zona', x:'En <b>Zona → Resumen</b> ves la <b>comida neta</b> (lo producido menos lo que se come), las reservas y <b>quién trabaja y dónde</b>.'+LISTO, hl:'.tabs button[data-tab="zona"], #readyBtn', wait:true},
  // ---- paso 3: edificios ----
  {step:3, t:'🏗 Construye un Molino', x:'Abre <b>Edificios</b> y toca el <b>Molino</b>: da comida extra por trabajador. Al pasar el mouse por una tarjeta ves qué hace.', hl:'.subtabs button[data-s="edificios"], .bcard[data-bt="molino"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; }, done:()=>tutOrders('build').some(o=>o.bt==='molino')||G.zones[tutCap()].b.some(b=>b.t==='molino')||G.zones[tutCap()].proj.some(p=>p.bt==='molino')},
  {step:3, t:'👷 Haz un ingeniero', x:'Las obras se construyen <b>solas</b>: cada poblador usa 1 de la producción guardada y cada ingeniero 2; si no hay obra, producen. Para ir más rápido, en <b>Población</b> arrastra el poblador que te queda al <b>Taller</b>.', hl:'.subtabs button[data-s="poblacion"], .station[data-st="ing"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='poblacion'; }, done:()=>tutSpecTo('ing')>=1, opt:true},
  {step:3, t:'⏳ Las obras tardan', x:'Verás el avance de la obra en el mapa, sobre la zona.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 4: expandirse ----
  {step:5, t:'🚶 Expándete', x:'Cada poblador nuevo cuesta más que el anterior en la misma zona: conviene tener varias. En <b>Resumen → Ir a una zona vecina</b>, toca <b>Ir</b> en una zona <b>libre</b>, deja 1 persona (un poblador o cualquier civil) y toca <b>Mandar</b>.', hl:'.nbs button[data-act="openmv"], button[data-act="mvgo"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='resumen'; }, done:()=>tutOrders('move').some(o=>Object.keys(o.u).some(t=>CIV.includes(t))), opt:true},
  {step:5, t:'💡 Las sugerencias', x:'La línea de arriba del panel te sugiere qué hacer y avisa si algo urge. Tócala cuando no sepas qué seguir.'+LISTO, hl:'#sugBar, #readyBtn', wait:true},
  // ---- paso 5: frontera y victoria ----
  {step:4, t:'🚩 La frontera', x:'Entre tu imperio y el vecino hay una <b>frontera</b> de borde dorado, sin dueño. Si los dos tienen gente ahí y están en paz, ganan 🪙 +3 cada uno por paso. Abre <b>Imperio</b>: ahí está tu postura con cada jugador.', hl:'.tabs button[data-tab="imperio"]', done:()=>ui.tab==='imperio'},
  {step:4, t:'🏆 Cómo se gana', x:'Abre <b>Victoria</b>: se gana cumpliendo <b>2 de 7 condiciones a la vez</b>. Ahí ves tu avance y el de los demás.', hl:'.tabs button[data-tab="vic"]', done:()=>ui.tab==='vic'},
  {step:4, t:'✅ ¡Listo!', x:'Vas muy bien.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 6: eventos ----
  {step:6, t:'🌦 Eventos', x:'Cada 3 pasos ocurre un <b>evento</b> (una buena cosecha, una sequía, una tormenta…) que afecta a ciertos terrenos. Se anuncian con 2 pasos de anticipación en <b>Imperio → Eventos</b>, y las sugerencias te avisan si toca a tus zonas.'+LISTO, hl:'.tabs button[data-tab="imperio"], #readyBtn', wait:true},
  // ---- paso 7: oficio al nacer ----
  {step:7, t:'👶 Los que nazcan', x:'En <b>Población</b>, arriba, eliges <b>en qué oficio nacen</b> los nuevos pobladores de la zona. Elige uno (por ejemplo agricultor) y se especializan solos al nacer si hay producción.', hl:'.subtabs button[data-s="poblacion"], button[data-act="autospec"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='poblacion'; }, done:()=>tutOrders('autospec').length>0||!!G.zones[tutCap()].autoSpec, opt:true},
  {step:7, t:'✅ ¡Listo!', x:'Esto ahorra repetir la misma orden cada vez que nace alguien.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 8: primer encuentro ----
  {step:8, t:'📜 Tu primer encuentro', x:'¡Llegó alguien! Los <b>encuentros</b> aparecen sin aviso arriba del panel: alguien ofrece algo a cambio de un pago. Siempre son oportunidades: si no te conviene, no pasa nada. Decide <b>Aceptar</b> o <b>Rechazar</b>.', hl:'#encBar', done:()=>tutOrders('encounter').length>0||!G.F[ME].enc},
  {step:8, t:'✅ ¡Listo!', x:'Se resuelve al terminar el paso. Desde el paso 20 llegarán solos, cada 4 a 7 pasos.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 9: crecer o guardar ----
  {step:9, t:'🏺 Crecer o guardar', x:'En <b>Recursos</b> eliges qué hace la zona con la comida que sobra: <b>Crecer</b> (todo va a nuevos pobladores) o <b>Guardar</b> (se acumula para pagar una tribu o sostener una guerra).', hl:'.subtabs button[data-s="recursos"], button[data-act="growmode"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; }, done:()=>ui.zsub==='recursos'},
  {step:9, t:'✅ ¡Listo!', x:'La comida se reparte sola: si una zona no tiene, come de tu zona más cercana.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 10: cuartel ----
  {step:10, t:'🛡 Un Cuartel', x:'Para tener tropas necesitas un <b>Cuartel</b>. Construye uno en una zona con espacio libre (hay 1 espacio por cada 3 de tamaño). Si ahora no hay espacio, puedes saltar esta etapa.', hl:'.subtabs button[data-s="edificios"], .bcard[data-bt="cuartel"]', prep:()=>{ ui.sel=tutFreeSlotZone(); ui.tab='zona'; ui.zsub='edificios'; }, done:()=>tutOrders('build').some(o=>o.bt==='cuartel')||zonesOf(G,ME).some(z=>z.b.some(b=>b.t==='cuartel')||z.proj.some(p=>p.bt==='cuartel')), opt:true},
  {step:10, t:'✅ ¡Listo!', x:'Los militares no producen y comen el doble, pero protegen y conquistan.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 11: cola de investigación ----
  {step:11, t:'📚 La cola de investigación', x:'Puedes tener hasta <b>4 tecnologías en cola</b>: tus científicos las desarrollan una tras otra. Agrega otra desde <b>Tecnologías</b> (en <b>En curso</b> ves el avance).', hl:'.tabs button[data-tab="tec"]', done:()=>G.F[ME].rq.length+tutOrders('research').length>=2, opt:true},
  {step:11, t:'✅ ¡Listo!', x:'Si no alcanza la ciencia guardada, los científicos que sobran la generan.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 12: recursos estratégicos ----
  {step:12, t:'💎 Recursos estratégicos', x:'Los círculos <b>G</b> (global) y <b>L</b> (local) del mapa son recursos: dan un efecto especial y <b>rinden más mientras más tiempo los tengas</b>. En <b>Imperio</b> está la lista de todos y de quién son.'+LISTO, hl:'.tabs button[data-tab="imperio"], #readyBtn', wait:true},
  // ---- paso 13: tribus ----
  {step:13, t:'⛺ Las tribus', x:'Las zonas con tiendas son <b>tribus</b>. Toca una en el mapa: puedes <b>anexarla</b> pagando lo que piden o conquistarla. A veces exigen <b>tributo</b> a sus vecinos, y si nadie paga, atacan.', hl:'#vp', done:()=>ui.sel!==null&&G.zones[ui.sel]&&G.zones[ui.sel].role==='tribu', opt:true},
  {step:13, t:'✅ ¡Listo!', x:'Anexar suma gente sin pelear; conquistar da recursos pero hay que vencer a sus guerreros.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 14: postura ----
  {step:14, t:'☮ Paz o Alerta', x:'Tu <b>postura</b> con cada jugador (en Imperio o en Militar) decide qué pasa cuando tus tropas y las suyas coinciden: en <b>Paz</b> conviven; en <b>Alerta</b> atacas, con sorpresa si el otro estaba en paz. Cambiarla es una decisión grande.'+LISTO, hl:'.tabs button[data-tab="imperio"], #readyBtn', wait:true},
  // ---- paso 15: envíos automáticos ----
  {step:15, t:'🔁 Envíos automáticos', x:'Si una zona produce de más y otra de menos, en <b>Recursos → Envíos automáticos</b> puedes mandar comida o producción <b>cada paso</b>, pagando la logística en oro. Pruébalo si tienes dos zonas.', hl:'.subtabs button[data-s="recursos"], button[data-act="route"]', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='recursos'; }, done:()=>tutOrders('route').length>0||zonesOf(G,ME).some(z=>(z.routes||[]).length), opt:true},
  {step:15, t:'✅ ¡Listo!', x:'Menos órdenes repetidas, más tiempo para decidir lo importante.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 16: soldados ----
  {step:16, t:'⚔ Entrena un soldado', x:'Si tu Cuartel ya está listo, en <b>Militar</b> entrena un soldado (cuesta ⚒ 1). Las tropas con arma (arqueros, escuderos…) pagan también su equipo. Si el Cuartel no está terminado, salta esta etapa.', hl:'.subtabs button[data-s="militar"], button[data-act="train"]', prep:()=>{ const b=tutBarracks(); ui.sel=b!==null?b:tutCap(); ui.tab='zona'; ui.zsub='militar'; }, done:()=>tutOrders('train').length>0||G.zones.some(z=>(z.units[ME]||[]).some(u=>!UT[u.t].civ)), opt:true},
  {step:16, t:'✅ ¡Listo!', x:'Los militares suben de fuerza cada paso hasta 4.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 17: historial ----
  {step:17, t:'📖 El historial', x:'Abre <b>Historial</b>: cuenta tu partida paso a paso, con filtros por guerra, ciencia, obras, tribus y eventos.', hl:'.tabs button[data-tab="hist"]', done:()=>ui.tab==='hist'},
  {step:17, t:'✅ ¡Listo!', x:'Si te perdiste algo, ahí está.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 18: edificios avanzados ----
  {step:18, t:'⬆ Mejorar edificios', x:'Con tecnologías de nivel más alto, tus edificios se <b>mejoran</b> (pagando la diferencia) o se <b>especializan</b>. Con una de nivel 3 puedes tener <b>un segundo</b> del mismo tipo. Todo está en <b>Edificios</b>.'+LISTO, hl:'.subtabs button[data-s="edificios"], #readyBtn', prep:()=>{ ui.sel=tutCap(); ui.tab='zona'; ui.zsub='edificios'; }, wait:true},
  // ---- paso 19: combates ----
  {step:19, t:'⚔ Los combates', x:'Las peleas se resuelven por <b>oleadas de iniciativa</b>: los más rápidos golpean primero. Después de cada combate aparece «<b>Ver la batalla</b>» para repetirla golpe a golpe. Los civiles que pierden quedan <b>capturados</b>, no mueren.'+LISTO, hl:'#readyBtn', wait:true},
  // ---- paso 20: despedida ----
  {step:20, t:'🎉 ¡Ahora juegas tú!', x:'Terminó el comienzo guiado. Desde ahora la partida es normal: llegarán <b>encuentros</b> cada 4 a 7 pasos, tu vecino puede disputarte la frontera y las tribus pueden pedir tributo. Para cualquier duda, la <b>📖 Guía</b>. ¡Mucha suerte!', hl:'#btnHelp', last:true}
];
TUT_STEPS.sort((a,b)=>a.step-b.step);   // por si una etapa se movió de paso
const TUT_LAST_STEP=20;

function tutStart(){
  $('selMap').value=String(TUT_MAP); $('selN').value=String(TUT_N); $('selThr').value='prueba';
  const url=new URL(location.href); url.searchParams.set('seed',String(TUT_SEED)); history.replaceState(null,'',url.toString());
  startGame(); TUT.on=true; TUT.i=0; TUT.seen={};
  G.F[ME].encNext=999;   // sin encuentros sorpresa mientras dura el tutorial (el del paso 8 lo pone el tutorial)
  const s=TUT_STEPS[0]; if(s.prep) s.prep(); render();
}
function tutStop(){ if(TUT.on&&G&&G.F[ME].encNext===999) G.F[ME].encNext=G.step+2+Math.floor(Math.random()*3); TUT.on=false; document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl')); $('tutor').hidden=true; const url=new URL(location.href); url.searchParams.delete('seed'); history.replaceState(null,'',url.toString()); }
function tutNext(){ TUT.i++; if(TUT.i>=TUT_STEPS.length){ tutStop(); toast('Tutorial completado','Sigue jugando: ¡suerte!','pos','🎓'); return; } const s=TUT_STEPS[TUT.i]; if(s.prep) s.prep(); sfx('select'); render(); }
// Se llama al empezar cada paso del juego: salta a la primera etapa de ese paso.
function tutOnStep(){
  if(!TUT.on) return; const k=TUT_STEPS.findIndex(s=>s.step===G.step);
  if(k>=0&&k>TUT.i){ TUT.i=k; const s=TUT_STEPS[k]; if(s.prep) s.prep(); }
  // paso 8: el primer encuentro, siempre el mismo para que el tutorial lo explique
  if(G.step===8&&!G.F[ME].enc){ const cap=tutCap(); G.F[ME].enc={id:'refugiados',k:'oferta',who:'Una familia que huye de la guerra',txt:'pide comida para quedarse',zone:cap,cost:{res:'food',n:5},gain:{units:{pob:2}},refuse:null,step:G.step,str:0}; }
  if(G.step>TUT_LAST_STEP) tutStop();
}
// Se llama después de cada render: actualiza la tarjeta y el resaltado, y avanza si el objetivo se cumplió.
function tutRender(){
  const box=$('tutor'); if(!TUT.on||!G){ if(box) box.hidden=true; return; }
  let s=TUT_STEPS[TUT.i];
  if(s.done&&s.done()&&!TUT.seen[TUT.i]){ TUT.seen[TUT.i]=1; sfxLater('coin',100,0); setTimeout(()=>{ if(TUT.on&&TUT_STEPS[TUT.i]===s) tutNext(); },650); }
  const done=s.done?s.done():false;
  const stepsOfGame=TUT_STEPS.filter(x=>x.step===s.step), idx=stepsOfGame.indexOf(s)+1;
  box.hidden=false;
  box.innerHTML=`<div class="tuth"><span>🎓 Comienzo guiado · paso ${s.step} de ${TUT_LAST_STEP} <small>(${idx}/${stepsOfGame.length})</small></span><button class="xbtn" data-act="tutstop" title="Salir del tutorial" aria-label="Salir del tutorial">✕</button></div>
    <div class="tutt">${s.t}${done?' <span class="tutok">✓</span>':''}</div><div class="tutx">${s.x}</div>
    <div class="tutf"><div class="tutbar"><i style="width:${Math.round(100*(TUT.i)/TUT_STEPS.length)}%"></i></div>${s.opt&&!done?'<button class="btn" data-act="tutnext">Saltar</button>':''}${s.done||s.wait?'':`<button class="btn primary" data-act="tutnext">${s.last?'Terminar':'Siguiente'}</button>`}</div>`;
  if(s.last) box.querySelector('.tutf').innerHTML=`<div class="tutbar"><i style="width:100%"></i></div><button class="btn primary" data-act="tutnext">Terminar</button>`;
  document.querySelectorAll('.tut-hl').forEach(e=>e.classList.remove('tut-hl'));
  if(s.hl) s.hl.split(',').forEach(sel=>{ document.querySelectorAll(sel.trim()).forEach(e=>e.classList.add('tut-hl')); });
}
