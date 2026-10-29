'use strict';
// Ventana de premios de la subasta: al resolverse, cada cosa que ganaste sale en su tarjeta (qué es, qué trae y dónde llegó),
// con un sonido especial; debajo, lo que no ganaste y se te devolvió. Los datos vienen de los eventos `auctionwin` y `auctionlost` del motor.

/** Una línea por detalle de lo ganado, según la categoría del objeto. */
function premioDetalle(e){
  const g=e.got||{}, zn=g.zone!==undefined&&G.zones[g.zone]?zname(G.zones[g.zone]):'';
  if(g.kind==='pel') return `<div class="pdl">${(g.units||[]).map(u=>`<span class="pu">${uIcon(u.t,38)}<b>×${u.n}</b><small>${esc(u.n>1?UNP[u.t]:UN[u.t])}</small></span>`).join('')}</div><div class="pds">Llegan a ${esc(zn)}</div>`;
  if(g.kind==='pob'){ const p=g.pid?personById(g.pid):null; return `<div class="pdl"><span class="pu">${uIcon('pob',38)}</span>${(g.tr||[]).map(x=>`<span class="pu">${traitBadge(x,true)}<small>${esc(TRAIT_INFO[x.k].n)} ${x.l>0?'+':''}${x.l}</small></span>`).join('')}</div><div class="pds">Llega a ${esc(zn)}${p?' · '+esc(personName(p)):''}</div>`; }
  if(g.kind==='sab'){ if(g.tech){ const t=TECHS.find(x=>x.n===g.tech); return `<div class="pds"><b>${esc(g.tech)}</b></div>${t?`<div class="pds">${esc(t.ef)}</div>`:''}<div class="pds">Sin pagar su costo</div>`; } return `<div class="pds">+${g.sci||0} de ciencia (no había nada que enseñar)</div>`; }
  if(g.kind==='car'){ const nm=g.res==='food'?'comida':'producción'; let s=g.res==='food'?`directo al crecimiento de ${zn}`:`${g.stored||0} al almacén de ${zn}`+(g.toWork?` y ${g.toWork} directo a una obra`:''); return `<div class="pdl"><span class="pu"><span class="prr">${RI[g.res==='food'?'food':'prod']}</span><b>${g.n}</b><small>${nm}</small></span></div><div class="pds">${esc(s)}</div>`; }
  if(g.kind==='rec'){ const R=RES[g.key]; return `<div class="pds"><b>${esc(R.n)}</b></div><div class="pds">${esc(R.d)}</div><div class="pds">Durante ${g.steps} pasos</div>`; }
  return '';
}
function premiosHTML(wins,lost){
  let h=`<div class="phd"><b>🔨 ¡Subasta resuelta!</b><small>${wins.length?(wins.length===1?'Ganaste 1 objeto':'Ganaste '+wins.length+' objetos'):'Esta vez no ganaste nada'}</small></div><div class="pcards">`;
  wins.forEach((e,i)=>{ h+=`<div class="pcard t${e.tier}" style="--d:${(0.15+i*0.5).toFixed(2)}s"><div class="pcart">${chestArt(e.tier,e.cat)}</div><div class="pcb"><b>${AUCTION_CATS[e.cat]}</b><small>${AUCTION_TIER_ICON[e.tier]} ${AUCTION_TIERS[e.tier]}</small>${premioDetalle(e)}<div class="ppay">Pagaste ${e.paid} de ${RN_AUC[e.cur]}</div></div></div>`; });
  h+='</div>';
  if(lost.length) h+=`<div class="plost"><b>No ganaste (se te devolvió lo apartado):</b>${lost.map(e=>`<div class="plr">${chestArt(e.tier,e.cat).replace('class="cart"','class="cart sm"')}<span>${AUCTION_CATS[e.cat]} (${AUCTION_TIERS[e.tier]}): te devolvimos ${e.amt} de ${RN_AUC[e.cur]}</span></div>`).join('')}</div>`;
  return h+`<div class="row pfoot"><button class="btn primary" data-act="premclose">¡Genial!</button></div>`;
}
function openPremios(){
  const wins=ui.aucWins||[], lost=ui.aucLost||[]; ui.aucWins=[]; ui.aucLost=[]; if(!wins.length&&!lost.length) return;
  const d=$('dlgPremios'); if(!d) return; $('premiosBody').innerHTML=premiosHTML(wins,lost); if(typeof i18nApply==='function') i18nApply(d);
  if(!d.open) d.showModal();
  if(wins.length){ sfx('auctionwin',0); wins.forEach((e,i)=>sfxLater('auctionitem',250+i*500,0)); } else sfx('click');
}
function closePremios(){ const d=$('dlgPremios'); if(d&&d.open) d.close(); }
