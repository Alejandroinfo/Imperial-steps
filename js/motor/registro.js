// @ts-check
'use strict';
// Registro de la partida (para descargar): datos y texto legibles. Función pura: lee el estado, no toca la pantalla.
// Sirve para repasar una partida, compartirla o analizar el ritmo (tiempo hasta ¡Listo! y órdenes por paso).

/**
 * @param {Partida} g
 * @param {{ready:number[],orders:number[]}|null} [tele] telemetría de la persona que juega (ms hasta ¡Listo! y órdenes por paso)
 */
function gameLogData(g,tele){
  const conds=[...Array(g.N).keys()].map(f=>victoryConds(g,f).map(c=>({condicion:c.k,valor:c.v,meta:c.t,cumple:!!c.ok})));
  return {
    juego:'Los Pasos del Imperio',
    generado:new Date().toISOString(),
    mapa:{indice:g.mapIdx,nombre:DATA.maps[g.mapIdx].name},
    jugadores:[...Array(g.N).keys()].map(f=>({id:f,nombre:PLN[f].name,eliminado:!!g.F[f].out})),
    semilla:g.seed, modo:g.thr, pasosJugados:g.step-1, terminada:!!g.over,
    ganadores:(g.winner||[]).map(f=>PLN[f].name),
    condicionesFinales:conds,
    historial:(g.hist||[]).map(h=>({paso:h.step,evento:h.ev?EVT[h.ev].n:null,lineas:h.lines.slice()})),
    telemetria:tele?{msHastaListo:tele.ready.slice(),ordenesPorPaso:tele.orders.slice()}:null
  };
}
/** Lo mismo en texto plano, para leerlo de corrido. @param {Partida} g */
function gameLogText(g,tele){
  const d=gameLogData(g,tele);
  const L=[`${d.juego} — registro de la partida`,`Mapa: ${d.mapa.nombre} · ${d.jugadores.length} jugadores (${d.jugadores.map(j=>j.nombre).join(', ')}) · modo ${d.modo} · semilla ${d.semilla}`,
    `Pasos jugados: ${d.pasosJugados}`+(d.terminada?` · ganó: ${d.ganadores.join(', ')||'nadie'}`:' · partida sin terminar'),'','Condiciones de victoria al final:'];
  d.condicionesFinales[0].forEach((c,i)=>L.push('  '+c.condicion+': '+d.jugadores.map((j,f)=>j.nombre+' '+(d.condicionesFinales[f][i].cumple?'✓':d.condicionesFinales[f][i].valor)).join(' · ')));
  if(d.telemetria&&d.telemetria.ordenesPorPaso.length){ const r=d.telemetria.msHastaListo, o=d.telemetria.ordenesPorPaso;
    L.push('',`Telemetría: ${r.length?Math.round(r.reduce((a,b)=>a+b,0)/r.length/1000):0} s en promedio hasta ¡Listo! y ${(o.reduce((a,b)=>a+b,0)/o.length).toFixed(1)} órdenes por paso.`); }
  L.push('','Historial:');
  d.historial.forEach(h=>{ L.push('',`Paso ${h.paso}`+(h.evento?` · ${h.evento}`:'')); h.lineas.forEach(l=>L.push('  '+l)); });
  return L.join('\n')+'\n';
}
