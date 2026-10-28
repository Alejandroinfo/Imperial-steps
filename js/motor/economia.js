// @ts-check
'use strict';
// Producción, crecimiento, consumo de comida, hambre y curación.

/** @param {Partida} g */
function growCost(g,f,z){
  const M=g.M[f]; let c=(z.size+1)*(z.size+1)-M.growSub;   // crecer a tamaño n cuesta n² (3.º = 9, 4.º = 16, 10.º = 100)
  if(M.growHalf) c=Math.ceil(c/2); if(g.growHalfEv) c=Math.ceil(c*EV_FERTIL_FACTOR);
  if(g.step<=FOUNDING_STEPS) c=Math.ceil(c/2);   // etapa de fundación: los primeros pasos son más rápidos
  if((z.repop||0)>0&&z.owner===f) c=Math.ceil(c*(1-Math.min(0.9,REPOP_PCT+M.repopBonus)));   // repoblación: los próximos nacimientos de una zona que perdió gente cuestan menos
  return Math.max(1,c);
}
// Obras automáticas: si la zona tiene obras en cola (y no están en pausa), sus ingenieros y pobladores libres
// construyen solos, usando producción (ingeniero 2 + Cuadrillas/Línea; poblador 1). Se reparte así:
// se parte de la producción guardada y se ve si lo que se gastaría supera lo que hay (guardado + lo que producen
// los demás). Si la cuenta queda en negativo, se pone a producir a quien mejor produce hasta cerrar la brecha;
// con la misma eficiencia, la mitad produce para que la otra mitad construya. Sin obra o en pausa, todos producen.
/** @param {Partida} g */
function buildPlan(g,z,f,pull){
  const plan={ing:0,pob:0,bonus:0,cap:0,work:0,stock:0,pot:0,paused:!!z.pauseBuild,ids:[]};
  const stock0=Math.floor(z.prod);
  if(!isPl(f)||!z.proj.length) return plan;
  const M=g.M[f]; const dbl=M.terrDouble?2:1; const hill=z.terrain==='col'?dbl*(1+M.tx.col):0, mon=z.terrain==='mon'?dbl*(1+(M.tx.mon||0)):0; const ev=z.ev||{};
  const work=z.proj.reduce((a,p)=>a+p.left,0); plan.work=work;
  if(z.pauseBuild) return plan;
  const cand=(z.units[f]||[]).filter(u=>(u.t==='ing'||u.t==='pob')&&u.w===0&&!u.busy&&!u.mv);
  // lo que cada persona gastaría construyendo y lo que produciría si no construye (con sus rasgos de ingeniería)
  const info=cand.map(u=>{ const m=trMul(u,'ing'); return u.t==='ing'
    ?{id:u.id,k:'ing',use:(2+M.conUse+hill)*m,prod:Math.max(0,2+M.ingProd+mon+(ev.prodIng||0))*m}
    :{id:u.id,k:'pob',use:(1+hill)*m,prod:Math.max(0,1+M.pobProd+mon+(ev.prodPob||0))*m}; });
  const sp=zoneSpec(g,z,f); const zb=sp.spec==='ing'?[0,4,8,12][sp.lvl]+M.zProdLvl*sp.lvl:0;
  const fixed=z.capital?CAPITAL_BONUS+M.capExtra:0;   // producción segura de la zona aunque nadie construya
  // lo máximo que esta zona podría destinar a una obra en este paso (sin producción traída de otras zonas): para desempatar maravillas
  plan.pot=stock0+fixed+(info.length?zb:0)+info.reduce((a,u)=>a+u.prod,0);
  const target=Math.min(work,info.reduce((a,u)=>a+u.use,0)+(info.length?zb:0));
  const solve=()=>{
    const stock=Math.floor(z.prod); const r={ing:0,pob:0,bonus:0,cap:0,stock,ids:[]};
    // los mejores para construir primero, hasta cubrir el trabajo; el resto produce
    const all=info.slice().sort((a,b)=>(b.use/Math.max(0.1,b.prod))-(a.use/Math.max(0.1,a.prod)));
    let B=[], P=[], cov=0;
    all.forEach(u=>{ if(cov<work){ B.push(u); cov+=u.use; } else P.push(u); });
    const spendOf=()=>Math.min(work,B.reduce((a,u)=>a+u.use,0)+(B.length&&zb?zb:0));
    const availOf=()=>stock+fixed+P.reduce((a,u)=>a+u.prod,0);
    while(B.length&&spendOf()>availOf()){
      // la brecha es negativa: pasa a producir quien mejor produce (más producción por lo que gastaría)
      let bi=0; B.forEach((u,i)=>{ if(u.prod/Math.max(0.1,u.use)>B[bi].prod/Math.max(0.1,B[bi].use)) bi=i; });
      P.push(B.splice(bi,1)[0]);
    }
    if(B.length){ r.ing=B.filter(u=>u.k==='ing').length; r.pob=B.length-r.ing; r.ids=B.map(u=>u.id); const base=B.reduce((a,u)=>a+u.use,0); r.cap=Math.floor(Math.min(spendOf(),availOf())); r.bonus=Math.round(Math.max(0,Math.min(zb,r.cap-Math.floor(base)))); }
    return r;
  };
  let r=solve();
  if(pull&&r.cap<target){ const got=pullRes(g,f,z,'prod',Math.ceil(target-r.cap),M.pullDist); if(got>0) r=solve(); }
  return Object.assign(plan,r);
}
/** @param {Partida} g */
function produceZone(g,z){
  const f=z.owner; if(!isPl(f)) return; const M=g.M[f], F=g.F[f]; const us=z.units[f]||[];
  const sciAll=us.filter(u=>u.t==='cie'&&u.w===0&&!u.busy&&!u.mv); const nres=Math.min(z.resN||0,sciAll.length); const researchers=new Set(sciAll.slice(0,nres));  // z.resN lo fija researchPlan
  const bp=z.bplan||{ing:0,pob:0,bonus:0,cap:0,ids:[]}; const builders=new Set(), pobBuilders=new Set(); const bids=new Set(bp.ids||[]);   // los pobladores que construyen siguen dando comida; los ingenieros que construyen no producen
  us.forEach(u=>{ if(!bids.has(u.id)) return; if(u.t==='ing') builders.add(u); else if(u.t==='pob') pobBuilders.add(u); });
  const act=us.filter(u=>UT[u.t].civ&&u.w===0&&!u.busy&&!u.mv&&!researchers.has(u)&&!builders.has(u));
  const T=z.terrain, dbl=M.terrDouble?2:1, tx=M.tx[T]||0, ev=z.ev||{};
  let food=0,prod=0,gold=0,tech=0;
  // registro de quién produce qué, para el resumen de la zona
  const by={jobs:{},blds:[],cap:0,zone:null,researching:researchers.size,
    building:{ing:bp.ing,pob:bp.pob,cap:bp.cap,bonus:bp.bonus},
    idle:{moving:us.filter(u=>UT[u.t].civ&&u.mv).length,busy:us.filter(u=>UT[u.t].civ&&u.busy&&!u.mv).length,wounded:us.filter(u=>UT[u.t].civ&&u.w>0).length}};
  const job=t=>by.jobs[t]||(by.jobs[t]={n:0,food:0,prod:0,gold:0,tech:0});
  act.forEach(u=>{
    const h=u.half?0.5:1; const J=job(u.t); J.n++; let df=0,dp=0,dg=0,dt=0;
    switch(u.t){
      case 'pob': df=h*Math.max(0,1+M.pobFood+(T==='pra'?dbl*(1+tx):0)+(ev.foodPob||0))*trMul(u,'agr'); dp=pobBuilders.has(u)?0:h*Math.max(0,1+M.pobProd+(T==='mon'?dbl*(1+tx):0)+(ev.prodPob||0))*trMul(u,'ing'); break;
      case 'agr': df=h*Math.max(0,2+M.agrFood+(T==='pra'?dbl*(1+tx):0)+(ev.foodAgr||0))*trMul(u,'agr'); break;
      case 'ing': dp=h*Math.max(0,2+M.ingProd+(T==='mon'?dbl*(1+tx):0)+(ev.prodIng||0))*trMul(u,'ing'); break;
      case 'cie': dt=h*Math.max(0,2+M.cieTech+(T==='lla'?dbl*(1+tx):0)+(ev.techCie||0))*trMul(u,'cie'); break;
      case 'com': dg=h*Math.max(0,2+M.comGold+((T==='bos'||T==='rio')?dbl*(1+tx):0)+(ev.goldCom||0))*trMul(u,'com'); break;
    }
    food+=df; prod+=dp; gold+=dg; tech+=dt; J.food+=df; J.prod+=dp; J.gold+=dg; J.tech+=dt;
  });
  const sp=zoneSpec(g,z,f); z.sp=sp; const lv=sp.lvl, zb=[0,4,8,12][lv];
  const f0=food,p0=prod,g0=gold,t0=tech;
  if(sp.spec==='agr') food+=zb+M.zFoodLvl*lv+(lv===3?M.revol:0);
  if(sp.spec==='ing') prod+=zb+M.zProdLvl*lv-bp.bonus;   // lo que no se use en obra produce
  if(sp.spec==='com') gold+=zb+(lv===3?M.ruta:0);
  if(sp.spec==='cie'&&nres===0) tech+=zb;
  if(food-f0||prod-p0||gold-g0||tech-t0) by.zone={spec:sp.spec,lvl:lv,food:food-f0,prod:prod-p0,gold:gold-g0,tech:tech-t0};
  let rc=0; researchers.forEach(u=>{ rc+=(RESEARCH_PER_SCI+M.sciUse)*trMul(u,'cie'); }); z.rcap=Math.floor(rc)+(nres>0?(z.resBonus||0):0); z.nres=nres;
  if(z.capital){ const c=CAPITAL_BONUS+M.capExtra; food+=c; prod+=c; gold+=c; tech+=c; by.cap=c; }
  // edificios
  let pool=act.slice();
  // primero los edificios que piden un oficio (para que Almacén o Camino no les quiten a los especialistas), luego los que admiten a cualquiera
  [...z.b.filter(b=>BLD_WORKER[b.t]),...z.b.filter(b=>!BLD_WORKER[b.t])].forEach(b=>{
    b.wk=0; if(b.t==='mar') return; const def=BT[b.t];
    if(def.mil){ const mil=us.filter(u=>!UT[u.t].civ&&!UT[u.t].siege&&u.w===0); b.wk=Math.min(bldSlots(g,f,b),mil.length); return; }
    const elig=BLD_WORKER[b.t]?pool.filter(u=>u.t===BLD_WORKER[b.t]):pool.slice(); const w=Math.min(bldSlots(g,f,b),elig.length); b.wk=w;   // copia: pool se achica al asignar
    const wtypes={}; for(let i=0;i<w;i++){ const u=elig[i]; pool.splice(pool.indexOf(u),1); wtypes[u.t]=(wtypes[u.t]||0)+1; }
    const pw=PERW[Math.min(5,b.l)]; const B0=[food,prod,gold,tech];
    if(b.t==='molino') food+=w*pw+(b.s==='granero'?Math.min(3,Math.floor(z.food/10)):0);
    else if(b.t==='taller') prod+=w*pw;
    else if(b.t==='mercado') gold+=w*(pw+resMul(z,'gemas'));
    else if(b.t==='biblio') tech+=w*pw;
    else if(b.t==='almacen'&&b.s==='intereses'){ const per=specVal(g,f,'almacen','intereses')||10; gold+=Math.floor((z.food+z.prod)/per); }
    else if(b.t==='hospital'&&b.s==='civil'&&specVal(g,f,'hospital','civil')>=3){ act.forEach(u=>{ if(u.t==='pob'||u.t==='agr') food+=1; else if(u.t==='ing') prod+=1; else if(u.t==='cie') tech+=1; else if(u.t==='com') gold+=1; }); }
    by.blds.push({t:b.t,l:b.l,s:b.s,dup:b.dup,wk:w,max:bldSlots(g,f,b),who:wtypes,food:food-B0[0],prod:prod-B0[1],gold:gold-B0[2],tech:tech-B0[3]});
  });
  // edificios militares: quiénes trabajan en ellos
  z.b.forEach(b=>{ if(BT[b.t].mil) by.blds.push({t:b.t,l:b.l,s:b.s,dup:b.dup,wk:b.wk,max:bldSlots(g,f,b),mil:1}); });
  z.lastBy=by;
  if(ev.mul){ food*=ev.mul.food; prod*=ev.mul.prod; gold*=ev.mul.gold; tech*=ev.mul.tech; }   // la parte cierta del año (Prosperidad o Escasez)
  z.food+=Math.round(food); z.prod+=Math.round(prod); F.gold+=Math.round(gold); F.tech+=Math.round(tech);
  z.last={food:Math.round(food),prod:Math.round(prod),gold:Math.round(gold),tech:Math.round(tech)};
}
/** @param {Partida} g */
function globalProduce(g,f){
  const M=g.M[f], F=g.F[f]; const zs=zonesOf(g,f); let gold=0,tech=0;
  tech+=3*hasRes(g,f,'ruinas');
  if(hasRes(g,f,'sal')){ const sm=hasRes(g,f,'sal'); zs.forEach(z=>{ if(z.sp&&z.sp.spec==='com') gold+=2*sm; }); }
  if(M.imp) gold+=Math.floor(zs.length/2);
  if(M.monop) gold+=M.monop*zs.reduce((a,z)=>a+zoneDeps(z).length,0);
  if(M.corte){ const k=Math.floor(zs.length/5); if(k>0){ const cap=zs.find(z=>z.capital)||zs[0]; if(cap){ cap.food+=k; cap.prod+=k; gold+=k; tech+=k; } } }
  F.gold+=gold; F.tech+=tech;
}
/** @param {Partida} g */
function healUnits(g,z){
  for(const fs in z.units){ const f=Number(fs); const M=g.M[f]||newMods(); const hosps=z.b.filter(b=>b.t==='hospital');
    z.units[f].forEach(u=>{
      if(u.w<=0) return; const civ=UT[u.t].civ; const key=civ?'civil':'militar'; let rate=1+(civ?M.civHeal:M.milHeal)+(hosps.length?1:0)+(isPl(f)?hasRes(g,f,'hierbas'):0);
      if(hosps.some(h=>h.s===key)&&specVal(g,f,'hospital',key)>=2) rate=99;
      if(g.fever) rate=Math.max(1,rate-1);
      u.w=Math.max(0,u.w-rate);
    });
  }
}
// Los científicos investigan solos cuando hay algo en cola: investigan tantos como alcance la
// ciencia guardada (cada uno usa RESEARCH_PER_SCI) y los demás generan ciencia.
/** @param {Partida} g */
function researchPlan(g,f){
  const F=g.F[f], plan={}; let budget=F.rq.length?Math.min(Math.floor(F.tech),F.rq.reduce((a,p)=>a+p.left,0)):0;
  zonesOf(g,f).forEach(z=>{
    const sci=(z.units[f]||[]).filter(u=>u.t==='cie'&&u.w===0&&!u.busy&&!u.mv).length;
    const per=RESEARCH_PER_SCI+g.M[f].sciUse; const n=Math.min(sci,Math.floor(budget/per)); budget-=n*per;
    let bonus=0; if(n>0){ const sp=zoneSpec(g,z,f); if(sp.spec==='cie'){ bonus=Math.min([0,4,8,12][sp.lvl],budget); budget-=bonus; } }
    plan[z.id]={sci,n,bonus};
  });
  return plan;
}
// Una o varias maravillas llegaron al 100 % en este paso. Si son varias de la misma, gana quien podía destinar más
// producción a terminarla (sin contar producción traída de zonas ajenas); si empatan exactamente, nadie la logra:
// se deshace el último paso de obra y lo que falta se duplica. Los demás pierden la carrera.
/** @param {Partida} g */
function resolveWonder(g,w,list,L){
  let win=list[0];
  if(list.length>1){
    const ord=list.slice().sort((a,b)=>(b.z.bplan?b.z.bplan.pot:0)-(a.z.bplan?a.z.bplan.pot:0));
    if((ord[0].z.bplan?ord[0].z.bplan.pot:0)===(ord[1].z.bplan?ord[1].z.bplan.pot:0)){
      list.forEach(x=>{ x.z.prod+=x.p.prev-x.p.left; x.p.left=x.p.prev*2; });
      L('Empate en '+WONDERS[w].n+': nadie la logra. Se deshace el último paso y a cada uno le falta el doble.'); return;
    }
    win=ord[0];
  }
  const z=win.z, p=win.p, f=win.f;
  z.proj.splice(z.proj.indexOf(p),1);
  z.b.push({t:'mar',l:1,s:null,wk:0,cost:p.tot,w});
  L(PLN[f].name+' termina '+WONDERS[w].n+' en '+zname(z)+'. Nadie más podrá construirla.'); g.fx.push({k:'built',zone:z.id,f,bt:'mar',w});
  cancelWonderRace(g,w,f,L);
}
// Quien perdió la carrera pierde la obra y recupera la mitad de la producción puesta. La tecnología de nivel 5 NO se pierde
// (cuenta para la victoria tecnológica) y no se devuelve ciencia por ella; solo se cancela si todavía estaba en la cola.
/** @param {Partida} g */
function cancelWonderRace(g,w,winF,L){
  const tech=WONDERS[w].tech;
  const giveProd=(f,z0,n)=>{ const zs=[z0].concat(g.zones.filter(a=>a.owner===f&&a.id!==z0.id)); for(const a of zs){ if(n<=0) break; const room=Math.max(0,capStore(g,a,'prod')-a.prod); const t=Math.min(room,n); a.prod+=t; n-=t; } };
  g.zones.forEach(z=>{ if(!isPl(z.owner)||z.owner===winF) return; const f=z.owner;
    const mine=z.proj.filter(p=>p.k==='w'&&p.w===w); if(!mine.length) return;
    mine.forEach(p=>{ giveProd(f,z,Math.floor((p.tot-p.left)*WONDER_REFUND)); });
    z.proj=z.proj.filter(p=>!(p.k==='w'&&p.w===w));
    L(PLN[f].name+' pierde la carrera por '+WONDERS[w].n+': recupera la mitad de la producción invertida y conserva la tecnología.'); });
  for(let f=0;f<g.N;f++){ if(f===winF) continue; const F=g.F[f];
    const q=F.rq.find(p=>p.name===tech); if(q){ F.tech+=Math.floor((q.tot-q.left)*WONDER_REFUND); F.rq=F.rq.filter(p=>p!==q); } }   // aún no la tenía: ya no se puede investigar
}
/** @param {Partida} g */
function economy(g,L){
  const Z=g.zones; Z.forEach(z=>{ z.rcap=0; z.nres=0; z.f0=z.food; z.p0=z.prod; z.feed={}; z.feedOut=0; });
  for(let f=0;f<g.N;f++){ const plan=researchPlan(g,f); Object.keys(plan).forEach(id=>{ g.zones[id].resN=plan[id].n; g.zones[id].resBonus=plan[id].bonus; }); }
  Z.forEach(z=>{ z.bplan=isPl(z.owner)?buildPlan(g,z,z.owner,true):null; });
  Z.forEach(z=>{ if(isPl(z.owner)){ produceZone(g,z); if(z.last) g.fx.push({k:'prod',zone:z.id,f:z.owner,food:z.last.food,prod:z.last.prod,gold:z.last.gold,tech:z.last.tech}); } });
  for(let f=0;f<g.N;f++) if(!g.F[f].out||g.F[f].ghost) globalProduce(g,f);
  holdResources(g,L);
  frontierIncome(g,L);
  // investigación: los científicos asignados usan su ciencia para desarrollar tecnologías
  for(let f=0;f<g.N;f++){
    const F=g.F[f]; let cap=0; zonesOf(g,f).forEach(z=>{ cap+=z.rcap||0; }); F.rcap=cap; F.rspent=0;
    for(const p of F.rq.slice()){
      if(cap<=0||F.tech<1) break; const sp=Math.min(cap,p.left,Math.floor(F.tech)); if(sp<=0) break;
      F.tech-=sp; p.left-=sp; cap-=sp; F.rspent+=sp;
      if(p.left<=0){ F.rq.splice(F.rq.indexOf(p),1); F.techs[p.name]=g.step; recomputeMods(g); L(PLN[f].name+' desarrolla «'+p.name+'».'); g.fx.push({k:'tech',f,name:p.name}); }
    }
  }
  // construcción
  const wdone={};   // maravillas que llegan al 100 % en este paso (se resuelven juntas, por si hay empate)
  Z.forEach(z=>{
    const f=z.owner; if(!isPl(f)||!z.proj.length||!z.bplan) return; let cap=z.bplan.cap;
    for(const p of z.proj.slice()){
      if(cap<=0) break; const need=Math.min(cap,p.left);
      const spend=Math.min(need,Math.floor(z.prod)); if(spend<=0) continue;
      p.prev=p.left; z.prod-=spend; p.left-=spend; cap-=spend;
      if(p.left<=0){
        if(p.k==='w'){ (wdone[p.w]=wdone[p.w]||[]).push({z,p,f}); continue; }
        z.proj.splice(z.proj.indexOf(p),1);
        if(p.k==='b'){ z.b.push({t:p.bt,l:p.lvl||1,s:p.spec||null,wk:0,cost:p.tot,dup:p.dup||0}); L(zname(z)+': se termina un '+BT[p.bt].n+((p.lvl||1)>1?' de nivel '+p.lvl:'')+(p.spec?' ('+SPEC_NAMES[p.spec]+')':'')+'.'); g.fx.push({k:'built',zone:z.id,f,bt:p.bt}); }
        else if(p.k==='u'&&z.b[p.bi]){ z.b[p.bi].l=p.to; z.b[p.bi].cost=(z.b[p.bi].cost||0)+p.tot; L(zname(z)+': el '+BT[z.b[p.bi].t].n+' sube a nivel '+p.to+'.'); g.fx.push({k:'upg',zone:z.id,f,bt:z.b[p.bi].t,l:p.to}); }
      }
    }
  });
  Object.keys(wdone).forEach(w=>resolveWonder(g,w,wdone[w],L));
  // consumo y hambre (cada jugador alimenta a toda su gente), después crecimiento
  for(let f=0;f<g.N;f++) feedPlayer(g,f,L);
  for(let f=0;f<g.N;f++) payTroops(g,f,L);
  Z.forEach(z=>{ if(isPl(z.owner)) runRoutes(g,z,L); });
  Z.forEach(z=>{ if(isPl(z.owner)) growZone(g,z); });
  Z.forEach(z=>{
    for(const fs in z.units){ const f=Number(fs); const M=g.M[f]||newMods();
      z.units[f].forEach(u=>{ if(!UT[u.t].civ&&!UT[u.t].siege&&!u.busy&&!u.mv&&u.w===0) u.str=Math.min(M.forceMax,u.str+M.forceStep); delete u.half; });
    }
    healUnits(g,z);
    if(z.ev&&z.ev.flood&&isPl(z.owner)){ z.food=Math.floor(z.food/2); z.prod=Math.floor(z.prod/2); }
    for(const fs in z.units){ if(!z.units[fs].length) delete z.units[fs]; }
  });
  for(let f=0;f<g.N;f++) g.F[f].caravanUsed=0;
}
// Envíos automáticos: cada paso, después de alimentar, la zona manda lo indicado (o todo su sobrante)
// a otra zona propia, pagando la logística en oro como un envío normal.
/** @param {Partida} g */
function runRoutes(g,z,L){
  const f=z.owner; if(!z.routes||!z.routes.length) return;
  z.routes=z.routes.filter(r=>{ const to=g.zones[r.to]; return to&&(to.owner===f||allied(g,f,to.owner)); });
  z.routes.forEach(r=>{
    const key=r.res==='food'?'food':'prod';
    const spare=key==='food'?z.food-(z.f0||0):z.prod-(z.p0||0);
    const q=r.q==='sobrante'?Math.max(0,Math.floor(spare)):Math.min(r.q,Math.floor(z[key]));
    if(q>0) doSend(g,{f,from:z.id,to:r.to,res:key,q,auto:1},()=>{});
  });
}
// Zona peligrosa (antes frontera): mientras todos los que tienen tropas ahí estén en paz, cada uno gana FRONTIER_SHARED de oro;
// quien está solo gana FRONTIER_ALONE. Si hay conflicto en la zona, nadie gana nada ese paso.
/** @param {Partida} g */
function frontierIncome(g,L){
  g.zones.forEach(z=>{
    if(z.role!=='frontera') return; z.frontGain={}; z.fh=z.fh||{};
    const here=presentF(z).filter(f=>isPl(f)&&(z.units[f]||[]).some(u=>!UT[u.t].civ));   // solo cuentan las tropas
    Object.keys(z.fh).forEach(k=>{ if(!here.includes(Number(k))) delete z.fh[k]; });   // quien pierde la presencia empieza de 0
    if(!here.length) return;
    const base=here.length>=2?FRONTIER_SHARED:FRONTIER_ALONE;
    here.forEach(f=>{ const s=z.fh[f]||0;   // pasos seguidos con presencia (compartida o sola)
      if(!z.conflict){ const n=Math.round(base*(1+Math.min(FRONTIER_GROW_MAX,FRONTIER_GROW*s))); g.F[f].gold+=n; z.frontGain[f]=n; }
      z.fh[f]=s+1; });
  });
}
/** @param {Partida} g */
function unitNeed(g,z,f,u,freeSlots){
  const M=g.M[f], ex=(z.ev&&z.ev.cons)||0;
  const am=aptMul(u);   // rasgo de apetito: bueno come menos
  if(UT[u.t].civ) return 1*am+ex;
  u.free=0; const up=(UNIT_UPKEEP[u.t]||{food:1}).food;
  if(z.owner===f){ if(freeSlots.n>0&&!UT[u.t].siege){ freeSlots.n--; u.free=1; return 0; } if(M.permanente&&z.b.some(b=>b.t==='cuartel')){ u.free=1; return 0; } return up*(M.garrison?0.5:1)*am+ex; }   // Guarniciones: comen la mitad en casa
  return up*(M.supplies?1:CAMPAIGN_FOOD)*am+ex;   // en campaña cuesta más (menos con Suministros de campaña)
}
// Zonas propias desde las que la gente de `from` puede recibir comida, de la más cercana a la más lejana.
// Dentro del propio territorio (o en una frontera) la red llega lejos: la comida circula por tus caminos.
// Fuera, hace falta una línea de suministro corta y segura: como máximo SUPPLY_RANGE zonas y sin pasar
// por zonas de un enemigo. Si no hay ninguna, las tropas quedan aisladas y pasan hambre.
/** @param {Partida} g */
function supplySourcesD(g,f,from){
  const z0=g.zones[from]; const propio=z0.owner===f||z0.role==='frontera';
  const limite=propio?99:SUPPLY_RANGE+(g.M[f].supplies?1:0);
  const paso=z=>z.owner===f||z.role==='frontera'||z.owner===null||allied(g,f,z.owner);
  const dist={}; dist[from]=0; const q=[from], out=[];
  while(q.length){
    const a=q.shift(); if(a!==from&&g.zones[a].owner===f) out.push([a,dist[a]]);
    if(dist[a]>=limite) continue;
    for(const b of g.zones[a].adj) if(!(b in dist)&&paso(g.zones[b])){ dist[b]=dist[a]+1; q.push(b); }
  }
  return out.sort((x,y)=>x[1]-y[1]);
}
/** @param {Partida} g */
function supplySources(g,f,from){ return supplySourcesD(g,f,from).map(x=>x[0]); }
// Cada jugador alimenta a toda su gente: cada zona come primero de lo suyo y lo que falta sale,
// sin costo, de la zona propia más cercana que tenga comida, y luego de la siguiente.
/** @param {Partida} g */
function feedPlayer(g,f,L){
  const zs=g.zones.filter(z=>(z.units[f]||[]).length); const deficit={};
  zs.forEach(z=>{
    const us=z.units[f]; const free={n:z.owner===f?z.b.filter(b=>b.t==='cuartel').reduce((a,b)=>a+(b.wk||0),0):0};
    let need=0; us.forEach(u=>{ u.need=unitNeed(g,z,f,u,free); need+=u.need; }); need=Math.ceil(need-1e-9);   // los rasgos de apetito dan fracciones: se redondea hacia arriba por zona
    z.feed=z.feed||{}; z.feed[f]={need,local:0,from:{},short:0,line:null};
    if(z.owner===f){ const pay=Math.min(z.food,need); z.food-=pay; need-=pay; z.feed[f].local=pay; }
    if(need>0) deficit[z.id]=need;
  });
  Object.keys(deficit).map(Number).forEach(id=>{
    let need=deficit[id];
    const src0=supplySourcesD(g,f,id); g.zones[id].feed[f].line=src0.length?src0[0][0]:null; g.zones[id].feed[f].gold=0;
    for(const [s,dist] of src0){ if(need<=0) break; const src=g.zones[s]; let t=Math.min(src.food,need); if(t<=0) continue;
      // mover comida de otra zona cuesta oro de logística, como un envío (distancia, Caminos y caravanas)
      const Mf=g.M[f], Ff=g.F[f]; const path=ownPath(g,f,s,id,99);
      let fac=path?shipFactor(g,path):dist*(g.logiMult||1); if(Mf.freeFoodAdj&&path&&path.length===1) fac=0;
      let cost=0;
      if(fac>0){ const fr=Math.max(0,Mf.caravan-(Ff.caravanUsed||0)); cost=Math.ceil(Math.max(0,t-fr)*fac);
        if(cost>Ff.gold){ t=Math.min(t,Math.floor(Ff.gold/fac)+fr); cost=Math.ceil(Math.max(0,t-fr)*fac); }
        if(t<=0) continue; Ff.gold-=cost; Ff.caravanUsed=(Ff.caravanUsed||0)+Math.min(fr,t); if(Mf.logiRefund&&cost>0) Ff.gold+=Math.floor(cost*Mf.logiRefund); }
      src.food-=t; need-=t; g.zones[id].feed[f].from[s]=t; g.zones[id].feed[f].gold+=cost; src.feedOut=(src.feedOut||0)+t; }
    deficit[id]=need; g.zones[id].feed[f].short=need;
  });
  zs.forEach(z=>{
    const us=z.units[f]; const M=g.M[f]; let d=deficit[z.id]||0;
    if(d<=0){ us.forEach(u=>{ u.hg=0; }); return; }
    const order=us.slice().sort((a,b)=>b.need-a.need);
    order.forEach(u=>{ if(d>0&&u.need>0){ d-=u.need; u.hg++; if(u.hg>=M.hungerSteps||(u.w>0&&u.hg>=1)) u.dead=1; } else u.hg=0; });
    const before=us.length; us.filter(u=>u.dead).forEach(u=>unitLost(g,u,f)); z.units[f]=us.filter(u=>!u.dead); const dead=before-z.units[f].length;
    if(dead>0){
      if(z.owner===f&&!z.conflict) us.filter(u=>u.dead&&EQUIP_COST[u.t]).forEach(u=>{ z.eq=z.eq||{}; z.eq[u.t]=(z.eq[u.t]||0)+1; });
      L(PLN[f].name+': '+dead+' unidad'+(dead>1?'es':'')+' mueren de hambre en '+zname(z)+'.');
    }
  });
}
// Paga de las tropas: oro por paso según su tipo (y un extra por cada general). Los que trabajan en un Cuartel no cobran. Si no alcanza el oro,
// las tropas sin paga pelean con la mitad de los dados ese paso (las que más cobran se quedan sin paga primero).
/** @param {Partida} g */
function payTroops(g,f,L){
  const F=g.F[f], M=g.M[f]; if(!F||!isPl(f)) return; const due=[];
  g.zones.forEach(z=>{ (z.units[f]||[]).forEach(u=>{ if(UT[u.t].civ){ u.unp=0; return; } const p=((UNIT_UPKEEP[u.t]||{gold:0}).gold+(u.gen?GEN_PAY:0))*M.payMul; if(p>0&&!u.free) due.push([u,p]); else u.unp=0; }); });
  if(!due.length) return; due.sort((a,b)=>a[1]-b[1]); let total=Math.ceil(due.reduce((a,x)=>a+x[1],0-1e-9));
  if(F.gold>=total){ F.gold-=total; due.forEach(x=>{ x[0].unp=0; }); return; }
  let left=F.gold; F.gold=0; let miss=0; due.forEach(([u,p])=>{ if(left>=p){ left-=p; u.unp=0; } else { u.unp=1; miss++; } });
  if(miss) L(PLN[f].name+': no alcanza el oro para pagar a '+miss+' tropa'+(miss>1?'s':'')+': pelean peor este paso.');
}
// Crecimiento según la prioridad de la zona: 'crecer' manda todo el sobrante del paso a crecer;
// 'guardar' lo deja en el almacén. En los dos casos, lo que no cabe en el almacén va a crecer.
/** @param {Partida} g */
function growZone(g,z){
  const f=z.owner; if(!(z.units[f]||[]).length){ z.food=Math.min(z.food,capStore(g,z,'food')); return; }
  const gain=z.food-(z.f0||0);
  if((z.growMode||GROW_MODE_DEFAULT)==='crecer'&&gain>0){ z.food-=gain; z.prog+=gain; }
  const cf=capStore(g,z,'food'), cp=capStore(g,z,'prod');
  if(z.food>cf){ z.prog+=z.food-cf; z.food=cf; }
  let c=growCost(g,f,z); while(z.prog>=c){ z.prog-=c; z.size++; z.grow++; if((z.repop||0)>0) z.repop--; c=growCost(g,f,z); }
  if(z.prod>cp) z.prod=cp;
}
// Estimación de pasos hasta el próximo poblador, con la producción y el consumo del último paso.
/** @param {Partida} g */
function growETA(g,z){
  const f=z.owner; if(!isPl(f)) return null; if(!z.last) return undefined;   // todavía sin un paso con qué calcular
  const need=(z.units[f]||[]).reduce((a,u)=>a+(u.need!==undefined?u.need:1),0);
  const net=z.last.food-need; if(net<=0) return null;
  let food=z.food, prog=z.prog; const cf=capStore(g,z,'food'), c=growCost(g,f,z), grow=(z.growMode||GROW_MODE_DEFAULT)==='crecer';
  for(let k=1;k<=60;k++){ if(grow) prog+=net; else { food+=net; if(food>cf){ prog+=food-cf; food=cf; } } if(prog>=c) return k; }
  return null;
}
