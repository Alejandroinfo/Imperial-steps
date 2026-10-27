'use strict';
// Paneles de Victoria, Historial y Órdenes.

function vicNeighbors(){
  // vecinos = los rivales más cercanos a tus zonas (por zonas de distancia): el más cercano y los que estén a un paso más de él
  const dist={}; let fr=zonesOf(G,ME).map(z=>z.id); fr.forEach(i=>{ dist[i]=0; }); const best={};
  for(let d=1;fr.length&&d<40;d++){ const nx=[]; fr.forEach(i=>G.zones[i].adj.forEach(a=>{ if(a in dist) return; dist[a]=d; nx.push(a); const o=G.zones[a].owner; if(isPl(o)&&o!==ME&&!G.F[o].out&&best[o]===undefined) best[o]=d; })); fr=nx; }
  const fs=Object.keys(best).map(Number); if(!fs.length) return [];
  const m=Math.min(...fs.map(f=>best[f])); return fs.filter(f=>best[f]<=m+1).sort((a,b)=>best[a]-best[b]);
}
// Tarjeta del avance de un rival: una barra por condición; avisa si está cerca de ganar.
function vicRivalHTML(f,conds,compact){
  const n=conds.filter(c=>c.ok).length; const near=n>=1&&conds.some(c=>!c.ok&&c.v/c.t>=0.7);
  const rows=conds.map(c=>{ const pct=Math.max(0,Math.min(100,Math.round(100*c.v/c.t))); return `<div class="vrw ${c.ok?'ok':''}" title="${esc(c.d)}"><span>${c.k}</span><div class="bar"><i style="width:${pct}%;background:${PLN[f].col}"></i></div><b>${c.ok?'✓':c.v}<small>/${c.t}</small></b></div>`; }).join('');
  return `<div class="vrival ${near?'near':''}"><div class="vrh"><span class="dot" style="background:${PLN[f].col}"></span><b>${esc(PLN[f].name)}</b><span class="vrn">${n}/2 cumplidas</span>${near?'<span class="vrwarn">⚠ cerca de ganar</span>':''}</div>${compact?`<details><summary>Ver su avance</summary>${rows}</details>`:rows}</div>`;
}
function panelVictoria(){
  const T=thrOf(G); const all=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  let h=`<h3>Condiciones de victoria</h3><div class="hint">Gana quien cumpla <b>2 al mismo tiempo</b>. Si pierdes una, deja de contar. Modo: <b>${G.thr==='prueba'?'prueba (umbrales bajos)':'normal'}</b>. <a href="#" data-wiki="victoria" class="wlink">Más detalles</a></div>`;
  h+='<table class="vt"><tr><th>Condición</th>'+[...Array(G.N).keys()].map(f=>`<th style="color:${PLN[f].col}">${f===ME?'Tú':PLN[f].name.replace('Bot ','')}</th>`).join('')+'</tr>';
  all[0].forEach((c,i)=>{ h+=`<tr><td title="${c.d}">${c.k}<small> ${c.d}</small></td>`+all.map((a,f)=>`<td class="${a[i].ok?'ok':''}${ui.justCond&&ui.justCond[f+'_'+i]?' pop':''}">${a[i].ok?'✓':a[i].v}<small>/${a[i].t}</small></td>`).join('')+'</tr>'; });
  h+='<tr><td><b>Cumplidas</b></td>'+all.map(a=>`<td><b>${a.filter(c=>c.ok).length}</b>/2</td>`).join('')+'</tr></table>';
  h+='<h4>Tu avance</h4>';
  all[ME].forEach(c=>{ const pct=Math.max(0,Math.min(100,Math.round(100*c.v/c.t))); h+=`<div class="vprog ${c.ok?'ok':''}"><div class="vph"><b>${c.k}</b><span>${c.v} / ${c.t}</span></div><div class="bar"><i style="width:${pct}%"></i></div><small>${c.d}</small></div>`; });
  // el avance de los demás: primero tus vecinos (los que tocan tu territorio, directo o por una zona peligrosa)
  const nb=vicNeighbors(); const others=[...Array(G.N).keys()].filter(f=>f!==ME&&!nb.includes(f));
  if(nb.length) h+='<h4>Tus vecinos</h4>'+nb.map(f=>vicRivalHTML(f,all[f])).join('');
  if(others.length) h+='<h4>Otros jugadores</h4>'+others.map(f=>vicRivalHTML(f,all[f],true)).join('');
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
    const bb=(f==='todo'||f==='guerra')?battlesAt(null,e.step):[];
    h+=`<div class="hstep"><div class="hsh">Paso ${e.step}${e.ev?` · <b>${esc(EVT[e.ev].n)}</b>`:''}</div>`+lines.map(l=>`<div class="hl ${cls(l)}">${esc(l)}</div>`).join('')+(bb.length?`<div class="row">${battleButtons(bb)}</div>`:'')+'</div>';
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
