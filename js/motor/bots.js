'use strict';
// Bots sencillos: deciden órdenes con las mismas reglas que un jugador humano.

const BOT_BR = {
  eco:['Agricultura','Producción','Comercio','Logística','Urbanismo','Saber','Sanidad y población','Diplomacia e imperio','Cuartel y entrenamiento','Defensa','Armas y unidades','Guerra y conquista'],
  war:['Agricultura','Cuartel y entrenamiento','Armas y unidades','Producción','Defensa','Comercio','Guerra y conquista','Saber','Logística','Urbanismo','Sanidad y población','Diplomacia e imperio']
};
function pathNext(g,start,goal){
  const prev={}; prev[start]=null; const q=[start];
  while(q.length){ const a=q.shift(); if(a!==start&&goal(g.zones[a])){ let c=a; while(prev[c]!==start) c=prev[c]; return c; } for(const b of g.zones[a].adj) if(!(b in prev)){ prev[b]=a; q.push(b); } }
  return null;
}
function botOrders(g,f){
  const o=[]; const F=g.F[f], rng=g.rng; const M=g.M[f];
  if(F.out){
    if(F.ghost&&F.ally===null&&rng()<0.3){ const alive=[]; for(let x=0;x<g.N;x++) if(!g.F[x].out) alive.push(x); if(alive.length) o.push({t:'ally',f,target:alive[Math.floor(rng()*alive.length)]}); }
    return o;
  }
  for(let x=0;x<g.N;x++){ if(g.F[x].ghost&&g.F[x].req===f&&F.ally===null&&rng()<0.5) o.push({t:'ally',f,target:x}); }
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
  const goal=[['molino','taller','mercado','biblio','almacen','hospital'],['cuartel','molino','taller','mercado','fort','biblio','almacen','hospital']][style==='war'?1:0];
  mine.forEach(z=>{
    const us=z.units[f]||[]; const civ=us.filter(u=>UT[u.t].civ&&u.w===0); const pob=civ.filter(u=>u.t==='pob').length;
    const cnt={}; civ.forEach(u=>{ cnt[u.t]=(cnt[u.t]||0)+1; });
    // científicos investigando
    { const sci=us.filter(x=>x.t==='cie'&&x.w===0).length; o.push({t:'assign',f,zone:z.id,n:F.rq.length?Math.ceil(sci*0.7):0}); }
    // especialización
    if(pob>=1&&civ.length>=3&&z.prod>=1){
      const want={agr:0.35,ing:0.1,con:0.2,com:0.15,cie:0.2}; let best=null,bd=0;
      for(const t in want){ const d=want[t]*civ.length-(cnt[t]||0); if(d>bd){bd=d;best=t;} }
      if(best&&bd>=0.5) o.push({t:'spec',f,zone:z.id,from:'pob',to:best,n:Math.min(2,pob,Math.floor(z.prod))});
    }
    // construcción
    const freeSlots=slotsOf(g,z)-z.b.length-z.proj.filter(p=>p.k==='b'||p.k==='w').length;
    if(freeSlots>0&&z.prod>=5){
      for(const bt of goal){ if(techOwn(g,f,BT[bt].unlock)&&!z.b.some(b=>b.t===bt)&&!z.proj.some(p=>p.bt===bt)){ o.push({t:'build',f,zone:z.id,bt}); break; } }
    }
    z.b.forEach((b,i)=>{ if(b.t!=='mar'&&b.l<capLevel(g,f,b.t)&&z.prod>=15&&rng()<0.3) o.push({t:'upgrade',f,zone:z.id,bi:i}); if(!b.s&&rng()<0.3){ const op=specOptions(g,f,b.t); if(op.length) o.push({t:'bspec',f,zone:z.id,bi:i,spec:op[Math.floor(rng()*op.length)]}); } });
    // militares
    const surplus=2*civ.length+(z.capital?4:0)-(us.length+us.filter(u=>!UT[u.t].civ).length);
    const mil=us.filter(u=>!UT[u.t].civ);
    if(z.b.some(b=>b.t==='cuartel')&&mil.length<(style==='war'?10:5)&&z.prod>=4&&surplus>=2&&pob>=1){
      const opts=['sol']; ['arq','esc','ber','cab'].forEach(t=>{ if(!TRAIN_TECH[t]||techOwn(g,f,TRAIN_TECH[t])) opts.push(t); });
      if(techOwn(g,f,'Ingeniería de asedio')&&rng()<0.2) opts.push('ari'); if(techOwn(g,f,'Lanzapiedras')&&rng()<0.2) opts.push('lan');
      o.push({t:'train',f,zone:z.id,u:opts[Math.floor(rng()*opts.length)],n:1});
    }
    // anexar tribus
    z.adj.forEach(a=>{ const t=g.zones[a]; if(t.owner===TRIBE){ const price=annexPrice(g,f,t), res=TSPEC_RES[t.tspec]; const have=annexHave(g,f,t); if(have>=price+4&&rng()<0.6&&!o.some(x=>x.t==='annex'&&x.zone===t.id)) o.push({t:'annex',f,zone:t.id,from:z.id}); } });
    // expansión
    if(pob>=3&&surplus>=1&&rng()<(style==='eco'?0.5:0.25)){
      const emp=z.adj.map(a=>g.zones[a]).filter(t=>t.owner===null&&!presentF(t).length);
      if(emp.length){ const t=emp[Math.floor(rng()*emp.length)]; o.push({t:'move',f,from:z.id,to:t.id,u:{pob:1},stance:'paz'}); }
    }
    // ataque
    const armyTypes=['sol','arq','cab','esc','ber']; const army=mil.filter(u=>armyTypes.includes(u.t)&&u.w===0);
    const need=style==='war'?3:5;
    if(army.length>=need&&z.food>=2){
      const tg=z.adj.map(a=>g.zones[a]).filter(t=>t.owner!==null&&t.owner!==f&&!allied(g,f,t.owner)).map(t=>{ const d=Object.keys(t.units).filter(k=>Number(k)!==f).reduce((s,k)=>s+t.units[k].reduce((a,u)=>a+(UT[u.t].civ?1:2),0),0); return {t,d}; }).filter(x=>x.d*1.1<army.length*2).sort((a,b)=>(b.t.capital?1:0)-(a.t.capital?1:0)||a.d-b.d);
      const send={}; army.slice(0,army.length-1).forEach(u=>{ send[u.t]=(send[u.t]||0)+1; });
      if(tg.length&&rng()<0.8) o.push({t:'move',f,from:z.id,to:tg[0].t.id,u:send,stance:'ataque'});
      else if(!tg.length&&rng()<0.5){
        let hop=pathNext(g,z.id,t=>t.capital&&isPl(t.owner)&&t.owner!==f&&!allied(g,f,t.owner)); if(hop===null) hop=pathNext(g,z.id,t=>isPl(t.owner)&&t.owner!==f&&!allied(g,f,t.owner));
        if(hop!==null){ const h=g.zones[hop]; o.push({t:'move',f,from:z.id,to:hop,u:send,stance:(isPl(h.owner)&&h.owner!==f)?'ataque':'paz'}); }
      }
    }
    const threat=z.adj.some(a=>{ const t=g.zones[a]; return Object.keys(t.units).some(k=>Number(k)!==f&&isEnemy(g,f,Number(k))&&t.units[k].some(u=>!UT[u.t].civ)); });
    o.push({t:'stance',f,zone:z.id,stance:threat?'alerta':'paz'});
  });
  return o;
}
