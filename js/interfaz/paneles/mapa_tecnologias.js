'use strict';
// Panorama de ramas y mapa visual de tecnologías.

function techStatus(t){
  const F=G.F[ME]; if(F.techs[t.n]) return 'own'; if(F.rq.some(p=>p.name===t.n)) return 'doing';
  if(ui.orders.some(o=>o.t==='research'&&o.name===t.n)) return 'queued'; return canResearch(G,ME,t.n)?'avail':'lock';
}
function panoramaHTML(){
  let h='<div class="pano">';
  BRANCHES.forEach(b=>{
    const sp=TECHS.filter(t=>t.r===b&&t.v).sort((a,c)=>a.l-c.l||a.n.localeCompare(c.n)); const own=sp.filter(t=>G.F[ME].techs[t.n]).length;
    const typ=sp[0].t, tc=typ==='Civil'?'#6FA83A':typ==='Construcción'?'#C97A3A':'#C8452F';
    h+=`<button class="prow ${ui.tf.br===b?'on':''}" data-act="tfbranch" data-b="${esc(b)}"><span class="ptag" style="background:${tc}"></span><span class="pnm">${esc(b)}</span><span class="pdots">${sp.map(t=>`<i class="pd ${techStatus(t)}" title="${esc(t.n)} (N${t.l})"></i>`).join('')}</span><span class="pct">${own}/${sp.length}</span></button>`;
  });
  return h+'</div><div class="legend"><i class="pd own"></i> tuya <i class="pd doing"></i> investigando <i class="pd avail"></i> disponible <i class="pd lock"></i> bloqueada</div>';
}
function techMapHTML(){
  const F=G.F[ME]; const sel=ui.tmSel?TECH[ui.tmSel]:null;
  const preSet=new Set(sel?sel.pre:[]); const depSet=new Set(sel?TECHS.filter(t=>t.pre.includes(sel.n)).map(t=>t.n):[]);
  let h='<table class="tmtable"><colgroup><col style="width:150px">'+'<col>'.repeat(5)+'</colgroup><thead><tr><th></th>'+[1,2,3,4,5].map(l=>`<th>Nivel ${l}<small>${20*l} puntos</small></th>`).join('')+'</tr></thead><tbody>';
  BRANCHES.forEach(b=>{
    const all=TECHS.filter(t=>t.r===b); const sp=all.filter(t=>t.v); const own=sp.filter(t=>F.techs[t.n]).length; const typ=sp[0].t;
    h+=`<tr><th class="tml"><b>${esc(b)}</b><small>${typ} · columna ${own}/${sp.length}</small></th>`;
    for(let l=1;l<=5;l++){
      const cell=all.filter(t=>t.l===l).sort((a,c)=>c.v-a.v||a.n.localeCompare(c.n));
      h+='<td class="tmc">'+cell.map(t=>`<button class="tchip ${techStatus(t)} ${t.v?'sp':''} ${sel&&sel.n===t.n?'sel':''} ${preSet.has(t.n)?'pre':''} ${depSet.has(t.n)?'dep':''}" data-act="tmsel" data-name="${esc(t.n)}" title="${esc(t.n)}${t.v?' (vertebral)':''}">${t.v?'<b>★</b> ':''}${esc(t.n)}</button>`).join('')+'</td>';
    }
    h+='</tr>';
  });
  return h+'</tbody></table>';
}
function techDetailHTML(){
  if(!ui.tmSel) return '<p class="hint">Toca una tecnología del mapa para ver su detalle. Se resaltan en amarillo lo que necesita y en azul lo que desbloquea.</p>';
  const t=TECH[ui.tmSel]; const pre=t.pre, dep=TECHS.filter(x=>x.pre.includes(t.n));
  return techCard(t)+`<h4>Necesita</h4>${pre.length?pre.map(n=>`<button class="tchip ${techStatus(TECH[n])}" data-act="tmsel" data-name="${esc(n)}">${esc(n)}</button>`).join(' '):'<div class="hint">Nada: se puede investigar desde el inicio.</div>'}<h4>Desbloquea</h4>${dep.length?dep.map(x=>`<button class="tchip ${techStatus(x)}" data-act="tmsel" data-name="${esc(x.n)}">${esc(x.n)}</button>`).join(' '):'<div class="hint">No es requisito de ninguna otra tecnología.</div>'}`;
}
function renderTechMap(){
  const el=$('techMap'); if(!el) return; const sc=el.scrollTop, sl=el.scrollLeft;
  el.innerHTML=techMapHTML(); el.scrollTop=sc; el.scrollLeft=sl;
  $('techDetail').innerHTML=researchBox()+techDetailHTML();
}
function openTechMap(){ if(!ui.tmSel) ui.tmSel=null; $('dlgTech').showModal(); renderTechMap(); }
