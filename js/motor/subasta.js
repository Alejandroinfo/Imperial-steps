// @ts-check
'use strict';
// Subasta a sobre cerrado (reglas 13.3): cada 20 pasos, a todos los jugadores a la vez.
//  - Se anuncia AUCTION_NOTICE pasos antes (para poder acumular la moneda): moneda y, de cada objeto, su categoría y nivel (bronce, plata u oro); nada más.
//  - Hay tantos objetos como jugadores y cada uno se subasta por separado: cada quien ofrece lo que quiera, en secreto.
//  - Gana la oferta más alta; si empatan arriba, todos los empatados se lo llevan.
//  - Lo que ofreces se APARTA al instante (sale de tu total y ya no puedes gastarlo en otra cosa) y solo puedes SUBIRLO. Quien no gana recupera todo lo que apartó al resolverse.
//  - Con comida o producción se aparta de todo el imperio, descontando el mismo porcentaje de cada zona que la tiene (se recuerda de dónde salió, para devolverlo ahí).

/** @param {Partida} g */
function auctionFunds(g,f,cur){
  if(cur==='gold'||cur==='tech') return Math.floor(g.F[f][cur]);
  return zonesOf(g,f).reduce((a,z)=>a+Math.floor(z[cur]),0);
}
// Paga `amount` en esa moneda; la comida y la producción salen de cada zona en igual porcentaje.
/** @param {Partida} g */
function auctionPay(g,f,cur,amount){
  /** @type {{z:number,n:number}[]} */ const src=[];
  if(cur==='gold'||cur==='tech'){ g.F[f][cur]-=amount; return src; }
  const zs=zonesOf(g,f).filter(z=>z[cur]>=1); const total=zs.reduce((a,z)=>a+Math.floor(z[cur]),0); if(total<=0) return src;
  const ratio=amount/total; let paid=0; const take=(z,t)=>{ if(t<=0) return; z[cur]-=t; paid+=t; const e=src.find(x=>x.z===z.id); if(e) e.n+=t; else src.push({z:z.id,n:t}); };
  zs.forEach(z=>take(z,Math.min(Math.floor(z[cur]),Math.floor(Math.floor(z[cur])*ratio))));
  for(const z of zs){ if(paid>=amount) break; take(z,Math.min(Math.floor(z[cur]),amount-paid)); }   // lo que sobró del redondeo
  return src;
}
// Devuelve lo apartado: oro y ciencia, al total; comida y producción, a las zonas de donde salieron (hasta donde quepa; el resto, a otra zona tuya con lugar).
/** @param {Partida} g @param {{z:number,n:number}[]} src */
function auctionRefund(g,f,cur,amount,src){
  if(cur==='gold'||cur==='tech'){ g.F[f][cur]+=amount; return; }
  const mine=zonesOf(g,f); let rest=0;
  (src||[]).forEach(e=>{ const z=g.zones[e.z]; if(z&&z.owner===f){ const put=Math.min(e.n,Math.max(0,capStore(g,z,cur)-z[cur])); z[cur]+=put; rest+=e.n-put; } else rest+=e.n; });
  for(const z of mine){ if(rest<=0) break; const put=Math.min(rest,Math.max(0,capStore(g,z,cur)-z[cur])); z[cur]+=put; rest-=put; }
}
// Valor esperado de un objeto, expresado en la moneda de la subasta (💡 estimación: ver AUCTION_VAL_* en config/reglas.js).
// Solo usa lo que se sabe en el anuncio (categoría y nivel): del cargamento no se mira qué recurso ni cuánto salió; se promedian.
/** @param {{cat:string,tier:number,det:any}} it @param {string} cur */
function auctionValue(it,cur){
  const V=AUCTION_VAL_RES; let gold=0;
  if(it.cat==='pel'){ const u=AUCTION_PEL[it.tier]; Object.keys(u).forEach(t=>{ const c=UNIT_COST[t]; gold+=u[t]*(c.prod*V.prod+c.food*V.food+c.gold*V.gold); }); }
  else if(it.cat==='pob') gold=AUCTION_VAL_POB[it.tier];
  else if(it.cat==='sab') gold=AUCTION_SAB[it.tier]*AUCTION_VAL_SAB*V.tech;
  else if(it.cat==='car'){ const r=AUCTION_CAR_RANGE[it.tier]; gold=(r[0]+r[1])/2*(V.food+V.prod)/2; }
  else if(it.cat==='rec') gold=AUCTION_VAL_REC[it.tier];
  return gold/V[cur];
}
/** @param {Partida} g */
function auctionNew(g,step){
  const alive=[]; for(let f=0;f<g.N;f++) if(!g.F[f].out) alive.push(f);
  const cats=Object.keys(AUCTION_CATS), items=[];
  for(let i=0;i<alive.length;i++){
    const cat=cats[Math.floor(g.rng()*cats.length)]; const r=g.rng(); let acc=0, tier=2; for(let k=0;k<3;k++){ acc+=AUCTION_TIER_ODDS[k]; if(r<acc){ tier=k; break; } }
    // del cargamento se sortea ya cuánto toca y de qué recurso; los jugadores solo saben el rango (y del recurso, nada)
    const det={}; if(cat==='car'){ det.res=g.rng()<0.5?'food':'prod'; const r=AUCTION_CAR_RANGE[tier]; det.n=r[0]+Math.floor(g.rng()*(r[1]-r[0]+1)); } if(cat==='rec'){ const l=AUCTION_REC[tier]; det.key=l[Math.floor(g.rng()*l.length)]; }
    items.push({cat,tier,det});
  }
  /** @type {Recurso} */
  const cur=/** @type {Recurso} */(AUCTION_CURRENCIES[Math.floor(g.rng()*AUCTION_CURRENCIES.length)]);
  return {step,cur,items,bids:{}};
}
// Regala una tecnología (sin pagar su costo) de nivel hasta maxLevel que pueda investigar; si no hay, da ciencia.
/** @param {Partida} g */
function grantTech(g,f,maxLevel,L,tag){
  const F=g.F[f]; const cands=TECHS.filter(t=>!F.techs[t.n]&&t.l<=maxLevel&&researchBlock(g,f,t.n)===null);
  if(cands.length){ const t=cands[Math.floor(g.rng()*cands.length)]; F.techs[t.n]=g.step; recomputeMods(g); L(tag+'aprende «'+t.n+'» sin pagar su costo.'); }
  else { const n=20*maxLevel; F.tech+=n; L(tag+'no había nada que enseñarle y recibe '+n+' de ciencia.'); }
}
// Entrega el objeto ganado a ese jugador (en su capital, o en su zona con más gente).
/** @param {Partida} g */
function auctionAward(g,f,it,L){
  const zs=zonesOf(g,f); if(!zs.length) return null; const home=zs.find(z=>z.capital)||zs[0]; const F=g.F[f]; const tag=PLN[f].name+' gana '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+'): ';
  /** @type {any} detalle de lo recibido, para la ventana de premios */ let got={kind:it.cat,zone:home.id};
  if(it.cat==='pel'){ const u=AUCTION_PEL[it.tier]; Object.keys(u).forEach(t=>{ for(let i=0;i<u[t];i++) lst(home,f).push(mkUnit(g,f,t)); }); L(tag+Object.keys(u).map(t=>u[t]+' '+(u[t]>1?UNP[t]:UN[t]).toLowerCase()).join(', ')+' en '+zname(home)+'.'); got.units=Object.keys(u).map(t=>({t,n:u[t]})); }
  else if(it.cat==='pob'){ const u=mkUnit(g,f,'pob'); const kinds=['agr','ing','com','cie'].sort(()=>g.rng()-0.5).slice(0,2); u.tr=kinds.map((k,i)=>({k,l:AUCTION_POB[it.tier][i]})); lst(home,f).push(u); got.tr=u.tr.map(x=>({k:x.k,l:x.l})); got.pid=u.id; L(tag+'llega un poblador con '+u.tr.map(x=>TRAIT_INFO[x.k].n+' '+(x.l>0?'+':'')+x.l).join(' y ')+' en '+zname(home)+'.'); }
  else if(it.cat==='sab'){ const antes=Object.keys(F.techs).length; const sci=F.tech; grantTech(g,f,AUCTION_SAB[it.tier],L,tag); if(Object.keys(F.techs).length>antes){ got.tech=Object.keys(F.techs).sort((a,b)=>F.techs[b]-F.techs[a])[0]; } else got.sci=Math.round(F.tech-sci); }
  else if(it.cat==='car'){ const n=it.det.n||AUCTION_CAR[it.tier];
    got.res=it.det.res; got.n=n; if(it.det.res==='food'){ home.prog+=n; L(tag+n+' de comida entran directo al crecimiento de '+zname(home)+'.'); }
    else { const room=Math.max(0,capStore(g,home,'prod')-home.prod); const put=Math.min(room,n); home.prod+=put; let rest=n-put; const pr=zs.flatMap(z=>z.proj).find(p=>p.left>0); if(rest>0&&pr){ const use=Math.min(rest,pr.left); pr.left-=use; rest-=use; } got.toWork=n-put-rest>0&&rest<n-put?n-put-rest:0; got.stored=put; L(tag+n+' de producción llegan a '+zname(home)+(rest<n-put?', y el resto va directo a una obra':'')+'.'); } }
  else if(it.cat==='rec'){ F.tres=(F.tres||[]).filter(r=>r.key!==it.det.key); F.tres.push({key:it.det.key,until:g.step+AUCTION_RES_STEPS}); got.key=it.det.key; got.steps=AUCTION_RES_STEPS; L(tag+RES[it.det.key].n+' durante '+AUCTION_RES_STEPS+' pasos ('+RES[it.det.key].d+')'); }
  return got;
}
/** @param {Partida} g */
function auctionResolve(g,L){
  const a=g.auction; if(!a) return; let any=false;
  a.items.forEach((it,i)=>{
    // las ofertas ya están apartadas (se pagaron al hacerlas): gana la más alta; el resto recupera lo suyo
    const offers=Object.keys(a.bids).map(Number).filter(f=>!g.F[f].out&&(a.bids[f][i]||0)>0).map(f=>({f,amt:a.bids[f][i]}));
    if(!offers.length){ L('Subasta: nadie ofreció por '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+').'); return; }
    const top=Math.max(...offers.map(o=>o.amt)); const winners=offers.filter(o=>o.amt===top); any=true;
    offers.filter(o=>o.amt<top).forEach(o=>{ auctionRefund(g,o.f,a.cur,o.amt,((a.src||{})[o.f]||{})[i]||[]); g.fx.push({k:'auctionlost',f:o.f,cat:it.cat,tier:it.tier,amt:o.amt,cur:a.cur}); });
    winners.forEach(w=>{ L('Subasta: '+PLN[w.f].name+' gana '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+') ofreciendo '+w.amt+' de '+RN_AUC[a.cur]+(winners.length>1?' (empate: todos los empatados se lo llevan)':'')+'.'); const got=auctionAward(g,w.f,it,L); g.fx.push({k:'auctionwin',f:w.f,cat:it.cat,tier:it.tier,paid:w.amt,cur:a.cur,got}); });
  });
  // quien se quedó sin jugar (eliminado) pierde lo apartado; lo demás ya está resuelto
  g.fx.push({k:'auctionend',any});
  g.auction=null;
}
const RN_AUC={gold:'oro',tech:'ciencia',food:'comida',prod:'producción'};
// Al final de cada paso: resolver la subasta si toca, o anunciar la próxima AUCTION_NOTICE pasos antes.
/** @param {Partida} g */
function auctionTick(g,L){
  if(g.auction&&g.step>=g.auction.step){ auctionResolve(g,L); return; }
  const A=g.step+AUCTION_NOTICE+1;   // el paso en que empezaría la subasta si se anuncia ahora (aparece al empezar el paso A-AUCTION_NOTICE)
  if(!g.auction&&A%AUCTION_EVERY===0&&A>=AUCTION_EVERY){ g.auction=auctionNew(g,A); g.fx.push({k:'auctionnotice',step:A,cur:g.auction.cur}); L('¡Subasta en '+AUCTION_NOTICE+' pasos (paso '+A+')! Se paga con '+RN_AUC[g.auction.cur]+'. Objetos: '+g.auction.items.map(it=>AUCTION_CATS[it.cat]+' '+AUCTION_TIER_ICON[it.tier]).join(', ')+'.'); }
}
// Orden de oferta: una por objeto. `amount` es lo que ofreces EN TOTAL por ese objeto; solo puede subir. La diferencia se aparta al instante
// (sale de tu total, así no puedes gastarla en otra cosa) y, si no alcanza, se aparta hasta donde alcance. Quien no gana recupera lo apartado.
/** @param {Partida} g */
function doBid(g,o,L){
  const a=g.auction; if(!a||g.step>a.step||g.F[o.f].out) return; const i=Math.floor(o.item); if(!a.items[i]) return;
  a.bids[o.f]=a.bids[o.f]||{}; const have=a.bids[o.f][i]||0; const want=Math.max(0,Math.floor(o.amount||0)); if(want<=have) return;
  const add=Math.min(want-have,auctionFunds(g,o.f,a.cur)); if(add<=0) return;
  const src=auctionPay(g,o.f,a.cur,add); const paid=(a.cur==='gold'||a.cur==='tech')?add:src.reduce((x,e)=>x+e.n,0); if(paid<=0) return;
  a.bids[o.f][i]=have+paid;
  if(a.cur==='food'||a.cur==='prod'){ a.src=a.src||{}; a.src[o.f]=a.src[o.f]||{}; const cur=(a.src[o.f][i]=a.src[o.f][i]||[]); src.forEach(e=>{ const x=cur.find(y=>y.z===e.z); if(x) x.n+=e.n; else cur.push({z:e.z,n:e.n}); }); }
}
