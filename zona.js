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
function annexHTML(z){
  if(z.owner!==TRIBE) return '';
  if(!tribeVisible(z)) return '<div class="hint">Acércate con una unidad para ver qué piden.</div>';
  const price=annexPrice(G,ME,z), res=TSPEC_RES[z.tspec]; const near=nearOwnZones(G,ME,z), have=annexHave(G,ME,z), p=tribePop(z);
  let h=`<div class="box"><b>Tribu ${esc(({agr:'agrícola',ing:'de producción',com:'comercial',cie:'de tecnología'})[z.tspec]||'')}</b> · ${p.civ} civiles y ${p.mil} guerreros<div class="hint">Para unirse piden <b>${price} de ${TSPEC_N[res]}</b>${z.tmult>1?' (precio duplicado por un empate)':''}. Conquistarla da ${conquestReward(z)} de ${TSPEC_N[res]}.</div>`;
  if(near.length){
    const where=(res==='food'||res==='prod')?` (suma de ${near.length} zona${near.length>1?'s':''} tuya${near.length>1?'s':''} cerca)`:' (global)';
    h+=`<div class="${have>=price?'hint':'warn'}">Tienes ${Math.floor(have)}${where}.</div>`;
    if(have>=price) h+=`<div class="row">${btnHTML('annex','Anexar pagando '+price,`data-zone="${z.id}" data-from="${near[0].id}"`)}</div>`;
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
    h+=`<div class="bld"><span class="sq" style="background:${d.col}"></span><b>${d.n}</b> nivel ${b.l}${b.s?` · ${SPEC_NAMES[b.s]}`:''}${b.t!=='mar'?` · ${b.wk||0}/${M.wk} trabajadores`:''}<div class="row">`;
    if(b.t!=='mar'&&b.l<Math.min(5,cap)&&!up&&!z.proj.some(p=>p.k==='u'&&p.bi===i)) h+=btnHTML('upgrade',`Mejorar a nivel ${b.l+1} (${stepCost(G,ME,z,b.t)})`,`data-zone="${z.id}" data-bi="${i}"`);
    if(opts.length&&!up) h+=`<select data-f="bs_${z.id}_${i}"><option value="">Especialización…</option>${opts.map(k=>`<option value="${k}" ${b.s===k?'selected':''}>${SPEC_NAMES[k]}</option>`).join('')}</select>`+btnHTML('bspec','Aplicar',`data-zone="${z.id}" data-bi="${i}"`);
    if(b.t!=='mar'&&!up) h+=btnHTML('demolish','Destruir (recupera '+Math.floor((b.cost||20)*0.5)+')',`data-zone="${z.id}" data-bi="${i}"`);
    h+='</div></div>';
  });
  z.proj.forEach(p=>{ const nm=p.k==='b'?'Construyendo '+BT[p.bt].n:p.k==='w'?'Construyendo una Maravilla':'Mejorando '+BT[z.b[p.bi]?z.b[p.bi].t:'almacen'].n+' a nivel '+p.to; h+=`<div class="proj">${nm}: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div></div>`; });
  // construir
  const have=Object.keys(BT).filter(k=>k!=='mar'&&techOwn(G,ME,BT[k].unlock));
  const free=slotsOf(G,z)-z.b.length-z.proj.filter(p=>p.k!=='u').length;
  if(free>0){
    if(have.length){
      h+=`<div class="row">Construir ${selHTML('bt',have.map(k=>[k,BT[k].n+' ('+stepCost(G,ME,z,k)+')']),have[0])}${btnHTML('build','Construir',`data-zone="${z.id}"`)}</div>`;
    } else h+='<div class="hint">Aún no has desbloqueado ningún edificio (tecnologías de nivel 1 de cada edificio).</div>';
    if(techOwn(G,ME,'Maravillas')) h+=`<div class="row">${btnHTML('wonder','Maravilla ('+wonderCostOf(G,ME,z)+' de producción)',`data-zone="${z.id}"`)}</div>`;
  } else h+='<div class="hint">No quedan espacios de edificio (1 por cada 3 de tamaño).</div>';
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
  const gold=Object.keys(ui.form).filter(k=>k.startsWith('mv_')&&MIL.includes(k.slice(3))).reduce((a,k)=>a+Math.ceil((fv(k,0)||0)*(M.milMoveHalf?0.5:1)*(fv('mv_via','')===''?1:2)),0);
  h+=`<div class="hint">Mover militares cuesta 1 de oro por unidad por zona. Este movimiento: ${gold} de oro.</div>`;
  h+=`<div class="row">${btnHTML('mvgo','Mandar','','primary')}${btnHTML('mvcancel','Cancelar')}</div></div>`;
  return h;
}
const ZSUBS=[['resumen','Resumen'],['poblacion','Población'],['edificios','Edificios'],['militar','Militar'],['recursos','Recursos'],['mover','Moverse']];
function hasUnitsHere(z){ return (z.units[ME]||[]).length>0; }
function openMove(fromId,toId){
  const s=G.zones[fromId], z=G.zones[toId]; const hostile=(z.owner!==null&&z.owner!==ME&&!allied(G,ME,z.owner));
  ui.sel=fromId; ui.mv={from:fromId,to:toId,st:hostile?'ataque':'paz'};
  CIV.concat(MIL).forEach(t=>{ const mx=availQ(fromId,t); ui.form['mv_'+t]=MIL.includes(t)?(t==='ari'||t==='lan'?0:mx):(t==='pob'&&!hostile?Math.min(1,mx):0); });
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
function subResumen(z){
  let h=''; const F=G.F[ME];
  if(isPl(z.owner)){
    const sp=z.sp||zoneSpec(G,z,z.owner);
    h+=`<div class="kv"><span>Población</span><span>${ownPop(z)}</span><span>Tamaño</span><span>${z.size} · espacios ${slotsOf(G,z)}</span><span>Comida</span><span>${Math.floor(z.food)}/${capStore(G,z,'food')}</span><span>Producción</span><span>${Math.floor(z.prod)}/${capStore(G,z,'prod')}</span><span>Crecimiento</span><span>${Math.floor(z.prog)}/${growCost(G,z.owner,z)}</span><span>Zona</span><span>${SPECN[sp.spec]} nivel ${sp.lvl}</span><span>Capacidad de obra</span><span>${conCap(G,z,z.owner)} por paso</span>${z.last?`<span>Último paso</span><span>+${z.last.food} comida, +${z.last.prod} prod., +${z.last.gold} oro, +${z.last.tech} tec.</span>`:''}<span>Postura</span><span>${z.stance==='alerta'?'Alerta':'Paz'}${z.conflict?' · EN CONFLICTO':''}</span></div>`;
  } else h+=`<div class="kv"><span>Tamaño</span><span>${z.size}</span><span>Control</span><span>${z.owner===null?'sin dueño':z.owner===TRIBE?'tribu':esc(PLN[z.owner].name)}</span></div>`;
  if(z.owner===TRIBE) h+=annexHTML(z);
  if(hasUnitsHere(z)){ h+='<h4>Ir a una zona vecina</h4>'+neighborsHTML(z); }
  else { const r=nearestSource(z.id); if(r&&r.length>1) h+=`<div class="hint">Tus unidades más cercanas están en <b>${esc(zname(G.zones[r[0]]))}</b> (${r.length-1} paso${r.length>2?'s':''}). Mira la pestaña «Moverse».</div>`; }
  return h;
}
function subPoblacion(z){
  let h='';
  const us=z.units[ME]||[];
  if(!mine(z)){ const by={}; us.forEach(u=>{ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; }); const civ=CIV.filter(t=>by[t]); return '<h4>Población civil</h4>'+(civ.length?'<div class="kv">'+civ.map(t=>`<span>${uIcon(t,20)} ${UNP[t]}</span><span>${by[t].n}</span>`).join('')+'</div>':'<div class="hint">Sin civiles.</div>'); }
  h+='<h4>Oficios <a href="#" data-wiki="oficios" class="wlink">ⓘ</a></h4>'+dndHTML(z);
  const civT=CIV.filter(t=>availQ(z.id,t)>0);
  if(civT.length){
    const fromT=civT.includes(fv('sp_from','pob'))?fv('sp_from','pob'):civT[0];
    const toT=CIV.filter(t=>t!==fromT); const toSel=toT.includes(fv('sp_to','agr'))?fv('sp_to','agr'):toT[0];
    h+=`<details data-d="num" ${ui.det&&ui.det.num?'open':''}><summary>Modo numérico</summary><div class="row">${selHTML('sp_from',civT.map(t=>[t,UNP[t]+' ('+availQ(z.id,t)+')']),fromT)} → ${selHTML('sp_to',toT.map(t=>[t,UNP[t]]),toSel)} ${numHTML('sp_n',1,availQ(z.id,fromT))}</div><div class="row">${btnHTML('spec','Especializar')}</div></details>`;
  }
  const sciN=(z.units[ME]||[]).filter(u=>u.t==='cie'&&u.w===0).length; const pend=ui.orders.filter(o=>o.t==='assign'&&o.zone===z.id).pop();
  const curN=pend?pend.n:Math.min(z.resN||0,sciN);
  h+=`<h4>Investigación <a href="#" data-wiki="investigar" class="wlink">ⓘ</a></h4><div class="hint">Científicos aquí: ${sciN}. Investigando: ${curN}${pend?' (cambio pendiente)':''}. Los que investigan no generan ciencia: usan 2 cada uno${(z.sp&&z.sp.spec==='cie')?' (más el bono de la zona de tecnología)':''}.</div>`;
  h+=sciN>0?`<div class="row">${numHTML('rs_n',curN,sciN)}${btnHTML('assign','Asignar')}</div>`:'<div class="hint">Arrastra pobladores al Laboratorio para tener científicos.</div>';
  return h;
}
function subEdificios(z){ return mine(z)?buildingsHTML(z):'<div class="hint">Solo ves los edificios de tus propias zonas.</div>'; }
function subMilitar(z){
  const us=z.units[ME]||[]; const by={}; us.forEach(u=>{ if(!UT[u.t].civ){ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; } });
  const mil=MIL.filter(t=>by[t]); let h='<h4>Tropas</h4>'+(mil.length?'<div class="kv">'+mil.map(t=>`<span>${UNP[t]}</span><span>${by[t].n}${by[t].w?` (${by[t].w} heridos)`:''}</span>`).join('')+'</div>':'<div class="hint">Sin tropas.</div>');
  if(!mine(z)) return h;
  const pend=ui.orders.filter(o=>o.t==='stance'&&o.zone===z.id).pop(); const cur=pend?pend.stance:z.stance;
  h+=`<div class="row"><b>Postura de la zona</b><span class="seg"><button data-act="stance" data-v="paz" aria-pressed="${cur==='paz'}">Paz</button><button data-act="stance" data-v="alerta" aria-pressed="${cur==='alerta'}">Alerta</button></span></div><div class="hint">Alerta: atacas a quien entre. Si el otro entró en paz, tú tienes la sorpresa.</div>`;
  h+='<h4>Entrenar militares</h4>';
  if(!z.b.some(b=>b.t==='cuartel')) h+='<div class="hint">Necesitas un Cuartel en la zona (tecnología «Cuarteles»).</div>';
  else {
    const opts=MIL.filter(t=>!TRAIN_TECH[t]||techOwn(G,ME,TRAIN_TECH[t]));
    const uT=opts.includes(fv('tr_u','sol'))?fv('tr_u','sol'):opts[0];
    const weapon=['arq','esc','ber','cab'].includes(uT);
    const srcOpts=weapon?[['civ','Un civil'],['sol','Un soldado (equipar)']]:[['civ','Un civil']];
    const fromK=weapon&&fv('tr_src','civ')==='sol'?'sol':'civ';
    const cost=trainCost(G,ME,z,uT,fromK==='sol'?'sol':null);
    const avail=fromK==='sol'?availQ(z.id,'sol'):CIV.reduce((a,t)=>a+availQ(z.id,t),0);
    h+=`<div class="row">${selHTML('tr_u',opts.map(t=>[t,UN[t]+' ('+trainCost(G,ME,z,t,null)+')']),uT)} ${weapon?selHTML('tr_src',srcOpts,fromK):''} ${numHTML('tr_n',1,avail)}</div><div class="hint">Cuesta ${cost} de producción cada uno.</div><div class="row">${btnHTML('train','Entrenar')}</div>`;
  }
  h+=demobHTML(z);
  return h;
}
function demobHTML(z){
  const can=DEMOB_FROM.filter(t=>availQ(z.id,t)>0);
  let h='<h4>Licenciar (volver a civiles)</h4>';
  if(!can.length){ const hurt=(z.units[ME]||[]).some(u=>DEMOB_FROM.includes(u.t)&&u.w>0); return h+`<div class="hint">${hurt?'Las tropas heridas no se pueden licenciar hasta curarse.':'No hay tropas para licenciar en esta zona.'}</div>`; }
  const u=can.includes(fv('dm_u',can[0]))?fv('dm_u',can[0]):can[0];
  const to=CIV.includes(fv('dm_to','pob'))?fv('dm_to','pob'):'pob';
  const per=demobCost(G,ME,to);
  h+=`<div class="row">${selHTML('dm_u',can.map(t=>[t,UNP[t]+' ('+availQ(z.id,t)+')']),u)} → ${selHTML('dm_to',CIV.map(t=>[t,UN[t]+' ('+demobCost(G,ME,t)+')']),to)} ${numHTML('dm_n',1,availQ(z.id,u))}</div>`;
  h+=`<div class="hint">${per?`Cuesta ${per} de producción cada uno`:'Gratis gracias a «Reservistas»'}. Vuelven como civiles con fuerza 1 y dejan de comer el doble. Ese paso no producen.</div><div class="row">${btnHTML('demob','Licenciar')}</div>`;
  return h;
}
function subRecursos(z){
  if(!mine(z)) return '<div class="hint">Solo puedes enviar recursos desde tus propias zonas.</div>';
  let h=`<div class="kv"><span>Comida</span><span>${Math.floor(z.food)}/${capStore(G,z,'food')}</span><span>Producción</span><span>${Math.floor(z.prod)}/${capStore(G,z,'prod')}</span></div>`;
  const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id);
  if(others.length){
    const dest=others.map(a=>[a.id,zname(a)]); const dsel=others.some(a=>String(a.id)===String(fv('sd_to','')))?fv('sd_to',''):others[0].id;
    const path=ownPath(G,ME,z.id,Number(dsel),12); const fac=path?shipFactor(G,path):0; const q=Number(fv('sd_q',5))||0;
    h+=`<h4>Enviar recursos</h4><div class="row">${selHTML('sd_res',[['food','Comida'],['prod','Producción']],'food')} → ${selHTML('sd_to',dest,dsel)} ${numHTML('sd_q',5,50)}</div><div class="hint">${path?`Distancia ${path.length} · cuesta ${Math.ceil(q*fac)} de oro (${fm(fac)} por unidad).`:'No hay camino de zonas tuyas hasta ahí.'}</div><div class="row">${btnHTML('send','Enviar')}</div>`;
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
  const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':'Zona libre';
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
