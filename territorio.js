'use strict';
// Vista de territorio: dibujo del mapa, placas, flechas de órdenes, cámara, minimapa y mouse/teclado.

// El mundo estático se dibuja UNA vez por partida.
// Cada zona se vuelve a dibujar solo si cambió su "firma".
// Seleccionar o resaltar solo cambia clases CSS.
// Mover o acercar la cámara es una transformación CSS (sin redibujar).
const WORLD = {ws:1,R:172,site:[],poly:[],decor:[],bounds:null,roads:[],W:1,H:1};
const VIEW = {x:0,y:0,w:900,h:600,ratio:0.66,minW:380,maxW:4200,anim:null,edge:false};
const CAM = {k:1,inv:1,far:false,vw:900,vh:600,reT:0};
let ZG = [];
function ptIn(poly,x,y){ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const a=poly[i],b=poly[j]; if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])) c=!c; } return c; }
function clipHalf(poly,s,t){
  const mx=(s[0]+t[0])/2,my=(s[1]+t[1])/2,nx=t[0]-s[0],ny=t[1]-s[1]; const d=p=>(p[0]-mx)*nx+(p[1]-my)*ny; const out=[];
  for(let i=0;i<poly.length;i++){ const a=poly[i],b=poly[(i+1)%poly.length],da=d(a),db=d(b);
    if(da<=0) out.push(a);
    if((da<0&&db>0)||(da>0&&db<0)){ const k=da/(da-db); out.push([a[0]+k*(b[0]-a[0]),a[1]+k*(b[1]-a[1])]); } }
  return out;
}
function buildWorld(){
  const Z=G.zones; let dmin=9;
  for(let i=0;i<Z.length;i++) for(let j=i+1;j<Z.length;j++){ const d=Math.hypot(Z[i].x-Z[j].x,Z[i].y-Z[j].y); if(d<dmin) dmin=d; }
  const ws=Math.max(950,290/dmin); WORLD.ws=ws; const R=WORLD.R=172;
  WORLD.site=Z.map(z=>[z.x*ws,z.y*ws]);
  WORLD.poly=Z.map((z,i)=>{
    const rnd=mulberry32(77+i*31+(G.seed%1009)); const n=18; let poly=[];
    for(let k=0;k<n;k++){ const a=2*Math.PI*k/n; const rr=R*(0.93+0.1*rnd()); poly.push([WORLD.site[i][0]+rr*Math.cos(a),WORLD.site[i][1]+rr*Math.sin(a)]); }
    Z.forEach((o,j)=>{ if(j===i) return; if(Math.hypot(WORLD.site[i][0]-WORLD.site[j][0],WORLD.site[i][1]-WORLD.site[j][1])>2*R*1.15) return; poly=clipHalf(poly,WORLD.site[i],WORLD.site[j]); });
    return poly.map(p=>[p[0]-WORLD.site[i][0],p[1]-WORLD.site[i][1]]);
  });
  WORLD.decor=Z.map((z,i)=>{
    const rnd=mulberry32(500+i*13+(G.seed%997)); const poly=WORLD.poly[i]; const items=[];
    const cfg={bos:{n:15,t:'tree'},mon:{n:8,t:'peak'},pra:{n:20,t:'tuft'},col:{n:9,t:'hill'},lla:{n:9,t:'furrow'},rio:{n:9,t:'reed'}}[z.terrain];
    let tries=0; while(items.length<cfg.n&&tries<400){ tries++; const x=(rnd()*2-1)*R, y=(rnd()*2-1)*R; if(!ptIn(poly,x,y)) continue; if(Math.hypot(x,y)<62) continue; if(y>96&&Math.abs(x)<110) continue;
      if(items.some(o=>Math.hypot(o.x-x,o.y-y)<(cfg.t==='peak'?52:cfg.t==='tuft'?20:32))) continue; items.push({t:cfg.t,x,y,s:(cfg.t==='peak'?1.7+rnd()*0.9:cfg.t==='tuft'?1.1+rnd()*0.5:1.3+rnd()*0.6)}); }
    return items.sort((a,b)=>a.y-b.y);
  });
  const xs=WORLD.site.map(s=>s[0]), ys=WORLD.site.map(s=>s[1]);
  WORLD.bounds={x0:Math.min(...xs)-R-260,y0:Math.min(...ys)-R-300,x1:Math.max(...xs)+R+260,y1:Math.max(...ys)+R+300};
  WORLD.W=Math.round(WORLD.bounds.x1-WORLD.bounds.x0); WORLD.H=Math.round(WORLD.bounds.y1-WORLD.bounds.y0);
  WORLD.roads=G.map.e.map(([a,b],k)=>{
    const A=WORLD.site[a],B=WORLD.site[b]; const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1; const r=mulberry32(900+k*7); const off=(r()*2-1)*0.07*L;
    const cx=(A[0]+B[0])/2-dy/L*off, cy=(A[1]+B[1])/2+dx/L*off;
    return {a,b,c:[cx,cy],d:`M${f1(A[0])},${f1(A[1])} Q${f1(cx)},${f1(cy)} ${f1(B[0])},${f1(B[1])}`};
  });
}
const sx=i=>WORLD.site[i][0], sy=i=>WORLD.site[i][1];
function roadOf(a,b){ const r=WORLD.roads.find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a)); if(!r) return null; return {r,rev:r.a!==a}; }
function qpt(A,C,B,t){ const u=1-t; return [u*u*A[0]+2*u*t*C[0]+t*t*B[0],u*u*A[1]+2*u*t*C[1]+t*t*B[1]]; }
function hopPts(a,b){ const f=roadOf(a,b); const A=WORLD.site[a],B=WORLD.site[b]; return {A,B,C:f?f.r.c:[(A[0]+B[0])/2,(A[1]+B[1])/2]}; }
function routeZones(a,b){ // camino más corto por el grafo
  if(a===b) return [a]; const prev={}; prev[a]=null; const q=[a];
  while(q.length){ const x=q.shift(); if(x===b) break; for(const y of G.zones[x].adj) if(!(y in prev)){ prev[y]=x; q.push(y); } }
  if(!(b in prev)) return [a,b]; const p=[]; let c=b; while(c!==null){ p.unshift(c); c=prev[c]; } return p;
}

/* ---------- emblemas de especialización ---------- */
const SPECC={agr:'#6FA83A',ing:'#C97A3A',con:'#8A8378',cie:'#4A7FC0',com:'#E0A21B',bas:'#B79A6A',tri:'#8A5A3A',free:'#9AA39C'};
const SPECL={agr:'Agrícola',ing:'Producción',con:'Industrial',cie:'Tecnología',com:'Comercial',bas:'Básica',tri:'Tribu',free:'Libre'};
function emblem(sp,r){
  const c=SPECC[sp]||SPECC.free; let g='';
  switch(sp){
    case 'agr': g='<path d="M-9,11 L-9,-6 M0,13 L0,-10 M9,11 L9,-6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="-9" cy="-9" rx="3" ry="5" fill="#fff"/><ellipse cx="0" cy="-13" rx="3" ry="5" fill="#fff"/><ellipse cx="9" cy="-9" rx="3" ry="5" fill="#fff"/>'; break;
    case 'ing': g='<circle r="7" fill="none" stroke="#fff" stroke-width="4.5"/><circle r="12" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4.6 4.6"/>'; break;
    case 'con': g='<rect x="-13" y="-10" width="12" height="7" fill="#fff"/><rect x="1" y="-10" width="12" height="7" fill="#fff"/><rect x="-6" y="-1" width="12" height="7" fill="#fff"/><rect x="-13" y="8" width="12" height="6" fill="#fff"/><rect x="1" y="8" width="12" height="6" fill="#fff"/>'; break;
    case 'cie': g='<path d="M-4,-13 h8 v8 l9,17 h-26 l9,-17 z" fill="#fff"/><circle cx="-1" cy="7" r="2.4" fill="#4A7FC0"/><circle cx="4" cy="3" r="1.8" fill="#4A7FC0"/>'; break;
    case 'com': g='<circle r="12" fill="#fff"/><text y="6" text-anchor="middle" font-size="17" font-weight="700" fill="#B07A10" class="zt">$</text>'; break;
    case 'tri': g='<polygon points="-13,12 0,-13 13,12" fill="#fff"/><polygon points="-4,12 0,2 4,12" fill="#8A5A3A"/>'; break;
    case 'free': g='<circle r="10" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 5"/>'; break;
    default: g='<path d="M-12,2 L0,-11 L12,2 v10 h-24 z" fill="#fff"/><rect x="-3" y="4" width="6" height="8" fill="#B79A6A"/>';
  }
  return `<g transform="scale(${r/24})"><circle r="24" fill="${c}" stroke="${INK}" stroke-width="3"/>${g}</g>`;
}
function zspec(z){
  if(z.owner===TRIBE) return {sp:'tri',lvl:0,lab:'Tribu '+({agr:'agrícola',ing:'de producción',com:'comercial',cie:'científica'})[z.tspec]};
  if(!isPl(z.owner)) return {sp:'free',lvl:0,lab:'Zona libre'};
  const s=zoneSpec(G,z,z.owner); const R=['','I','II','III'];
  return {sp:s.spec,lvl:s.lvl,lab:SPECL[s.spec]+(s.spec==='bas'?'':' '+R[s.lvl])};
}
function popOf(z){ let n=0; for(const f in z.units) n+=z.units[f].length; return n; }
function ownPop(z){ return isPl(z.owner)||z.owner===TRIBE?(z.units[z.owner]||[]).length:0; }

/* ---------- dibujo ---------- */
function terrDecor(it){
  if(it.t==='tree') return tree(it.x,it.y,it.s); if(it.t==='peak') return peak(it.x,it.y,it.s); if(it.t==='tuft') return tuft(it.x,it.y,it.s);
  if(it.t==='hill') return hill(it.x,it.y,it.s); if(it.t==='furrow') return furrow(it.x,it.y,it.s*1.3); return reed(it.x,it.y,it.s);
}
function ptsStr(poly,k){ return poly.map(p=>f1(p[0]*(k||1))+','+f1(p[1]*(k||1))).join(' '); }
function buildTerritoryDOM(){
  const Z=G.zones, B=WORLD.bounds; let h='';
  h+=`<defs><pattern id="wood" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#B98F63"/><circle cx="12" cy="14" r="1.6" fill="#A87E54"/><circle cx="42" cy="38" r="1.4" fill="#A87E54"/><circle cx="26" cy="50" r="1.2" fill="#C79F73"/></pattern>`;
  Z.forEach((z,i)=>{ h+=`<clipPath id="cp${i}"><polygon points="${ptsStr(WORLD.poly[i])}"/></clipPath>`; });
  h+=`</defs><rect x="${B.x0}" y="${B.y0}" width="${WORLD.W}" height="${WORLD.H}" fill="url(#wood)"/>`;
  for(let k=0;k<6;k++){ const r=mulberry32(300+k); const cx=B.x0+r()*WORLD.W, cy=B.y0+r()*WORLD.H; h+=`<g class="cloud" style="animation-delay:${-k*9}s"><ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${90+r()*60}" ry="26" fill="rgba(255,255,255,.14)"/><ellipse cx="${f1(cx+40)}" cy="${f1(cy-14)}" rx="60" ry="22" fill="rgba(255,255,255,.14)"/></g>`; }
  Z.forEach((z,i)=>{
    const T=TCOL[z.terrain];
    h+=`<g transform="translate(${f1(sx(i))},${f1(sy(i))})">`;
    h+=`<polygon points="${ptsStr(WORLD.poly[i])}" transform="translate(0,14)" fill="${SOIL}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
    h+=`<polygon points="${ptsStr(WORLD.poly[i])}" fill="${T}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    h+=`<g class="decor" clip-path="url(#cp${i})">`;
    if(z.terrain==='rio') h+=`<path class="water" d="M-190,-30 C-110,-95 -50,40 20,-10 S130,-90 190,10" stroke="#3C86A2" stroke-width="46" fill="none" stroke-linecap="round"/><path d="M-190,-30 C-110,-95 -50,40 20,-10 S130,-90 190,10" stroke="#5BA6C0" stroke-width="38" fill="none" stroke-linecap="round"/><path class="flow" d="M-170,-24 C-110,-80 -50,28 20,-8 S130,-76 170,6" stroke="#E9F4F7" stroke-width="2.4" fill="none" stroke-dasharray="8 16" stroke-linecap="round"/>`;
    WORLD.decor[i].forEach(it=>{ h+=terrDecor(it); });
    h+=`</g></g>`;
  });
  WORLD.roads.forEach(r=>{ h+=`<path d="${r.d}" stroke="#6B4528" stroke-width="20" fill="none" stroke-linecap="round"/>`; });
  WORLD.roads.forEach(r=>{ h+=`<path d="${r.d}" stroke="#E2C79B" stroke-width="13" fill="none" stroke-linecap="round"/><path d="${r.d}" stroke="#C9A878" stroke-width="2" fill="none" stroke-dasharray="10 12"/>`; });
  h+=`<g id="zonesT">`;
  [...Z.keys()].sort((a,b)=>sy(a)-sy(b)).forEach(i=>{
    h+=`<g class="zone" data-id="${i}" tabindex="0" role="button" transform="translate(${f1(sx(i))},${f1(sy(i))})"><polygon class="hit" points="${ptsStr(WORLD.poly[i])}" fill="transparent"/><g class="own"></g><g class="dyn"></g><g class="mvb" role="button" aria-label="Ir a esta zona" style="transform:translate(-120px,-60px) scale(var(--inv,1))"><circle r="27" fill="#2F8F4F" stroke="#fff" stroke-width="4"/><path d="M-11,2 H8 M1,-8 L11,2 L1,12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><text class="zt" y="-32" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" stroke="#2A1B16" stroke-width="3.5" paint-order="stroke">Ir</text></g>`
     +`<polygon class="ov ov-tgt march" points="${ptsStr(WORLD.poly[i],0.97)}" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round"/>`
     +`<polygon class="ov ov-mv" points="${ptsStr(WORLD.poly[i],0.98)}" fill="rgba(124,224,160,.16)" stroke="#7CE0A0" stroke-width="6" stroke-linejoin="round"/>`
     +`<polygon class="ov ov-sel selp" points="${ptsStr(WORLD.poly[i],0.985)}" fill="none" stroke="#FFE27A" stroke-width="7" stroke-linejoin="round"/></g>`;
  });
  h+=`</g>`;
  const svg=$('terr'); $('worldT').innerHTML=h;
  svg.setAttribute('viewBox',`${f1(B.x0)} ${f1(B.y0)} ${WORLD.W} ${WORLD.H}`); svg.setAttribute('width',WORLD.W); svg.setAttribute('height',WORLD.H);
  ZG=[]; document.querySelectorAll('#zonesT g.zone').forEach(g=>{ ZG[Number(g.dataset.id)]={g,own:g.querySelector('.own'),dyn:g.querySelector('.dyn'),sig:null}; });
  $('ordT').innerHTML=''; ui.ordSig='';
}
function zoneSig(z,i){
  let s=[z.owner,z.size,z.conflict?1:0,z.res||'',Math.floor(z.prog),z.stance].join('|');
  for(const f in z.units){ const us=z.units[f]; const by={}; us.forEach(u=>{ by[u.t]=(by[u.t]||0)+(u.w>0?0.01:1); }); s+='|u'+f+':'+Object.keys(by).sort().map(k=>k+by[k]).join(','); }
  if(isPl(z.owner)){ const sp=zoneSpec(G,z,z.owner); s+='|sp'+sp.spec+sp.lvl; }
  z.b.forEach(b=>{ s+='|b'+b.t+b.l+(b.s||''); }); z.proj.forEach(p=>{ s+='|p'+Math.round(100*(p.tot-p.left)/p.tot); });
  if(z.tspec) s+='|t'+z.tspec;
  return s+'|'+slotsOf(G,z);
}
function updateTerritory(){
  const Z=G.zones, sel=ui.sel!==null?Z[ui.sel]:null; const canMove=sel&&(sel.units[ME]||[]).length>0;
  Z.forEach((z,i)=>{
    const e=ZG[i]; if(!e) return; const sig=zoneSig(z,i);
    if(e.sig!==sig){
      e.sig=sig; e.dyn.innerHTML=zoneContent(z,i);
      e.own.innerHTML=isPl(z.owner)?`<polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="none" stroke="${PLN[z.owner].col}" stroke-width="6" stroke-linejoin="round" opacity=".95"/>`:(z.owner===TRIBE?`<polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="none" stroke="#5E3B24" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round"/>`:'');
      const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':'Zona libre';
      e.g.setAttribute('aria-label',`${zname(z)}, ${rn}, ${TERRN[z.terrain]}, dueño: ${z.owner===null?'sin dueño':PLN[z.owner].name}`);
    }
    e.g.classList.toggle('sel',!!sel&&sel.id===i);
    e.g.classList.toggle('tgt',!!canMove&&sel.adj.includes(i));
    e.g.classList.toggle('mvto',!!ui.mv&&ui.mv.to===i);
  });
  drawOrderPreview();
}
function zoneContent(z,i){
  const owner=z.owner; const roof=isPl(owner)?PLN[owner].col:(owner===TRIBE?PLN[TRIBE].col:'#8B7B6B'); const wall=WALLS[i%4];
  const fo=(owner!==null)?(z.units[owner]||[]):[]; const civ=fo.filter(u=>UT[u.t].civ).length;
  let d='';
  if(z.role==='capital'){ d+=`<g transform="scale(2.1)">${church(-6,6,roof)}</g><g transform="scale(1.6)">${house(-52,34,roof,wall,15)}${house(52,30,roof,WALLS[(i+1)%4],14)}</g>`; }
  else if(z.role==='tribu'){ const cloth=(owner===TRIBE||owner===null)?PLN[TRIBE].col:PLN[owner].col; d+=`<g transform="scale(1.7)">${tent(-30,12,cloth)}${tent(26,10,cloth)}${tent(-2,26,cloth)}${totem(0,-6)}</g><g transform="translate(0,52)"><ellipse rx="9" ry="4" fill="#3a2418"/><path class="flame" d="M-4,0 Q0,-18 4,0 Z" fill="#E8765F"/><path class="flame f2" d="M-2,0 Q0,-11 2,0 Z" fill="#FFE27A"/></g>`; }
  else if(isPl(owner)&&civ>0){ const hN=Math.min(5,Math.ceil(civ/2)); const P=[[-40,-4],[46,-8],[0,16],[-80,20],[84,16]]; d+=`<g transform="scale(1.7)">`; for(let k=0;k<hN;k++) d+=house(P[k][0]/1.7,P[k][1]/1.7,roof,WALLS[(i+k)%4],13); d+=`</g>`; }
  if(isPl(owner)){
    z.b.forEach((b,k)=>{ const p=SLOT_POS[k%SLOT_POS.length]; d+=`<g transform="translate(${p[0]},${p[1]}) scale(1.35)">${bGlyph(b.t,b.l,true)}</g>`; });
    z.proj.forEach((p,k)=>{ const sl=SLOT_POS[(z.b.length+k)%SLOT_POS.length]; const pc=Math.round(100*(p.tot-p.left)/p.tot); const nm=p.k==='b'?p.bt:p.k==='w'?'mar':(z.b[p.bi]?z.b[p.bi].t:'almacen'); d+=`<g transform="translate(${sl[0]},${sl[1]})"><g opacity=".38" transform="scale(1.35)">${bGlyph(nm,0,false)}</g><rect x="-28" y="-62" width="56" height="9" rx="4" fill="#2A1B16" stroke="#fff" stroke-width="1"/><rect x="-26" y="-60" width="${(52*pc/100).toFixed(1)}" height="5" rx="2.5" fill="#7CE0A0"/><text class="zt" x="0" y="-67" text-anchor="middle" font-size="12" font-weight="700" fill="#2A1B16" stroke="#fff" stroke-width="3" paint-order="stroke">${p.k==='u'?'mejora':'obra'} ${pc}%</text></g>`; });
  }
  const fs=Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).sort((a,b)=>(a===owner?-1:0)-(b===owner?-1:0));
  if(fs.length) d+=figRows(z,fs[0],PLN[fs[0]].col);
  fs.slice(1,3).forEach((f,r)=>{ const k=unitCounts(z,f), col=PLN[f].col; const y=186+r*26;
    d+=`<g transform="translate(0,${y})"><rect x="-70" y="-12" width="140" height="24" rx="12" fill="#2A1B16" stroke="${col}" stroke-width="3"/><text class="zt" x="0" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#FBF8F2">${esc(PLN[f].name)}: ${k.c} civ · ${k.m} mil</text></g>`; });
  if(z.conflict) d+=`<g class="clash" transform="translate(0,-8)"><circle r="24" fill="#C8452F" stroke="${INK}" stroke-width="2"/><path d="M-12,-12 L12,12 M12,-12 L-12,12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;
  let s=`<g class="detail">${d}</g>`;
  if(z.res){ const r=RES[z.res]; s+=`<g class="detail" transform="translate(118,-96)"><circle r="17" fill="${r.col}" stroke="${INK}" stroke-width="2"/><text class="zt" text-anchor="middle" y="5" font-size="15" font-weight="700" fill="#10181B">${r.sc==='global'?'G':'L'}</text><text class="zt" text-anchor="middle" y="34" font-size="12" font-weight="700" fill="#2A1B16" stroke="#fff" stroke-width="3" paint-order="stroke">${r.n}</text></g>`; }
  s+=nameplate(z,i);
  return s;
}
function nameplate(z,i){
  const owner=z.owner, col=owner===null?'#8B7B6B':PLN[owner].col; const sp=zspec(z); const mine=ownPop(z);
  const vis=(owner!==TRIBE)||tribeVisibleFor(z);
  const slots=isPl(owner)?slotsOf(G,z):0; const built=z.b.length, inProg=z.proj.filter(p=>p.k!=='u').length;
  let pips=''; for(let k=0;k<Math.min(slots,8);k++){ const x=62+k*13; const st=k<built?'b':(k<built+inProg?'p':'f'); const bc=st==='b'?BT[z.b[k].t].col:null; pips+=`<rect x="${x}" y="11" width="10" height="10" rx="2" fill="${st==='b'?bc:st==='p'?'#7FB2E5':'none'}" stroke="${st==='f'?'#9A8F80':'#fff'}" stroke-width="1.6" ${st==='f'?'stroke-dasharray="2.5 2"':''}/>`; }
  const sizeTxt=isPl(owner)||owner===null||owner===TRIBE?z.size:z.size;
  const prog=isPl(owner)?Math.min(1,z.prog/growCost(G,owner,z)):0;
  const nm=zname(z); const w=Math.max(214,66+nm.length*8.6), L=-w/2;
  let s=`<g class="lbl" style="transform:translate(0px,-146px) scale(var(--inv,1))"><rect x="${f1(L)}" y="-27" width="${f1(w)}" height="58" rx="15" fill="#2A1B16" stroke="${col}" stroke-width="4"/>`
   +`<g transform="translate(${f1(L+24)},1)">${emblem(sp.sp,21)}</g>`
   +`<text class="zt" x="${f1(L+50)}" y="-8" font-size="15" font-weight="700" fill="#FBF8F2">${esc(nm)}</text>`
   +`<text class="zt" x="${f1(L+50)}" y="6" font-size="10.5" fill="#D9CDB8">${esc(sp.lab)}${z.role==='capital'?' · Capital':''} · ${TERRN[z.terrain]}</text>`
   +`<g transform="translate(${f1(L+54)},19)">${iconCiv(0,0,col)}</g><text class="zt" x="${f1(L+63)}" y="23" font-size="13" font-weight="700" fill="#FBF8F2">${vis?mine:'?'}</text><text class="zt" x="${f1(L+81)}" y="23" font-size="10" fill="#D9CDB8">pob.</text>`
   +`<g transform="translate(${f1(L+112)},18)"><path d="M-6,5 v-9 h3 v-3 h3 v3 h3 v-3 h3 v3 h3 v9 z" transform="scale(.85)" fill="#E6C9A8" stroke="#fff" stroke-width="1"/></g><text class="zt" x="${f1(L+121)}" y="23" font-size="13" font-weight="700" fill="#FBF8F2">${sizeTxt}</text><text class="zt" x="${f1(L+134)}" y="23" font-size="10" fill="#D9CDB8">tam.</text>`
   +`<g transform="translate(${f1(L+150-62)},-1)">${pips}</g>`
   +(prog>0?`<rect x="${f1(L+6)}" y="26" width="${f1(w-12)}" height="3" rx="1.5" fill="rgba(255,255,255,.2)"/><rect x="${f1(L+6)}" y="26" width="${((w-12)*prog).toFixed(1)}" height="3" rx="1.5" fill="#9DC764"/>`:'')
   +`</g>`;
  return s;
}
function tribeVisibleFor(z){ return z.adj.some(a=>(G.zones[a].units[ME]||[]).length>0)||(z.units[ME]||[]).length>0; }

/* ---------- órdenes en cola, con flechas claras sobre los caminos ---------- */
function arrowAt(P,Q,col,sz){ const dx=P[0]-Q[0],dy=P[1]-Q[1],L=Math.hypot(dx,dy)||1; const ux=dx/L,uy=dy/L; const px=-uy,py=ux; const a=[P[0],P[1]], b=[P[0]-ux*sz+px*sz*0.55,P[1]-uy*sz+py*sz*0.55], c=[P[0]-ux*sz-px*sz*0.55,P[1]-uy*sz-py*sz*0.55]; return `<polygon points="${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])} ${f1(c[0])},${f1(c[1])}" fill="${col}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>`; }
function moveArrowSVG(fromId,toId,via,u,stance,key){
  const hops=[fromId,toId].concat(via||[]); const dz=G.zones[hops[hops.length-1]];
  const contested=(dz.owner!==null&&dz.owner!==ME&&!allied(G,ME,dz.owner))||presentF(dz).some(f=>f!==ME&&isEnemy(G,ME,f));
  const col=!contested?'#3B7DDD':(stance==='ataque'?'#C8452F':'#2F8F4F'); let h=''; let midPt=null;
  for(let k=0;k<hops.length-1;k++){
    const {A,B,C}=hopPts(hops[k],hops[k+1]); const d=`M${f1(A[0])},${f1(A[1])} Q${f1(C[0])},${f1(C[1])} ${f1(B[0])},${f1(B[1])}`;
    h+=`<path d="${d}" stroke="#fff" stroke-width="20" fill="none" stroke-linecap="round" opacity=".85"/><path d="${d}" stroke="${col}" stroke-width="12" fill="none" stroke-dasharray="22 14" stroke-linecap="round" class="march"/>`;
    // flecha a ~82% del camino
    const t=0.82, P=qpt(A,C,B,t), Q=qpt(A,C,B,t-0.04); h+=arrowAt(P,Q,col,30);
    if(k===hops.length-2) midPt=qpt(A,C,B,0.3);
  }
  const parts=[]; Object.keys(u||{}).forEach(t=>{ if(u[t]>0) parts.push([t,u[t]]); });
  const civ=parts.filter(p=>CIV.includes(p[0])).reduce((a,p)=>a+p[1],0), mil=parts.filter(p=>!CIV.includes(p[0])).reduce((a,p)=>a+p[1],0);
  const lbl=(civ?civ+' civ.':'')+(civ&&mil?' + ':'')+(mil?mil+' mil.':'');
  if(midPt) h+=`<g class="lbl" style="transform:translate(${f1(midPt[0])}px,${f1(midPt[1])}px) scale(var(--inv,1))"><rect x="-70" y="-18" width="140" height="36" rx="18" fill="${col}" stroke="#fff" stroke-width="3"/><text class="zt" x="0" y="-2" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${!contested?'➜ Mover':(stance==='ataque'?'⚔ Ataque':'☮ Paz')}</text><text class="zt" x="0" y="12" text-anchor="middle" font-size="12" fill="#fff">${esc(lbl)}</text></g>`;
  return h;
}
function drawOrderPreview(){
  const g=$('ordT'); if(!g||!ui) return; let h=''; const Z=G.zones;
  ui.orders.forEach(o=>{
    if(o.t==='move') h+=`<g class="oprev">${moveArrowSVG(o.from,o.to,o.via,o.u,o.stance)}</g>`;
    else if(o.t==='send'){ const {A,B,C}=hopPts(o.from,o.to); h+=`<path d="M${f1(A[0])},${f1(A[1])} Q${f1(C[0])},${f1(C[1])} ${f1(B[0])},${f1(B[1])}" stroke="#E0A21B" stroke-width="9" stroke-dasharray="4 14" fill="none" stroke-linecap="round" class="march"/>`; }
    else if(o.zone!==undefined){ const i=o.zone; const lab={build:'obra',upgrade:'mejora',wonder:'maravilla',train:'entrena',spec:'especializa',bspec:'especializa edif.',demolish:'demoler',annex:'anexar',stance:o.stance==='alerta'?'alerta':'paz'}[o.t]; if(lab) h+=`<g class="oprev lbl" style="transform:translate(${f1(sx(i))}px,${f1(sy(i)-205)}px) scale(var(--inv,1))"><rect x="-58" y="-13" width="116" height="24" rx="12" fill="#3B7DDD" stroke="#fff" stroke-width="2"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">⏳ ${lab}</text></g>`; }
  });
  if(ui.mv){ const o=ui.mv; const u={}; CIV.concat(MIL).forEach(t=>{ const n=Number(fv('mv_'+t,0))||0; if(n>0) u[t]=n; }); const via=fv('mv_via','')===''?[]:[Number(fv('mv_via',''))]; h+=`<g class="oprev">${moveArrowSVG(o.from,o.to,via,u,o.st)}</g>`; }
  const sig=h; if(ui.ordSig!==sig){ ui.ordSig=sig; g.innerHTML=h; }
}

/* ---------- cámara: transformación CSS ---------- */
function vpRect(){ return $('vp').getBoundingClientRect(); }
function applyView(){
  const r=CAM; if(!r.vw) return; const B=WORLD.bounds; const k=r.vw/VIEW.w; r.k=k;
  const tx=-(VIEW.x-B.x0)*k, ty=-(VIEW.y-B.y0)*k;
  $('cam').style.transform=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${k.toFixed(4)})`;
  const inv=Math.max(0.7,Math.min(1.9,1/k)); if(Math.abs(inv-CAM.inv)>0.01){ CAM.inv=inv; $('terr').style.setProperty('--inv',inv.toFixed(3)); }
  const far=k<0.5; if(far!==CAM.far){ CAM.far=far; $('terr').classList.toggle('far',far); }
  clearTimeout(CAM.reT); CAM.reT=setTimeout(()=>{ const c=$('cam'); c.style.willChange='auto'; void c.offsetWidth; c.style.willChange='transform'; },160);
  updateMiniRect();
}
function clampView(){
  const B=WORLD.bounds; const mx=VIEW.w*0.3, my=VIEW.h*0.3;
  VIEW.x=Math.min(Math.max(VIEW.x,B.x0-mx),B.x1-VIEW.w+mx); VIEW.y=Math.min(Math.max(VIEW.y,B.y0-my),B.y1-VIEW.h+my);
}
function resizeView(){ const r=vpRect(); if(!r.width) return; CAM.vw=r.width; CAM.vh=r.height; VIEW.ratio=r.height/r.width; VIEW.h=VIEW.w*VIEW.ratio; clampView(); applyView(); }
function setView(x,y,w){ VIEW.w=Math.max(VIEW.minW,Math.min(w,VIEW.maxW)); VIEW.h=VIEW.w*VIEW.ratio; VIEW.x=x-VIEW.w/2; VIEW.y=y-VIEW.h/2; clampView(); applyView(); }
function flyTo(x,y,w,ms){
  if(VIEW.anim) cancelAnimationFrame(VIEW.anim);
  w=Math.max(VIEW.minW,Math.min(w||VIEW.w,VIEW.maxW)); if(!FXS.on||!ms){ setView(x,y,w); return; }
  const cx0=VIEW.x+VIEW.w/2, cy0=VIEW.y+VIEW.h/2, w0=VIEW.w, t0=performance.now();
  const step=t=>{ const k=Math.min(1,(t-t0)/ms), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; setView(cx0+(x-cx0)*e,cy0+(y-cy0)*e,w0+(w-w0)*e); if(k<1) VIEW.anim=requestAnimationFrame(step); else VIEW.anim=null; };
  VIEW.anim=requestAnimationFrame(step);
}
function fitAll(ms){ const B=WORLD.bounds; const w=Math.max(WORLD.W,WORLD.H/VIEW.ratio); flyTo((B.x0+B.x1)/2,(B.y0+B.y1)/2,w*1.02,ms); }
function goZone(i,w,ms){ flyTo(sx(i),sy(i)+20,w||820,ms===undefined?650:ms); }
function myCapital(){ const z=G.zones.find(z=>z.capital&&z.sector===ME); return z?z.id:0; }

/* ---------- minimapa (solo se redibuja si cambia algo) ---------- */
function drawMini(){
  const sig=G.zones.map(z=>z.owner+(z.conflict?'c':'')).join(',')+'|'+G.step; if(ui.miniSig===sig) return; ui.miniSig=sig;
  const B=WORLD.bounds, Z=G.zones; let h='';
  WORLD.roads.forEach(r=>{ h+=`<line x1="${f1(sx(r.a))}" y1="${f1(sy(r.a))}" x2="${f1(sx(r.b))}" y2="${f1(sy(r.b))}" stroke="#7A5237" stroke-width="22"/>`; });
  Z.forEach((z,i)=>{ const col=isPl(z.owner)?PLN[z.owner].col:(z.owner===TRIBE?'#8A5A3A':'#B8AE9C'); h+=`<circle cx="${f1(sx(i))}" cy="${f1(sy(i))}" r="${z.capital?62:46}" fill="${col}" stroke="#2A1B16" stroke-width="12"/>`; if(z.capital) h+=`<text x="${f1(sx(i))}" y="${f1(sy(i)+22)}" text-anchor="middle" font-size="60" font-weight="700" fill="#fff">★</text>`; if(z.conflict) h+=`<circle cx="${f1(sx(i))}" cy="${f1(sy(i))}" r="80" fill="none" stroke="#fff" stroke-width="12" class="blink"/>`; });
  const mc=myCapital(); h+=`<circle cx="${f1(sx(mc))}" cy="${f1(sy(mc))}" r="96" fill="none" stroke="#FFE27A" stroke-width="14"/>`;
  h+=`<rect id="miniRect" fill="rgba(255,255,255,.22)" stroke="#FFE27A" stroke-width="16"/>`;
  $('mini').setAttribute('viewBox',`${B.x0} ${B.y0} ${WORLD.W} ${WORLD.H}`); $('mini').innerHTML=h; updateMiniRect();
}
function updateMiniRect(){ const r=$('miniRect'); if(!r) return; r.setAttribute('x',VIEW.x); r.setAttribute('y',VIEW.y); r.setAttribute('width',VIEW.w); r.setAttribute('height',VIEW.h); }
function miniPoint(e){ const m=$('mini'), r=m.getBoundingClientRect(), B=WORLD.bounds; const bw=WORLD.W,bh=WORLD.H; const sc=Math.min(r.width/bw,r.height/bh); const ox=(r.width-bw*sc)/2, oy=(r.height-bh*sc)/2; return [B.x0+(e.clientX-r.left-ox)/sc,B.y0+(e.clientY-r.top-oy)/sc]; }

/* ---------- mouse ---------- */
let DRAG=null, SUPPRESS=false, EDGEV=[0,0], PANQ=false;
function schedView(){ if(PANQ) return; PANQ=true; requestAnimationFrame(()=>{ PANQ=false; clampView(); applyView(); }); }
function initTerrInput(){
  const vp=$('vp');
  vp.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('.mini,.toolbar')) return; DRAG={x:e.clientX,y:e.clientY,vx:VIEW.x,vy:VIEW.y,moved:false}; if(VIEW.anim){ cancelAnimationFrame(VIEW.anim); VIEW.anim=null; } });
  window.addEventListener('pointermove',e=>{
    if(DRAG&&ui&&ui.view==='terr'){ const dx=e.clientX-DRAG.x, dy=e.clientY-DRAG.y; if(!DRAG.moved&&Math.hypot(dx,dy)>5){ DRAG.moved=true; vp.classList.add('dragging'); }
      if(DRAG.moved){ const r=vpRect(); VIEW.x=DRAG.vx-dx*VIEW.w/r.width; VIEW.y=DRAG.vy-dy*VIEW.h/r.height; schedView(); } }
    if(VIEW.edge&&!DRAG&&ui&&ui.view==='terr'){ const r=vpRect(); const m=40; const px=e.clientX-r.left, py=e.clientY-r.top; EDGEV=[0,0]; if(px>=0&&py>=0&&px<=r.width&&py<=r.height){ if(px<m) EDGEV[0]=-1; else if(px>r.width-m) EDGEV[0]=1; if(py<m) EDGEV[1]=-1; else if(py>r.height-m) EDGEV[1]=1; } }
  });
  window.addEventListener('pointerup',()=>{ if(DRAG){ if(DRAG.moved){ SUPPRESS=true; setTimeout(()=>{ SUPPRESS=false; },0); } DRAG=null; vp.classList.remove('dragging'); } });
  vp.addEventListener('mouseleave',()=>{ EDGEV=[0,0]; });
  vp.addEventListener('wheel',e=>{
    if(!ui||ui.view!=='terr') return; e.preventDefault(); const r=vpRect(); const mx=(e.clientX-r.left)/r.width, my=(e.clientY-r.top)/r.height; const wx=VIEW.x+mx*VIEW.w, wy=VIEW.y+my*VIEW.h;
    const k=e.deltaY>0?1.15:1/1.15; const nw=Math.max(VIEW.minW,Math.min(VIEW.maxW,VIEW.w*k)); VIEW.w=nw; VIEW.h=nw*VIEW.ratio; VIEW.x=wx-mx*VIEW.w; VIEW.y=wy-my*VIEW.h; schedView();
  },{passive:false});
  vp.addEventListener('dblclick',e=>{ const zg=e.target.closest('g.zone'); if(zg) goZone(Number(zg.dataset.id),720,500); });
  const mini=$('mini'); let md=false;
  const mj=e=>{ const p=miniPoint(e); setView(p[0],p[1],VIEW.w); };
  mini.addEventListener('pointerdown',e=>{ md=true; mj(e); e.stopPropagation(); }); window.addEventListener('pointermove',e=>{ if(md) mj(e); }); window.addEventListener('pointerup',()=>{ md=false; });
  setInterval(()=>{ if((EDGEV[0]||EDGEV[1])&&ui&&ui.view==='terr'&&!DRAG){ VIEW.x+=EDGEV[0]*VIEW.w*0.012; VIEW.y+=EDGEV[1]*VIEW.h*0.012; schedView(); } },16);
  window.addEventListener('resize',()=>{ if(G&&ui&&ui.view==='terr') resizeView(); });
}
const KEYS=new Set(); let DPAD=[0,0], PANLOOP=null;
const KMAP={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],a:[-1,0],d:[1,0],w:[0,-1],s:[0,1]};
function keyName(k){ return k.length===1?k.toLowerCase():k; }
function keyDown(k){ k=keyName(k); if(!KMAP[k]) return false; KEYS.add(k); startPan(); return true; }
function keyUp(k){ KEYS.delete(keyName(k)); }
function startPan(){
  if(PANLOOP) return; let last=performance.now();
  const step=t=>{
    const dt=Math.min(50,t-last)/1000; last=t; let dx=DPAD[0],dy=DPAD[1];
    KEYS.forEach(k=>{ dx+=KMAP[k][0]; dy+=KMAP[k][1]; });
    if(dx||dy){ const n=Math.hypot(dx,dy)||1; const sp=VIEW.w*0.9*dt; VIEW.x+=dx/n*sp; VIEW.y+=dy/n*sp; clampView(); applyView(); PANLOOP=requestAnimationFrame(step); }
    else PANLOOP=null;
  };
  PANLOOP=requestAnimationFrame(step);
}
function panKey(k){ return keyDown(k); }
