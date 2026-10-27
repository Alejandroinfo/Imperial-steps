'use strict';
// Pueblo vivo: cada persona dibujada en el mapa tiene su propia rutina según su oficio.
// Es solo apariencia (la capa de interfaz): no cambia nada del juego ni se guarda en la partida.
//
// Cómo funciona:
//  - figRows() (dibujo/figuras.js) dibuja a cada persona dentro de un grupo «.pp» con su posición de partida
//    y registra el «escenario» de la zona (casas, edificios, campo, pila de leña, blanco de tiro, obra) en LIFE_STAGE.
//  - Cada persona tiene un estado propio (LIFE.st[id]) con una cola de pasos: ir a un lugar, hacer algo, esconderse
//    en su casa o decir algo. Cuando la cola se vacía, «piensa» y elige una actividad de su oficio al azar, con
//    pesos distintos, sin repetir la anterior y con un temperamento propio (más rápida, más perezosa...).
//  - Caminar es una transición CSS de transform (barata); las animaciones de trabajo son clases CSS (estilos.css, «pueblo vivo»).
//  - Si la zona se vuelve a dibujar (cambió algo), cada persona sigue donde estaba (lifeBind).
//  - Solo se mueven las zonas que se ven en pantalla; con el mapa alejado, con efectos apagados o con la pestaña oculta, no se hace nada.

const LIFE = {on:true, st:{}, figs:{}, iv:null, sortAt:0};
const LIFE_STAGE = {};      // escenario por zona (zona → {houses, bld, anchor, field, pile, target, site, blocks, builders, conflict})
const LIFE_SPEED = 21;      // unidades de mapa por segundo (caminando)
const LIFE_NS = 'http://www.w3.org/2000/svg';
const lrr = (a,b) => a + Math.random()*(b-a);
const lone = arr => arr[Math.floor(Math.random()*arr.length)];

/* ---------- lugares ---------- */
function lifeWalkable(zid,stg,x,y){
  const P = WORLD.poly[zid]; if(!P) return true;
  if(!ptIn(P,x*1.12,y*1.12)) return false;
  if(y < -34 || y > 182) return false;
  for(const b of (stg.blocks||[])) if(x>b[0]&&x<b[2]&&y>b[1]&&y<b[3]) return false;
  return true;
}
// Un punto libre cerca de (cx,cy), a lo sumo a r de distancia.
function lifePlace(zid,stg,cx,cy,r){
  for(let k=0;k<14;k++){ const a=Math.random()*6.283, d=Math.sqrt(Math.random())*r; const x=cx+Math.cos(a)*d, y=cy+Math.sin(a)*d*0.7; if(lifeWalkable(zid,stg,x,y)) return [x,y]; }
  return [cx,cy];
}

/* ---------- cosas que se llevan en las manos ---------- */
const LIFE_PROPS = {
  sack:`<ellipse cx="-2" cy="-22" rx="6.5" ry="4.8" fill="#C4A06C" stroke="${INK}" stroke-width=".8"/><path d="M-5,-25.5 q3,-3.2 6,0" fill="none" stroke="${INK}" stroke-width=".8"/>`,
  log:`<rect x="-9" y="-22.5" width="19" height="5" rx="2.2" fill="#8A5A3A" stroke="${INK}" stroke-width=".8"/><circle cx="10" cy="-20" r="2.5" fill="#C99A62" stroke="${INK}" stroke-width=".6"/>`,
  crate:`<rect x="-6" y="-24" width="12" height="9" fill="#B5844E" stroke="${INK}" stroke-width=".8"/><path d="M-6,-19.5 H6 M0,-24 V-15" stroke="#7A4B2A" stroke-width=".8"/>`,
  book:`<rect x="3" y="-13" width="8" height="6" rx="1" fill="#4A7FC0" stroke="${INK}" stroke-width=".7"/><rect x="4" y="-12" width="6" height="4" fill="#F3EEDF"/>`,
  coin:`<circle cx="7" cy="-14" r="3.3" fill="#E9C46A" stroke="${INK}" stroke-width=".7"/><text x="7" y="-12.6" text-anchor="middle" font-size="4.6" font-weight="700" fill="#8A6A10" class="zt">$</text>`,
  stone:`<path d="M-6,-19 L-4,-24 L2,-26 L7,-22 L6,-17 Z" fill="#9A9285" stroke="${INK}" stroke-width=".8"/>`
};

/* ---------- efectos cortos (polvo, chispas, globos de diálogo) ---------- */
const LIFE_FX = {
  dust:()=>`<circle class="pfx-dust" cx="${f1(lrr(-9,9))}" cy="-1" r="2.6" fill="#E8DCC0" stroke="rgba(42,27,22,.35)" stroke-width=".5"/>`,
  dirt:()=>`<circle class="pfx-dust" cx="${f1(lrr(2,12))}" cy="-2" r="1.7" fill="#8C6A3E"/><circle class="pfx-dust" cx="${f1(lrr(2,12))}" cy="-3" r="1.3" fill="#6B4528" style="animation-delay:.12s"/>`,
  spark:()=>`<path class="pfx-spark" d="M9,-9 l1.6,-3.6 l1.6,3.6 l3.6,1.6 l-3.6,1.6 l-1.6,3.6 l-1.6,-3.6 l-3.6,-1.6 z" fill="#FFD36B" stroke="#C97A3A" stroke-width=".5"/>`,
  clash:()=>`<path class="pfx-spark" d="M${f1(lrr(6,12))},-12 l1.8,-4 l1.8,4 l4,1.8 l-4,1.8 l-1.8,4 l-1.8,-4 l-4,-1.8 z" fill="#FFFFFF" stroke="#C8452F" stroke-width=".7"/>`,
  coin:()=>`<g class="pfx-rise"><circle cx="${f1(lrr(-6,8))}" cy="-26" r="3.2" fill="#E9C46A" stroke="${INK}" stroke-width=".7"/><text x="0" y="0" font-size="0"></text></g>`,
  arrow:()=>`<g class="pfx-arrow"><line x1="8" y1="-9" x2="17" y2="-9" stroke="#3a2a20" stroke-width="1.2"/><path d="M17,-9 l-2.6,-1.6 v3.2 z" fill="#d8d8d8"/></g>`,
  zz:()=>bubbleSVG('💤')
};
function bubbleSVG(g){
  return `<g class="pfx-bub" transform="translate(0,-34)"><path d="M-9,-8 h18 a4,4 0 0 1 4,4 v7 a4,4 0 0 1 -4,4 h-9 l-4,4 v-4 h-5 a4,4 0 0 1 -4,-4 v-7 a4,4 0 0 1 4,-4 z" fill="#FBF8F2" stroke="${INK}" stroke-width="1"/><text x="0" y="3.2" text-anchor="middle" font-size="9.5" class="zt">${g}</text></g>`;
}
function lifeFx(pp,kind,arg){
  const L=pp.querySelector('.fx'); if(!L||L.childNodes.length>5) return;
  const g=document.createElementNS(LIFE_NS,'g'); const src=kind==='bub'?bubbleSVG(arg):(LIFE_FX[kind]?LIFE_FX[kind]():''); if(!src) return;
  g.innerHTML=src; L.appendChild(g); setTimeout(()=>{ if(g.parentNode) g.parentNode.removeChild(g); },kind==='bub'?2400:1300);
}

/* ---------- actividades por oficio: [nombre, peso, condición opcional] ---------- */
const LIFE_ACTS = {
  pob:[['pasear',3],['charlar',2.2],['casa',1.4,s=>s.houses.length>0],['sentarse',1.3],['mirar',1],['obra',5,(s,u)=>s.builders.pob&&!!s.site]],
  agr:[['cultivar',4.5],['llevar',2.4],['descansar',1.1],['charlar',.7],['mirar',.5]],
  ing:[['martillar',3.2],['acarrear',2.6],['obra',5,(s)=>s.builders.ing&&!!s.site],['descansar',1],['mirar',.6]],
  cie:[['leer',3],['probeta',2.2],['pasear',1.5],['idea',1.1],['charlar',.6]],
  com:[['atender',3.2],['pregonar',1.8],['pasear',1.2],['contar',1.2],['charlar',.8]],
  sol:[['entrenar',3],['patrullar',2],['guardia',1.6],['descansar',.9]],
  esc:[['guardia',3],['patrullar',2],['entrenar',1.6],['descansar',.9]],
  ber:[['entrenar',3.4],['furia',1.2],['patrullar',1.2],['descansar',.8]],
  arq:[['tirar',3.2],['patrullar',1.5],['guardia',1],['descansar',.9]],
  cab:[['trotar',3],['guardia',1.2],['descansar',1.1]],
  ari:[['rodar',1]],
  lan:[['quieto',1]]
};
const LIFE_MIL = ['sol','esc','ber','arq','cab'];

// pasos: ir, hacer, esconderse en casa
const L_go=(p,o)=>Object.assign({k:'go',x:p[0],y:p[1]},o||{});
const L_do=(cls,dur,o)=>Object.assign({k:'do',cls:cls||'',dur},o||{});

function lifePartner(zid,s,maxD,pred){
  const L=(LIFE.figs[zid]||[]).filter(f=>f.s!==s&&!f.s.busy&&f.s.q.length===0&&pred(f)&&Math.hypot(f.s.x-s.x,f.s.y-s.y)<maxD);
  return L.length?lone(L):null;
}
const LIFE_ACT = {
  pasear:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,lrr(40,95))),L_do('',lrr(1,3))); },
  mirar:(zid,pp,s,g)=>{ s.q.push(L_do('',lrr(.8,1.4),{face:-1}),L_do('',lrr(.8,1.6),{face:1}),L_do('',lrr(.6,1.2),{face:-1})); },
  sentarse:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,50)),L_do('sit',lrr(4,9),{fx:'zz',fxEvery:[10,18]})); },
  descansar:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,40)),L_do('sit',lrr(4,8))); },
  casa:(zid,pp,s,g)=>{ const h=lone(g.houses); s.q.push(L_go([h[0]+lrr(-3,3),h[1]+7]),{k:'hide',dur:lrr(3,7)},L_do('',.4),L_go(lifePlace(zid,g,h[0],h[1]+14,26))); },
  charlar:(zid,pp,s,g)=>{
    const p=lifePartner(zid,s,150,f=>!LIFE_MIL.includes(f.pp.dataset.t)||LIFE_MIL.includes(pp.dataset.t));
    if(!p){ LIFE_ACT.pasear(zid,pp,s,g); return; }
    const m=lifePlace(zid,g,(s.x+p.s.x)/2,(s.y+p.s.y)/2,24); const d=lrr(4,8);
    s.q.push(L_go([m[0]-7,m[1]]),L_do('',d,{face:1,fx:'bub',fxArg:['💬','💬','❓','♪','😄'],fxEvery:[1.4,2.4]}));
    p.s.q=[L_go([m[0]+7,m[1]]),L_do('',d,{face:-1,fx:'bub',fxArg:['💬','❗','😄','…'],fxEvery:[1.6,2.8]})]; p.s.busy=0; p.s.until=0;
  },
  obra:(zid,pp,s,g)=>{ const q=g.site; s.q.push(L_go(lifePlace(zid,g,q[0],q[1]+34,26)),L_do('work',lrr(5,10),{fx:'dust',fxEvery:[.5,1],face:0})); },
  cultivar:(zid,pp,s,g)=>{ const f=g.field||[s.x-20,s.y-10,40,20]; const p=[f[0]+lrr(6,f[2]-6),f[1]+lrr(6,f[3]-6)]; s.q.push(L_go(p),L_do('work',lrr(6,12),{fx:'dirt',fxEvery:[.8,1.5]})); },
  llevar:(zid,pp,s,g)=>{
    const f=g.field||[s.x-20,s.y,40,20]; const p=[f[0]+lrr(6,f[2]-6),f[1]+lrr(6,f[3]-6)]; const m=g.bld.molino; const dest=m?[m[0]+lrr(-8,8),m[1]+10]:(g.houses.length?[lone(g.houses)[0],lone(g.houses)[1]+7]:lifePlace(zid,g,s.x,s.y,50));
    s.q.push(L_go(p),L_do('work',lrr(2,3.5),{fx:'dirt',fxEvery:[.7,1]}),L_do('',.3,{prop:'sack'}),L_go(dest),L_do('',lrr(.8,1.4),{prop:''}),L_go(lifePlace(zid,g,p[0],p[1],18)));
  },
  martillar:(zid,pp,s,g)=>{ const b=g.bld.taller; const p=b?[b[0]+lrr(-16,16),b[1]+lrr(14,24)]:lifePlace(zid,g,s.x,s.y,40); s.q.push(L_go(p),L_do('work',lrr(5,9),{fx:'spark',fxEvery:[.5,1.1],face:1})); },
  acarrear:(zid,pp,s,g)=>{
    const pile=g.pile||lifePlace(zid,g,s.x,s.y,50); const b=g.bld.taller; const dest=b?[b[0]+lrr(-10,10),b[1]+12]:lifePlace(zid,g,pile[0],pile[1],60); const prop=Math.random()<.4?'stone':'log';
    for(let k=0;k<(Math.random()<.5?2:1);k++) s.q.push(L_go([pile[0]+lrr(-5,5),pile[1]+6]),L_do('',.5,{prop}),L_go(dest),L_do('',.6,{prop:'',fx:'dust'}));
  },
  leer:(zid,pp,s,g)=>{ const b=g.bld.biblio; const p=b?[b[0]+lrr(-14,14),b[1]+lrr(14,24)]:lifePlace(zid,g,s.x,s.y,40); s.q.push(L_go(p),L_do('sit',lrr(6,12),{prop:'book',face:1}),L_do('',.2,{prop:''})); },
  probeta:(zid,pp,s,g)=>{ const b=g.bld.biblio; const p=b?[b[0]+lrr(-18,18),b[1]+lrr(14,26)]:lifePlace(zid,g,s.x,s.y,40); s.q.push(L_go(p),L_do('work',lrr(4,8))); },
  idea:(zid,pp,s,g)=>{ s.q.push(L_do('hop',1.1,{fx:'bub',fxArg:['💡'],fxEvery:[.1,.2],once:1}),L_do('',lrr(.6,1.4))); },
  atender:(zid,pp,s,g)=>{ const b=g.bld.mercado; const p=b?[b[0]+lrr(-14,14),b[1]+lrr(12,20)]:lifePlace(zid,g,s.x,s.y,40); s.q.push(L_go(p),L_do('work',lrr(5,10),{fx:'coin',fxEvery:[1.1,2],face:0})); },
  pregonar:(zid,pp,s,g)=>{ const b=g.bld.mercado; const p=b?[b[0]+lrr(-30,30),b[1]+lrr(18,30)]:lifePlace(zid,g,s.x,s.y,40); s.q.push(L_go(p),L_do('hop',2.4,{fx:'bub',fxArg:['❗','📣'],fxEvery:[.8,1.2]}),L_do('',lrr(.5,1.2))); },
  contar:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,36)),L_do('sit',lrr(3,6),{prop:'coin',fx:'coin',fxEvery:[1,1.6]}),L_do('',.2,{prop:''})); },
  entrenar:(zid,pp,s,g)=>{
    const p=lifePartner(zid,s,170,f=>LIFE_MIL.includes(f.pp.dataset.t)&&f.pp.dataset.t!=='arq');
    const home=g.bld.cuartel?[g.bld.cuartel[0],g.bld.cuartel[1]+38]:[s.x,s.y]; const m=lifePlace(zid,g,home[0],home[1],40); const d=lrr(6,12);
    if(!p){ const t=g.target?[g.target[0]-14,g.target[1]+4]:m; s.q.push(L_go(t),L_do('fight',d,{fx:'clash',fxEvery:[.5,.9],face:1})); return; }
    s.q.push(L_go([m[0]-8,m[1]]),L_do('fight',d,{fx:'clash',fxEvery:[.45,.9],face:1}));
    p.s.q=[L_go([m[0]+8,m[1]]),L_do('fight fightb',d,{face:-1})]; p.s.busy=0; p.s.until=0;
  },
  furia:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,30)),L_do('fight',lrr(3,5),{fx:'dust',fxEvery:[.5,.8]})); },
  patrullar:(zid,pp,s,g)=>{ const n=Math.random()<.5?2:3; for(let k=0;k<n;k++) s.q.push(L_go(lifePlace(zid,g,lrr(-110,110),lrr(40,150),30)),L_do('guard',lrr(.6,1.4),{face:k%2?-1:1})); },
  guardia:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,40)),L_do('guard',lrr(6,12),{face:1}),L_do('guard',lrr(1,2),{face:-1})); },
  tirar:(zid,pp,s,g)=>{ const t=g.target||[s.x+70,s.y]; const p=[t[0]-lrr(46,62),t[1]+lrr(-3,3)]; s.q.push(L_go(lifeWalkable(zid,g,p[0],p[1])?p:lifePlace(zid,g,s.x,s.y,40)),L_do('shoot',lrr(6,11),{fx:'arrow',fxEvery:[1.1,1.7],face:1})); },
  trotar:(zid,pp,s,g)=>{ const n=3; for(let k=0;k<n;k++) s.q.push(L_go(lifePlace(zid,g,lrr(-120,120),lrr(40,150),30),{run:1}),L_do('',.15,{fx:'dust'})); s.q.push(L_do('',lrr(1,2.5))); },
  rodar:(zid,pp,s,g)=>{ s.q.push(L_go(lifePlace(zid,g,s.x,s.y,26),{sp:7}),L_do('',lrr(4,9))); },
  quieto:(zid,pp,s,g)=>{ s.q.push(L_do('',lrr(5,10))); }
};
function lifeWeighted(list){ let t=0; list.forEach(a=>{ t+=a[1]; }); let r=Math.random()*t; for(const a of list){ r-=a[1]; if(r<=0) return a; } return list[list.length-1]; }
function lifeThink(zid,pp,s){
  const g=LIFE_STAGE[zid]; if(!g) return;
  const t=pp.dataset.t; let acts=LIFE_ACTS[t]||LIFE_ACTS.pob;
  if(g.conflict&&LIFE_MIL.includes(t)){ LIFE_ACT.furia(zid,pp,s,g); return; }
  const ok=acts.filter(a=>a[0]!==s.last&&(!a[2]||a[2](g,s)));
  const pool=ok.length?ok:acts; const a=lifeWeighted(pool.map(x=>[x[0],x[1]*(s.lazy&&(x[0]==='descansar'||x[0]==='sentarse'||x[0]==='mirar')?1.8:1)]));
  s.last=a[0]; LIFE_ACT[a[0]](zid,pp,s,g);
  if(s.hung&&Math.random()<.35) s.q.unshift({k:'say',g:'🍞',dur:1200});
}

/* ---------- ejecutar un paso ---------- */
function lifeCls(pp,s,extra){ pp.setAttribute('class','pp'+(extra?' '+extra:'')+(s.hung?' slump':'')+(s.hurt?' hurt':'')); s.cls=extra||''; }
function lifeFace(pp,s,dx){ if(Math.abs(dx)<1) return; const fl=dx<0; if(fl===!!s.flip) return; s.flip=fl; const e=pp.querySelector('.fl'); if(e) e.setAttribute('transform',fl?'scale(-1,1)':''); }
function lifeProp(pp,s,name){ s.prop=name||''; const e=pp.querySelector('.prop'); if(e) e.innerHTML=name?LIFE_PROPS[name]||'':''; }
function lifeRun(zid,pp,s,now){
  let st=s.q.shift();
  if(!st){ lifeThink(zid,pp,s); st=s.q.shift(); if(!st){ s.until=now+1200; return; } }
  s.busy=0; s.fx=null;
  switch(st.k){
    case 'go': {
      const dx=st.x-s.x, dy=st.y-s.y, d=Math.hypot(dx,dy); const sp=(st.sp||LIFE_SPEED*(st.run?1.9:1))*s.spd*(s.hurt?0.55:1)*(s.hung?0.8:1); const dur=Math.max(0.12,d/sp);
      lifeCls(pp,s,'walk'+(st.run?' run':'')); lifeFace(pp,s,dx);
      s.from=[s.x,s.y]; s.t0=now; s.dur=dur*1000; s.x=st.x; s.y=st.y; s.until=now+s.dur;
      pp.style.transition='transform '+dur.toFixed(2)+'s linear'; pp.style.transform='translate('+f1(st.x)+'px,'+f1(st.y)+'px)'; break; }
    case 'do': {
      lifeCls(pp,s,st.cls); if(st.face) lifeFace(pp,s,st.face); if(st.prop!==undefined) lifeProp(pp,s,st.prop);
      s.until=now+st.dur*1000; s.from=null;
      if(st.fx){ s.fx=st; s.fxAt=now+lrr(250,700); if(st.once){ lifeFx(pp,st.fx,lone(st.fxArg||[''])); s.fx=null; } } break; }
    case 'hide': lifeCls(pp,s,'in'); s.until=now+st.dur*1000; s.busy=1; s.from=null; break;
    case 'say': lifeFx(pp,'bub',st.g); s.until=now+(st.dur||800); s.from=null; break;
  }
}

/* ---------- reloj ---------- */
function lifeActive(){ return !!(LIFE.on&&G&&ui&&ui.view==='terr'&&!document.hidden&&(typeof FXS==='undefined'||FXS.on)&&!CAM.far&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
function lifeInView(i){ const x=sx(i), y=sy(i), m=320; return x>VIEW.x-m&&x<VIEW.x+VIEW.w+m&&y>VIEW.y-m&&y<VIEW.y+VIEW.h+m; }
function lifeTick(){
  if(!lifeActive()) return; const now=performance.now(); let sort=now>LIFE.sortAt; if(sort) LIFE.sortAt=now+900;
  Object.keys(LIFE.figs).forEach(k=>{
    const zid=Number(k); if(!lifeInView(zid)) return; const L=LIFE.figs[k];
    for(const f of L){
      const {pp,s}=f; if(!pp.isConnected) continue;
      if(now>=s.until){ if(s.cls==='in') lifeCls(pp,s,''); lifeRun(zid,pp,s,now); }
      else if(s.fx&&now>=s.fxAt){ const x=s.fx; lifeFx(pp,x.fx,x.fx==='bub'?lone(x.fxArg||['💬']):undefined); const e=x.fxEvery||[1,2]; s.fxAt=now+lrr(e[0],e[1])*1000; }
      else if(!s.fx&&!s.q.length&&s.cls==='sit'&&s.hung===0&&Math.random()<.004) lifeFx(pp,'zz');
    }
    if(sort&&L.length>1){ const par=L[0].pp.parentNode; if(par){ const by=L.filter(f=>f.pp.parentNode===par).map(f=>[lifeCurY(f.s,now),f.pp]).sort((a,b)=>a[0]-b[0]); let changed=false; const cur=Array.from(par.children).filter(c=>c.classList.contains('pp')); by.forEach((e,i)=>{ if(cur[i]!==e[1]) changed=true; }); if(changed) by.forEach(e=>par.appendChild(e[1])); } }
  });
}
function lifeCurY(s,now){ if(s.from&&now<s.t0+s.dur){ const k=(now-s.t0)/s.dur; return s.from[1]+(s.y-s.from[1])*k; } return s.y; }
function lifeCurX(s,now){ if(s.from&&now<s.t0+s.dur){ const k=(now-s.t0)/s.dur; return s.from[0]+(s.x-s.from[0])*k; } return s.x; }

/* ---------- después de volver a dibujar una zona: cada persona sigue donde estaba ---------- */
function lifeBind(zid,dyn){
  const now=performance.now(); const figs=[]; const seen={};
  dyn.querySelectorAll('.pp').forEach(pp=>{
    const uid=pp.dataset.u; const hx=Number(pp.dataset.hx), hy=Number(pp.dataset.hy); seen[uid]=1;
    let s=LIFE.st[uid];
    const hung=pp.dataset.hg==='1', hurt=pp.dataset.w==='1';
    if(!s||s.z!==zid){
      const seed=(Number(uid)*2654435761%1000)/1000;
      s=LIFE.st[uid]={z:zid,x:hx,y:hy,q:[],until:now+lrr(150,4500),spd:0.8+seed*0.5,lazy:seed>0.7,last:'',flip:false,cls:'',prop:'',busy:0,fx:null,from:null,t0:0,dur:0,hung:hung?1:0,hurt:hurt?1:0};
      pp.style.transform='translate('+f1(hx)+'px,'+f1(hy)+'px)'; lifeCls(pp,s,'');
    } else {
      s.hung=hung?1:0; s.hurt=hurt?1:0;
      const cx=lifeCurX(s,now), cy=lifeCurY(s,now);
      pp.style.transition='none'; pp.style.transform='translate('+f1(cx)+'px,'+f1(cy)+'px)';
      lifeCls(pp,s,s.cls); if(s.flip){ const e=pp.querySelector('.fl'); if(e) e.setAttribute('transform','scale(-1,1)'); } if(s.prop) lifeProp(pp,s,s.prop);
      if(s.from&&now<s.t0+s.dur){ const rest=(s.t0+s.dur-now)/1000; void pp.getBoundingClientRect(); pp.style.transition='transform '+rest.toFixed(2)+'s linear'; pp.style.transform='translate('+f1(s.x)+'px,'+f1(s.y)+'px)'; }
    }
    figs.push({pp,s});
  });
  LIFE.figs[zid]=figs;
}
function lifeStart(){ if(LIFE.iv) return; LIFE.iv=setInterval(lifeTick,260); }
function lifeReset(){ LIFE.st={}; LIFE.figs={}; Object.keys(LIFE_STAGE).forEach(k=>delete LIFE_STAGE[k]); }
