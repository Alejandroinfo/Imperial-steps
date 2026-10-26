'use strict';
// Especializar arrastrando personas de un oficio a otro.

const STATIONS=[['pob','Casas','sin oficio'],['agr','Granja','comida'],['ing','Taller','producción'],['con','Obras','construcción'],['cie','Laboratorio','ciencia'],['com','Mercado','oro']];
function stationRate(t){ return ({pob:'+1 comida y +1 prod.',agr:'+2 comida',ing:'+2 producción',con:'obra: 2 por paso',cie:'+2 ciencia (o investiga)',com:'+2 oro'})[t]; }
function emblemSVG(sp,r,sz){ sz=sz||(r*2+6); return `<svg class="emb" width="${sz}" height="${sz}" viewBox="-${r+3} -${r+3} ${2*r+6} ${2*r+6}" aria-hidden="true">${emblem(sp,r)}</svg>`; }
function dndHTML(z){
  const mineU=z.units[ME]||[]; const delta={};
  ui.orders.filter(o=>o.t==='spec'&&o.zone===z.id).forEach(o=>{ delta[o.from]=(delta[o.from]||0)-o.n; delta[o.to]=(delta[o.to]||0)+o.n; });
  const batch=ui.batch||1;
  let h=`<div class="hint">Arrastra a las personas hacia el oficio que quieres (o tócalas y luego toca el oficio). Cada cambio cuesta producción. Lo que sueltas queda en cola hasta que presiones ¡Listo!.</div>`;
  h+=`<div class="row"><span class="hint">Cuántos por vez:</span><span class="seg">${[1,2,5,'todos'].map(b=>`<button data-act="batch" data-b="${b}" aria-pressed="${String(batch)===String(b)}">${b}</button>`).join('')}</span></div>`;
  h+='<div class="stations">';
  STATIONS.forEach(([t,name,out])=>{
    const total=mineU.filter(u=>u.t===t).length, avail=availQ(z.id,t), inc=Math.max(0,delta[t]||0), wnd=mineU.filter(u=>u.t===t&&u.w>0).length;
    const sp=t==='pob'?'bas':t; let toks='';
    for(let i=0;i<Math.min(avail,14);i++) toks+=`<div class="token ${ui.pick===t?'picked':''}" draggable="true" data-act="pick" data-t="${t}" title="${UN[t]}: arrástralo a otro oficio">${uIcon(t,34)}</div>`;
    if(avail>14) toks+=`<div class="tokmore">+${avail-14}</div>`;
    for(let i=0;i<Math.min(inc,10);i++) toks+=`<div class="token ghost" title="Llegará al presionar ¡Listo!">${uIcon(t,34)}</div>`;
    if(wnd) toks+=`<div class="tokmore" title="Heridos">✚ ${wnd}</div>`;
    h+=`<div class="station ${ui.flashSt===t?'flash':''}" data-st="${t}" data-act="dropst" style="--sc:${SPECC[sp]}"><div class="sth">${emblemSVG(sp,17,36)}<div><b>${name}</b><small>${stationRate(t)}</small></div><span class="stn">${total}${delta[t]?`<i>${delta[t]>0?'+':''}${delta[t]}</i>`:''}</span></div><div class="stbody">${toks||'<span class="hint">suelta aquí</span>'}</div></div>`;
  });
  h+='</div>';
  const cm=commits(); if(cm.prod[z.id]) h+=`<div class="${z.prod-cm.prod[z.id]<0?'warn':'hint'}">Las órdenes de esta zona gastan ${cm.prod[z.id]} de producción (hay ${Math.floor(z.prod)}).</div>`;
  return h;
}
function dropOnStation(zid,from,to){
  const z=G.zones[zid]; if(!z||z.owner!==ME||from===to) return;
  const per=specPer(G,ME,z,from,to); const cm=commits(); const prodLeft=z.prod-(cm.prod[zid]||0);
  let n=ui.batch==='todos'?availQ(zid,from):Math.min(Number(ui.batch)||1,availQ(zid,from));
  if(per>0) n=Math.min(n,Math.floor(prodLeft/per));
  if(n<=0){ toast('No se puede','Sin personas disponibles o sin producción suficiente ('+per+' por persona).','neg','⚠'); return; }
  const ex=ui.orders.find(o=>o.t==='spec'&&o.zone===zid&&o.from===from&&o.to===to);
  if(ex) ex.n+=n; else ui.orders.push({t:'spec',zone:zid,from,to,n});
  ui.flashSt=to; setTimeout(()=>{ ui.flashSt=null; document.querySelectorAll('.station.flash').forEach(e=>e.classList.remove('flash')); },900);
  ui.pick=null; render();
}
