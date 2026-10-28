'use strict';
// Dibuja el estado actual: barra de turno, mapa y panel.

function drawChips(){
  let h='';
  for(let f=0;f<G.N;f++){
    const F=G.F[f]; let st='',cls='';
    if(F.out&&!F.ghost) st='observador'; else if(F.out) st='fantasma'; else if(ui.ready[f]){ st='listo ✓'; cls='ok'; } else st=f===ME?'planeando…':'pensando…';
    const mark=cls==='ok'?'✓':(F.out?(F.ghost?'👻':'—'):'…');
    h+=`<span class="chip ${cls}" title="${PLN[f].name}${F.ally!==null?' ↔ '+PLN[F.ally].name:''}: ${st}"><span class="dot" style="background:${PLN[f].col}"></span>${f===ME?'Tú':''}<span class="st">${mark}</span></span>`;
  }
  $('chips').innerHTML=h;
  $('stepNo').textContent=G.step;
  { const y=Math.floor((G.step-1)/YEAR_STEPS)+1, m=MONTH_N[(G.step-1)%YEAR_STEPS]; $('calNote').textContent='· año '+y+', '+m; $('stepNo').parentElement.title='Cada paso es un mes; 12 pasos son un año. Paso '+G.step+': año '+y+', '+m+'.'; $('evChips').innerHTML=evChipsHTML(); }
  const rb=$('readyBtn'); rb.textContent=ui.ready[ME]?'Esperando… (cancelar)':'¡Listo!'; rb.disabled=G.over||(G.F[ME].out&&!G.F[ME].ghost);
  tween($('rGold'),Math.floor(G.F[ME].gold)); tween($('rTech'),Math.floor(G.F[ME].tech)); tween($('rZones'),zonesOf(G,ME).length); tween($('rPop'),totalPop(G,ME));
  const vn=victoryConds(G,ME).filter(c=>c.ok).length; const vp=$('vicCnt'); if(vp){ vp.textContent=vn; vp.parentElement.className='cnt vic'+(vn>=1?' on':''); }
}
function render(){ renderMap(); renderPanel(); }
function renderMap(){ if(ui.view==='terr'){ updateTerritory(); drawMini(); } else drawPlan(); drawChips(); }
function renderPanel(){
  const tabs={zona:panelZona,imperio:panelImperio,recursos:panelRecursos,tec:panelTech,vic:panelVictoria,hist:panelHistorial,ord:panelOrdenes};
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===ui.tab));
  { const sel=document.querySelector('.tabs button[aria-selected="true"]'); const tb=document.querySelector('.tabs'); if(sel&&tb&&tb.scrollWidth>tb.clientWidth) tb.scrollLeft=Math.max(0,sel.offsetLeft-tb.clientWidth/2+sel.offsetWidth/2); }   // si las pestañas no caben, la elegida queda a la vista
  if(typeof FICHA!=='undefined'&&FICHA) FICHA.classList.remove('on');
  const sc=$('tabBody').scrollTop; drawTabAlerts(); $('tabBody').innerHTML=alertBoxHTML(ui.tab)+tabs[ui.tab](); $('tabBody').scrollTop=sc;
  $('ordCount').textContent=ui.orders.length||'';
  $('encBar').innerHTML=encPillHTML(); encPopup();
  setTimeout(tutRender,0);
  $('sugBar').innerHTML='';
}
