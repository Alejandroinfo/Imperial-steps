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
  {id:'artesanos', k:'oferta', who:['Unos artesanos errantes','Un gremio de canteros'], txt:'trabajarían para ti a cambio de comida', cost:{res:'food',n:5}, gain:{units:{ing:2}}},
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
// Encuentros de elegir entre dos (13.3): llegan dos ofertas y eliges una o ninguna. Da costo de oportunidad sin castigar.
const ENC_CHOICE_P = 1/3;   // uno de cada tres encuentros
const CHOICES = [
  {id:'ch_tropas', who:['Dos emisarios rivales','Un capitán y un cazador'], txt:'ofrecen tropas, pero solo puedes aceptar a uno', opts:[{lbl:'Mercenarios',cost:{res:'gold',n:5},gain:{units:{sol:2}}},{lbl:'Arqueros',cost:{res:'gold',n:7},gain:{units:{arq:2}}}]},
  {id:'ch_saber', who:['Un maestro y una sabia','Dos viajeros de otras tierras'], txt:'ofrecen enseñar, pero solo a uno le harás caso', opts:[{lbl:'Formar a un científico',cost:{res:'food',n:4},gain:{units:{cie:1}}},{lbl:'Compartir su saber',cost:{res:'gold',n:5},gain:{res:'tech',n:10}}]},
  {id:'ch_mercado', who:['Dos caravanas que llegan a la vez'], txt:'venden lo suyo, pero no hay sitio para las dos', opts:[{lbl:'Granos',cost:{res:'gold',n:4},gain:{res:'food',n:12}},{lbl:'Hierro y madera',cost:{res:'gold',n:6},gain:{res:'prod',n:12}}]},
  {id:'ch_fiesta', who:['Unos juglares y unas parteras'], txt:'se ofrecen para ayudar a tu gente', opts:[{lbl:'Juglares',cost:{res:'gold',n:3},gain:{prog:10}},{lbl:'Parteras',cost:{res:'food',n:4},gain:{prog:12}}]},
  {id:'ch_oficios', who:['Un gremio de canteros y una familia de mercaderes'], txt:'quieren instalarse en tu zona', opts:[{lbl:'Artesanos',cost:{res:'food',n:5},gain:{units:{ing:2}}},{lbl:'Mercaderes',cost:{res:'gold',n:6},gain:{units:{com:2}}}]},
  {id:'ch_armas', who:['Un herrero y un armero'], txt:'fabrican para tu cuartel, pero solo uno a la vez', opts:[{lbl:'Arcos',cost:{res:'gold',n:5},gain:{eq:{arq:2}}},{lbl:'Escudos',cost:{res:'prod',n:7},gain:{eq:{esc:2}}}]}
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
function scaleGain(g,gain){
  const o=gain?JSON.parse(JSON.stringify(gain)):null;
  if(o){ if(o.res) o.n=encAmount(g,o.n); if(o.units) o.units=encUnits(g,o.units); if(o.prog) o.prog=encAmount(g,o.prog); if(o.gamble) o.gamble.n=encAmount(g,o.gamble.n); }
  return o;
}
// Un encuentro de elegir entre dos, con los montos ya calculados.
/** @param {Partida} g */
function makeChoice(g,f,z){
  const e=CHOICES[Math.floor(g.rng()*CHOICES.length)], who=e.who[Math.floor(g.rng()*e.who.length)];
  const opts=e.opts.map(o=>({lbl:o.lbl,cost:{res:o.cost.res,n:encAmount(g,o.cost.n)},gain:scaleGain(g,o.gain)}));
  return /** @type {Encuentro} */({id:e.id,k:'eleccion',who,txt:e.txt,zone:z.id,cost:null,gain:null,refuse:null,step:g.step,str:0,opts});
}
/** @param {Partida} g */
function makeEncounter(g,f,z){
  const opts=ENCOUNTERS.filter(e=>!e.terr||e.terr.includes(z.terrain));
  const e=opts[Math.floor(g.rng()*opts.length)], who=e.who[Math.floor(g.rng()*e.who.length)];
  const c=e.cost?{res:e.cost.res,n:encAmount(g,e.cost.n)}:null;
  const gain=scaleGain(g,e.gain);
  const refuse=e.refuse?JSON.parse(JSON.stringify(e.refuse)):null;
  if(refuse&&refuse.bandits) refuse.bandits+=Math.floor(g.step/10);
  return /** @type {Encuentro} */({id:e.id,k:e.k,who,txt:encConj(who,e.txt),zone:z.id,cost:c,gain,refuse,step:g.step,str:e.str||0});
}
/** @param {Partida} g */
function encHave(g,f,enc){ const c=enc.cost; if(!c) return true; if(enc.offer) return ownedTotal(g,f,c.res)>=c.n; const z=g.zones[enc.zone]; if(c.res==='gold') return g.F[f].gold>=c.n; if(c.res==='tech') return g.F[f].tech>=c.n; return z[c.res]>=c.n; }
/** @param {Partida} g */
function encPay(g,f,enc){ const c=enc.cost; if(!c) return; if(enc.offer){ takeOwned(g,f,c.res,c.n); return; } const z=g.zones[enc.zone]; if(c.res==='gold') g.F[f].gold-=c.n; else if(c.res==='tech') g.F[f].tech-=c.n; else z[c.res]-=c.n; }
/** @param {Partida} g */
function encGive(g,f,z,res,n){ if(res==='gold') g.F[f].gold+=n; else if(res==='tech') g.F[f].tech+=n; else z[res]=Math.min(capStore(g,z,res),z[res]+n); }


/* ---------- ofertas entre jugadores (tratos) ---------- */
/** @param {Partida} g */
function ownedTotal(g,f,res){ if(res==='gold') return g.F[f].gold; if(res==='tech') return g.F[f].tech; return zonesOf(g,f).reduce((a,z)=>a+z[res],0); }
/** @param {Partida} g */
function takeOwned(g,f,res,n){ if(res==='gold'){ g.F[f].gold-=n; return; } if(res==='tech'){ g.F[f].tech-=n; return; } let need=n; zonesOf(g,f).sort((a,b)=>b[res]-a[res]).forEach(z=>{ const t=Math.min(z[res],need); z[res]-=t; need-=t; }); }
/** @param {Partida} g */
function giveOwned(g,f,res,n){ if(res==='gold'){ g.F[f].gold+=n; return; } if(res==='tech'){ g.F[f].tech+=n; return; } const zs=zonesOf(g,f); if(!zs.length) return; const z=zs.find(a=>a.capital)||zs[0]; z[res]=Math.min(capStore(g,z,res),z[res]+n); }
// Lo que ofreces queda en reserva hasta que el otro responda (o caduque). Orden: {t:'offer', to, give:{res,n}, ask:{res,n}}.
/** @param {Partida} g */
function doOffer(g,o,L){
  const f=o.f, to=o.to; if(!isPl(to)||to===f||g.F[to].out||g.F[f].out||!o.give||!o.ask) return;
  const gv=o.give, ak=o.ask; if(!OFFER_RES.includes(gv.res)||!OFFER_RES.includes(ak.res)||gv.res===ak.res) return;
  const gn=Math.floor(gv.n), an=Math.floor(ak.n); if(!(gn>0&&an>0)||gn>999||an>999) return;
  g.offers=g.offers||[]; if(g.offers.filter(x=>x.from===f).length>=OFFER_MAX_OUT){ L(PLN[f].name+': ya tiene '+OFFER_MAX_OUT+' ofertas esperando respuesta.'); return; }
  if(ownedTotal(g,f,gv.res)<gn){ L(PLN[f].name+': no le alcanza para lo que ofrecía.'); return; }
  takeOwned(g,f,gv.res,gn); g.offerSeq=(g.offerSeq||0)+1;
  g.offers.push({id:g.offerSeq,from:f,to,give:{res:gv.res,n:gn},ask:{res:ak.res,n:an},step:g.step});
  L(PLN[f].name+' envía una oferta a '+PLN[to].name+'.');
}
// El trato que le llega al otro jugador, como un encuentro (se puede aceptar, rechazar o ignorar sin consecuencias).
/** @param {Partida} g */
function makeTradeEnc(g,f,of){
  const zs=zonesOf(g,f); if(!zs.length) return null; let z=zs.find(a=>a.capital)||zs[0];
  if(of.ask.res==='food'||of.ask.res==='prod') z=zs.slice().sort((a,b)=>b[of.ask.res]-a[of.ask.res])[0];
  return /** @type {Encuentro} */({id:'trato',k:'trato',who:PLN[of.from].name,txt:'te propone un trato',zone:z.id,cost:{res:of.ask.res,n:of.ask.n},gain:{res:of.give.res,n:of.give.n},refuse:null,step:g.step,str:0,offer:of});
}
/** @param {Partida} g */
function refundOffer(g,of,L,why){ giveOwned(g,of.from,of.give.res,of.give.n); L(PLN[of.from].name+': se le devuelve su oferta a '+PLN[of.to].name+' ('+why+').'); }

// Resuelve la decisión del jugador (o la falta de decisión: cuenta como rechazo).
/** @param {Partida} g */
function resolveEncounter(g,f,choice,L){
  const enc=g.F[f].enc; let tag=null;
  if(enc&&enc.story&&enc.opts){ const i=['a','b','c'].indexOf(choice), z=g.zones[enc.zone]; if(i>=0&&enc.opts[i]&&z&&z.owner===f&&encHave(g,f,{cost:enc.opts[i].cost,zone:enc.zone})) tag=enc.opts[i].t; }
  resolveEncounterBody(g,f,choice,L);
  if(enc&&enc.offer&&!enc.offerOk) refundOffer(g,enc.offer,L,'no la aceptó');
  if(enc&&enc.story) storyAdvance(g,f,tag,L);   // aceptes o no, la historia sigue
}
/** @param {Partida} g */
function resolveEncounterBody(g,f,choice,L){
  const F=g.F[f], enc=F.enc; if(!enc) return; F.enc=null;
  const z=g.zones[enc.zone]; const W=enc.who.charAt(0).toLowerCase()+enc.who.slice(1);
  if(!z||z.owner!==f){ L(PLN[f].name+': el encuentro con '+W+' se pierde; ya no controla esa zona.'); return; }
  const tag=PLN[f].name+' · '+zname(z)+': ';
  // en los de elegir entre dos, 'a' y 'b' son las opciones; en los demás, 'si' acepta
  let use=enc, go=(choice==='si');
  const oi=['a','b','c'].indexOf(choice);
  if(enc.opts&&oi>=0&&enc.opts[oi]){ const o=enc.opts[oi]; use=Object.assign({},enc,{cost:o.cost,gain:o.gain}); go=true; }
  if(go&&encHave(g,f,use)){
    encPay(g,f,use); const gn=use.gain;
    if(gn&&gn.units){ Object.keys(gn.units).forEach(t=>{ for(let i=0;i<gn.units[t];i++){ const u=mkUnit(g,f,t); if(enc.str&&!UT[t].civ) u.str=enc.str; lst(z,f).push(u); } });
      L(tag+'trato con '+W+': llegan '+Object.keys(gn.units).map(t=>gn.units[t]+' '+(gn.units[t]>1?UNP[t]:UN[t]).toLowerCase()).join(' y ')+'.'); }
    if(gn&&gn.res){ encGive(g,f,z,gn.res,gn.n); L(tag+'trato con '+W+': +'+gn.n+' de '+TSPEC_N[gn.res]+'.'); }
    if(gn&&gn.eq){ z.eq=z.eq||{}; Object.keys(gn.eq).forEach(t=>{ z.eq[t]=(z.eq[t]||0)+gn.eq[t]; }); L(tag+'trato con '+W+': '+Object.keys(gn.eq).map(t=>gn.eq[t]+' '+EQUIP_N[t][gn.eq[t]>1?1:0]).join(' y ')+' guardados en la zona.'); }
    if(gn&&gn.rel){ const tz=g.zones.find(a=>a.owner===TRIBE&&a.adj.some(x=>g.zones[x].owner===f)); if(tz) tribeRel(g,tz.id,f,L); else { encGive(g,f,z,'gold',8); L(tag+'no hay una tribu cerca: recibes 8 de oro.'); } }
    if(gn&&gn.tpob){ const u=mkUnit(g,f,'pob'); u.tr=gn.tpob.map(x=>({k:x.k,l:x.l})); lst(z,f).push(u); L(tag+'llega un poblador extraordinario con '+u.tr.map(x=>TRAIT_INFO[x.k].n+' '+(x.l>0?'+':'')+x.l).join(' y ')+'.'); }
    if(gn&&gn.saber) grantTech(g,f,gn.saber,L,tag);
    if(gn&&gn.bld){ const used=z.b.length+z.proj.filter(p=>p.k==='b'||p.k==='w').length; if(used<slotsOf(g,z)&&!z.b.some(b=>b.t===gn.bld)){ const lv=buildLevel(g,f,gn.bld); z.b.push({t:gn.bld,l:lv,s:null,wk:0,cost:20*lv}); L(tag+'recibes un '+BT[gn.bld].n+' ya construido.'); } else { encGive(g,f,z,'gold',15); L(tag+'no había espacio para el edificio: recibes 15 de oro.'); } }
    if(gn&&gn.tres){ F.tres=(F.tres||[]).filter(r=>r.key!==gn.tres.key); F.tres.push({key:gn.tres.key,until:g.step+AUCTION_RES_STEPS}); L(tag+RES[gn.tres.key].n+' durante '+AUCTION_RES_STEPS+' pasos ('+RES[gn.tres.key].d+')'); }
    if(gn&&gn.prog){ z.prog+=gn.prog; L(tag+'trato con '+W+': +'+gn.prog+' de crecimiento.'); }
    if(gn&&gn.gamble){ if(g.rng()<gn.gamble.p){ encGive(g,f,z,gn.gamble.res,gn.gamble.n); L(tag+'¡salió bien el trato con '+W+'! +'+gn.gamble.n+' de '+TSPEC_N[gn.gamble.res]+'.'); } else L(tag+'el trato con '+W+' salió mal: se pierde lo pagado.'); }
    if(!gn) L(tag+'se paga a '+W+' y se evita el problema.');
    if(enc.offer){ giveOwned(g,enc.offer.from,enc.offer.ask.res,enc.offer.ask.n); enc.offerOk=1; L(PLN[enc.offer.from].name+' y '+PLN[f].name+' cierran un trato.'); }
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
function L2(g,m){ g.logNow.push(m); }
/** @param {Partida} g */
function scheduleEncounters(g){
  g.offers=g.offers||[];
  g.offers.slice().forEach(of=>{ if(g.F[of.to].out||g.step-of.step>OFFER_TTL){ g.offers.splice(g.offers.indexOf(of),1); refundOffer(g,of,(m)=>L2(g,m),g.F[of.to].out?'el otro quedó fuera':'caducó'); } });
  for(let f=0;f<g.N;f++){
    const F=g.F[f]; if(F.out||F.enc) continue;
    { const of=g.offers.find(x=>x.to===f); if(of){ const e=makeTradeEnc(g,f,of); g.offers.splice(g.offers.indexOf(of),1); if(e){ F.enc=e; L2(g,PLN[f].name+' recibe una oferta de '+PLN[of.from].name+'.'); continue; } refundOffer(g,of,(m)=>L2(g,m),'sin zona para recibirla'); } }
    if(F.encNext===999) continue;   // comienzo guiado: sin encuentros ni historias
    if(!F.story) F.story={id:STORY_IDS[Math.floor(g.rng()*STORY_IDS.length)],ch:1,next:Math.max(STORY_FIRST,g.step+2)+Math.floor(g.rng()*3),tags:[]};
    if(!F.story.done&&g.step+1>=F.story.next){ const ch=makeChapter(g,f); if(ch){ F.enc=ch; L2(g,PLN[f].name+': llega un capítulo de «'+STORIES[F.story.id].n+'».'); continue; } }
    if(F.encNext===undefined) F.encNext=ENC_FIRST+Math.floor(g.rng()*3);
    if(g.step+1<F.encNext) continue;
    const zs=zonesOf(g,f).filter(z=>(z.units[f]||[]).length); if(!zs.length) continue;
    // de preferencia en una zona de frontera
    const border=zs.filter(z=>z.adj.some(a=>g.zones[a].owner!==f));
    const pool=border.length&&g.rng()<0.7?border:zs; const z=pool[Math.floor(g.rng()*pool.length)];
    F.enc=g.rng()<ENC_CHOICE_P?makeChoice(g,f,z):makeEncounter(g,f,z); F.encNext=g.step+1+ENC_MIN_GAP+Math.floor(g.rng()*(ENC_MAX_GAP-ENC_MIN_GAP+1));
  }
}
// Decisión simple para los bots: aceptan si pueden pagar y casi siempre si es una amenaza.
/** @param {Partida} g */
/** @returns {'si'|'no'|'a'|'b'|'c'|null} */
function botEncounter(g,f){
  const enc=g.F[f].enc; if(!enc) return null;
  if(enc.opts){ const ok=enc.opts.map((o,i)=>i).filter(i=>encHave(g,f,{cost:enc.opts[i].cost,zone:enc.zone})); if(!ok.length) return 'no'; return g.rng()<0.8?/** @type {'a'|'b'|'c'} */(['a','b','c'][ok[Math.floor(g.rng()*ok.length)]]):'no'; }
  if(!encHave(g,f,enc)) return 'no';
  if(enc.offer){ const V={gold:1,tech:1,food:0.6,prod:0.8}; return enc.gain.n*V[enc.gain.res]>=enc.cost.n*V[enc.cost.res]*0.9&&g.rng()<0.85?'si':'no'; }
  if(enc.k==='apuesta') return g.rng()<0.4?'si':'no';
  return g.rng()<0.75?'si':'no';
}

/* ---------- recursos estratégicos: rinden más mientras más tiempo los controlas ---------- */
const RES_YIELD = {mitril:'prod',hierro:'prod',caballos:'food',madera:'prod',piedra:'prod',sal:'gold',ruinas:'tech',hierbas:'food',gemas:'gold',brea:'prod'};
const RES_GROW_EVERY = 5;
// Lo que rinde un depósito por paso: empieza en RES_TIER[tier].start y sube 1 cada RES_GROW_EVERY pasos controlándolo, hasta su máximo.
function resBonus(z,tier){ const T=RES_TIER[tier||'plata']; return Math.min(T.max,T.start+Math.floor(Math.max(0,(z.resHeld||1)-1)/RES_GROW_EVERY)); }
/** @param {Partida} g */
function holdResources(g,L){
  g.zones.forEach(z=>{
    const deps=zoneDeps(z); if(!deps.length) return;
    if(!isPl(z.owner)){ z.resHeld=0; z.resOwner=null; return; }
    if(z.resOwner!==z.owner){ if(z.resOwner!==null&&z.resOwner!==undefined&&isPl(z.resOwner)) L(zname(z)+': '+PLN[z.owner].name+' se queda con '+deps.map(d=>RES[d.k].n).join(' y ')+'.'); z.resOwner=z.owner; z.resHeld=0; }
    z.resHeld=(z.resHeld||0)+1; z.resGains=[];
    deps.forEach(d=>{ const n=resBonus(z,d.tier), k=RES_YIELD[d.k];
      if(k==='gold') g.F[z.owner].gold+=n; else if(k==='tech') g.F[z.owner].tech+=n; else z[k]+=n;
      z.resGains.push({key:d.k,tier:d.tier,res:k,n}); });
    z.resGain=z.resGains[0];
  });
}
