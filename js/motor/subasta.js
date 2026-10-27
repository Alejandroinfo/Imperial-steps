// @ts-check
'use strict';
// Subasta a sobre cerrado (reglas 13.3): cada 20 pasos, a todos los jugadores a la vez.
//  - Se anuncia 2 pasos antes: moneda y, de cada objeto, su categoría y nivel (bronce, plata u oro); nada más.
//  - Hay tantos objetos como jugadores y cada uno se subasta por separado: cada quien ofrece lo que quiera, en secreto.
//  - Gana la oferta más alta; si empatan arriba, todos los empatados se lo llevan. Los demás no pagan nada.
//  - Con comida o producción se paga de todo el imperio, descontando el mismo porcentaje de cada zona que la tiene.

/** @param {Partida} g */
function auctionFunds(g,f,cur){
  if(cur==='gold'||cur==='tech') return Math.floor(g.F[f][cur]);
  return zonesOf(g,f).reduce((a,z)=>a+Math.floor(z[cur]),0);
}
// Paga `amount` en esa moneda; la comida y la producción salen de cada zona en igual porcentaje.
/** @param {Partida} g */
function auctionPay(g,f,cur,amount){
  if(cur==='gold'||cur==='tech'){ g.F[f][cur]-=amount; return; }
  const zs=zonesOf(g,f).filter(z=>z[cur]>=1); const total=zs.reduce((a,z)=>a+Math.floor(z[cur]),0); if(total<=0) return;
  const ratio=amount/total; let paid=0;
  zs.forEach(z=>{ const t=Math.min(Math.floor(z[cur]),Math.floor(Math.floor(z[cur])*ratio)); z[cur]-=t; paid+=t; });
  for(const z of zs){ if(paid>=amount) break; const t=Math.min(Math.floor(z[cur]),amount-paid); z[cur]-=t; paid+=t; }   // lo que sobró del redondeo
}
/** @param {Partida} g */
function auctionNew(g,step){
  const alive=[]; for(let f=0;f<g.N;f++) if(!g.F[f].out) alive.push(f);
  const cats=Object.keys(AUCTION_CATS), items=[];
  for(let i=0;i<alive.length;i++){
    const cat=cats[Math.floor(g.rng()*cats.length)]; const r=g.rng(); let acc=0, tier=2; for(let k=0;k<3;k++){ acc+=AUCTION_TIER_ODDS[k]; if(r<acc){ tier=k; break; } }
    const det={}; if(cat==='car') det.res=g.rng()<0.5?'food':'prod'; if(cat==='rec'){ const l=AUCTION_REC[tier]; det.key=l[Math.floor(g.rng()*l.length)]; }
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
  const zs=zonesOf(g,f); if(!zs.length) return; const home=zs.find(z=>z.capital)||zs[0]; const F=g.F[f]; const tag=PLN[f].name+' gana '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+'): ';
  if(it.cat==='pel'){ const u=AUCTION_PEL[it.tier]; Object.keys(u).forEach(t=>{ for(let i=0;i<u[t];i++) lst(home,f).push(mkUnit(g,f,t)); }); L(tag+Object.keys(u).map(t=>u[t]+' '+(u[t]>1?UNP[t]:UN[t]).toLowerCase()).join(', ')+' en '+zname(home)+'.'); }
  else if(it.cat==='pob'){ const u=mkUnit(g,f,'pob'); const kinds=['agr','ing','com','cie'].sort(()=>g.rng()-0.5).slice(0,2); u.tr=kinds.map((k,i)=>({k,l:AUCTION_POB[it.tier][i]})); lst(home,f).push(u); L(tag+'llega un poblador con '+u.tr.map(x=>TRAIT_INFO[x.k].n+' '+(x.l>0?'+':'')+x.l).join(' y ')+' en '+zname(home)+'.'); }
  else if(it.cat==='sab'){ grantTech(g,f,AUCTION_SAB[it.tier],L,tag); }
  else if(it.cat==='car'){ const n=AUCTION_CAR[it.tier];
    if(it.det.res==='food'){ home.prog+=n; L(tag+n+' de comida entran directo al crecimiento de '+zname(home)+'.'); }
    else { const room=Math.max(0,capStore(g,home,'prod')-home.prod); const put=Math.min(room,n); home.prod+=put; let rest=n-put; const pr=zs.flatMap(z=>z.proj).find(p=>p.left>0); if(rest>0&&pr){ const use=Math.min(rest,pr.left); pr.left-=use; rest-=use; } L(tag+n+' de producción llegan a '+zname(home)+(rest<n-put?', y el resto va directo a una obra':'')+'.'); } }
  else if(it.cat==='rec'){ F.tres=(F.tres||[]).filter(r=>r.key!==it.det.key); F.tres.push({key:it.det.key,until:g.step+AUCTION_RES_STEPS}); L(tag+RES[it.det.key].n+' durante '+AUCTION_RES_STEPS+' pasos ('+RES[it.det.key].d+')'); }
  g.fx.push({k:'auctionwin',f,cat:it.cat,tier:it.tier});
}
/** @param {Partida} g */
function auctionResolve(g,L){
  const a=g.auction; if(!a) return; let any=false;
  // ofertas válidas: de cada jugador se conservan las más altas que pueda pagar
  const valid={}; Object.keys(a.bids).forEach(fs=>{ const f=Number(fs); if(g.F[f].out) return; let left=auctionFunds(g,f,a.cur); valid[f]={};
    Object.keys(a.bids[f]).map(Number).sort((x,y)=>a.bids[f][y]-a.bids[f][x]).forEach(i=>{ const amt=a.bids[f][i]; if(amt>0&&amt<=left){ valid[f][i]=amt; left-=amt; } }); });
  a.items.forEach((it,i)=>{
    const offers=Object.keys(valid).map(Number).filter(f=>valid[f][i]>0).map(f=>({f,amt:valid[f][i]})); if(!offers.length){ L('Subasta: nadie ofreció por '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+').'); return; }
    const top=Math.max(...offers.map(o=>o.amt)); const winners=offers.filter(o=>o.amt===top); any=true;
    winners.forEach(w=>{ auctionPay(g,w.f,a.cur,w.amt); L('Subasta: '+PLN[w.f].name+' gana '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+') ofreciendo '+w.amt+' de '+RN_AUC[a.cur]+(winners.length>1?' (empate: todos los empatados se lo llevan)':'')+'.'); auctionAward(g,w.f,it,L); });
  });
  g.fx.push({k:'auctionend',any});
  g.auction=null;
}
const RN_AUC={gold:'oro',tech:'ciencia',food:'comida',prod:'producción'};
// Al final de cada paso: resolver la subasta si toca, o anunciar la próxima 2 pasos antes.
/** @param {Partida} g */
function auctionTick(g,L){
  if(g.auction&&g.step>=g.auction.step){ auctionResolve(g,L); return; }
  const A=g.step+AUCTION_NOTICE+1;   // el paso en que empezaría la subasta si se anuncia ahora (aparece al empezar el paso A-2)
  if(!g.auction&&A%AUCTION_EVERY===0&&A>=AUCTION_EVERY){ g.auction=auctionNew(g,A); g.fx.push({k:'auctionnotice',step:A,cur:g.auction.cur}); L('¡Subasta en '+AUCTION_NOTICE+' pasos (paso '+A+')! Se paga con '+RN_AUC[g.auction.cur]+'. Objetos: '+g.auction.items.map(it=>AUCTION_CATS[it.cat]+' '+AUCTION_TIER_ICON[it.tier]).join(', ')+'.'); }
}
// Orden de oferta: una por objeto; 0 la quita. Se puede cambiar hasta el paso de la subasta.
/** @param {Partida} g */
function doBid(g,o,L){
  const a=g.auction; if(!a||g.step>a.step||g.F[o.f].out) return; const i=Math.floor(o.item); if(!a.items[i]) return;
  const amt=Math.max(0,Math.floor(o.amount||0)); a.bids[o.f]=a.bids[o.f]||{}; if(amt>0) a.bids[o.f][i]=amt; else delete a.bids[o.f][i];
}
