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
  // Ocupar una frontera vecina
  for(const z of mz){ const fr=z.adj.map(i=>G.zones[i]).find(a=>a.role==='frontera'&&!(a.units[ME]||[]).length&&!a.conflict);
    if(fr&&CIV.some(t=>availQ(z.id,t)>0)&&(z.units[ME]||[]).length>=3&&!queued('move',o=>o.to===fr.id)){ const rivals=presentF(fr).filter(f=>isPl(f)&&f!==ME);
      out.push({k:'tip',t:rivals.length?`En ${zname(fr)} está ${PLN[rivals[0]].name}: si entras en paz, ganan 🪙 +${FRONTIER_SHARED} cada uno.`:`${zname(fr)} está vacía: manda a alguien y gana 🪙 +${FRONTIER_ALONE} por paso.`,go:{move:[z.id,fr.id]}}); break; } }
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
  if(gn.units) return unitsIcons(gn.units);
  if(gn.res) return rq(gn.res,gn.n,true);
  if(gn.eq) return Object.keys(gn.eq).map(t=>`<span class="uchip" title="${EQUIP_N[t][1]} guardados">${uIcon(t,20)}<b>🛠×${gn.eq[t]}</b></span>`).join('');
  if(gn.prog) return `<span class="rq" title="crecimiento">👶 +${gn.prog}</span>`;
  if(gn.gamble) return `<span class="rq">🎲 ${Math.round(gn.gamble.p*100)} %: ${RI[gn.gamble.res]} +${gn.gamble.n}</span>`;
  return '';
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
  const icon=enc.k==='amenaza'?'⚠':enc.k==='apuesta'?'🎲':'📜';
  return `<div class="enc ${enc.k}"><div class="ench">${icon} <b>Encuentro en ${esc(zname(z))}</b> <a href="#" data-act="gozone" data-id="${z.id}" class="wlink">ver</a></div>
    <div class="enct">${esc(enc.who)} ${esc(enc.txt)}.</div>
    <div class="encd">${enc.cost?`<span>Piden ${rq(enc.cost.res,enc.cost.n)}</span>`:''}${enc.gain?`<span>→ Dan ${encGainIcons(enc.gain)}</span>`:''}${enc.refuse?`<span class="neg">Si no: <b>${esc(encRefuseText(enc.refuse))}</b></span>`:''}</div>
    <div class="row"><button class="btn ${ch==='si'?'primary':''}" data-act="encounter" data-v="si" ${can?'':'disabled'}>${enc.k==='amenaza'?'Pagar':'Aceptar'}${can?'':' (no te alcanza)'}</button><button class="btn ${ch==='no'?'primary':''}" data-act="encounter" data-v="no">Rechazar</button><span class="hint">${ch?'Se resuelve al presionar ¡Listo!':'Si no te conviene, no pasa nada.'}</span></div></div>`;
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
