'use strict';
// Adaptación a teléfono (pantalla angosta): el mapa ocupa toda la pantalla y el panel es una hoja inferior con las pestañas
// como barra de navegación. Aquí van el cambio de diseño, la hoja (cerrada / media / alta), el pellizco para acercar y
// los avisos que en el escritorio salen al pasar el mouse. Los estilos están en css/estilos.css (body.movil).
const MOV = {mq:null, sheet:0, pts:new Map(), pinch:null};
function isMovil(){ return document.body.classList.contains('movil'); }
function setSheet(n){
  MOV.sheet=Math.max(0,Math.min(2,n)); const b=document.body;
  b.classList.remove('sheet-0','sheet-1','sheet-2'); b.classList.add('sheet-'+MOV.sheet);
  const g=$('sheetGrip'); if(g) g.setAttribute('aria-expanded',String(MOV.sheet>0));
}
function applyMovil(){
  const on=MOV.mq.matches; document.body.classList.toggle('movil',on);
  if(on){ setSheet(MOV.sheet);
    // primera vez en un teléfono: efectos ligeros (el mapa en SVG puede ir lento en equipos modestos); se cambia en el Menú
    try{ if(!localStorage.getItem('pasos_movil_init')){ localStorage.setItem('pasos_movil_init','1'); if(typeof setFxLevel==='function'&&!localStorage.getItem('pasos_fx')) setFxLevel('lite',true); } }catch(e){} }
  else { document.body.classList.remove('sheet-0','sheet-1','sheet-2'); }
  if(G&&ui){ if(typeof resizeView==='function') resizeView(); if(typeof planApply==='function') planApply(); }
}
function initMovil(){
  MOV.mq=matchMedia('(max-width: 760px)'); (MOV.mq.addEventListener?MOV.mq.addEventListener('change',applyMovil):MOV.mq.addListener(applyMovil)); applyMovil();
  // abrir y cerrar la hoja: tocar la pestaña elegida la cierra; tocar otra, o la barra de arriba, la abre
  document.addEventListener('click',e=>{ const tb=e.target.closest&&e.target.closest('.tabs button'); if(!tb||!isMovil()||!ui) return; const same=ui.tab===tb.dataset.tab; setTimeout(()=>{ if(MOV.sheet===0) setSheet(1); else if(same) setSheet(0); },0); },true);
  const grip=$('sheetGrip'); if(grip){ let y0=null;
    grip.addEventListener('pointerdown',e=>{ y0=e.clientY; grip.setPointerCapture&&grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointerup',e=>{ if(y0===null) return; const dy=e.clientY-y0; y0=null; if(dy<-28) setSheet(MOV.sheet+1); else if(dy>28) setSheet(MOV.sheet-1); else setSheet(MOV.sheet===0?1:MOV.sheet===1?2:1); });
    grip.addEventListener('pointercancel',()=>{ y0=null; }); }
  // seleccionar una zona o tocar un aviso abre la hoja si estaba cerrada
  const _onZone=onZone; onZone=function(id){ _onZone(id); if(isMovil()&&MOV.sheet===0) setSheet(1); };
  const _act=act; act=function(a,d){ const r=_act(a,d); if(isMovil()&&MOV.sheet===0&&(a==='sug'||a==='gozone'||a==='tab')) setSheet(1); return r; };
  initPinch(); initTouchTips();
}
// Pellizco con dos dedos: acerca o aleja manteniendo bajo los dedos el punto que tocaste (también mueve el mapa).
function initPinch(){
  const vp=$('vp'); if(!vp) return;
  const mid=()=>{ const a=[...MOV.pts.values()]; return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1}; };
  vp.addEventListener('pointerdown',e=>{ if(e.pointerType!=='touch') return; MOV.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(MOV.pts.size===2){ if(typeof DRAG!=='undefined') DRAG=null; if(typeof PLANCANCEL==='function') PLANCANCEL(); vp.classList.remove('dragging');
      const m=mid(), r=vpRect(), plan=ui.view==='plan', V=plan?PV:VIEW; MOV.pinch={d0:m.d,w0:V.w,wx:V.x+(m.x-r.left)/r.width*V.w,wy:V.y+(m.y-r.top)/r.height*V.h,plan}; } });
  window.addEventListener('pointermove',e=>{ if(!MOV.pts.has(e.pointerId)) return; MOV.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(MOV.pts.size!==2||!MOV.pinch) return; const m=mid(), r=vpRect(), p=MOV.pinch, V=p.plan?PV:VIEW;
    const w=Math.max(V.minW,Math.min(V.maxW,p.w0*p.d0/m.d)); V.w=w; V.h=w*V.ratio; const mx=(m.x-r.left)/r.width, my=(m.y-r.top)/r.height; V.x=p.wx-mx*w; V.y=p.wy-my*V.h;
    if(p.plan){ planClamp(); planApply(); } else schedView(); });
  const fin=e=>{ if(!MOV.pts.has(e.pointerId)) return; const was=MOV.pts.size>=2; MOV.pts.delete(e.pointerId); if(MOV.pts.size<2){ MOV.pinch=null; if(was){ SUPPRESS=true; setTimeout(()=>{ SUPPRESS=false; },300); } } };
  window.addEventListener('pointerup',fin); window.addEventListener('pointercancel',fin);
}
// En el teléfono no hay «pasar el mouse»: al tocar algo que tiene explicación, se muestra como aviso.
function initTouchTips(){
  document.addEventListener('click',e=>{ if(!isMovil()) return; const t=e.target.closest&&e.target.closest('[title]'); if(!t||t.closest('button,a,[data-act],input,select,textarea,dialog:not(#dlgEnc)')) return;
    const txt=t.getAttribute('title'); if(!txt||txt.length<6||t.id==='readyBtn') return; if(typeof toast==='function') toast('',txt,'info'); });
}
