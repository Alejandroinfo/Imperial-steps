'use strict';
// Panel de tecnologías: Disponibles, En curso, Mías y Todas.

function spineTrack(br){
  const sp=TECHS.filter(t=>t.r===br&&t.v).sort((a,b)=>a.l-b.l||a.n.localeCompare(b.n)); const F=G.F[ME];
  const own=sp.filter(t=>F.techs[t.n]).length;
  return `<div class="hint">Columna vertebral de ${esc(br)}: ${own}/${sp.length}${own===sp.length?' · ¡completa!':''}</div><div class="track">`+sp.map(t=>{ const o=!!F.techs[t.n]; const c=!o&&canResearch(G,ME,t.n); return `<div class="tn ${o?'own':c?'can':''} ${ui.justTech===t.n?'just':''}" title="${esc(t.n)}"><i>N${t.l}</i><span>${esc(t.n)}</span></div>`; }).join('')+'</div>';
}
function techCard(t){
  const F=G.F[ME]; const own=!!F.techs[t.n]; const block=researchBlock(G,ME,t.n); const cost=techCost(G,ME,t.n);
  const inq=F.rq.find(p=>p.name===t.n); const queued=ui.orders.some(o=>o.t==='research'&&o.name===t.n);
  let st=own?'<span class="tag" style="background:#2F7F4F">Tuya</span>':inq?'<span class="tag" style="background:#3B7DDD">Investigando</span>':queued?'<span class="tag" style="background:#3B7DDD">En cola</span>':block?'<span class="tag" style="background:#6B5B50">Bloqueada</span>':'<span class="tag" style="background:#C8452F">Disponible</span>';
  let h=`<div class="tech ${own?'own':''} ${ui.justTech===t.n?'just':''}"><div class="th"><b>${esc(t.n)}</b> <span class="lv">N${t.l}</span> ${t.v?'<span class="tag" style="background:#4A7A3A">Vertebral</span>':'<span class="tag" style="background:#8A7A5A">Opcional</span>'} ${st}</div>`;
  h+=`<div class="te">${esc(t.ef)}</div>`;
  if(!t.impl) h+='<div class="warn" style="font-size:12px">Efecto aún no simulado en este prototipo.</div>';
  h+=`<div class="hint">Costo ${cost} · ${t.t} · ${esc(t.sr)}${t.pre.length?' · Requiere: '+t.pre.map(esc).join(', '):''}</div>`;
  if(inq) h+=`<div class="proj">${inq.tot-inq.left}/${inq.tot}<div class="bar"><i style="width:${Math.round(100*(inq.tot-inq.left)/inq.tot)}%"></i></div></div>`;
  if(!own&&!inq&&!queued){
    if(block) h+=`<div class="hint">🔒 ${esc(block)}</div>`;
    else if(F.rq.length+ui.orders.filter(o=>o.t==='research').length>=4) h+='<div class="warn">La cola de investigación está llena (máximo 4).</div>';
    else h+=`<div class="row">${btnHTML('research','Investigar ('+cost+')',`data-name="${esc(t.n)}"`,'primary')}</div>`;
  }
  h+=`<details data-d="op_${esc(t.n)}" ${ui.det&&ui.det['op_'+t.n]?'open':''}><summary>Mi opinión: ${'★'.repeat(t.val)}${'☆'.repeat(5-t.val)} · riesgo ${t.rk}</summary><div class="hint">${esc(t.c)}</div></details></div>`;
  return h;
}
function researchBox(){
  const F=G.F[ME]; const zs=zonesOf(G,ME); const sci=zs.reduce((a,z)=>a+(z.units[ME]||[]).filter(u=>u.t==='cie'&&u.w===0).length,0); const asg=zs.reduce((a,z)=>a+Math.min(z.resN||0,(z.units[ME]||[]).filter(u=>u.t==='cie'&&u.w===0).length),0);
  const qn=F.rq.length+ui.orders.filter(o=>o.t==='research').length;
  let h=`<div class="box"><div class="tsum"><span>🔬 Ciencia <b>${Math.floor(F.tech)}</b></span><span>Científicos <b>${asg}/${sci}</b> investigando</span><span>Avance <b>${F.rcap}</b> por paso</span><span>Cola <b>${qn}/4</b></span></div>`;
  if(F.rq.length){ const p=F.rq[0]; h+=`<div class="proj"><b>${esc(p.name)}</b>: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div></div>`; }
  if(sci===0) h+='<div class="warn">Sin científicos no se investiga: especializa pobladores como científicos (pestaña Población de una zona).</div>';
  else if(asg===0) h+='<div class="warn">Tienes científicos, pero ninguno investiga. Asígnalos en la pestaña Población de la zona.</div>';
  return h+'</div>';
}
function techRow(t,mode){
  const F=G.F[ME]; const cost=techCost(G,ME,t.n); const full=F.rq.length+ui.orders.filter(o=>o.t==='research').length>=4;
  const queued=ui.orders.some(o=>o.t==='research'&&o.name===t.n);
  let btn='';
  if(mode==='avail') btn=queued?'<span class="tag" style="background:#3B7DDD">En cola</span>':full?'<span class="hint">Cola llena</span>':btnHTML('research','Investigar',`data-name="${esc(t.n)}"`,'primary');
  return `<div class="trow ${ui.justTech===t.n?'just':''}"><div class="tn2">${t.v?'★ ':''}${esc(t.n)} <small>N${t.l} · ${cost}</small>${t.impl?'':' <small class="warn">· aún sin efecto</small>'}</div><div>${btn}</div><div class="tef">${esc(t.ef)}</div></div>`;
}
function byBranch(list,fn){
  let h=''; BRANCHES.forEach(b=>{ const l=list.filter(t=>t.r===b); if(l.length) h+=`<div class="brh">${esc(b)}</div>`+l.map(fn).join(''); }); return h;
}
const TKIND=[['all','Todas'],['Civil','Civiles'],['Construcción','Edificios'],['Militar','Militares']];
function panelTech(){
  const F=G.F[ME], tf=ui.tf;
  if(!tf.view) tf.view='avail'; if(!tf.kind) tf.kind='all';
  const avail=TECHS.filter(t=>!F.techs[t.n]&&canResearch(G,ME,t.n)&&!F.rq.some(p=>p.name===t.n));
  const doing=F.rq.length+ui.orders.filter(o=>o.t==='research').length;
  const own=TECHS.filter(t=>F.techs[t.n]);
  const subs=[['avail','Disponibles ('+avail.length+')'],['doing','En curso ('+doing+')'],['own','Mías ('+own.length+')'],['all','Todas']];
  let h=researchBox()+'<div class="subtabs" role="tablist">'+subs.map(([k,l])=>`<button data-act="tview" data-v="${k}" aria-selected="${tf.view===k}" role="tab">${l}</button>`).join('')+'</div>';
  if(tf.view==='avail'){
    const kinds=TKIND.filter(([k])=>k==='all'||avail.some(t=>t.t===k));
    const kind=kinds.some(([k])=>k===tf.kind)?tf.kind:'all';
    const list=avail.filter(t=>kind==='all'||t.t===kind).sort((a,b)=>b.v-a.v||a.l-b.l||a.n.localeCompare(b.n));
    if(kinds.length>2) h+='<div class="tfil">'+kinds.map(([k,l])=>`<button data-act="tkind" data-v="${k}" aria-pressed="${kind===k}">${l}</button>`).join('')+'</div>';
    h+=list.length?byBranch(list,t=>techRow(t,'avail')):'<div class="hint">Ahora no hay tecnologías disponibles: completa las que tienes en curso o desarrolla más del nivel anterior.</div>';
    h+='<div class="hint" style="margin-top:8px">★ = columna vertebral de la rama (hay que acabarla para llegar al nivel 5). Solo se muestran las que puedes empezar ahora.</div>';
  } else if(tf.view==='doing'){
    if(!doing) h+='<div class="hint">No estás investigando nada. Elige una en «Disponibles».</div>';
    F.rq.forEach((p,i)=>{ h+=`<div class="proj"><b>${i===0?'▶ ':''}${esc(p.name)}</b>: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div><button class="btn" data-act="cancelres" data-name="${esc(p.name)}">Cancelar</button></div>`; });
    ui.orders.forEach((o,i)=>{ if(o.t==='research') h+=`<div class="proj"><b>${esc(o.name)}</b> <span class="hint">empieza al presionar ¡Listo!</span> <button class="btn" data-act="del" data-i="${i}">Quitar</button></div>`; });
    h+='<div class="hint" style="margin-top:8px">Se investiga de arriba abajo. Cada científico asignado aporta 2 por paso a la primera de la cola.</div>';
  } else if(tf.view==='own'){
    h+=own.length?BRANCHES.map(b=>{ const l=own.filter(t=>t.r===b); return l.length?`<div class="brh">${esc(b)}</div><div class="owng">`+l.map(t=>`<span title="${esc(t.ef)}">${t.v?'★ ':''}${esc(t.n)}</span>`).join('')+'</div>':''; }).join(''):'<div class="hint">Todavía no tienes tecnologías propias (los 9 edificios básicos vienen de serie).</div>';
  } else {
    h+=`<div class="row">${btnHTML('openmap','🗺 Mapa de tecnologías','','primary')}<a href="#" data-wiki="ramas" class="wlink">¿Cómo funcionan?</a></div>`+panoramaHTML();
    const opts=[['Todas','Todas las ramas']].concat(BRANCHES.map(b=>{ const sp=TECHS.filter(t=>t.r===b&&t.v); const ow=sp.filter(t=>F.techs[t.n]).length; return [b,`${b} (${ow}/${sp.length} vertebrales)`]; }));
    h+=`<div class="row">${selHTML('tf_br',opts,tf.br)}</div>${tf.br!=='Todas'?spineTrack(tf.br):''}<div class="row"><label><input type="checkbox" data-f="tf_spine" ${tf.spine?'checked':''}> Solo vertebrales</label> <label><input type="checkbox" data-f="tf_impl" ${tf.impl?'checked':''}> Solo con efecto</label></div>`;
    let list=TECHS.filter(t=>(tf.br==='Todas'||t.r===tf.br)&&(!tf.spine||t.v)&&(!tf.impl||t.impl));
    list.sort((a,b)=>BRANCHES.indexOf(a.r)-BRANCHES.indexOf(b.r)||b.v-a.v||a.l-b.l||a.n.localeCompare(b.n));
    const cap=40; h+=`<div class="hint">${list.length} tecnologías${list.length>cap?' (se muestran '+cap+'; elige una rama)':''}. Para el nivel 2 en adelante necesitas ${MINC[2]}/${MINC[3]}/${MINC[4]}/${MINC[5]} del nivel anterior.</div>`;
    h+=list.slice(0,cap).map(techCard).join('');
  }
  return h;
}
