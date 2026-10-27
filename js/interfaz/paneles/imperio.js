'use strict';
// Panel Imperio.

// Subasta a sobre cerrado: moneda, objetos (categoría y nivel) y una oferta por objeto.
function auctionHTML(){
  const a=G.auction; if(!a) return '';
  const left=a.step-G.step, funds=auctionFunds(G,ME,a.cur), mine=a.bids[ME]||{};
  let total=0, h=`<h4>🔨 Subasta <a href="#" data-wiki="subasta" class="wlink">ⓘ</a></h4><div class="hint">${left>0?`En ${left} paso${left===1?'':'s'}`:'<b>Hoy</b>'} (paso ${a.step}) · se paga con <b>${RI[a.cur]} ${RN[a.cur]}</b> (tienes ${funds}${(a.cur==='food'||a.cur==='prod')?' en todo el imperio':''}). Las ofertas son en secreto y se resuelven al final del paso ${a.step}: gana la más alta, los empates se lo llevan todos y quien no gana no paga nada. Puedes cambiarlas hasta entonces.</div><div class="alist">`;
  a.items.forEach((it,i)=>{ const pend=ui.orders.filter(o=>o.t==='bid'&&o.item===i).pop(); const cur=pend?pend.amount:(mine[i]||0); total+=cur;
    h+=`<div class="arow"><span class="atx"><b>${AUCTION_TIER_ICON[it.tier]} ${AUCTION_CATS[it.cat]}</b><small>nivel ${AUCTION_TIERS[it.tier]}${cur?` · tu oferta: ${cur}`:''}</small></span><input type="number" min="0" data-f="bid_${i}" value="${cur}" aria-label="Oferta por el objeto ${i+1}"> ${btnHTML('bid','Ofrecer',`data-i="${i}"`)}</div>`; });
  h+='</div>'; if(total>funds) h+=`<div class="warn">Ofreces más de lo que tienes: solo se conservarán tus ofertas más altas que puedas pagar.</div>`;
  return h;
}
function storyHTML(){
  const st=G.F[ME].story; if(!st||!STORIES[st.id]) return '';
  const S=STORIES[st.id], done=st.done, ch=Math.min(4,st.ch-(done?1:0));
  const dots=[1,2,3,4].map(i=>`<i class="${i<=st.tags.length?'on':''}"></i>`).join('');
  return `<h4>📖 Tu historia <a href="#" data-wiki="historias" class="wlink">ⓘ</a></h4><div class="box"><b>«${esc(S.n)}»</b> <span class="relbar">${dots}</span><div class="hint">${done?'Terminada: '+st.tags.length+' de 4 capítulos vividos.':`Capítulo ${ch} de 4: llega hacia el paso ${st.next}.`} Lo que eliges cambia el siguiente capítulo y el final. Dejar pasar un capítulo no tiene castigo.</div></div>`;
}
function panelImperio(){
  const F=G.F[ME], M=G.M[ME]; const zs=zonesOf(G,ME);
  let h=`<div class="kv"><span>Oro</span><span>${Math.floor(F.gold)}</span><span>Tecnología</span><span>${Math.floor(F.tech)}</span><span>Zonas</span><span>${zs.length} de ${G.zones.length}</span><span>Población</span><span>${totalPop(G,ME)}</span><span>Tecnologías</span><span>${Object.keys(F.techs).length} de ${TECHS.length}</span><span>Investigación</span><span>${F.rcap} por paso${F.rq.length?' · '+F.rq.map(p=>esc(p.name)).join(', '):''}</span><span>Edificios</span><span>${zs.reduce((a,z)=>a+z.b.length,0)}</span></div>`;
  h+=myZonesHTML();
  h+=relationsHTML();
  if(F.out) h+=`<div class="box warn">Quedaste eliminado${F.ghost?' y ahora controlas una tribu':''}. Ya no puedes ganar solo: puedes aliarte con un jugador vivo y ganar con él.</div>`;
  h+=storyHTML();
  h+=auctionHTML();
  // carrera de maravillas
  h+='<h4>Maravillas <a href="#" data-wiki="maravillas" class="wlink">ⓘ</a></h4><div class="wlist">';
  Object.keys(WONDERS).forEach(w=>{ const W=WONDERS[w], b=wonderBuilt(G,w), race=wonderRace(G,w), unlocked=techOwn(G,ME,W.tech);
    let st; if(b) st=`★ ${isPl(b.owner)?esc(PLN[b.owner].name):'sin dueño'} · ${esc(zname(b))}`; else if(race.length) st='🏗 '+race.map(x=>esc(PLN[x.f].name)+' '+x.pct+' %').join(' · '); else st=unlocked?'libre: ya puedes empezarla':'libre';
    h+=`<div class="wrow" title="${esc(W.d)}"><span class="wtx"><b>${esc(W.n)}</b><small>${esc(W.r)} · ${esc(W.d)}</small></span><span class="wout">${st}</span></div>`; });
  h+='</div>';
  // eventos
  h+='<h4>Eventos <a href="#" data-wiki="eventos" class="wlink">ⓘ</a></h4>';
  const up=upcomingEvents(G,ME);
  h+=G.evNow?`<div class="hint">Este paso: <b>${EVT[G.evNow.id].n}</b> — ${EVT[G.evNow.id].d}.</div>`:'<div class="hint">Este paso no hubo evento (hay uno cada 3 pasos a partir del paso 6).</div>';
  h+=up.length?'<ul class="evl">'+up.map(x=>`<li>Paso ${x.step}: <b>${x.ev.n}</b> — ${x.ev.d} ${x.ev.k==='+'?'<span class="tag" style="background:#2F7F4F">positivo</span>':x.ev.k==='-'?'<span class="tag" style="background:#B3541E">negativo</span>':'<span class="tag" style="background:#6B5B50">tribus</span>'}</li>`).join('')+'</ul>':'<div class="hint">No ves ningún evento próximo (tu anticipación es de '+M.foresight+' pasos).</div>';
  // tributos
  const tr=G.tributes.filter(t=>t.targets.includes(ME)&&!t.paid[ME]);
  if(tr.length){
    h+='<h4>Exigencias de tributo</h4>';
    tr.forEach(t=>{ const z=G.zones[t.zone]; const src=zonesOf(G,ME).filter(a=>z.adj.includes(a.id)); h+=`<div class="box">La tribu de ${zname(z)} exige <b>${t.amount} de ${TSPEC_N[t.res]}</b> antes del paso ${t.due}. Si nadie paga, invade.<div class="row">${src.length?src.map(a=>btnHTML('tribute','Pagar desde '+zname(a),`data-tribe="${z.id}" data-from="${a.id}"`)).join(' '):'<span class="hint">Necesitas una zona tuya vecina.</span>'}</div></div>`; });
  }
  // alianzas
  const ghosts=[...Array(G.N).keys()].filter(f=>G.F[f].ghost&&f!==ME);
  if(F.out||ghosts.length||F.ally!==null){
    h+='<h4>Fantasmas y alianzas</h4>';
    if(F.ally!==null) h+=`<div class="hint">Aliado con ${PLN[F.ally].name}. ${btnHTML('unally','Romper alianza')}</div>`;
    else if(F.out){ const alive=[...Array(G.N).keys()].filter(f=>!G.F[f].out); h+='<div class="row">'+alive.map(f=>btnHTML('ally','Proponer alianza a '+PLN[f].name,`data-t="${f}"`)).join(' ')+'</div>'; }
    ghosts.forEach(f=>{ if(G.F[f].req===ME&&F.ally===null) h+=`<div class="row">${PLN[f].name} (fantasma) propone una alianza. ${btnHTML('ally','Aceptar',`data-t="${f}"`)}</div>`; });
  }
  // recursos estratégicos del mapa
  const all=G.zones.filter(z=>z.res);
  h+=`<h4>Recursos estratégicos del mapa <a href="#" data-wiki="estrategicos" class="wlink" title="${(`Cada uno da su efecto mientras lo controles, y además <b>rinde más mientras más tiempo lo tengas</b>: +1 por paso al empezar, +1 más cada ${RES_GROW_EVERY} pasos (hasta +${RES_MAX}). Si te lo quitan, el contador vuelve a cero.`).replace(/<[^>]+>/g,'')}">ⓘ</a></h4><div class="mz">`;
  all.sort((a,b)=>(b.owner===ME)-(a.owner===ME)).forEach(z=>{ const r=RES[z.res], k=RES_YIELD[z.res], own=z.owner===ME;
    const who=z.owner===null?'<span class="tag" style="background:#6B8E5A">libre</span>':z.owner===TRIBE?'<span class="tag" style="background:#8A5A3A">tribu</span>':`<span class="tag" style="background:${PLN[z.owner].col}">${esc(PLN[z.owner].name)}</span>`;
    h+=`<div class="mzr"><span class="dot" style="background:${r.col};width:16px;height:16px"></span><div class="mzt"><span><b>${esc(r.n)}</b> ${who}</span><small>${esc(zname(z))} · ${r.sc==='global'?'global':'local'}: ${esc(r.d)}</small><small>${isPl(z.owner)?`Rinde ${IMP_ICON[k]} +${resBonus(z)} por paso · ${z.resHeld||0} pasos en manos de ${own?'ti':esc(PLN[z.owner].name)}`:`Rendiría ${IMP_ICON[k]} +1 por paso al tomarlo`}</small></div><button class="btn" data-act="gozone" data-id="${z.id}">Ver</button></div>`; });
  h+='</div>';
  return h;
}
