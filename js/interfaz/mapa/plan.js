'use strict';
// Plan de red: la misma navegación que el territorio (arrastrar, rueda, ＋/－, flechas, centrar en una zona).
const PV = {x:0, y:0, w:1100, h:1060, minW:300, maxW:2400, ratio:0.9, anim:null};
const PB = {x0:0, x1:1100, y0:40, y1:1060};   // dónde está el dibujo (el fondo sigue más allá)
function planApply(){ const r=vpRect(); if(!r.width) return; PV.ratio=r.height/r.width; PV.h=PV.w*PV.ratio; $('plan').setAttribute('viewBox',`${f1(PV.x)} ${f1(PV.y)} ${f1(PV.w)} ${f1(PV.h)}`); }
function planClamp(){ const mx=PV.w*0.3, my=PV.h*0.3; PV.x=Math.min(Math.max(PV.x,PB.x0-mx),PB.x1-PV.w+mx); PV.y=Math.min(Math.max(PV.y,PB.y0-my),PB.y1-PV.h+my); }
function planSet(cx,cy,w){ PV.w=Math.max(PV.minW,Math.min(PV.maxW,w)); PV.h=PV.w*PV.ratio; PV.x=cx-PV.w/2; PV.y=cy-PV.h/2; planClamp(); planApply(); }
function planFly(cx,cy,w,ms){
  if(PV.anim) cancelAnimationFrame(PV.anim);
  w=Math.max(PV.minW,Math.min(w||PV.w,PV.maxW)); if(!FXS.on||!ms){ planSet(cx,cy,w); return; }
  const x0=PV.x+PV.w/2, y0=PV.y+PV.h/2, w0=PV.w, t0=performance.now();
  const st=t=>{ const k=Math.min(1,(t-t0)/ms), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; planSet(x0+(cx-x0)*e,y0+(cy-y0)*e,w0+(w-w0)*e); PV.anim=k<1?requestAnimationFrame(st):null; };
  PV.anim=requestAnimationFrame(st);
}
function planFit(ms){ const r=vpRect(); const ratio=r.width?r.height/r.width:0.7; planFly(550,550,Math.max(1100,1010/ratio)*1.02,ms); }
function planInput(){
  const vp=$('vp'); let d=null;
  vp.addEventListener('pointerdown',e=>{ if(!ui||ui.view!=='plan'||e.button!==0||e.target.closest('.vmode,.dpad,.mini')) return; d={x:e.clientX,y:e.clientY,vx:PV.x,vy:PV.y,moved:false}; if(PV.anim){ cancelAnimationFrame(PV.anim); PV.anim=null; } });
  window.addEventListener('pointermove',e=>{ if(!d||!ui||ui.view!=='plan') return; const dx=e.clientX-d.x, dy=e.clientY-d.y; if(!d.moved&&Math.hypot(dx,dy)>5){ d.moved=true; vp.classList.add('dragging'); }
    if(d.moved){ const r=vpRect(), s=PV.w/r.width; PV.x=d.vx-dx*s; PV.y=d.vy-dy*s; planClamp(); planApply(); } });
  window.addEventListener('pointerup',()=>{ if(d){ if(d.moved){ SUPPRESS=true; setTimeout(()=>{ SUPPRESS=false; },0); } d=null; vp.classList.remove('dragging'); } });
  vp.addEventListener('wheel',e=>{ if(!ui||ui.view!=='plan') return; e.preventDefault(); const r=vpRect(); const mx=(e.clientX-r.left)/r.width, my=(e.clientY-r.top)/r.height; const wx=PV.x+mx*PV.w, wy=PV.y+my*PV.h;
    const w=Math.max(PV.minW,Math.min(PV.maxW,PV.w*(e.deltaY>0?1.15:1/1.15))); PV.w=w; PV.h=w*PV.ratio; PV.x=wx-mx*PV.w; PV.y=wy-my*PV.h; planClamp(); planApply(); },{passive:false});
  window.addEventListener('resize',()=>{ if(G&&ui&&ui.view==='plan') planApply(); });
}
