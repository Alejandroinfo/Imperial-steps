'use strict';
// Ayudantes de formulario y de órdenes en cola (qué unidades ya tienen una orden, costos comprometidos).

function fv(k,d){ return ui.form[k]===undefined?d:ui.form[k]; }
function selHTML(key,opts,def){
  const cur=fv(key,def);
  return `<select data-f="${key}">${opts.map(([v,l])=>`<option value="${v}" ${String(v)===String(cur)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
}
function numHTML(key,def,max){ return `<input type="number" min="0" max="${max}" value="${fv(key,def)}" data-f="${key}" class="n">`; }
function btnHTML(act,label,extra,cls){ return `<button class="btn ${cls||''}" data-act="${act}" ${extra||''}>${label}</button>`; }
let ME=0;   // asiento de quien juega en esta pantalla (en línea lo fija la sala)
// Íconos de los recursos y una cantidad con su ícono (menos texto en la interfaz)
const RI={food:'🌾',prod:'⚒',gold:'🪙',tech:'🔬'};
const RN={food:'comida',prod:'producción',gold:'oro',tech:'ciencia'};
function rq(res,n,sign){ return `<span class="rq" title="${RN[res]}">${RI[res]} ${sign&&n>0?'+':''}${n}</span>`; }
function unitsIcons(u){ return Object.keys(u).map(t=>`<span class="uchip" title="${(u[t]>1?UNP[t]:UN[t])}">${uIcon(t,20)}<b>×${u[t]}</b></span>`).join(''); }
// Cada rama de tecnología tiene su color y su ícono
const BRANCH_STYLE={
  'Agricultura':['#6FA83A','🌾'],'Producción':['#B07A4A','⚒'],'Comercio':['#D9A028','🪙'],'Saber':['#4A7FC0','🔬'],
  'Logística':['#A08A5E','📦'],'Urbanismo':['#D6772E','🏗'],'Sanidad y población':['#D2697A','🩺'],'Diplomacia e imperio':['#8E5BA8','🕊'],
  'Armas y unidades':['#B8433A','⚔'],'Cuartel y entrenamiento':['#7A2E24','🛡'],'Defensa':['#6F6962','🏰'],'Guerra y conquista':['#A12F4F','🚩']
};
const bCol=r=>(BRANCH_STYLE[r]||['#999','•'])[0], bIco=r=>(BRANCH_STYLE[r]||['#999','•'])[1];
function mine(z){ return z.owner===ME; }
function fm(n){ return Math.round(n*10)/10; }

function queuedMove(zid,t){ let n=0; ui.orders.forEach(o=>{ if(o.t==='move'&&o.from===zid) n+=(o.u[t]||0); }); return n; }
function queuedUnits(zid,t){ // unidades de ese tipo que ya tienen una orden de gasto
  let n=queuedMove(zid,t); ui.orders.forEach(o=>{ if(o.zone===zid&&o.t==='spec'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='train'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='demob'&&o.u===t) n+=o.n; });
  return n;
}
function availQ(zid,t){ const z=G.zones[zid]; return Math.max(0,availUnits(G,z,ME,t)-queuedUnits(zid,t)); }
// Oro que cuesta mover estas unidades esa cantidad de zonas (los civiles se mueven gratis).
function moveGold(u,hops){
  const M=G.M[ME]; let n=0; Object.keys(u||{}).forEach(t=>{ if(MIL.includes(t)) n+=u[t]; });
  return Math.ceil(n*(M.milMoveHalf?0.5:1)*Math.max(1,hops||1));
}
function commits(){
  const c={tech:0,prod:{},gold:0};
  ui.orders.forEach(o=>{
    const z=G.zones[o.zone!==undefined?o.zone:o.from];
    if(o.t==='spec'){ c.prod[o.zone]=(c.prod[o.zone]||0)+specPer(G,ME,z,o.from,o.to)*o.n; }
    else if(o.t==='train'){ const st=Math.min(o.n,stockOf(z,o.u)), fr=o.from==='sol'?'sol':null; c.prod[o.zone]=(c.prod[o.zone]||0)+trainCost(G,ME,z,o.u,fr,true)*st+trainCost(G,ME,z,o.u,fr,false)*(o.n-st); }
    else if(o.t==='demob'){ c.prod[o.zone]=(c.prod[o.zone]||0)+demobCost(G,ME,o.to)*o.n; }
    else if(o.t==='move'){ const M=G.M[ME]; const hops=1+(o.via?o.via.length:0); Object.keys(o.u).forEach(t=>{ if(MIL.includes(t)) c.gold+=Math.ceil(o.u[t]*(M.milMoveHalf?0.5:1)*hops); }); }
    else if(o.t==='send'){ const p=ownPath(G,ME,o.from,o.to,12); if(p) c.gold+=Math.ceil(o.q*shipFactor(G,p)); }
  });
  return c;
}
function ordText(o){
  const Z=G.zones;
  switch(o.t){
    case 'research': return 'Investigar «'+o.name+'» (costo '+techCost(G,ME,o.name)+', la desarrollan tus científicos)';
    case 'cancelres': return 'Cancelar la investigación de «'+o.name+'»';
    case 'stance': return 'Postura con '+PLN[o.target].name+': '+(o.stance==='alerta'?'Alerta':'Paz');
    case 'spec': return zname(Z[o.zone])+': especializar '+o.n+' '+UNP[o.from].toLowerCase()+' → '+UNP[o.to].toLowerCase();
    case 'train': return zname(Z[o.zone])+': entrenar '+o.n+' '+UNP[o.u].toLowerCase()+(o.from==='sol'?' (equipar soldados)':'');
    case 'demob': return zname(Z[o.zone])+': licenciar '+o.n+' '+(o.n>1?UNP[o.u]:UN[o.u]).toLowerCase()+' → '+(o.n>1?UNP[o.to]:UN[o.to]).toLowerCase();
    case 'build': { const l=buildLevel(G,ME,o.bt); return zname(Z[o.zone])+': construir '+BT[o.bt].n+(l>1?' de nivel '+l:'')+(o.spec?' ('+SPEC_NAMES[o.spec]+')':''); }
    case 'upgrade': return zname(Z[o.zone])+': mejorar '+BT[Z[o.zone].b[o.bi].t].n+' a nivel '+(Z[o.zone].b[o.bi].l+1);
    case 'bspec': return zname(Z[o.zone])+': especializar '+BT[Z[o.zone].b[o.bi].t].n+' → '+SPEC_NAMES[o.spec];
    case 'demolish': return zname(Z[o.zone])+': destruir '+BT[Z[o.zone].b[o.bi].t].n;
    case 'wonder': return zname(Z[o.zone])+': construir una Maravilla';
    case 'send': return 'Enviar '+o.q+' de '+(o.res==='food'?'comida':'producción')+': '+zname(Z[o.from])+' → '+zname(Z[o.to]);
    case 'move': { const p=Object.keys(o.u).filter(t=>o.u[t]>0).map(t=>o.u[t]+' '+(o.u[t]>1?UNP[t]:UN[t]).toLowerCase()); return 'Mover '+p.join(', ')+': '+zname(Z[o.from])+' → '+zname(Z[o.to])+(o.via&&o.via.length?' → '+o.via.map(i=>zname(Z[i])).join(' → '):'')+' ('+(o.stance==='ataque'?'ataque':'paz')+')'; }
    case 'encounter': { const e=G.F[ME].enc; return e?((o.choice==='si'?(e.k==='amenaza'?'Pagar a ':'Aceptar a '):'Rechazar a ')+e.who.toLowerCase()+' en '+zname(Z[e.zone])):'Encuentro'; }
    case 'growmode': return zname(Z[o.zone])+': la comida que sobra va a '+(o.mode==='guardar'?'guardar':'crecer');
    case 'autospec': return zname(Z[o.zone])+': los que nazcan serán '+(o.to?UNP[o.to].toLowerCase():'pobladores');
    case 'route': return o.q?('Envío automático: '+(o.res==='food'?'comida':'producción')+' '+zname(Z[o.from])+' → '+zname(Z[o.to])+' ('+(o.q==='sobrante'?'todo el sobrante':o.q+' por paso')+')'):('Quitar el envío automático '+zname(Z[o.from])+' → '+zname(Z[o.to]));
    case 'annex': return 'Anexar la tribu de '+zname(Z[o.zone])+' (paga desde '+zname(Z[o.from])+')';
    case 'tribute': return 'Pagar el tributo a la tribu de '+zname(Z[o.tribe])+' desde '+zname(Z[o.from]);
    case 'ally': return o.off?'Romper la alianza':'Proponer o aceptar alianza con '+PLN[o.target].name;
  }
  return o.t;
}
