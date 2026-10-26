'use strict';
// Producción, crecimiento, consumo de comida, hambre y curación.

function growCost(g,f,z){
  const M=g.M[f]; let c=(z.size+1)*(z.size+2)/2-M.growSub; if(M.growHalf) c=Math.ceil(c/2); if(g.growHalfEv) c=Math.ceil(c/2); return Math.max(1,c);
}
function conCap(g,z,f){
  const M=g.M[f]; const us=(z.units[f]||[]).filter(u=>UT[u.t].civ&&u.w===0&&!u.busy&&!u.mv); const dbl=M.terrDouble?2:1; let c=0;
  us.forEach(u=>{ if(u.t==='con') c+=2+M.conUse; else if(u.t==='pob') c+=1+(z.terrain==='col'?dbl*(1+M.tx.col):0); });
  const sp=zoneSpec(g,z,f); if(sp.spec==='con') c+=[0,4,8,12][sp.lvl];
  return c;
}
function produceZone(g,z){
  const f=z.owner; if(!isPl(f)) return; const M=g.M[f], F=g.F[f]; const us=z.units[f]||[];
  const sciAll=us.filter(u=>u.t==='cie'&&u.w===0&&!u.busy&&!u.mv); const nres=Math.min(z.resN||0,sciAll.length); const researchers=new Set(sciAll.slice(0,nres));
  const act=us.filter(u=>UT[u.t].civ&&u.w===0&&!u.busy&&!u.mv&&!researchers.has(u));
  const T=z.terrain, dbl=M.terrDouble?2:1, tx=M.tx[T]||0, ev=z.ev||{};
  let food=0,prod=0,gold=0,tech=0;
  act.forEach(u=>{
    const h=u.half?0.5:1;
    switch(u.t){
      case 'pob': food+=h*Math.max(0,1+M.pobFood+(T==='pra'?dbl*(1+tx):0)+(ev.foodPob||0)); prod+=h*Math.max(0,1+M.pobProd+(T==='mon'?dbl*(1+tx):0)+(ev.prodPob||0)); break;
      case 'agr': food+=h*Math.max(0,2+M.agrFood+(T==='pra'?dbl*(1+tx):0)+(ev.foodAgr||0)); break;
      case 'ing': prod+=h*Math.max(0,2+M.ingProd+(T==='mon'?dbl*(1+tx):0)+(ev.prodIng||0)); break;
      case 'cie': tech+=h*Math.max(0,2+M.cieTech+(T==='lla'?dbl*(1+tx):0)+(ev.techCie||0)); break;
      case 'com': gold+=h*Math.max(0,2+M.comGold+((T==='bos'||T==='rio')?dbl*(1+tx):0)+(ev.goldCom||0)); break;
    }
  });
  const sp=zoneSpec(g,z,f); z.sp=sp; const lv=sp.lvl, zb=[0,4,8,12][lv];
  if(sp.spec==='agr') food+=zb+M.zFoodLvl*lv+(lv===3?M.revol:0);
  if(sp.spec==='ing') prod+=zb+M.zProdLvl*lv;
  if(sp.spec==='com') gold+=zb+(lv===3?M.ruta:0);
  if(sp.spec==='cie'&&nres===0) tech+=zb;
  z.rcap=nres*2+((sp.spec==='cie'&&nres>0)?zb:0); z.nres=nres;
  if(z.capital){ const c=4+M.capExtra; food+=c; prod+=c; gold+=c; tech+=c; }
  // edificios
  let pool=act.slice();
  z.b.forEach(b=>{
    b.wk=0; if(b.t==='mar') return; const def=BT[b.t];
    if(def.mil){ const mil=us.filter(u=>!UT[u.t].civ&&!UT[u.t].siege&&u.w===0); b.wk=Math.min(M.wk,mil.length); return; }
    const elig=b.t==='biblio'?pool.filter(u=>u.t==='cie'):pool; const w=Math.min(M.wk,elig.length); b.wk=w;
    for(let i=0;i<w;i++){ const u=elig[i]; pool.splice(pool.indexOf(u),1); }
    const pw=PERW[Math.min(5,b.l)];
    if(b.t==='molino') food+=w*pw+(b.s==='granero'?Math.min(3,Math.floor(z.food/10)):0);
    else if(b.t==='taller') prod+=w*pw;
    else if(b.t==='mercado') gold+=w*(pw+(z.res==='gemas'?1:0));
    else if(b.t==='biblio') tech+=w*pw;
    else if(b.t==='almacen'&&b.s==='intereses'){ const per=specVal(g,f,'almacen','intereses')||10; gold+=Math.floor((z.food+z.prod)/per); }
    else if(b.t==='hospital'&&b.s==='civil'&&specVal(g,f,'hospital','civil')>=3){ act.forEach(u=>{ if(u.t==='pob'||u.t==='agr') food+=1; else if(u.t==='ing') prod+=1; else if(u.t==='cie') tech+=1; else if(u.t==='com') gold+=1; }); }
  });
  z.food+=Math.round(food); z.prod+=Math.round(prod); F.gold+=Math.round(gold); F.tech+=Math.round(tech);
  z.last={food:Math.round(food),prod:Math.round(prod),gold:Math.round(gold),tech:Math.round(tech)};
}
function globalProduce(g,f){
  const M=g.M[f], F=g.F[f]; const zs=zonesOf(g,f); let gold=0,tech=0;
  if(hasRes(g,f,'ruinas')) tech+=3;
  if(hasRes(g,f,'sal')){ zs.forEach(z=>{ if(z.sp&&z.sp.spec==='com') gold+=2; }); }
  if(M.imp) gold+=Math.floor(zs.length/2);
  if(M.monop) gold+=M.monop*zs.filter(z=>z.res).length;
  if(M.corte){ const k=Math.floor(zs.length/5); if(k>0){ const cap=zs.find(z=>z.capital)||zs[0]; if(cap){ cap.food+=k; cap.prod+=k; gold+=k; tech+=k; } } }
  F.gold+=gold; F.tech+=tech;
}
function healUnits(g,z){
  for(const fs in z.units){ const f=Number(fs); const M=g.M[f]||newMods(); const hosp=z.b.find(b=>b.t==='hospital');
    z.units[f].forEach(u=>{
      if(u.w<=0) return; const civ=UT[u.t].civ; let rate=1+(civ?M.civHeal:M.milHeal)+(hosp?1:0)+(isPl(f)&&hasRes(g,f,'hierbas')?1:0);
      if(hosp&&hosp.s===(civ?'civil':'militar')&&specVal(g,f,'hospital',civ?'civil':'militar')>=2) rate=99;
      if(g.fever) rate=Math.max(1,rate-1);
      u.w=Math.max(0,u.w-rate);
    });
  }
}
function economy(g,L){
  const Z=g.zones; Z.forEach(z=>{ z.rcap=0; z.nres=0; });
  Z.forEach(z=>{ if(isPl(z.owner)){ produceZone(g,z); if(z.last) g.fx.push({k:'prod',zone:z.id,f:z.owner,food:z.last.food,prod:z.last.prod,gold:z.last.gold,tech:z.last.tech}); } });
  for(let f=0;f<g.N;f++) if(!g.F[f].out||g.F[f].ghost) globalProduce(g,f);
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
  Z.forEach(z=>{
    const f=z.owner; if(!isPl(f)||!z.proj.length) return; let cap=conCap(g,z,f); const M=g.M[f];
    for(const p of z.proj.slice()){
      if(cap<=0) break; const need=Math.min(cap,p.left);
      if(z.prod<need) pullRes(g,f,z,'prod',need-z.prod,M.pullDist);
      const spend=Math.min(need,Math.floor(z.prod)); if(spend<=0) continue;
      z.prod-=spend; p.left-=spend; cap-=spend;
      if(p.left<=0){
        z.proj.splice(z.proj.indexOf(p),1);
        if(p.k==='b'){ z.b.push({t:p.bt,l:1,s:null,wk:0,cost:p.tot}); L(zname(z)+': se termina un '+BT[p.bt].n+'.'); g.fx.push({k:'built',zone:z.id,f,bt:p.bt}); }
        else if(p.k==='w'){ z.b.push({t:'mar',l:1,s:null,wk:0,cost:p.tot}); L(PLN[f].name+' termina una Maravilla en '+zname(z)+'.'); g.fx.push({k:'built',zone:z.id,f,bt:'mar'}); }
        else if(p.k==='u'&&z.b[p.bi]){ z.b[p.bi].l=p.to; z.b[p.bi].cost=(z.b[p.bi].cost||0)+p.tot; L(zname(z)+': el '+BT[z.b[p.bi].t].n+' sube a nivel '+p.to+'.'); g.fx.push({k:'upg',zone:z.id,f,bt:z.b[p.bi].t,l:p.to}); }
      }
    }
  });
  // consumo, hambre, crecimiento
  Z.forEach(z=>{
    const f=z.owner; if(isPl(f)) consumeOwn(g,z,L);
    // unidades de otras facciones en la zona: se abastecen de zonas propias vecinas
    for(const fs in z.units){ const o=Number(fs); if(o===z.owner||!isPl(o)) continue; consumeForeign(g,z,o,L); }
  });
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
function consumeOwn(g,z,L){
  const f=z.owner, M=g.M[f]; const us=z.units[f]||[]; const ex=(z.ev&&z.ev.cons)||0;
  const cuartelFree=z.b.filter(b=>b.t==='cuartel').reduce((a,b)=>a+(b.wk||0),0);
  let free=cuartelFree; const hungerList=[]; let need=0;
  us.forEach(u=>{
    let c; if(UT[u.t].civ) c=1+ex; else { if(free>0&&!UT[u.t].siege){ free--; c=0; } else c=(M.garrison?1:2)+ex; }
    u.need=c; need+=c;
  });
  if(z.food>=need){ z.food-=need; us.forEach(u=>{ u.hg=0; }); }
  else {
    let deficit=need-z.food; z.food=0;
    // los más caros de mantener pasan hambre primero
    const order=us.slice().sort((a,b)=>b.need-a.need); let dead=0;
    order.forEach(u=>{ if(deficit>0&&u.need>0){ deficit-=u.need; u.hg++; if(u.hg>=M.hungerSteps||(u.w>0&&u.hg>=1)) u.dead=1; } else u.hg=0; });
    const before=us.length; z.units[f]=us.filter(u=>!u.dead); dead=before-z.units[f].length;
    if(dead>0) L(PLN[f].name+': '+dead+' unidad'+(dead>1?'es':'')+' mueren de hambre en '+zname(z)+'.');
  }
  const cf=capStore(g,z,'food'), cp=capStore(g,z,'prod');
  if(z.food>cf){ const over=z.food-cf; z.food=cf; if((z.units[f]||[]).length>0){ z.prog+=over; let c=growCost(g,f,z); while(z.prog>=c){ z.prog-=c; z.size++; z.grow++; c=growCost(g,f,z); } } }
  if(z.prod>cp) z.prod=cp;
}
function consumeForeign(g,z,f,L){
  const us=z.units[f]; if(!us||!us.length) return; const M=g.M[f]; let need=0;
  us.forEach(u=>{ need+=UT[u.t].civ?1:(M.supplies?1:2); });
  const srcs=z.adj.map(a=>g.zones[a]).filter(a=>a.owner===f).sort((a,b)=>b.food-a.food);
  for(const s of srcs){ if(need<=0) break; const t=Math.min(s.food,need); s.food-=t; need-=t; }
  if(need>0){ const order=us.slice().sort((a,b)=>(UT[b.t].civ?1:2)-(UT[a.t].civ?1:2)); let d=need; order.forEach(u=>{ if(d>0){ d-=UT[u.t].civ?1:2; u.hg++; if(u.hg>=M.hungerSteps) u.dead=1; } }); z.units[f]=us.filter(u=>!u.dead); }
  else us.forEach(u=>{ u.hg=0; });
}
