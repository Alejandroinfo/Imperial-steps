// @ts-check
'use strict';
// Ayudantes del estado de la partida: azar con semilla, unidades, zonas, almacenamiento,
// investigación y nombres de las zonas.

// Generador aleatorio con semilla. state() devuelve su estado para guardarlo o mandarlo por la red:
// mulberry32(r.state()) sigue exactamente la misma secuencia.
function mulberry32(a){const r=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}; r.state=()=>a|0; return r;}
const zname = z => z.name||('Zona '+(z.id+1));
const isPl = f => f!==null && f!==undefined && f>=0 && f<TRIBE;
function lst(z,f){ return z.units[f]||(z.units[f]=[]); }
function presentF(z){ return Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0); }
/** @param {Partida} g */
function allied(g,a,b){ return a!==b&&isPl(a)&&isPl(b)&&(g.F[a].ally===b||g.F[b].ally===a); }
/** @param {Partida} g */
function isEnemy(g,a,b){ return a!==b && !allied(g,a,b); }
// Postura de un jugador hacia otro: 'paz' (por defecto) o 'alerta' (sus tropas atacan a las del otro donde coincidan).
/** @param {Partida} g */
function stanceOf(g,a,b){ if(!isPl(a)||!isPl(b)) return 'alerta'; const s=g.F[a].stance; return (s&&s[b])||'paz'; }
/** @param {Partida} g */
function mkUnit(g,f,t){
  const M=g.M[f]||newMods(), base=UT[t];
  const hp=base.hp+(M.u[t]?M.u[t].hp:0)+(base.civ?M.civHp:0);
  g.nid=(g.nid||1);
  const u={t,hp,w:0,str:base.civ?1:2,busy:0,mv:0,hg:0,id:g.nid++};
  if(base.civ) u.tr=rollTraits(g);
  return u;
}
// Dos rasgos distintos al azar (con la semilla de la partida, así que todos los jugadores ven lo mismo).
/** @param {Partida} g */
function rollTraits(g){
  const pool=TRAIT_KINDS.slice(), out=[];
  for(let i=0;i<2;i++){
    const k=pool.splice(Math.floor(g.rng()*pool.length),1)[0];
    const r=g.rng(); let acc=0, l=TRAIT_ODDS[TRAIT_ODDS.length-1][0];
    for(const [lv,p] of TRAIT_ODDS){ acc+=p; if(r<acc){ l=lv; break; } }
    out.push({k,l});
  }
  return out;
}
// Multiplicador de rendimiento de una persona en lo que afecta ese rasgo (1 = sin rasgo).
function trMul(u,k){ const t=(u.tr||[]).find(x=>x.k===k); return t?1+TRAIT_STEP*t.l:1; }
// Salud y fuerza son enteros: +1 / +2 (o −1 / −2) de vida o de dados.
function trInt(u,k){ const t=(u.tr||[]).find(x=>x.k===k); return t?t.l:0; }
// El apetito es al revés: un rasgo bueno hace comer menos.
function aptMul(u){ const t=(u.tr||[]).find(x=>x.k==='apt'); return t?1-TRAIT_STEP*t.l:1; }
/** @param {Partida} g */
function mhp(g,f,t,z){
  const M=g.M[f]||newMods(), base=UT[t]; let h=base.hp+(M.u[t]?M.u[t].hp:0)+(base.civ?M.civHp:0);
  if(t==='ari'||t==='lan'||base.civ) return h;
  return h;
}
/** @param {Partida} g */
function techOwn(g,f,n){ return !!(g.F[f]&&g.F[f].techs[n]); }
/** @param {Partida} g */
function zonesOf(g,f){ return g.zones.filter(z=>z.owner===f); }
/** @param {Partida} g */
/** @param {Partida} g */
function civPop(g,f){ let n=0; g.zones.forEach(z=>{ (z.units[f]||[]).forEach(u=>{ if(UT[u.t].civ) n++; }); }); return n; }
// Una baja (muerte o captura) de un civil o general que nació por crecimiento propio abarata los próximos crecimientos de su zona natal.
/** @param {Partida} g */
function unitLost(g,u,f){
  if(!isPl(f)||u.home===undefined||!(UT[u.t].civ||u.gen)) return; const hz=g.zones[u.home]; if(!hz||hz.owner!==f) return;
  hz.repop=Math.min(REPOP_MAX,(hz.repop||0)+(g.M[f].repopStack||1));
}
/** @param {Partida} g */
function totalPop(g,f){ let n=0; g.zones.forEach(z=>{ n+=(z.units[f]||[]).length; }); return n; }
/** @param {Partida} g */
function hasRes(g,f,key){ let m=0; g.zones.forEach(z=>{ if(z.owner===f) m=Math.max(m,resMul(z,key)); }); if(!m&&isPl(f)&&((g.F[f].tres||[]).some(r=>r.key===key&&r.until>g.step))) m=1; return m; }   // 0 = no lo tienes; 1 = plata; 2 = oro (o un recurso temporal de la subasta, que cuenta como plata)
// Cuánto vale el depósito de esa clase en la zona: 2 si tiene ese recurso en oro, 1 si en plata, 0 si no lo tiene.
function resMul(z,key){ return z.resO===key?RES_TIER.oro.mul:(z.res===key?RES_TIER.plata.mul:0); }
// Los depósitos de una zona: [{k,tier,mul}] (plata primero, luego oro).
function zoneDeps(z){ const o=[]; if(z.res) o.push({k:z.res,tier:'plata',mul:RES_TIER.plata.mul}); if(z.resO) o.push({k:z.resO,tier:'oro',mul:RES_TIER.oro.mul}); return o; }
/** @param {Partida} g */
function slotsOf(g,z){ return Math.floor(z.size/3)+(isPl(z.owner)?g.M[z.owner].slotBonus:0); }
// Puestos de trabajo de un edificio: WORKERS_PER_LEVEL por nivel (nivel 1 = 2, nivel 2 = 4, nivel 3 = 6...) más lo que sumen Andamios y Grúas.
/** @param {Partida} g */
function bldSlots(g,f,b){ return WORKERS_PER_LEVEL*Math.max(1,b.l||1)+(g.M[f].wk-2); }
/** @param {Partida} g */
function capLevel(g,f,bt){
  if(bt==='fort'){ let m=0; ['Fortificaciones','Fortificación II','Fortificación III','Torres de vigilancia'].forEach((n,i)=>{ if(techOwn(g,f,n)) m=Math.max(m,[1,2,3,4,5][i]); }); return m; }
  let m=0; for(const n in g.F[f].techs){ if(WONDER_TECH[n]) continue; const t=TECH[n]; if(t.sr===BT[bt].sr&&t.l>m) m=t.l; } return m;   // las vertebrales de nivel 5 ya no dan nivel 5 de edificio: lo da la maravilla
}
/** @param {Partida} g */
function specVal(g,f,bt,key){
  let v=0; for(const n in g.F[f].techs){ const s=SPECS[n]; if(s&&s.bt===bt&&s.key===key){ if(key==='intereses') v=v===0?s.v:Math.min(v,s.v); else v=Math.max(v,s.v); } } return v;
}
/** @param {Partida} g */
function specOptions(g,f,bt){
  const o=new Set(); for(const n in g.F[f].techs){ const s=SPECS[n]; if(s&&s.bt===bt) o.add(s.key); } return [...o];
}
// ---- maravillas (15.3) ----
/** @param {Partida} g */
function wonderBuilt(g,w){ for(const z of g.zones){ if(z.b.some(b=>b.t==='mar'&&b.w===w)) return z; } return null; }
// quién las está construyendo ahora: [{f, zone, pct}]
/** @param {Partida} g */
function wonderRace(g,w){ const out=[]; g.zones.forEach(z=>{ if(!isPl(z.owner)) return; z.proj.forEach(p=>{ if(p.k==='w'&&p.w===w) out.push({f:z.owner,zone:z.id,pct:Math.round(100*(p.tot-p.left)/p.tot)}); }); }); return out; }
function sameCount(z,bt){ return z.b.filter(b=>b.t===bt).length+z.proj.filter(p=>p.k==='b'&&p.bt===bt).length; }
/** @param {Partida} g */
function buildLevel(g,f,bt){ return Math.max(1,Math.min(5,capLevel(g,f,bt))); }
/** @param {Partida} g */
function maxSame(g,f,bt){ if(bt==='mar') return 99; return capLevel(g,f,bt)>=DUP_LEVEL?MAX_SAME:1; }
/** @param {Partida} g */
function stepCost(g,f,z,bt,dup){
  const M=g.M[f]; let c=20;
  if(bt==='almacen'&&techOwn(g,f,'Almacenes económicos')) c=10;
  if(bt==='fort'&&M.fortHalf) c=Math.ceil(c/2);
  if(bt==='fort'&&resMul(z,'piedra')) c=Math.ceil(c*(1-0.25*resMul(z,'piedra')));
  c-=M.bSub; c-=5*hasRes(g,f,'madera');
  c=Math.max(10,c);
  return dup?Math.ceil(c*DUP_COST_MULT):c;
}
/** @param {Partida} g */
function wonderCostOf(g,f,z){ let c=g.M[f].wonderCost; if(resMul(z,'piedra')) c=Math.ceil(c*(1-0.25*resMul(z,'piedra'))); return c; }
/** @param {Partida} g */
function capStore(g,z,res){
  const s=z.size; let c=STORE_PER_SIZE*s; if(!isPl(z.owner)) return c;
  z.b.forEach(b=>{ if(b.t==='almacen'){ c+=ALMACEN_PER_SIZE*s*b.l; if(res==='food'&&b.s==='comida') c+=specVal(g,z.owner,'almacen','comida')*s; if(res==='prod'&&b.s==='produccion') c+=specVal(g,z.owner,'almacen','produccion')*s; } });
  if(z.ev&&z.ev.flooded) c=Math.floor(c/2);   // inundación: el resto del año el almacén guarda la mitad
  return c;
}
/** @param {Partida} g */
function zoneSpec(g,z,f){
  const civ=(z.units[f]||[]).filter(u=>UT[u.t].civ); if(!civ.length) return {spec:'bas',lvl:1,n:0};
  const c={}; civ.forEach(u=>{ if(u.t!=='pob') c[u.t]=(c[u.t]||0)+1; });
  let best=null,bn=0; for(const t in c) if(c[t]>bn){best=t;bn=c[t];}
  if(best&&bn*2>civ.length&&bn>=4){ const M=g.M[f]||newMods(); let lvl=1; if(bn>=8&&M.zl[best]>=2) lvl=2; if(bn>=12&&M.zl[best]>=3) lvl=3; return {spec:best,lvl,n:bn}; }
  return {spec:'bas',lvl:1,n:bn};
}
const SPECN = {bas:'Básica',agr:'Agrícola',ing:'de Producción',cie:'de Tecnología',com:'Comercial'};
/** @param {Partida} g */
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
/** @param {Partida} g */
function shipFactor(g,path){
  let c=0; path.forEach(id=>{ const z=g.zones[id]; const b=z.b.filter(x=>x.t==='camino').sort((a,b)=>b.l-a.l)[0]; let fac=1; if(b) fac=[1,0.5,0.5,1/3,1/3,0][Math.min(5,b.l)]; if(z.b.some(x=>x.t==='mar'&&x.w==='log')) fac=0; c+=fac; });
  return c*(g.logiMult||1);
}
/** @param {Partida} g */
function computeMods(g,f){
  const M=newMods(); if(!g.F[f]) return M;
  for(const n in g.F[f].techs){ const fx=FX[n]; if(fx) fx(M); }
  g.zones.forEach(z=>{ if(z.owner===f) z.b.forEach(b=>{ if(b.t==='mar'&&b.w&&WFX[b.w]) WFX[b.w](M); }); });   // las maravillas que controlas
  return M;
}
/** @param {Partida} g */
function recomputeMods(g){ for(let f=0;f<=TRIBE;f++) g.M[f]=computeMods(g,f); }

/* ---- investigación ---- */
function techCost(g,f,name){
  const t=TECH[name]; return 20*t.l;
}
/** @param {Partida} g */
function ownedAtLevel(g,f,l){ let n=0; for(const k in g.F[f].techs) if(TECH[k].l===l) n++; return n; }
/** @param {Partida} g */
function researchBlock(g,f,name){
  const t=TECH[name]; const F=g.F[f]; if(!t) return 'No existe';
  if(F.techs[name]) return 'Ya la tienes';
  if(WONDER_TECH[name]&&wonderBuilt(g,WONDER_TECH[name])) return 'Su maravilla ya fue construida';
  if((F.rq||[]).some(p=>p.name===name)) return 'Ya se está investigando';
  const miss=t.pre.filter(p=>!F.techs[p]); if(miss.length) return 'Falta: '+miss.join(', ');
  if(t.l>=2){ const have=ownedAtLevel(g,f,t.l-1); if(have<MINC[t.l]) return 'Necesitas '+MINC[t.l]+' tecnologías de nivel '+(t.l-1)+' (tienes '+have+')'; }
  if(t.l===5){ const sp=TECHS.filter(x=>x.r===t.r&&x.v&&x.l<=4&&!F.techs[x.n]); if(sp.length) return 'Completa la columna vertebral de '+t.r+' (faltan '+sp.length+')'; }
  return null;
}
/** @param {Partida} g */
function canResearch(g,f,name){ return researchBlock(g,f,name)===null; }


// Nombres de zona: una sola palabra, para que las placas y el panel ocupen poco.
// Son nombres propios que se leen igual en español y en inglés (no se traducen): raíces comunes (selva, sabana, estepa, cascada…) o inventados, sin ñ ni «ll».
const NAMES = {
  mon:['Altamira', 'Montara', 'Cumbre', 'Granito', 'Aguilar', 'Escarpa', 'Nevada', 'Basalto'],
  pra:['Primavera', 'Pradera', 'Valverde', 'Rosales', 'Aurora', 'Margarita', 'Trebolar', 'Floreal'],
  bos:['Selva', 'Arboleda', 'Sombra', 'Pinar', 'Cedral', 'Umbra', 'Robledo', 'Alameda'],
  rio:['Rivera', 'Cascada', 'Laguna', 'Fontana', 'Ondina', 'Remanso', 'Caudal', 'Torrente'],
  col:['Colina', 'Loma', 'Otero', 'Solana', 'Mirador', 'Cerro', 'Ventura', 'Belmonte'],
  lla:['Pampa', 'Sabana', 'Estepa', 'Trigal', 'Meseta', 'Horizonte', 'Planicie', 'Cosecha']
};
const CAPN=['Adrianópolis', 'Zafiria', 'Ambaria', 'Esmeralda'];
const FRONN=['Limes', 'Frontera', 'Umbral', 'Marca', 'Atalaya', 'Centinela'];
const TRIBN=['Brasca', 'Lunaria', 'Solera', 'Karuma', 'Tolven', 'Ashari', 'Morvan', 'Ravena', 'Cenara', 'Lupara', 'Tormena', 'Corvina'];
function assignNames(zones,rng){
  const used=new Set(); let ti=Math.floor(rng()*TRIBN.length);
  zones.forEach(z=>{
    let n;
    if(z.role==='capital') n=CAPN[z.sector%CAPN.length];
    else if(z.role==='tribu'){ do{ n=TRIBN[ti%TRIBN.length]; ti++; }while(used.has(n)&&ti<200); }
    else if(z.role==='frontera') n=FRONN[z.k%FRONN.length];
    else { const L=NAMES[z.terrain]; let tries=0; do{ n=L[Math.floor(rng()*L.length)]; tries++; }while(used.has(n)&&tries<60); if(used.has(n)) n=L[0]+' '+(z.id+1); }
    used.add(n); z.name=n;
  });
}
