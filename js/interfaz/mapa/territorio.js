'use strict';
// Vista de territorio: dibujo del mapa, placas, flechas de órdenes, cámara, minimapa y mouse/teclado.

// El mundo estático se dibuja UNA vez por partida.
// Cada zona se vuelve a dibujar solo si cambió su "firma".
// Seleccionar o resaltar solo cambia clases CSS.
// Mover o acercar la cámara es una transformación CSS (sin redibujar).
const WORLD = {ws:1,R:172,RC:275,site:[],poly:[],decor:[],edges:[],wild:[],wildDecor:[],rim:[],bounds:null,roads:[],W:1,H:1};
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
  const ws=Math.max(950,290/dmin); WORLD.ws=ws; const R=WORLD.R=172; const RC=WORLD.RC=Math.round(R*1.6);
  WORLD.site=Z.map(z=>[z.x*ws,z.y*ws]);
  // Cada zona es una parcela del mismo valle: celdas de Voronoi limitadas por un borde orgánico.
  const abs=Z.map((z,i)=>{
    const rnd=mulberry32(77+i*31+(G.seed%1009)); const n=30; let poly=[];
    const fr=z.role==='frontera'?0.6:1;   // la frontera es un paso estrecho entre imperios
    for(let k=0;k<n;k++){ const a=2*Math.PI*k/n; const rr=RC*fr*(0.9+0.14*rnd()); poly.push([WORLD.site[i][0]+rr*Math.cos(a),WORLD.site[i][1]+rr*Math.sin(a)]); }
    Z.forEach((o,j)=>{ if(j===i) return; if(Math.hypot(WORLD.site[i][0]-WORLD.site[j][0],WORLD.site[i][1]-WORLD.site[j][1])>2*RC*1.1) return;
      // contra una frontera, la línea divisoria se corre hacia ella (su celda es más chica)
      const wj=Z[j].role==='frontera'?0.6:1, wi=z.role==='frontera'?0.6:1; const t=wi/(wi+wj); const S=WORLD.site[i], T=WORLD.site[j]; const m=[S[0]+(T[0]-S[0])*t*2, S[1]+(T[1]-S[1])*t*2];
      poly=clipHalf(poly,S,m); });
    return poly;
  });
  WORLD.poly=abs.map((poly,i)=>poly.map(p=>[p[0]-WORLD.site[i][0],p[1]-WORLD.site[i][1]]));
  // Bordes compartidos: el tramo de la celda i que cae sobre la mediatriz con j.
  const conn=new Set(G.map.e.map(([a,b])=>Math.min(a,b)+'-'+Math.max(a,b)));
  const shared=(i,j)=>{ const s=WORLD.site[i], t=WORLD.site[j]; const wi=Z[i].role==='frontera'?0.6:1, wj=Z[j].role==='frontera'?0.6:1, k=wi/(wi+wj); const mx=s[0]+(t[0]-s[0])*k,my=s[1]+(t[1]-s[1])*k,nx=t[0]-s[0],ny=t[1]-s[1],L=Math.hypot(nx,ny);
    const near=p=>Math.abs(((p[0]-mx)*nx+(p[1]-my)*ny)/L)<0.6; const P=abs[i]; let best=null;
    for(let k=0;k<P.length;k++){ const a=P[k],b=P[(k+1)%P.length]; if(near(a)&&near(b)){ const l=Math.hypot(b[0]-a[0],b[1]-a[1]); if(l>8&&(!best||l>best.l)) best={a,b,l}; } }
    return best; };
  WORLD.edges=[];
  for(let i=0;i<Z.length;i++) for(let j=i+1;j<Z.length;j++){
    const e1=shared(i,j); if(!e1) continue; const e2=shared(j,i); const e=(e2&&e2.l<e1.l)?e2:e1;
    WORLD.edges.push({a:i,b:j,p:[e.a,e.b],road:conn.has(i+'-'+j)});
  }
  WORLD.decor=Z.map((z,i)=>{
    const rnd=mulberry32(500+i*13+(G.seed%997)); const poly=WORLD.poly[i]; const items=[];
    const cfg={bos:{n:30,t:'tree'},mon:{n:14,t:'peak'},pra:{n:36,t:'tuft'},col:{n:16,t:'hill'},lla:{n:16,t:'furrow'},rio:{n:16,t:'reed'}}[z.terrain];
    let tries=0; while(items.length<cfg.n&&tries<900){ tries++; const x=(rnd()*2-1)*RC, y=(rnd()*2-1)*RC; if(!ptIn(poly,x,y)) continue; if(Math.hypot(x,y)<70) continue; if(y>96&&Math.abs(x)<120) continue; if(y<-110&&y>-190&&Math.abs(x)<130) continue;
      if(items.some(o=>Math.hypot(o.x-x,o.y-y)<(cfg.t==='peak'?52:cfg.t==='tuft'?20:32))) continue; items.push({t:cfg.t,x,y,s:(cfg.t==='peak'?1.7+rnd()*0.9:cfg.t==='tuft'?1.1+rnd()*0.5:1.3+rnd()*0.6)}); }
    return items.sort((a,b)=>a.y-b.y);
  });
  const xs=WORLD.site.map(s=>s[0]), ys=WORLD.site.map(s=>s[1]);
  WORLD.bounds={x0:Math.min(...xs)-RC-170,y0:Math.min(...ys)-RC-230,x1:Math.max(...xs)+RC+170,y1:Math.max(...ys)+RC+200};
  WORLD.W=Math.round(WORLD.bounds.x1-WORLD.bounds.x0); WORLD.H=Math.round(WORLD.bounds.y1-WORLD.bounds.y0);
  WORLD.roads=G.map.e.map(([a,b],k)=>{
    const A=WORLD.site[a],B=WORLD.site[b]; const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1; const r=mulberry32(900+k*7); const off=(r()*2-1)*0.07*L;
    const cx=(A[0]+B[0])/2-dy/L*off, cy=(A[1]+B[1])/2+dx/L*off;
    return {a,b,c:[cx,cy],d:`M${f1(A[0])},${f1(A[1])} Q${f1(cx)},${f1(cy)} ${f1(B[0])},${f1(B[1])}`};
  });
  // Campo silvestre: tierra entre parcelas (alrededor de cada zona y bajo cada camino).
  WORLD.wild=Z.map((z,i)=>({x:WORLD.site[i][0],y:WORLD.site[i][1],r:RC*1.02}));
  WORLD.roads.forEach(r=>{ const m=qpt(WORLD.site[r.a],r.c,WORLD.site[r.b],0.5); WORLD.wild.push({x:m[0],y:m[1],r:RC*0.62}); });
  const inLand=(x,y)=>WORLD.wild.some(c=>Math.hypot(c.x-x,c.y-y)<c.r-30);
  const inCell=(x,y)=>abs.some(P=>ptIn(P,x,y));
  const nearRoad=(x,y)=>WORLD.roads.some(r=>{ for(let t=0;t<=1;t+=0.1){ const p=qpt(WORLD.site[r.a],r.c,WORLD.site[r.b],t); if(Math.hypot(p[0]-x,p[1]-y)<34) return true; } return false; });
  const rw=mulberry32(4242+(G.seed%503)); WORLD.wildDecor=[]; const B=WORLD.bounds;
  for(let k=0;k<2600&&WORLD.wildDecor.length<220;k++){ const x=B.x0+rw()*WORLD.W, y=B.y0+rw()*WORLD.H;
    if(!inLand(x,y)||inCell(x,y)||nearRoad(x,y)) continue; if(WORLD.wildDecor.some(o=>Math.hypot(o.x-x,o.y-y)<26)) continue;
    const q=rw(); WORLD.wildDecor.push({t:q<0.5?'tree':q<0.8?'tuft':'rock',x,y,s:q<0.5?1.2+rw()*0.6:1+rw()*0.5}); }
  WORLD.wildDecor.sort((a,b)=>a.y-b.y);
  // Bosque espeso fuera del valle (el borde del mundo).
  WORLD.rim=[];
  for(let k=0;k<5000&&WORLD.rim.length<700;k++){ const x=B.x0+rw()*WORLD.W, y=B.y0+rw()*WORLD.H; if(inLand(x,y+20)) continue; WORLD.rim.push({x,y,s:1.4+rw()*0.9}); }
  WORLD.rim.sort((a,b)=>a.y-b.y);
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
const SPECC={mil:'#7A2E24',front:'#C9A24A',agr:'#6FA83A',ing:'#C97A3A',cie:'#4A7FC0',com:'#E0A21B',bas:'#B79A6A',tri:'#8A5A3A',free:'#9AA39C'};
const SPECL={agr:'Agrícola',ing:'Producción',cie:'Tecnología',com:'Comercial',bas:'Básica',tri:'Tribu',free:'Libre'};
function emblem(sp,r){
  const c=SPECC[sp]||SPECC.free; let g='';
  switch(sp){
    case 'agr': g='<path d="M-9,11 L-9,-6 M0,13 L0,-10 M9,11 L9,-6" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/><ellipse cx="-9" cy="-9" rx="3" ry="5" fill="#fff"/><ellipse cx="0" cy="-13" rx="3" ry="5" fill="#fff"/><ellipse cx="9" cy="-9" rx="3" ry="5" fill="#fff"/>'; break;
    case 'ing': g='<circle r="7" fill="none" stroke="#fff" stroke-width="4.5"/><circle r="12" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4.6 4.6"/>'; break;
    case 'cie': g='<path d="M-4,-13 h8 v8 l9,17 h-26 l9,-17 z" fill="#fff"/><circle cx="-1" cy="7" r="2.4" fill="#4A7FC0"/><circle cx="4" cy="3" r="1.8" fill="#4A7FC0"/>'; break;
    case 'com': g='<circle r="12" fill="#fff"/><text y="6" text-anchor="middle" font-size="17" font-weight="700" fill="#B07A10" class="zt">$</text>'; break;
    case 'mil': g='<path d="M0,-13 L11,-8 V2 Q11,10 0,14 Q-11,10 -11,2 V-8 Z" fill="#fff"/><path d="M0,-6 V8 M-5,0 H5" stroke="#7A2E24" stroke-width="2.6" stroke-linecap="round"/>'; break;
    case 'tri': g='<polygon points="-13,12 0,-13 13,12" fill="#fff"/><polygon points="-4,12 0,2 4,12" fill="#8A5A3A"/>'; break;
    case 'free': g='<circle r="10" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 5"/>'; break;
    case 'front': g='<path d="M-9,13 V-13 M-9,-13 L9,-7 L-9,-1" stroke="#fff" stroke-width="3" fill="#fff" stroke-linejoin="round"/><path d="M3,13 V-6" stroke="#fff" stroke-width="2.5"/>'; break;
    default: g='<path d="M-12,2 L0,-11 L12,2 v10 h-24 z" fill="#fff"/><rect x="-3" y="4" width="6" height="8" fill="#B79A6A"/>';
  }
  return `<g transform="scale(${r/24})"><circle r="24" fill="${c}" stroke="${INK}" stroke-width="3"/>${g}</g>`;
}
function zspec(z){
  if(z.owner===TRIBE) return {sp:'tri',lvl:0,lab:'Tribu '+({agr:'agrícola',ing:'de producción',com:'comercial',cie:'científica'})[z.tspec]};
  if(z.role==='frontera') return {sp:'front',lvl:0,lab:'Frontera'};
  if(!isPl(z.owner)) return {sp:'free',lvl:0,lab:'Zona libre'};
  const s=zoneSpec(G,z,z.owner); const R=['','I','II','III'];
  return {sp:s.spec,lvl:s.lvl,lab:SPECL[s.spec]+(s.spec==='bas'?'':' '+R[s.lvl])};
}
function popOf(z){ let n=0; for(const f in z.units) n+=z.units[f].length; return n; }
function ownPop(z){ if(z.role==='frontera') return popOf(z); return isPl(z.owner)||z.owner===TRIBE?(z.units[z.owner]||[]).length:0; }

/* ---------- dibujo ---------- */
function terrDecor(it){
  if(it.t==='tree') return tree(it.x,it.y,it.s); if(it.t==='peak') return peak(it.x,it.y,it.s); if(it.t==='tuft') return tuft(it.x,it.y,it.s);
  if(it.t==='hill') return hill(it.x,it.y,it.s); if(it.t==='furrow') return furrow(it.x,it.y,it.s*1.3); return reed(it.x,it.y,it.s);
}
function ptsStr(poly,k){ return poly.map(p=>f1(p[0]*(k||1))+','+f1(p[1]*(k||1))).join(' '); }
function rock(x,y,s=1){return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s)})"><path d="M-7,1 L-5,-5 L1,-8 L7,-4 L8,1 Z" fill="#9A9285" stroke="${INK}" stroke-width=".8"/><path d="M1,-8 L7,-4 L8,1 L3,1 Z" fill="#7C756B"/></g>`;}
function bush(x,y,s=1){return `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(s)})"><ellipse cy="-5" rx="10" ry="7" fill="#4F7F43" stroke="${INK}" stroke-width=".8"/><ellipse cx="-3" cy="-8" rx="4" ry="3" fill="#6FA064"/></g>`;}
// Borde entre dos zonas: cerca baja si hay camino, barranco con rocas si no se puede pasar.
// Por qué están conectadas dos zonas: el tipo de camino sale del terreno de las dos (río → puente, montaña → paso, bosque → sendero…).
const CONN_RK={puente:{o:21,i:13,ic:'#D9D2C4',oc:'#5A5A60'},paso:{o:15,i:8.5,ic:'#CBB28A',oc:'#6B4528',dash:'15 8'},sendero:{o:12,i:6.5,ic:'#B58E5A',oc:'#5B3F26',dash:'9 8'},colinas:{o:19,i:12,ic:'#E2C79B',oc:'#6B4528'},llano:{o:25,i:17,ic:'#EBD7AD',oc:'#6B4528'},frontera:{o:19,i:12,ic:'#F0D98A',oc:'#8A6A12',dash:'3 10'}};
function connInfo(a,b){
  const A=G.zones[a], B=G.zones[b], ta=A.terrain, tb=B.terrain, has=t=>ta===t||tb===t, na=zname(A), nb=zname(B);
  if(A.role==='frontera'||B.role==='frontera') return {k:'frontera',ic:'flag',n:'Camino de frontera',why:`El camino entre ${na} y ${nb} entra en una zona peligrosa: tierra de nadie que todos pueden pisar.`};
  if(has('rio')){ const r=ta==='rio'?na:nb; return {k:'puente',ic:'bridge',n:'Puente',why:`Puente: ${na} y ${nb} se unen cruzando el río de ${r}. Sin el puente no se podría pasar.`}; }
  if(has('mon')) return {k:'paso',ic:'pass',n:'Paso de montaña',why:`Paso de montaña: el camino sube por la sierra de ${ta==='mon'?na:nb} para unir ${na} y ${nb}.`};
  if(has('bos')) return {k:'sendero',ic:'trail',n:'Sendero del bosque',why:`Sendero del bosque: un camino estrecho entre los árboles de ${ta==='bos'?na:nb} une ${na} y ${nb}.`};
  if(has('col')) return {k:'colinas',ic:'hills',n:'Camino de colinas',why:`Camino de colinas: ${na} y ${nb} se unen por las lomas, con subidas suaves.`};
  return {k:'llano',ic:'road',n:'Camino llano',why:`Camino llano: ${na} y ${nb} son tierras abiertas y el paso es fácil.`};
}
// Lo que separa dos zonas vecinas que NO están conectadas.
function noPassInfo(a,b){
  const A=G.zones[a], B=G.zones[b], ta=A.terrain, tb=B.terrain, has=t=>ta===t||tb===t, na=zname(A), nb=zname(B);
  if(has('rio')) return {ic:'wave',n:'Sin puente',why:`Sin puente: el río separa ${na} y ${nb}, y aquí no hay dónde cruzarlo.`};
  if(has('mon')) return {ic:'cliff',n:'Sin paso',why:`Sin paso: la montaña cierra el camino entre ${na} y ${nb}.`};
  if(has('bos')) return {ic:'cliff',n:'Sin sendero',why:`Sin sendero: el bosque espeso separa ${na} y ${nb}.`};
  return {ic:'cliff',n:'Sin paso',why:`Sin paso: un barranco separa ${na} y ${nb}.`};
}
// Marcador pequeño sobre una conexión (se agranda con el zoom como las placas; al tocarlo explica por qué).
function connMarker(x,y,info,ok){
  return `<g class="conn lbl${ok?'':' no'}" data-t="${esc(info.n)}" data-x="${esc(info.why)}" style="transform:translate(${f1(x)}px,${f1(y)}px) scale(calc(var(--inv,1)*.9));cursor:pointer"><title>${esc(info.why)}</title><circle r="17" fill="${ok?'#FBF6EA':'#E9D8CF'}" stroke="${INK}" stroke-width="3"/><image href="${iconDataURI(info.ic)}" x="-12" y="-12" width="24" height="24" pointer-events="none"/></g>`;
}
function edgeSVG(e){
  const [a,b]=e.p, L=Math.hypot(b[0]-a[0],b[1]-a[1]); const d=`M${f1(a[0])},${f1(a[1])} L${f1(b[0])},${f1(b[1])}`;
  if(e.road) return `<path d="${d}" stroke="rgba(42,27,22,.32)" stroke-width="5" stroke-linecap="round"/><path d="${d}" stroke="#F3E7C9" stroke-width="3.2" stroke-dasharray="2 11" stroke-linecap="round"/>`;
  let h=`<g><title>Sin paso entre estas zonas</title><path d="${d}" stroke="#4A3426" stroke-width="13" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="#6E5440" stroke-width="5" stroke-linecap="round"/>`;
  const n=Math.max(1,Math.floor(L/24)); const r=mulberry32(e.a*97+e.b*13);
  for(let k=0;k<=n;k++){ const t=k/n; const x=a[0]+(b[0]-a[0])*t+(r()-.5)*8, y=a[1]+(b[1]-a[1])*t+(r()-.5)*8; h+=rock(x,y+4,0.9+r()*0.6); }
  return h+'</g>';
}
// Estilo del mapa: «valle» (el dibujo de siempre) o «mesa» (tablero de juego: mesa de madera, tapete y fichas de cartón con grosor).
let MAPSTYLE='valle'; try{ const e=localStorage.getItem('pasos_estilo_mapa'); if(e==='mesa'||e==='valle') MAPSTYLE=e; }catch(e){}
function setMapStyle(st){
  MAPSTYLE=st==='mesa'?'mesa':'valle'; try{ localStorage.setItem('pasos_estilo_mapa',MAPSTYLE); }catch(e){}
  const vp=$('vp'); if(vp) vp.dataset.estilo=MAPSTYLE;
  ['stValle','stMesa'].forEach(id=>{ const b=$(id); if(b) b.setAttribute('aria-pressed',String((id==='stMesa')===(MAPSTYLE==='mesa'))); });
  if(G&&ui&&WORLD.bounds){ buildTerritoryDOM(); ui.miniSig=null; drawMini(); render(); }
}
const MESA_DEFS=`<defs><pattern id="forest" width="170" height="130" patternUnits="userSpaceOnUse"><rect width="170" height="130" fill="#6B4A2E"/><path d="M0 0v130M85 0v130" stroke="#4A301C" stroke-width="3"/><path d="M10 14c26-6 46 6 66 0M96 30c26 6 46-6 66 0M12 52c30 6 50-6 70 0M100 74c24-6 44 6 64 0M8 100c28 6 48-6 72 0M98 116c22-6 44 6 62 0" stroke="#7D5A38" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M36 30c10-3 20 3 30 0M120 92c10-3 20 3 30 0" stroke="#5A3C24" stroke-width="1.2" fill="none"/></pattern><filter id="tblur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter><filter id="grainF" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .1  0 0 0 0 .06  0 0 0 0 .04  0 0 0 .16 0" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>`;
// una zona como ficha de cartón: sombra, canto con grosor, cara impresa con borde punteado y grano de papel
function tileBase(i,T){
  const P=ptsStr(WORLD.poly[i],0.955), Q=ptsStr(WORLD.poly[i],0.9);
  return `<polygon points="${P}" transform="translate(0,16)" fill="#000" opacity=".42" filter="url(#tblur)"/>`
    +`<polygon points="${P}" transform="translate(0,10)" fill="#4A3426" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
    +`<polygon points="${P}" transform="translate(0,5)" fill="#6A5240" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    +`<polygon points="${P}" fill="${T}" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>`
    +`<polygon points="${Q}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="2.6" stroke-dasharray="2 8" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function buildTerritoryDOM(){
  const Z=G.zones, B=WORLD.bounds; let h=''; const mesa=MAPSTYLE==='mesa';
  h+=mesa?MESA_DEFS:`<defs><pattern id="forest" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#4E6B3C"/><circle cx="18" cy="20" r="14" fill="#5A7A45"/><circle cx="62" cy="54" r="16" fill="#456236"/><circle cx="34" cy="74" r="11" fill="#5A7A45"/><circle cx="78" cy="12" r="9" fill="#456236"/></pattern>`;
  h+=mesa?'':`<radialGradient id="fog" cx="50%" cy="50%" r="70%"><stop offset="60%" stop-color="#2A1B16" stop-opacity="0"/><stop offset="100%" stop-color="#1E2A18" stop-opacity=".55"/></radialGradient>`;
  Z.forEach((z,i)=>{ h+=`<clipPath id="cp${i}"><polygon points="${ptsStr(WORLD.poly[i])}"/></clipPath>`; });
  h+=`</defs><rect x="${B.x0}" y="${B.y0}" width="${WORLD.W}" height="${WORLD.H}" fill="url(#forest)"/>`;
  if(mesa) h+=`<rect x="${f1(B.x0+40)}" y="${f1(B.y0+40)}" width="${f1(WORLD.W-80)}" height="${f1(WORLD.H-80)}" rx="70" fill="#2B2018" opacity=".45" transform="translate(0,10)" filter="url(#tblur)"/><rect x="${f1(B.x0+40)}" y="${f1(B.y0+40)}" width="${f1(WORLD.W-80)}" height="${f1(WORLD.H-80)}" rx="70" fill="#3B7355" stroke="${INK}" stroke-width="8"/><rect x="${f1(B.x0+70)}" y="${f1(B.y0+70)}" width="${f1(WORLD.W-140)}" height="${f1(WORLD.H-140)}" rx="50" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"/><rect x="${f1(B.x0+40)}" y="${f1(B.y0+40)}" width="${f1(WORLD.W-80)}" height="${f1(WORLD.H-80)}" rx="70" fill="#000" filter="url(#grainF)" pointer-events="none"/>`;
  // copas del bosque que rodea el valle
  if(!mesa) WORLD.rim.forEach(t=>{ h+=tree(f1(t.x),f1(t.y),t.s); });
  // el valle: borde oscuro y campo silvestre (todo lo que no es una zona)
  if(!mesa) WORLD.wild.forEach(c=>{ h+=`<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${f1(c.r+10)}" fill="#3E5530"/>`; });
  if(!mesa) WORLD.wild.forEach(c=>{ h+=`<circle cx="${f1(c.x)}" cy="${f1(c.y)}" r="${f1(c.r)}" fill="#A3B26E"/>`; });
  if(!mesa) WORLD.wildDecor.forEach(it=>{ h+=it.t==='tree'?tree(f1(it.x),f1(it.y),it.s):it.t==='rock'?rock(it.x,it.y,it.s):bush(it.x,it.y,it.s*0.8); });
  let flowH='';
  // parcelas de cada zona, a ras de suelo
  Z.forEach((z,i)=>{
    const T=TCOL[z.terrain];
    h+=`<g transform="translate(${f1(sx(i))},${f1(sy(i))})">`;
    h+=mesa?tileBase(i,T):`<polygon points="${ptsStr(WORLD.poly[i])}" fill="${T}" stroke="rgba(42,27,22,.28)" stroke-width="2" stroke-linejoin="round"/>`;
    h+=`<g class="decor" clip-path="url(#cp${i})">`;
    if(z.terrain==='rio') flowH+=`<g transform="translate(${f1(sx(i))},${f1(sy(i))})" pointer-events="none"><g class="decor" clip-path="url(#cp${i})"><path class="flow" d="M-270,-24 C-150,-96 -60,28 20,-8 S170,-86 270,6" stroke="#E9F4F7" stroke-width="2.4" fill="none" stroke-dasharray="8 16" stroke-linecap="round"/></g></g>`;   // el reflejo que corre sobre el agua es lo único animado del fondo: va en la capa viva
    if(z.terrain==='rio') h+=`<path class="water" d="M-290,-30 C-150,-110 -60,40 20,-10 S170,-100 290,10" stroke="#3C86A2" stroke-width="46" fill="none" stroke-linecap="round"/><path d="M-290,-30 C-150,-110 -60,40 20,-10 S170,-100 290,10" stroke="#5BA6C0" stroke-width="38" fill="none" stroke-linecap="round"/>`;
    WORLD.decor[i].forEach(it=>{ h+=terrDecor(it); });
    h+=mesa?`</g><polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="#000" filter="url(#grainF)" pointer-events="none"/></g>`:`</g></g>`;
  });
  // bordes: cercas donde hay paso, barrancos donde no
  if(!mesa){ WORLD.edges.filter(e=>!e.road).forEach(e=>{ h+=edgeSVG(e); }); WORLD.edges.filter(e=>e.road).forEach(e=>{ h+=edgeSVG(e); }); }
  const RINFO=WORLD.roads.map(r=>connInfo(r.a,r.b));
  WORLD.roads.forEach((r,k)=>{ const st=CONN_RK[RINFO[k].k]; h+=`<path d="${r.d}" stroke="${st.oc}" stroke-width="${st.o}" fill="none" stroke-linecap="round"/>`; });
  WORLD.roads.forEach((r,k)=>{ const st=CONN_RK[RINFO[k].k]; h+=`<path d="${r.d}" stroke="${st.ic}" stroke-width="${st.i}" fill="none" stroke-linecap="${st.dash?'butt':'round'}"${st.dash?` stroke-dasharray="${st.dash}"`:''}/>`+(st.dash?'':`<path d="${r.d}" stroke="rgba(120,90,50,.45)" stroke-width="2" fill="none" stroke-dasharray="10 12"/>`); });
  // el puente: tablero de piedra con barandas sobre el río
  WORLD.roads.forEach((r,k)=>{ if(RINFO[k].k!=='puente') return; const A=WORLD.site[r.a],B=WORLD.site[r.b]; const m=qpt(A,r.c,B,0.5); let dx=B[0]-A[0],dy=B[1]-A[1]; const L=Math.hypot(dx,dy)||1; dx/=L; dy/=L; const hl=40, px=-dy, py=dx;
    const p1=[m[0]-dx*hl,m[1]-dy*hl], p2=[m[0]+dx*hl,m[1]+dy*hl];
    h+=`<path d="M${f1(p1[0])},${f1(p1[1])} L${f1(p2[0])},${f1(p2[1])}" stroke="${INK}" stroke-width="30" stroke-linecap="butt"/><path d="M${f1(p1[0])},${f1(p1[1])} L${f1(p2[0])},${f1(p2[1])}" stroke="#C9C2B4" stroke-width="24" stroke-linecap="butt"/>`
      +[-1,1].map(sg=>`<path d="M${f1(p1[0]+px*13*sg)},${f1(p1[1]+py*13*sg)} L${f1(p2[0]+px*13*sg)},${f1(p2[1]+py*13*sg)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`).join(''); });
  // — Dos capas (29/10/2026): el FONDO (bosque, parcelas, ríos, caminos y niebla) no cambia nunca y queda quieto; lo VIVO (marcadores de camino, nubes, zonas con sus figuras y placas)
  //   va en otro SVG encima, en su propia capa de la tarjeta gráfica. Así las animaciones solo repintan lo vivo y no los ~5.000 elementos del fondo.
  if(!mesa) h+=`<rect x="${B.x0}" y="${B.y0}" width="${WORLD.W}" height="${WORLD.H}" fill="url(#fog)" pointer-events="none"/>`;
  const back=h; h=flowH;
  // marcadores: qué tipo de camino es y, donde no hay paso, qué lo impide
  WORLD.roads.forEach((r,k)=>{ const m=qpt(WORLD.site[r.a],r.c,WORLD.site[r.b],0.5); h+=connMarker(m[0],m[1],RINFO[k],true); });
  WORLD.edges.filter(e=>!e.road).forEach(e=>{ const m=[(e.p[0][0]+e.p[1][0])/2,(e.p[0][1]+e.p[1][1])/2]; h+=connMarker(m[0],m[1],noPassInfo(e.a,e.b),false); });
  if(!mesa) for(let k=0;k<6;k++){ const r=mulberry32(300+k); const cx=B.x0+r()*WORLD.W, cy=B.y0+r()*WORLD.H; h+=`<g class="cloud" style="animation-delay:${-k*9}s"><ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${90+r()*60}" ry="26" fill="rgba(0,0,0,.07)"/><ellipse cx="${f1(cx+40)}" cy="${f1(cy-14)}" rx="60" ry="22" fill="rgba(0,0,0,.07)"/></g>`; }
  h+=`<g id="zonesT">`;
  [...Z.keys()].sort((a,b)=>sy(a)-sy(b)).forEach(i=>{
    h+=`<g class="zone" data-id="${i}" tabindex="0" role="button" transform="translate(${f1(sx(i))},${f1(sy(i))})"><polygon class="hit" points="${ptsStr(WORLD.poly[i])}" fill="transparent"/><g class="own"></g><g class="dyn"></g><g class="mvb" role="button" aria-label="Ir a esta zona" style="transform:translate(-120px,-60px) scale(calc(var(--inv,1)*.7))"><title>Ir a esta zona</title><circle r="27" fill="#2F8F4F" stroke="#fff" stroke-width="4"/><path d="M-11,2 H8 M1,-8 L11,2 L1,12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`
     +`<polygon class="ov ov-tgt march" points="${ptsStr(WORLD.poly[i],0.97)}" fill="rgba(255,255,255,.12)" stroke="#fff" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round"/>`
     +`<polygon class="ov ov-mv" points="${ptsStr(WORLD.poly[i],0.98)}" fill="rgba(124,224,160,.16)" stroke="#7CE0A0" stroke-width="6" stroke-linejoin="round"/>`
     +`<polygon class="ov ov-sel selp" points="${ptsStr(WORLD.poly[i],0.985)}" fill="none" stroke="#FFE27A" stroke-width="7" stroke-linejoin="round"/></g>`;
  });
  h+=`</g>`;
  $('worldB').innerHTML=back; $('worldT').innerHTML=h;
  ['terrB','terr'].forEach(id=>{ const svg=$(id); svg.setAttribute('viewBox',`${f1(B.x0)} ${f1(B.y0)} ${WORLD.W} ${WORLD.H}`); svg.setAttribute('width',WORLD.W); svg.setAttribute('height',WORLD.H); });
  ZG=[]; document.querySelectorAll('#zonesT g.zone').forEach(g=>{ ZG[Number(g.dataset.id)]={g,own:g.querySelector('.own'),dyn:g.querySelector('.dyn'),sig:null}; });
  $('ordT').innerHTML=''; ui.ordSig='';
}
function zoneSig(z,i){
  let s=[z.owner,z.size,z.conflict?1:0,z.res||'',Math.floor(z.prog),z.resO||''].join('|');
  for(const f in z.units){ const us=z.units[f]; const by={}; us.forEach(u=>{ by[u.t]=(by[u.t]||0)+(u.w>0?0.01:1); }); s+='|u'+f+':'+Object.keys(by).sort().map(k=>k+by[k]).join(','); }
  if(isPl(z.owner)){ const sp=zoneSpec(G,z,z.owner); s+='|sp'+sp.spec+sp.lvl; }
  z.b.forEach(b=>{ s+='|b'+b.t+b.l+(b.s||''); }); z.proj.forEach(p=>{ s+='|p'+Math.round(100*(p.tot-p.left)/p.tot); });
  if(z.tspec) s+='|t'+z.tspec;
  if(z.owner===ME) s+='|r'+Math.floor(z.food)+','+Math.floor(z.prod)+','+growETA(G,z);
  if((z.units[ME]||[]).some(u=>!UT[u.t].civ)&&z.owner!==ME) s+='|sup'+(((z.feed||{})[ME]||{}).line)+((z.units[ME]||[]).some(u=>u.hg>0)?'!':'');
  if((G.tributes||[]).some(t=>t.zone===z.id&&!t.paid[ME])) s+='|tr';
  if(G.F[ME].enc&&G.F[ME].enc.zone===z.id) s+='|enc'+G.F[ME].enc.step;
  { let hg=0; for(const f in z.units) z.units[f].forEach(u=>{ if(u.hg>0) hg++; }); if(hg) s+='|hg'+hg; }
  if(z.res||z.resO) s+='|rh'+resBonus(z,'plata')+resBonus(z,'oro')+(z.owner);
  if(z.role==='frontera') s+='|fg'+JSON.stringify(z.frontGain||{});
  return s+'|'+slotsOf(G,z);
}
function updateTerritory(){
  const Z=G.zones, sel=ui.sel!==null?Z[ui.sel]:null; const canMove=sel&&(sel.units[ME]||[]).length>0;
  Z.forEach((z,i)=>{
    const e=ZG[i]; if(!e) return; const sig=zoneSig(z,i);
    if(e.sig!==sig){
      e.sig=sig; e.dyn.innerHTML=zoneContent(z,i); lifeBind(i,e.dyn);
      e.own.innerHTML=z.role==='frontera'?`<polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="#E9C46A" fill-opacity=".10" stroke="#C9A24A" stroke-width="5" stroke-dasharray="18 10" stroke-linejoin="round"/>`:isPl(z.owner)?`<polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="${PLN[z.owner].col}" fill-opacity=".10" stroke="${PLN[z.owner].col}" stroke-width="6" stroke-linejoin="round" opacity=".95"/>`:(z.owner===TRIBE?`<polygon points="${ptsStr(WORLD.poly[i],0.955)}" fill="none" stroke="#5E3B24" stroke-width="4" stroke-dasharray="14 10" stroke-linejoin="round"/>`:'');
      const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':'Zona libre';
      e.g.setAttribute('aria-label',`${zname(z)}, ${rn}, ${TERRN[z.terrain]}, dueño: ${z.owner===null?'sin dueño':PLN[z.owner].name}`);
    }
    e.g.classList.toggle('sel',!!sel&&sel.id===i);
    e.g.classList.toggle('tgt',!!canMove&&sel.adj.includes(i));
    e.g.classList.toggle('mvto',!!ui.mv&&ui.mv.to===i);
  });
  drawOrderPreview();
}
// Cosas del suelo donde trabaja la gente del pueblo vivo: campo de cultivo, pila de leña y piedra, blanco de tiro.
function groundDecor(z,stg,fo){
  const n=t=>fo.filter(u=>u.t===t).length; let h='';
  const near=(bt,dx,dy,fb)=>{ const b=stg.bld[bt]; const p=b?[b[0]+dx,b[1]+dy]:fb; return [Math.max(-150,Math.min(150,p[0])),Math.max(70,Math.min(165,p[1]))]; };
  if(n('agr')>0){
    const a=near('molino',-40,38,[-150,104]); const rows=Math.min(4,1+Math.ceil(n('agr')/2)); const w=84, hgt=rows*10+6; stg.field=[a[0],a[1],w,hgt];
    h+=`<g class="field"><rect x="${f1(a[0])}" y="${f1(a[1])}" width="${w}" height="${hgt}" rx="6" fill="#8C6A3E" opacity=".55" stroke="${INK}" stroke-width=".8" stroke-opacity=".5"/>`;
    for(let r=0;r<rows;r++){ const y=a[1]+8+r*10; h+=`<path d="M${f1(a[0]+5)},${f1(y)} H${f1(a[0]+w-5)}" stroke="#5E3E29" stroke-width="1.2" opacity=".7"/>`; for(let c=0;c<8;c++){ const x=a[0]+9+c*10; h+=`<path d="M${f1(x)},${f1(y)} v-5 M${f1(x-2)},${f1(y)} l-1.6,-3.6 M${f1(x+2)},${f1(y)} l1.6,-3.6" stroke="#8DB04A" stroke-width="1.3" stroke-linecap="round"/>`; } }
    h+=`</g>`; }
  if(n('ing')>0){
    const p=near('taller',-42,26,[150,110]); stg.pile=[p[0],p[1]];
    h+=`<g transform="translate(${f1(p[0])},${f1(p[1])})"><ellipse cy="3" rx="16" ry="4" fill="rgba(0,0,0,.2)"/><rect x="-14" y="-3" width="22" height="5" rx="2.2" fill="#8A5A3A" stroke="${INK}" stroke-width=".7"/><rect x="-11" y="-8" width="20" height="5" rx="2.2" fill="#A06A42" stroke="${INK}" stroke-width=".7"/><rect x="-7" y="-13" width="14" height="5" rx="2.2" fill="#8A5A3A" stroke="${INK}" stroke-width=".7"/><path d="M10,2 L12,-5 L18,-7 L22,-2 L21,3 Z" fill="#9A9285" stroke="${INK}" stroke-width=".7"/></g>`; }
  if(MIL.some(t=>n(t)>0&&t!=='ari'&&t!=='lan')){
    const p=near('cuartel',46,40,[148,128]); stg.target=[p[0],p[1]];
    h+=`<g transform="translate(${f1(p[0])},${f1(p[1])})"><ellipse cy="3" rx="12" ry="3" fill="rgba(0,0,0,.2)"/><path d="M-6,2 L-1,-14 M6,2 L1,-14" stroke="#6B4528" stroke-width="2.2" stroke-linecap="round"/><circle cy="-20" r="10" fill="#F3EEDF" stroke="${INK}" stroke-width="1"/><circle cy="-20" r="6.6" fill="#C8452F"/><circle cy="-20" r="3.4" fill="#F3EEDF"/><circle cy="-20" r="1.3" fill="#C8452F"/></g>`; }
  return h;
}
function zoneContent(z,i){
  const owner=z.owner; const roof=isPl(owner)?PLN[owner].col:(owner===TRIBE?PLN[TRIBE].col:'#8B7B6B'); const wall=WALLS[i%4];
  const fo=(owner!==null)?(z.units[owner]||[]):[]; const civ=fo.filter(u=>UT[u.t].civ).length;
  let d='';
  const stg=LIFE_STAGE[i]={houses:[],bld:{},blocks:[]};   // escenario del pueblo vivo (vida.js)
  if(isPl(owner)){ z.b.forEach((b,k)=>{ const p=SLOT_POS[k%SLOT_POS.length]; if(!stg.bld[b.t]) stg.bld[b.t]=[p[0],p[1]]; stg.blocks.push([p[0]-24,p[1]-64,p[0]+24,p[1]+3]); });
    z.proj.forEach((p,k)=>{ const sl=SLOT_POS[(z.b.length+k)%SLOT_POS.length]; stg.blocks.push([sl[0]-24,sl[1]-64,sl[0]+24,sl[1]+3]); }); }
  d+=groundDecor(z,stg,fo);
  if(z.role==='capital'){ d+=`<g transform="scale(2.1)">${church(-6,6,roof)}</g><g transform="scale(1.6)">${house(-52,34,roof,wall,15)}${house(52,30,roof,WALLS[(i+1)%4],14)}</g>`; stg.houses.push([-83,54],[83,48]); stg.blocks.push([-46,-74,22,16],[-96,24,-70,56],[70,20,96,50]); }
  else if(z.role==='tribu'){ stg.blocks.push([-82,-26,-22,24],[18,-30,72,22],[-34,-8,32,52]); const cloth=(owner===TRIBE||owner===null)?PLN[TRIBE].col:PLN[owner].col; d+=`<g transform="scale(1.7)">${tent(-30,12,cloth)}${tent(26,10,cloth)}${tent(-2,26,cloth)}${totem(0,-6)}</g><g transform="translate(0,52)"><ellipse rx="9" ry="4" fill="#3a2418"/><path class="flame" d="M-4,0 Q0,-18 4,0 Z" fill="#E8765F"/><path class="flame f2" d="M-2,0 Q0,-11 2,0 Z" fill="#FFE27A"/></g>`; }
  else if(z.role==='frontera'){
    const here=presentF(z).filter(isPl); const cols=here.length?here.map(f=>PLN[f].col):['#B8A58C'];
    d+=`<g transform="translate(0,-10)"><rect x="-9" y="-44" width="18" height="46" rx="3" fill="#A9A59C" stroke="${INK}" stroke-width="2"/><path d="M-9,-30 H9 M-9,-16 H9" stroke="#8C857C" stroke-width="2"/></g>`;
    cols.forEach((c,k)=>{ const x=-70+k*140/(Math.max(1,cols.length-1)||1)*(cols.length>1?1:0)+(cols.length===1?70:0); d+=`<g transform="translate(${f1(cols.length===1?-48:x)},20)"><path d="M0,0 V-64" stroke="#5E3E29" stroke-width="3"/><path class="flag" d="M0,-64 L34,-54 L0,-44 Z" fill="${c}" stroke="${INK}" stroke-width="1.5"/></g>`; });
    d+=`<g transform="scale(1.6)">${tent(-34,34,'#C9A24A')}${tent(30,36,'#B8433A')}</g>`;
    stg.blocks.push([-84,-8,-26,58],[28,-6,86,60],[-12,-62,12,2]);
    if(z.frontGain){ const fs=Object.keys(z.frontGain); if(fs.length) d+=`<g class="lbl" style="transform:translate(0px,-84px) scale(var(--inv,1))"><rect x="-80" y="-14" width="160" height="26" rx="13" fill="#2A1B16" stroke="#E9C46A" stroke-width="2"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#E9C46A">🪙 +${z.frontGain[fs[0]]} ${fs.length>1?'a cada uno':'para uno'}</text></g>`; }
  }
  else if(isPl(owner)&&civ>0){ const hN=Math.min(5,Math.ceil(civ/2)); const P=[[-40,-4],[46,-8],[0,16],[-80,20],[84,16]]; d+=`<g transform="scale(1.7)">`; for(let k=0;k<hN;k++){ d+=house(P[k][0]/1.7,P[k][1]/1.7,roof,WALLS[(i+k)%4],13); stg.houses.push([P[k][0],P[k][1]]); stg.blocks.push([P[k][0]-14,P[k][1]-26,P[k][0]+14,P[k][1]+3]); } d+=`</g>`; }
  if(isPl(owner)){
    z.b.forEach((b,k)=>{ const p=SLOT_POS[k%SLOT_POS.length]; d+=`<g transform="translate(${p[0]},${p[1]}) scale(1.35)">${bGlyph(b.t,b.l,true)}</g>`; });
    z.proj.forEach((p,k)=>{ const sl=SLOT_POS[(z.b.length+k)%SLOT_POS.length]; const pc=Math.round(100*(p.tot-p.left)/p.tot); const nm=p.k==='b'?p.bt:p.k==='w'?'mar':(z.b[p.bi]?z.b[p.bi].t:'almacen'); d+=`<g transform="translate(${sl[0]},${sl[1]})"><g opacity=".38" transform="scale(1.35)">${bGlyph(nm,0,false)}</g><rect x="-28" y="-62" width="56" height="9" rx="4" fill="#2A1B16" stroke="#fff" stroke-width="1"/><rect x="-26" y="-60" width="${(52*pc/100).toFixed(1)}" height="5" rx="2.5" fill="#7CE0A0"/><text class="zt" x="0" y="-67" text-anchor="middle" font-size="12" font-weight="700" fill="#2A1B16" stroke="#fff" stroke-width="3" paint-order="stroke">${p.k==='u'?'mejora':'obra'} ${pc}%</text></g>`; });
  }
  if(isPl(owner)&&z.proj.length){ const sl=SLOT_POS[z.b.length%SLOT_POS.length];
    if(z.pauseBuild) d+=`<g transform="translate(${sl[0]+36},${sl[1]-58})"><circle r="12" fill="#2A1B16" stroke="#7FB2E5" stroke-width="2.5"/><path d="M-3.8,-5.5 V5.5 M3.8,-5.5 V5.5" stroke="#7FB2E5" stroke-width="3.2" stroke-linecap="round"/></g>`;
    else if(z.bplan&&z.bplan.cap>0){ d+=`<g transform="translate(${sl[0]},${sl[1]-34})">`; for(let k=0;k<5;k++) d+=`<circle class="spk" r="2.1" fill="${k%2?'#FFD36B':'#FFB04D'}" style="--dx:${(k-2)*9}px;animation-delay:${(k*0.23).toFixed(2)}s"/>`; d+=`</g>`; } }
  if(isPl(owner)&&z.last&&owner===ME){   // lo que produce la zona sube como partículas de su color
    const AC={food:'#B7DE7A',prod:'#D9B48A',gold:'#F2D06B',tech:'#8EC3F0'}; let k=0;
    ['food','prod','gold','tech'].forEach(r=>{ const n=Math.min(4,Math.ceil((z.last[r]||0)/3)); for(let j=0;j<n;j++,k++){ const x=-96+((k*53)%192), y=34+((k*29)%46);
      d+=`<circle class="mote" cx="${x}" cy="${y}" r="${r==='gold'?3:2.4}" fill="${AC[r]}" stroke="rgba(42,27,22,.5)" stroke-width=".6" style="animation-delay:${((k*0.67)%5.5).toFixed(2)}s;animation-duration:${(4.6+(k%3)*0.7).toFixed(1)}s"/>`; } }); }
  const fs=Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).sort((a,b)=>(a===owner?-1:0)-(b===owner?-1:0));
  if(fs.length) d+=figRows(z,fs[0],PLN[fs[0]].col);
  fs.slice(1,3).forEach((f,r)=>{ const k=unitCounts(z,f), col=PLN[f].col; const y=186+r*26;
    d+=`<g transform="translate(0,${y})"><rect x="-70" y="-12" width="140" height="24" rx="12" fill="#2A1B16" stroke="${col}" stroke-width="3"/><text class="zt" x="0" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#FBF8F2">${esc(PLN[f].name)}: ${k.c} civ · ${k.m} mil</text></g>`; });
  if(z.conflict) d+=`<g class="clash" transform="translate(0,-8)"><circle r="24" fill="#C8452F" stroke="${INK}" stroke-width="2"/><path d="M-12,-12 L12,12 M12,-12 L-12,12" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;
  let s=`<g class="detail">${d}</g>`;
  zoneDeps(z).forEach((d,di)=>{ const r=RES[d.k], own=isPl(z.owner), rc=own?PLN[z.owner].col:'#fff', k=RES_YIELD[d.k], T=RES_TIER[d.tier], gx=di?-118:118;
    s+=`<g class="lbl" style="transform:translate(${gx}px,-96px) scale(var(--inv,1))"><circle r="22" fill="${r.col}" stroke="${rc}" stroke-width="5"/><circle r="27" fill="none" stroke="${d.tier==='oro'?'#F2CF5B':'#C3CAD1'}" stroke-width="3" stroke-dasharray="${d.tier==='oro'?'0':'5 4'}"/><text class="zt" text-anchor="middle" y="7" font-size="21">${r.ic}</text><text class="zt" x="16" y="-14" font-size="15">${T.ic}</text><rect x="-54" y="31" width="108" height="${own?34:20}" rx="8" fill="#2A1B16" stroke="${rc}" stroke-width="2"/><text class="zt" text-anchor="middle" y="45" font-size="12" font-weight="700" fill="#FBF8F2">${esc(r.n)}</text>${own?`<text class="zt" text-anchor="middle" y="60" font-size="11.5" font-weight="700" fill="#FFE27A">${IMP_ICON[k]} +${resBonus(z,d.tier)} por paso</text>`:''}</g>`; });
  s+=nameplate(z,i);
  return s;
}
const ROMAN=['','I','II','III'];
// Sello de cera con el color del dueño (la capital lleva estrella)
function waxSeal(col,cap,r){
  const R=[1,.93,1.07,.96,1.05,.92,1.06,.95,1.04,.94,1.08,.97]; let pts=''; R.forEach((k,n)=>{ const a=n/12*Math.PI*2; pts+=f1(Math.cos(a)*r*k)+','+f1(Math.sin(a)*r*k)+' '; });
  const star=cap?`<path d="M0,-8.4 l2.4,5.2 5.7,.7 -4.2,3.9 1.1,5.7 -5,-2.8 -5,2.8 1.1,-5.7 -4.2,-3.9 5.7,-.7z" fill="rgba(0,0,0,.28)" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>`:`<path d="M0,-7 l6,7 -6,7 -6,-7z" fill="rgba(0,0,0,.26)" stroke="rgba(255,255,255,.3)" stroke-width=".8"/>`;
  return `<g class="seal"><polygon points="${pts}" fill="${col}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle r="${f1(r*.66)}" fill="rgba(255,255,255,.07)" stroke="rgba(0,0,0,.3)" stroke-width="1.6"/>${star}<path d="M${f1(-r*.55)},${f1(-r*.45)} A${f1(r*.7)},${f1(r*.7)} 0 0 1 ${f1(-r*.1)},${f1(-r*.72)}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-linecap="round"/></g>`;
}
function nameplate(z,i){
  let s=nameplateBase(z,i); if(MAPSTYLE!=='mesa') return s;
  // placa de papel: fondo crema, texto de tinta, cinta adhesiva y el sello del dueño
  const m=s.match(/<rect x="([-0-9.]+)" y="-27" width="([0-9.]+)" height="([0-9.]+)" rx="15" fill="#2A1B16" stroke="[^"]+" stroke-width="4"\/>/);
  s=s.replace(/(<rect x="[-0-9.]+" y="-27" width="[0-9.]+" height="[0-9.]+" rx="15") fill="#2A1B16" stroke="[^"]+" stroke-width="4"\/>/,'$1 fill="#F3E7CF" stroke="#2A1B16" stroke-width="3.6"/>').replace(/#FBF8F2/g,'#2A1B16').replace(/#D9CDB8/g,'#6B5B50').replace(/#C9E59A/g,'#3F7A2A').replace(/#E6C9A8/g,'#7A4A22').replace(/#F0A06B/g,'#B3541E').replace(/rgba\(255,255,255,\.18\)/g,'rgba(0,0,0,.14)').replace(/#9DC764/g,'#4E8C34');
  if(m){ const L=parseFloat(m[1]), W=parseFloat(m[2]); const tape=`<rect x="${f1(L+W/2-20)}" y="-35" width="40" height="12" fill="rgba(226,196,120,.85)" stroke="rgba(42,27,22,.35)" stroke-width="1" transform="rotate(-2 ${f1(L+W/2)} -29)"/>`;
    const seal=(z.owner!==null)?`<g transform="translate(${f1(L-8)},-16)">${waxSeal(z.owner===TRIBE?PLN[TRIBE].col:PLN[z.owner].col,z.role==='capital',17)}</g>`:'';
    s=s.replace(/(<g class="lbl"[^>]*>)/,'$1'+tape).replace(/<\/g>$/,seal+'</g>'); }
  return s;
}
function nameplateBase(z,i){
  const owner=z.owner, col=owner===null?'#8B7B6B':PLN[owner].col; const sp=zspec(z); const mine=ownPop(z);
  const vis=(owner!==TRIBE)||tribeVisibleFor(z); const own=owner===ME;
  const slots=isPl(owner)?slotsOf(G,z):0; const built=z.b.length, inProg=z.proj.filter(p=>p.k!=='u').length;
  const nm=zname(z); const w=Math.max(own?268:230,66+nm.length*8.6), L=-w/2, H=own?76:58;
  let pips=''; for(let k=0;k<Math.min(slots,8);k++){ const x=L+150+k*13; const st=k<built?'b':(k<built+inProg?'p':'f'); const bc=st==='b'?BT[z.b[k].t].col:null; pips+=`<rect x="${f1(x)}" y="12" width="10" height="10" rx="2" fill="${st==='b'?bc:st==='p'?'#7FB2E5':'none'}" stroke="${st==='f'?'#9A8F80':'#fff'}" stroke-width="1.6" ${st==='f'?'stroke-dasharray="2.5 2"':''}/>`; }
  const lv=(sp.lvl>0&&!['bas','free','tri'].includes(sp.sp))?sp.lvl:0;
  let s=`<g class="lbl" style="transform:translate(0px,-150px) scale(calc(var(--inv,1)*.82))"><rect x="${f1(L)}" y="-27" width="${f1(w)}" height="${H}" rx="15" fill="#2A1B16" stroke="${col}" stroke-width="4"/>`
   +`<g transform="translate(${f1(L+24)},1)">${emblem(sp.sp,21)}</g>`
   +(lv?`<g transform="translate(${f1(L+40)},-14)"><circle r="10" fill="#FFE27A" stroke="#2A1B16" stroke-width="2"/><text class="zt" text-anchor="middle" y="4" font-size="${lv===3?9:11}" font-weight="800" fill="#2A1B16">${ROMAN[lv]}</text></g>`:'')
   +`<text class="zt" x="${f1(L+50)}" y="-8" font-size="15" font-weight="700" fill="#FBF8F2">${esc(nm)}</text>`
   +`<text class="zt" x="${f1(L+50)}" y="6" font-size="10.5" fill="#D9CDB8">${esc(sp.lab)}${lv?' (nivel '+lv+')':''}${z.role==='capital'?' · Capital':''} · ${TERRN[z.terrain]}</text>`
   +`<g transform="translate(${f1(L+54)},20)">${iconCiv(0,0,col)}</g><text class="zt" x="${f1(L+63)}" y="24" font-size="13" font-weight="700" fill="#FBF8F2">${vis?mine:'?'}</text><text class="zt" x="${f1(L+81)}" y="24" font-size="10" fill="#D9CDB8">pob.</text>`
   +`<text class="zt" x="${f1(L+106)}" y="24" font-size="13" font-weight="700" fill="#FBF8F2">${z.size}</text><text class="zt" x="${f1(L+119)}" y="24" font-size="10" fill="#D9CDB8">tam.</text>`
   +pips;
  if(own){
    const cf=capStore(G,z,'food'), cp=capStore(G,z,'prod'), eta=growETA(G,z);
    const prog=Math.min(1,z.prog/growCost(G,owner,z));
    s+=`<text class="zt" x="${f1(L+14)}" y="42" font-size="12.5" font-weight="700" fill="#C9E59A">🌾 ${Math.floor(z.food)}<tspan font-size="10" font-weight="400" fill="#D9CDB8">/${cf}</tspan></text>`
      +`<text class="zt" x="${f1(L+86)}" y="42" font-size="12.5" font-weight="700" fill="#E6C9A8">⚒ ${Math.floor(z.prod)}<tspan font-size="10" font-weight="400" fill="#D9CDB8">/${cp}</tspan></text>`
      +`<text class="zt" x="${f1(L+w-12)}" y="42" text-anchor="end" font-size="11.5" font-weight="700" fill="${eta===null?'#F0A06B':'#9DC764'}">${eta===undefined?'👶 —':eta===null?'👶 no crece':'👶 en '+eta+(eta===1?' paso':' pasos')}</text>`
      +`<rect x="${f1(L+10)}" y="${H-35}" width="${f1(w-20)}" height="4" rx="2" fill="rgba(255,255,255,.18)"/><rect x="${f1(L+10)}" y="${H-35}" width="${((w-20)*prog).toFixed(1)}" height="4" rx="2" fill="#9DC764"/>`;
  }
  if(own){ const hung=(z.feed&&z.feed[ME]&&z.feed[ME].short>0)||(z.units[ME]||[]).some(u=>u.hg>0); let bx=L+w-10;
    if(hung){ s+=`<g class="hunger" transform="translate(${f1(bx)},-27)"><circle r="11" fill="#C8452F" stroke="#fff" stroke-width="2"/><text class="zt" text-anchor="middle" y="4.5" font-size="13" font-weight="800" fill="#fff">!</text><title>Hay gente con hambre</title></g>`; bx-=26; }
    if(z.pauseBuild&&z.proj.length) s+=`<g transform="translate(${f1(bx)},-27)"><circle r="11" fill="#2A1B16" stroke="#7FB2E5" stroke-width="2.2"/><path d="M-3.4,-5 V5 M3.4,-5 V5" stroke="#7FB2E5" stroke-width="3" stroke-linecap="round"/><title>Obras en pausa: la producción se guarda</title></g>`; }
  const tr=(G.tributes||[]).find(t=>t.zone===z.id&&!t.paid[ME]&&t.targets.includes(ME));
  const en=G.F[ME].enc; if(en&&en.zone===z.id&&!tr) s+=`<g transform="translate(0,-44)"><rect x="-86" y="-14" width="172" height="26" rx="13" fill="${en.k==='amenaza'?'#C8452F':'#C9A24A'}" stroke="#fff" stroke-width="2.5" class="blink"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${en.k==='amenaza'?'⚠':'📜'} Encuentro: decide en el panel</text></g>`;
  if(tr) s+=`<g transform="translate(0,-44)"><rect x="-104" y="-14" width="208" height="26" rx="13" fill="${tr.due-G.step+1<=2?'#C8452F':'#8A5A3A'}" stroke="#fff" stroke-width="2.5"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">🤝 Pide ${tr.amount} de ${TSPEC_N[tr.res]} · quedan ${tr.due-G.step+1}</text></g>`;
  return s+`</g>`;
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
    h+=`<path d="${d}" stroke="#fff" stroke-width="13" fill="none" stroke-linecap="round" opacity=".85"/><path d="${d}" stroke="${col}" stroke-width="8" fill="none" stroke-dasharray="16 11" stroke-linecap="round" class="march"/>`;
    // flecha a ~82% del camino
    const t=0.82, P=qpt(A,C,B,t), Q=qpt(A,C,B,t-0.04); h+=arrowAt(P,Q,col,21);
    if(k===hops.length-2) midPt=qpt(A,C,B,0.3);
  }
  const parts=[]; Object.keys(u||{}).forEach(t=>{ if(u[t]>0) parts.push([t,u[t]]); });
  const civ=parts.filter(p=>CIV.includes(p[0])).reduce((a,p)=>a+p[1],0), mil=parts.filter(p=>!CIV.includes(p[0])).reduce((a,p)=>a+p[1],0);
  const lbl=(civ?civ+' civ.':'')+(civ&&mil?' + ':'')+(mil?mil+' mil.':'');
  const oro=moveGold(u,hops.length-1);
  if(midPt) h+=`<g class="lbl" style="transform:translate(${f1(midPt[0])}px,${f1(midPt[1])}px) scale(calc(var(--inv,1)*.8))"><rect x="-76" y="-25" width="152" height="50" rx="18" fill="${col}" stroke="#fff" stroke-width="3"/><text class="zt" x="0" y="-8" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${!contested?'➜ Mover':(stance==='ataque'?'⚔ Ataque':'☮ Paz')}</text><text class="zt" x="0" y="5" text-anchor="middle" font-size="12" fill="#fff">${esc(lbl)}</text><text class="zt" x="0" y="18" text-anchor="middle" font-size="12" font-weight="700" fill="#FFE27A">${oro?'🪙 '+oro:'gratis'}</text></g>`;
  return h;
}
// Líneas de suministro de tus tropas fuera de casa: verde si llega la comida, rojo si está cortada.
function supplyLinesHTML(){
  let h='';
  G.zones.forEach((z,i)=>{
    const us=z.units[ME]||[]; if(!us.length||z.owner===ME) return;
    const mil=us.filter(u=>!UT[u.t].civ).length; if(!mil) return;
    const fd=(z.feed||{})[ME]; const src=fd?fd.line:(supplySources(G,ME,i)[0]!==undefined?supplySources(G,ME,i)[0]:null);
    const hambre=us.some(u=>u.hg>0);
    if(src===null||src===undefined){
      h+=`<g class="lbl" style="transform:translate(${f1(sx(i))}px,${f1(sy(i)+120)}px) scale(var(--inv,1))"><rect x="-92" y="-14" width="184" height="26" rx="13" fill="#C8452F" stroke="#fff" stroke-width="2.5" class="blink"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">⚠ Sin suministros</text></g>`;
      return;
    }
    const col=hambre?'#C8452F':'#9DC764';
    const path=ownPath(G,ME,src,i,6)||[i];
    let prev=src;
    path.forEach(n=>{ const {A,B,C}=hopPts(prev,n); h+=`<path d="M${f1(A[0])},${f1(A[1])} Q${f1(C[0])},${f1(C[1])} ${f1(B[0])},${f1(B[1])}" stroke="${col}" stroke-width="7" fill="none" stroke-dasharray="4 16" stroke-linecap="round" class="march" opacity=".9"/>`; prev=n; });
    const m=hopPts(src,path[0]); const p=qpt(m.A,m.C,m.B,0.5);
    h+=`<g class="lbl" style="transform:translate(${f1(p[0])}px,${f1(p[1])}px) scale(var(--inv,1))"><rect x="-54" y="-13" width="108" height="24" rx="12" fill="#2A1B16" stroke="${col}" stroke-width="2"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="12" font-weight="700" fill="${col}">🍞 suministro</text></g>`;
  });
  return h;
}
function drawOrderPreview(){
  const g=$('ordT'); if(!g||!ui) return; let h=''; const Z=G.zones;
  ui.orders.forEach(o=>{
    if(o.t==='move') h+=`<g class="oprev">${moveArrowSVG(o.from,o.to,o.via,o.u,o.stance)}</g>`;
    else if(o.t==='send'){ const {A,B,C}=hopPts(o.from,o.to); h+=`<path d="M${f1(A[0])},${f1(A[1])} Q${f1(C[0])},${f1(C[1])} ${f1(B[0])},${f1(B[1])}" stroke="#E0A21B" stroke-width="9" stroke-dasharray="4 14" fill="none" stroke-linecap="round" class="march"/>`; }
    else if(o.zone!==undefined){ const i=o.zone; const lab={build:'obra',upgrade:'mejora',wonder:'maravilla',train:'entrena',spec:'especializa',bspec:'especializa edif.',demolish:'demoler',annex:'anexar'}[o.t]; if(lab) h+=`<g class="oprev lbl" style="transform:translate(${f1(sx(i))}px,${f1(sy(i)-205)}px) scale(var(--inv,1))"><rect x="-58" y="-13" width="116" height="24" rx="12" fill="#3B7DDD" stroke="#fff" stroke-width="2"/><text class="zt" x="0" y="4" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">⏳ ${lab}</text></g>`; }
  });
  if(ui.mv){ const o=ui.mv; const u={}; CIV.concat(MIL).forEach(t=>{ const n=Number(fv('mv_'+t,0))||0; if(n>0) u[t]=n; }); const via=fv('mv_via','')===''?[]:[Number(fv('mv_via',''))]; h+=`<g class="oprev">${moveArrowSVG(o.from,o.to,via,u,o.st)}</g>`; }
  h+=supplyLinesHTML();
  const sig=h; if(ui.ordSig!==sig){ ui.ordSig=sig; g.innerHTML=h; }
}

/* ---------- cámara: transformación CSS ---------- */
function vpRect(){ return $('vp').getBoundingClientRect(); }
function applyView(){
  const r=CAM; if(!r.vw) return; const B=WORLD.bounds; const k=r.vw/VIEW.w; r.k=k;
  const tx=-(VIEW.x-B.x0)*k, ty=-(VIEW.y-B.y0)*k;
  $('cam').style.transform=`translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${k.toFixed(4)})`;
  const inv=Math.max(0.45,Math.min(1.4,0.8/k));   // los rótulos (placas, flechas, recursos) no crecen tanto al alejar el mapa ni se agrandan al acercar if(Math.abs(inv-CAM.inv)>0.01){ CAM.inv=inv; $('terr').style.setProperty('--inv',inv.toFixed(3)); }
  const far=k<0.5; if(far!==CAM.far){ CAM.far=far; $('terr').classList.toggle('far',far); $('terrB').classList.toggle('far',far); }
  clearTimeout(CAM.reT); CAM.reT=setTimeout(()=>{ const c=$('cam'), v=$('terr'); c.style.willChange='auto'; v.style.willChange='auto'; void c.offsetWidth; c.style.willChange='transform'; v.style.willChange='transform'; },160);   // al terminar un zoom se vuelve a pintar a la escala nueva (fondo y capa viva)
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
function fitAll(ms){ if(ui&&ui.view==='plan'){ planFit(ms); return; } const B=WORLD.bounds; const w=Math.max(WORLD.W,WORLD.H/VIEW.ratio); flyTo((B.x0+B.x1)/2,(B.y0+B.y1)/2,w*1.02,ms); }
function goZone(i,w,ms){ if(ui&&ui.view==='plan'){ const z=G.zones[i]; planFly(zx(z),zy(z),Math.min(PV.w,620),ms===undefined?650:ms); return; } flyTo(sx(i),sy(i)+20,w||820,ms===undefined?650:ms); }
function myCapital(){ const z=G.zones.find(z=>z.capital&&z.sector===ME); return z?z.id:0; }

/* ---------- minimapa (solo se redibuja si cambia algo) ---------- */
function drawMini(){
  const sig=G.zones.map(z=>z.owner+(z.conflict?'c':'')).join(',')+'|'+G.step+'|'+MAPSTYLE; if(ui.miniSig===sig) return; ui.miniSig=sig;
  const B=WORLD.bounds, Z=G.zones; let h='';
  h+=`<rect x="${B.x0}" y="${B.y0}" width="${WORLD.W}" height="${WORLD.H}" fill="${MAPSTYLE==='mesa'?'#3B7355':'#4E6B3C'}"/>`;
  Z.forEach((z,i)=>{ const col=isPl(z.owner)?PLN[z.owner].col:(z.owner===TRIBE?'#8A5A3A':TCOL[z.terrain]); h+=`<polygon transform="translate(${f1(sx(i))},${f1(sy(i))})" points="${ptsStr(WORLD.poly[i])}" fill="${col}" stroke="#2A1B16" stroke-width="10"/>`; });
  WORLD.edges.filter(e=>!e.road).forEach(e=>{ h+=`<line x1="${f1(e.p[0][0])}" y1="${f1(e.p[0][1])}" x2="${f1(e.p[1][0])}" y2="${f1(e.p[1][1])}" stroke="#2A1B16" stroke-width="26"/>`; });
  WORLD.roads.forEach(r=>{ h+=`<path d="${r.d}" stroke="#F3E7C9" stroke-width="16" fill="none"/>`; });
  Z.forEach((z,i)=>{ if(z.capital) h+=`<text x="${f1(sx(i))}" y="${f1(sy(i)+22)}" text-anchor="middle" font-size="70" font-weight="700" fill="#fff" stroke="#2A1B16" stroke-width="8" paint-order="stroke">★</text>`; if(z.conflict) h+=`<circle cx="${f1(sx(i))}" cy="${f1(sy(i))}" r="90" fill="none" stroke="#fff" stroke-width="12" class="blink"/>`; });
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
  vp.addEventListener('pointerdown',e=>{ if(e.button!==0||e.target.closest('.mini,.vmode,.dpad')) return; DRAG={x:e.clientX,y:e.clientY,vx:VIEW.x,vy:VIEW.y,moved:false}; if(VIEW.anim){ cancelAnimationFrame(VIEW.anim); VIEW.anim=null; } });
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
    if(dx||dy){ const n=Math.hypot(dx,dy)||1; if(ui&&ui.view==='plan'){ const sp=PV.w*0.9*dt; PV.x+=dx/n*sp; PV.y+=dy/n*sp; planClamp(); planApply(); } else { const sp=VIEW.w*0.9*dt; VIEW.x+=dx/n*sp; VIEW.y+=dy/n*sp; clampView(); applyView(); } PANLOOP=requestAnimationFrame(step); }
    else PANLOOP=null;
  };
  PANLOOP=requestAnimationFrame(step);
}
