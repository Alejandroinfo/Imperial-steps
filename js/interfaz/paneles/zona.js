'use strict';
// Panel de una zona: encabezado y subpestañas Resumen, Población, Edificios, Militar, Recursos y Moverse.

function unitsTable(z){
  let h='';
  Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).forEach(f=>{
    const us=z.units[f], by={}; us.forEach(u=>{ const k=u.t; by[k]=by[k]||{n:0,w:0,g:0}; by[k].n++; if(u.w>0) by[k].w++; if(u.gen) by[k].g++; });
    const vis=(f!==TRIBE)||tribeVisible(z)||z.owner!==TRIBE;
    h+=`<div class="ut"><span class="dot" style="background:${PLN[f].col}"></span><b>${PLN[f].name}</b>: `;
    h+=vis?Object.keys(by).map(t=>`<span class="uchip" title="${UN[t]}">${uIcon(t,22)}<b>${by[t].n}</b>${by[t].g?`<small>★${by[t].g}</small>`:''}${by[t].w?`<small>(${by[t].w} herid.)</small>`:''}</span>`).join(''):'(no los ves todavía)';
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
// Barra de relación de −3 (insatisfacción 3: te ataca) a +3 (alianza: puedes anexarla).
function relBarHTML(rel){
  return '<span class="relb">'+[-3,-2,-1,0,1,2,3].map(i=>`<i class="${i===0?'mid':i<0?'neg':'pos'}${(i<0&&rel<=i)||(i>0&&rel>=i)?' on':''}"></i>`).join('')+'</span>';
}
// Qué pasa con tu relación según lo que hagas con el pedido: cumplir sube 1 e ignorar baja 1 (a −3 ataca).
function annexHTML(z){
  if(z.owner!==TRIBE) return '';
  if(!tribeVisible(z)) return '<div class="hint">Acércate con una unidad para ver qué piden.</div>';
  const price=annexPrice(G,ME,z), res=TSPEC_RES[z.tspec]; const near=nearOwnZones(G,ME,z), have=annexHave(G,ME,z), p=tribePop(z);
  const rel=((z.rel||{})[ME])||0, war=(G.wars||[]).find(w=>w.tribe===z.id&&w.f===ME);
  const na=tribeNextAsk(G,z,ME);
  let h=`<div class="box tribox"><div class="trt"><b>Tribu ${esc(({agr:'agrícola',ing:'de producción',com:'comercial',cie:'de tecnología'})[z.tspec]||'')}</b><span>${p.civ} civiles · ${p.mil} guerreros</span></div>`;
  h+=`<div class="trrow" title="Cumplir un pedido sube 1; ignorarlo baja 1. Con +${TRIBE_REL_MAX} puedes anexarla; con ${TRIBE_REL_MIN} te ataca."><span>Relación ${relBarHTML(rel)} <b>${TRIBE_REL_N[rel+3]}</b></span><span class="${rel<=-2?'neg':''}" title="${na===null?'No te pedirá más por ahora':na===0?'Te pide algo este paso':'Próximo pedido en '+na+' pasos'}">⏳ ${na===null?'—':na===0?'ya':na+' p.'}</span></div>`;
  if(war) return h+`<div class="warn">⚔ <b>En guerra contigo</b>: atacan tus zonas cercanas. Quedan <b>${war.left} paso${war.left===1?'':'s'}</b> o hasta que la conquistes.</div><div class="tmbar war"><i style="width:${Math.round(100*war.left/TRIBE_WAR_STEPS)}%"></i></div></div>`;
  h+=`<div class="trrow"><span title="Anexarla exige relación ${TRIBE_REL_MAX}">Anexar: <b>${rq(res,price)}</b>${z.tmult>1?' (×2)':''}</span><span title="Si la conquistas">⚔ ${rq(res,conquestReward(z))}</span></div>`;
  if(rel<TRIBE_REL_MAX) return h+`<div class="hint">Cumple sus pedidos hasta relación ${TRIBE_REL_MAX} para poder anexarla (hoy ${rel}). Atacarla es entrar en guerra.</div></div>`;
  if(!near.length) return h+'<div class="hint">Necesitas una zona tuya vecina para pagar.</div></div>';
  if(have>=price) h+=`<div class="row">${btnHTML('annex','Anexar · '+RI[res]+' '+price,`data-zone="${z.id}" data-from="${near[0].id}"`,'primary')}<span class="hint">tienes ${Math.floor(have)}</span></div>`;
  else h+=`<div class="warn">Te faltan ${Math.ceil(price-have)} de ${RI[res]} (tienes ${Math.floor(have)}).</div>`;
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
function stepperHTML(act,key,t,n,mx,dis){
  return `<div class="stp ${n>0?'on':''} ${dis?'dis':''}">${uIcon(t,34)}<span class="sn"><b>${n}</b><small>de ${mx}</small></span><span class="sb"><button data-act="${act}" data-k="${key}" data-d="1" ${dis||n>=mx?'disabled':''} aria-label="Uno más">＋</button><button data-act="${act}" data-k="${key}" data-d="-1" ${n<=0?'disabled':''} aria-label="Uno menos">－</button></span></div>`;
}
function zoneMini(a){ const col=a.owner===null?'#B8A58C':PLN[a.owner].col; return `<div class="zmini"><span class="nband" style="background:${TCOL[a.terrain]}"><span class="nown" style="background:${col}"></span></span><b>${esc(zname(a))}</b><small>${TERRN[a.terrain]}</small>${zoneDeps(a).length?`<span class="nrow" style="padding:0 8px 4px">${depBadges(a)}</span>`:''}</div>`; }
function moveFormHTML(){
  const mv=ui.mv; const from=G.zones[mv.from], to=G.zones[mv.to]; const M=G.M[ME];
  const hostile=(to.owner!==null&&to.owner!==ME&&!allied(G,ME,to.owner));
  let h=`<div class="box mvbox"><div class="mvroute">${zoneMini(from)}<span class="mvarr">➜</span>${zoneMini(to)}</div>`;
  h+=unitsTable(to);
  if(to.owner===TRIBE) h+=annexHTML(to);
  const types=CIV.concat(MIL).filter(t=>availQ(from.id,t)>0);
  h+=`<div class="row mvq"><button class="btn" data-act="mvquick" data-v="all">Todos</button><button class="btn" data-act="mvquick" data-v="mil">Solo tropas</button><button class="btn" data-act="mvquick" data-v="none">Nadie</button></div>`;
  h+='<div class="stps">';
  types.forEach(t=>{ const mx=availQ(from.id,t), civ=CIV.includes(t), dis=civ&&hostile; h+=stepperHTML('mvstep','mv_'+t,t,dis?0:Math.min(mx,Number(fv('mv_'+t,0))||0),mx,dis); });
  h+='</div>';
  if(hostile) h+='<div class="warn">Los civiles no pueden entrar a zonas de otro jugador ni de tribus.</div>';
  const needSt=hostile||presentF(to).some(f=>f!==ME);
  if(needSt) h+=`<div class="stance2"><button data-act="mvst" data-v="paz" aria-pressed="${ui.mv.st==='paz'}"><span>☮</span><b>Paz</b></button><button data-act="mvst" data-v="ataque" aria-pressed="${ui.mv.st==='ataque'}"><span>⚔</span><b>Ataque</b></button></div>`;
  const extra=from.b.some(b=>b.t==='cuartel')?M.cuartelExtra:0;
  if(extra>0){ const nxt=to.adj.filter(a=>a!==from.id); const cur=String(fv('mv_via',''));
    h+=`<div class="viabox"><small>Con el Cuartel puedes seguir un paso más:</small><div class="row"><button class="chip ${cur===''?'on':''}" data-act="mvvia" data-v="">Quedarse</button>${nxt.map(a=>`<button class="chip ${cur===String(a)?'on':''}" data-act="mvvia" data-v="${a}">➜ ${esc(zname(G.zones[a]))}</button>`).join('')}</div></div>`; }
  const sel={}; CIV.concat(MIL).forEach(t=>{ const n=Number(fv('mv_'+t,0))||0; if(n>0) sel[t]=n; });
  const hops=fv('mv_via','')===''?1:2; const gold=moveGold(sel,hops);
  const nmil=Object.keys(sel).filter(t=>MIL.includes(t)).reduce((a,t)=>a+sel[t],0);
  const nciv=Object.keys(sel).filter(t=>CIV.includes(t)).reduce((a,t)=>a+sel[t],0);
  h+=`<div class="cost ${gold>G.F[ME].gold?'bad':''}"><b>${gold?rq('gold',gold):'Gratis'}</b><small>${nmil?`${nmil} tropa${nmil>1?'s':''} × ${hops} zona${hops>1?'s':''}${M.milMoveHalf?' ÷ 2':''}`:''}${nmil&&nciv?' · ':''}${nciv?`${nciv} civil${nciv>1?'es':''} gratis (no producen)`:''}${gold?` · tienes ${rq('gold',Math.floor(G.F[ME].gold))}`:''}</small></div>`;
  h+=`<div class="row">${btnHTML('mvgo','Mandar'+(gold?' · 🪙 '+gold:''),(nmil+nciv)?'':'disabled','primary')}${btnHTML('mvcancel','Cancelar')}</div></div>`;
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
  const can=hasUnitsHere(z); let h='<div class="ntiles">';
  z.adj.forEach(id=>{ const a=G.zones[id]; const pres=presentF(a).filter(f=>f!==TRIBE||tribeVisibleFor(a));
    const col=a.owner===null?'#B8A58C':PLN[a.owner].col;
    const chips=pres.map(f=>`<span class="npr" style="--c:${PLN[f].col}" title="${esc(PLN[f].name)}"><i></i>${a.units[f].length}</span>`).join('');
    const inner=`<span class="nband" style="background:${TCOL[a.terrain]}"><span class="nown" style="background:${col}"></span></span><b>${esc(zname(a))}</b><small>${TERRN[a.terrain]} · ${zoneStatus(a)}</small><span class="nrow">${depBadges(a)}${chips||(zoneDeps(a).length?'':'<em>vacía</em>')}</span>${can?'<span class="ngo">➜</span>':''}`;
    h+=can?`<button class="ntile" data-act="openmv" data-from="${z.id}" data-to="${a.id}" aria-label="Ir a ${esc(zname(a))}">${inner}</button>`:`<div class="ntile off">${inner}</div>`; });
  return h+'</div>';
}
const RIC={food:'🌾',prod:'⚒',gold:'🪙',tech:'🔬'};
function outChips(o){ return ['food','prod','gold','tech'].filter(k=>o[k]>0.4).map(k=>`<span class="oc">${RIC[k]} +${Math.round(o[k])}</span>`).join(''); }
function barHTML(v,max,col){ const p=max>0?Math.max(0,Math.min(100,Math.round(100*v/max))):0; return `<div class="rbar"><i style="width:${p}%;background:${col}"></i></div>`; }
// Qué está pasando en una zona propia: lo producido, las reservas, quién trabaja y dónde.
function zoneOverview(z){
  const L=z.lastBy, last=z.last, fd=(z.feed||{})[ME]; let h='';
  // --- este paso y reservas, en poco espacio: cuatro fichas (lo que rinde la zona) y una línea de crecimiento ---
  const cf=capStore(G,z,'food'), cp=capStore(G,z,'prod'), gc=growCost(G,z.owner,z);
  const rt=(z.routes||[]); const gm=z.growMode||GROW_MODE_DEFAULT;
  const need=fd?fd.need:0, net=last?last.food-need-(z.feedOut||0):0;
  const chip=(ic,val,sub,tip,bar)=>`<div class="zc" title="${esc(tip||'')}"><span class="zi">${ic}</span><b class="${val<0?'neg':val>0?'pos':''}">${last?(val>0?'+':'')+val:'–'}</b>${sub?`<em>${sub}</em>`:''}${bar||''}</div>`;
  h+=`<div class="zline">${chip('🌾',net,`${Math.floor(z.food)}/${cf}`,last?`Comida: produce +${last.food}, se come ${need}${z.feedOut?', salen '+z.feedOut:''}; guardas ${Math.floor(z.food)} de ${cf}`:'Comida guardada',barHTML(z.food,cf,'#9DC764'))}${chip('⚒',last?last.prod:0,`${Math.floor(z.prod)}/${cp}`,'Producción por paso y guardada',barHTML(z.prod,cp,'#C9A878'))}${chip('🪙',last?last.gold:0,'','Oro por paso')}${chip('🔬',last?last.tech:0,'','Ciencia por paso')}</div>`;
  h+=`<div class="zgrow" title="${esc(growText(z))}"><span class="zi">👶</span>${barHTML(z.prog,gc,'#7FB2E5')}<b>${Math.floor(z.prog)}/${gc}</b><small>${esc(growShort(z))}</small><a href="#" data-act="zsub" data-s="recursos" class="wlink" title="Elegir si el sobrante de comida va a crecer o se guarda">${gm==='crecer'?'crece':'⏸ guarda'} ⇄</a></div>`;
  if((z.repop||0)>0) h+=`<div class="hint repop" title="Murieron o fueron capturadas personas nacidas aquí: los próximos nacimientos de esta zona cuestan menos">🕊 Repoblación: los próximos ${z.repop} nacimiento${z.repop>1?'s':''} cuestan un ${Math.round(100*Math.min(0.9,REPOP_PCT+G.M[ME].repopBonus))} % menos.</div>`;
  if(z.autoSpec||rt.length) h+=`<div class="hint" style="margin:-2px 0 4px">${z.autoSpec?`Los que nacen serán <b>${UNP[z.autoSpec].toLowerCase()}</b>`:''}${z.autoSpec&&rt.length?' · ':''}${rt.length?`🔁 ${rt.length} envío${rt.length>1?'s':''} automático${rt.length>1?'s':''}`:''}</div>`;
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
    const medals=medalsHTML((z.units[ME]||[]).filter(u=>u.t===t));
    const free=cnt[t]-where.reduce((a,w)=>a+parseInt(w),0); if(where.length&&free>0) where.push(`${free} ${t==='pob'?'en casa':'en el campo'}`);
    rows+=`<div class="wrow">${uIcon(t,30)}<div class="wtx"><b>${cnt[t]} ${(cnt[t]>1?UNP[t]:UN[t]).toLowerCase()}</b><small>${esc([where.join(' · '),note].filter(Boolean).join(' · ')||(t==='pob'?'en casa: un poco de comida y producción':'trabajando en el campo'))} ${medals}</small></div><div class="wout">${outChips(out)}</div></div>`;
  });
  if(L&&L.idle&&(L.idle.busy||L.idle.moving)) rows+=`<div class="hint">${L.idle.busy?L.idle.busy+' cambiando de oficio (no producen este paso)':''}${L.idle.busy&&L.idle.moving?' · ':''}${L.idle.moving?L.idle.moving+' recién llegados':''}</div>`;
  const extra=[]; if(L&&L.cap) extra.push(`<div class="wrow"><span class="wico">★</span><div class="wtx"><b>Capital</b><small>bono fijo de la capital</small></div><div class="wout">${outChips({food:L.cap,prod:L.cap,gold:L.cap,tech:L.cap})}</div></div>`);
  (z.resGains||[]).forEach(g2=>{ const R=RES[g2.key]; extra.push(`<div class="wrow"><span class="wico">${depBadge({k:g2.key,tier:g2.tier})}</span><div class="wtx"><b>${esc(R.n)} · ${RES_TIER[g2.tier].n.toLowerCase()}</b><small>${z.resHeld||0} pasos en tu poder: rinde más con el tiempo</small></div><div class="wout">${outChips({[g2.res]:g2.n})}</div></div>`); });
  if(L&&L.zone) extra.push(`<div class="wrow"><span class="wico">${emblemSVG(L.zone.spec,12,26)}</span><div class="wtx"><b>Zona ${SPECN[L.zone.spec].toLowerCase()} nivel ${L.zone.lvl}</b><small>bono por tener mayoría de un oficio</small></div><div class="wout">${outChips(L.zone)}</div></div>`);
  h+=`<h4>Quién trabaja y dónde</h4>${rows||'<div class="hint">No hay civiles en esta zona.</div>'}${extra.join('')}`;
  const idleB=blds.filter(b=>!b.mil&&b.wk<b.max); if(idleB.length) h+=`<div class="warn">Faltan trabajadores en: ${idleB.map(b=>`${BT[b.t].n} (${b.wk}/${b.max})`).join(', ')}.</div>`;
  // --- tropas ---
  const mil=MIL.filter(t=>cnt[t]);
  if(mil.length){
    const mt=mil.map(t=>`${cnt[t]} ${(cnt[t]>1?UNP[t]:UN[t]).toLowerCase()}`).join(', ');
    const cu=blds.filter(b=>b.mil); h+=`<h4>Tropas</h4><div class="wrow">${uIcon(mil[0],30)}<div class="wtx"><b>${esc(mt)}</b><small>${cu.length?cu.map(b=>`${b.wk||0} en ${BT[b.t].n.toLowerCase()}`).join(' · ')+' · ':''}${(()=>{ let f=0,gd=0; (z.units[ME]||[]).forEach(u=>{ if(!UT[u.t].civ){ f+=(u.need||0); if(!u.free) gd+=((UNIT_UPKEEP[u.t]||{gold:0}).gold+(u.gen?GEN_PAY:0))*G.M[ME].payMul; } }); return 'mantienen 🌾 '+Math.ceil(f-1e-9)+(gd>0?' y 🪙 '+Math.ceil(gd-1e-9):'')+' por paso (las del Cuartel, nada)'; })()}</small></div></div>`;
  }
  if(z.owner===ME&&(z.units[ME]||[]).some(u=>!UT[u.t].civ)&&supplySources(G,ME,z.id).length===0) h+='<div class="warn">⚠ Esta zona está aislada: sin camino seguro, sus tropas pasan hambre.</div>';
  if(fd&&(Object.keys(fd.from).length||fd.short)) h+=`<div class="${fd.short?'warn':'hint'}">Comida de la gente: ${fd.local} de aquí${Object.keys(fd.from).map(s=>`, ${fd.from[s]} desde ${esc(zname(G.zones[s]))}`).join('')}${fd.short?`. Faltaron ${fd.short}: alguien pasa hambre.`:'.'}</div>`;
  return h;
}
function projName(z,p){ return p.k==='b'?BT[p.bt].n:p.k==='w'?(p.w?WONDERS[p.w].n:'Maravilla'):'mejora de '+BT[z.b[p.bi]?z.b[p.bi].t:'almacen'].n; }
function growShort(z){ const n=growETA(G,z); return n===undefined?'':n===null?'sin comida':n===1?'nace ya':'en '+n+' pasos'; }
function growText(z){ const n=growETA(G,z); return n===undefined?'se calcula después del primer paso':n===null?'no crece (le falta comida)':n===1?'nace un poblador el próximo paso':'próximo poblador en '+n+' pasos'; }
function subResumen(z){
  let h='';
  const bt=battlesAt(z.id,G.step-1); if(bt.length) h+=`<div class="tribute">⚔ <b>Hubo combate aquí en el paso anterior.</b><div class="row">${battleButtons(bt)}</div></div>`;
  if(mine(z)) h+=zoneOverview(z);
  else h+=`<div class="kv"><span>Tamaño</span><span>${z.size}</span><span>Control</span><span>${z.owner===null?'sin dueño':z.owner===TRIBE?'tribu':esc(PLN[z.owner].name)}</span></div>`;
  h+=depCardsHTML(z);
  if(z.role==='frontera') h+=frontierHTML(z);
  if(z.owner===TRIBE) h+=annexHTML(z);   // los pedidos de la tribu se ven y se pagan en Imperio, no aquí
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
// Aptitud para pelear de una persona: fuerza + salud (sus rasgos).
const combatApt=u=>trInt(u,'fue')+trInt(u,'sal');
const WEAPON_T=['arq','esc','ber','cab'];
// chips con los tres costos de una tropa: producción, comida y oro (los que valen 0 no salen)
function costChips(c){ return [['prod',c.prod],['food',c.food],['gold',c.gold]].filter(x=>x[1]>0).map(x=>rq(x[0],x[1])).join(' '); }
function upkeepText(t,gen){ const up=UNIT_UPKEEP[t]||{food:1,gold:0}; const g=up.gold+(gen?GEN_PAY:0); return `mantiene 🌾 ${up.food}${g?` · 🪙 ${g}`:''}`; }
// Personas que se pueden elegir ahora (sin orden en cola): civiles para nombrar general, soldados para equipar; las más aptas primero.
function trainPool(z){
  const mode=fv('tr_mode','new'); if(mode==='new') return [];
  const list=mode==='sol'?availListQ(z.id,'sol'):CIV.flatMap(t=>availListQ(z.id,t));
  return list.slice().sort((a,b)=>combatApt(b)-combatApt(a)||(a.t==='pob'?0:1)-(b.t==='pob'?0:1));
}
// Cuántas tropas más puede reclutar esta zona este paso (según sus Cuarteles) descontando lo que ya tienes en cola.
function recruitLeft(z){ return Math.max(0,recruitCap(G,ME,z)-ui.orders.filter(o=>o.t==='train'&&o.zone===z.id&&(o.from==='new'||!o.from)).reduce((a,o)=>a+(o.n||0),0)); }
// Reclutar, nombrar generales o equipar: tropa (tarjetas), de dónde sale y, si hace falta, las personas (con sus rasgos). Sin listas desplegables.
function trainPickerHTML(z){
  const T='<b>Reclutar</b>: las tropas nuevas salen de un <b>Cuartel</b> pagando producción, comida y oro (cada Cuartel recluta 1 por nivel y por paso); <b>no gastan ningún civil</b>. <b>Nombrar general</b>: un civil que tú eliges asciende a campeón: es más fuerte, el último en morir de su tipo y cobra una paga extra. <b>Equipar</b>: un soldado que ya tienes recibe su arma. Mira los rasgos de ❤ salud y ⚔ fuerza al elegir a quién ascender; también puedes arrastrar gente al puesto «Ejército» en Población.';
  let h='<h4>Reclutar y mandar'+infoBtn('cuartel',T)+'</h4>'+infoBody('cuartel',T);
  const mode=['new','civ','sol'].includes(fv('tr_mode','new'))?fv('tr_mode','new'):'new';
  const all=MIL.filter(t=>!TRAIN_TECH[t]||techOwn(G,ME,TRAIN_TECH[t]));
  const opts=mode==='new'?all.filter(t=>canRecruit(G,ME,z,t)||!hasBarracks(z)):mode==='civ'?all.filter(t=>GEN_TYPES.includes(t)):all.filter(t=>WEAPON_T.includes(t));
  h+=`<div class="row"><span class="seg"><button data-act="trmode" data-v="new" aria-pressed="${mode==='new'}">⚔ Reclutar</button><button data-act="trmode" data-v="civ" aria-pressed="${mode==='civ'}">★ Nombrar general</button><button data-act="trmode" data-v="sol" aria-pressed="${mode==='sol'}">🛠 Equipar soldados</button></span></div>`;
  if(!opts.length) return h+'<div class="hint">Todavía no tienes tecnologías para esto.</div>';
  const uT=opts.includes(fv('tr_u','sol'))?fv('tr_u','sol'):opts[0]; const weapon=WEAPON_T.includes(uT);
  const stock0=weapon?stockOf(z,uT)-ui.orders.filter(o=>o.t==='train'&&o.zone===z.id&&o.u===uT).reduce((a,o)=>a+(o.ids?o.ids.length:o.n),0):0;
  h+='<div class="trcards">'+opts.map(t=>{ const c=recruitCost(G,ME,z,t,mode,WEAPON_T.includes(t)&&stockOf(z,t)>0); return `<button class="trc ${t===uT?'on':''}" data-act="trtype" data-v="${t}" aria-pressed="${t===uT}">${uIcon(t,30)}<b>${mode==='civ'?'General de '+UN[t].toLowerCase():UN[t]}</b><small>${costChips(c)}</small><small class="up">${upkeepText(t,mode==='civ')}</small></button>`; }).join('')+'</div>';
  let n=0;
  if(mode==='new'){
    const left=recruitLeft(z), cap=recruitCap(G,ME,z);
    if(!canRecruit(G,ME,z,uT)) return h+'<div class="hint">Esta zona no tiene <b>Cuartel</b>: sin él no se puede reclutar aquí. Constrúyelo en Edificios (o investiga <i>Mercenarios</i>).</div>';
    n=Math.min(Math.max(1,Number(fv('tr_n',1))||1),Math.max(1,left));
    h+=`<div class="stp ${n>0?'on':''}">${uIcon(uT,34)}<span class="sn"><b>${left?n:0}</b><small>de ${left} este paso (${cap} por paso)</small></span><span class="sb"><button data-act="trn" data-d="1" ${n>=left?'disabled':''} aria-label="Una más">＋</button><button data-act="trn" data-d="-1" ${n<=1?'disabled':''} aria-label="Una menos">－</button></span></div>`;
    if(!left) h+='<div class="hint">Este paso ya no caben más reclutas en esta zona: cada Cuartel recluta 1 por nivel y por paso (con <i>Levas</i>, más).</div>';
    else n=Math.min(n,left);
    if(!left) n=0;
  } else {
    const pool=trainPool(z); const sel=(ui.trainIds||[]).filter(id=>pool.some(u=>u.id===id)); n=sel.length;
    if(!pool.length) h+='<div class="hint">'+(mode==='sol'?'No tienes soldados libres para equipar en esta zona.':'No hay civiles libres en esta zona (los que se mueven, trabajan en una orden o están heridos no se pueden ascender).')+'</div>';
    else {
      h+=`<div class="row trbest"><small class="hint">Elegir:</small>${[1,2,3,5].filter(k=>k<=pool.length).map(k=>`<button class="chip" data-act="trbest" data-n="${k}">Los ${k} más apto${k>1?'s':''}</button>`).join('')}${sel.length?'<button class="chip" data-act="trclear">Limpiar</button>':''}</div>`;
      h+='<div class="trpool">'+pool.slice(0,40).map(u=>{ const ap=combatApt(u); return `<div class="token tk trp ${sel.includes(u.id)?'picked':''} ${traitBorder(u)}" data-act="trpick" data-id="${u.id}" data-t="${u.t}" role="button" tabindex="0" aria-pressed="${sel.includes(u.id)}" aria-label="${esc(personName(u)+', '+UN[u.t].toLowerCase())}">${uIcon(u.t,28)}<div class="tkb">${traitChips(u)}</div>${ap?`<span class="aptc ${ap>0?'p':'n'}" title="Aptitud para pelear (fuerza + salud)">⚔${ap>0?'+':''}${ap}</span>`:''}</div>`; }).join('')+(pool.length>40?`<div class="tokmore">+${pool.length-40}</div>`:'')+'</div>';
    }
  }
  const st=weapon?Math.min(n,Math.max(0,stock0)):0; const c1=recruitCost(G,ME,z,uT,mode,true), c0=recruitCost(G,ME,z,uT,mode,false);
  const tot={prod:c1.prod*st+c0.prod*(n-st),food:c0.food*n,gold:c0.gold*n}; const cm=commits();
  const lack=(tot.prod+(cm.prod[z.id]||0)>z.prod)||(tot.food+(cm.food[z.id]||0)>z.food)||(tot.gold+cm.gold>G.F[ME].gold);
  h+=`<div class="cost ${lack?'bad':''}"><b>${n?costChips(tot):'Elige cuántos'}</b><small>${n?`${n} ${mode==='civ'?'general'+(n>1?'es':'')+' de ':''}${(n>1?UNP[uT]:UN[uT]).toLowerCase()} · ${upkeepText(uT,mode==='civ')} c/u${st>0?` · 🛠×${st} guardado${st>1?'s':''}`:''} · hay ⚒ ${Math.floor(z.prod)} · 🌾 ${Math.floor(z.food)} · 🪙 ${Math.floor(G.F[ME].gold)}`:(mode==='new'?'Usa ＋ y － para elegir cuántos reclutar.':'Toca a las personas que quieres elegir.')}</small></div>`;
  const label=mode==='new'?'Reclutar':mode==='civ'?'Nombrar general':'Equipar';
  h+=`<div class="row">${btnHTML('train',label+(n?' · '+n:''),n?'':'disabled','primary')}</div>`;
  return h;
}
function subMilitar(z){
  const us=z.units[ME]||[]; const by={}; us.forEach(u=>{ if(!UT[u.t].civ){ by[u.t]=by[u.t]||{n:0,w:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; } });
  const mil=MIL.filter(t=>by[t]); let h='<h4>Tropas</h4>'+(mil.length?'<div class="kv">'+mil.map(t=>`<span>${uIcon(t,20)} ${UNP[t]}</span><span>${by[t].n}${by[t].w?` <small>(${by[t].w} herid.)</small>`:''}</span>`).join('')+'</div>'+supplyHTML(z):'<div class="hint">Sin tropas.</div>');
  if(!mine(z)) return h;
  h+=relationsHTML(true);
  h+=trainPickerHTML(z);
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
  let h=`<h4>${compact?'Postura con cada jugador':'Rivales'}${infoBtn('postura',PT)}</h4>`+infoBody('postura',PT);
  h+=others.map(f=>{ const pend=ui.orders.filter(o=>o.t==='stance'&&o.target===f).pop(); const cur=pend?pend.stance:stanceOf(G,ME,f); const al=allied(G,ME,f);
    const open=!compact&&ui.offerTo===f;
    return `<div class="rel"><span class="dot" style="background:${PLN[f].col}"></span><b>${esc(PLN[f].name)}</b>${al?'<span class="hint">aliado</span>':`<span class="seg"><button data-act="stance" data-t="${f}" data-v="paz" aria-pressed="${cur==='paz'}">Paz</button><button data-act="stance" data-t="${f}" data-v="alerta" aria-pressed="${cur==='alerta'}">Alerta</button></span>`}${compact?'':`<button class="btn ${open?'primary':''}" data-act="ofopen" data-t="${f}" aria-expanded="${open}">🤝 Ofrecer</button>`}</div>${open?offerBuilderHTML(f):''}`; }).join('');
  return h;
}
// Constructor visual de una oferta: lo que das, lo que pides y un solo botón. Al otro le llega como un encuentro.
function offerBuilderHTML(f){
  const give=fv('of_give','gold'), ask=fv('of_ask','food')===give?['gold','food','prod','tech'].find(r=>r!==give):fv('of_ask','food');
  const have=ownedTotal(G,ME,give); const gn=Math.max(0,Math.min(Number(fv('of_gn',5))||0,have)); const an=Math.max(0,Number(fv('of_an',5))||0);
  const pick=(key,cur,skip)=>`<div class="ofres">${OFFER_RES.map(r=>`<button data-act="ofset" data-k="${key}" data-v="${r}" aria-pressed="${cur===r}" ${r===skip?'disabled':''}><span>${RI[r]}</span><small>${key==='of_give'?Math.floor(ownedTotal(G,ME,r)):RN[r]}</small></button>`).join('')}</div>`;
  const q=(key,n,max)=>`<div class="sdq"><button class="qs" data-act="ofstep" data-k="${key}" data-d="-5" aria-label="Menos">－</button><span class="qn"><b>${n}</b></span><button class="qs" data-act="ofstep" data-k="${key}" data-d="5" aria-label="Más" ${max!==undefined&&n>=max?'disabled':''}>＋</button></div>`;
  const pending=ui.orders.filter(o=>o.t==='offer'&&o.to===f).length;
  return `<div class="offer"><div class="ofcol"><b>Das</b>${pick('of_give',give,ask)}${q('of_gn',gn,have)}</div><div class="ofarr">⇄</div><div class="ofcol"><b>Pides</b>${pick('of_ask',ask,give)}${q('of_an',an)}</div></div>
    <div class="cost ${gn<=0||an<=0?'bad':''}"><b>${rq(give,gn)} ⇄ ${rq(ask,an)}</b><small>Lo que das queda en reserva hasta que ${esc(PLN[f].name)} responda; si no acepta, lo recuperas.${pending?` · ya tienes ${pending} oferta${pending>1?'s':''} para él en cola`:''}</small></div>
    <div class="row">${btnHTML('ofgo','Enviar oferta',gn>0&&an>0?`data-t="${f}"`:'disabled','primary')}${btnHTML('ofopen','Cerrar',`data-t="${f}"`)}</div>`;
}
// Dar de baja tropas (recuperas parte de su producción) o retirar a un general (vuelve a ser civil). Con botones ＋/－, sin listas.
function milFree(z,t,gen){ return (z.units[ME]||[]).filter(u=>u.t===t&&u.w===0&&!u.busy&&!!u.gen===gen).length-ui.orders.filter(o=>o.t==='demob'&&o.zone===z.id&&o.u===t&&((o.to==='baja')===!gen)).reduce((a,o)=>a+o.n,0); }
function demobHTML(z){
  const rows=[]; DEMOB_FROM.forEach(t=>{ const sol=milFree(z,t,false), gen=GEN_TYPES.includes(t)?milFree(z,t,true):0; if(sol>0) rows.push([t,'baja',sol]); if(gen>0) rows.push([t,'ret',gen]); });
  if(!rows.length&&!(z.units[ME]||[]).some(u=>DEMOB_FROM.includes(u.t))) return '';
  let h=fold('demob','Dar de baja o retirar generales');
  if(!ui.det||!ui.det.demob) return h;
  if(!rows.length) return h+'<div class="hint">No hay tropas libres en esta zona (las heridas o recién reclutadas no se pueden dar de baja).</div>';
  const per=demobCost(G,ME,'pob'), ref=Math.round(100*(G.M[ME].reserv?0.75:DISBAND_REFUND));
  h+='<div class="stps">'+rows.map(([t,k,mx])=>{ const key='dm_'+k+'_'+t; const n=Math.min(mx,Number(fv(key,0))||0); return `<div class="stp ${n>0?'on':''}">${uIcon(t,34)}<span class="sn"><b>${n}</b><small>${k==='baja'?'dar de baja':'retirar generales'} · de ${mx}</small></span><span class="sb"><button data-act="dmstep" data-k="${key}" data-d="1" data-mx="${mx}" ${n>=mx?'disabled':''}>＋</button><button data-act="dmstep" data-k="${key}" data-d="-1" ${n<=0?'disabled':''}>－</button></span></div>`; }).join('')+'</div>';
  h+=`<div class="hint">Dar de baja devuelve el ${ref} % de la producción de la tropa. Retirar a un general lo devuelve a ser poblador${per?` (cuesta ${rq('prod',per)} cada uno)`:' (gratis)'}.</div><div class="row">${btnHTML('demob','Aplicar')}</div>`;
  return h;
}
// Prioridad de la comida que sobra: crecer o guardar.
function growModeHTML(z){
  const pend=ui.orders.filter(o=>o.t==='growmode'&&o.zone===z.id).pop(); const cur=pend?pend.mode:(z.growMode||GROW_MODE_DEFAULT);
  const ST=cur==='crecer'?'Después de alimentar a todos y de los envíos automáticos, <b>todo el sobrante va a crecer</b>. Las reservas no aumentan.':'Después de alimentar a todos y de los envíos, <b>el sobrante se guarda</b> en el almacén; solo lo que no cabe va a crecer. Útil para juntar comida para una tribu, un tributo o una guerra.';
  return `<div class="row gmrow"><span class="hint">Sobrante de comida${infoBtn('sobra',ST)}</span><span class="seg"><button data-act="growmode" data-v="crecer" aria-pressed="${cur==='crecer'}">👶 Crecer</button><button data-act="growmode" data-v="guardar" aria-pressed="${cur==='guardar'}">⏸ Pausar crecimiento (guardar)</button></span></div>`+infoBody('sobra',ST)+``;
}
// Envíos: una sola tarjeta para mandar una vez o cada paso. Todo con toques: recurso, destino y cantidad.
function routeListHTML(z){
  const routes=(z.routes||[]).slice(); ui.orders.filter(o=>o.t==='route'&&o.from===z.id).forEach(o=>{ const i=routes.findIndex(r=>r.to===o.to&&r.res===o.res); if(i>=0) routes.splice(i,1); if(o.q) routes.push({to:o.to,res:o.res,q:o.q,pend:1}); });
  if(!routes.length) return '';
  return `<h4>Envíos que se repiten</h4><div class="rts">`+routes.map(r=>{ const p=ownPath(G,ME,z.id,r.to,12); const fac=p?shipFactor(G,p):0; return `<div class="rtc"><span class="rti">${RI[r.res]}</span><div><b>➜ ${esc(zname(G.zones[r.to]))}</b><small>${r.q==='sobrante'?'todo el sobrante':r.q+' por paso'} · ${fm(fac)} 🪙 c/u${r.pend?' · empieza al presionar ¡Listo!':''}</small></div>${btnHTML('route','✕',`data-to="${r.to}" data-res="${r.res}" data-q="0" aria-label="Quitar"`)}</div>`; }).join('')+'</div>';
}
function sendCardHTML(z){
  const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id);
  if(!others.length) return '<div class="hint">Necesitas otra zona tuya para enviar recursos.</div>';
  const res=fv('sd_res','food')==='prod'?'prod':'food'; const mode=fv('sd_mode','once')==='each'?'each':'once';
  const dsel=others.some(a=>String(a.id)===String(fv('sd_to','')))?Number(fv('sd_to','')):others[0].id;
  const stock=Math.floor(z[res]); const to=G.zones[dsel];
  const path=ownPath(G,ME,z.id,dsel,12); const fac=path?shipFactor(G,path):0;
  let q=fv('sd_q',5); if(q!=='sobrante') q=Math.max(0,Math.min(Number(q)||0,mode==='once'?stock:99));
  let h=`<h4>Enviar</h4><div class="sendcard">`;
  h+=`<div class="sdtop"><div class="sdmode"><button data-act="sdset" data-k="sd_mode" data-v="once" aria-pressed="${mode==='once'}">Una vez</button><button data-act="sdset" data-k="sd_mode" data-v="each" aria-pressed="${mode==='each'}">🔁 Cada paso</button></div>`;
  h+=`<div class="sdres">${['food','prod'].map(r=>`<button data-act="sdset" data-k="sd_res" data-v="${r}" aria-pressed="${res===r}"><span>${RI[r]}</span><b>${Math.floor(z[r])}</b><small>${RN[r]}</small></button>`).join('')}</div></div>`;
  h+=`<div class="sddest">${others.map(a=>{ const pa=ownPath(G,ME,z.id,a.id,12); const f2=pa?shipFactor(G,pa):null; return `<button class="dtile" data-act="sdset" data-k="sd_to" data-v="${a.id}" aria-pressed="${a.id===dsel}" ${pa?'':'disabled'}><span class="nband" style="background:${TCOL[a.terrain]}"></span><b>${esc(zname(a))}</b><span class="dbars"><i style="--v:${Math.min(100,100*a.food/Math.max(1,capStore(G,a,'food')))}%;--c:#9DC764"></i><i style="--v:${Math.min(100,100*a.prod/Math.max(1,capStore(G,a,'prod')))}%;--c:#C9A878"></i></span><small>${pa?(f2?fm(f2)+' 🪙 c/u':'gratis'):'sin camino'}</small></button>`; }).join('')}</div>`;
  const quick=mode==='once'?[1,5,10,Math.floor(stock/2),stock].filter((v,i,a)=>v>0&&a.indexOf(v)===i):[1,2,5,10,'sobrante'];
  h+=`<div class="sdqrow"><div class="sdq"><button class="qs" data-act="sdq" data-d="-1" aria-label="Menos">－</button><span class="qn">${q==='sobrante'?'todo el sobrante':'<b>'+q+'</b> '+RI[res]}</span><button class="qs" data-act="sdq" data-d="1" aria-label="Más">＋</button></div>`;
  h+=`<div class="row sdchips">${quick.map(v=>`<button class="chip ${String(q)===String(v)?'on':''}" data-act="sdset" data-k="sd_q" data-v="${v}">${v==='sobrante'?'todo el sobrante':(mode==='once'&&v===stock&&stock>5?'todo':(mode==='once'&&v===Math.floor(stock/2)&&stock>5?'mitad':v))}</button>`).join('')}</div></div>`;
  const cst=q==='sobrante'?0:Math.ceil((Number(q)||0)*fac);
  h+='<div class="sdgo">'; h+=path?`<div class="cost ${cst>G.F[ME].gold?'bad':''}"><b>${q==='sobrante'||!cst?(q==='sobrante'?'🪙 según lo enviado':'Gratis'):rq('gold',cst)}</b><small>${esc(zname(z))} ➜ ${esc(zname(to))} · ${path.length} zona${path.length>1?'s':''}${path.some(i=>G.zones[i].b.some(b=>b.t==='camino'))?' (el Camino abarata)':''}${mode==='each'?' · se repite cada paso, después de alimentar y antes de crecer':''}</small></div>`:'<div class="warn">No hay camino de zonas tuyas hasta ahí.</div>';
  const can=path&&(q==='sobrante'||Number(q)>0);
  h+=`${btnHTML('sendgo',mode==='each'?'🔁 Cada paso':'Enviar',can?'':'disabled','primary')}</div></div>`;
  return h;
}
// Encabezado que se abre y se cierra (el panel recuerda cómo lo dejaste).
function fold(key,title,extra){
  const open=!!(ui.det&&ui.det[key]);
  return `<button class="fold ${open?'on':''}" data-act="fold" data-k="${key}" aria-expanded="${open}">${open?'▾':'▸'} ${esc(title)}${extra?` <small>${extra}</small>`:''}</button>`;
}
function subRecursos(z){
  if(!mine(z)) return '<div class="hint">Solo puedes enviar recursos desde tus propias zonas.</div>';
  let h='';
  h+=growModeHTML(z)+sendCardHTML(z)+routeListHTML(z);
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
  const us=z.units[f]||[], by={}; us.forEach(u=>{ by[u.t]=by[u.t]||{n:0,w:0,g:0}; by[u.t].n++; if(u.w>0) by[u.t].w++; if(u.gen) by[u.t].g++; });
  return Object.keys(by).map(t=>`<span class="uchip" title="${UN[t]}${by[t].g?' ('+by[t].g+' general'+(by[t].g>1?'es':'')+')':''}${by[t].w?' ('+by[t].w+' heridos)':''}">${uIcon(t,20)}<b>${by[t].n}</b>${by[t].g?'<small>★'+by[t].g+'</small>':''}${by[t].w?'<small>✚'+by[t].w+'</small>':''}</span>`).join('');
}
function zoneHead(z){
  const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':z.role==='frontera'?'Frontera':'Zona libre';
  const own=z.owner===null?'':z.owner===ME?'':`<span class="tag" style="background:${PLN[z.owner].col}">${PLN[z.owner].name}</span>`;
  const mineHere=(z.units[ME]||[]).length?`<span class="zpres">${presenceChips(z,ME)}</span>`:'';
  let h=`<div class="zhead"><div class="ztitle"><h3><span class="dot" style="background:${z.owner===null?'#B8A58C':PLN[z.owner].col}"></span>${esc(zname(z))}</h3>${mineHere}</div><span class="zbtns">${G.zones.filter(a=>a.owner===ME).length>1?'<button class="xbtn" data-act="zprev" title="Zona tuya anterior" aria-label="Zona tuya anterior">◀</button><button class="xbtn" data-act="znext" title="Zona tuya siguiente" aria-label="Zona tuya siguiente">▶</button>':''}<button class="xbtn" data-act="desel" title="Cerrar la zona (Esc)" aria-label="Cerrar la zona">✕</button></span></div>`;
  h+=`<div class="zsub2"><span title="${esc(TERRFX[z.terrain])}">${rn} · ${TERRN[z.terrain]}</span> ${own}`;
  if(zoneDeps(z).length) h+=` <span class="zres">${depBadges(z)}</span>`;
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
  let h=zoneHead(z)+'<div class="subtabs" role="tablist">'+subs.map(([k,l])=>`<button data-act="zsub" data-s="${k}" aria-selected="${k===cur}" role="tab">${l}${ui.alerts&&ui.alerts.subs[z.id+'|'+k]?'<i class="al">!</i>':''}</button>`).join('')+'</div>';
  const fn={resumen:subResumen,poblacion:subPoblacion,edificios:subEdificios,militar:subMilitar,recursos:subRecursos,mover:subMover}[cur];
  return h+fn(z);
}
