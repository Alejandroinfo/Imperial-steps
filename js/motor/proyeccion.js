// @ts-check
'use strict';
// Proyección: qué cambiaría en tu situación actual si tuvieras una tecnología.
// Calcula el próximo paso con y sin ella sobre una copia del estado (no toca la partida real),
// así el impacto sale de las mismas reglas del motor y no de fórmulas aparte.

// Copia liviana: solo se copian a fondo las zonas del jugador (las únicas que se recalculan).
/** @param {Partida} g */
function cloneForProjection(g,f){
  const zones=g.zones.map(z=>{ if(z.owner!==f) return z; const c=JSON.parse(JSON.stringify(z)); for(const k in c.units) c.units[k].forEach(u=>{ u.busy=0; u.mv=0; }); return c; });   // el próximo paso todos trabajan
  const F=g.F.slice(); F[f]=JSON.parse(JSON.stringify(g.F[f]));
  return Object.assign({},g,{zones,F,M:g.M.slice(),fx:[],logNow:[]});
}
// Producción de un paso de todas las zonas del jugador (y lo global), sobre una copia.
function projectedOutput(g2,f){
  g2.M[f]=computeMods(g2,f);
  const plan=researchPlan(g2,f); Object.keys(plan).forEach(id=>{ g2.zones[id].resN=plan[id].n; g2.zones[id].resBonus=plan[id].bonus; });
  const F=g2.F[f], g0=F.gold, t0=F.tech; let food=0,prod=0,store=0;
  g2.zones.forEach(z=>{ if(z.owner!==f) return; z.bplan=buildPlan(g2,z,f,false); const a=z.food,b=z.prod; produceZone(g2,z); food+=z.food-a; prod+=z.prod-b; store+=capStore(g2,z,'food')+capStore(g2,z,'prod'); });
  globalProduce(g2,f);
  return {food,prod,gold:F.gold-g0,tech:F.tech-t0,store};
}
// La situación base (sin la tecnología) es la misma para todas: se calcula una vez por paso.
const PROJ_BASE={key:null,out:null,M:null};
/** @param {Partida} g */
function baseProjection(g,f){
  const key=g.step+'|'+f+'|'+g.zones.map(z=>z.owner===f?(z.units[f]||[]).map(u=>u.t).join('')+':'+z.b.map(b=>b.t+b.l+(b.s||'')).join(''):'').join(',')+'|'+Object.keys(g.F[f].techs).length;
  if(PROJ_BASE.key!==key){ const b=cloneForProjection(g,f); PROJ_BASE.out=projectedOutput(b,f); PROJ_BASE.M=b.M[f]; PROJ_BASE.g=b; PROJ_BASE.key=key; }
  return PROJ_BASE;
}
// A quién beneficia cada modificador (para explicar por qué hoy no cambia nada)
const MOD_WHO={agrFood:'agr',pobFood:'pob',pobProd:'pob',ingProd:'ing',comGold:'com',cieTech:'cie',conUse:'ing'};
/** @param {Partida} g */
function techImpact(g,f,name){
  const t=TECH[name]; if(!t) return null;
  const B=baseProjection(g,f), base=B.g, withT=cloneForProjection(g,f);
  withT.F[f].techs[name]=g.step; withT.M[f]=computeMods(withT,f);
  // edificios del mismo tipo que podrían subir de nivel con esta tecnología
  const ups=[];
  withT.zones.forEach(z=>{ if(z.owner!==f) return; z.b.forEach(b=>{ if(b.t==='mar') return; const before=capLevel(base,f,b.t), after=capLevel(withT,f,b.t); if(after>before&&after>b.l){ ups.push({zone:z.id,bt:b.t,from:b.l,to:Math.min(5,after),cost:20*(Math.min(5,after)-b.l)}); b.l=Math.min(5,after); } }); });
  const o0=B.out, o1=projectedOutput(withT,f);
  const out={}; ['food','prod','gold','tech','store'].forEach(k=>{ const d=Math.round(o1[k]-o0[k]); if(d) out[k]=d; });
  // crecimiento: el próximo poblador de la zona propia más poblada
  let growth=null;
  const zs=zonesOf(g,f).filter(z=>(z.units[f]||[]).length).sort((a,b)=>(b.units[f]||[]).length-(a.units[f]||[]).length);
  if(zs.length){ const z0=zs[0]; const c0=growCost(base,f,base.zones[z0.id]), c1=growCost(withT,f,withT.zones[z0.id]);
    if(c1!==c0){ const e0=growETA(base,base.zones[z0.id]), e1=growETA(withT,withT.zones[z0.id]); growth={zone:z0.id,cost0:c0,cost1:c1,eta0:e0,eta1:e1}; } }
  // tropas que ya tienes y que la tecnología mejora (vida, fuerza, defensa, iniciativa)
  const M0=B.M, M1=withT.M[f], units=[];
  MIL.concat(CIV).forEach(ty=>{ const a=M0.u[ty]||{}, b=M1.u[ty]||{}; const ch=['str','def','hp','atk','init'].some(k=>(a[k]||0)!==(b[k]||0)||(a.init!==b.init));
    const civHp=CIV.includes(ty)&&M0.civHp!==M1.civHp; if(ch||civHp){ const n=zonesOf(g,f).reduce((s,z)=>s+(z.units[f]||[]).filter(u=>u.t===ty).length,0)+g.zones.filter(z=>z.owner!==f).reduce((s,z)=>s+(z.units[f]||[]).filter(u=>u.t===ty).length,0); if(n) units.push({t:ty,n}); } });
  // tropa que desbloquea
  const unlock=Object.keys(TRAIN_TECH).find(k=>TRAIN_TECH[k]===name)||null;
  const barracks=zonesOf(g,f).filter(z=>z.b.some(b=>b.t==='cuartel')).length;
  // edificio nuevo que desbloquea
  const bunlock=Object.keys(BT).find(k=>BT[k].unlock===name)||null;
  // por qué podría no notarse hoy: oficios que beneficia, edificio que mejora o especializa
  const who=[...new Set(Object.keys(MOD_WHO).filter(k=>M0[k]!==M1[k]).map(k=>MOD_WHO[k]))]
    .map(t2=>({t:t2,n:zonesOf(g,f).reduce((a,z)=>a+(z.units[f]||[]).filter(u=>u.t===t2).length,0)}));
  const spec=SPECS[name]?{bt:SPECS[name].bt,have:zonesOf(g,f).some(z=>z.b.some(b=>b.t===SPECS[name].bt))}:null;
  const bt=BT_BY_SR[t.sr]; const bld=(bt&&!bunlock&&!spec)?{bt,have:zonesOf(g,f).some(z=>z.b.some(b=>b.t===bt))}:null;
  return {out,ups,growth,units,unlock,barracks,bunlock,who,spec,bld};
}
