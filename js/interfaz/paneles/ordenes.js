'use strict';
// Paneles de Victoria, Historial y Órdenes.

function vicNeighbors(){
  // vecinos = los rivales más cercanos a tus zonas (por zonas de distancia): el más cercano y los que estén a un paso más de él
  const dist={}; let fr=zonesOf(G,ME).map(z=>z.id); fr.forEach(i=>{ dist[i]=0; }); const best={};
  for(let d=1;fr.length&&d<40;d++){ const nx=[]; fr.forEach(i=>G.zones[i].adj.forEach(a=>{ if(a in dist) return; dist[a]=d; nx.push(a); const o=G.zones[a].owner; if(isPl(o)&&o!==ME&&!G.F[o].out&&best[o]===undefined) best[o]=d; })); fr=nx; }
  const fs=Object.keys(best).map(Number); if(!fs.length) return [];
  const m=Math.min(...fs.map(f=>best[f])); return fs.filter(f=>best[f]<=m+1).sort((a,b)=>best[a]-best[b]);
}
// Victoria: un solo gráfico. Una fila por condición con una barra por jugador (tú y tus vecinos; «ver a todos» agrega al resto).
const VIC_ICON = {Comercial:'🪙', Económica:'👥', Tecnología:'🔬', Territorial:'🗺', Militar:'⚔', Desarrollo:'🏗', Maravillas:'🏛'};
function panelVictoria(){
  const all=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  const nb=vicNeighbors(), others=[...Array(G.N).keys()].filter(f=>f!==ME&&!nb.includes(f)&&!G.F[f].out);
  const show=[ME,...nb,...(ui.vall?others:[])].filter((f,i,a)=>a.indexOf(f)===i);
  const nameOf=f=>f===ME?'Tú':PLN[f].name.replace('Bot ','');
  let h=`<div class="vhead"><b>Gana quien cumpla 2 a la vez</b><a href="#" data-wiki="victoria" class="wlink" title="Si pierdes una condición, deja de contar. Modo: ${G.thr==='prueba'?'prueba (umbrales bajos)':'normal'}.">ⓘ</a></div>`;
  h+='<div class="vleg">'+show.map(f=>{ const n=all[f].filter(c=>c.ok).length, near=n>=1&&all[f].some(c=>!c.ok&&c.v/c.t>=0.7);
    return `<span class="${near&&f!==ME?'near':''}" title="${near&&f!==ME?'Está cerca de ganar':''}"><i class="dot" style="background:${PLN[f].col}"></i>${esc(nameOf(f))} <b>${n}/2</b>${near&&f!==ME?' ⚠':''}</span>`; }).join('')+'</div>';
  h+='<div class="vchart">';
  all[ME].forEach((c0,i)=>{
    h+=`<div class="vrow" title="${esc(c0.d)} · meta ${c0.t}"><div class="vlab"><span class="vi">${VIC_ICON[c0.k]||'•'}</span><b>${c0.k}</b><small>${esc(c0.d)} · meta ${c0.t}</small></div><div class="vbars">`
      +show.map(f=>{ const a=all[f][i], pct=Math.max(0,Math.min(100,Math.round(100*a.v/a.t)));
        return `<div class="vb ${a.ok?'ok':''}${ui.justCond&&ui.justCond[f+'_'+i]?' pop':''}"><i style="width:${Math.max(a.v>0?3:0,pct)}%;background:${PLN[f].col}"></i><em>${a.ok?'✓ ':''}${a.v}</em></div>`; }).join('')+'</div></div>'; });
  h+='</div>';
  if(others.length) h+=`<div class="row"><button class="btn sm" data-act="vall">${ui.vall?'Ver solo a mis vecinos':'Ver a todos ('+others.length+' más)'}</button></div>`;
  return h;
}
function panelHistorial(){
  const hist=(G.hist||[]).slice().reverse();
  const f=ui.hf||'todo';
  const cls=l=>/Combate|conquista|captura|sorpresa|elimin|invade/.test(l)?'guerra':(/desarrolla|empieza a investigar/.test(l)?'tec':(/se termina|sube a nivel|destruye/.test(l)?'obra':(/anexa|tributo|Alianza/.test(l)?'dip':(/Evento:/.test(l)?'ev':'otro'))));
  let h=`<h3>Historial de la partida</h3><div class="row"><span class="seg">${[['todo','Todo'],['guerra','Guerra'],['tec','Ciencia'],['obra','Obras'],['dip','Tribus'],['ev','Eventos']].map(([k,l])=>`<button data-act="hf" data-v="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</span>${logButtonsHTML()}</div>`;
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
  let h='<h4>Órdenes de este paso'+(ui.orders.length?' <button class="btn sm" data-act="undo" title="Quita la última orden (Ctrl+Z)">↶ Deshacer</button>':'')+'</h4>';
  h+=ui.orders.length?'<ul class="ord">'+ui.orders.map((o,i)=>`<li><span>${esc(ordText(o))}</span><button data-act="del" data-i="${i}" aria-label="Quitar">×</button></li>`).join('')+'</ul>':'<div class="hint">Sin órdenes: tus zonas siguen trabajando solas.</div>';
  if(cm.tech>F.tech) h+=`<div class="warn">Las órdenes de investigación gastan ${cm.tech} de tecnología y tienes ${Math.floor(F.tech)}.</div>`;
  if(cm.gold>F.gold) h+=`<div class="warn">Las órdenes gastan ${cm.gold} de oro y tienes ${Math.floor(F.gold)}: algunas no se harán completas.</div>`;
  h+='<h4>Qué pasó en el paso anterior</h4>';
  h+=G.log&&G.log.length?'<div class="log">'+G.log.map(m=>`<div>${esc(m)}</div>`).join('')+'</div>':'<div class="hint">Todavía nada.</div>';
  h+=`<div class="hint"><a href="#" data-act="tab" data-tab="hist">Ver el historial completo →</a></div>`;
  return h;
}
