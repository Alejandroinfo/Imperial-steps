'use strict';
// Panel de tecnologías: lo que desarrollas, lo que más te ayuda y las ramas (ver el rediseño al final del archivo).

function spineTrack(br){
  const sp=TECHS.filter(t=>t.r===br&&t.v).sort((a,b)=>a.l-b.l||a.n.localeCompare(b.n)); const F=G.F[ME];
  const own=sp.filter(t=>F.techs[t.n]).length;
  return `<div class="hint">Columna vertebral de ${esc(br)}: ${own}/${sp.length}${own===sp.length?' · ¡completa!':''}</div><div class="track">`+sp.map(t=>{ const o=!!F.techs[t.n]; const c=!o&&canResearch(G,ME,t.n); return `<div class="tn ${o?'own':c?'can':''} ${ui.justTech===t.n?'just':''}" title="${esc(t.n)}"><i>N${t.l}</i><span>${esc(t.n)}</span></div>`; }).join('')+'</div>';
}
function researchBox(){
  const F=G.F[ME]; const plan=Object.values(researchPlan(G,ME)); const sci=plan.reduce((a,p)=>a+p.sci,0), asg=plan.reduce((a,p)=>a+p.n,0);
  const pend=ui.orders.filter(o=>o.t==='research'); const qn=F.rq.length+pend.length;
  let h=`<div class="box"><div class="tsum"><span title="ciencia guardada">🔬 <b>${Math.floor(F.tech)}</b></span><span title="científicos">${uIcon('cie',20)} <b>${sci}</b>${F.rq.length?` <small>(${asg} investigan)</small>`:''}</span><span title="cola de investigación (máximo 4)">📜 <b>${qn}/4</b></span></div>`;
  // la cola completa: la primera es la que se está desarrollando
  F.rq.forEach((p,i)=>{ const pc=Math.round(100*(p.tot-p.left)/p.tot); h+=`<div class="qrow"><div class="qn"><b>${i===0?'▶ ':''}${esc(p.name)}</b><span>${p.tot-p.left}/${p.tot}</span></div><div class="bar"><i style="width:${pc}%"></i></div><button class="xbtn" data-act="cancelres" data-name="${esc(p.name)}" aria-label="Cancelar ${esc(p.name)}" title="Cancelar">✕</button></div>`; });
  ui.orders.forEach((o,k)=>{ if(o.t==='research') h+=`<div class="qrow q"><div class="qn"><b>${esc(o.name)}</b><span class="hint">empieza al presionar ¡Listo!</span></div><button class="xbtn" data-act="del" data-i="${k}" aria-label="Quitar" title="Quitar">✕</button></div>`; });
  if(sci===0) h+='<div class="warn">Sin científicos no se investiga: especializa pobladores como científicos (pestaña Población de una zona).</div>';
  else if(F.rq.length&&asg===0) h+='<div class="warn">No hay ciencia guardada suficiente: este paso tus científicos generan ciencia en vez de investigar.</div>';
  else if(!qn) h+='<div class="hint">Pon una tecnología en cola y tus científicos la desarrollan solos.</div>';
  return h+'</div>';
}
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
  if(r.unlock) parts.push(`<span class="uchip" title="permite reclutar ${UNP[r.unlock].toLowerCase()}">🔓${uIcon(r.unlock,18)}</span>`);
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
  if(r.unlock) parts.push(`Permite reclutar <b>${UNP[r.unlock].toLowerCase()}</b>${r.barracks?'':' (necesitas un Cuartel)'}`);
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
// ---- Rediseño (28/10/2026): arriba lo que desarrollas y lo que más te ayuda; abajo las ramas como grupos; al tocar una rama, qué puedes investigar en ella.
const TGROUPS=[['Civil','Gente y economía'],['Construcción','Edificios y obras'],['Militar','Guerra y defensa']];
function branchType(b){ const c={}; TECHS.filter(t=>t.r===b).forEach(t=>{ c[t.t]=(c[t.t]||0)+1; }); return Object.keys(c).sort((x,y)=>c[y]-c[x])[0]; }
function branchStats(b){ const all=TECHS.filter(t=>t.r===b); return {all,own:all.filter(t=>G.F[ME].techs[t.n]),avail:all.filter(t=>techStatus(t)==='avail'),sp:all.filter(t=>t.v).sort((x,y)=>x.l-y.l||x.n.localeCompare(y.n))}; }
// Tarjeta de una rama: nombre, cuánto llevas, los 5 niveles de su columna vertebral y cuántas puedes investigar ya.
function branchCardHTML(b){
  const S=branchStats(b), F=G.F[ME], pct=Math.round(100*S.own.length/S.all.length);
  const dots=[1,2,3,4,5].map(l=>{ const lv=S.sp.filter(t=>t.l===l); const done=lv.length>0&&lv.every(t=>F.techs[t.n]); const can=lv.some(t=>['avail','doing','queued'].includes(techStatus(t))); return `<i class="${done?'on':can?'can':''}"></i>`; }).join('');
  return `<button class="bcard ${S.avail.length?'has':''}" style="--bc:${bCol(b)}" data-act="tbranch" data-b="${esc(b)}"><span class="bch"><span class="bci">${bIco(b)}</span><b>${esc(b)}</b></span><span class="bcbar"><i style="width:${pct}%"></i></span><span class="bcm"><span>${S.own.length} de ${S.all.length}</span><span class="spd" title="Columna vertebral: niveles 1 a 5 (lleno = ya lo tienes, con borde = puedes avanzar)">${dots}</span></span>${S.avail.length?`<span class="bcn">${S.avail.length} para investigar</span>`:'<span class="bcn off">nada por ahora</span>'}</button>`;
}
// Una tecnología dentro de su rama: estado, qué hace y, si está bloqueada, qué falta.
function techLine(t){
  const F=G.F[ME], st=techStatus(t), cost=techCost(G,ME,t.n); const block=st==='lock'?researchBlock(G,ME,t.n):null;
  const full=F.rq.length+ui.orders.filter(o=>o.t==='research').length>=4;
  const ico={own:'<span class="tls own">✓</span>',doing:'<span class="tls doing">⏳</span>',queued:'<span class="tls doing">⏳</span>',avail:'<span class="tls can">▶</span>',lock:'<span class="tls">🔒</span>'}[st];
  let act='';
  if(st==='avail') act=full?'<small class="hint">Cola llena</small>':btnHTML('research','Investigar',`data-name="${esc(t.n)}"`,'primary');
  else if(st==='queued') act='<span class="tag" style="background:#3B7DDD">En cola</span>'; else if(st==='doing') act='<span class="tag" style="background:#3B7DDD">Investigando</span>'; else if(st==='own') act='<span class="tag" style="background:#2F7F4F">Tuya</span>';
  return `<div class="tl ${st} ${ui.justTech===t.n?'just':''}" style="--bc:${bCol(t.r)}">${ico}<div class="tlm"><div class="tlt">${t.v?'<span class="tstar" title="columna vertebral de la rama">★</span> ':''}<b>${esc(t.n)}</b> <small>${rq('tech',cost)}</small></div><div class="tle">${esc(t.ef)}</div>${st==='avail'?`<div class="tli">${impactChips(t)}</div>`:''}${block?`<div class="tlb">🔒 ${esc(block)}</div>`:''}</div><div class="tla">${act}</div></div>`;
}
function branchView(b){
  const S=branchStats(b), tf=ui.tf, only=tf.only!==false;
  let h=`<div class="brhead" style="--bc:${bCol(b)}"><button class="btn sm" data-act="tbranch" data-b="">← Ramas</button><div class="brt"><b>${bIco(b)} ${esc(b)}</b><small>${S.own.length} de ${S.all.length} tuyas · ${S.avail.length} para investigar ahora</small></div></div>`;
  h+=spineTrack(b);
  h+=`<div class="tfil"><button data-act="tonly" data-v="1" aria-pressed="${only}">Puedo investigar</button><button data-act="tonly" data-v="0" aria-pressed="${!only}">Ver todas</button></div>`;
  let shown=0;
  for(let l=1;l<=5;l++){
    let list=S.all.filter(t=>t.l===l).sort((x,y)=>y.v-x.v||x.n.localeCompare(y.n));
    if(only) list=list.filter(t=>['avail','doing','queued'].includes(techStatus(t)));
    if(!list.length) continue; shown+=list.length;
    h+=`<div class="lvh">Nivel ${l} <small>${20*l} de ciencia</small></div>`+list.map(techLine).join('');
  }
  if(!shown) h+=`<div class="hint">Ahora no puedes investigar nada en esta rama${S.own.length===S.all.length?': ¡ya la completaste!':'. Toca «Ver todas» para saber qué te falta en cada una (casi siempre, más tecnologías del nivel anterior o su requisito directo).'}</div>`;
  else if(only&&S.own.length) h+=`<div class="hint">Ya tienes ${S.own.length} de esta rama. «Ver todas» las muestra.</div>`;
  return h;
}
function panelTech(){
  const F=G.F[ME], tf=ui.tf;
  if(tf.view!=='own') tf.view='ramas';
  const own=TECHS.filter(t=>F.techs[t.n]);
  let h=researchBox()+`<div class="subtabs" role="tablist"><button data-act="tview" data-v="ramas" aria-selected="${tf.view==='ramas'}" role="tab">Ramas</button><button data-act="tview" data-v="own" aria-selected="${tf.view==='own'}" role="tab">Mías (${own.length})</button><button data-act="openmap" role="tab" title="El mapa completo de tecnologías">Mapa</button><a href="#" data-wiki="ramas" class="wlink" title="¿Cómo funcionan las ramas?">ⓘ</a></div>`;
  if(tf.view==='own'){
    return h+(own.length?BRANCHES.map(b=>{ const l=own.filter(t=>t.r===b); return l.length?`<div class="brh" style="--bc:${bCol(b)}"><span>${bIco(b)}</span>${esc(b)}</div><div class="owng">`+l.map(t=>`<span title="${esc(t.ef)}">${t.v?'★ ':''}${esc(t.n)}</span>`).join('')+'</div>':''; }).join(''):'<div class="hint">Todavía no tienes tecnologías propias (los 9 edificios básicos ya vienen desarrollados).</div>');
  }
  if(tf.branch&&BRANCHES.includes(tf.branch)) return h+branchView(tf.branch);
  // las que más te ayudan ahora
  const avail=TECHS.filter(t=>techStatus(t)==='avail');
  const rec=avail.map(t=>[t,impactScore(t)]).filter(x=>x[1]>0.5).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
  if(rec.length) h+=`<div class="trecs"><div class="trecsh">⭐ Te ayudan ahora</div>${rec.map(t=>techRow(t,'rec')).join('')}</div>`;
  else if(!avail.length) h+='<div class="hint">Ahora no hay tecnologías disponibles: completa las que tienes en curso o desarrolla más del nivel anterior.</div>';
  // las ramas, en tres grupos
  h+=`<div class="hint" style="margin-top:6px">Elige una rama para ver qué puedes investigar en ella (${avail.length} en total ahora). Para el nivel 2 en adelante necesitas ${MINC[2]}/${MINC[3]}/${MINC[4]}/${MINC[5]} tecnologías del nivel anterior; la columna vertebral (★) abre el nivel 5.</div>`;
  TGROUPS.forEach(([k,t])=>{ const bs=BRANCHES.filter(b=>branchType(b)===k); if(!bs.length) return; h+=`<div class="tgh">${t}</div><div class="bgrid">${bs.map(branchCardHTML).join('')}</div>`; });
  return h;
}
