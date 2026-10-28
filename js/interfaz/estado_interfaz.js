'use strict';
// Estado de la interfaz (qué zona está elegida, órdenes en cola, formularios) y edificios ilustrados.

const $ = id => document.getElementById(id);
let G=null, ui=null, tele=null;
const VB={w:1100,h:1060,cx:550,cy:560,sc:430};
function newUI(){
  return {sel:null,mv:null,tab:'zona',orders:[],ready:[],stepStart:Date.now(),botAt:[],auto:0,form:{},tf:{br:'Agricultura',avail:false,spine:false,impl:false,view:'ramas',branch:null,only:true,kind:'all'},zoom:100,view:'terr',zsub:'resumen',justTech:null,justCond:{},ordSig:'',miniSig:null};
}
function layoutBoard(){
  let dmin=9; const Z=G.zones;
  for(let i=0;i<Z.length;i++) for(let j=i+1;j<Z.length;j++){ const d=Math.hypot(Z[i].x-Z[j].x,Z[i].y-Z[j].y); if(d<dmin) dmin=d; }
  G.lay={s:Math.max(0.5,Math.min(1,dmin*VB.sc/128))};
}
function zx(z){ return VB.cx+z.x*VB.sc; }
function zy(z){ return VB.cy+z.y*VB.sc; }

function drawPlan(){
  const Z=G.zones, s=G.lay.s; let h='';
  h+=`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E9FB5"/><stop offset=".55" stop-color="#9ECFC0"/><stop offset="1" stop-color="#F4E7A6"/></linearGradient><clipPath id="dia"><polygon points="0,${-HH} ${HW},0 0,${HH} ${-HW},0"/></clipPath></defs>`;
  h+=`<rect x="-1800" width="4700" height="${VB.h}" fill="#C79F73"/><rect x="-1800" width="4700" height="250" fill="url(#sky)"/><rect x="-1800" y="240" width="1800" height="60" fill="#5E9650"/><rect x="1100" y="215" width="1800" height="85" fill="#5E9650"/>`;
  h+=`<path d="M0 252 Q130 150 320 222 T610 205 T930 195 T1100 220 L1100 285 L0 285Z" fill="#6FA85B" stroke="${INK}" stroke-width="1.2"/><path d="M0 285 Q200 215 440 258 T880 242 T1100 262 L1100 305 L0 305Z" fill="#5E9650" stroke="${INK}" stroke-width="1.2"/>`;
  h+=`<g transform="translate(550,56)"><rect x="-200" y="-28" width="400" height="56" rx="6" fill="#6B4528" stroke="${INK}" stroke-width="2"/><rect x="-192" y="-21" width="384" height="42" rx="4" fill="#D9B77A" stroke="#4A2F1B" stroke-width="1.2"/><text class="zt" text-anchor="middle" y="8" font-size="21" font-family="Palatino Linotype,Palatino,Georgia,serif" font-weight="700" fill="#3A2418" letter-spacing="1.5">LOS PASOS DEL IMPERIO</text></g>`;
  h+=`<ellipse cx="550" cy="600" rx="540" ry="450" fill="#BA8D62" stroke="${SOIL}" stroke-width="3"/><ellipse cx="550" cy="600" rx="518" ry="428" fill="none" stroke="#9C7249" stroke-width="2" stroke-dasharray="3 7"/>`;
  if(typeof MAPSTYLE!=='undefined'&&MAPSTYLE==='mesa') h+=`<pattern id="woodP" width="170" height="130" patternUnits="userSpaceOnUse"><rect width="170" height="130" fill="#6B4A2E"/><path d="M0 0v130M85 0v130" stroke="#4A301C" stroke-width="3"/><path d="M10 14c26-6 46 6 66 0M96 30c26 6 46-6 66 0M12 52c30 6 50-6 70 0M100 74c24-6 44 6 64 0M8 100c28 6 48-6 72 0M98 116c22-6 44 6 62 0" stroke="#7D5A38" stroke-width="1.6" fill="none" stroke-linecap="round"/></pattern><rect x="-1800" y="-600" width="4700" height="2600" fill="url(#woodP)"/><ellipse cx="550" cy="610" rx="548" ry="458" fill="#000" opacity=".35" transform="translate(0,10)"/><ellipse cx="550" cy="600" rx="545" ry="455" fill="#3B7355" stroke="${INK}" stroke-width="7"/><ellipse cx="550" cy="600" rx="515" ry="428" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3" stroke-dasharray="3 11" stroke-linecap="round"/>`;
  const E=G.map.e;
  E.forEach(([a,b])=>{ h+=`<line x1="${f1(zx(Z[a]))}" y1="${f1(zy(Z[a]))}" x2="${f1(zx(Z[b]))}" y2="${f1(zy(Z[b]))}" stroke="#7A5237" stroke-width="13" stroke-linecap="round"/>`; });
  E.forEach(([a,b])=>{ h+=`<line x1="${f1(zx(Z[a]))}" y1="${f1(zy(Z[a]))}" x2="${f1(zx(Z[b]))}" y2="${f1(zy(Z[b]))}" stroke="#E2C79B" stroke-width="8" stroke-linecap="round"/>`; });
  const sel=ui.sel!==null?Z[ui.sel]:null, canMove=sel&&(sel.units[0]||[]).length>0;
  [...Z].sort((a,b)=>a.y-b.y).forEach(z=>{
    const isSel=sel&&z.id===sel.id, isTarget=(ui.mv&&ui.mv.from===sel.id&&sel.adj.includes(z.id))||(!ui.mv&&canMove&&sel.adj.includes(z.id));
    const rn=z.role==='capital'?'Capital':z.role==='tribu'?'Tribu':'Zona libre', on=z.owner===null?'sin dueño':PLN[z.owner].name;
    h+=`<g class="zone" data-id="${z.id}" tabindex="0" role="button" aria-label="${zname(z)}, ${rn}, ${TERRN[z.terrain]}, dueño: ${on}" transform="translate(${f1(zx(z))},${f1(zy(z))}) scale(${f1(s)})">`;
    h+=`<polygon points="0,${-HH-30} ${HW+4},0 0,${HH+DEPTH+60} ${-HW-4},0" fill="transparent"/>`;
    h+=tileSVG(z)+pillsSVG(z);
    h+=`<text class="zt" text-anchor="middle" y="${-HH-14}" font-size="13" font-weight="700" fill="#2A1B16" stroke="#fff" stroke-width="3.5" paint-order="stroke">${esc(zname(z))}</text>`;
    if(isTarget) h+=`<polygon points="0,${-HH-3} ${HW+3},0 0,${HH+3} ${-HW-3},0" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-width="2.6" stroke-dasharray="6 5"/>`;
    if(ui.mv&&ui.mv.to===z.id) h+=`<polygon points="0,${-HH-5} ${HW+5},0 0,${HH+5} ${-HW-5},0" fill="none" stroke="#7CE0A0" stroke-width="4" stroke-linejoin="round"/>`;
    if(isSel) h+=`<polygon points="0,${-HH-4} ${HW+4},0 0,${HH+4} ${-HW-4},0" fill="none" stroke="#FFE27A" stroke-width="4.5" stroke-linejoin="round"/>`;
    h+='</g>';
  });
  $('worldP').innerHTML=h;
}

/* ---------- edificios ilustrados ---------- */
function bGlyph(bt,lvl,spin){
  const I=INK; let s='';
  switch(bt){
    case 'almacen': s=`<ellipse cx="0" cy="3" rx="22" ry="5" fill="rgba(0,0,0,.22)"/><rect x="-18" y="-22" width="36" height="24" fill="#B5844E" stroke="${I}" stroke-width="1.2"/><polygon points="-21,-22 0,-40 21,-22" fill="#7A4B2A" stroke="${I}" stroke-width="1.2"/><rect x="-8" y="-16" width="16" height="18" fill="#6B4528" stroke="${I}" stroke-width="1"/><path d="M-8,-16 L8,2 M8,-16 L-8,2" stroke="#E6C9A8" stroke-width="1.4"/>`; break;
    case 'camino': s=`<ellipse cx="0" cy="0" rx="26" ry="9" fill="#C9B189" stroke="${I}" stroke-width="1.2"/><ellipse cx="-9" cy="-1" rx="6" ry="2.6" fill="#E2D2B0"/><ellipse cx="7" cy="1.5" rx="7" ry="2.8" fill="#B79A6A"/><ellipse cx="12" cy="-3" rx="4" ry="1.8" fill="#E2D2B0"/><rect x="-2" y="-22" width="4" height="22" fill="#6B4528"/><polygon points="2,-22 16,-17 2,-12" fill="#C8452F" stroke="${I}" stroke-width=".8"/>`; break;
    case 'hospital': s=`<ellipse cx="0" cy="3" rx="22" ry="5" fill="rgba(0,0,0,.22)"/><rect x="-18" y="-24" width="36" height="26" fill="#F3EEDF" stroke="${I}" stroke-width="1.2"/><polygon points="-21,-24 0,-38 21,-24" fill="#5E8E8E" stroke="${I}" stroke-width="1.2"/><rect x="-3.5" y="-21" width="7" height="16" fill="#C8452F"/><rect x="-8" y="-16.5" width="16" height="7" fill="#C8452F"/>`; break;
    case 'cuartel': s=`<ellipse cx="0" cy="3" rx="24" ry="5" fill="rgba(0,0,0,.25)"/><rect x="-20" y="-22" width="40" height="24" fill="#8B3A2E" stroke="${I}" stroke-width="1.2"/><polygon points="-23,-22 0,-34 23,-22" fill="#4A2A24" stroke="${I}" stroke-width="1.2"/><rect x="-6" y="-14" width="12" height="16" fill="#2A1B16"/><rect x="14" y="-50" width="2.4" height="30" fill="#3a2a20"/><polygon points="16,-50 32,-45 16,-40" class="flag" fill="#C8452F" stroke="${I}" stroke-width=".8"/><path d="M-14,-12 L-8,-6 M-8,-12 L-14,-6" stroke="#E6C9A8" stroke-width="1.4"/>`; break;
    case 'fort': s=`<ellipse cx="0" cy="3" rx="22" ry="5" fill="rgba(0,0,0,.25)"/><rect x="-16" y="-34" width="32" height="36" fill="#8C857C" stroke="${I}" stroke-width="1.2"/><path d="M-16,-34 v-6 h6 v6 h6 v-6 h8 v6 h6 v-6 h6 v6" fill="#8C857C" stroke="${I}" stroke-width="1.1"/><rect x="-4" y="-22" width="8" height="24" rx="4" fill="#2A1B16"/><path d="M-12,-26 h24 M-12,-14 h24" stroke="#6F6962" stroke-width="1"/>`; break;
    case 'molino': s=`<ellipse cx="0" cy="3" rx="18" ry="4" fill="rgba(0,0,0,.22)"/><polygon points="-12,2 12,2 8,-34 -8,-34" fill="#E8DDB8" stroke="${I}" stroke-width="1.2"/><polygon points="-10,-34 0,-46 10,-34" fill="#A5502E" stroke="${I}" stroke-width="1.2"/><g transform="translate(0,-30)"><g class="${spin===false?'':'blades'}"><path d="M0,0 L-6,-30 L6,-30 Z M0,0 L30,-6 L30,6 Z M0,0 L6,30 L-6,30 Z M0,0 L-30,6 L-30,-6 Z" fill="#F3EEDF" stroke="${I}" stroke-width="1"/></g><circle r="3.2" fill="#3a2a20"/></g>`; break;
    case 'taller': s=`<ellipse cx="0" cy="3" rx="22" ry="5" fill="rgba(0,0,0,.22)"/><rect x="-18" y="-20" width="36" height="22" fill="#B98A66" stroke="${I}" stroke-width="1.2"/><polygon points="-21,-20 0,-32 21,-20" fill="#7A4B2A" stroke="${I}" stroke-width="1.2"/><rect x="9" y="-40" width="7" height="16" fill="#8C857C" stroke="${I}" stroke-width="1"/><circle class="smoke" cx="12.5" cy="-44" r="3.4" fill="rgba(220,220,220,.8)"/><circle class="smoke s2" cx="14" cy="-50" r="2.8" fill="rgba(220,220,220,.7)"/><path d="M-14,-4 h12 l-3,-5 h-6 z" fill="#3a3f45" stroke="${I}" stroke-width=".8"/>`; break;
    case 'mercado': s=`<ellipse cx="0" cy="3" rx="24" ry="5" fill="rgba(0,0,0,.2)"/><rect x="-18" y="-14" width="36" height="14" fill="#B5844E" stroke="${I}" stroke-width="1.1"/><path d="M-22,-30 h44 l-4,16 h-36 z" fill="#E0A21B" stroke="${I}" stroke-width="1.1"/><path d="M-14,-30 l-1,16 M-4,-30 l0,16 M6,-30 l1,16 M16,-30 l2,16" stroke="#C8452F" stroke-width="3"/><circle cx="-8" cy="-7" r="3.4" fill="#C8452F"/><circle cx="4" cy="-7" r="3.4" fill="#9DC764"/><circle cx="13" cy="-7" r="3.4" fill="#E9C46A"/>`; break;
    case 'biblio': s=`<ellipse cx="0" cy="3" rx="24" ry="5" fill="rgba(0,0,0,.2)"/><rect x="-20" y="-22" width="40" height="24" fill="#EFE7D2" stroke="${I}" stroke-width="1.2"/><polygon points="-24,-22 0,-38 24,-22" fill="#5B7FA6" stroke="${I}" stroke-width="1.2"/><path d="M-14,-20 v22 M-5,-20 v22 M5,-20 v22 M14,-20 v22" stroke="#C9BFA0" stroke-width="3"/><circle cx="0" cy="-27" r="3.4" fill="#F3EEDF" stroke="${I}" stroke-width=".8"/>`; break;
    case 'mar': s=`<ellipse cx="0" cy="4" rx="34" ry="8" fill="rgba(0,0,0,.28)"/><polygon points="-26,2 26,2 20,-10 -20,-10" fill="#C9A24A" stroke="${I}" stroke-width="1.2"/><polygon points="-14,-10 14,-10 9,-24 -9,-24" fill="#D9B45A" stroke="${I}" stroke-width="1.2"/><polygon points="-9,-24 9,-24 0,-62" fill="#E9C46A" stroke="${I}" stroke-width="1.2"/><circle class="glow" cx="0" cy="-66" r="5" fill="#FFF3B0" stroke="#E9C46A" stroke-width="1.5"/>`; break;
  }
  if(lvl>0&&bt!=='mar'){ let st=''; for(let i=0;i<lvl;i++) st+=`<circle cx="${(i-(lvl-1)/2)*8}" cy="11" r="2.8" fill="#FFE27A" stroke="${INK}" stroke-width=".7"/>`; s+=st; }
  return s;
}
const SLOT_POS=[[-100,28],[100,28],[-52,70],[52,70],[0,92],[-120,-18],[120,-18],[0,-70],[-72,-62],[72,-62]];
