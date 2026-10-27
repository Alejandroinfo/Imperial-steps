// @ts-check
'use strict';
// Encuentros: llegan sin aviso a una zona del jugador y se deciden en ese mismo paso.
// Son siempre oportunidades (ofertas o apuestas): si las aprovechas ganas algo y si las rechazas no pasa nada.
// Decisión de Alejandro (26/10/2026): nada de amenazas inesperadas, porque no hay forma de prepararse para ellas.
// El motor todavía sabe resolver un «rechazo con consecuencias» (refuse), por si sirve para las tribus.
// Cada tipo tiene un costo (lo que piden) y una recompensa (lo que dan). Los montos crecen con la partida: más adelante piden más y dan más.
//
// costo / recompensa / rechazo usan estas claves:
//   res: 'food'|'prod'|'gold'|'tech', n: base   → recurso (comida y producción salen o llegan a la zona)
//   units: {tipo: n}                             → personas o tropas que se unen en la zona
//   eq: {tipo: n}                                → equipo guardado en la zona (arcos, escudos…)
//   prog: n                                      → progreso de crecimiento en la zona
//   gamble: {p, res, n}                          → con probabilidad p ganas el recurso
//   bandits: n                                   → atacan la zona n bandidos
//   lose: {res, frac}                            → pierdes esa fracción del recurso

const ENC_FIRST = 4, ENC_MIN_GAP = 4, ENC_MAX_GAP = 7;

const ENCOUNTERS = [
  {id:'mercenarios', k:'oferta', who:['Unos mercenarios','Una compañía libre','Soldados de fortuna'], txt:'ofrecen sus espadas', cost:{res:'gold',n:5}, gain:{units:{sol:2}}},
  {id:'veteranos', k:'oferta', who:['Unos veteranos','Antiguos guardias de un rey caído'], txt:'buscan un señor que los alimente', cost:{res:'food',n:6}, gain:{units:{sol:2}}, str:4},
  {id:'arqueros', k:'oferta', who:['Unos cazadores del bosque','Arqueros sin patria'], txt:'se unirían a tu ejército', cost:{res:'gold',n:7}, gain:{units:{arq:2}}, terr:['bos','rio','lla']},
  {id:'jinetes', k:'oferta', who:['Unos jinetes nómadas','Una partida de domadores'], txt:'ofrecen sus caballos y su lanza', cost:{res:'gold',n:10}, gain:{units:{cab:1}}, terr:['pra','lla']},
  {id:'refugiados', k:'oferta', who:['Unos refugiados','Una familia que huye de la guerra','Campesinos sin tierra'], txt:'piden comida para quedarse', cost:{res:'food',n:5}, gain:{units:{pob:2}}},
  {id:'artesanos', k:'oferta', who:['Unos artesanos errantes','Un gremio de canteros'], txt:'trabajarían para ti a cambio de comida', cost:{res:'food',n:5}, gain:{units:{ing:1,con:1}}},
  {id:'mercaderes', k:'oferta', who:['Unos mercaderes extranjeros','Una familia de comerciantes'], txt:'quieren abrir negocio en tu zona', cost:{res:'gold',n:6}, gain:{units:{com:2}}},
  {id:'sabio', k:'oferta', who:['Un sabio viajero','Una astrónoma de otras tierras','Monjes copistas'], txt:'compartirían su saber', cost:{res:'gold',n:5}, gain:{res:'tech',n:10}},
  {id:'escuela', k:'oferta', who:['Un maestro de oficios','Una escuela itinerante'], txt:'formarían a un científico', cost:{res:'food',n:4}, gain:{units:{cie:1}}},
  {id:'hierro', k:'oferta', who:['Una caravana de hierro','Mineros del norte'], txt:'venden metal y madera', cost:{res:'gold',n:6}, gain:{res:'prod',n:12}},
  {id:'granos', k:'oferta', who:['Un mercado de granos','Barcas cargadas de trigo'], txt:'venden su cosecha', cost:{res:'gold',n:4}, gain:{res:'food',n:12}},
  {id:'compradores', k:'oferta', who:['Compradores de la capital vecina','Un intendente real'], txt:'pagan bien por tu producción', cost:{res:'prod',n:8}, gain:{res:'gold',n:10}},
  {id:'herrero', k:'oferta', who:['Un herrero ambulante','Una forja que se muda'], txt:'fabrica armas para tu cuartel', cost:{res:'gold',n:5}, gain:{eq:{arq:2}}},
  {id:'escudero', k:'oferta', who:['Un armero de escudos','Un taller de corazas'], txt:'deja escudos listos para tus tropas', cost:{res:'prod',n:7}, gain:{eq:{esc:2}}},
  {id:'juglares', k:'oferta', who:['Unos juglares','Una fiesta de cosecha'], txt:'alegrarían a tu pueblo', cost:{res:'gold',n:3}, gain:{prog:10}},
  {id:'parteras', k:'oferta', who:['Unas parteras del valle','Una curandera'], txt:'cuidarían a las familias', cost:{res:'food',n:4}, gain:{prog:12}},
  {id:'pescadores', k:'oferta', who:['Unos pescadores','Una aldea del río'], txt:'cambian pescado por herramientas', cost:{res:'prod',n:4}, gain:{res:'food',n:12}, terr:['rio']},
  {id:'mineros', k:'oferta', who:['Unos mineros','Buscadores de vetas'], txt:'cavarían en tus montes a cambio de comida', cost:{res:'food',n:5}, gain:{res:'prod',n:14}, terr:['mon','col']},
  {id:'tesoro', k:'apuesta', who:['Un viejo con un mapa','Un buscador de tesoros'], txt:'jura que sabe dónde hay oro enterrado', cost:{res:'gold',n:4}, gain:{gamble:{p:0.5,res:'gold',n:16}}},
  {id:'alquimista', k:'apuesta', who:['Un alquimista','Una inventora excéntrica'], txt:'promete un gran descubrimiento', cost:{res:'gold',n:5}, gain:{gamble:{p:0.5,res:'tech',n:22}}}
];
const ENC={}; ENCOUNTERS.forEach(e=>{ ENC[e.id]=e; });
const ENC_VARIANTS=ENCOUNTERS.reduce((a,e)=>a+e.who.length,0);

// Si quien llega es uno solo («Una compañía libre»), el verbo va en singular.
const ENC_SING={'exigen un pago o atacan':'exige un pago o ataca','ofrecen':'ofrece','buscan':'busca','se unirían':'se uniría','piden':'pide','trabajarían':'trabajaría','quieren':'quiere',
  'compartirían':'compartiría','formarían':'formaría','venden':'vende','pagan':'paga','alegrarían':'alegraría','cuidarían':'cuidaría',
  'cambian':'cambia','cavarían':'cavaría','exigen':'exige','te robarán':'te robará'};
function encConj(who,txt){ if(!/^(Un|Una|El|La) /.test(who)) return txt; for(const pl in ENC_SING) if(txt.startsWith(pl)) return ENC_SING[pl]+txt.slice(pl.length); return txt; }
/** @param {Partida} g */
function encScale(g){ return 1+g.step/15; }
/** @param {Partida} g */
function encAmount(g,n){ return Math.max(1,Math.round(n*encScale(g))); }
/** @param {Partida} g */
function encUnits(g,u){ const out={}; Object.keys(u).forEach(t=>{ out[t]=u[t]+Math.floor(g.step/20); }); return out; }

// Arma un encuentro concreto (con montos ya calculados) para el jugador f en la zona z.
/** @param {Partida} g */
function makeEncounter(g,f,z){
  const opts=ENCOUNTERS.filter(e=>!e.terr||e.terr.includes(z.terrain));
  const e=opts[Math.floor(g.rng()*opts.length)], who=e.who[Math.floor(g.rng()*e.who.length)];
  const c=e.cost?{res:e.cost.res,n:encAmount(g,e.cost.n)}:null;
  const gain=e.gain?JSON.parse(JSON.stringify(e.gain)):null;
  if(gain){ if(gain.res) gain.n=encAmount(g,gain.n); if(gain.units) gain.units=encUnits(g,gain.units); if(gain.prog) gain.prog=encAmount(g,gain.prog); if(gain.gamble) gain.gamble.n=encAmount(g,gain.gamble.n); }
  const refuse=e.refuse?JSON.parse(JSON.stringify(e.refuse)):null;
  if(refuse&&refuse.bandits) refuse.bandits+=Math.floor(g.step/10);
  return /** @type {Encuentro} */({id:e.id,k:e.k,who,txt:encConj(who,e.txt),zone:z.id,cost:c,gain,refuse,step:g.step,str:e.str||0});
}
/** @param {Partida} g */
function encHave(g,f,enc){ const c=enc.cost; if(!c) return true; const z=g.zones[enc.zone]; if(c.res==='gold') return g.F[f].gold>=c.n; if(c.res==='tech') return g.F[f].tech>=c.n; return z[c.res]>=c.n; }
/** @param {Partida} g */
function encPay(g,f,enc){ const c=enc.cost; if(!c) return; const z=g.zones[enc.zone]; if(c.res==='gold') g.F[f].gold-=c.n; else if(c.res==='tech') g.F[f].tech-=c.n; else z[c.res]-=c.n; }
/** @param {Partida} g */
function encGive(g,f,z,res,n){ if(res==='gold') g.F[f].gold+=n; else if(res==='tech') g.F[f].tech+=n; else z[res]=Math.min(capStore(g,z,res),z[res]+n); }

// Resuelve la decisión del jugador (o la falta de decisión: cuenta como rechazo).
/** @param {Partida} g */
function resolveEncounter(g,f,choice,L){
  const F=g.F[f], enc=F.enc; if(!enc) return; F.enc=null;
  const z=g.zones[enc.zone]; const W=enc.who.charAt(0).toLowerCase()+enc.who.slice(1);
  if(!z||z.owner!==f){ L(PLN[f].name+': el encuentro con '+W+' se pierde; ya no controla esa zona.'); return; }
  const tag=PLN[f].name+' · '+zname(z)+': ';
  if(choice==='si'&&encHave(g,f,enc)){
    encPay(g,f,enc); const gn=enc.gain;
    if(gn&&gn.units){ Object.keys(gn.units).forEach(t=>{ for(let i=0;i<gn.units[t];i++){ const u=mkUnit(g,f,t); if(enc.str&&!UT[t].civ) u.str=enc.str; lst(z,f).push(u); } });
      L(tag+'trato con '+W+': llegan '+Object.keys(gn.units).map(t=>gn.units[t]+' '+(gn.units[t]>1?UNP[t]:UN[t]).toLowerCase()).join(' y ')+'.'); }
    if(gn&&gn.res){ encGive(g,f,z,gn.res,gn.n); L(tag+'trato con '+W+': +'+gn.n+' de '+TSPEC_N[gn.res]+'.'); }
    if(gn&&gn.eq){ z.eq=z.eq||{}; Object.keys(gn.eq).forEach(t=>{ z.eq[t]=(z.eq[t]||0)+gn.eq[t]; }); L(tag+'trato con '+W+': '+Object.keys(gn.eq).map(t=>gn.eq[t]+' '+EQUIP_N[t][gn.eq[t]>1?1:0]).join(' y ')+' guardados en la zona.'); }
    if(gn&&gn.prog){ z.prog+=gn.prog; L(tag+'trato con '+W+': +'+gn.prog+' de crecimiento.'); }
    if(gn&&gn.gamble){ if(g.rng()<gn.gamble.p){ encGive(g,f,z,gn.gamble.res,gn.gamble.n); L(tag+'¡salió bien el trato con '+W+'! +'+gn.gamble.n+' de '+TSPEC_N[gn.gamble.res]+'.'); } else L(tag+'el trato con '+W+' salió mal: se pierde lo pagado.'); }
    if(!gn) L(tag+'se paga a '+W+' y se evita el problema.');
    g.fx.push({k:'enc',f,zone:z.id,ok:1,id:enc.id});
    return;
  }
  const r=enc.refuse;
  if(!r){ L(tag+'se rechaza a '+W+'.'); return; }
  if(r.lose){
    if(r.lose.res==='pop'){ const us=lst(z,f), civ=us.filter(u=>UT[u.t].civ); if(civ.length>1){ us.splice(us.indexOf(civ[0]),1); L(tag+enc.who+': muere una persona.'); } }
    else if(r.lose.res==='gold'){ const n=Math.floor(g.F[f].gold*r.lose.frac); g.F[f].gold-=n; L(tag+enc.who+': se pierden '+n+' de oro.'); }
    else { const n=Math.floor(z[r.lose.res]*r.lose.frac); z[r.lose.res]-=n; L(tag+enc.who+': se pierden '+n+' de '+TSPEC_N[r.lose.res]+'.'); }
    g.fx.push({k:'enc',f,zone:z.id,ok:0,id:enc.id});
  }
  if(r.bandits){
    // los bandidos pelean contra la zona; los que sobrevivan roban oro y se van
    const band=[]; for(let i=0;i<r.bandits;i++){ const u=mkUnit(g,TRIBE,i%2?'ber':'sol'); u.str=3; band.push(u); }
    z.units[TRIBE]=(z.units[TRIBE]||[]).concat(band);
    L(tag+'ataque de '+W+'.');
    const facs=presentF(z); const att={}; facs.forEach(x=>{ att[x]=true; }); fightZone(g,z,facs,att,L);
    const left=(z.units[TRIBE]||[]).filter(u=>band.includes(u)).length;
    if(z.units[TRIBE]) { z.units[TRIBE]=z.units[TRIBE].filter(u=>!band.includes(u)); if(!z.units[TRIBE].length) delete z.units[TRIBE]; }
    if(left){ const n=Math.min(g.F[f].gold,3*left); g.F[f].gold-=n; L(tag+'los bandidos que quedan se llevan '+n+' de oro y desaparecen.'); }
    else L(tag+'¡la zona expulsa a los bandidos!');
    z.conflict=presentF(z).some(a=>presentF(z).some(b=>a<b&&isEnemy(g,a,b)));
  }
}
// Al final de cada paso: quien no tenga uno pendiente y ya le toque, recibe un encuentro nuevo.
/** @param {Partida} g */
function scheduleEncounters(g){
  for(let f=0;f<g.N;f++){
    const F=g.F[f]; if(F.out||F.enc) continue;
    if(F.encNext===undefined) F.encNext=ENC_FIRST+Math.floor(g.rng()*3);
    if(g.step+1<F.encNext) continue;
    const zs=zonesOf(g,f).filter(z=>(z.units[f]||[]).length); if(!zs.length) continue;
    // de preferencia en una zona de frontera
    const border=zs.filter(z=>z.adj.some(a=>g.zones[a].owner!==f));
    const pool=border.length&&g.rng()<0.7?border:zs; const z=pool[Math.floor(g.rng()*pool.length)];
    F.enc=makeEncounter(g,f,z); F.encNext=g.step+1+ENC_MIN_GAP+Math.floor(g.rng()*(ENC_MAX_GAP-ENC_MIN_GAP+1));
  }
}
// Decisión simple para los bots: aceptan si pueden pagar y casi siempre si es una amenaza.
/** @param {Partida} g */
function botEncounter(g,f){
  const enc=g.F[f].enc; if(!enc) return null;
  if(!encHave(g,f,enc)) return 'no';
  if(enc.k==='apuesta') return g.rng()<0.4?'si':'no';
  return g.rng()<0.75?'si':'no';
}

/* ---------- recursos estratégicos: rinden más mientras más tiempo los controlas ---------- */
const RES_YIELD = {mitril:'prod',hierro:'prod',caballos:'food',madera:'prod',piedra:'prod',sal:'gold',ruinas:'tech',hierbas:'food',gemas:'gold',brea:'prod'};
const RES_GROW_EVERY = 5, RES_MAX = 4;
function resBonus(z){ return Math.min(RES_MAX,1+Math.floor((z.resHeld||1)/RES_GROW_EVERY)); }
/** @param {Partida} g */
function holdResources(g,L){
  g.zones.forEach(z=>{
    if(!z.res) return;
    if(!isPl(z.owner)){ z.resHeld=0; z.resOwner=null; return; }
    if(z.resOwner!==z.owner){ if(z.resOwner!==null&&z.resOwner!==undefined&&isPl(z.resOwner)) L(zname(z)+': '+PLN[z.owner].name+' se queda con '+RES[z.res].n+'.'); z.resOwner=z.owner; z.resHeld=0; }
    z.resHeld=(z.resHeld||0)+1;
    const n=resBonus(z), k=RES_YIELD[z.res];
    if(k==='gold') g.F[z.owner].gold+=n; else if(k==='tech') g.F[z.owner].tech+=n; else z[k]+=n;
    z.resGain={res:k,n};
  });
}
