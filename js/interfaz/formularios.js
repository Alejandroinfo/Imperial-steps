'use strict';
// Ayudantes de formulario y de órdenes en cola (qué unidades ya tienen una orden, costos comprometidos).

function fv(k,d){ return ui.form[k]===undefined?d:ui.form[k]; }
function selHTML(key,opts,def){
  const cur=fv(key,def);
  return `<select data-f="${key}">${opts.map(([v,l])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
}
function numHTML(key,def,max){ return `<input type="number" min="0" max="${max}" value="${fv(key,def)}" data-f="${key}" class="n">`; }
function btnHTML(act,label,extra,cls){ return `<button class="btn ${cls||''}" data-act="${act}" ${extra||''}>${label}</button>`; }
const ME=0;
function mine(z){ return z.owner===ME; }
function fm(n){ return Math.round(n*10)/10; }

function queuedMove(zid,t){ let n=0; ui.orders.forEach(o=>{ if(o.t==='move'&&o.from===zid) n+=(o.u[t]||0); }); return n; }
function queuedUnits(zid,t){ // unidades de ese tipo que ya tienen una orden de gasto
  let n=queuedMove(zid,t); ui.orders.forEach(o=>{ if(o.zone===zid&&o.t==='spec'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='train'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='demob'&&o.u===t) n+=o.n; });
  return n;
}
function availQ(zid,t){ const z=G.zones[zid]; return Math.max(0,availUnits(G,z,ME,t)-queuedUnits(zid,t)); }
function commits(){
  const c={tech:0,prod:{},gold:0};
  ui.orders.forEach(o=>{
    const z=G.zones[o.zone!==undefined?o.zone:o.from];
    if(o.t==='spec'){ c.prod[o.zone]=(c.prod[o.zone]||0)+specPer(G,ME,z,o.from,o.to)*o.n; }
    else if(o.t==='train'){ c.prod[o.zone]=(c.prod[o.zone]||0)+trainCost(G,ME,z,o.u,o.from)*o.n; }
    else if(o.t==='demob'){ c.prod[o.zone]=(c.prod[o.zone]||0)+demobCost(G,ME,o.to)*o.n; }
    else if(o.t==='move'){ const M=G.M[ME]; const hops=1+(o.via?o.via.length:0); Object.keys(o.u).forEach(t=>{ if(MIL.includes(t)) c.gold+=Math.ceil(o.u[t]*(M.milMoveHalf?0.5:1)*hops); }); }
    else if(o.t==='send'){ const p=ownPath(G,ME,o.from,o.to,12); if(p) c.gold+=Math.ceil(o.q*shipFactor(G,p)); }
  });
  return c;
}
function ordText(o){
  const Z=G.zones;
  switch(o.t){
    case 'research': return 'Investigar «'+o.name+'» (costo '+techCost(G,ME,o.name)+', lo pagan tus científicos asignados)';
    case 'cancelres': return 'Cancelar la investigación de «'+o.name+'»';
    case 'assign': return zname(Z[o.zone])+': '+o.n+' científico'+(o.n===1?'':'s')+' investigando';
    case 'stance': return zname(Z[o.zone])+': postura '+(o.stance==='alerta'?'Alerta':'Paz');
    case 'spec': return zname(Z[o.zone])+': especializar '+o.n+' '+UNP[o.from].toLowerCase()+' → '+UNP[o.to].toLowerCase();
    case 'train': return zname(Z[o.zone])+': entrenar '+o.n+' '+UNP[o.u].toLowerCase()+(o.from==='sol'?' (equipar soldados)':'');
    case 'demob': return zname(Z[o.zone])+': licenciar '+o.n+' '+(o.n>1?UNP[o.u]:UN[o.u]).toLowerCase()+' → '+(o.n>1?UNP[o.to]:UN[o.to]).toLowerCase();
    case 'build': return zname(Z[o.zone])+': construir '+BT[o.bt].n;
    case 'upgrade': return zname(Z[o.zone])+': mejorar '+BT[Z[o.zone].b[o.bi].t].n+' a nivel '+(Z[o.zone].b[o.bi].l+1);
    case 'bspec': return zname(Z[o.zone])+': especializar '+BT[Z[o.zone].b[o.bi].t].n+' → '+SPEC_NAMES[o.spec];
    case 'demolish': return zname(Z[o.zone])+': destruir '+BT[Z[o.zone].b[o.bi].t].n;
    case 'wonder': return zname(Z[o.zone])+': construir una Maravilla';
    case 'send': return 'Enviar '+o.q+' de '+(o.res==='food'?'comida':'producción')+': '+zname(Z[o.from])+' → '+zname(Z[o.to]);
    case 'move': { const p=Object.keys(o.u).filter(t=>o.u[t]>0).map(t=>o.u[t]+' '+(o.u[t]>1?UNP[t]:UN[t]).toLowerCase()); return 'Mover '+p.join(', ')+': '+zname(Z[o.from])+' → '+zname(Z[o.to])+(o.via&&o.via.length?' → '+o.via.map(i=>zname(Z[i])).join(' → '):'')+' ('+(o.stance==='ataque'?'ataque':'paz')+')'; }
    case 'annex': return 'Anexar la tribu de '+zname(Z[o.zone])+' (paga desde '+zname(Z[o.from])+')';
    case 'tribute': return 'Pagar el tributo a la tribu de '+zname(Z[o.tribe])+' desde '+zname(Z[o.from]);
    case 'ally': return o.off?'Romper la alianza':'Proponer o aceptar alianza con '+PLN[o.target].name;
  }
  return o.t;
}
