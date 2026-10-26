'use strict';
// Ayudantes del estado de la partida: azar con semilla, unidades, zonas, almacenamiento,
// investigación y nombres de las zonas.

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const zname = z => z.name||('Zona '+(z.id+1));
const isPl = f => f!==null && f!==undefined && f>=0 && f<TRIBE;
function lst(z,f){ return z.units[f]||(z.units[f]=[]); }
function cntT(z,f,t){ return (z.units[f]||[]).reduce((a,u)=>a+(u.t===t?1:0),0); }
function presentF(z){ return Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0); }
function allied(g,a,b){ return a!==b&&isPl(a)&&isPl(b)&&(g.F[a].ally===b||g.F[b].ally===a); }
function isEnemy(g,a,b){ return a!==b && !allied(g,a,b); }
function mkUnit(g,f,t){
  const M=g.M[f]||newMods(), base=UT[t];
  const hp=base.hp+(M.u[t]?M.u[t].hp:0)+(base.civ?M.civHp:0);
  return {t,hp,w:0,str:base.civ?1:2,busy:0,mv:0,hg:0};
}
function mhp(g,f,t,z){
  const M=g.M[f]||newMods(), base=UT[t]; let h=base.hp+(M.u[t]?M.u[t].hp:0)+(base.civ?M.civHp:0);
  if(t==='ari'||t==='lan'||base.civ) return h;
  return h;
}
function techOwn(g,f,n){ return !!(g.F[f]&&g.F[f].techs[n]); }
function zonesOf(g,f){ return g.zones.filter(z=>z.owner===f); }
function totalPop(g,f){ let n=0; g.zones.forEach(z=>{ n+=(z.units[f]||[]).length; }); return n; }
function hasRes(g,f,key){ return g.zones.some(z=>z.owner===f&&z.res===key); }
function slotsOf(g,z){ return Math.floor(z.size/3)+(isPl(z.owner)?g.M[z.owner].slotBonus:0); }
function capLevel(g,f,bt){
  if(bt==='fort'){ let m=0; ['Fortificaciones','Fortificación II','Fortificación III','Torres de vigilancia','Ciudadela'].forEach((n,i)=>{ if(techOwn(g,f,n)) m=Math.max(m,[1,2,3,4,5][i]); }); return m; }
  let m=0; for(const n in g.F[f].techs){ const t=TECH[n]; if(t.sr===BT[bt].sr&&t.l>m) m=t.l; } return m;
}
function specVal(g,f,bt,key){
  let v=0; for(const n in g.F[f].techs){ const s=SPECS[n]; if(s&&s.bt===bt&&s.key===key){ if(key==='intereses') v=v===0?s.v:Math.min(v,s.v); else v=Math.max(v,s.v); } } return v;
}
function specOptions(g,f,bt){
  const o=new Set(); for(const n in g.F[f].techs){ const s=SPECS[n]; if(s&&s.bt===bt) o.add(s.key); } return [...o];
}
function stepCost(g,f,z,bt){
  const M=g.M[f]; let c=20;
  if(bt==='almacen'&&techOwn(g,f,'Almacenes económicos')) c=10;
  if(bt==='fort'&&M.fortHalf) c=Math.ceil(c/2);
  if(bt==='fort'&&z.res==='piedra') c=Math.ceil(c*0.75);
  c-=M.bSub; if(hasRes(g,f,'madera')) c-=5;
  return Math.max(10,c);
}
function wonderCostOf(g,f,z){ let c=g.M[f].wonderCost; if(z.res==='piedra') c=Math.ceil(c*0.75); return c; }
function capStore(g,z,res){
  let c=10; if(!isPl(z.owner)) return c;
  z.b.forEach(b=>{ if(b.t==='almacen'){ c+=10*b.l; if(res==='food'&&b.s==='comida') c+=specVal(g,z.owner,'almacen','comida'); if(res==='prod'&&b.s==='produccion') c+=specVal(g,z.owner,'almacen','produccion'); } });
  return c;
}
function zoneSpec(g,z,f){
  const civ=(z.units[f]||[]).filter(u=>UT[u.t].civ); if(!civ.length) return {spec:'bas',lvl:1,n:0};
  const c={}; civ.forEach(u=>{ if(u.t!=='pob') c[u.t]=(c[u.t]||0)+1; });
  let best=null,bn=0; for(const t in c) if(c[t]>bn){best=t;bn=c[t];}
  if(best&&bn*2>civ.length&&bn>=4){ const M=g.M[f]||newMods(); let lvl=1; if(bn>=8&&M.zl[best]>=2) lvl=2; if(bn>=12&&M.zl[best]>=3) lvl=3; return {spec:best,lvl,n:bn}; }
  return {spec:'bas',lvl:1,n:bn};
}
const SPECN = {bas:'Básica',agr:'Agrícola',ing:'de Producción',con:'Industrial',cie:'de Tecnología',com:'Comercial'};
function ownPath(g,f,from,to,maxLen){
  const prev={}; prev[from]=null; const q=[from];
  while(q.length){
    const a=q.shift(); if(a===to) break;
    for(const b of g.zones[a].adj){ if(b in prev) continue; const zb=g.zones[b]; if(!(zb.owner===f||allied(g,f,zb.owner))&&b!==to) continue; prev[b]=a; q.push(b); }
  }
  if(!(to in prev)) return null;
  const p=[]; let c=to; while(c!==from){ p.unshift(c); c=prev[c]; }
  return (maxLen&&p.length>maxLen)?null:p;
}
function shipFactor(g,path){
  let c=0; path.forEach(id=>{ const z=g.zones[id]; const b=z.b.filter(x=>x.t==='camino').sort((a,b)=>b.l-a.l)[0]; let fac=1; if(b) fac=[1,0.5,0.5,1/3,1/3,0][Math.min(5,b.l)]; c+=fac; });
  return c*(g.logiMult||1);
}
function computeMods(g,f){
  const M=newMods(); if(!g.F[f]) return M;
  for(const n in g.F[f].techs){ const fx=FX[n]; if(fx) fx(M); }
  return M;
}
function recomputeMods(g){ for(let f=0;f<=TRIBE;f++) g.M[f]=computeMods(g,f); }

/* ---- investigación ---- */
function techCost(g,f,name){
  const t=TECH[name]; let c=20*t.l; if(t.l<=2&&techOwn(g,f,'Enciclopedia')) c=Math.ceil(c/2); return c;
}
function ownedAtLevel(g,f,l){ let n=0; for(const k in g.F[f].techs) if(TECH[k].l===l) n++; return n; }
function researchBlock(g,f,name){
  const t=TECH[name]; const F=g.F[f]; if(!t) return 'No existe';
  if(F.techs[name]) return 'Ya la tienes';
  if((F.rq||[]).some(p=>p.name===name)) return 'Ya se está investigando';
  const miss=t.pre.filter(p=>!F.techs[p]); if(miss.length) return 'Falta: '+miss.join(', ');
  if(t.l>=2){ const have=ownedAtLevel(g,f,t.l-1); if(have<MINC[t.l]) return 'Necesitas '+MINC[t.l]+' tecnologías de nivel '+(t.l-1)+' (tienes '+have+')'; }
  if(t.l===5){ const sp=TECHS.filter(x=>x.r===t.r&&x.v&&x.l<=4&&!F.techs[x.n]); if(sp.length) return 'Completa la columna vertebral de '+t.r+' (faltan '+sp.length+')'; }
  return null;
}
function canResearch(g,f,name){ return researchBlock(g,f,name)===null; }


// Nombres de zona: una sola palabra, para que las placas y el panel ocupen poco.
const NAMES = {
  mon:['Peñascal','Riscal','Cumbrera','Picacho','Crestón','Pedregal','Nevada','Roquedal'],
  pra:['Vegaverde','Pradoalto','Florida','Dehesa','Pastizal','Alborada','Herbazal','Valdeflor'],
  bos:['Robledo','Pinares','Umbría','Espesura','Brumal','Cuervales','Hayedo','Fresneda'],
  rio:['Saucedo','Vadillo','Garzal','Remanso','Ribera','Molinar','Juncal','Aguada'],
  col:['Lomaseca','Otero','Altozano','Solana','Ventisca','Ovejera','Cerrillo','Collado'],
  lla:['Trigal','Estepa','Pampa','Ocaso','Campiña','Sabana','Llanada','Mieses']
};
const CAPN=['Adrianópolis','Zafiria','Ambaria','Esmeralda'];
const TRIBN=['Brasca','Cenizal','Morrena','Grajal','Hondal','Lobera','Humareda','Garral','Truenal','Cuervera','Lunaria','Solera'];
function assignNames(zones,rng){
  const used=new Set(); let ti=Math.floor(rng()*TRIBN.length);
  zones.forEach(z=>{
    let n;
    if(z.role==='capital') n=CAPN[z.sector%CAPN.length];
    else if(z.role==='tribu'){ do{ n=TRIBN[ti%TRIBN.length]; ti++; }while(used.has(n)&&ti<200); }
    else { const L=NAMES[z.terrain]; let tries=0; do{ n=L[Math.floor(rng()*L.length)]; tries++; }while(used.has(n)&&tries<60); if(used.has(n)) n=L[0]+' '+(z.id+1); }
    used.add(n); z.name=n;
  });
}
