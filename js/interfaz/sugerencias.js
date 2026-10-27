'use strict';
// Sugerencias del paso: una sola línea arriba del panel que dice qué conviene hacer ahora.
// Primero los avisos urgentes (hambre, tributos, eventos), después las ideas para avanzar.
// Cada sugerencia sabe a dónde llevar al jugador al tocarla.

// ¿Faltará comida para la gente del jugador? La comida se reparte sola entre sus zonas,
// así que solo hay riesgo si lo que producen y guardan todas no alcanza para lo que comen.
function hungerRisk(){
  let need=0, have=0;
  G.zones.forEach(z=>{ (z.units[ME]||[]).forEach(u=>{ need+=(u.need!==undefined?u.need:(UT[u.t].civ?1:2)); }); if(z.owner===ME) have+=z.food+(z.last?z.last.food:0); });
  return need>have?need-have:0;
}
function queued(t,pred){ return ui.orders.some(o=>o.t===t&&(!pred||pred(o))); }

function suggestions(){
  if(!G||G.over) return [];
  const out=[], F=G.F[ME], mz=zonesOf(G,ME);
  if(F.out&&!F.ghost) return [];
  // Subasta próxima
  if(G.auction&&G.step<=G.auction.step&&!(G.auction.bids[ME]&&Object.keys(G.auction.bids[ME]).length)&&!queued('bid')) out.push({k:'tip',t:`Subasta en ${G.auction.step-G.step||'0'} paso(s): se paga con ${RN[G.auction.cur]}. Mira los objetos y haz tus ofertas en Imperio.`,go:{tab:'imperio'}});
  // Avisos
  { const short=hungerRisk(); if(short){ const cap=mz.find(z=>z.capital)||mz[0]; out.push({k:'warn',t:`Tu gente podría pasar hambre: entre todas tus zonas faltan unos ${short} de comida. Haz agricultores o reduce tropas.`,go:{zone:cap?cap.id:mz[0].id,sub:'poblacion'}}); } }
  (G.tributes||[]).forEach(tr=>{ if(tr.targets.includes(ME)&&!tr.paid[ME]&&!queued('tribute',o=>o.tribe===tr.zone)) out.push({k:'warn',t:`La tribu de ${zname(G.zones[tr.zone])} exige ${tr.amount} de ${TSPEC_N[tr.res]}; si nadie paga, invade.`,go:{zone:tr.zone,sub:'resumen'}}); });
  upcomingEvents(G,ME).forEach(e=>{
    if(!e.ev||!e.ev.terr) return; const hit=mz.filter(z=>e.ev.terr.includes(z.terrain)); if(!hit.length) return;
    const n=e.step-G.step; out.push({k:'warn',t:`${n<=0?'Este paso':n===1?'En 1 paso':'En '+n+' pasos'}: ${e.ev.n} en ${TERRN[hit[0].terrain]} (${hit.map(zname).join(', ')}). ${e.ev.d}.`,go:{zone:hit[0].id,sub:'resumen'}});
  });
  // Ideas
  const cap=mz.find(z=>z.capital)||mz[0];
  const sci=mz.reduce((a,z)=>a+(z.units[ME]||[]).filter(u=>u.t==='cie').length,0);
  if(cap&&sci===0&&!queued('spec',o=>o.to==='cie')) out.push({k:'tip',t:`Especializa un científico en ${zname(cap)} para empezar a investigar.`,go:{zone:cap.id,sub:'poblacion'}});
  else if(sci>0&&!F.rq.length&&!queued('research')) out.push({k:'tip',t:'Tus científicos solo generan ciencia: elige una tecnología para que la investiguen.',go:{tab:'tec'}});
  // Expandirse a una zona libre vecina
  for(const z of mz){
    if(availQ(z.id,'pob')<3) continue;
    const free=z.adj.map(i=>G.zones[i]).find(a=>a.owner===null&&!presentF(a).length&&!queued('move',o=>o.to===a.id));
    if(free){ out.push({k:'tip',t:`Puedes poblar ${zname(free)}: mueve pobladores desde ${zname(z)}.`,go:{move:[z.id,free.id]}}); break; }
  }
  // Poner tropas en una zona peligrosa vecina
  for(const z of mz){ const fr=z.adj.map(i=>G.zones[i]).find(a=>a.role==='frontera'&&!(a.units[ME]||[]).some(u=>!UT[u.t].civ)&&!a.conflict);
    if(fr&&MIL.some(t=>availQ(z.id,t)>0)&&!queued('move',o=>o.to===fr.id)){ const rivals=presentF(fr).filter(f=>isPl(f)&&f!==ME);
      out.push({k:'tip',t:rivals.length?`En ${zname(fr)} está ${PLN[rivals[0]].name}: si entras en paz, ganan 🪙 +${FRONTIER_SHARED} cada uno.`:`${zname(fr)} está sin tropas: manda un soldado y gana 🪙 +${FRONTIER_ALONE} por paso.`,go:{move:[z.id,fr.id]}}); break; } }
  // Espacio para construir
  if(!queued('build')){ const z=mz.find(z=>slotsOf(G,z)>z.b.length+z.proj.filter(p=>p.k!=='u').length&&z.prod>=10); if(z) out.push({k:'tip',t:`Hay espacio para un edificio en ${zname(z)}.`,go:{zone:z.id,sub:'edificios'}}); }
  return out;
}

// Tarjeta del encuentro pendiente: quién llegó, qué piden, qué dan y qué pasa si no aceptas.
function encGainText(gn){
  if(!gn) return '';
  if(gn.units) return Object.keys(gn.units).map(t=>`${gn.units[t]} ${(gn.units[t]>1?UNP[t]:UN[t]).toLowerCase()}`).join(' y ');
  if(gn.res) return `${gn.n} de ${TSPEC_N[gn.res]}`;
  if(gn.eq) return Object.keys(gn.eq).map(t=>`${gn.eq[t]} ${EQUIP_N[t][gn.eq[t]>1?1:0]} guardados`).join(' y ');
  if(gn.prog) return `+${gn.prog} de crecimiento`;
  if(gn.gamble) return `${Math.round(gn.gamble.p*100)} % de probabilidad de ganar ${gn.gamble.n} de ${TSPEC_N[gn.gamble.res]}`;
  return '';
}
function encGainIcons(gn){
  let h='';
  if(gn.units) h+=unitsIcons(gn.units);
  if(gn.res) h+=rq(gn.res,gn.n,true);
  if(gn.eq) h+=Object.keys(gn.eq).map(t=>`<span class="uchip" title="${EQUIP_N[t][1]} guardados">${uIcon(t,20)}<b>🛠×${gn.eq[t]}</b></span>`).join('');
  if(gn.prog) h+=`<span class="rq" title="crecimiento">👶 +${gn.prog}</span>`;
  if(gn.gamble) h+=`<span class="rq">🎲 ${Math.round(gn.gamble.p*100)} %: ${RI[gn.gamble.res]} +${gn.gamble.n}</span>`;
  if(gn.rel) h+=`<span class="rq" title="relación con la tribu vecina">🤝 +${gn.rel}</span>`;
  if(gn.tpob) h+=`<span class="rq" title="${esc(gn.tpob.map(x=>TRAIT_INFO[x.k].n+' '+(x.l>0?'+':'')+x.l).join(' y '))}">🌟 poblador extraordinario</span>`;
  if(gn.saber) h+=`<span class="rq" title="una tecnología gratis de nivel hasta ${gn.saber}">📜 saber</span>`;
  if(gn.bld) h+=`<span class="rq" title="un edificio ya construido">🏠 ${esc(BT[gn.bld].n)}</span>`;
  if(gn.tres) h+=`<span class="rq" title="durante ${AUCTION_RES_STEPS} pasos">💎 ${esc(RES[gn.tres.key].n)}</span>`;
  return h;
}
function encRefuseText(r){
  if(!r) return 'no pasa nada';
  if(r.bandits) return `⚔ ${r.bandits} bandidos atacan`;
  if(r.lose&&r.lose.res==='pop') return 'muere una persona';
  if(r.lose) return `pierdes ${Math.round(r.lose.frac*100)} % de ${RI[r.lose.res]||''}`;
  return '';
}
function encBarHTML(){
  if(!G||G.over) return ''; const enc=G.F[ME].enc; if(!enc) return '';
  const z=G.zones[enc.zone]; const can=encHave(G,ME,enc); const ch=(ui.orders.find(o=>o.t==='encounter')||{}).choice;
  const icon=enc.k==='trato'?'🤝':enc.k==='amenaza'?'⚠':enc.k==='apuesta'?'🎲':enc.k==='eleccion'?'⚖':enc.k==='historia'?'📖':'📜';
  if(enc.opts){ const btns=enc.opts.map((o,i)=>{ const v=['a','b','c'][i], can=encHave(G,ME,{cost:o.cost,zone:enc.zone}); return `<button class="btn ${ch===v?'primary':''}" data-act="encounter" data-v="${v}" ${can?'':'disabled'}>${esc(o.lbl)} · ${o.cost?rq(o.cost.res,o.cost.n):'sin costo'} → ${encGainIcons(o.gain)}${can?'':' (no te alcanza)'}</button>`; }).join('');
    const hist=enc.k==='historia'; return `<div class="enc ${enc.k}"><div class="ench">${icon} <b>${hist?'Historia':'Encuentro'} en ${esc(zname(z))}</b> <a href="#" data-act="gozone" data-id="${z.id}" class="wlink">ver</a></div><div class="enct">${hist?`<b>${esc(enc.who)}</b><br>${esc(enc.txt)}.`:`${esc(enc.who)} ${esc(enc.txt)}.`}</div><div class="row">${btns}<button class="btn ${ch==='no'?'primary':''}" data-act="encounter" data-v="no">${hist?'Dejarlo pasar':'Ninguno'}</button></div><div class="hint">${ch?'Se resuelve al presionar ¡Listo!':(hist?'La historia sigue aunque la dejes pasar; sin consecuencias.':'Eliges uno o ninguno; sin consecuencias.')}</div></div>`; }
  return `<div class="enc ${enc.k}"><div class="ench">${icon} <b>${enc.k==='trato'?'Oferta de '+esc(enc.who):'Encuentro en '+esc(zname(z))}</b> <a href="#" data-act="gozone" data-id="${z.id}" class="wlink">ver</a></div>
    <div class="enct">${enc.k==='trato'?'Te ofrece '+rq(enc.gain.res,enc.gain.n)+' a cambio de '+rq(enc.cost.res,enc.cost.n)+'. Si no te conviene, no pasa nada.':esc(enc.who)+' '+esc(enc.txt)+'.'}</div>
    <div class="encd">${enc.cost?`${enc.k==='trato'?'':`<span>Piden ${rq(enc.cost.res,enc.cost.n)}</span>`}`:''}${enc.gain&&enc.k!=='trato'?`<span>→ Dan ${encGainIcons(enc.gain)}</span>`:''}${enc.refuse?`<span class="neg">Si no: <b>${esc(encRefuseText(enc.refuse))}</b></span>`:''}</div>
    <div class="row"><button class="btn ${ch==='si'?'primary':''}" data-act="encounter" data-v="si" ${can?'':'disabled'}>${enc.k==='amenaza'?'Pagar':enc.k==='trato'?'Aceptar el trato':'Aceptar'}${can?'':' (no te alcanza)'}</button><button class="btn ${ch==='no'?'primary':''}" data-act="encounter" data-v="no">Rechazar</button><span class="hint">${ch?'Se resuelve al presionar ¡Listo!':'Si no te conviene, no pasa nada.'}</span></div></div>`;
}
// Un encuentro por decidir sale en una ventana emergente (no ocupa el panel). Al decidir, la ventana se cierra y la decisión
// queda en la pestaña Órdenes. «Decidir después» la esconde y deja una pastilla en el panel para volver a abrirla.
function encPending(){ if(!G||G.over) return null; const e=G.F[ME].enc; return (e&&!ui.orders.some(o=>o.t==='encounter'))?e:null; }
function encPillHTML(){ const e=encPending(); if(!e||ui.encHide!==e.step) return ''; const z=G.zones[e.zone];
  return `<button class="encpill ${e.k}" data-act="encopen">${e.k==='trato'?'🤝 Oferta de '+esc(e.who):(e.k==='amenaza'?'⚠':e.k==='historia'?'📖':'📜')+' Encuentro en '+esc(zname(z))} · decidir</button>`; }
function encPopup(){
  const d=$('dlgEnc'); if(!d) return; const e=encPending();
  if(!e||ui.encHide===e.step){ if(d.open) d.close(); return; }
  if(document.querySelector('dialog[open]:not(#dlgEnc)')) return;   // otra ventana abierta: esperar
  $('encBody').innerHTML=encBarHTML()+`<div class="row encx"><button class="btn" data-act="enclater">Decidir después</button></div>`;
  if(!d.open) d.show();
}
function sugBarHTML(){
  const s=suggestions(); if(!s.length) return '';
  const w=s.filter(x=>x.k==='warn').map(x=>x.t).join('|'); if(w&&w!==ui.lastWarn){ ui.lastWarn=w; sfxLater('warn',2600,1500); } else if(!w) ui.lastWarn='';
  const i=Math.min(ui.sugI||0,s.length-1); const it=s[i];
  return `<div class="sug ${it.k}"><button class="sugt" data-act="sug" data-i="${i}">${it.k==='warn'?'⚠':'💡'} ${esc(it.t)}</button>${s.length>1?`<button class="sugn" data-act="sugnext" aria-label="Siguiente sugerencia" title="Siguiente">${i+1}/${s.length} ›</button>`:''}</div>`;
}
function goSuggestion(i){
  const s=suggestions()[i]; if(!s) return; const g=s.go;
  if(g.move){ openMove(g.move[0],g.move[1]); if(ui.view==='terr') goZone(g.move[0],VIEW.w,500); return; }
  if(g.tab){ ui.tab=g.tab; return; }
  ui.mv=null; ui.sel=g.zone; ui.tab='zona'; ui.zsub=g.sub||'resumen'; if(ui.view==='terr') goZone(g.zone,VIEW.w>1500?900:VIEW.w,500);
}
