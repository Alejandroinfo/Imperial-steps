// @ts-check
'use strict';
// resolveStep(estado, órdenes): el corazón del motor. Aplica las órdenes de todos los
// jugadores en el orden de la sección 2 de las reglas, y luego movimientos, combate, control y economía.

/** @param {Partida} g */
function takeUnits(g,z,f,t,n,opts){
  const us=lst(z,f), out=[]; 
  for(let i=0;i<us.length&&out.length<n;i++){ const u=us[i]; if(u.t===t&&u.w===0&&!u.busy&&(!opts||!opts.noMoved||!u.mv)){ out.push(u); } }
  out.forEach(u=>{ us.splice(us.indexOf(u),1); });
  return out;
}
/** @param {Partida} g */
function availUnits(g,z,f,t){ return lst(z,f).filter(u=>u.t===t&&u.w===0&&!u.busy).length; }
/** @param {Partida} g */
function pullRes(g,f,z,res,need,maxDist){
  if(need<=0) return 0; const F=g.F[f]; let got=0;
  const srcs=g.zones.filter(a=>a.owner===f&&a.id!==z.id&&a[res]>0).map(a=>({a,path:ownPath(g,f,a.id,z.id,maxDist)})).filter(x=>x.path).sort((x,y)=>x.path.length-y.path.length);
  for(const s of srcs){
    if(got>=need) break;
    const fac=shipFactor(g,s.path); let t=Math.min(s.a[res],need-got);
    if(fac>0){ const afford=Math.floor(F.gold/fac); t=Math.min(t,afford); if(t<=0) continue; F.gold-=Math.ceil(t*fac); }
    s.a[res]-=t; z[res]+=t; got+=t;
  }
  return got;
}

// Las órdenes que atiende el motor, en el orden en que se aplican.
// TypeScript exige que estén TODAS las del tipo Orden (js/tipos.d.ts): si se agrega una orden nueva
// y nadie la atiende, `npm run check` falla. Así se encontró que la Maravilla no se podía construir.
/** @type {Record<TipoOrden, number>} */
const ORDER_PHASE = {research:1,cancelres:1,stance:2,encounter:2,spec:3,demob:3,train:3,build:4,wonder:4,upgrade:4,bspec:4,demolish:4,
  send:5,route:5,growmode:5,pausebuild:5,autospec:5,tribute:6,ally:6,annex:7,move:8};
/**
 * Aplica un paso completo: nacimientos, evento, órdenes, movimientos, combates, control y economía.
 * @param {Partida} g estado de la partida (se modifica)
 * @param {Orden[]} orders órdenes de todos los jugadores, cada una con `f`
 * @returns {string[]} lo que pasó, para el historial
 */
function resolveStep(g,orders){
  orders.forEach(o=>{ if(!(o.t in ORDER_PHASE)) throw new Error('Orden desconocida: '+o.t); });
  const Z=g.zones, L=m=>g.logNow.push(m); g.logNow=[]; g.fx=[];
  Z.forEach(z=>{ z.att={}; for(const f in z.units) z.units[f].forEach(u=>{ u.mv=0; u.busy=0; }); });
  recomputeMods(g);
  Z.forEach(z=>{ if(z.owner===TRIBE&&(z.units[TRIBE]||[]).length) z.tbase=tribeBase(z); });
  // 0. nacimientos
  Z.forEach(z=>{ if(z.grow>0&&isPl(z.owner)){ for(let i=0;i<z.grow;i++){ const u=mkUnit(g,z.owner,'pob');
      if(z.autoSpec){ const per=specPer(g,z.owner,z,'pob',z.autoSpec); if(z.prod>=per){ z.prod-=per; u.t=z.autoSpec; } }
      lst(z,z.owner).push(u); } L(zname(z)+': nace'+(z.grow>1?'n ':' ')+z.grow+' poblador'+(z.grow>1?'es':'')+(z.autoSpec?' (se especializa'+(z.grow>1?'n':'')+' como '+UN[z.autoSpec].toLowerCase()+')':'')+'.'); g.fx.push({k:'born',zone:z.id,f:z.owner,n:z.grow}); } z.grow=0; });
  // 1. evento
  g.evNow=g.evq.find(e=>e.step===g.step)||null; applyEventMods(g,g.evNow,L);
  g.evq=g.evq.filter(e=>e.step>g.step);
  // 2. órdenes
  /** Las órdenes de un tipo, ya con su forma exacta. @template {TipoOrden} K @param {K} t @returns {Array<Extract<Orden,{t:K}> & {f:Jugador}>} */
  function by(t){ return /** @type {any} */(orders.filter(o=>o.t===t)); }
  by('research').forEach(o=>{
    const f=o.f, F=g.F[f]; if(F.out&&!F.ghost) return; const n=o.name; if(!TECH[n]||F.techs[n]) return;
    if(researchBlock(g,f,n)||F.rq.length>=4) return; const c=techCost(g,f,n);
    F.rq.push({name:n,left:c,tot:c}); L(PLN[f].name+' empieza a investigar «'+n+'».'); g.fx.push({k:'rq',f,name:n});
  });
  by('cancelres').forEach(o=>{ const F=g.F[o.f]; F.rq=F.rq.filter(p=>p.name!==o.name); });
  by('stance').forEach(o=>{ if(isPl(o.target)&&o.target!==o.f){ const F=g.F[o.f]; F.stance=F.stance||{}; F.stance[o.target]=o.stance==='alerta'?'alerta':'paz'; } });
  by('spec').forEach(o=>{ doSpec(g,o,L); });
  by('demob').forEach(o=>{ doDemob(g,o,L); });
  by('train').forEach(o=>{ doTrain(g,o,L); });
  by('build').forEach(o=>{ doBuild(g,o,L); });
  by('upgrade').forEach(o=>{ doUpgrade(g,o,L); });
  by('wonder').forEach(o=>{ doWonder(g,o,L); });
  by('bspec').forEach(o=>{ const z=Z[o.zone]; if(z&&z.owner===o.f&&z.b[o.bi]&&specOptions(g,o.f,z.b[o.bi].t).includes(o.spec)) z.b[o.bi].s=o.spec; });
  by('demolish').forEach(o=>{ const z=Z[o.zone]; if(!z||z.owner!==o.f||!z.b[o.bi]) return; const b=z.b[o.bi]; if(b.t==='mar') return;
    const refund=Math.floor(b.cost*0.5); z.b.splice(o.bi,1); z.proj=z.proj.filter(p=>!(p.k==='u'&&p.bi===o.bi)); z.proj.forEach(p=>{ if(p.k==='u'&&p.bi>o.bi) p.bi--; }); z.prod=Math.min(capStore(g,z,'prod'),z.prod+refund); L(zname(z)+': se destruye un '+BT[b.t].n+' y se recuperan '+refund+' de producción.'); });
  by('send').forEach(o=>{ doSend(g,o,L); });
  by('route').forEach(o=>{ const z=Z[o.from]; if(!z||z.owner!==o.f) return; z.routes=(z.routes||[]).filter(r=>!(r.to===o.to&&r.res===o.res)); if(o.q&&o.to!==o.from) z.routes.push({to:o.to,res:o.res==='prod'?'prod':'food',q:o.q==='sobrante'?'sobrante':Math.max(1,Math.floor(o.q))}); });
  by('growmode').forEach(o=>{ const z=Z[o.zone]; if(z&&z.owner===o.f) z.growMode=o.mode==='guardar'?'guardar':'crecer'; });
  by('pausebuild').forEach(o=>{ const z=Z[o.zone]; if(z&&z.owner===o.f) z.pauseBuild=!!o.on; });
  by('autospec').forEach(o=>{ const z=Z[o.zone]; if(z&&z.owner===o.f) z.autoSpec=CIV.includes(o.to)&&o.to!=='pob'?o.to:null; });
  by('tribute').forEach(o=>{ doTribute(g,o,L); });
  by('ally').forEach(o=>{ doAlly(g,o,L); });
  // encuentros: lo que no se responde cuenta como rechazo
  for(let f=0;f<g.N;f++){ if(!g.F[f].enc) continue; const o=by('encounter').filter(x=>x.f===f).pop(); resolveEncounter(g,f,o?o.choice:'no',L); }
  by('annex').forEach(o=>{ /* se resuelven juntas más abajo */ });
  resolveAnnex(g,by('annex'),L);
  // 3. movimientos
  const arrivals=[];
  by('move').forEach(o=>{ doMove(g,o,arrivals,L); });
  tributeWave(g,arrivals,L);
  arrivals.forEach(a=>{ const z=Z[a.to]; const us=lst(z,a.f); a.units.forEach(u=>{ u.mv=1; us.push(u); }); z.att[a.f]=!!(z.att[a.f]||a.st==='ataque'); });
  // 4. combates
  const hostile=[];
  Z.forEach(z=>{
    const facs=presentF(z); if(facs.length<2) return;
    const att={};
    facs.forEach(f=>{
      if(z.conflict||f===TRIBE) att[f]=true;
      else if(z.att[f]!==undefined) att[f]=z.att[f];
      else att[f]=isPl(f)&&facs.some(e=>e!==f&&isEnemy(g,f,e)&&stanceOf(g,f,e)==='alerta');
    });
    const pairs=[]; facs.forEach(a=>facs.forEach(b=>{ if(a<b&&isEnemy(g,a,b)) pairs.push([a,b]); }));
    if(!pairs.length){ z.conflict=false; return; }
    if(facs.some(f=>att[f])){ fightZone(g,z,facs,att,L); pairs.forEach(p=>hostile.push(p)); }
    else z.conflict=false;
  });
  // tensión: si dos jugadores pelean, todas las zonas donde coexisten pasan a conflicto
  hostile.forEach(([a,b])=>{ if(a===TRIBE||b===TRIBE) return; Z.forEach(z=>{ const ps=presentF(z); if(ps.includes(a)&&ps.includes(b)&&!z.conflict){ z.conflict=true; } }); });
  // 5. control
  Z.forEach(z=>{ controlZone(g,z,L); });
  // equipo de las tropas caídas: se recupera cuando la zona deja de estar en conflicto
  Z.forEach(z=>{ if(!z.eqPend||z.conflict||!isPl(z.owner)) return; const k=Object.keys(z.eqPend); if(!k.length) return;
    z.eq=z.eq||{}; const parts=[]; k.forEach(t=>{ z.eq[t]=(z.eq[t]||0)+z.eqPend[t]; const n=z.eqPend[t]; parts.push(n+' '+EQUIP_N[t][n>1?1:0]); }); z.eqPend={};
    L(zname(z)+': '+PLN[z.owner].name+' recupera '+parts.join(', ')+' de sus tropas caídas.'); });
  // 6. economía
  economy(g,L);
  // 7. victoria / eliminación
  checkOut(g,L);
  checkVictory(g,L);
  // eventos futuros y encuentros nuevos
  scheduleEvents(g);
  scheduleEncounters(g);
  g.hist=g.hist||[]; if(g.logNow.length||g.evNow) g.hist.push({step:g.step,ev:g.evNow?g.evNow.id:null,lines:g.logNow.slice()});
  g.step++; g.log=g.logNow;
  return g.log;
}

/* ---- órdenes individuales ---- */
function specPer(g,f,z,from,to){
  const M=g.M[f]; let per=(from==='pob'||to==='pob')?1:2;
  per=Math.max(0,per-M.specSub); if(M.specFree&&z.b.some(b=>b.t==='taller')) per=0; return per;
}
// Costo de hacer un soldado a partir de un civil.
/** @param {Partida} g */
function soldierCost(g,f,z){ let c=SOLDIER_COST; if(z.b.some(b=>b.t==='cuartel'&&b.s==='instruccion')) c-=1; return Math.max(1,c); }
// Costo de fabricar el equipo de una tropa (arco, escudo, caballo, hacha).
/** @param {Partida} g */
function equipCost(g,f,z,u){
  const M=g.M[f]; let c=EQUIP_COST[u]||0; if(!c) return 0;
  if(M.weaponHalf) c=Math.ceil(c/2); if(hasRes(g,f,'hierro')) c-=1; if(z.b.some(b=>b.t==='taller'&&b.s==='armeria')) c-=1;
  return Math.max(1,c);
}
// Costo de entrenar una unidad. from='sol' equipa a un soldado existente; useStock usa un arma guardada en la zona.
/** @param {Partida} g */
function trainCost(g,f,z,u,from,useStock){
  if(u==='ari'||u==='lan') return TRAIN_COST[u];
  const base=from==='sol'?0:soldierCost(g,f,z); if(u==='sol') return base;
  return base+(useStock?0:equipCost(g,f,z,u));
}
function stockOf(z,u){ return (z.eq&&z.eq[u])||0; }
/** @param {Partida} g */
function doSpec(g,o,L){
  const z=g.zones[o.zone]; if(!z||z.owner!==o.f||!CIV.includes(o.from)||!CIV.includes(o.to)||o.from===o.to) return;
  const per=specPer(g,o.f,z,o.from,o.to);
  let n=Math.min(o.n||0,availUnits(g,z,o.f,o.from)); if(per>0) n=Math.min(n,Math.floor(z.prod/per));
  if(n<=0) return;
  const us=lst(z,o.f); const chosen=[];
  // primero las personas que el jugador eligió, y si faltan, las primeras libres
  (o.ids||[]).forEach(id=>{ const u=us.find(x=>x.id===id); if(u&&u.t===o.from&&u.w===0&&!u.busy&&!chosen.includes(u)&&chosen.length<n) chosen.push(u); });
  for(const u of us){ if(chosen.length>=n) break; if(u.t===o.from&&u.w===0&&!u.busy&&!chosen.includes(u)) chosen.push(u); }
  chosen.forEach(u=>{ u.t=o.to; u.busy=1; }); const k=chosen.length;
  z.prod-=per*k; if(k) g.fx.push({k:'spec',zone:z.id,f:o.f,n:k,to:o.to});
}
/** @param {Partida} g */
function demobCost(g,f,to){ if(g.M[f].reserv) return 0; return to==='pob'?DEMOB_COST.basico:DEMOB_COST.especializado; }
/** @param {Partida} g */
function doDemob(g,o,L){
  const z=g.zones[o.zone]; if(!z||z.owner!==o.f||!DEMOB_FROM.includes(o.u)||!CIV.includes(o.to)) return;
  const f=o.f, per=demobCost(g,f,o.to);
  let n=Math.min(o.n||0,availUnits(g,z,f,o.u)); if(per>0) n=Math.min(n,Math.floor(z.prod/per)); if(n<=0) return;
  let k=0; for(const u of lst(z,f)){ if(k>=n) break; if(u.t===o.u&&u.w===0&&!u.busy){ u.t=o.to; u.hp=mhp(g,f,o.to,z); u.str=1; u.busy=1; u.hg=0; delete u.mit; delete u.cabhp; delete u.brea; k++; } }
  z.prod-=per*k;
  if(k){ g.fx.push({k:'spec',zone:z.id,f,n:k,to:o.to}); L(zname(z)+': '+PLN[f].name+' licencia '+k+' '+(k>1?UNP[o.u].toLowerCase():UN[o.u].toLowerCase())+', que vuelve'+(k>1?'n':'')+' a ser '+(k>1?UNP[o.to].toLowerCase():UN[o.to].toLowerCase())+'.'); }
}
/** @param {Partida} g */
function doTrain(g,o,L){
  const z=g.zones[o.zone]; if(!z||z.owner!==o.f||!MIL.includes(o.u)) return;
  const f=o.f;
  const need=TRAIN_TECH[o.u]; if(need&&!techOwn(g,f,need)) return;
  const isWeapon=['arq','esc','ber','cab'].includes(o.u); const from=(isWeapon&&o.from==='sol')?'sol':null;
  const n=o.n||0; if(n<=0) return;
  const srcT=from||'pob', alt=CIV.filter(t=>t!=='pob');
  let made=0, reused=0; const us=lst(z,f);
  for(let i=0;i<n;i++){
    const stock=isWeapon&&stockOf(z,o.u)>0; const cost=trainCost(g,f,z,o.u,from,stock);
    if(z.prod<cost) break;
    let u=us.find(x=>x.t===srcT&&x.w===0&&!x.busy);
    if(!u&&!from) u=us.find(x=>UT[x.t].civ&&alt.includes(x.t)&&x.w===0&&!x.busy);
    if(!u) break;
    z.prod-=cost; if(stock){ z.eq[o.u]--; reused++; }
    u.t=o.u; u.hp=mhp(g,f,o.u,z); u.str=(isWeapon&&from)?u.str:2; u.busy=1; u.hg=0;
    u.mit=(o.u==='esc'&&z.res==='mitril')?1:0; u.cabhp=(o.u==='cab'&&z.res==='caballos')?1:0; u.brea=(UT[o.u].siege&&z.res==='brea')?1:0; made++;
  }
  if(made) g.fx.push({k:'train',zone:z.id,f,u:o.u,n:made});
  if(made) L(zname(z)+': '+PLN[f].name+' entrena '+made+' '+(made>1?UNP[o.u].toLowerCase():UN[o.u].toLowerCase())+(reused?' ('+reused+' con equipo recuperado)':'')+'.');
}
/** @param {Partida} g */
function doBuild(g,o,L){
  const z=g.zones[o.zone]; if(!z||z.owner!==o.f||!BT[o.bt]||o.bt==='mar') return; const f=o.f;
  if(!techOwn(g,f,BT[o.bt].unlock)) return;
  const used=z.b.length+z.proj.filter(p=>p.k==='b'||p.k==='w').length; if(used>=slotsOf(g,z)) return;
  const have=sameCount(z,o.bt); if(have>=maxSame(g,f,o.bt)) return;
  // se construye directamente en el nivel más alto desbloqueado (cuesta lo mismo que construir y mejorar)
  const dup=have>0?1:0, lvl=buildLevel(g,f,o.bt), c=Math.max(10,Math.round(stepCost(g,f,z,o.bt,dup)*lvl*g.M[f].bPct));
  const spec=(o.spec&&specOptions(g,f,o.bt).includes(o.spec))?o.spec:null;
  z.proj.push({k:'b',bt:o.bt,left:c,tot:c,dup,lvl,spec});
}
// Maravilla: 500 de producción (menos con tecnologías y piedra), sin trabajadores, ocupa un espacio.
/** @param {Partida} g */
function doWonder(g,o,L){
  const z=g.zones[o.zone]; const W=WONDERS[o.w]; if(!z||z.owner!==o.f||!W||!techOwn(g,o.f,W.tech)) return;
  if(wonderBuilt(g,o.w)||wonderRace(g,o.w).some(x=>x.f===o.f)) return;   // ya existe, o ya la estás construyendo
  const used=z.b.length+z.proj.filter(p=>p.k==='b'||p.k==='w').length; if(used>=slotsOf(g,z)) return;
  const c=wonderCostOf(g,o.f,z); z.proj.push({k:'w',w:o.w,left:c,tot:c});
  L('¡Carrera! '+PLN[o.f].name+' empieza '+W.n+' en '+zname(z)+'. Quien la termine primero se la queda.'); g.fx.push({k:'wstart',zone:z.id,f:o.f,w:o.w});
}
/** @param {Partida} g */
function doUpgrade(g,o,L){
  const z=g.zones[o.zone]; if(!z||z.owner!==o.f) return; const b=z.b[o.bi]; if(!b||b.t==='mar') return; const f=o.f;
  const to=b.l+1; if(to>5||to>capLevel(g,f,b.t)) return; if(b.t==='cuartel'&&to>5) return;
  if(z.proj.some(p=>p.k==='u'&&p.bi===o.bi)) return;
  const c=Math.max(10,Math.round((stepCost(g,f,z,b.t,b.dup)-(to>=3?g.M[f].upgRebate:0))*g.M[f].bPct)); z.proj.push({k:'u',bi:o.bi,to,left:c,tot:c});
}
/** @param {Partida} g */
function doSend(g,o,L){
  const a=g.zones[o.from], b=g.zones[o.to]; if(!a||!b||a.owner!==o.f||!(b.owner===o.f||allied(g,o.f,b.owner))||a.id===b.id) return;
  const res=o.res==='food'?'food':'prod'; const F=g.F[o.f]; const M=g.M[o.f];
  const path=ownPath(g,o.f,a.id,b.id,12); if(!path) return;
  let q=Math.min(o.q||0,a[res]); const room=capStore(g,b,res)-b[res]; q=Math.min(q,Math.max(0,room)+(res==='food'?0:0)); if(q<=0) return;
  const fac=shipFactor(g,path); let free=(M.caravan-(g.F[o.f].caravanUsed||0)); if(free<0) free=0;
  let costQ=Math.max(0,q-free), cost=Math.ceil(costQ*fac);
  if(M.freeFoodAdj&&res==='food'&&path.length===1) cost=0;
  if(cost>F.gold){ const per=fac>0?fac:1; q=Math.floor(F.gold/per)+free; q=Math.min(q,a[res]); costQ=Math.max(0,q-free); cost=Math.ceil(costQ*fac); if(q<=0) return; }
  F.gold-=cost; F.caravanUsed=(F.caravanUsed||0)+Math.min(free,q); a[res]-=q; b[res]+=q;
  if(M.logiRefund&&cost>0) F.gold+=Math.floor(cost*M.logiRefund);
  if(!o.auto){ g.fx.push({k:'send',from:a.id,to:b.id,f:o.f,res,q}); L(PLN[o.f].name+' envía '+q+' de '+(res==='food'?'comida':'producción')+': '+zname(a)+' → '+zname(b)+' (coste '+cost+' de oro).'); }
}
/** @param {Partida} g */
function doTribute(g,o,L){
  const t=g.tributes.find(x=>x.zone===o.tribe); const z=g.zones[o.from]; if(!t||!z||z.owner!==o.f) return;
  const res=t.res; if(res==='food'||res==='prod'){ const key=res==='food'?'food':'prod'; if(z[key]>=t.amount){ z[key]-=t.amount; t.paid[o.f]=1; L(PLN[o.f].name+' paga el tributo a la tribu de '+zname(g.zones[t.zone])+'.'); } }
  else { const F=g.F[o.f]; const k=res==='gold'?'gold':'tech'; if(F[k]>=t.amount){ F[k]-=t.amount; t.paid[o.f]=1; L(PLN[o.f].name+' paga el tributo a la tribu de '+zname(g.zones[t.zone])+'.'); } }
}
/** @param {Partida} g */
function doAlly(g,o,L){
  const F=g.F[o.f]; if(o.off){ if(F.ally!==null){ const x=F.ally; F.ally=null; if(isPl(x)&&g.F[x].ally===o.f) g.F[x].ally=null; L(PLN[o.f].name+' rompe su alianza.'); } F.req=null; return; }
  const tgt=o.target; if(!isPl(tgt)||tgt===o.f) return;
  const A=g.F[o.f], B=g.F[tgt];
  if(!(A.ghost||B.ghost)) return;       // las alianzas solo existen entre fantasma y jugador vivo
  if(A.ghost&&B.out) return; if(B.ghost&&A.out) return;
  A.req=tgt;
  if(B.req===o.f){ A.ally=tgt; B.ally=o.f; A.req=null; B.req=null; L('Alianza entre '+PLN[o.f].name+' y '+PLN[tgt].name+'.'); }
}
/** @param {Partida} g */
function resolveAnnex(g,list,L){
  const by={};
  list.forEach(o=>{
    const t=g.zones[o.zone]; if(!t||t.owner!==TRIBE||!(t.units[TRIBE]||[]).length) return;
    if(!nearOwnZones(g,o.f,t).length) return;
    const price=annexPrice(g,o.f,t), res=TSPEC_RES[t.tspec];
    if(annexHave(g,o.f,t)<price) return;
    (by[t.id]=by[t.id]||[]).push({o,price,res});
  });
  Object.keys(by).forEach(id=>{
    const t=g.zones[id], arr=by[id], facs=[...new Set(arr.map(x=>x.o.f))];
    if(facs.length>1){ t.tmult*=2; L(zname(t)+': varios jugadores pagaron a la vez. Nadie anexa y el precio se duplica.'); return; }
    const x=arr[0], f=x.o.f, F=g.F[f];
    if(annexHave(g,f,t)<x.price) return;   // si ya pagó otra anexión en este paso y no le alcanza para ésta, no se anexa
    if(x.res==='gold') F.gold-=x.price; else if(x.res==='tech') F.tech-=x.price;
    else { let need=x.price; nearOwnZones(g,f,t).sort((a,b)=>b[x.res]-a[x.res]).forEach(z=>{ const take=Math.min(z[x.res],need); z[x.res]-=take; need-=take; }); }
    t.owner=f; t.units[f]=t.units[TRIBE]; delete t.units[TRIBE]; t.units[f].forEach(u=>{ u.hg=0; }); t.tmult=1; t.food=Math.max(t.food,4);
    L(PLN[f].name+' anexa '+zname(t)+' pagando '+x.price+' de '+TSPEC_N[x.res]+'.'); g.fx.push({k:'annex',zone:t.id,f});
  });
}
/** @param {Partida} g */
function doMove(g,o,arrivals,L){
  const f=o.f, fr=g.zones[o.from]; if(!fr) return; const M=g.M[f];
  const route=[o.to].concat(o.via||[]); let cur=fr, ok=true; const stops=[];
  route.forEach((id,i)=>{ if(!ok) return; const nz=g.zones[id]; if(!nz||!cur.adj.includes(id)){ ok=false; return; } stops.push(nz); cur=nz; });
  if(!stops.length) return;
  const hops=stops.length; const extra=(fr.b.some(b=>b.t==='cuartel')?M.cuartelExtra:0);
  if(hops-1>extra) { stops.length=1+extra; }
  const mils=Object.keys(o.u||{}).filter(t=>MIL.includes(t));
  const moveCivOnly=Object.keys(o.u||{}).every(t=>CIV.includes(t));
  if(hops>1&&moveCivOnly) stops.length=1;
  const dest=stops[stops.length-1];
  const taken=[];
  const F=g.F[f];
  Object.keys(o.u||{}).forEach(t=>{
    let n=o.u[t]|0; if(n<=0) return;
    const isCiv=CIV.includes(t);
    if(isCiv&&dest.owner!==null&&dest.owner!==f&&!allied(g,f,dest.owner)) return;   // civiles solo a zonas libres o propias
    if(!isCiv){ // costo en oro por unidad por espacio
      const per=(M.milMoveHalf?0.5:1)*stops.length;
      const afford=per>0?Math.floor(F.gold/per):n; n=Math.min(n,afford); if(n<=0) return; F.gold-=Math.ceil(n*per);
    }
    const got=takeUnits(g,fr,f,t,n); got.forEach(u=>{ taken.push(u); });
  });
  if(!taken.length) return;
  if(M.migr&&taken.every(u=>UT[u.t].civ)&&dest.owner===f) taken.forEach(u=>{ u.half=1; });
  arrivals.push({f,to:dest.id,units:taken,st:o.stance||'paz'}); g.fx.push({k:'move',f,from:fr.id,to:dest.id,n:taken.length,mil:taken.filter(u=>!UT[u.t].civ).length,st:o.stance||'paz'});
}

/* ---- control de zonas ---- */
function controlZone(g,z,L){
  if(z.role==='frontera'){ z.owner=null; return; }   // tierra de nadie: nunca tiene dueño
  const ps=presentF(z);
  if(ps.length===0){ if(z.owner===TRIBE) z.owner=null; return; }   // una tribu sin gente deja la zona libre
  const sides=[]; ps.forEach(f=>{ if(!sides.some(s=>s.some(x=>x===f||allied(g,f,x)))) sides.push([f]); else sides.find(s=>s.some(x=>x===f||allied(g,f,x))).push(f); });
  if(sides.length===1){
    const s=sides[0];
    if(z.owner!==null&&s.includes(z.owner)) return;
    const f=s.includes(TRIBE)?TRIBE:s.slice().sort((a,b)=>(z.units[b].length)-(z.units[a].length))[0];
    if(z.owner===null){ z.owner=f; if(isPl(f)){ g.fx.push({k:'take',zone:z.id,f}); L(PLN[f].name+' toma el control de '+zname(z)+'.'); if(g.M[f].colonos&&z.size<=3&&!z.settled){ for(let i=0;i<2;i++) lst(z,f).push(mkUnit(g,f,'pob')); } z.settled=1; } }
    else if(z.owner!==f&&!allied(g,z.owner,f)){
      const old=z.owner; const M=g.M[isPl(f)?f:0]; g.fx.push({k:'conq',zone:z.id,f,old});
      z.owner=f; z.tmult=1; z.prog=0; z.proj=[]; z.pauseBuild=false; z.conflict=false; z.eq={}; z.eqPend={}; if(f===TRIBE&&!z.tspec) z.tspec=['agr','ing','com','cie'][Math.floor(g.rng()*4)];
      if(isPl(f)){
        z.size=Math.min(z.size,M.conqSize);
        const keep=M.conqKeep; const wond=z.b.filter(b=>b.t==='mar'); const others=z.b.filter(b=>b.t!=='mar');
        const kept=wond.concat(others).slice(0,Math.max(keep,wond.length)); const lost=z.b.filter(b=>!kept.includes(b));
        let refund=0; const rf=M.saqueo?1:M.conqRefund; lost.forEach(b=>{ refund+=Math.floor(b.cost*rf); }); z.b=kept; z.prod+=refund;
        if(refund) L(zname(z)+': se retiran '+lost.length+' edificio(s) y '+PLN[f].name+' recupera '+refund+' de producción.');
      }
      if(old===TRIBE){ const res=TSPEC_RES[z.tspec]; const amt=conquestReward(z); if(isPl(f)){ if(res==='food') z.food+=amt; else if(res==='prod') z.prod+=amt; else if(res==='gold') g.F[f].gold+=amt; else g.F[f].tech+=amt; } L(PLN[f].name+' conquista '+zname(z)+' y recibe '+amt+' de '+TSPEC_N[res]+'.'); }
      else L(PLN[f].name+' conquista '+zname(z)+' (antes de '+PLN[old].name+').');
    }
  } else {
    if(z.owner===null) return;
    if(!ps.some(f=>f===z.owner||allied(g,f,z.owner))) z.owner=null;
  }
}
