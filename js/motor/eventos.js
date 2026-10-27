// @ts-check
'use strict';
// Eventos (uno cada 3 pasos desde el paso 6), tribus: anexión, tributos e invasiones.

const EV_EVERY=3;   // un evento cada 3 pasos; el primero cae en el paso 6
/** @param {Partida} g */
function scheduleEvents(g){
  while(g.evq.length<6){
    const last=g.evq.length?g.evq[g.evq.length-1].step:6-EV_EVERY;
    const e=EVENTS[Math.floor(g.rng()*EVENTS.length)];
    g.evq.push({step:last+EV_EVERY,id:e.id});
  }
}
/** @param {Partida} g */
function applyEventMods(g,ev,L){
  g.logiMult=1; g.fever=0; g.growHalfEv=0;
  g.zones.forEach(z=>{ z.ev={}; });
  if(!ev) return;
  const e=EVT[ev.id]; L('Evento: '+e.n+' — '+e.d+'.'); g.fx.push({k:'event',id:ev.id});
  if(e.k==='t'){ tribalEvent(g,e,L); return; }
  const pos=e.k==='+';
  g.zones.forEach(z=>{
    const f=z.owner; if(!isPl(f)) return;
    if(!(e.terr.includes('all')||e.terr.includes(z.terrain))) return;
    const M=g.M[f], F=g.F[f], rk=RISK[z.terrain];
    if(!pos&&M.avoidNeg&&g.step-F.lastAvoid>=10){ F.lastAvoid=g.step; L(PLN[f].name+' evita el evento negativo con Pronóstico.'); return; }
    let fac=rk;
    if(rk>1) fac*= pos?M.evPosRisk:M.evNegRisk;
    const r=x=>Math.max(1,Math.round(x*fac));
    switch(ev.id){
      case 'cosecha': z.ev={foodAgr:r(2),foodPob:r(2)}; break;
      case 'veta': z.ev={prodIng:r(2),prodPob:r(2)}; break;
      case 'feria': z.ev={goldCom:r(2)}; break;
      case 'inspira': z.ev={techCie:r(2)}; break;
      case 'caminos': g.logiMult=0.5; break;
      case 'fertil': g.growHalfEv=1; break;
      case 'sequia': z.ev={foodAgr:-Math.max(1,Math.round(1*fac*M.evNegFood)),foodPob:-Math.max(1,Math.round(1*fac*M.evNegFood))}; break;
      case 'plaga': z.ev={cons:Math.max(1,Math.round(1*fac*M.evNegCons))}; break;
      case 'derrumbe': z.ev={prodIng:-Math.max(1,Math.round(fac)),prodPob:-Math.max(1,Math.round(fac))}; break;
      case 'inunda': z.ev={flood:1}; break;
      case 'tormenta': g.logiMult=2; break;
      case 'fiebre': g.fever=1; break;
    }
  });
}
/** @param {Partida} g */
function tribalEvent(g,e,L){
  const tz=g.zones.filter(z=>z.owner===TRIBE); if(!tz.length) return;
  const z=tz[Math.floor(g.rng()*tz.length)];
  if(!z.tspec) z.tspec=/** @type {Civil[]} */(['agr','ing','com','cie'])[Math.floor(g.rng()*4)];
  if(e.id==='inquietud'){ lst(z,TRIBE).push(mkUnit(g,TRIBE,z.tspec)); L('La tribu de '+zname(z)+' crece.'); }
  else if(e.id==='furia'){ lst(z,TRIBE).forEach(u=>{ if(u.t==='sol') u.t='ber'; }); L('La tribu de '+zname(z)+' se vuelve berserker.'); }
  else if(e.id==='exodo'){
    const free=z.adj.map(a=>g.zones[a]).filter(t=>t.owner===null&&!presentF(t).length);
    if(free.length&&lst(z,TRIBE).length>=4){
      const t=free[Math.floor(g.rng()*free.length)]; const us=lst(z,TRIBE); const half=Math.floor(us.length/2);
      t.owner=TRIBE; t.tspec=z.tspec; t.tmult=1; t.units[TRIBE]=us.splice(0,half); L('Una tribu funda una nueva tribu en '+zname(t)+'.');
    }
  } else if(e.id==='tributo'){ makeTribeRequest(g,z,L); }
}
// Pedidos de las tribus: cada TRIBE_REQ_EVERY pasos, el mismo en el mismo paso para todos sus vecinos, según su oficio.
// Cumplirlo sube la relación; rechazarlo no tiene castigo (el pedido caduca).
/** @param {Partida} g */
function makeTribeRequest(g,z,L){
  const near=g.zones.filter(a=>isPl(a.owner)&&z.adj.includes(a.id));
  const pls=[...new Set(near.map(a=>a.owner))].filter(f=>!(g.wars||[]).some(w=>w.tribe===z.id&&w.f===f));
  if(!pls.length||g.tributes.some(t=>t.zone===z.id)) return;
  const list=TRIBE_REQS[z.tspec]||TRIBE_REQS.agr, k=Math.floor(g.step/TRIBE_REQ_EVERY)%list.length, res=list[k][0], amount=Math.round(list[k][1]*(1+g.step/60));
  g.tributes.push({zone:z.id,amount,due:g.step+TRIBE_REQ_EVERY-1,paid:{},targets:pls,res});
  L('La tribu de '+zname(z)+' pide '+amount+' de '+TSPEC_N[res]+'. Cumplirlo mejora tu relación con ella.');
}
/** @param {Partida} g */
function tribeRequests(g,L){ if(g.step%TRIBE_REQ_EVERY!==0) return; g.zones.forEach(z=>{ if(z.owner===TRIBE&&(z.units[TRIBE]||[]).length) makeTribeRequest(g,z,L); }); }
/** @param {Partida} g */
function upcomingEvents(g,f){
  const M=g.M[f]||newMods();
  return g.evq.filter(e=>e.step>=g.step&&e.step<=g.step+M.foresight-1+1).map(e=>({step:e.step,ev:EVT[e.id]}));
}
