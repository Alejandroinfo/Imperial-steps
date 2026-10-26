'use strict';
// Flujo de la partida: empezar, ¡Listo!, resolver el paso, fin y telemetría.

function startGame(){
  const mi=Number($('selMap').value), N=Number($('selN').value), thr=$('selThr').value;
  const q=new URLSearchParams(location.search).get('seed'); const seed=q?Number(q):Math.floor(Math.random()*1e9);
  G=newGame(mi,N,seed,thr); G.mapIdx=mi; layoutBoard(); ui=newUI(); tele={ready:[],orders:[]};
  if($('dlgEnd').open) $('dlgEnd').close();
  buildWorld(); buildTerritoryDOM(); setViewMode('terr',true);
  beginStep(); render();
  const mc=myCapital(); fitAll(0);
  setTimeout(()=>{ flyTo(sx(mc),sy(mc)+30,840,FXS.on?1500:0); },FXS.on?350:0);
  const sm=$('startMsg'); sm.innerHTML=`<b>Aquí empiezas</b><div>Tu capital es <b>${esc(zname(G.zones[mc]))}</b> (borde rojo). Arrastra el mapa para recorrerlo, usa la rueda para acercar o el minimapa para saltar.</div>`; sm.className='startmsg show'; clearTimeout(sm._t); sm._t=setTimeout(()=>{ sm.className='startmsg'; },7000);
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
  ui.stepStart=now; ui.orders=[]; ui.mv=null;
  for(let f=1;f<G.N;f++) ui.botAt[f]=now+700+Math.floor(Math.random()*3000);
}
function toggleReady(){
  if(G.over||(G.F[ME].out&&!G.F[ME].ghost)) return;
  if(!ui.ready[ME]) tele.ready.push(Date.now()-ui.stepStart); else tele.ready.pop();
  ui.ready[ME]=!ui.ready[ME]; render(); checkAll();
}
function checkAll(){
  if(G.over) return;
  for(let f=0;f<G.N;f++){ if(!ui.ready[f]) return; }
  finishStep();
}
function finishStep(){
  const orders=ui.orders.map(o=>Object.assign({f:ME},o));
  for(let f=1;f<G.N;f++) botOrders(G,f).forEach(o=>orders.push(o));
  tele.orders.push(ui.orders.length);
  const before=[...Array(G.N).keys()].map(f=>victoryConds(G,f));
  const prev={gold:Math.floor(G.F[ME].gold),tech:Math.floor(G.F[ME].tech)};
  resolveStep(G,orders);
  recomputeMods(G);
  if(ui.sel!==null&&!G.zones[ui.sel]) ui.sel=null;
  if(G.over){ render(); playFx(G.fx,before); showEnd(); return; }
  beginStep(); render(); playFx(G.fx,before);
}
function showEnd(){
  const w=G.winner, me=w.includes(ME);
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
  for(let f=1;f<G.N;f++){ if(!ui.ready[f]&&now>=ui.botAt[f]){ ui.ready[f]=true; ch=true; } }
  if(G.F[ME].out&&!G.F[ME].ghost&&!ui.ready[ME]){ ui.ready[ME]=true; ch=true; }
  if(ui.auto>0&&!ui.ready[ME]&&!(G.F[ME].out&&!G.F[ME].ghost)){
    ui.orders=botOrders(G,ME).map(o=>{ const c=Object.assign({},o); delete c.f; return c; });
    ui.auto--; ui.ready[ME]=true; tele.ready.push(now-ui.stepStart); ch=true;
  }
  if(ch){ drawChips(); checkAll(); }
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
