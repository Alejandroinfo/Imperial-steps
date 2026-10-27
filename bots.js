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
function botOrders(g,f){
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
    const eat=us.reduce((a,u)=>a+(UT[u.t].civ?1:2),0), net=(z.last?z.last.food:0)-eat;
    const surplus=net;
    // tropas objetivo: crecen con la partida (los guerreros antes y más)
    // tropas objetivo: ninguna durante la fundación (primero crecer), después según el estilo
    const target=g.step<=FOUNDING_STEPS?(style==='war'?1:0):(style==='war'?2+Math.floor(g.step/4):1+Math.floor(g.step/7));
    if(mil.length<target&&z.prod>=3&&net>=2+mil.length&&civ.length>=4){
      /** @type {Militar[]} */
      const opts=['sol']; /** @type {Militar[]} */(['arq','esc','ber','cab']).forEach(t=>{ if(!TRAIN_TECH[t]||techOwn(g,f,TRAIN_TECH[t])) opts.push(t); });
      if(techOwn(g,f,'Ingeniería de asedio')&&rng()<0.2) opts.push('ari'); if(techOwn(g,f,'Lanzapiedras')&&rng()<0.2) opts.push('lan');
      o.push({t:'train',f,zone:z.id,u:opts[Math.floor(rng()*opts.length)],n:1});
    }
    // anexar tribus
    z.adj.forEach(a=>{ const t=g.zones[a]; if(t.owner===TRIBE){ const price=annexPrice(g,f,t), res=TSPEC_RES[t.tspec]; const have=annexHave(g,f,t); if(have>=price+4&&rng()<0.6&&!o.some(x=>x.t==='annex'&&x.zone===t.id)) o.push({t:'annex',f,zone:t.id,from:z.id}); } });
    // expansión
    // a quién mandar a expandirse: un poblador si hay; si no, alguien de un oficio que sobre
    const mover=pob>=1?'pob':(['com','agr','ing'].find(t=>(cnt[t]||0)>=2)||null);
    const frAdj=g.zones.find(t=>t.role==='frontera'&&t.adj.includes(z.id)&&t.owner===null&&!(t.units[f]||[]).length);
    if(mover&&frAdj&&(!z.capital||civ.length>=4)&&rng()<0.6) o.push({t:'move',f,from:z.id,to:frAdj.id,u:{[mover]:1},stance:'paz'});
    if(mover&&civ.length>=4&&(pob>=3||!z.capital||civ.length>=5)&&rng()<(style==='eco'?0.5:0.4)){
      const emp=z.adj.map(a=>g.zones[a]).filter(t=>t.owner===null&&(!presentF(t).length||(t.role==='frontera'&&!(t.units[f]||[]).length&&!t.conflict)));
      const fr=emp.filter(t=>t.role==='frontera');
      if(emp.length){ const t=fr.length&&rng()<0.7?fr[0]:emp[Math.floor(rng()*emp.length)]; o.push({t:'move',f,from:z.id,to:t.id,u:{[mover]:1},stance:'paz'}); }
      else { // sin vecina libre: avanzar un paso hacia la frontera más cercana que aún no tenga gente suya
        const hop=civPathNext(g,f,z.id,t=>t.role==='frontera'&&!(t.units[f]||[]).length&&t.owner!==null?false:(t.role==='frontera'&&!(t.units[f]||[]).length));
        if(hop!==null&&rng()<0.6) o.push({t:'move',f,from:z.id,to:hop,u:{[mover]:1},stance:'paz'}); }
    }
    // ataque
    const armyTypes=['sol','arq','cab','esc','ber']; const army=mil.filter(u=>armyTypes.includes(u.t)&&u.w===0);
    const need=style==='war'?3:5;
    const front=z.adj.map(a=>g.zones[a]).find(t=>t.role==='frontera'&&presentF(t).some(x=>x!==f&&isPl(x))&&!(t.units[f]||[]).some(u=>!UT[u.t].civ));
    const frEmpty=z.adj.map(a=>g.zones[a]).find(t=>t.role==='frontera'&&!(t.units[f]||[]).length&&(t.owner===null||t.owner===f));
    if(style==='war'&&frEmpty&&army.length>=1&&rng()<0.5) o.push({t:'move',f,from:z.id,to:frEmpty.id,u:{[army[0].t]:1},stance:'paz'});
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
  return o;
}
