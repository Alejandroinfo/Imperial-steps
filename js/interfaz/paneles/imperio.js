'use strict';
// Panel Imperio.

// Tu historia: una tarjeta corta (el detalle de las reglas está en la guía ⓘ y en el texto de ayuda al pasar el mouse).
function storyHTML(){
  const st=G.F[ME].story; if(!st||!STORIES[st.id]) return '';
  const S=STORIES[st.id], done=st.done, ch=Math.min(4,st.ch-(done?1:0)), n=G.F[ME].stories||1;
  const dots=[1,2,3,4].map(i=>`<i class="${i<=st.tags.length?'on':''}"></i>`).join('');
  const sub=done?(n<STORY_MAX?`Terminada · la próxima, hacia el paso ${st.nextNew+2}`:'Terminada'):`Capítulo ${ch} de 4 · hacia el paso ${st.next}`;
  return `<div class="stcard" title="Lo que eliges cambia el siguiente capítulo y el final. Dejar pasar un capítulo no tiene castigo.">📖<span class="stx"><b>«${esc(S.n)}»</b><small>${sub}</small></span><span class="relbar">${dots}</span><a href="#" data-wiki="historias" class="wlink">ⓘ</a></div>`;
}
// Pedidos de las tribus vecinas: una línea cada uno (tribu, qué piden, cuánto queda, relación y cómo pagar). Duran hasta que pagas, así que van arriba y compactos.
function requestsHTML(){
  const tr=(G.tributes||[]).filter(t=>t.targets.includes(ME)&&!t.paid[ME]); if(!tr.length) return '';
  let h='<div class="reqs">';
  tr.forEach(t=>{ const z=G.zones[t.zone], left=t.due-G.step+1, rel=((z.rel||{})[ME])||0, inQ=ui.orders.some(o=>o.t==='tribute'&&o.tribe===z.id);
    const local=t.res==='food'||t.res==='prod', src=zonesOf(G,ME).filter(a=>z.adj.includes(a.id));
    const tip=`${zname(z)} pide ${t.amount} de ${TSPEC_N[t.res]}. Si cumples, tu relación sube a ${Math.min(TRIBE_REL_MAX,rel+1)}; si lo ignoras, baja a ${Math.max(TRIBE_REL_MIN,rel-1)}${rel-1<=TRIBE_REL_MIN?' y te ataca':''}.`;
    let pay;
    if(inQ) pay='<span class="ok">✓ en cola</span>';
    else if(!src.length) pay='<span class="hint">sin zona vecina</span>';
    else if(local) pay=src.map(a=>{ const have=Math.floor(a[t.res]); return have>=t.amount?btnHTML('tribute','Pagar · '+esc(zname(a)),`data-tribe="${z.id}" data-from="${a.id}"`,'primary sm'):`<span class="hint" title="${esc(zname(a))} solo tiene ${have}">${esc(zname(a))}: ${have}</span>`; }).join('');
    else { const have=Math.floor(t.res==='gold'?G.F[ME].gold:G.F[ME].tech); pay=have>=t.amount?btnHTML('tribute','Pagar',`data-tribe="${z.id}" data-from="${src[0].id}"`,'primary sm'):`<span class="warn">te faltan ${t.amount-have}</span>`; }
    h+=`<div class="req ${left<=2?'late':''}" title="${esc(tip)}"><span class="rt">🤝 <a href="#" data-act="gozone" data-id="${z.id}">${esc(zname(z))}</a></span><span class="rqn">${rq(t.res,t.amount)}</span><span class="rl">⏳ ${left}</span><span class="rrel">${relBarHTML(rel)}</span><span class="rp">${pay}</span></div>`; });
  return h+'</div>';
}
function panelImperio(){
  const F=G.F[ME], M=G.M[ME]; const zs=zonesOf(G,ME);
  let h=requestsHTML()+`<div class="kv"><span>Oro</span><span>${Math.floor(F.gold)}</span><span>Tecnología</span><span>${Math.floor(F.tech)}</span><span>Zonas</span><span>${zs.length} de ${G.zones.length}</span><span>Población</span><span>${totalPop(G,ME)}</span><span>Tecnologías</span><span>${Object.keys(F.techs).length} de ${TECHS.length}</span><span>Investigación</span><span>${F.rcap} por paso${F.rq.length?' · '+F.rq.map(p=>esc(p.name)).join(', '):''}</span><span>Edificios</span><span>${zs.reduce((a,z)=>a+z.b.length,0)}</span>${(()=>{ let n=0,gen=0,fd=0,gd=0; G.zones.forEach(z=>(z.units[ME]||[]).forEach(u=>{ if(UT[u.t].civ) return; n++; if(u.gen) gen++; fd+=(u.need||0); if(!u.free) gd+=((UNIT_UPKEEP[u.t]||{gold:0}).gold+(u.gen?GEN_PAY:0))*M.payMul; })); return n?`<span>Tropas</span><span>${n}${gen?' (★'+gen+')':''} · 🌾 ${Math.ceil(fd-1e-9)} · 🪙 ${Math.ceil(gd-1e-9)} por paso</span>`:''; })()}</div>`;
  h+=myZonesHTML();
  h+=relationsHTML();
  if(F.out) h+=`<div class="box warn">Quedaste eliminado${F.ghost?' y ahora controlas una tribu':''}. Ya no puedes ganar solo: puedes aliarte con un jugador vivo y ganar con él.</div>`;
  h+=storyHTML();
  // eventos
  h+='<h4>Eventos <a href="#" data-wiki="eventos" class="wlink">ⓘ</a></h4>';
  const up=upcomingEvents(G,ME);
  { const act=(G.evAct||[]).filter(a=>a.end>=G.step&&EVT[a.id].k!=='t'); h+=act.length?'<div class="hint">Este año: '+act.map(a=>`<b>${EVT[a.id].n}</b> (quedan ${a.end-G.step+1} paso${a.end-G.step+1===1?'':'s'})`).join(' + ')+'.</div>':`<div class="hint">${G.step<=YEAR_STEPS?'El primer año es de fundación: sin eventos. El año que viene llega una parte cierta (Prosperidad o Escasez) y una variable.':'Ahora no hay ningún evento del año activo.'} Cada paso es un mes.</div>`; }
  h+=up.length?'<ul class="evl">'+up.map(x=>`<li>Paso ${x.step} (${MONTH_N[(x.step-1)%YEAR_STEPS]}): <b>${x.ev.n}</b> — ${x.ev.d}${x.dur>=YEAR_STEPS?' · dura todo el año':''} ${x.ev.k==='+'?'<span class="tag" style="background:#2F7F4F">positivo</span>':x.ev.k==='-'?'<span class="tag" style="background:#B3541E">negativo</span>':'<span class="tag" style="background:#6B5B50">tribus</span>'}</li>`).join('')+'</ul>':'<div class="hint">No ves ningún evento próximo (tu anticipación es de '+M.foresight+' pasos).</div>';
  // alianzas
  const ghosts=[...Array(G.N).keys()].filter(f=>G.F[f].ghost&&f!==ME);
  if(F.out||ghosts.length||F.ally!==null){
    h+='<h4>Fantasmas y alianzas</h4>';
    if(F.ally!==null) h+=`<div class="hint">Aliado con ${PLN[F.ally].name}. ${btnHTML('unally','Romper alianza')}</div>`;
    else if(F.out){ const alive=[...Array(G.N).keys()].filter(f=>!G.F[f].out); h+='<div class="row">'+alive.map(f=>btnHTML('ally','Proponer alianza a '+PLN[f].name,`data-t="${f}"`)).join(' ')+'</div>'; }
    ghosts.forEach(f=>{ if(G.F[f].req===ME&&F.ally===null) h+=`<div class="row">${PLN[f].name} (fantasma) propone una alianza. ${btnHTML('ally','Aceptar',`data-t="${f}"`)}</div>`; });
  }
  return h;
}
