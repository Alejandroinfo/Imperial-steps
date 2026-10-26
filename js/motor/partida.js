'use strict';
// Crea una partida nueva a partir de un mapa, el número de jugadores y una semilla.

function newGame(mapIdx,N,seed,thrMode){
  const rng=mulberry32(seed); const md=DATA.maps[mapIdx]; const v=md.v[String(N)];
  const zones=v.n.map((n,i)=>({id:i,sector:n[0],k:n[1],role:['capital','tribu','vacia'][n[2]],terrain:n[3],x:n[4],y:n[5],adj:[],
    owner:null,size:3,food:0,prod:0,prog:0,grow:0,stance:'paz',conflict:false,capital:false,units:{},att:{},b:[],proj:[],res:null,tspec:null,tmult:1,ev:{}}));
  v.e.forEach(([a,b])=>{ zones[a].adj.push(b); zones[b].adj.push(a); });
  const g={mapIdx,N,seed,rng,zones,map:v,hist:[],step:1,over:false,winner:[],thr:thrMode||'normal',F:[],M:[],log:[],evq:[],tributes:[],logiMult:1,evNow:null,tele:{ready:[],orders:[]}};
  const START=['Almacenes','Caminos','Hospitales','Cuarteles','Fortificaciones','Bibliotecas','Molinos','Talleres','Mercados'];
  for(let f=0;f<=TRIBE;f++){ const tc={}; if(f<N) START.forEach(n=>{ tc[n]=1; }); g.F.push({gold:f<N?10:0,tech:f<N?10:0,techs:tc,out:false,ghost:false,ally:null,req:null,lastAvoid:-99,notes:[],rq:[],rcap:0}); }
  recomputeMods(g);
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
function annexPrice(g,f,z){ return Math.ceil(tribeBase(z)*z.tmult*g.M[f].annexDisc); }
function conquestReward(z){ return Math.round((z.tbase||30)*0.6); }
function nearOwnZones(g,f,t){ const M=g.M[f]; return g.zones.filter(a=>a.owner===f&&(t.adj.includes(a.id)||(M.annexDist>=2&&a.adj.some(x=>t.adj.includes(x))))); }
function annexHave(g,f,t){ const res=TSPEC_RES[t.tspec]; if(res==='gold') return g.F[f].gold; if(res==='tech') return g.F[f].tech; return nearOwnZones(g,f,t).reduce((a,z)=>a+z[res],0); }
