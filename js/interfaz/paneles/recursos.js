'use strict';
// Pestaña Recursos: subasta (cofres), carrera de maravillas y recursos estratégicos del mapa.

// Subasta a sobre cerrado: un cofre por objeto (color = nivel), con la oferta en ＋/－. Las reglas van en la ayuda (ⓘ).
function auctionHTML(){
  const a=G.auction;
  if(!a){ const nx=Math.ceil((G.step+1)/AUCTION_EVERY)*AUCTION_EVERY; return `<h4>🔨 Subasta <a href="#" data-wiki="subasta" class="wlink">ⓘ</a></h4><div class="hint">Próxima: paso ${nx} (se anuncia ${AUCTION_NOTICE} pasos antes).</div>`; }
  const left=a.step-G.step, funds=auctionFunds(G,ME,a.cur), mine=a.bids[ME]||{};
  const rules=`Sobre cerrado: tus ofertas son secretas y se resuelven al final del paso ${a.step}. Gana la más alta y los empates se lo llevan todos. Lo que ofreces se aparta al instante (ya no lo puedes gastar en otra cosa) y solo puedes subirlo; si no ganas, te lo devuelven al resolverse.`+((a.cur==='food'||a.cur==='prod')?' Sale de todo tu imperio, en igual porcentaje de cada zona, y vuelve a la misma zona.':'');
  let total=0, held=Object.keys(mine).reduce((x,k)=>x+mine[k],0), h=`<h4>🔨 Subasta <a href="#" data-wiki="subasta" class="wlink" title="${esc(rules)}">ⓘ</a></h4><div class="auhead"><span class="aut">⏳ ${left>0?left+' paso'+(left===1?'':'s'):'Hoy'}</span><span class="auc">${RI[a.cur]} ${RN[a.cur]} · libres <b>${funds}</b>${held?` · apartado <b>${held}</b>`:''}</span></div><div class="chests">`;
  a.items.forEach((it,i)=>{ const pend=ui.orders.filter(o=>o.t==='bid'&&o.item===i).pop(); const done=mine[i]||0, cur=Math.max(done,pend?pend.amount:0); total+=cur-done;
    const r=AUCTION_CAR_RANGE[it.tier], sub=it.cat==='car'?`${r[0]}–${r[1]} de ¿?`:`nivel ${AUCTION_TIERS[it.tier]}`;
    h+=`<div class="chest t${it.tier}${cur?' on':''}" title="${esc(AUCTION_CATS[it.cat]+' · nivel '+AUCTION_TIERS[it.tier]+(it.cat==='car'?' · entre '+r[0]+' y '+r[1]+', no se sabe de qué recurso':''))}">${chestArt(it.tier,it.cat)}<b>${AUCTION_CATS[it.cat]}</b><small>${AUCTION_TIER_ICON[it.tier]} ${sub}</small><div class="bidr"><button data-act="bidadj" data-i="${i}" data-d="-5" aria-label="Menos"${cur<=done?' disabled':''}>−</button><input type="number" min="${done}" data-f="bid_${i}" value="${cur}" aria-label="Oferta por el objeto ${i+1}"><button data-act="bidadj" data-i="${i}" data-d="5" aria-label="Más">＋</button></div>${done?`<small class="apart" title="Ya apartado: no se puede bajar, solo subir">🔒 apartado ${done}</small>`:''}${btnHTML('bid',done?'Subir':'Ofrecer',`data-i="${i}"`,done?'':'primary')}</div>`; });
  h+='</div>'; if(total>funds) h+=`<div class="warn">Te faltan ${total-funds} para esas subidas: se apartará hasta donde alcance.</div>`;
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
// Recursos estratégicos del mapa, agrupados (tuyos, libres, de otros) y en una línea cada uno; el detalle sale al pasar el mouse.
function mapResourcesHTML(){
  const all=G.zones.filter(z=>zoneDeps(z).length); if(!all.length) return '<div class="hint">No hay recursos estratégicos en el mapa.</div>';
  const tip=`Cada uno da su efecto mientras lo controles, y además rinde más mientras más tiempo lo tengas: la plata rinde +1 y sube hasta +${RES_TIER.plata.max}; el oro (efecto doble) rinde +2 y sube hasta +${RES_TIER.oro.max}, un punto más cada ${RES_GROW_EVERY} pasos. Si te lo quitan, el contador vuelve a cero.`;
  const groups=[['mine','Tuyos',z=>z.owner===ME],['free','Libres',z=>z.owner===null||z.owner===TRIBE],['other','De otros jugadores',z=>isPl(z.owner)&&z.owner!==ME]];
  const hasMine=all.some(groups[0][2]); ui.det=ui.det||{};
  let h=`<div class="hint">Efecto mientras los controles, y rinden más con el tiempo <a href="#" data-wiki="estrategicos" class="wlink" title="${esc(tip)}">ⓘ</a></div>`;
  groups.forEach(([k,t,fn])=>{ const zs=all.filter(fn).sort((a,b)=>a.id-b.id); if(!zs.length) return;
    const key='rm_'+k; if(!(key in ui.det)) ui.det[key]=(k==='mine')||(!hasMine&&k==='free');
    const n=zs.reduce((a,z)=>a+zoneDeps(z).length,0);
    h+=fold(key,t,String(n));
    if(ui.det[key]){ h+='<div class="mz">';
      zs.forEach(z=>{ const own=z.owner===ME; const who=isPl(z.owner)&&!own?`<span class="tag" style="background:${PLN[z.owner].col}">${esc(PLN[z.owner].name)}</span>`:z.owner===TRIBE?'<span class="tag" style="background:#8A5A3A">tribu</span>':'';
        zoneDeps(z).forEach(d=>{ const r=RES[d.k], kk=RES_YIELD[d.k], T=RES_TIER[d.tier];
          const yv=isPl(z.owner)?`${IMP_ICON[kk]} +${resBonus(z,d.tier)}`:`${IMP_ICON[kk]} +${T.start}`;
          const det=`${r.n} (${T.n.toLowerCase()}) en ${zname(z)} · ${r.sc==='global'?'global':'local'}: ${d.mul===2?r.d2:r.d}. `+(isPl(z.owner)?`Rinde ${yv} por paso · ${z.resHeld||0} pasos en manos de ${own?'ti':PLN[z.owner].name}`:`Rendiría ${depYieldText(d)} al tomarlo`);
          h+=`<div class="mzr c" title="${esc(det)}">${depBadge(d)}<span class="mzn"><b>${esc(r.n)}</b> ${who}<small>${esc(zname(z))} · ${r.sc==='global'?'global':'local'}</small></span><span class="mzy">${yv}</span><button class="btn sm" data-act="gozone" data-id="${z.id}">Ver</button></div>`; }); });
      h+='</div>'; } });
  return h;
}
// La pestaña tiene tres subpestañas para que ninguna se haga larga: recursos del mapa, subasta y maravillas.
const RSUBS=[['mapa','Del mapa'],['subasta','Subasta'],['mar','Maravillas']];
function panelRecursos(){
  const cur=RSUBS.some(s=>s[0]===ui.rsub)?ui.rsub:'mapa';
  const sa=G.auction&&G.step<=G.auction.step&&!(G.auction.bids[ME]&&Object.keys(G.auction.bids[ME]).length);
  let h='<div class="subtabs" role="tablist">'+RSUBS.map(([k,l])=>`<button data-act="rsub" data-s="${k}" aria-selected="${k===cur}" role="tab">${l}${k==='subasta'&&sa?'<i class="al">!</i>':''}</button>`).join('')+'</div>';
  return h+(cur==='subasta'?auctionHTML():cur==='mar'?wondersHTML():mapResourcesHTML());
}
