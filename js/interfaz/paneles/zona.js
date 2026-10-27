'use strict';
// Panel de una zona: encabezado y subpestañas Resumen, Población, Edificios, Militar, Recursos y Moverse.

function unitsTable(z){
  let h='';
  Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).forEach(f=>{
    const us=z.units[f], by={}; us.forEach(u=>{ const k=u.t; by[k]=by[k]||{n:0,w:0}; by[k].n++; if(u.w>0) by[k].w++; });
    const vis=(f!==TRIBE)||tribeVisible(z)||z.owner!==TRIBE;
    h+=`<div class="ut"><span class="dot" style="background:${PLN[f].col}"></span><b>${PLN[f].name}</b>: `;
    h+=vis?Object.keys(by).map(t=>`<span class="uchip" title="${UN[t]}">${uIcon(t,22)}<b>${by[t].n}</b>${by[t].w?`<small>(${by[t].w} herid.)</small>`:''}</span>`).join(''):'(no los ves todavía)';
    h+='</div>';
  });
  return h||'<div class="hint">Sin unidades.</div>';
}
function tribeVisible(z){ return z.adj.some(a=>(G.zones[a].units[ME]||[]).length>0)||(z.units[ME]||[]).length>0; }
// Tributo que exige una tribu: cuánto, para cuándo y desde dónde pagar.
// La zona peligrosa (antes frontera): se gana oro con tropas ahí si todos los presentes están en paz.
function frontierHTML(z){
  const here=presentF(z).filter(isPl); const me=here.includes(ME); const others=here.filter(f=>f!==ME);
  const gain=(z.frontGain||{})[ME]; const racha=(z.fh||{})[ME]||0, extra=Math.round(100*Math.min(FRONTIER_GROW_MAX,FRONTIER_GROW*racha));
  let h=`<div class="frontier"><div class="trh">🚩 <b>Zona peligrosa</b> · nadie puede adueñarse de ella; pagan a quien la protege con tropas</div>`;
  h+=`<table class="dil"><tr><th></th><th>El otro, en paz</th><th>El otro ataca</th></tr><tr><th>Tú, en paz</th><td class="ok">🪙 +${FRONTIER_SHARED} los dos</td><td class="neg">te atacan por sorpresa</td></tr><tr><th>Tú atacas</th><td>pelea con sorpresa; si lo echas, 🪙 +${FRONTIER_ALONE} solo para ti</td><td class="neg">guerra sin ventaja</td></tr></table>`;
  h+=`<div class="hint">⏫ El bono sube un ${Math.round(FRONTIER_GROW*100)} % por cada paso seguido con tropas aquí, hasta +${Math.round(FRONTIER_GROW_MAX*100)} %. ${me?`Llevas ${racha} paso${racha===1?'':'s'}: <b>+${extra} %</b>. `:''}Si pierdes la presencia, vuelves a 0.</div>`;
  h+=`<div class="hint">${me?(others.length?`Compartes la zona peligrosa con ${others.map(f=>`<b style="color:${PLN[f].col}">${esc(PLN[f].name)}</b>`).join(' y ')}. Tu postura hacia ${others.length>1?'ellos':'él'}: ${others.map(f=>stanceOf(G,ME,f)==='alerta'?'⚔ Alerta':'☮ Paz').join(', ')}.`:'Estás solo aquí: ganas el bono mayor mientras nadie más ponga tropas.'):(others.length?`Aquí está ${others.map(f=>esc(PLN[f].name)).join(' y ')}. Puedes entrar con civiles: si los dos están en paz, ganan los dos.`:'Está vacía: quien llegue primero gana el bono mayor.')} La gente aquí no produce y come de tu zona más cercana.${gain?` Último paso: ${rq('gold',gain,true)}.`:''}</div></div>`;
  return h;
}
function tributeHTML(z){
  const t=(G.tributes||[]).find(x=>x.zone===z.id&&x.targets.includes(ME)); if(!t) return '';
  const res=t.res, local=(res==='food'||res==='prod'); const F=G.F[ME];
  const inQ=ui.orders.some(o=>o.t==='tribute'&&o.tribe===z.id);
  const rel=((z.rel||{})[ME])||0; let h=`<div class="tribute"><div class="trh">🤝 <b>Pide ${rq(res,t.amount)}</b> hasta el paso ${t.due}</div><div class="hint">Cumplirlo sube tu relación con ella (${rel}/${TRIBE_REL_MAX}). Rechazarlo no tiene castigo; con relación ${TRIBE_REL_MAX} podrás anexarla.</div>`;
  if(t.paid[ME]) return h+'<div class="ok">✓ Ya pagaste tu parte.</div></div>';
  if(inQ) return h+'<div class="ok">✓ El pago está en cola: se hace al presionar ¡Listo!</div></div>';
  const mine=zonesOf(G,ME).filter(a=>z.adj.includes(a.id));
  if(!mine.length) return h+'<div class="hint">Necesitas una zona tuya vecina para pagar.</div></div>';
  h+='<div class="row">';
  if(local) mine.forEach(a=>{ const have=Math.floor(a[res]); h+=have>=t.amount?btnHTML('tribute',`Pagar desde ${esc(zname(a))} <small>(${RI[res]} ${have})</small>`,`data-tribe="${z.id}" data-from="${a.id}"`,'primary'):`<span class="hint">${esc(zname(a))} solo tiene ${have}.</span>`; });
  else { const have=Math.floor(res==='gold'?F.gold:F.tech); h+=have>=t.amount?btnHTML('tribute',`Pagar ${RI[res]} ${t.amount} <small>(tienes ${have})</small>`,`data-tribe="${z.id}" data-from="${mine[0].id}"`,'primary'):`<span class="warn">Te faltan ${t.amount-have} de ${TSPEC_N[res]}.</span>`; }
  return h+'</div></div>';
}
function annexHTML(z){
  if(z.owner!==TRIBE) return '';
  if(!tribeVisible(z)) return '<div class="hint">Acércate con una unidad para ver qué piden.</div>';
  const price=annexPrice(G,ME,z), res=TSPEC_RES[z.tspec]; const near=nearOwnZones(G,ME,z), have=annexHave(G,ME,z), p=tribePop(z);
  const rel=((z.rel||{})[ME])||0, war=(G.wars||[]).find(w=>w.tribe===z.id&&w.f===ME);
  let h=`<div class="box"><b>Tribu ${esc(({agr:'agrícola',ing:'de producción',com:'comercial',cie:'de tecnología'})[z.tspec]||'')}</b> · ${p.civ} civiles y ${p.mil} guerreros<div class="hint">Para unirse piden <b>${rq(res,price)}</b>${z.tmult>1?' (×2 por un empate)':''} · conquistarla da ${rq(res,conquestReward(z))}</div>`;
  h+=`<div class="relbar" title="Cumple sus pedidos (uno cada ${TRIBE_REQ_EVERY} pasos) para ganarte su confianza">Relación: ${[0,1,2,3].map(i=>`<i class="${i<rel?'on':''}"></i>`).join('')} <b>${TRIBE_REL_N[rel]}</b> (${rel}/${TRIBE_REL_MAX})</div>`;
  if(war) return h+`<div class="warn">⚔ <b>En guerra contigo</b>: sus civiles se volvieron guerreros y atacan tus zonas cercanas (${war.left} paso${war.left===1?'':'s'} más, o hasta que la conquistes).</div></div>`;
  if(rel<TRIBE_REL_MAX) return h+`<div class="hint">Todavía no puedes anexarla: primero cumple sus pedidos hasta tener relación ${TRIBE_REL_MAX}. Atacarla es entrar en guerra con ella.</div></div>`;
  if(near.length){
    const where=(res==='food'||res==='prod')?` (suma de ${near.length} zona${near.length>1?'s':''} tuya${near.length>1?'s':''} cerca)`:' (global)';
    h+=`<div class="${have>=price?'hint':'warn'}">Tienes ${Math.floor(have)}${where}.</div>`;
    if(have>=price) h+=`<div class="row">${btnHTML('annex','Anexar · '+RI[res]+' '+price,`data-zone="${z.id}" data-from="${near[0].id}"`)}</div>`;
    else h+=`<div class="hint">Te faltan ${Math.ceil(price-have)}. Las reservas de comida y producción están limitadas por el almacenamiento de cada zona.</div>`;
  } else h+='<div class="hint">Necesitas una zona tuya vecina para pagar.</div>';
  return h+'</div>';
}
function buildingsHTML(z){
  const M=G.M[ME]; let h='<h4>Edificios <span class="hint">(espacios: '+(z.b.length+z.proj.filter(p=>p.k!=='u').length)+'/'+slotsOf(G,z)+')</span></h4>';
  if(!z.b.length) h+='<div class="hint">Sin edificios.</div>';
  z.b.forEach((b,i)=>{
    const d=BT[b.t]; const cap=b.t==='mar'?1:capLevel(G,ME,b.t); const opts=b.t==='mar'?[]:specOptions(G,ME,b.t);
    const up=ui.orders.some(o=>(o.t==='upgrade'||o.t==='demolish'||o.t==='bspec')&&o.zone===z.id&&o.bi===i);
    h+=`<div class="bld"><svg class="bico" viewBox="-34 -64 68 80" aria-hidden="true">${bGlyph(b.t,b.l,false)}</svg><b>${b.t==='mar'&&b.w?WONDERS[b.w].n:d.n}</b>${b.dup?' (2.º)':''} ${b.t==='mar'&&b.w?'· '+esc(WONDERS[b.w].d):'nivel '+b.l}${b.s?` · ${SPEC_NAMES[b.s]}`:''}${b.t!=='mar'?` · ${b.wk||0}/${M.wk} trabajadores`:''}<div class="row">`;
    if(b.t!=='mar'&&b.l<Math.min(5,cap)&&!up&&!z.proj.some(p=>p.k==='u'&&p.bi===i)) h+=btnHTML('upgrade',`Mejorar a nivel ${b.l+1} (${stepCost(G,ME,z,b.t,b.dup)})`,`data-zone="${z.id}" data-bi="${i}"`);
    if(opts.length&&!up) h+=`<select data-f="bs_${z.id}_${i}"><option value="">Especialización…</option>${opts.map(k=>`<option value="${k}" ${b.s===k?'selected':''}>${SPEC_NAMES[k]}</option>`).join('')}</select>`+btnHTML('bspec','Aplicar',`data-zone="${z.id}" data-bi="${i}"`);
    if(b.t!=='mar'&&!up) h+=btnHTML('demolish','Destruir (recupera '+Math.floor((b.cost||20)*0.5)+')',`data-zone="${z.id}" data-bi="${i}"`);
    h+='</div></div>';
  });
  const pausedNow=(()=>{ const pd=ui.orders.filter(o=>o.t==='pausebuild'&&o.zone===z.id).pop(); return pd?pd.on:!!z.pauseBuild; })();
  z.proj.forEach((p,pi)=>{ const nm=p.k==='b'?'Construyendo '+BT[p.bt].n:p.k==='w'?'Construyendo '+(p.w?WONDERS[p.w].n:'una Maravilla'):'Mejorando '+BT[z.b[p.bi]?z.b[p.bi].t:'almacen'].n+' a nivel '+p.to; h+=`<div class="proj">${pi===0?`<button class="btn" style="float:right;padding:0 8px;min-width:0" data-act="pausebuild" data-zone="${z.id}" title="${pausedNow?'Reanudar las obras de esta zona':'Pausar las obras de esta zona: la producción se guarda en el almacén'}" aria-pressed="${pausedNow}">${pausedNow?'▶':'⏸'}</button>`:''}${nm}${pausedNow?' (en pausa)':''}: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div></div>`; });
  h+=buildCardsHTML(z);
  return h;
}
// Tarjetas para construir: dibujo, nombre arriba y, al pasar el mouse, qué hace y por qué no se puede.
function buildCardsHTML(z){
  const free=slotsOf(G,z)-z.b.length-z.proj.filter(p=>p.k!=='u').length;
  const queued=ui.orders.filter(o=>(o.t==='build'||o.t==='wonder')&&o.zone===z.id).length;
  let h=`<h4>Construir <span class="hint">(${Math.max(0,free-queued)} espacio${free-queued===1?'':'s'} libre${free-queued===1?'':'s'})</span></h4><div class="bgrid">`;
  Object.keys(BT).filter(k=>k!=='mar').forEach(k=>{
    const d=BT[k], isW=false; const have=sameCount(z,k)+ui.orders.filter(o=>o.zone===z.id&&((o.t==='build'&&o.bt===k)||(isW&&o.t==='wonder'))).length;
    const mx=maxSame(G,ME,k), dup=have>0&&!isW, lvl=isW?1:buildLevel(G,ME,k); const cost=isW?wonderCostOf(G,ME,z):stepCost(G,ME,z,k,dup)*lvl;
    const specs=isW?[]:specOptions(G,ME,k);
    let st='ok', why='';
    if(!techOwn(G,ME,d.unlock)){ st='lock'; why='Necesita la tecnología «'+d.unlock+'».'; }
    else if(!isW&&have>=mx){ st='max'; why=mx===1?'Ya hay uno. Un segundo necesita una tecnología de nivel '+DUP_LEVEL+' de este edificio.':'Ya tienes '+mx+', el máximo por zona.'; }
    else if(free-queued<=0){ st='full'; why='No queda espacio de edificio (1 por cada 3 de tamaño).'; }
    const act=st==='ok'?(isW?`data-act="wonder" data-zone="${z.id}"`:`data-act="${specs.length?'bpick':'build'}" data-zone="${z.id}" data-bt="${k}"`):'disabled';
    const picked=ui.bpick&&ui.bpick.zone===z.id&&ui.bpick.bt===k;
    const cnt=have?`<span class="bcnt">${have}</span>`:'';
    h+=`<button class="bcard ${st} ${picked?'picked':''}" ${act} aria-label="${esc(d.n)}${st==='ok'?', cuesta '+cost:'. '+esc(why)}"><span class="bname">${esc(d.n)}</span>${cnt}<svg viewBox="-34 -64 68 80" aria-hidden="true">${bGlyph(k,0,false)}</svg>${lvl>1&&st!=='lock'?`<span class="blvl">nivel ${lvl}</span>`:''}<span class="bcost">${st==='ok'?(dup?'2.º · ':'')+cost+' ⚒':st==='lock'?'🔒':st==='max'?'máximo':'sin espacio'}</span><span class="btip"><b>${esc(d.n)}</b>${esc(BEFF[k])}${st==='ok'?`<i>Se construye en <b>nivel ${lvl}</b> (el más alto que tienes). Cuesta ${cost} de producción${dup?' (segundo de la zona: +50 %)':''}.${specs.length?' Al tocarla eliges su especialización.':''}</i>`:`<i>${esc(why)}</i>`}</span></button>`;
  });
  // maravillas: una tarjeta por cada una que ya puedes construir (tecnología de su rama) y siga disponible
  Object.keys(WONDERS).filter(w=>techOwn(G,ME,WONDERS[w].tech)).forEach(w=>{
    const W=WONDERS[w], built=wonderBuilt(G,w), mine=wonderRace(G,w).some(x=>x.f===ME)||ui.orders.some(o=>o.t==='wonder'&&o.w===w);
    const cost=wonderCostOf(G,ME,z); let st='ok', why='';
    if(built){ st='max'; why='Ya la construyó '+(isPl(built.owner)?PLN[built.owner].name:'alguien')+' en '+zname(built)+'.'; }
    else if(mine){ st='max'; why='Ya la estás construyendo.'; }
    else if(free-queued<=0){ st='full'; why='No queda espacio de edificio.'; }
    const act=st==='ok'?`data-act="wonder" data-zone="${z.id}" data-w="${w}"`:'disabled';
    h+=`<button class="bcard ${st}" ${act} aria-label="${esc(W.n)}${st==='ok'?', cuesta '+cost:'. '+esc(why)}"><span class="bname">${esc(W.n)}</span><svg viewBox="-34 -64 68 80" aria-hidden="true">${bGlyph('mar',0,false)}</svg><span class="bcost">${st==='ok'?cost+' ⚒':st==='max'?(built?'ya existe':'en obra'):'sin espacio'}</span><span class="btip"><b>${esc(W.n)}</b>Maravilla de ${esc(W.r)}: ${esc(W.d)} mientras controles su zona. Es única en la partida y se anuncia a todos al empezar: quien la termine primero se la queda.${st!=='ok'?'<i>'+esc(why)+'</i>':''}</span></button>`; });
  h+='</div>';
  if(ui.bpick&&ui.bpick.zone===z.id){ const k=ui.bpick.bt; const ops=specOptions(G,ME,k);
    h+=`<div class="bpick"><b>${esc(BT[k].n)} de nivel ${buildLevel(G,ME,k)}</b> · ¿con qué especialización nace?<div class="row">${btnHTML('build','Sin especializar',`data-zone="${z.id}" data-bt="${k}"`)}${ops.map(o=>btnHTML('build',esc(SPEC_NAMES[o]),`data-zone="${z.id}" data-bt="${k}" data-spec="${o}"`,'primary')).join('')}</div><div class="hint">Puedes cambiarla después desde el edificio.</div></div>`; }
  return h;
}
function moveFormHTML(){
  const mv=ui.mv; const from=G.zones[mv.from], to=G.zones[mv.to]; const M=G.M[ME];
  const hostile=(to.owner!==null&&to.owner!==ME&&!allied(G,ME,to.owner));
  let h=`<div class="box"><h4>Mover: ${zname(from)} → ${zname(to)}</h4><div class="hint">${TERRN[to.terrain]} · ${to.owner===null?'sin dueño':PLN[to.owner].name}</div>`;
  h+=unitsTable(to);
  if(to.owner===TRIBE) h+=annexHTML(to);
  const types=CIV.concat(MIL).filter(t=>availQ(from.id,t)>0);
  h+='<div class="mvgrid">';
  types.forEach(t=>{
    const mx=availQ(from.id,t), civ=CIV.includes(t), dis=civ&&hostile;
    h+=`<label>${UNP[t]}<small> (${mx})</small></label>${numHTML('mv_'+t,fv('mv_'+t,0),dis?0:mx)}`;
  });
  h+='</div>';
  if(hostile) h+='<div class="warn">Los civiles no pueden entrar a zonas de otro jugador ni de tribus.</div>';
  const needSt=hostile||presentF(to).some(f=>f!==ME);
  if(needSt) h+=`<div class="row">Al entrar <span class="seg"><button data-act="mvst" data-v="paz" aria-pressed="${ui.mv.st==='paz'}">Paz</button><button data-act="mvst" data-v="ataque" aria-pressed="${ui.mv.st==='ataque'}">Ataque</button></span></div>`;
  const extra=from.b.some(b=>b.t==='cuartel')?M.cuartelExtra:0;
  if(extra>0){ const opts=[['','No seguir']].concat(to.adj.filter(a=>a!==from.id).map(a=>[a,zname(G.zones[a])])); h+=`<div class="row">Seguir a otra zona (Cuartel) ${selHTML('mv_via',opts,'')}</div>`; }
  const sel={}; CIV.concat(MIL).forEach(t=>{ const n=Number(fv('mv_'+t,0))||0; if(n>0) sel[t]=n; });
  const hops=fv('mv_via','')===''?1:2; const gold=moveGold(sel,hops);
  const nmil=Object.keys(sel).filter(t=>MIL.includes(t)).reduce((a,t)=>a+sel[t],0);
  const nciv=Object.keys(sel).filter(t=>CIV.includes(t)).reduce((a,t)=>a+sel[t],0);
  h+=`<div class="cost ${gold>G.F[ME].gold?'bad':''}"><b>${gold?rq('gold',gold):'Gratis'}</b><small>${nmil?`${nmil} militar${nmil>1?'es':''} × ${hops} zona${hops>1?'s':''} × 🪙 1${M.milMoveHalf?' ÷ 2':''}`:''}${nmil&&nciv?' · ':''}${nciv?`${nciv} civil${nciv>1?'es':''} gratis (no producen este paso)`:''}${gold?` · tienes ${rq('gold',Math.floor(G.F[ME].gold))}`:''}</small></div>`;
  h+=`<div class="row">${btnHTML('mvgo','Mandar'+(gold?' · 🪙 '+gold:''),'','primary')}${btnHTML('mvcancel','Cancelar')}</div></div>`;
  return h;
}
const ZSUBS=[['resumen','Resumen'],['poblacion','Población'],['edificios','Edificios'],['militar','Militar'],['recursos','Recursos'],['mover','Moverse']];
function hasUnitsHere(z){ return (z.units[ME]||[]).length>0; }
function openMove(fromId,toId){
  const s=G.zones[fromId], z=G.zones[toId]; const hostile=(z.owner!==null&&z.owner!==ME&&!allied(G,ME,z.owner));
  ui.sel=fromId; ui.mv={from:fromId,to:toId,st:hostile?'ataque':'paz'};
  // por defecto: todas las tropas y, si la zona destino es libre o propia, 1 civil (de preferencia un poblador)
  const civPick=hostile?null:['pob','agr','com','ing','cie'].find(t=>availQ(fromId,t)>0);
  CIV.concat(MIL).forEach(t=>{ const mx=availQ(fromId,t); ui.form['mv_'+t]=MIL.includes(t)?(t==='ari'||t==='lan'?0:mx):(t===civPick?1:0); });
  ui.form.mv_via=''; ui.tab='zona'; ui.zsub='mover';
}
function nearestSource(zid){ // zona con unidades mías más cercana, y el camino hasta zid (prefiere caminos sin zonas ajenas)
  const run=strict=>{
    const prev={}; prev[zid]=null; const q=[zid];
    while(q.length){ const a=q.shift(); if(a!==zid&&hasUnitsHere(G.zones[a])){ const p=[]; let c=a; while(c!==null){ p.push(c); c=prev[c]; } return p; }
      for(const b of G.zones[a].adj){ if(b in prev) continue; const zb=G.zones[b]; if(strict&&zb.owner!==null&&zb.owner!==ME&&b!==a&&!allied(G,ME,zb.owner)&&b!==zid&&!hasUnitsHere(zb)) continue; prev[b]=a; q.push(b); } }
    return null;
  };
  return run(true)||run(false);
}
function zoneStatus(a){
  if(a.owner===ME) return '<span class="tag" style="background:'+PLN[ME].col+'">tuya</span>';
  if(a.role==='frontera') return '<span class="tag" style="background:#C9A24A">frontera</span>';
  if(a.owner===null) return '<span class="tag" style="background:#6B8E5A">libre</span>';
  if(a.owner===TRIBE) return '<span class="tag" style="background:#8A5A3A">tribu</span>';
  return `<span class="tag" style="background:${PLN[a.owner].col}">${esc(PLN[a.owner].name)}</span>`;
}
function neighborsHTML(z){
  const can=hasUnitsHere(z); let h='<div class="nbs">';
  z.adj.forEach(id=>{ const a=G.zones[id]; const pres=presentF(a).filter(f=>f!==TRIBE||tribeVisibleFor(a)).map(f=>`${a.units[f].length} ${PLN[f].name}`).join(', ');
    h+=`<div class="nb"><div><b>${esc(zname(a))}</b> ${zoneStatus(a)}<div class="hint">${TERRN[a.terrain]} · tamaño ${a.size}${pres?' · '+esc(pres):' · vacía'}</div></div>${can?btnHTML('openmv','Ir',`data-from="${z.id}" data-to="${a.id}"`,'primary'):''}</div>`; });
  return h+'</div>';
}
const RIC={food:'🌾',prod:'⚒',gold:'🪙',tech:'🔬'};
function outChips(o){ return ['food','prod','gold','tech'].filter(k=>o[k]>0.4).map(k=>`<span class="oc">${RIC[k]} +${Math.round(o[k])}</span>`).join(''); }
function barHTML(v,max,col){ const p=max>0?Math.max(0,Math.min(100,Math.round(100*v/max))):0; return `<div class="rbar"><i style="width:${p}%;background:${col}"></i></div>`; }
// Qué está pasando en una zona propia: lo producido, las reservas, quién trabaja y dónde.
function zoneOverview(z){
  const L=z.lastBy, last=z.last, fd=(z.feed||{})[ME]; let h='';
  // --- este paso ---
  if(last){
    const need=fd?fd.need:0, net=last.food-need-(z.feedOut||0);
    h+=`<div class="zstep"><div class="zst"><span class="zi">🌾</span><b class="${net>=0?'pos':'neg'}">${net>=0?'+':''}${net}</b><small>neta</small><em>+${last.food} −${need}${z.feedOut?` −${z.feedOut}📦`:''}</em></div>`
      +`<div class="zst"><span class="zi">⚒</span><b>+${last.prod}</b></div><div class="zst"><span class="zi">🪙</span><b>+${last.gold}</b></div><div class="zst"><span class="zi">🔬</span><b>+${last.tech}</b></div></div>`;
  } else h+='<div class="hint">Después del primer paso verás aquí lo que produce la zona.</div>';
  // --- reservas ---
  const cf=capStore(G,z,'food'), cp=capStore(G,z,'prod'), gc=growCost(G,z.owner,z);
  const rt=(z.routes||[]); const gm=z.growMode||GROW_MODE_DEFAULT;
  h+=`<div class="hint" style="margin:-2px 0 4px">${gm==='crecer'?'👶 El sobrante va a <b>crecer</b>':'⏸ El crecimiento está <b>en pausa</b>: el sobrante se guarda'}${z.autoSpec?` · los que nacen serán <b>${UNP[z.autoSpec].toLowerCase()}</b>`:''}${rt.length?` · 🔁 ${rt.length} envío${rt.length>1?'s':''} automático${rt.length>1?'s':''}`:''} <a href="#" data-act="zsub" data-s="recursos" class="wlink">cambiar</a></div>`;
  h+=`<div class="zres3"><div><span title="comida">🌾</span><b>${Math.floor(z.food)}/${cf}</b>${barHTML(z.food,cf,'#9DC764')}</div><div><span title="producción">⚒</span><b>${Math.floor(z.prod)}/${cp}</b>${barHTML(z.prod,cp,'#C9A878')}</div><div><span title="crecimiento">👶</span><b>${Math.floor(z.prog)}/${gc}</b>${barHTML(z.prog,gc,'#7FB2E5')}<small>${growText(z)}</small></div></div>`;
  // --- quién trabaja y dónde ---
  const us=z.units[ME]||[]; const cnt={}; us.forEach(u=>{ cnt[u.t]=(cnt[u.t]||0)+1; });
  const blds=(L&&L.blds)||[]; const pl=researchPlan(G,ME)[z.id]||{n:0,sci:0};
  let rows='';
  CIV.filter(t=>cnt[t]).forEach(t=>{
    const J=(L&&L.jobs[t])||{n:0,food:0,prod:0,gold:0,tech:0}; const out={food:J.food,prod:J.prod,gold:J.gold,tech:J.tech};
    const where=[];
    blds.filter(b=>!b.mil&&b.who&&b.who[t]).forEach(b=>{ const k=b.who[t]/Math.max(1,b.wk); ['food','prod','gold','tech'].forEach(r=>{ out[r]+=(b[r]||0)*k; }); where.push(`${b.who[t]} en ${BT[b.t].n.toLowerCase()}${b.dup?' 2.º':''}`); });
    let note='';
    if((t==='ing'||t==='pob')&&L&&L.building&&L.building[t]>0){ const pr=z.proj[0]; note=`${L.building[t]} construye${L.building[t]===1?'':'n'}${pr?': '+projName(z,pr)+' ('+Math.round(100*(pr.tot-pr.left)/pr.tot)+' %)':''}`; }
    if(t==='cie') note=G.F[ME].rq.length?`${pl.n} investiga${pl.n===1?'':'n'}${pl.sci-pl.n>0?`, ${pl.sci-pl.n} genera${pl.sci-pl.n===1?'':'n'} ciencia`:''}`:'generan ciencia (no hay nada en cola)';
    { const ug=(z.units[ME]||[]).filter(u=>u.t===t), ng=ug.filter(u=>traitBorder(u)==='tg').length, ns=ug.filter(u=>traitBorder(u)==='ts').length; if(ng||ns) note=[note,(ng?'🥇 '+ng+' muy buenos':'')+(ng&&ns?' · ':'')+(ns?'🥈 '+ns+' buenos':'')].filter(Boolean).join(' · '); }
    const free=cnt[t]-where.reduce((a,w)=>a+parseInt(w),0); if(where.length&&free>0) where.push(`${free} ${t==='pob'?'en casa':'en el campo'}`);
    rows+=`<div class="wrow">${uIcon(t,30)}<div class="wtx"><b>${cnt[t]} ${(cnt[t]>1?UNP[t]:UN[t]).toLowerCase()}</b><small>${esc([where.join(' · '),note].filter(Boolean).join(' · ')||(t==='pob'?'en casa: un poco de comida y producción':'trabajando en el campo'))}</small></div><div class="wout">${outChips(out)}</div></div>`;
  });
  if(L&&L.idle&&(L.idle.busy||L.idle.moving)) rows+=`<div class="hint">${L.idle.busy?L.idle.busy+' cambiando de oficio (no producen este paso)':''}${L.idle.busy&&L.idle.moving?' · ':''}${L.idle.moving?L.idle.moving+' recién llegados':''}</div>`;
  const extra=[]; if(L&&L.cap) extra.push(`<div class="wrow"><span class="wico">★</span><div class="wtx"><b>Capital</b><small>bono fijo de la capital</small></div><div class="wout">${outChips({food:L.cap,prod:L.cap,gold:L.cap,tech:L.cap})}</div></div>`);
  if(z.res&&z.resGain) extra.push(`<div class="wrow"><span class="wico"><span class="dot" style="background:${RES[z.res].col};width:18px;height:18px"></span></span><div class="wtx"><b>${esc(RES[z.res].n)}</b><small>recurso estratégico · ${z.resHeld||0} pasos en tu poder (rinde más con el tiempo)</small></div><div class="wout">${outChips({[z.resGain.res]:z.resGain.n})}</div></div>`);
  if(L&&L.zone) extra.push(`<div class="wrow"><span class="wico">${emblemSVG(L.zone.spec,12,26)}</span><div class="wtx"><b>Zona ${SPECN[L.zone.spec].toLowerCase()} nivel ${L.zone.lvl}</b><small>bono por tener mayoría de un oficio</small></div><div class="wout">${outChips(L.zone)}</div></div>`);
  h+=`<h4>Quién trabaja y dónde</h4>${rows||'<div class="hint">No hay civiles en esta zona.</div>'}${extra.join('')}`;
  const idleB=blds.filter(b=>!b.mil&&b.wk<b.max); if(idleB.length) h+=`<div class="warn">Faltan trabajadores en: ${idleB.map(b=>`${BT[b.t].n} (${b.wk}/${b.max})`).join(', ')}.</div>`;
  // --- tropas ---
  const mil=MIL.filter(t=>cnt[t]);
  if(mil.length){
    const mt=mil.map(t=>`${cnt[t]} ${(cnt[t]>1?UNP[t]:UN[t]).toLowerCase()}`).join(', ');
    const cu=blds.filter(b=>b.mil); h+=`<h4>Tropas</h4><div class="wrow">${uIcon(mil[0],30)}<div class="wtx"><b>${esc(mt)}</b><small>${cu.length?cu.map(b=>`${b.wk||0} en ${BT[b.t].n.toLowerCase()}`).join(' · ')+' · ':''}comen 2 cada una (las del cuartel, nada)</small></div></div>`;
  }
  if(z.owner===ME&&(z.units[ME]||[]).some(u=>!UT[u.t].civ)&&supplySources(G,ME,z.id).length===0) h+='<div class="warn">⚠ Esta zona está aislada: sin camino seguro, sus tropas pasan hambre.</div>';
  if(fd&&(Object.keys(fd.from).length||fd.short)) h+=`<div class="${fd.short?'warn':'hint'}">Comida de la gente: ${fd.local} de aquí${Object.keys(fd.from).map(s=>`, ${fd.from[s]} desde ${esc(zname(G.zones[s]))}`).join('')}${fd.short?`. Faltaron ${fd.short}: alguien pasa hambre.`:'.'}</div>`;
  return h;
}
function projName(z,p){ return p.k==='b'?BT[p.bt].n:p.k==='w'?(p.w?WONDERS[p.w].n:'Maravilla'):'mejora de '+BT[z.b[p.bi]?z.b[p.bi].t:'almacen'].n; }
function growText(z){ const n=growETA(G,z); return n===undefined?'se calcula después del primer paso':n===null?'no crece (le falta comida)':n===1?'nace un poblador el próximo paso':'próximo poblador en '+n+' pasos'; }
function subResumen(z){
  let h='';
  const bt=battlesAt(z.id,G.step-1); if(bt.length) h+=`<div class="tribute">⚔ <b>Hubo combate aquí en el paso anterior.</b><div class="row">${battleButtons(bt)}</div></div>`;
  if(mine(z)) h+=zoneOverview(z);
  else h+=`<div class="kv"><span>Tamaño</span><span>${z.size}</span><span>Control</span><span>${z.owner===null?'sin dueño':z.owner===TRIBE?'tribu':esc(PLN[z.owner].name)}</span></div>`;
  if(z.role==='frontera') h+=frontierHTML(z);
  if(z.owner===TRIBE) h+=tributeHTML(z)+annexHTML(z);
  if(hasUnitsHere(z)){ h+='<h4>Ir a una zona vecina</h4>'+neighborsHTML(z); }
  else { const r=nearestSource(z.id); if(r&&r.length>1) h+=`<div class="hint">Tus unidades más cercanas están en <b>${esc(zname(G.zones[r[0]]))}</b> (${r.length-1} paso${r.length>2?'s':''}). Mira la pestaña «Moverse».</div>`; }
  return h;
}
function subPoblacion(z){
  let h='';
  const us=z.units[ME]||[];
  if(!mine(z)){ const by={}; us.forEach(u=>{ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; }); const civ=CIV.filter(t=>by[t]); return '<h4>Población civil</h4>'+(civ.length?'<div class="kv">'+civ.map(t=>`<span>${uIcon(t,20)} ${UNP[t]}</span><span>${by[t].n}</span>`).join('')+'</div>':'<div class="hint">Sin civiles.</div>'); }
  { const pend=ui.orders.filter(o=>o.t==='autospec'&&o.zone===z.id).pop(); const cur=pend?(pend.to||'pob'):(z.autoSpec||'pob'); const per=specPer(G,ME,z,'pob',cur==='pob'?'agr':cur);
    h+=fold('nacer','Los que nazcan aquí serán',cur==='pob'?'pobladores':UNP[cur].toLowerCase());
    if(ui.det&&ui.det.nacer) h+=`<div class="row">${CIV.map(t=>`<button class="btn ${cur===t?'primary':''}" data-act="autospec" data-v="${t}" title="${UNP[t]}">${uIcon(t,22)}</button>`).join('')}</div><div class="hint">${cur==='pob'?'Pobladores (sin especializar).':`Cada poblador que nazca se hace <b>${UN[cur].toLowerCase()}</b> al instante si hay ${rq('prod',per)}; si no, queda como poblador.`}</div>`; }
  h+='<h4>Oficios <a href="#" data-wiki="oficios" class="wlink" title="Arrastra a las personas hacia el oficio que quieres (o tócalas y luego toca el oficio). Cada cambio cuesta producción. Lo que sueltas queda en cola hasta que presiones ¡Listo!.">ⓘ</a></h4>'+dndHTML(z);
  const civT=CIV.filter(t=>availQ(z.id,t)>0);
  if(civT.length){
    const fromT=civT.includes(fv('sp_from','pob'))?fv('sp_from','pob'):civT[0];
    const toT=CIV.filter(t=>t!==fromT); const toSel=toT.includes(fv('sp_to','agr'))?fv('sp_to','agr'):toT[0];
    h+=`<details data-d="num" ${ui.det&&ui.det.num?'open':''}><summary>Modo numérico</summary><div class="row">${selHTML('sp_from',civT.map(t=>[t,UNP[t]+' ('+availQ(z.id,t)+')']),fromT)} → ${selHTML('sp_to',toT.map(t=>[t,UNP[t]]),toSel)} ${numHTML('sp_n',1,availQ(z.id,fromT))}</div><div class="row">${btnHTML('spec','Especializar')}</div></details>`;
  }
  const pl=researchPlan(G,ME)[z.id]||{sci:0,n:0}; const F=G.F[ME];
  h+=`<h4>Investigación <a href="#" data-wiki="investigar" class="wlink">ⓘ</a></h4>`;
  if(!pl.sci) h+='<div class="hint">Arrastra pobladores al Laboratorio para tener científicos.</div>';
  else if(!F.rq.length) h+=`<div class="hint">${pl.sci} científico${pl.sci>1?'s':''} generando ciencia. Cuando pongas una tecnología en cola, investigan solos.</div>`;
  else h+=`<div class="hint">De ${pl.sci} científico${pl.sci>1?'s':''}, este paso <b>${pl.n} investiga${pl.n===1?'':'n'}</b>${pl.sci-pl.n?` y ${pl.sci-pl.n} genera${pl.sci-pl.n===1?'':'n'} ciencia porque no alcanza la guardada`:''}.</div>`;
  return h;
}
function subEdificios(z){ return mine(z)?buildingsHTML(z):'<div class="hint">Solo ves los edificios de tus propias zonas.</div>'; }
function supplyHTML(z){
  const us=z.units[ME]||[]; if(!us.some(u=>!UT[u.t].civ)) return '';
  const fd=(z.feed||{})[ME]; const src=fd?fd.line:(supplySources(G,ME,z.id)[0]);
  const hambre=us.filter(u=>u.hg>0).length;
  if(z.owner===ME&&src!==null&&src!==undefined&&!hambre) return `<div class="hint">🍞 Suministro desde tu propio territorio.</div>`;
  if(src===null||src===undefined) return `<div class="tribute"><div class="trh">⚠ <b>Sin suministros</b></div><div class="hint">No hay camino seguro (de hasta ${SUPPLY_RANGE+(G.M[ME].supplies?1:0)} zonas, sin pasar por zonas enemigas) hasta una zona tuya con comida. Tus tropas pasan hambre, pelean con la <b>mitad de los dados</b> y acaban muriendo. Retíralas o abre el camino.</div></div>`;
  return `<div class="${hambre?'warn':'hint'}">🍞 Suministro desde <b>${esc(zname(G.zones[src]))}</b>${hambre?` · ⚠ ${hambre} con hambre: pelean con la mitad de los dados`:''}.</div>`;
}
function subMilitar(z){
  const us=z.units[ME]||[]; const by={}; us.forEach(u=>{ if(!UT[u.t].civ){ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; } });
  const mil=MIL.filter(t=>by[t]); let h='<h4>Tropas</h4>'+(mil.length?'<div class="kv">'+mil.map(t=>`<span>${uIcon(t,20)} ${UNP[t]}</span><span>${by[t].n}${by[t].w?` <small>(${by[t].w} herid.)</small>`:''}</span>`).join('')+'</div>'+supplyHTML(z):'<div class="hint">Sin tropas.</div>');
  if(!mine(z)) return h;
  h+=relationsHTML(true);
  { const T='Se puede entrenar en cualquier zona. Con un <b>Cuartel</b>, además, sus tropas no comen y se mueven una zona extra.'; h+='<h4>Entrenar militares'+infoBtn('cuartel',T)+'</h4>'+infoBody('cuartel',T); }
  { const cu=z.b.some(b=>b.t==='cuartel');
    const opts=MIL.filter(t=>!TRAIN_TECH[t]||techOwn(G,ME,TRAIN_TECH[t]));
    const uT=opts.includes(fv('tr_u','sol'))?fv('tr_u','sol'):opts[0];
    const weapon=['arq','esc','ber','cab'].includes(uT);
    const srcOpts=weapon?[['civ','Un civil'],['sol','Un soldado (equipar)']]:[['civ','Un civil']];
    const fromK=weapon&&fv('tr_src','civ')==='sol'?'sol':'civ';
    const from=fromK==='sol'?'sol':null; const stock=weapon?stockOf(z,uT)-ui.orders.filter(o=>o.t==='train'&&o.zone===z.id&&o.u===uT).reduce((a,o)=>a+o.n,0):0;
    const cost=trainCost(G,ME,z,uT,from,false), costS=trainCost(G,ME,z,uT,from,true);
    const avail=fromK==='sol'?availQ(z.id,'sol'):CIV.reduce((a,t)=>a+availQ(z.id,t),0);
    h+=`<div class="row">${selHTML('tr_u',opts.map(t=>[t,UN[t]+' ('+trainCost(G,ME,z,t,null,stockOf(z,t)>0)+')']),uT)} ${weapon?selHTML('tr_src',srcOpts,fromK):''} ${numHTML('tr_n',1,avail)}</div>`;
    h+=`<div class="hint">${weapon?`${uIcon('sol',18)} ${from?0:soldierCost(G,ME,z)} + 🛠 ${equipCost(G,ME,z,uT)} = ${rq('prod',cost)} c/u`:`${rq('prod',cost)} c/u`}${stock>0?` · 🛠×${stock} guardado${stock>1?'s':''}: ${rq('prod',costS)}`:''}</div><div class="row">${btnHTML('train','Entrenar')}</div>`;
  }
  const eqs=Object.keys(z.eq||{}).filter(t=>z.eq[t]>0), eqp=Object.keys(z.eqPend||{}).filter(t=>z.eqPend[t]>0);
  if(eqs.length||eqp.length){
    h+=`<div class="box">⚔ <b>Equipo guardado:</b> ${eqs.length?eqs.map(t=>z.eq[t]+' '+EQUIP_N[t][z.eq[t]>1?1:0]).join(', '):'nada'}${eqp.length?`<div class="hint">Por recuperar cuando acabe el conflicto: ${eqp.map(t=>z.eqPend[t]+' '+EQUIP_N[t][z.eqPend[t]>1?1:0]).join(', ')}.</div>`:''}</div>`;
  }
  h+=demobHTML(z);
  return h;
}
// Postura hacia cada jugador: en Alerta, tus tropas atacan a las suyas donde coincidan.
function relationsHTML(compact){
  const others=[...Array(G.N).keys()].filter(f=>f!==ME&&!G.F[f].out);
  if(!others.length) return '';
  const PT='En <b>Alerta</b>, tus tropas atacan a las de ese jugador en cualquier zona donde coincidan, y tienes sorpresa si él está en Paz. En <b>Paz</b> conviven, salvo que alguien entre atacando.';
  let h=`<h4>Postura con cada jugador${infoBtn('postura',PT)}</h4>`+infoBody('postura',PT);
  h+=others.map(f=>{ const pend=ui.orders.filter(o=>o.t==='stance'&&o.target===f).pop(); const cur=pend?pend.stance:stanceOf(G,ME,f); const al=allied(G,ME,f);
    return `<div class="rel"><span class="dot" style="background:${PLN[f].col}"></span><b>${esc(PLN[f].name)}</b>${al?'<span class="hint">aliado</span>':`<span class="seg"><button data-act="stance" data-t="${f}" data-v="paz" aria-pressed="${cur==='paz'}">Paz</button><button data-act="stance" data-t="${f}" data-v="alerta" aria-pressed="${cur==='alerta'}">Alerta</button></span>`}</div>`; }).join('');
  return h;
}
function demobHTML(z){
  const can=DEMOB_FROM.filter(t=>availQ(z.id,t)>0);
  if(!can.length&&!(z.units[ME]||[]).some(u=>DEMOB_FROM.includes(u.t))) return '';
  let h=fold('demob','Licenciar (volver a civiles)');
  if(!ui.det||!ui.det.demob) return h;
  if(!can.length){ const hurt=(z.units[ME]||[]).some(u=>DEMOB_FROM.includes(u.t)&&u.w>0); return h+`<div class="hint">${hurt?'Las tropas heridas no se pueden licenciar hasta curarse.':'No hay tropas para licenciar en esta zona.'}</div>`; }
  const u=can.includes(fv('dm_u',can[0]))?fv('dm_u',can[0]):can[0];
  const to=CIV.includes(fv('dm_to','pob'))?fv('dm_to','pob'):'pob';
  const per=demobCost(G,ME,to);
  h+=`<div class="row">${selHTML('dm_u',can.map(t=>[t,UNP[t]+' ('+availQ(z.id,t)+')']),u)} → ${selHTML('dm_to',CIV.map(t=>[t,UN[t]+' ('+demobCost(G,ME,t)+')']),to)} ${numHTML('dm_n',1,availQ(z.id,u))}</div>`;
  h+=`<div class="hint">${per?`Cuesta ${rq('prod',per)} cada uno`:'Gratis gracias a «Reservistas»'}. Vuelven como civiles con fuerza 1 y dejan de comer el doble. Ese paso no producen.</div><div class="row">${btnHTML('demob','Licenciar')}</div>`;
  return h;
}
// Prioridad de la comida que sobra: crecer o guardar.
function growModeHTML(z){
  const pend=ui.orders.filter(o=>o.t==='growmode'&&o.zone===z.id).pop(); const cur=pend?pend.mode:(z.growMode||GROW_MODE_DEFAULT);
  const ST=cur==='crecer'?'Después de alimentar a todos y de los envíos automáticos, <b>todo el sobrante va a crecer</b>. Las reservas no aumentan.':'Después de alimentar a todos y de los envíos, <b>el sobrante se guarda</b> en el almacén; solo lo que no cabe va a crecer. Útil para juntar comida para una tribu, un tributo o una guerra.';
  return `<h4>Comida que sobra${infoBtn('sobra',ST)}</h4><div class="row"><span class="seg"><button data-act="growmode" data-v="crecer" aria-pressed="${cur==='crecer'}">👶 Crecer</button><button data-act="growmode" data-v="guardar" aria-pressed="${cur==='guardar'}">⏸ Pausar crecimiento (guardar)</button></span></div>`+infoBody('sobra',ST)+``;
}
// Envíos que se repiten cada paso.
function routesHTML(z){
  const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id); if(!others.length) return '';
  const routes=(z.routes||[]).slice(); ui.orders.filter(o=>o.t==='route'&&o.from===z.id).forEach(o=>{ const i=routes.findIndex(r=>r.to===o.to&&r.res===o.res); if(i>=0) routes.splice(i,1); if(o.q) routes.push({to:o.to,res:o.res,q:o.q,pend:1}); });
  let h='<h4>Envíos automáticos (cada paso)</h4>';
  h+=routes.length?routes.map(r=>{ const p=ownPath(G,ME,z.id,r.to,12); const fac=p?shipFactor(G,p):0; return `<div class="rel">🔁 <span>${r.res==='food'?'🌾 Comida':'⚒ Producción'} → <b>${esc(zname(G.zones[r.to]))}</b>: ${r.q==='sobrante'?'todo el sobrante':r.q+' por paso'} <small class="hint">(${fm(fac)} de oro por unidad${r.pend?' · empieza al presionar ¡Listo!':''})</small></span>${btnHTML('route','Quitar',`data-to="${r.to}" data-res="${r.res}" data-q="0"`)}</div>`; }).join(''):'<div class="hint">Ninguno. Sirve para mantener abastecida una zona que no produce lo que necesita.</div>';
  const dsel=others.some(a=>String(a.id)===String(fv('rt_to','')))?fv('rt_to',''):others[0].id;
  h+=`<div class="row">${selHTML('rt_res',[['food','🌾 Comida'],['prod','⚒ Producción']],'food')} → ${selHTML('rt_to',others.map(a=>[a.id,zname(a)]),dsel)} ${selHTML('rt_q',[['sobrante','todo el sobrante'],['2','2 por paso'],['5','5 por paso'],['10','10 por paso']],'sobrante')} ${btnHTML('route','Enviar cada paso',`data-from="${z.id}"`)}</div><div class="hint">Se hace después de alimentar a la gente y antes de crecer, pagando la logística en oro.</div>`;
  return h;
}
// Encabezado que se abre y se cierra (el panel recuerda cómo lo dejaste).
function fold(key,title,extra){
  const open=!!(ui.det&&ui.det[key]);
  return `<button class="fold ${open?'on':''}" data-act="fold" data-k="${key}" aria-expanded="${open}">${open?'▾':'▸'} ${esc(title)}${extra?` <small>${extra}</small>`:''}</button>`;
}
function subRecursos(z){
  if(!mine(z)) return '<div class="hint">Solo puedes enviar recursos desde tus propias zonas.</div>';
  let h=`<div class="zres3"><div><span>🌾</span><b>${Math.floor(z.food)}/${capStore(G,z,'food')}</b>${barHTML(z.food,capStore(G,z,'food'),'#9DC764')}</div><div><span>⚒</span><b>${Math.floor(z.prod)}/${capStore(G,z,'prod')}</b>${barHTML(z.prod,capStore(G,z,'prod'),'#C9A878')}</div><div></div></div>`;
  h+=growModeHTML(z)+routesHTML(z);
  const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id);
  if(others.length){
    const dest=others.map(a=>[a.id,zname(a)]); const dsel=others.some(a=>String(a.id)===String(fv('sd_to','')))?fv('sd_to',''):others[0].id;
    const path=ownPath(G,ME,z.id,Number(dsel),12); const fac=path?shipFactor(G,path):0; const q=Number(fv('sd_q',5))||0;
    const cst=Math.ceil(q*fac);
    h+=fold('send1','Enviar ahora (una vez)');
    if(!(ui.det&&ui.det.send1)) return h;
    h+=`<div class="row">${selHTML('sd_res',[['food','🌾 Comida'],['prod','⚒ Producción']],'food')} → ${selHTML('sd_to',dest,dsel)} ${numHTML('sd_q',5,50)}</div>`;
    h+=path?`<div class="cost ${cst>G.F[ME].gold?'bad':''}"><b>${cst?rq('gold',cst):'Gratis'}</b><small>${q} × ${fm(fac)} 🪙 por unidad · ${path.length} zona${path.length>1?'s':''}${path.some(i=>G.zones[i].b.some(b=>b.t==='camino'))?' (con Camino cuesta menos)':''}${cst?` · tienes ${rq('gold',Math.floor(G.F[ME].gold))}`:''}</small></div><div class="row">${btnHTML('send','Enviar'+(cst?' · 🪙 '+cst:''))}</div>`:'<div class="warn">No hay camino de zonas tuyas hasta ahí.</div>';
  } else h+='<div class="hint">Necesitas otra zona tuya para enviar recursos.</div>';
  return h;
}
function subMover(z){
  if(ui.mv) return moveFormHTML();
  let h='';
  if(hasUnitsHere(z)){ h+='<div class="hint">Elige a qué zona vecina ir. Puedes explorar cualquiera, incluso las vacías.</div>'+neighborsHTML(z); }
  else {
    h+='<div class="hint">No tienes unidades en esta zona.</div>';
    const r=nearestSource(z.id);
    if(r&&r.length>1){ const names=r.map(i=>zname(G.zones[i])).join(' → '); h+=`<div class="box">Tu unidad más cercana está en <b>${esc(zname(G.zones[r[0]]))}</b>. Ruta: ${esc(names)} (${r.length-1} paso${r.length>2?'s':''}; se avanza una zona por paso).<div class="row">${btnHTML('openmv',r.length===2?'Mover hasta aquí':'Dar el primer paso hacia aquí',`data-from="${r[0]}" data-to="${r[1]}"`,'primary')}</div></div>`; }
    else h+='<div class="hint">No tienes unidades que puedan llegar a esta zona.</div>';
  }
  return h;
}
function presenceChips(z,f){
  const us=z.units[f]||[], by={}; us.forEach(u=>{ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; });
  return Object.keys(by).map(t=>`<span class="uchip" title="${UN[t]}${by[t].w?' ('+by[t].w+' heridos)':''}">${uIcon(t,20)}<b>${by[t].n}</b>${by[t].w?'<small>✚'+by[t].w+'</small>':''}</span>`).join('');
}
function zoneHead(z){
  const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':z.role==='frontera'?'Frontera':'Zona libre';
  const own=z.owner===null?'':z.owner===ME?'':`<span class="tag" style="background:${PLN[z.owner].col}">${PLN[z.owner].name}</span>`;
  const mineHere=(z.units[ME]||[]).length?`<span class="zpres">${presenceChips(z,ME)}</span>`:'';
  let h=`<div class="zhead"><div class="ztitle"><h3><span class="dot" style="background:${z.owner===null?'#B8A58C':PLN[z.owner].col}"></span>${esc(zname(z))}</h3>${mineHere}</div><span class="zbtns">${G.zones.filter(a=>a.owner===ME).length>1?'<button class="xbtn" data-act="zprev" title="Zona tuya anterior" aria-label="Zona tuya anterior">◀</button><button class="xbtn" data-act="znext" title="Zona tuya siguiente" aria-label="Zona tuya siguiente">▶</button>':''}<button class="xbtn" data-act="desel" title="Cerrar la zona (Esc)" aria-label="Cerrar la zona">✕</button></span></div>`;
  h+=`<div class="zsub2"><span title="${esc(TERRFX[z.terrain])}">${rn} · ${TERRN[z.terrain]}</span> ${own}`;
  if(z.res){ const r=RES[z.res]; h+=` <span class="zres" title="${esc(r.d)}"><span class="dot" style="background:${r.col}"></span>${r.n}</span>`; }
  h+='</div>';
  // los demás presentes (rivales, tribu) en una línea aparte
  Object.keys(z.units).map(Number).filter(f=>f!==ME&&z.units[f].length>0).forEach(f=>{
    const vis=(f!==TRIBE)||tribeVisible(z)||z.owner!==TRIBE;
    h+=`<div class="ut"><span class="dot" style="background:${PLN[f].col}"></span>${PLN[f].name}: ${vis?presenceChips(z,f):'(no los ves todavía)'}</div>`;
  });
  return h;
}
function panelZona(){
  const z=ui.sel!==null?G.zones[ui.sel]:null;
  if(!z) return '<p class="hint">Toca una zona del mapa. Cada zona tiene sus propias pestañas: resumen, población, edificios, militar, recursos y moverse. Si tienes gente en ella, desde «Moverse» eliges a qué zona vecina ir.</p>';
  const mz=mine(z); const subs=mz?ZSUBS:[ZSUBS[0],ZSUBS[5]];
  const cur=subs.some(s=>s[0]===ui.zsub)?ui.zsub:'resumen';
  let h=zoneHead(z)+'<div class="subtabs" role="tablist">'+subs.map(([k,l])=>`<button data-act="zsub" data-s="${k}" aria-selected="${k===cur}" role="tab">${l}</button>`).join('')+'</div>';
  const fn={resumen:subResumen,poblacion:subPoblacion,edificios:subEdificios,militar:subMilitar,recursos:subRecursos,mover:subMover}[cur];
  return h+fn(z);
}
