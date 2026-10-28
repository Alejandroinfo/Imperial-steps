'use strict';
// Pestaña Recursos: subasta (cofres), carrera de maravillas y recursos estratégicos del mapa.

// Subasta a sobre cerrado: un cofre por objeto (color = nivel), con la oferta en ＋/－. Las reglas van en la ayuda (ⓘ).
function auctionHTML(){
  const a=G.auction;
  if(!a){ const nx=Math.ceil((G.step+1)/AUCTION_EVERY)*AUCTION_EVERY; return `<h4>🔨 Subasta <a href="#" data-wiki="subasta" class="wlink">ⓘ</a></h4><div class="hint">Próxima: paso ${nx} (se anuncia ${AUCTION_NOTICE} pasos antes).</div>`; }
  const left=a.step-G.step, funds=auctionFunds(G,ME,a.cur), mine=a.bids[ME]||{};
  const rules=`Sobre cerrado: tus ofertas son secretas y se resuelven al final del paso ${a.step}. Gana la más alta, los empates se lo llevan todos y quien no gana no paga nada. Puedes cambiarlas hasta entonces.`+((a.cur==='food'||a.cur==='prod')?' Se descuenta de todo tu imperio, en igual porcentaje de cada zona.':'');
  let total=0, h=`<h4>🔨 Subasta <a href="#" data-wiki="subasta" class="wlink" title="${esc(rules)}">ⓘ</a></h4><div class="auhead"><span class="aut">⏳ ${left>0?left+' paso'+(left===1?'':'s'):'Hoy'}</span><span class="auc">${RI[a.cur]} ${RN[a.cur]} · tienes <b>${funds}</b></span></div><div class="chests">`;
  a.items.forEach((it,i)=>{ const pend=ui.orders.filter(o=>o.t==='bid'&&o.item===i).pop(); const cur=pend?pend.amount:(mine[i]||0); total+=cur;
    const r=AUCTION_CAR_RANGE[it.tier], sub=it.cat==='car'?`${r[0]}–${r[1]} de ¿?`:`nivel ${AUCTION_TIERS[it.tier]}`;
    h+=`<div class="chest t${it.tier}${cur?' on':''}" title="${esc(AUCTION_CATS[it.cat]+' · nivel '+AUCTION_TIERS[it.tier]+(it.cat==='car'?' · entre '+r[0]+' y '+r[1]+', no se sabe de qué recurso':''))}">${chestArt(it.tier,it.cat)}<b>${AUCTION_CATS[it.cat]}</b><small>${AUCTION_TIER_ICON[it.tier]} ${sub}</small><div class="bidr"><button data-act="bidadj" data-i="${i}" data-d="-5" aria-label="Menos">−</button><input type="number" min="0" data-f="bid_${i}" value="${cur}" aria-label="Oferta por el objeto ${i+1}"><button data-act="bidadj" data-i="${i}" data-d="5" aria-label="Más">＋</button></div>${btnHTML('bid',cur?'Cambiar':'Ofrecer',`data-i="${i}"`,cur?'':'primary')}</div>`; });
  h+='</div>'; if(total>funds) h+=`<div class="warn">Ofreces más de lo que tienes: solo se conservarán tus ofertas más altas que puedas pagar.</div>`;
  return h;
}
// Carrera de maravillas: una tarjeta con su imagen por maravilla. Disponible = ícono verde; en obra = barra; construida = dueño.
function wondersHTML(){
  let h='<h4>Maravillas <a href="#" data-wiki="maravillas" class="wlink">ⓘ</a></h4><div class="wgrid">';
  Object.keys(WONDERS).forEach(w=>{ const W=WONDERS[w], b=wonderBuilt(G,w), race=wonderRace(G,w), unlocked=techOwn(G,ME,W.tech);
    let cls='free', badge=`<span class="wok${unlocked?' on':''}" title="${unlocked?'Disponible: ya puedes empezarla':'Disponible: nadie la ha construido (te falta '+esc(W.tech)+')'}">✓</span>`, foot='';
    if(b){ cls='built'; const col=isPl(b.owner)?PLN[b.owner].col:'#6B5B50'; badge=`<span class="wst built" style="background:${col}" title="Construida">★</span>`; foot=`<div class="wfoot" style="border-color:${col}"><b>${isPl(b.owner)?esc(PLN[b.owner].name):'sin dueño'}</b> · ${esc(zname(b))}</div>`; }
    else if(race.length){ cls='race'; badge='<span class="wst race" title="En obra">🏗</span>'; foot='<div class="wfoot race">'+race.map(x=>`<span class="rr"><i style="background:${PLN[x.f].col};width:${x.pct}%"></i><em>${esc(PLN[x.f].name)} ${x.pct} %</em></span>`).join('')+'</div>'; }
    h+=`<div class="wcard ${cls}" title="${esc(W.n+' · '+W.r+': '+W.d+(b?'':'. Se desbloquea con '+W.tech))}"><div class="wimg">${wonderArt(w)}${badge}</div><b>${esc(W.n)}</b><small>${esc(W.d)}</small>${foot}</div>`; });
  return h+'</div>';
}
// Recursos estratégicos del mapa
function mapResourcesHTML(){
  let h='';
  // recursos estratégicos del mapa
  const all=G.zones.filter(z=>zoneDeps(z).length);
  h+=`<h4>Recursos estratégicos del mapa <a href="#" data-wiki="estrategicos" class="wlink" title="${(`Cada uno da su efecto mientras lo controles, y además <b>rinde más mientras más tiempo lo tengas</b>: la plata 🥈 rinde +1 y sube hasta +${RES_TIER.plata.max}; el oro 🥇 (efecto doble) rinde +2 y sube hasta +${RES_TIER.oro.max}, un punto más cada ${RES_GROW_EVERY} pasos. Si te lo quitan, el contador vuelve a cero.`).replace(/<[^>]+>/g,'')}">ⓘ</a></h4><div class="mz">`;
  all.sort((a,b)=>(b.owner===ME)-(a.owner===ME)).forEach(z=>{ const own=z.owner===ME;
    const who=z.owner===null?'<span class="tag" style="background:#6B8E5A">libre</span>':z.owner===TRIBE?'<span class="tag" style="background:#8A5A3A">tribu</span>':`<span class="tag" style="background:${PLN[z.owner].col}">${esc(PLN[z.owner].name)}</span>`;
    zoneDeps(z).forEach(d=>{ const r=RES[d.k], k=RES_YIELD[d.k];
      h+=`<div class="mzr">${depBadge(d)}<div class="mzt"><span><b>${esc(r.n)}</b> ${RES_TIER[d.tier].ic} ${who}</span><small>${esc(zname(z))} · ${r.sc==='global'?'global':'local'}: ${esc(d.mul===2?r.d2:r.d)}</small><small>${isPl(z.owner)?`Rinde ${IMP_ICON[k]} +${resBonus(z,d.tier)} por paso · ${z.resHeld||0} pasos en manos de ${own?'ti':esc(PLN[z.owner].name)}`:`Rendiría ${depYieldText(d)} al tomarlo`}</small></div><button class="btn" data-act="gozone" data-id="${z.id}">Ver</button></div>`; }); });
  h+='</div>';
  return h;
}
function panelRecursos(){ return auctionHTML()+wondersHTML()+mapResourcesHTML(); }
