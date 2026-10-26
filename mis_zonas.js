'use strict';
// Lista de las zonas del jugador.

function myZonesHTML(){
  const zs=zonesOf(G,ME); if(!zs.length) return '';
  let h='<h4>Mis zonas</h4><div class="mz">';
  zs.forEach(z=>{
    const sp=zspec(z); const us=z.units[ME]||[]; const c=us.filter(u=>UT[u.t].civ).length, m=us.length-c;
    h+=`<div class="mzr"><div class="mze">${emblemSVG(sp.sp,16,32)}</div><div class="mzt"><b>${esc(zname(z))}</b>${z.capital?' ★':''}<small>${esc(sp.lab)} · tam. ${z.size} · ${z.b.length}/${slotsOf(G,z)} edif.${z.proj.length?' · obra':''}${z.conflict?' · ⚔':''}</small><small>${c} civ · ${m} mil · 🌾${Math.floor(z.food)} ⚒${Math.floor(z.prod)}</small></div><button class="btn" data-act="gozone" data-id="${z.id}">Ver</button></div>`;
  });
  return h+'</div>';
}
