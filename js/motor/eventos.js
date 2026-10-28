// @ts-check
'use strict';
// Años con eventos (calendario en reglas.js: 1 paso = 1 mes, 12 pasos = 1 año).
// Cada año (desde el 2.º; el 1.º es de fundación) tiene una parte CIERTA (Prosperidad o Escasez, ±15 % de lo que se produce) y una
// VARIABLE (un evento de la lista con el mismo signo); las dos duran todo el año. Además hay «sucesos» de un solo paso: un evento de tribu
// en un mes al azar (Éxodo o Pedido) y, en los años malos, a veces una inundación (que dura lo que queda del año). Además, cada año las tribus crecen (tribesGrow).

const EV_FLAVOR=e=>!e.year&&e.k!=='t'&&!e.flood;
/** @param {Partida} g */
function scheduleEvents(g){
  g.evGen=g.evGen||{yr:EV_FIRST_YEAR,signs:[],s:(g.seed*104729+11)|0};
  const er=mulberry32(g.evGen.s);   // azar propio: programar eventos no cambia los dados ni nada más de la partida
  while(g.evq.length<6){
    const G2=g.evGen, s0=(G2.yr-1)*YEAR_STEPS+1; const sg=G2.signs;
    let sign=er()<0.5?1:-1; if(sg.length>=2&&sg[sg.length-1]===sg[sg.length-2]) sign=-sg[sg.length-1];   // nunca tres años seguidos del mismo signo
    sg.push(sign);
    const flavors=EVENTS.filter(e=>EV_FLAVOR(e)&&e.k===(sign>0?'+':'-')), fl=flavors[Math.floor(er()*flavors.length)];
    g.evq.push({step:s0,id:sign>0?'prosper':'escasez',dur:YEAR_STEPS},{step:s0,id:fl.id,dur:YEAR_STEPS});
    const tribal=EVENTS.filter(e=>e.k==='t'); const te=tribal[Math.floor(er()*tribal.length)];
    g.evq.push({step:s0+1+Math.floor(er()*(YEAR_STEPS-1)),id:te.id,dur:1});
    if(sign<0&&er()<EV_FLOOD_CHANCE){ const fs=s0+1+Math.floor(er()*(YEAR_STEPS-1)); g.evq.push({step:fs,id:'inunda',dur:s0+YEAR_STEPS-fs}); }   // dura hasta el final del año
    g.evq.sort((a,b)=>a.step-b.step); G2.yr++;
  }
  g.evGen.s=er.state();
}
// Todos los eventos activos este paso (los que empezaron antes y siguen, y los que empiezan ahora) se aplican juntos.
/** @param {Partida} g */
function applyEventMods(g,act,L){
  g.logiMult=1; g.fever=0; g.growHalfEv=0;
  g.zones.forEach(z=>{ z.ev={}; });
  (act||[]).forEach(a=>{
    const e=EVT[a.id]; const isNew=a.start===g.step;
    if(isNew){ L('Evento: '+e.n+' — '+e.d+(a.end-a.start+1>=YEAR_STEPS?' (dura todo el año)':a.end>a.start?' (dura '+(a.end-a.start+1)+' pasos)':'')+'.'); g.fx.push({k:'event',id:a.id,dur:a.end-a.start+1}); }
    if(e.k==='t'){ if(isNew) tribalEvent(g,e,L); return; }
    const pos=e.k==='+'; a.avoid=a.avoid||{};
    g.zones.forEach(z=>{
      const f=z.owner; if(!isPl(f)) return;
      const add=(k,v)=>{ z.ev[k]=Math.round(((z.ev[k]||0)+v)*100)/100; };
      if(e.year){   // la parte cierta del año: no se puede evitar
        const m=z.ev.mul||(z.ev.mul={food:1,prod:1,gold:1,tech:1});
        if(a.id==='prosper'){ m.food*=1+EV_BASE_PCT; m.prod*=1+EV_BASE_PCT; m.gold*=1+EV_BASE_PCT; m.tech*=1+EV_BASE_PCT; }
        else { m.food*=1-EV_BASE_PCT; m.prod*=1-EV_BASE_PCT; }
        return;
      }
      if(!(e.terr.includes('all')||e.terr.includes(z.terrain))) return;
      const M=g.M[f], F=g.F[f], rk=RISK[z.terrain];
      if(!pos){   // Pronóstico: evita la parte variable negativa del año (cada 10 pasos como máximo)
        if(a.avoid[f]===undefined){ if(M.avoidNeg&&g.step-F.lastAvoid>=10){ F.lastAvoid=g.step; a.avoid[f]=1; L(PLN[f].name+' evita el evento negativo con Pronóstico.'); } else a.avoid[f]=0; }
        if(a.avoid[f]) return;
      }
      let fac=rk;
      if(rk>1) fac*= pos?M.evPosRisk:M.evNegRisk;
      const q=x=>Math.round(x*fac*100)/100;
      switch(a.id){
        case 'cosecha': add('foodAgr',q(0.5)); add('foodPob',q(0.5)); break;
        case 'veta': add('prodIng',q(0.5)); add('prodPob',q(0.5)); break;
        case 'feria': add('goldCom',q(0.5)); break;
        case 'inspira': add('techCie',q(0.5)); break;
        case 'caminos': g.logiMult*=0.5; break;
        case 'fertil': g.growHalfEv=1; break;
        case 'sequia': { const v=Math.round(0.5*fac*M.evNegFood*100)/100; add('foodAgr',-v); add('foodPob',-v); break; }
        case 'plaga': add('cons',Math.round(0.25*fac*M.evNegCons*100)/100); break;
        case 'derrumbe': add('prodIng',-q(0.5)); add('prodPob',-q(0.5)); break;
        case 'inunda': z.ev.flooded=1; if(isNew) z.ev.flood=1; break;   // los almacenes guardan la mitad todo el resto del año; las reservas se parten a la mitad solo al empezar
        case 'tormenta': g.logiMult*=EV_TORMENTA_MULT; break;
        case 'fiebre': g.fever=1; break;
      }
    });
  });
}
/** @param {Partida} g */
function tribalEvent(g,e,L){
  const tz=g.zones.filter(z=>z.owner===TRIBE); if(!tz.length) return;
  const z=tz[Math.floor(g.rng()*tz.length)];
  if(!z.tspec) z.tspec=/** @type {Civil[]} */(['agr','ing','com','cie'])[Math.floor(g.rng()*4)];
  if(e.id==='exodo'){
    const free=z.adj.map(a=>g.zones[a]).filter(t=>t.owner===null&&!presentF(t).length);
    if(free.length&&lst(z,TRIBE).length>=4){
      const t=free[Math.floor(g.rng()*free.length)]; const us=lst(z,TRIBE); const half=Math.floor(us.length/2);
      t.owner=TRIBE; t.tspec=z.tspec; t.tmult=1; t.units[TRIBE]=us.splice(0,half); L('Una tribu funda una nueva tribu en '+zname(t)+'.');
    }
  } else if(e.id==='tributo'){ makeTribeRequest(g,z,L); }
}
// Crecimiento anual de todas las tribus: al empezar cada año (desde el 2.º), +TRIBE_YEAR_CIV civil de su oficio y +TRIBE_YEAR_BAR bárbaros.
/** @param {Partida} g */
function tribesGrow(g,L){
  if(g.step<=1||(g.step-1)%YEAR_STEPS!==0) return;
  const tz=g.zones.filter(z=>z.owner===TRIBE); if(!tz.length) return;
  tz.forEach(z=>{ if(!z.tspec) z.tspec=/** @type {Civil[]} */(['agr','ing','com','cie'])[Math.floor(g.rng()*4)];
    for(let i=0;i<TRIBE_YEAR_CIV;i++) lst(z,TRIBE).push(mkUnit(g,TRIBE,z.tspec));
    for(let i=0;i<TRIBE_YEAR_BAR;i++) lst(z,TRIBE).push(mkUnit(g,TRIBE,'ber')); });
  L('Empieza el año '+(Math.floor((g.step-1)/YEAR_STEPS)+1)+': cada tribu gana '+TRIBE_YEAR_CIV+' civil y '+TRIBE_YEAR_BAR+' bárbaros.');
}
// Pedidos de las tribus: cada TRIBE_REQ_EVERY pasos, el mismo en el mismo paso para todos sus vecinos, según su oficio.
// Cumplirlo sube la relación y la tribu no te vuelve a pedir durante TRIBE_REQ_COOLDOWN pasos; rechazarlo no tiene castigo (el pedido caduca).
/** @param {Partida} g */
function makeTribeRequest(g,z,L){
  const near=g.zones.filter(a=>isPl(a.owner)&&z.adj.includes(a.id));
  const pls=[...new Set(near.map(a=>a.owner))].filter(f=>!(g.wars||[]).some(w=>w.tribe===z.id&&w.f===f)&&g.step-((z.paidAt||{})[f]||-99)>=TRIBE_REQ_COOLDOWN);
  if(!pls.length||g.tributes.some(t=>t.zone===z.id)) return;
  const list=TRIBE_REQS[z.tspec]||TRIBE_REQS.agr, k=Math.floor(g.step/TRIBE_REQ_EVERY)%list.length, res=list[k][0], amount=Math.round(list[k][1]*(1+g.step/60));
  g.tributes.push({zone:z.id,amount,due:g.step+TRIBE_REQ_EVERY-1,paid:{},targets:pls,res});
  L('La tribu de '+zname(z)+' pide '+amount+' de '+TSPEC_N[res]+'. Cumplirlo mejora tu relación con ella.');
}
/** @param {Partida} g */
// Pasos que faltan hasta el próximo pedido de esa tribu a ese jugador (0 = este mismo paso; null = no pide: está en guerra con él).
/** @param {Partida} g */
function tribeNextAsk(g,tz,f){
  if((g.wars||[]).some(w=>w.tribe===tz.id&&w.f===f)) return null;
  const last=(tz.paidAt||{})[f]===undefined?-99:tz.paidAt[f];
  for(let s=g.step;s<g.step+200;s++){ if(s%TRIBE_REQ_EVERY===0&&s-last>=TRIBE_REQ_COOLDOWN) return s-g.step; }
  return null;
}
/** @param {Partida} g */
function tribeRequests(g,L){ if(g.step%TRIBE_REQ_EVERY!==0) return; g.zones.forEach(z=>{ if(z.owner===TRIBE&&(z.units[TRIBE]||[]).length) makeTribeRequest(g,z,L); }); }
/** @param {Partida} g */
function upcomingEvents(g,f){
  const M=g.M[f]||newMods();
  return g.evq.filter(e=>e.step>=g.step&&e.step<=g.step+M.foresight-1+1).map(e=>({step:e.step,dur:e.dur||1,ev:EVT[e.id]}));
}
