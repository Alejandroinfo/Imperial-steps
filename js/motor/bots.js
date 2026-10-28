// @ts-check
'use strict';
// Bots sencillos: deciden órdenes con las mismas reglas que un jugador humano.

const BOT_BR = {
  eco:['Agricultura','Producción','Comercio','Logística','Urbanismo','Saber','Sanidad y población','Diplomacia e imperio','Cuartel y entrenamiento','Defensa','Armas y unidades','Guerra y conquista'],
  war:['Agricultura','Cuartel y entrenamiento','Armas y unidades','Producción','Defensa','Comercio','Guerra y conquista','Saber','Logística','Urbanismo','Sanidad y población','Diplomacia e imperio']
};
/** @param {Partida} g */
function pathNext(g,start,goal){
  const prev={}; prev[start]=null; const q=[start];
  while(q.length){ const a=q.shift(); if(a!==start&&goal(g.zones[a])){ let c=a; while(prev[c]!==start) c=prev[c]; return c; } for(const b of g.zones[a].adj) if(!(b in prev)){ prev[b]=a; q.push(b); } }
  return null;
}
// Primer paso del camino más corto hacia alguna zona que cumpla goal, pasando solo por zonas
// donde pueden entrar civiles (libres o propias).
/** @param {Partida} g */
function civPathNext(g,f,start,goal){
  const ok=z=>z.owner===null||z.owner===f; const prev={}; prev[start]=null; const q=[start];
  while(q.length){ const a=q.shift(); if(a!==start&&goal(g.zones[a])){ let c=a; while(prev[c]!==start) c=prev[c]; return c; }
    for(const b of g.zones[a].adj) if(!(b in prev)&&ok(g.zones[b])&&!g.zones[b].conflict){ prev[b]=a; q.push(b); } }
  return null;
}
/**
 * Órdenes de un bot para este paso.
 * @param {Partida} g
 * @param {Jugador} f
 * @returns {Orden[]}
 */
function botOrdersCore(g,f){
  /** @type {Orden[]} */
  const o=[]; const F=g.F[f], rng=g.rng; const M=g.M[f];
  if(F.out){
    if(F.ghost&&F.ally===null&&rng()<0.3){ const alive=[]; for(let x=0;x<g.N;x++) if(!g.F[x].out) alive.push(x); if(alive.length) o.push({t:'ally',f,target:alive[Math.floor(rng()*alive.length)]}); }
    return o;
  }
  for(let x=0;x<g.N;x++){ if(g.F[x].ghost&&g.F[x].req===f&&F.ally===null&&rng()<0.5) o.push({t:'ally',f,target:x}); }
  { const c=botEncounter(g,f); if(c) o.push({t:'encounter',f,choice:c}); }
  const style=(f%2===1)?'eco':'war';
  // investigación: encola hasta 2 tecnologías; los científicos asignados las desarrollan
  if(F.rq.length<2){
    const cands=TECHS.filter(t=>!F.techs[t.n]&&t.impl&&canResearch(g,f,t.n));
    const UNL=style==='war'?['Arco','Escudos']:['Hospitales'];
    const up=n=>{ const i=UNL.indexOf(n); return i<0?99:i; };
    cands.sort((a,b)=>(up(a.n)-up(b.n))||(b.v-a.v)||(BOT_BR[style].indexOf(a.r)-BOT_BR[style].indexOf(b.r))||(a.l-b.l));
    if(cands.length){ const pick=cands[rng()<0.7?0:Math.floor(rng()*Math.min(3,cands.length))]; o.push({t:'research',f,name:pick.n}); }
  }
  // tributos pendientes
  g.tributes.forEach(t=>{ if(t.targets.includes(f)&&!t.paid[f]){ const z=zonesOf(g,f).find(a=>(t.res==='food'?a.food:t.res==='prod'?a.prod:t.res==='gold'?F.gold:F.tech)>=t.amount+2&&g.zones[t.zone].adj.includes(a.id)); if(z) o.push({t:'tribute',f,tribe:t.zone,from:z.id}); } });
  const mine=zonesOf(g,f);
  /** @type {TipoEdificio[]} */
  const goal=/** @type {any} */([['molino','cuartel','taller','mercado','biblio','almacen','hospital'],['cuartel','molino','taller','mercado','fort','biblio','almacen','hospital']])[style==='war'?1:0];
  mine.forEach(z=>{
    const us=z.units[f]||[]; const civ=us.filter(u=>UT[u.t].civ&&u.w===0); const pob=civ.filter(u=>u.t==='pob').length;
    const cnt={}; civ.forEach(u=>{ cnt[u.t]=(cnt[u.t]||0)+1; });
    // especialización
    if(pob>=1&&civ.length>=3&&z.prod>=1){
      // los ingenieros construyen solos si hay obra; al inicio, sobre todo agricultores
      const building=z.proj.length>0||(slotsOf(g,z)-z.b.length>0&&z.prod>=10);
      const want={agr:g.step<15?0.5:0.35,ing:building?0.27:0.12,com:0.13,cie:0.2}; let best=null,bd=0;
      for(const t in want){ const d=want[t]*civ.length-(cnt[t]||0); if(d>bd){bd=d;best=t;} }
      if(best&&bd>=0.5){ const nn=Math.min(2,pob,Math.floor(z.prod));
        const ids=us.filter(u=>u.t==='pob'&&u.w===0&&!u.busy).sort((a,b)=>trMul(b,best)-trMul(a,best)).slice(0,nn).map(u=>u.id);   // los bots eligen a los de mejor rasgo
        o.push({t:'spec',f,zone:z.id,from:'pob',to:/** @type {Civil} */(best),n:nn,ids}); }
    }
    // construcción
    const freeSlots=slotsOf(g,z)-z.b.length-z.proj.filter(p=>p.k==='b'||p.k==='w').length;
    if(freeSlots>0&&z.prod>=5){
      for(const bt of goal){ if(techOwn(g,f,BT[bt].unlock)&&!z.b.some(b=>b.t===bt)&&!z.proj.some(p=>p.bt===bt)){ o.push({t:'build',f,zone:z.id,bt}); break; } }
    }
    z.b.forEach((b,i)=>{ if(b.t!=='mar'&&b.l<capLevel(g,f,b.t)&&z.prod>=15&&rng()<0.3) o.push({t:'upgrade',f,zone:z.id,bi:i}); if(!b.s&&rng()<0.3){ const op=specOptions(g,f,b.t); if(op.length) o.push({t:'bspec',f,zone:z.id,bi:i,spec:op[Math.floor(rng()*op.length)]}); } });
    // maravillas: si tiene la tecnología, un espacio libre y producción de sobra, empieza una que siga libre
    if(freeSlots>0&&z.prod>=60){ const w=Object.keys(WONDERS).find(k=>techOwn(g,f,WONDERS[k].tech)&&!wonderBuilt(g,k)&&!wonderRace(g,k).some(x=>x.f===f)); if(w) o.push({t:'wonder',f,zone:z.id,w}); }
    // militares
    const mil=us.filter(u=>!UT[u.t].civ);
    const eat=us.reduce((a,u)=>a+(UT[u.t].civ?1:(UNIT_UPKEEP[u.t]?UNIT_UPKEEP[u.t].food:1)),0), net=(z.last?z.last.food:0)-eat;
    const surplus=net;
    // tropas objetivo: crecen con la partida (los guerreros antes y más)
    // tropas objetivo: ninguna durante la fundación (primero crecer), después según el estilo
    const target=g.step<=FOUNDING_STEPS?(style==='war'?1:0):(style==='war'?2+Math.floor(g.step/4):1+Math.floor(g.step/7));
    if(mil.length<target&&hasBarracks(z)&&net>=1+Math.floor(mil.length/2)&&civ.length>=4){
      /** @type {Militar[]} */
      const opts=['sol']; /** @type {Militar[]} */(['arq','esc','ber','cab']).forEach(t=>{ if(!TRAIN_TECH[t]||techOwn(g,f,TRAIN_TECH[t])) opts.push(t); });
      if(techOwn(g,f,'Ingeniería de asedio')&&rng()<0.2) opts.push('ari'); if(techOwn(g,f,'Lanzapiedras')&&rng()<0.2) opts.push('lan');
      const pick=opts[Math.floor(rng()*opts.length)]; const c=recruitCost(g,f,z,pick,'new',false);
      if(z.prod>=c.prod&&z.food>=c.food+4&&F.gold>=c.gold+2) o.push({t:'train',f,zone:z.id,u:pick,n:1,from:'new'});
    }
    // un general: cuando ya hay tropas que liderar, un civil apto asciende (el más apto para pelear)
    { const gens=mil.filter(u=>u.gen).length; if(mil.length>=2&&gens<1+Math.floor(mil.length/4)&&civ.length>=6&&rng()<0.3){ const c=recruitCost(g,f,z,'sol','civ',false);
        if(z.prod>=c.prod&&z.food>=c.food+5&&F.gold>=c.gold+3){ const ids=us.filter(u=>UT[u.t].civ&&u.w===0&&!u.busy).sort((a,b)=>(trInt(b,'fue')+trInt(b,'sal'))-(trInt(a,'fue')+trInt(a,'sal'))).slice(0,1).map(u=>u.id); if(ids.length) o.push({t:'train',f,zone:z.id,u:'sol',n:1,from:'civ',ids}); } } }
    // anexar tribus
    z.adj.forEach(a=>{ const t=g.zones[a]; if(t.owner===TRIBE){ const price=annexPrice(g,f,t), res=TSPEC_RES[t.tspec]; const have=annexHave(g,f,t); if(((t.rel||{})[f]||0)>=TRIBE_REL_MAX&&have>=price+4&&rng()<0.6&&!o.some(x=>x.t==='annex'&&x.zone===t.id)) o.push({t:'annex',f,zone:t.id,from:z.id}); } });
    // expansión
    // a quién mandar a expandirse: un poblador si hay; si no, alguien de un oficio que sobre
    const mover=pob>=1?'pob':(['com','agr','ing'].find(t=>(cnt[t]||0)>=2)||null);
    if(mover&&civ.length>=4&&(pob>=3||!z.capital||civ.length>=5)&&rng()<(style==='eco'?0.5:0.4)){
      const emp=z.adj.map(a=>g.zones[a]).filter(t=>t.owner===null&&t.role!=='frontera'&&!presentF(t).length);   // las zonas peligrosas son para las tropas
      if(emp.length){ const t=emp[Math.floor(rng()*emp.length)]; o.push({t:'move',f,from:z.id,to:t.id,u:{[mover]:1},stance:'paz'}); }
      else if(false){ // sin vecina libre: avanzar un paso hacia la frontera más cercana que aún no tenga gente suya
        const hop=civPathNext(g,f,z.id,t=>t.role==='frontera'&&!(t.units[f]||[]).length&&t.owner!==null?false:(t.role==='frontera'&&!(t.units[f]||[]).length));
        if(hop!==null&&rng()<0.6) o.push({t:'move',f,from:z.id,to:hop,u:{[mover]:1},stance:'paz'}); }
    }
    // ataque
    const armyTypes=['sol','arq','cab','esc','ber']; const army=mil.filter(u=>armyTypes.includes(u.t)&&u.w===0);
    const need=style==='war'?3:5;
    const front=z.adj.map(a=>g.zones[a]).find(t=>t.role==='frontera'&&presentF(t).some(x=>x!==f&&isPl(x))&&!(t.units[f]||[]).some(u=>!UT[u.t].civ));
    const frEmpty=z.adj.map(a=>g.zones[a]).find(t=>t.role==='frontera'&&!(t.units[f]||[]).length&&(t.owner===null||t.owner===f));
    if(frEmpty&&army.length>=1&&rng()<0.5) o.push({t:'move',f,from:z.id,to:frEmpty.id,u:{[army[0].t]:1},stance:'paz'});
    if(style==='war'&&front&&army.length>=2&&rng()<0.4){
      /** @type {{[t:string]:number}} */
      const send={}; army.slice(0,Math.ceil(army.length/2)).forEach(u=>{ send[u.t]=(send[u.t]||0)+1; }); o.push({t:'move',f,from:z.id,to:front.id,u:send,stance:'paz'}); }
    if(army.length>=need&&z.food>=2){
      const tg=z.adj.map(a=>g.zones[a]).filter(t=>t.owner!==null&&t.owner!==f&&!allied(g,f,t.owner)&&supplySources(g,f,t.id).length>0).map(t=>{ const d=Object.keys(t.units).filter(k=>Number(k)!==f).reduce((s,k)=>s+t.units[k].reduce((a,u)=>a+(UT[u.t].civ?1:2),0),0); return {t,d}; }).filter(x=>x.d*1.1<army.length*2).sort((a,b)=>(b.t.capital?1:0)-(a.t.capital?1:0)||(b.t.res?1:0)-(a.t.res?1:0)||a.d-b.d);
      /** @type {{[t:string]:number}} */ const send={}; army.slice(0,army.length-1).forEach(u=>{ send[u.t]=(send[u.t]||0)+1; });
      if(tg.length&&rng()<0.8) o.push({t:'move',f,from:z.id,to:tg[0].t.id,u:send,stance:'ataque'});
      else if(!tg.length&&rng()<0.5){
        let hop=pathNext(g,z.id,t=>t.capital&&isPl(t.owner)&&t.owner!==f&&!allied(g,f,t.owner)); if(hop===null) hop=pathNext(g,z.id,t=>isPl(t.owner)&&t.owner!==f&&!allied(g,f,t.owner));
        if(hop!==null){ const h=g.zones[hop]; o.push({t:'move',f,from:z.id,to:hop,u:send,stance:(isPl(h.owner)&&h.owner!==f)?'ataque':'paz'}); }
      }
    }
  });
  // postura hacia cada jugador: alerta si tiene tropas en sus zonas o al lado,
  // o (si es guerrero) si en una frontera compartida le saca mucha ventaja: traiciona el trato
  const power=(z,x)=>(z.units[x]||[]).reduce((a,u)=>a+(UT[u.t].civ?0.3:(u.str||2)),0);
  for(let x=0;x<g.N;x++){ if(x===f||g.F[x].out) continue;
    const near=mine.some(z=>[z.id].concat(z.adj).some(a=>(g.zones[a].units[x]||[]).some(u=>!UT[u.t].civ)));
    const betray=style==='war'&&g.zones.some(z=>z.role==='frontera'&&(z.units[f]||[]).length&&(z.units[x]||[]).length&&power(z,f)>=2*Math.max(1,power(z,x)))&&rng()<0.35;
    const want=(near||betray)&&isEnemy(g,f,x)?'alerta':'paz'; if(stanceOf(g,f,x)!==want) o.push({t:'stance',f,target:x,stance:want}); }
  // tratos: de vez en cuando proponen uno a otro jugador. Reciben al menos el mismo valor que dan, y no tocan el recurso de la próxima subasta.
  { const t=botTradeOffer(g,f); if(t) o.push(t); }
  return o;
}

// Subasta: desde que se anuncia, el bot acumula la moneda (no la gasta, y guarda la comida o pausa las obras) y pone sus pujas.
/** @param {Partida} g @param {Jugador} f */
function botAuctionHold(g,f){
  const a=g.auction; if(!a||g.F[f].out) return null;
  const funds=auctionFunds(g,f,a.cur), want=a.items.reduce((x,it)=>x+auctionValue(it,a.cur),0);
  return {cur:a.cur, amt:Math.min(funds,Math.ceil(want*AUCTION_BOT_SPEND))};
}
// Número al azar con distribución normal (media 0, varianza `v`) usando el azar de la partida.
/** @param {Partida} g @param {number} v */
function randNormal(g,v){ const u=Math.max(1e-9,g.rng()), w=g.rng(); return Math.sqrt(v)*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*w); }
/** @param {Partida} g @param {Jugador} f */
function botOrders(g,f){
  const hold=botAuctionHold(g,f); const F=g.F[f]; /** @type {{z:Zona,n:number}[]} */ const hid=[]; let hidG=0;
  if(hold&&hold.amt>0){   // mientras decide, «no ve» lo reservado: así no lo gasta en obras, tropas ni tecnologías
    if(hold.cur==='gold'||hold.cur==='tech'){ hidG=hold.amt; F[hold.cur]-=hidG; }
    else { const zs=zonesOf(g,f).filter(z=>z[hold.cur]>=1); let left=hold.amt; zs.forEach(z=>{ const t=Math.min(Math.floor(z[hold.cur]),left); if(t>0){ z[hold.cur]-=t; hid.push({z,n:t}); left-=t; } }); }
  }
  const o=botOrdersCore(g,f);
  if(hold&&hold.amt>0){ if(hidG) F[hold.cur]+=hidG; hid.forEach(h=>{ h.z[hold.cur]+=h.n; }); }
  if(F.out) return o;
  // acumular lo que el motor gasta solo: la comida que sobra (en vez de crecer) y las obras (en vez de construir)
  const want=hold&&hold.amt>0&&(hold.cur==='food'||hold.cur==='prod')&&!botAuctionBidsDone(g,f);
  zonesOf(g,f).forEach(z=>{
    if(want&&hold.cur==='food'&&(z.growMode||GROW_MODE_DEFAULT)!=='guardar'){ o.push({t:'growmode',f,zone:z.id,mode:'guardar'}); (F.botHeld=F.botHeld||{})[z.id]='growmode'; }
    else if(want&&hold.cur==='prod'&&!z.pauseBuild){ o.push({t:'pausebuild',f,zone:z.id,on:true}); (F.botHeld=F.botHeld||{})[z.id]='pausebuild'; }
    else if(!hold&&F.botHeld&&F.botHeld[z.id]){ if(F.botHeld[z.id]==='growmode') o.push({t:'growmode',f,zone:z.id,mode:'crecer'}); else o.push({t:'pausebuild',f,zone:z.id,on:false}); delete F.botHeld[z.id]; }
  });
  // pujas: el valor esperado de cada objeto con varianza AUCTION_BOT_VAR, sin pasar de AUCTION_BOT_SPEND de lo que tiene
  { const a=g.auction; if(a&&g.step>=a.step-1&&!botAuctionBidsDone(g,f)){ const funds=auctionFunds(g,f,a.cur);
      const wants=a.items.map(it=>Math.max(0,auctionValue(it,a.cur)+randNormal(g,AUCTION_BOT_VAR))); const tot=wants.reduce((x,y)=>x+y,0);
      const k=tot>funds*AUCTION_BOT_SPEND?funds*AUCTION_BOT_SPEND/tot:1;
      wants.forEach((w,i)=>{ const amt=Math.floor(w*k); if(amt>0) o.push({t:'bid',f,item:i,amount:amt}); }); } }
  return o;
}
/** @param {Partida} g @param {Jugador} f */
function botAuctionBidsDone(g,f){ const a=g.auction; return !!(a&&a.bids[f]&&Object.keys(a.bids[f]).length); }

// Un trato que propone un bot: da una parte de lo que más tiene y pide algo de igual o más valor de lo que menos tiene. null si no toca.
/** @param {Partida} g @param {Jugador} f @returns {Orden|null} */
function botTradeOffer(g,f){
  if(g.step<OFFER_BOT_FROM||(g.step+f)%OFFER_BOT_EVERY!==0||g.rng()>=OFFER_BOT_CHANCE) return null;
  if((g.offers||[]).filter(x=>x.from===f).length>=1) return null;
  const libres=OFFER_RES.filter(r=>!g.auction||r!==g.auction.cur);   // el recurso de la subasta que viene se guarda
  if(libres.length<2) return null;
  const val=r=>ownedTotal(g,f,r)*OFFER_VAL[r];
  const orden=libres.slice().sort((a,b)=>val(b)-val(a)); const dar=orden[0], pedir=orden[orden.length-1];
  const n=Math.min(OFFER_BOT_MAX,Math.floor(ownedTotal(g,f,dar)*OFFER_BOT_PCT)); if(n<OFFER_BOT_MIN) return null;
  const m=Math.ceil(n*OFFER_VAL[dar]/OFFER_VAL[pedir]-1e-9);   // redondeado hacia arriba: nunca recibe menos valor del que da
  const otros=[]; for(let x=0;x<g.N;x++) if(x!==f&&!g.F[x].out&&isPl(x)) otros.push(x); if(!otros.length) return null;
  return {t:'offer',f,to:otros[Math.floor(g.rng()*otros.length)],give:{res:/** @type {Recurso} */(dar),n},ask:{res:/** @type {Recurso} */(pedir),n:m}};
}
