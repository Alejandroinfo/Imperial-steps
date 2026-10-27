'use strict';
// En línea (js/red/multijugador.js) el anfitrión resuelve y los demás reciben el resultado.
// Flujo de la partida: empezar, ¡Listo!, resolver el paso, fin y telemetría.

// cfg (opcional) llega de la sala en línea: {mapIdx, N, seed, thr}. Sin cfg se usan los menús.
function startGame(cfg){
  let mi,N,seed,thr;
  if(cfg){ mi=cfg.mapIdx; N=cfg.N; seed=cfg.seed; thr=cfg.thr; }
  else {
    mi=Number($('selMap').value); N=Number($('selN').value); thr=$('selThr').value;
    const q=new URLSearchParams(location.search).get('seed'); seed=q?Number(q):Math.floor(Math.random()*1e9);
  }
  G=newGame(mi,N,seed,thr); G.mapIdx=mi; layoutBoard(); ui=newUI(); tele={ready:[],orders:[]};
  if($('dlgEnd').open) $('dlgEnd').close();
  buildWorld(); buildTerritoryDOM(); setViewMode('terr',true);
  const mc=myCapital(); ui.sel=mc; ui.zsub='resumen';
  beginStep(); render();
  fitAll(0);
  setTimeout(()=>{ flyTo(sx(mc),sy(mc)+30,840,FXS.on?1500:0); },FXS.on?350:0);
  const sm=$('startMsg'); sm.innerHTML=`<b>Aquí empiezas</b><div>Tu capital es <b>${esc(zname(G.zones[mc]))}</b> (borde ${ME===0?'rojo':'de tu color'}). Arrastra el mapa para recorrerlo, usa la rueda para acercar o el minimapa para saltar.</div>`; sm.className='startmsg show'; clearTimeout(sm._t); sm._t=setTimeout(()=>{ sm.className='startmsg'; },7000);
}
function setViewMode(v,quiet){
  ui.view=v; $('cam').classList.toggle('hide',v!=='terr'); $('plan').classList.toggle('hide',v!=='plan'); $('mini').classList.toggle('hide',v!=='terr');
  $('vTerr').setAttribute('aria-pressed',v==='terr'); $('vPlan').setAttribute('aria-pressed',v==='plan');
  if(v==='terr') resizeView();
  if(!quiet) render();
}
function beginStep(){
  recomputeMods(G); const now=Date.now();
  ui.ready=[]; for(let f=0;f<G.N;f++) ui.ready.push(false);
  ui.stepStart=now; ui.orders=[]; ui.mv=null; ui.sugI=0;
  const enc=G.F[ME].enc; if(enc&&ui.encSeen!==enc.step){ ui.encSeen=enc.step; sfxLater(enc.k==='amenaza'?'warn':'encounter',2200,0); }
  for(let f=0;f<G.N;f++) if(isBotSeat(f)) ui.botAt[f]=now+700+Math.floor(Math.random()*3000);
  if(typeof tutOnStep==='function') tutOnStep();
}
// Un asiento lo juega un bot si no es el de esta pantalla ni el de otra persona de la sala en línea.
function isBotSeat(f){ return f!==ME && !(NET.on && NET.humans.includes(f)); }
// Quién resuelve los pasos: el juego local o el anfitrión de la sala. Los demás solo reciben el resultado.
function isAuthority(){ return !NET.on || NET.host; }
function toggleReady(){
  if(G.over||(G.F[ME].out&&!G.F[ME].ghost)) return;
  if(!ui.ready[ME]) tele.ready.push(Date.now()-ui.stepStart); else tele.ready.pop();
  setMyReady(!ui.ready[ME]);
}
function setMyReady(v,quiet){
  ui.ready[ME]=v; if(!quiet) sfx(v?'ready':'unready'); render();
  if(!isAuthority()){ netSendReady(v); return; }   // en línea, el anfitrión junta las órdenes
  netBroadcastReady(); checkAll();
}
function checkAll(){
  if(G.over||!isAuthority()) return;
  for(let f=0;f<G.N;f++){ if(!ui.ready[f]) return; }
  finishStep();
}
function finishStep(){
  const orders=ui.orders.map(o=>Object.assign({f:ME},o));
  for(let f=0;f<G.N;f++){
    if(f===ME) continue;
    if(isBotSeat(f)) botOrders(G,f).forEach(o=>orders.push(o));
    else netOrdersOf(f).forEach(o=>orders.push(o));   // órdenes de las otras personas de la sala
  }
  tele.orders.push(ui.orders.length);
  const before=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  const prev={gold:Math.floor(G.F[ME].gold),tech:Math.floor(G.F[ME].tech)};
  resolveStep(G,orders); sfx('step');
  recomputeMods(G);
  if(ui.sel!==null&&!G.zones[ui.sel]) ui.sel=null;
  netSendState();   // en línea, el anfitrión manda el paso resuelto a todos
  if(G.over){ render(); playFx(G.fx,before); showEnd(); return; }
  beginStep(); render(); playFx(G.fx,before);
}
function showEnd(){
  const w=G.winner, me=w.includes(ME);
  sfxLater(me?'victory':'defeat',600,0); if(me) confetti();
  $('endTitle').textContent=me?'¡Ganaste!':(w.length?PLN[w[0]].name+' ganó':'Fin de la partida');
  const avg=tele.ready.length?Math.round(tele.ready.reduce((a,b)=>a+b,0)/tele.ready.length/1000):0;
  const ord=tele.orders.length?(tele.orders.reduce((a,b)=>a+b,0)/tele.orders.length).toFixed(1):'0';
  const all=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  let t='<table class="vt"><tr><th></th>'+all.map((a,f)=>`<th style="color:${PLN[f].col}">${PLN[f].name}</th>`).join('')+'</tr>';
  all[0].forEach((c,i)=>{ t+=`<tr><td>${c.k}</td>`+all.map(a=>`<td class="${a[i].ok?'ok':''}">${a[i].ok?'✓':a[i].v}</td>`).join('')+'</tr>'; });
  t+='</table>';
  $('endBody').innerHTML=`<p>La partida duró <b>${G.step-1} pasos</b>.</p>${t}<p class="hint">Lo que mediría el juego para decidir el reloj: tardaste en promedio <b>${avg} s</b> en dar "Listo" y diste en promedio <b>${ord} órdenes</b> por paso. Tecnologías desarrolladas por ti: ${Object.keys(G.F[ME].techs).length}.</p>`;
  $('dlgEnd').showModal();
}
function tick(){
  if(!G||G.over) return;
  const now=Date.now(); $('clock').textContent=Math.round((now-ui.stepStart)/1000)+' s';
  let ch=false;
  if(isAuthority()){
    for(let f=0;f<G.N;f++){
      if(ui.ready[f]) continue;
      if(isBotSeat(f)&&now>=ui.botAt[f]){ ui.ready[f]=true; ch=true; }
      else if(f!==ME&&G.F[f].out&&!G.F[f].ghost){ ui.ready[f]=true; ch=true; }   // eliminado sin fantasma: solo mira
    }
  }
  if(G.F[ME].out&&!G.F[ME].ghost&&!ui.ready[ME]){ setMyReady(true,true); return; }
  if(ui.auto>0&&!ui.ready[ME]&&!(G.F[ME].out&&!G.F[ME].ghost)){
    ui.orders=botOrders(G,ME).map(o=>{ const c=Object.assign({},o); delete c.f; return c; });
    ui.auto--; tele.ready.push(now-ui.stepStart); setMyReady(true,true); return;
  }
  if(ch){ drawChips(); netBroadcastReady(); checkAll(); }
}
function buildGallery(){
  const rows=[['Zona libre',()=>({role:'vacia',owner:null,units:{}})],['Zona poblada (jugador)',i=>({role:'vacia',owner:0,units:{0:Array.from({length:6},()=>({t:'pob',w:0}))}})],['Tribu',()=>({role:'tribu',owner:TRIBE,units:{4:[{t:'agr',w:0},{t:'sol',w:0}]}})],['Capital con edificios',()=>({role:'capital',owner:1,units:{1:Array.from({length:6},(_,i)=>({t:i<4?'pob':'sol',w:0}))},b:[{t:'molino',l:2},{t:'cuartel',l:1},{t:'fort',l:3}]})]];
  let h='';
  rows.forEach(([name,mk])=>{
    h+=`<div class="rl">${name}</div>`;
    Object.keys(TERRN).forEach((t,i)=>{ const z=Object.assign({id:i,terrain:t,conflict:false},mk(i)); h+=`<div><svg viewBox="-66 -52 132 108" aria-label="${name} en ${TERRN[t]}"><defs><clipPath id="dia"><polygon points="0,${-HH} ${HW},0 0,${HH} ${-HW},0"/></clipPath></defs>${tileSVG(z)}</svg><div class="cl">${TERRN[t]}</div></div>`; });
  });
  $('galGrid').innerHTML=h;
}
