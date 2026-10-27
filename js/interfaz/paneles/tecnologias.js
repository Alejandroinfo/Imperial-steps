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
  h+=`<div class="te">${esc(t.ef)}</div>${impactHTML(t)}`;
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
  const F=G.F[ME]; const plan=Object.values(researchPlan(G,ME)); const sci=plan.reduce((a,p)=>a+p.sci,0), asg=plan.reduce((a,p)=>a+p.n,0);
  const qn=F.rq.length+ui.orders.filter(o=>o.t==='research').length;
  let h=`<div class="box"><div class="tsum"><span title="ciencia guardada">🔬 <b>${Math.floor(F.tech)}</b></span><span title="científicos">${uIcon('cie',20)} <b>${sci}</b>${F.rq.length?` <small>(${asg} investigan)</small>`:''}</span><span title="cola de investigación">📜 <b>${qn}/4</b></span></div>`;
  if(F.rq.length){ const p=F.rq[0]; h+=`<div class="proj"><b>${esc(p.name)}</b>: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div></div>`; }
  if(sci===0) h+='<div class="warn">Sin científicos no se investiga: especializa pobladores como científicos (pestaña Población de una zona).</div>';
  else if(F.rq.length&&asg===0) h+='<div class="warn">No hay ciencia guardada suficiente: este paso tus científicos generan ciencia en vez de investigar.</div>';
  else if(!qn) h+='<div class="hint">Pon una tecnología en cola y tus científicos la desarrollan solos.</div>';
  return h+'</div>';
}
// Línea con el impacto que tendría la tecnología hoy (se calcula una vez por paso y por tecnología).
const IMP_ICON=RI;
const FEM_BT=new Set(['fort','biblio','mar']);
const elBT=(bt,cap)=>(FEM_BT.has(bt)?(cap?'La ':'la '):(cap?'El ':'el '))+BT[bt].n;
const tuBT=bt=>(FEM_BT.has(bt)?'tu ':'tu ')+BT[bt].n;
function impactOf(name){
  const key=G.step+'|'+G.zones.map(z=>z.owner===ME?(z.units[ME]||[]).length+':'+z.b.length:'').join(',');
  if(!ui.impact||ui.impact.key!==key) ui.impact={key,map:{}};
  if(!(name in ui.impact.map)) ui.impact.map[name]=techImpact(G,ME,name);
  return ui.impact.map[name];
}
function impactScore(t){
  const r=impactOf(t.n); if(!r) return 0; const o=r.out;
  let s=((o.food||0)+(o.prod||0)+(o.gold||0)+(o.tech||0))*20/(20*t.l);
  if(r.ups.length) s*=0.7;   // hay que pagar la mejora del edificio
  if(r.growth&&r.growth.eta0&&r.growth.eta1&&r.growth.eta1<r.growth.eta0) s+=1.5*(r.growth.eta0-r.growth.eta1);
  if(r.units.length) s+=r.units.reduce((a,u)=>a+u.n,0)*0.4;
  if(r.unlock&&r.barracks) s+=1.2;
  if(o.store) s+=Math.min(1.5,o.store/40);
  return s;
}
// Impacto en una línea corta de íconos (para las filas)
function impactChips(t){
  if(G.F[ME].techs[t.n]) return ''; const r=impactOf(t.n); if(!r) return '';
  const parts=['food','prod','gold','tech'].filter(k=>r.out[k]).map(k=>rq(k,r.out[k],true));
  if(r.out.store) parts.push(`<span class="rq" title="almacenamiento">🏺 +${r.out.store}</span>`);
  if(r.growth&&r.growth.eta1&&r.growth.eta0&&r.growth.eta1<r.growth.eta0) parts.push(`<span class="rq" title="próximo poblador">👶 ${r.growth.eta0}→${r.growth.eta1}</span>`);
  if(r.units.length) parts.push(r.units.map(u=>`<span class="uchip" title="mejora a tus ${UNP[u.t].toLowerCase()}">${uIcon(u.t,18)}<b>↑${u.n}</b></span>`).join(''));
  if(r.unlock) parts.push(`<span class="uchip" title="permite entrenar ${UNP[r.unlock].toLowerCase()}">🔓${uIcon(r.unlock,18)}</span>`);
  if(r.bunlock) parts.push(`<span class="rq" title="permite construir">🔓 ${BT[r.bunlock].n}</span>`);
  return parts.length?`<span class="ichips">${r.ups.length?'<small title="al mejorar tu edificio">⬆</small>':''}${parts.join('')}</span>`:'';
}
function impactHTML(t){
  if(G.F[ME].techs[t.n]) return '';
  const r=impactOf(t.n); if(!r) return '';
  const parts=[];
  const outTxt=o=>['food','prod','gold','tech'].filter(k=>o[k]).map(k=>`${IMP_ICON[k]} ${o[k]>0?'+':''}${o[k]}`).join(' · ');
  const prodTxt=outTxt(r.out);
  if(prodTxt) parts.push(r.ups.length?`Al mejorar tu${r.ups.length>1?'s':''} ${[...new Set(r.ups.map(u=>BT[u.bt].n))].join(' y ')} (${r.ups.reduce((a,u)=>a+u.cost,0)} ⚒): <b>${prodTxt}</b> por paso`:`Hoy te daría: <b>${prodTxt}</b> por paso`);
  if(r.out.store) parts.push(`${r.ups.length&&!prodTxt?'Al mejorar tu almacén: ':''}<b>+${r.out.store}</b> de almacenamiento`);
  if(r.growth){ const z=G.zones[r.growth.zone]; parts.push(r.growth.eta0&&r.growth.eta1&&r.growth.eta1!==r.growth.eta0?`Próximo poblador en ${esc(zname(z))}: <b>en ${r.growth.eta1} paso${r.growth.eta1>1?'s':''}</b> en vez de ${r.growth.eta0}`:`Crecer en ${esc(zname(z))} cuesta <b>${r.growth.cost1}</b> en vez de ${r.growth.cost0}`); }
  if(r.units.length) parts.push('Mejora a tus '+r.units.map(u=>`<b>${u.n} ${(u.n>1?UNP[u.t]:UN[u.t]).toLowerCase()}</b>`).join(' y '));
  if(r.unlock) parts.push(`Permite entrenar <b>${UNP[r.unlock].toLowerCase()}</b>${r.barracks?'':' (necesitas un Cuartel)'}`);
  if(r.bunlock&&r.bunlock!=='mar') parts.push(`Permite construir <b>${BT[r.bunlock].n}</b>`); else if(r.bunlock==='mar') parts.push('Permite construir <b>Maravillas</b>');
  if(!parts.length){
    if(!t.impl) return '';
    let why='Hoy no cambia tu producción: se notará más adelante o en combate.';
    const none=r.who.filter(w=>!w.n);
    if(r.spec) why=r.spec.have?`Especialización para ${tuBT(r.spec.bt)}: elígela en el edificio cuando la tengas.`:`Especialización para ${elBT(r.spec.bt)}: hoy no tienes ${FEM_BT.has(r.spec.bt)?'ninguna':'ninguno'}.`;
    else if(r.bld&&!r.bld.have) why=`Mejora ${elBT(r.bld.bt)}: hoy no tienes ${FEM_BT.has(r.bld.bt)?'ninguna':'ninguno'}.`;
    else if(none.length&&none.length===r.who.length) why=`Beneficia a los ${none.map(w=>UNP[w.t].toLowerCase()).join(' y ')}: hoy no tienes ninguno.`;
    return `<div class="timp none">${why}</div>`;
  }
  return `<div class="timp">💡 ${parts.join(' · ')}</div>`;
}
function techRow(t,mode){
  const F=G.F[ME]; const cost=techCost(G,ME,t.n); const full=F.rq.length+ui.orders.filter(o=>o.t==='research').length>=4;
  const queued=ui.orders.some(o=>o.t==='research'&&o.name===t.n);
  let btn='';
  if(mode==='avail'||mode==='rec') btn=queued?'<span class="tag" style="background:#3B7DDD">En cola</span>':full?'<span class="hint">Cola llena</span>':btnHTML('research','Investigar',`data-name="${esc(t.n)}"`,'primary');
  if(mode==='rec') return `<div class="trec" style="--bc:${bCol(t.r)}"><div class="trh"><span class="tbico" title="${esc(t.r)}">${bIco(t.r)}</span><b>${esc(t.n)}</b><small>N${t.l} · ${rq('tech',cost)}</small>${btn}</div>${impactHTML(t)}</div>`;
  return `<div class="trow ${ui.justTech===t.n?'just':''}" style="--bc:${bCol(t.r)}" title="${esc(t.ef)}"><div class="tn2">${t.v?'<span class="tstar" title="columna vertebral">★</span>':''}${esc(t.n)} <small>N${t.l} · ${rq('tech',cost)}</small>${t.impl?'':' <small class="warn" title="aún sin efecto en el prototipo">⚠</small>'}</div><div>${btn}</div><div class="tef">${impactChips(t)||'<small class="hint">'+esc(t.ef)+'</small>'}</div></div>`;
}
function byBranch(list,fn){
  let h=''; BRANCHES.forEach(b=>{ const l=list.filter(t=>t.r===b); if(l.length) h+=`<div class="brh" style="--bc:${bCol(b)}"><span>${bIco(b)}</span>${esc(b)}</div>`+l.map(fn).join(''); }); return h;
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
    // las que más te ayudan ahora, arriba
    const rec=list.map(t=>[t,impactScore(t)]).filter(x=>x[1]>0.5).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
    if(rec.length) h+=`<div class="trecs"><div class="trecsh">⭐ Te ayudan ahora</div>${rec.map(t=>techRow(t,'rec')).join('')}</div>`;
    const rest=list.filter(t=>!rec.includes(t));
    h+=rest.length?byBranch(rest,t=>techRow(t,'avail')):(rec.length?'':'<div class="hint">Ahora no hay tecnologías disponibles: completa las que tienes en curso o desarrolla más del nivel anterior.</div>');
    h+='<div class="hint" style="margin-top:8px">★ columna vertebral de la rama · pasa el mouse por una tecnología para ver qué hace.</div>';
  } else if(tf.view==='doing'){
    if(!doing) h+='<div class="hint">No estás investigando nada. Elige una en «Disponibles».</div>';
    F.rq.forEach((p,i)=>{ h+=`<div class="proj"><b>${i===0?'▶ ':''}${esc(p.name)}</b>: ${p.tot-p.left}/${p.tot}<div class="bar"><i style="width:${Math.round(100*(p.tot-p.left)/p.tot)}%"></i></div><button class="btn" data-act="cancelres" data-name="${esc(p.name)}">Cancelar</button></div>`; });
    ui.orders.forEach((o,i)=>{ if(o.t==='research') h+=`<div class="proj"><b>${esc(o.name)}</b> <span class="hint">empieza al presionar ¡Listo!</span> <button class="btn" data-act="del" data-i="${i}">Quitar</button></div>`; });
    h+='<div class="hint" style="margin-top:8px">Se investiga de arriba abajo. Cada científico usa 2 de ciencia por paso; si no alcanza la guardada, los que sobran generan ciencia.</div>';
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
