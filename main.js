'use strict';
// Punto de entrada: conecta los eventos del navegador y abre la ventana de partida nueva.

document.addEventListener('click',e=>{
  const sm=e.target.closest&&e.target.closest('summary'); if(sm&&ui&&sm.parentElement.dataset&&sm.parentElement.dataset.d){ ui.det=ui.det||{}; ui.det[sm.parentElement.dataset.d]=!sm.parentElement.open; }
  const wl_=e.target.closest('[data-wiki]'); if(wl_){ e.preventDefault(); const id=wl_.dataset.wiki; if(!WIKI||!$('dlgWiki').open){ openWiki(id); } else { ui.wikiId=id; renderWiki(); } return; }
  if(SUPPRESS) return;
  const mb=e.target.closest('.mvb'); if(mb&&ui&&ui.sel!==null){ const zg0=mb.closest('g.zone'); openMove(ui.sel,Number(zg0.dataset.id)); render(); return; }
  const zg=e.target.closest('g.zone'); if(zg&&document.querySelector('.viewport').contains(zg)){ onZone(Number(zg.dataset.id)); return; }
  const tb=e.target.closest('.tabs button'); if(tb&&ui){ ui.tab=tb.dataset.tab; renderPanel(); return; }
  const b=e.target.closest('[data-act]'); if(b&&G){ act(b.dataset.act,b.dataset); }
});
document.addEventListener('input',e=>{
  const k=e.target.dataset&&e.target.dataset.f; if(!k||!ui) return;
  if(e.target.tagName==='INPUT'&&e.target.type==='number'){ ui.form[k]=Number(e.target.value); if(k.startsWith('mv_')) drawOrderPreview(); }
});
document.addEventListener('change',e=>{
  const k=e.target.dataset&&e.target.dataset.f; if(!k||!ui) return;
  if(e.target.tagName==='SELECT'){ e.target.blur(); if(k==='tf_br'){ ui.tf.br=e.target.value; } else ui.form[k]=e.target.value; if(k.startsWith('mv_')&&ui.view==='terr') drawOrderPreview(); renderPanel(); }
  else if(e.target.type==='checkbox'){ if(k==='tf_avail') ui.tf.avail=e.target.checked; if(k==='tf_spine') ui.tf.spine=e.target.checked; if(k==='tf_impl') ui.tf.impl=e.target.checked; renderPanel(); }
});
/* arrastrar y soltar para especializar */
let DRAGT=null;
document.addEventListener('dragstart',e=>{ const t=e.target.closest&&e.target.closest('.token[draggable]'); if(!t) return; DRAGT=t.dataset.t; e.dataTransfer.setData('text/plain',DRAGT); e.dataTransfer.effectAllowed='move'; t.classList.add('dragging'); });
document.addEventListener('dragend',e=>{ DRAGT=null; document.querySelectorAll('.token.dragging,.station.over').forEach(x=>x.classList.remove('dragging','over')); });
document.addEventListener('dragover',e=>{ const st=e.target.closest&&e.target.closest('.station'); if(st&&DRAGT){ e.preventDefault(); st.classList.add('over'); } });
document.addEventListener('dragleave',e=>{ const st=e.target.closest&&e.target.closest('.station'); if(st) st.classList.remove('over'); });
document.addEventListener('drop',e=>{ const st=e.target.closest&&e.target.closest('.station'); if(st&&DRAGT){ e.preventDefault(); const from=DRAGT; DRAGT=null; if(ui.sel!==null) dropOnStation(ui.sel,from,st.dataset.st); } });
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){ const zg=e.target.closest&&e.target.closest('g.zone'); if(zg){ e.preventDefault(); onZone(Number(zg.dataset.id)); return; } }
  if(e.key==='Enter'&&!e.target.closest('button,dialog,input,select,textarea,summary')){ e.preventDefault(); toggleReady(); }
  if(ui&&ui.view==='terr'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,select,textarea,dialog')&&keyDown(e.key)){ e.preventDefault(); return; }
  if(e.key==='Escape'&&ui){ if(ui.mv){ ui.mv=null; render(); } else if(ui.sel!==null){ ui.sel=null; render(); } }
});
document.addEventListener('toggle',e=>{ const d=e.target&&e.target.dataset&&e.target.dataset.d; if(d&&ui){ ui.det=ui.det||{}; ui.det[d.startsWith('op_')?d:d]=e.target.open; } },true);
document.addEventListener('keyup',e=>keyUp(e.key));
window.addEventListener('blur',()=>{ KEYS.clear(); });
$('readyBtn').addEventListener('click',toggleReady);
document.querySelectorAll('.dpad button[data-dir]').forEach(b=>{ const dir=b.dataset.dir.split(',').map(Number); b.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); DPAD=dir; startPan(); }); b.addEventListener('pointerup',()=>{ DPAD=[0,0]; }); b.addEventListener('pointerleave',()=>{ DPAD=[0,0]; }); });
$('zIn').addEventListener('click',()=>{ setView(VIEW.x+VIEW.w/2,VIEW.y+VIEW.h/2,VIEW.w/1.3); });
$('zOut').addEventListener('click',()=>{ setView(VIEW.x+VIEW.w/2,VIEW.y+VIEW.h/2,VIEW.w*1.3); });
$('btnHelp').addEventListener('click',()=>openWiki('vision'));
$('wikiQ').addEventListener('input',e=>{ ui.wikiQ=e.target.value; renderWiki(); });
$('btnGallery').addEventListener('click',()=>{ $('dlgMenu').close(); buildGallery(); $('dlgGallery').showModal(); });
$('btnAuto').addEventListener('click',()=>{ if(ui) ui.auto=5; $('dlgMenu').close(); });
function openSetup(){
  $('setupWarn').hidden=!G||G.over; $('setupCancel').hidden=!G||G.over;
  if($('dlgMenu').open) $('dlgMenu').close();
  if($('dlgEnd').open) $('dlgEnd').close();
  showMapShort(); $('dlgSetup').showModal();
}
function showMapShort(){ const m=DATA.maps[Number($('selMap').value)]; $('mapShort').textContent=m?m.short+'.':''; }
$('selMap').addEventListener('change',showMapShort);
$('btnStart').addEventListener('click',()=>{ $('dlgSetup').close(); startGame(); });
$('setupCancel').addEventListener('click',()=>$('dlgSetup').close());
$('dlgSetup').addEventListener('cancel',e=>{ if(!G||G.over) e.preventDefault(); });
$('btnNew').addEventListener('click',openSetup);
$('btnMenu').addEventListener('click',()=>{ $('menuInfo').textContent=G?('Partida actual: '+DATA.maps[G.mapIdx!==undefined?G.mapIdx:0].name+', '+G.N+' jugadores, victoria '+(G.thr==='prueba'?'de prueba':'normal')+'. Paso '+G.step+'.'):''; $('dlgMenu').showModal(); });
$('endNew').addEventListener('click',()=>setTimeout(openSetup,0));
$('vTerr').addEventListener('click',()=>setViewMode('terr'));
$('vPlan').addEventListener('click',()=>setViewMode('plan'));
$('bCap').addEventListener('click',()=>{ if(ui.view!=='terr') setViewMode('terr'); goZone(myCapital(),840,700); });
$('bAll').addEventListener('click',()=>{ if(ui.view!=='terr') setViewMode('terr'); fitAll(800); });
$('bSel').addEventListener('click',()=>{ if(ui.sel!==null){ if(ui.view!=='terr') setViewMode('terr'); goZone(ui.sel,820,600); } });
$('chkEdge').addEventListener('change',e=>{ VIEW.edge=e.target.checked; });
$('chkAnim').addEventListener('change',e=>{ FXS.on=e.target.checked; document.body.classList.toggle('noanim',!e.target.checked); });
if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){ FXS.on=false; document.body.classList.add('noanim'); $('chkAnim').checked=false; }
initTerrInput();
DATA.maps.forEach((m,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=m.id+'. '+m.name; $('selMap').appendChild(o); });
$('selMap').value='0'; $('selN').value='3';
openSetup();
setInterval(tick,250);
window.__ui={act,onZone,get G(){return G;},get ui(){return ui;},toggleReady,startGame};
