'use strict';
// Sugerencias del paso: una sola línea arriba del panel que dice qué conviene hacer ahora.
// Primero los avisos urgentes (hambre, tributos, eventos), después las ideas para avanzar.
// Cada sugerencia sabe a dónde llevar al jugador al tocarla.

function hungerRisk(z){
  const us=z.units[ME]||[]; if(!us.length) return false;
  const need=us.reduce((a,u)=>a+(UT[u.t].civ?1:2),0);
  const income=z.last?z.last.food:0;
  return z.food+income<need;
}
function queued(t,pred){ return ui.orders.some(o=>o.t===t&&(!pred||pred(o))); }

function suggestions(){
  if(!G||G.over) return [];
  const out=[], F=G.F[ME], mz=zonesOf(G,ME);
  if(F.out&&!F.ghost) return [];
  // Avisos
  mz.forEach(z=>{ if(hungerRisk(z)) out.push({k:'warn',t:`${zname(z)} podría pasar hambre: produce o envía comida, o mueve gente.`,go:{zone:z.id,sub:'recursos'}}); });
  (G.tributes||[]).forEach(tr=>{ if(tr.targets.includes(ME)&&!tr.paid[ME]&&!queued('tribute',o=>o.tribe===tr.zone)) out.push({k:'warn',t:`La tribu de ${zname(G.zones[tr.zone])} exige ${tr.amount} de ${TSPEC_N[tr.res]}; si nadie paga, invade.`,go:{zone:tr.zone,sub:'resumen'}}); });
  upcomingEvents(G,ME).forEach(e=>{
    if(!e.ev||!e.ev.terr) return; const hit=mz.filter(z=>e.ev.terr.includes(z.terrain)); if(!hit.length) return;
    const n=e.step-G.step; out.push({k:'warn',t:`${n<=0?'Este paso':n===1?'En 1 paso':'En '+n+' pasos'}: ${e.ev.n} en ${TERRN[hit[0].terrain]} (${hit.map(zname).join(', ')}). ${e.ev.d}.`,go:{zone:hit[0].id,sub:'resumen'}});
  });
  // Ideas
  const cap=mz.find(z=>z.capital)||mz[0];
  const sci=mz.reduce((a,z)=>a+(z.units[ME]||[]).filter(u=>u.t==='cie').length,0);
  const asg=mz.reduce((a,z)=>a+Math.min(z.resN||0,(z.units[ME]||[]).filter(u=>u.t==='cie'&&u.w===0).length),0);
  if(cap&&sci===0&&!queued('spec',o=>o.to==='cie')) out.push({k:'tip',t:`Especializa un científico en ${zname(cap)} para empezar a investigar.`,go:{zone:cap.id,sub:'poblacion'}});
  else if(sci>0&&asg===0&&!queued('assign')){ const z=mz.find(z=>(z.units[ME]||[]).some(u=>u.t==='cie')); if(z) out.push({k:'tip',t:`Tus científicos de ${zname(z)} no están investigando: asígnalos.`,go:{zone:z.id,sub:'poblacion'}}); }
  else if(sci>0&&!F.rq.length&&!queued('research')) out.push({k:'tip',t:'Tus científicos están sin tarea: elige una tecnología.',go:{tab:'tec'}});
  // Expandirse a una zona libre vecina
  for(const z of mz){
    if(availQ(z.id,'pob')<3) continue;
    const free=z.adj.map(i=>G.zones[i]).find(a=>a.owner===null&&!presentF(a).length&&!queued('move',o=>o.to===a.id));
    if(free){ out.push({k:'tip',t:`Puedes poblar ${zname(free)}: mueve pobladores desde ${zname(z)}.`,go:{move:[z.id,free.id]}}); break; }
  }
  // Espacio para construir
  if(!queued('build')){ const z=mz.find(z=>slotsOf(G,z)>z.b.length+z.proj.filter(p=>p.k!=='u').length&&z.prod>=10); if(z) out.push({k:'tip',t:`Hay espacio para un edificio en ${zname(z)}.`,go:{zone:z.id,sub:'edificios'}}); }
  return out;
}

function sugBarHTML(){
  const s=suggestions(); if(!s.length) return '';
  const i=Math.min(ui.sugI||0,s.length-1); const it=s[i];
  return `<div class="sug ${it.k}"><button class="sugt" data-act="sug" data-i="${i}">${it.k==='warn'?'⚠':'💡'} ${esc(it.t)}</button>${s.length>1?`<button class="sugn" data-act="sugnext" aria-label="Siguiente sugerencia" title="Siguiente">${i+1}/${s.length} ›</button>`:''}</div>`;
}
function goSuggestion(i){
  const s=suggestions()[i]; if(!s) return; const g=s.go;
  if(g.move){ openMove(g.move[0],g.move[1]); if(ui.view==='terr') goZone(g.move[0],VIEW.w,500); return; }
  if(g.tab){ ui.tab=g.tab; return; }
  ui.mv=null; ui.sel=g.zone; ui.tab='zona'; ui.zsub=g.sub||'resumen'; if(ui.view==='terr') goZone(g.zone,VIEW.w>1500?900:VIEW.w,500);
}
