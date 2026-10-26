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

const SOIL='#7A5237', SOIL2='#5E3E29', INK='#2c1f18';
const WALLS=['#EADBA9','#CDB77A','#A9BDC0','#E6C9A8'];
const HW=55, HH=31, DEPTH=14;
const f1=n=>Number(n).toFixed(1);

function tree(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-1.6" y="-8" width="3.2" height="9" fill="#6B4528" stroke="${INK}" stroke-width=".6"/><circle cx="0" cy="-13" r="8" fill="#3F7D4B" stroke="${INK}" stroke-width=".8"/><circle cx="-3" cy="-15" r="3.2" fill="#5E9A5A"/></g>`;}
function peak(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><polygon points="-15,0 0,-25 15,0" fill="#8C857C" stroke="${INK}" stroke-width=".8"/><polygon points="0,-25 15,0 5,0" fill="#6F6962"/><polygon points="-5,-17 0,-25 5,-17 2,-15 -1,-16.5" fill="#F4F1EA"/></g>`;}
function tuft(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-5 0 L-6 -7 M0 0 L0 -9 M5 0 L6 -7" stroke="#3F7D3B" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="0" cy="-10.5" r="1.8" fill="#E85D4A"/></g>`;}
function hill(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><ellipse rx="18" ry="9" cy="-3" fill="#B98A4E" stroke="${INK}" stroke-width=".8"/><path d="M-12 -6 Q0 -14 12 -6" stroke="#946B35" stroke-width="1.4" fill="none"/></g>`;}
function furrow(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})" stroke="#AE9F55" stroke-width="1.6" stroke-linecap="round"><path d="M-14 -2 L14 -2 M-14 3 L14 3 M-14 8 L14 8" fill="none"/></g>`;}
function reed(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})" stroke="#3F7D3B" stroke-width="1.4" stroke-linecap="round"><path d="M-3 0 L-4 -9 M0 0 L0 -11 M3 0 L4 -9" fill="none"/><ellipse cx="0" cy="-11.5" rx="1.4" ry="2.4" fill="#6B4528" stroke="none"/></g>`;}
function house(x,y,roof,wall,w=15){
  const h=w*0.62;
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.5" rx="${w*0.62}" ry="2.4" fill="rgba(0,0,0,.22)"/><rect x="${-w/2}" y="${-h}" width="${w}" height="${h}" fill="${wall}" stroke="${INK}" stroke-width=".8"/><polygon points="${-w/2-2.4},${-h} 0,${-h-w*0.62} ${w/2+2.4},${-h}" fill="${roof}" stroke="${INK}" stroke-width=".9"/><rect x="${-w*0.12}" y="${-h*0.62}" width="${w*0.24}" height="${h*0.62}" fill="#6B4528"/><rect x="${w*0.22}" y="${-h*0.8}" width="${w*0.18}" height="${w*0.18}" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/></g>`;
}
function church(x,y,roof){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="2" rx="17" ry="4" fill="rgba(0,0,0,.25)"/><rect x="-16" y="-12" width="19" height="12" fill="#EFE7D2" stroke="${INK}" stroke-width=".9"/><polygon points="-18.5,-12 -6.5,-22 5.5,-12" fill="${roof}" stroke="${INK}" stroke-width=".9"/><rect x="2" y="-30" width="9" height="30" fill="#F3EEDF" stroke="${INK}" stroke-width=".9"/><polygon points="0.5,-30 6.5,-47 12.5,-30" fill="#3F5560" stroke="${INK}" stroke-width=".9"/><path d="M6.5 -47 L6.5 -54 M3.5 -51 L9.5 -51" stroke="${INK}" stroke-width="1.3"/><rect x="4.5" y="-24" width="4" height="7" rx="2" fill="#3F5560"/><rect x="-11" y="-9" width="3.5" height="6" rx="1.7" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/><rect x="-5" y="-9" width="3.5" height="6" rx="1.7" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/></g>`;
}
function tent(x,y,cloth){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.5" rx="13" ry="3" fill="rgba(0,0,0,.22)"/><polygon points="-13,0 0,-22 13,0" fill="${cloth}" stroke="${INK}" stroke-width=".9"/><polygon points="0,-22 13,0 5,0" fill="rgba(0,0,0,.18)"/><polygon points="-3.6,0 0,-9 3.6,0" fill="#3a2418"/><path d="M0 -22 L0 -28" stroke="${INK}" stroke-width="1"/><polygon points="0,-28 7,-26 0,-24" fill="#C8452F"/></g>`;
}
function totem(x,y){return `<g transform="translate(${x},${y})"><rect x="-3" y="-22" width="6" height="22" fill="#6B4528" stroke="${INK}" stroke-width=".7"/><rect x="-6" y="-17" width="12" height="3" fill="#C8452F"/><circle cx="0" cy="-24" r="3.4" fill="#E9C46A" stroke="${INK}" stroke-width=".7"/></g>`;}
function person(x,y,col,sold){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.4" rx="3.4" ry="1.1" fill="rgba(0,0,0,.28)"/><path d="M-2.8 0 L-1.8 -5.4 L1.8 -5.4 L2.8 0 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/><circle cx="0" cy="-7.6" r="2.3" fill="#F2CDA3" stroke="${INK}" stroke-width=".6"/>${sold?`<path d="M-2.5 -8.2 A2.5 2.5 0 0 1 2.5 -8.2 Z" fill="#6B7479" stroke="${INK}" stroke-width=".4"/><line x1="4.4" y1="1" x2="4.4" y2="-12" stroke="#3a2a20" stroke-width=".9"/><path d="M4.4 -12 l-1.1 2.4 h2.2 z" fill="#d8d8d8"/>`:''}</g>`;
}
function iconCiv(x,y,col){return `<g transform="translate(${x},${y})"><circle cx="0" cy="-3.6" r="2.3" fill="#F2CDA3" stroke="${INK}" stroke-width=".6"/><path d="M-3.2 3 L-2.2 -1.2 L2.2 -1.2 L3.2 3 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/></g>`;}
function iconSol(x,y,col){return `<g transform="translate(${x},${y})"><path d="M-3 -3.4 A3 3 0 0 1 3 -3.4 Z" fill="#6B7479" stroke="${INK}" stroke-width=".6"/><path d="M-3.2 3 L-2.2 -2.6 L2.2 -2.6 L3.2 3 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/><line x1="5" y1="3" x2="5" y2="-7" stroke="#3a2a20" stroke-width=".9"/></g>`;}

const ANCH_EDGE=[[-36,-1],[36,-1],[0,-21]];
const ANCH_FREE=[[-28,-6],[26,-8],[-4,-16],[-12,8],[24,7]];
function decor(terr,anchors,n){
  let s=''; const A=anchors.slice(0,n);
  A.forEach(([x,y],i)=>{
    const sc=0.85+((i*37)%5)/20;
    if(terr==='mon') s+=peak(x,y+4,sc);
    else if(terr==='pra') s+=tuft(x,y+3,sc)+tuft(x+9,y+7,0.8);
    else if(terr==='bos') s+=tree(x,y+4,sc);
    else if(terr==='rio') s+=reed(x,y+3,sc);
    else if(terr==='col') s+=hill(x,y+5,sc);
    else s+=furrow(x,y+1,sc);
  });
  return s;
}
function riverBase(){
  return `<g clip-path="url(#dia)"><path d="M-70,-4 C-38,-24 -14,12 18,-2 S56,-16 70,8" stroke="#3C86A2" stroke-width="19" fill="none" stroke-linecap="round"/><path d="M-70,-4 C-38,-24 -14,12 18,-2 S56,-16 70,8" stroke="#5BA6C0" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M-50,-7 q6,-4 12,0 M-12,2 q6,-4 12,0 M24,-6 q6,-4 12,0" stroke="#E9F4F7" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}
