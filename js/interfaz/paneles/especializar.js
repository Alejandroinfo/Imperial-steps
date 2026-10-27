'use strict';
// Especializar arrastrando personas de un oficio a otro.

const STATIONS=[['pob','Casas','sin oficio'],['agr','Granja','comida'],['ing','Taller','producción'],['cie','Laboratorio','ciencia'],['com','Mercado','oro']];
function stationRate(t){ return ({pob:'+1 comida y +1 prod.',agr:'+2 comida',ing:'+2 producción (o construye: 2 por paso)',cie:'+2 ciencia (o investiga)',com:'+2 oro'})[t]; }
function emblemSVG(sp,r,sz){ sz=sz||(r*2+6); return `<svg class="emb" width="${sz}" height="${sz}" viewBox="-${r+3} -${r+3} ${2*r+6} ${2*r+6}" aria-hidden="true">${emblem(sp,r)}</svg>`; }
function dndHTML(z){
  const mineU=z.units[ME]||[]; const delta={};
  ui.orders.filter(o=>o.t==='spec'&&o.zone===z.id).forEach(o=>{ delta[o.from]=(delta[o.from]||0)-o.n; delta[o.to]=(delta[o.to]||0)+o.n; });
  const batch=ui.batch||1;
  let h='';
  h+=`<div class="row"><span class="hint">Cuántos por vez:</span><span class="seg">${[1,2,5,'todos'].map(b=>`<button data-act="batch" data-b="${b}" aria-pressed="${String(batch)===String(b)}">${b}</button>`).join('')}</span></div>`;
  h+='<div class="stations">';
  STATIONS.forEach(([t,name,out])=>{
    const total=mineU.filter(u=>u.t===t).length, avail=availQ(z.id,t), inc=Math.max(0,delta[t]||0), wnd=mineU.filter(u=>u.t===t&&u.w>0).length;
    const sp=t==='pob'?'bas':t; let toks='';
    const picks=ui.pickIds||[]; const people=availListQ(z.id,t);
    people.slice(0,40).forEach(u=>{ toks+=`<div class="token tk ${picks.includes(u.id)?'picked':''} ${traitBorder(u)}" draggable="true" data-act="pick" data-t="${t}" data-id="${u.id}" title="${esc(UN[t]+(u.tr&&u.tr.length?' · '+u.tr.map(traitText).join(' · '):'')+' · tócalo o arrástralo a otro oficio')}">${uIcon(t,28)}<div class="tkb">${traitChips(u)}</div></div>`; });
    if(people.length>40) toks+=`<div class="tokmore">+${people.length-40}</div>`;
    for(let i=0;i<Math.min(inc,10);i++) toks+=`<div class="token ghost" title="Llegará al presionar ¡Listo!">${uIcon(t,28)}</div>`;
    if(wnd) toks+=`<div class="tokmore" title="Heridos">✚ ${wnd}</div>`;
    h+=`<div class="station ${ui.flashSt===t?'flash':''}" data-st="${t}" data-act="dropst" style="--sc:${SPECC[sp]}"><div class="sth" title="${esc(name+': '+stationRate(t))}">${emblemSVG(sp,12,26)}<div><b>${name}</b><small>${stationRate(t)}</small></div><span class="stn">${total}${delta[t]?`<i>${delta[t]>0?'+':''}${delta[t]}</i>`:''}</span></div><div class="stbody">${toks||'<span class="hint">suelta aquí</span>'}</div></div>`;
  });
  h+='</div>';
  const cm=commits(); if(cm.prod[z.id]) h+=`<div class="${z.prod-cm.prod[z.id]<0?'warn':'hint'}">Las órdenes de esta zona gastan ${cm.prod[z.id]} de producción (hay ${Math.floor(z.prod)}).</div>`;
  return h;
}
// ids: las personas que el jugador eligió (si no hay, se usa la cantidad por vez, como antes)
function dropOnStation(zid,from,to,ids){
  const z=G.zones[zid]; if(!z||z.owner!==ME||from===to) return;
  const per=specPer(G,ME,z,from,to); const cm=commits(); const prodLeft=z.prod-(cm.prod[zid]||0);
  let list=(ids&&ids.length)?ids.slice():null;
  let n=list?list.length:(ui.batch==='todos'?availQ(zid,from):Math.min(Number(ui.batch)||1,availQ(zid,from)));
  if(per>0) n=Math.min(n,Math.floor(prodLeft/per));
  if(n<=0){ toast('No se puede','Sin personas disponibles o sin producción suficiente ('+per+' por persona).','neg','⚠'); return; }
  if(list) list=list.slice(0,n);
  const ex=ui.orders.find(o=>o.t==='spec'&&o.zone===zid&&o.from===from&&o.to===to&&!!o.ids===!!list);
  if(ex){ ex.n+=n; if(list) ex.ids=ex.ids.concat(list); } else ui.orders.push(list?{t:'spec',zone:zid,from,to,n,ids:list}:{t:'spec',zone:zid,from,to,n});
  ui.flashSt=to; setTimeout(()=>{ ui.flashSt=null; document.querySelectorAll('.station.flash').forEach(e=>e.classList.remove('flash')); },900);
  ui.pick=null; ui.pickIds=[]; render();
}
