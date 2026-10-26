'use strict';
// Paneles de Victoria, Historial y Órdenes.

function panelVictoria(){
  const T=thrOf(G); const all=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  let h=`<h3>Condiciones de victoria</h3><div class="hint">Gana quien cumpla <b>2 al mismo tiempo</b>. Si pierdes una, deja de contar. Modo: <b>${G.thr==='prueba'?'prueba (umbrales bajos)':'normal'}</b>. <a href="#" data-wiki="victoria" class="wlink">Más detalles</a></div>`;
  h+='<table class="vt"><tr><th>Condición</th>'+[...Array(G.N).keys()].map(f=>`<th style="color:${PLN[f].col}">${f===ME?'Tú':PLN[f].name.replace('Bot ','')}</th>`).join('')+'</tr>';
  all[0].forEach((c,i)=>{ h+=`<tr><td title="${c.d}">${c.k}<small> ${c.d}</small></td>`+all.map((a,f)=>`<td class="${a[i].ok?'ok':''}${ui.justCond&&ui.justCond[f+'_'+i]?' pop':''}">${a[i].ok?'✓':a[i].v}<small>/${a[i].t}</small></td>`).join('')+'</tr>'; });
  h+='<tr><td><b>Cumplidas</b></td>'+all.map(a=>`<td><b>${a.filter(c=>c.ok).length}</b>/2</td>`).join('')+'</tr></table>';
  h+='<h4>Tu avance</h4>';
  all[ME].forEach(c=>{ const pct=Math.max(0,Math.min(100,Math.round(100*c.v/c.t))); h+=`<div class="vprog ${c.ok?'ok':''}"><div class="vph"><b>${c.k}</b><span>${c.v} / ${c.t}</span></div><div class="bar"><i style="width:${pct}%"></i></div><small>${c.d}</small></div>`; });
  const l5=TECHS.filter(t=>G.F[ME].techs[t.n]&&t.l===5);
  if(l5.length) h+=`<div class="hint">Tecnologías de nivel 5 que tienes: ${l5.map(t=>esc(t.n)+' ('+esc(t.r)+')').join(', ')}.</div>`;
  return h;
}
function panelHistorial(){
  const hist=(G.hist||[]).slice().reverse();
  const f=ui.hf||'todo';
  const cls=l=>/Combate|conquista|captura|sorpresa|elimin|invade/.test(l)?'guerra':(/desarrolla|empieza a investigar/.test(l)?'tec':(/se termina|sube a nivel|destruye/.test(l)?'obra':(/anexa|tributo|Alianza/.test(l)?'dip':(/Evento:/.test(l)?'ev':'otro'))));
  let h=`<h3>Historial de la partida</h3><div class="row"><span class="seg">${[['todo','Todo'],['guerra','Guerra'],['tec','Ciencia'],['obra','Obras'],['dip','Tribus'],['ev','Eventos']].map(([k,l])=>`<button data-act="hf" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</span></div>`;
  if(!hist.length) return h+'<div class="hint">Todavía no ha pasado nada. Aquí se irá contando la historia de tu imperio paso a paso.</div>';
  let shown=0;
  h+='<div class="hist">';
  hist.forEach(e=>{
    const lines=e.lines.filter(l=>f==='todo'||cls(l)===f); if(!lines.length) return; shown++;
    h+=`<div class="hstep"><div class="hsh">Paso ${e.step}${e.ev?` · <b>${esc(EVT[e.ev].n)}</b>`:''}</div>`+lines.map(l=>`<div class="hl ${cls(l)}">${esc(l)}</div>`).join('')+'</div>';
  });
  h+='</div>';
  if(!shown) h+='<div class="hint">Nada de ese tipo todavía.</div>';
  return h;
}
function panelOrdenes(){
  const cm=commits(), F=G.F[ME];
  let h='<h4>Órdenes de este paso</h4>';
  h+=ui.orders.length?'<ul class="ord">'+ui.orders.map((o,i)=>`<li><span>${esc(ordText(o))}</span><button data-act="del" data-i="${i}" aria-label="Quitar">×</button></li>`).join('')+'</ul>':'<div class="hint">Sin órdenes: tus zonas siguen trabajando solas.</div>';
  if(cm.tech>F.tech) h+=`<div class="warn">Las órdenes de investigación gastan ${cm.tech} de tecnología y tienes ${Math.floor(F.tech)}.</div>`;
  if(cm.gold>F.gold) h+=`<div class="warn">Las órdenes gastan ${cm.gold} de oro y tienes ${Math.floor(F.gold)}: algunas no se harán completas.</div>`;
  h+='<h4>Qué pasó en el paso anterior</h4>';
  h+=G.log&&G.log.length?'<div class="log">'+G.log.map(m=>`<div>${esc(m)}</div>`).join('')+'</div>':'<div class="hint">Todavía nada.</div>';
  h+=`<div class="hint"><a href="#" data-act="tab" data-tab="hist">Ver el historial completo →</a></div>`;
  return h;
}
