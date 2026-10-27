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
// Ayuda corta junto a un título: el símbolo ⓘ muestra el texto al pasar el mouse y lo abre con un clic
// (se recuerda abierto o cerrado). infoBtn va dentro del título; infoBody, justo debajo.
function infoOpen(key){ return !!(ui.det&&ui.det['i_'+key]); }
function infoBtn(key,html){
  const open=infoOpen(key), plain=html.replace(/<[^>]+>/g,'').replace(/"/g,'&quot;');
  return ` <button class="infob" data-act="fold" data-k="i_${key}" aria-expanded="${open}" aria-label="${open?'Ocultar ayuda':'Cómo funciona'}" title="${open?'Ocultar ayuda':plain}">ⓘ</button>`;
}
function infoBody(key,html){ return infoOpen(key)?`<div class="hint">${html}</div>`:''; }
function mine(z){ return z.owner===ME; }
function fm(n){ return Math.round(n*10)/10; }

function queuedMove(zid,t){ let n=0; ui.orders.forEach(o=>{ if(o.t==='move'&&o.from===zid) n+=(o.u[t]||0); }); return n; }
function queuedUnits(zid,t){ // unidades de ese tipo que ya tienen una orden de gasto
  let n=queuedMove(zid,t); ui.orders.forEach(o=>{ if(o.zone===zid&&o.t==='spec'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='train'&&o.from===t) n+=o.n; if(o.zone===zid&&o.t==='demob'&&o.u===t) n+=o.n; });
  return n;
}
// ---- Personas con rasgos: fichas, íconos y bordes ----
function traitEffect(x){
  const pct=Math.round(TRAIT_STEP*x.l*100);
  return x.k==='apt'?(x.l>0?'come '+pct+' % menos':'come '+(-pct)+' % más'):x.k==='sal'?((x.l>0?'+':'')+x.l+' ❤'):x.k==='fue'?((x.l>0?'+':'')+x.l+' ⚔'):((pct>0?'+':'')+pct+' %');
}
function traitText(x){ return TRAIT_INFO[x.k].n+' · '+TRAIT_EPI[x.k][x.l]+' ('+traitEffect(x)+')'; }
const traitScore=u=>(u.tr||[]).reduce((a,x)=>a+x.l,0);
// borde dorado si tiene un rasgo muy bueno, plateado si solo bueno
function traitBorder(u){ const m=Math.max(-9,...(u.tr||[]).map(x=>x.l)); return m>=2?'tg':m===1?'ts':''; }
// Apodos con humor corto para cada rasgo y nivel (no cambian nada del juego: solo se ven).
const TRAIT_EPI={
  agr:{'2':'Mano verde','1':'Buena mano','-1':'Torpe con el arado','-2':'Pulgar negro'},
  ing:{'2':'Manos de herrero','1':'Hábil','-1':'Manos de manteca','-2':'Peligro con el martillo'},
  com:{'2':'Lengua de oro','1':'Buen regateo','-1':'Regatea mal','-2':'Se deja timar'},
  cie:{'2':'Mente brillante','1':'Curioso','-1':'Distraído','-2':'Cabeza en las nubes'},
  apt:{'2':'Come como pajarito','1':'De poco comer','-1':'Buen diente','-2':'Barriga sin fondo'},
  sal:{'2':'Fuerte como un roble','1':'Robusto','-1':'Delicado','-2':'Enclenque'},
  fue:{'2':'Brazo de hierro','1':'Fornido','-1':'Flojo','-2':'Brazos de fideo'}
};
const FIRST_NAMES=['Inés','Tomás','Lupe','Marcos','Rosa','Beto','Elvira','Nico','Paloma','Ciro','Alba','Mateo','Irene','Hugo','Celia','Ramiro','Olga','Dante','Nora','Pablo','Julia','Saúl','Mara','Cleto'];
const personName=u=>FIRST_NAMES[(u.id*7+3)%FIRST_NAMES.length];
// insignia de un rasgo: disco con su ícono y puntitos de nivel (verde/dorado si es bueno, rojo/gris si es malo)
function traitBadge(x,big){
  const dots=Array.from({length:Math.abs(x.l)},()=>'<b></b>').join('');
  return `<span class="tb ${x.l>0?'p':'n'}${Math.abs(x.l)}${big?' big':''}"><i>${TRAIT_INFO[x.k].ic}</i><em>${dots}</em></span>`;
}
function traitChips(u){ return (u.tr||[]).map(x=>traitBadge(x)).join(''); }
// medallas del resumen de una zona: ★ = muy buenos, ☆ = buenos
function medalsHTML(list){ const g=list.filter(u=>traitBorder(u)==='tg').length, s=list.filter(u=>traitBorder(u)==='ts').length; return (g?`<span class="medal g" title="Con un rasgo muy bueno">★ ${g}</span>`:'')+(s?`<span class="medal s" title="Con un rasgo bueno">☆ ${s}</span>`:''); }
// Ficha de una persona: aparece al pasar el mouse (o tocar) sobre un token con data-id.
function personById(id){ for(const z of G.zones){ const us=z.units[ME]||[]; for(const u of us) if(u.id===id) return u; } return null; }
function fichaHTML(u){
  const best=(u.tr||[]).slice().sort((a,b)=>Math.abs(b.l)-Math.abs(a.l))[0];
  const rows=(u.tr||[]).map(x=>`<div class="fr ${x.l>0?'p':'n'}">${traitBadge(x,true)}<div><b>${TRAIT_EPI[x.k][x.l]}</b><small>${TRAIT_INFO[x.k].n}</small></div><span class="fe">${traitEffect(x)}</span></div>`).join('');
  return `<div class="fh">${uIcon(u.t,40)}<div><b>${personName(u)}</b><small>${UN[u.t].toLowerCase()}${best?' · «'+TRAIT_EPI[best.k][best.l].toLowerCase()+'»':''}</small></div></div>${rows}`;
}
let FICHA=null;
function fichaMove(e,el){ const r=el.getBoundingClientRect(); const w=FICHA.offsetWidth, h=FICHA.offsetHeight; let x=r.left+r.width/2-w/2, y=r.top-h-8; if(y<6) y=r.bottom+8; x=Math.max(6,Math.min(innerWidth-w-6,x)); FICHA.style.left=x+'px'; FICHA.style.top=y+'px'; }
document.addEventListener('mouseover',e=>{
  const t=e.target.closest&&e.target.closest('.token[data-id]'); if(!t||typeof G==='undefined'||!G) return;
  const u=personById(Number(t.dataset.id)); if(!u||!u.tr) return;
  if(!FICHA){ FICHA=document.createElement('div'); FICHA.id='ficha'; FICHA.setAttribute('role','tooltip'); document.body.appendChild(FICHA); }
  FICHA.innerHTML=fichaHTML(u); FICHA.classList.add('on'); fichaMove(e,t);
});
document.addEventListener('mouseout',e=>{ const t=e.target.closest&&e.target.closest('.token[data-id]'); if(t&&FICHA) FICHA.classList.remove('on'); });
document.addEventListener('dragstart',()=>{ if(FICHA) FICHA.classList.remove('on'); });
// Personas libres de un oficio (menos las ya elegidas para una orden), las mejores primero.
function availListQ(zid,t){
  const z=G.zones[zid]; const used=new Set(); let idq=0;
  ui.orders.forEach(o=>{ if(o.t==='spec'&&o.zone===zid&&o.from===t&&o.ids){ o.ids.forEach(i=>used.add(i)); idq+=o.n; } });
  const l=(z.units[ME]||[]).filter(u=>u.t===t&&u.w===0&&!u.busy&&!used.has(u.id));
  const other=Math.max(0,queuedUnits(zid,t)-idq);
  return l.slice(0,Math.max(0,l.length-other)).sort((a,b)=>traitScore(b)-traitScore(a));
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
    case 'wonder': return zname(Z[o.zone])+': construir '+(WONDERS[o.w]?WONDERS[o.w].n:'una Maravilla');
    case 'send': return 'Enviar '+o.q+' de '+(o.res==='food'?'comida':'producción')+': '+zname(Z[o.from])+' → '+zname(Z[o.to]);
    case 'move': { const p=Object.keys(o.u).filter(t=>o.u[t]>0).map(t=>o.u[t]+' '+(o.u[t]>1?UNP[t]:UN[t]).toLowerCase()); return 'Mover '+p.join(', ')+': '+zname(Z[o.from])+' → '+zname(Z[o.to])+(o.via&&o.via.length?' → '+o.via.map(i=>zname(Z[i])).join(' → '):'')+' ('+(o.stance==='ataque'?'ataque':'paz')+')'; }
    case 'encounter': { const e=G.F[ME].enc; { const oi=['a','b','c'].indexOf(o.choice); if(e&&e.opts&&oi>=0&&e.opts[oi]) return (e.story?'Historia: ':'Aceptar ')+'«'+e.opts[oi].lbl+'»'+(e.story?'':' de '+e.who.toLowerCase())+' en '+zname(Z[e.zone]); } return e?((o.choice==='si'?(e.k==='amenaza'?'Pagar a ':'Aceptar a '):'Rechazar a ')+e.who.toLowerCase()+' en '+zname(Z[e.zone])):'Encuentro'; }
    case 'growmode': return zname(Z[o.zone])+': la comida que sobra va a '+(o.mode==='guardar'?'guardar':'crecer');
    case 'bid': { const a=G.auction, it=a&&a.items[o.item]; return it?(o.amount?'Subasta: ofrecer '+o.amount+' de '+RN[a.cur]+' por '+AUCTION_CATS[it.cat]+' ('+AUCTION_TIERS[it.tier]+')':'Subasta: retirar la oferta por '+AUCTION_CATS[it.cat]):'Subasta'; }
    case 'pausebuild': return zname(Z[o.zone])+': '+(o.on?'pausar las obras (la producción se guarda)':'reanudar las obras');
    case 'autospec': return zname(Z[o.zone])+': los que nazcan serán '+(o.to?UNP[o.to].toLowerCase():'pobladores');
    case 'route': return o.q?('Envío automático: '+(o.res==='food'?'comida':'producción')+' '+zname(Z[o.from])+' → '+zname(Z[o.to])+' ('+(o.q==='sobrante'?'todo el sobrante':o.q+' por paso')+')'):('Quitar el envío automático '+zname(Z[o.from])+' → '+zname(Z[o.to]));
    case 'annex': return 'Anexar la tribu de '+zname(Z[o.zone])+' (paga desde '+zname(Z[o.from])+')';
    case 'tribute': return 'Pagar el tributo a la tribu de '+zname(Z[o.tribe])+' desde '+zname(Z[o.from]);
    case 'ally': return o.off?'Romper la alianza':'Proponer o aceptar alianza con '+PLN[o.target].name;
  }
  return o.t;
}
