// @ts-check
'use strict';
// Crea una partida nueva a partir de un mapa, el número de jugadores y una semilla.

// Mapas más conectados: entre cada par de imperios vecinos (que hoy solo se tocan por sus tribus)
// se agrega una zona de frontera, unida a las dos tribus que se miran y a la zona libre más cercana de cada lado.
function addFrontiers(v,N){
  const n=v.n.map(x=>x.slice()), e=v.e.map(x=>x.slice()); const sec=s=>n.map((z,i)=>[z,i]).filter(([z])=>z[0]===s);
  // distancia de un punto a un segmento (para no unir zonas con caminos que pasen por encima de otra)
  const segD=(px,py,ax,ay,bx,by)=>{ const dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy||1; let t=((px-ax)*dx+(py-ay)*dy)/L; t=Math.max(0,Math.min(1,t)); return Math.hypot(px-(ax+t*dx),py-(ay+t*dy)); };
  let dmin=9; for(let i=0;i<n.length;i++) for(let j=i+1;j<n.length;j++) dmin=Math.min(dmin,Math.hypot(n[i][4]-n[j][4],n[i][5]-n[j][5]));
  // dos zonas pueden unirse sin pasar por otra si el círculo con diámetro entre ellas no contiene a ninguna otra
  // (criterio de Gabriel: así sus celdas se tocan y el camino solo cruza esas dos)
  const clear=(ax,ay,bx,by,skip)=>{ const cx=(ax+bx)/2, cy=(ay+by)/2, r=Math.hypot(ax-bx,ay-by)/2; return n.every((z,i)=>skip.includes(i)||Math.hypot(z[4]-cx,z[5]-cy)>r*1.05); };
  let k=0;
  for(let a=0;a<N;a++) for(let b=a+1;b<N;b++){
    if(!v.e.some(([x,y])=>(n[x][0]===a&&n[y][0]===b)||(n[x][0]===b&&n[y][0]===a))) continue;   // solo vecinos directos
    let best=9,pair=null; sec(a).forEach(([za,ia])=>sec(b).forEach(([zb,ib])=>{ const d=Math.hypot(za[4]-zb[4],za[5]-zb[5]); if(d<best){ best=d; pair=[ia,ib]; } }));
    if(!pair) continue;
    const A=n[pair[0]], B=n[pair[1]]; const mx=(A[4]+B[4])/2, my=(A[5]+B[5])/2;
    // candidatas: tribus de los dos lados y la zona libre más cercana de cada imperio
    const cands=s=>sec(s).filter(([z])=>z[2]===1||z[2]===2).map(([z,i])=>i);
    // se prueban posiciones alrededor del punto medio y se elige la que deja más caminos sin pasar por encima de otra zona
    let bestPos=null;
    for(let r=0;r<=1.0001;r+=0.125) for(let ang=0;ang<6.283;ang+=(r?0.3927:7)){
      const x=mx+Math.cos(ang)*best*r, y=my+Math.sin(ang)*best*r;
      const md=Math.min(...n.map(z=>Math.hypot(z[4]-x,z[5]-y))); if(md<dmin*0.85) continue;
      // tampoco encima de un camino que ya existe (salvo el que une a las dos tribus, que se va a reemplazar)
      if(e.some(([p,q])=>!((p===pair[0]&&q===pair[1])||(p===pair[1]&&q===pair[0]))&&segD(x,y,n[p][4],n[p][5],n[q][4],n[q][5])<dmin*0.5)) continue;
      const la=cands(a).filter(i=>clear(x,y,n[i][4],n[i][5],[i])&&Math.hypot(n[i][4]-x,n[i][5]-y)<best*2.2);
      const lb=cands(b).filter(i=>clear(x,y,n[i][4],n[i][5],[i])&&Math.hypot(n[i][4]-x,n[i][5]-y)<best*2.2);
      if(!la.length||!lb.length) continue;
      const score=Math.min(la.length,2)+Math.min(lb.length,2)-r*0.5;
      if(!bestPos||score>bestPos.score) bestPos={x,y,la,lb,score};
    }
    const id=n.length;
    const fx=bestPos?bestPos.x:mx, fy=bestPos?bestPos.y:my;
    n.push([-1,k,3,FRONTIER_TERRAINS[k%FRONTIER_TERRAINS.length],+fx.toFixed(3),+fy.toFixed(3)]); k++;
    if(bestPos){ [bestPos.la,bestPos.lb].forEach(L=>L.map(i=>[i,Math.hypot(n[i][4]-fx,n[i][5]-fy)]).sort((x,y)=>x[1]-y[1]).slice(0,2).forEach(([i])=>e.push([i,id]))); }
    if(!e.some(([x,y])=>x===id||y===id)) e.push([pair[0],id],[pair[1],id]);   // siempre conectada
    // el camino directo entre las dos tribus ahora pasa por la frontera (tribu → frontera → tribu)
    const di=e.findIndex(([x,y])=>(x===pair[0]&&y===pair[1])||(x===pair[1]&&y===pair[0]));
    if(di>=0){ e.splice(di,1); [pair[0],pair[1]].forEach(t=>{ if(!e.some(([x,y])=>(x===t&&y===id)||(x===id&&y===t))) e.push([t,id]); }); }
  }
  return {n,e};
}
/**
 * Crea una partida nueva.
 * @param {number} mapIdx índice del mapa (0 a 11)
 * @param {number} N jugadores (2 a 4)
 * @param {number} seed semilla del azar (misma semilla = misma partida)
 * @param {string} [thrMode] 'normal' o 'prueba'
 * @returns {Partida}
 */
function newGame(mapIdx,N,seed,thrMode){
  const rng=mulberry32(seed); const md=DATA.maps[mapIdx]; const v=addFrontiers(md.v[String(N)],N);
  /** @type {Zona[]} */
  const zones=v.n.map((n,i)=>({id:i,sector:n[0],k:n[1],role:['capital','tribu','vacia','frontera'][n[2]],terrain:n[3],x:n[4],y:n[5],adj:[],
    owner:null,size:3,food:0,prod:0,prog:0,grow:0,conflict:false,capital:false,units:{},att:{},b:[],proj:[],bplan:null,res:null,tspec:null,tmult:1,ev:{}}));
  v.e.forEach(([a,b])=>{ zones[a].adj.push(b); zones[b].adj.push(a); });
  const g={mapIdx,N,seed,rng,zones,map:v,hist:[],step:1,over:false,winner:[],thr:thrMode||'normal',F:[],M:[],log:[],evq:[],tributes:[],logiMult:1,evNow:null,tele:{ready:[],orders:[]}};
  const START=['Almacenes','Caminos','Hospitales','Cuarteles','Fortificaciones','Bibliotecas','Molinos','Talleres','Mercados'];
  for(let f=0;f<=TRIBE;f++){ const tc={}; if(f<N) START.forEach(n=>{ tc[n]=1; }); g.F.push({gold:f<N?10:0,tech:f<N?10:0,techs:tc,out:false,ghost:false,ally:null,req:null,lastAvoid:-99,notes:[],rq:[],rcap:0,stance:{},enc:null}); }
  recomputeMods(g);
  /** @type {Civil[]} */
  const specs=['agr','ing','com','cie'];
  zones.forEach(z=>{
    if(z.role==='capital'){
      z.owner=z.sector; z.size=4; z.food=10; z.prod=10; z.capital=true;
      for(let i=0;i<4;i++) lst(z,z.owner).push(mkUnit(g,z.owner,'pob'));
    } else if(z.role==='tribu'){
      z.owner=TRIBE; z.tspec=specs[Math.floor(rng()*4)];
      for(let i=0;i<3;i++) lst(z,TRIBE).push(mkUnit(g,TRIBE,z.tspec));
      lst(z,TRIBE).push(mkUnit(g,TRIBE,'sol'));
      if(z.k===1||z.k===2) z.res=LOCAL_BY_TERR[z.terrain];
    }
    if(z.role==='vacia'&&z.k===3) z.res=GLOBAL_BY_TERR[z.terrain];
  });
  assignNames(zones,rng);
  scheduleEvents(g);
  return g;
}
const TSPEC_RES = {agr:'food',ing:'prod',com:'gold',cie:'tech'};
const TSPEC_N = {food:'comida',prod:'producción',gold:'oro',tech:'tecnología'};
function tribePop(z){ const us=z.units[TRIBE]||[]; const civ=us.filter(u=>UT[u.t].civ).length; return {civ,mil:us.length-civ}; }
function tribeBase(z){ const p=tribePop(z); return 16+3*p.civ+5*p.mil; }   // tribu típica (3 civiles y 1 guerrero) = 30
/** @param {Partida} g */
function annexPrice(g,f,z){ return Math.ceil(tribeBase(z)*z.tmult*g.M[f].annexDisc); }
function conquestReward(z){ return Math.round((z.tbase||30)*0.6); }
/** @param {Partida} g */
function nearOwnZones(g,f,t){ const M=g.M[f]; return g.zones.filter(a=>a.owner===f&&(t.adj.includes(a.id)||(M.annexDist>=2&&a.adj.some(x=>t.adj.includes(x))))); }
/** @param {Partida} g */
function annexHave(g,f,t){ const res=TSPEC_RES[t.tspec]; if(res==='gold') return g.F[f].gold; if(res==='tech') return g.F[f].tech; return nearOwnZones(g,f,t).reduce((a,z)=>a+z[res],0); }
