'use strict';
// Piezas SVG del terreno: árboles, montañas, casas, iglesia, tiendas.

// Colores base y primitivas SVG (árboles, montañas, casas, iglesia, tiendas, personas).
const SOIL='#7A5237', SOIL2='#5E3E29', INK='#2c1f18';
const WALLS=['#EADBA9','#CDB77A','#A9BDC0','#E6C9A8'];
const HW=55, HH=31, DEPTH=14;
const f1=n=>Number(n).toFixed(1);

function tree(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-1.6" y="-8" width="3.2" height="9" fill="#6B4528" stroke="${INK}" stroke-width=".6"/><circle cx="0" cy="-13" r="8" fill="#3F7D4B" stroke="${INK}" stroke-width=".8"/><circle cx="-3" cy="-15" r="3.2" fill="#5E9A5A"/></g>`;}
function peak(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><polygon points="-15,0 0,-25 15,0" fill="#8C857C" stroke="${INK}" stroke-width=".8"/><polygon points="0,-25 15,0 5,0" fill="#6F6962"/><polygon points="-5,-17 0,-25 5,-17 2,-15 -1,-16.5" fill="#F4F1EA"/></g>`;}
function tuft(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-5 0 L-6 -7 M0 0 L0 -9 M5 0 L6 -7" stroke="#3F7D3B" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="0" cy="-10.5" r="1.8" fill="#E85D4A"/></g>`;}
function hill(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})"><ellipse rx="18" ry="9" cy="-3" fill="#B98A4E" stroke="${INK}" stroke-width=".8"/><path d="M-12 -6 Q0 -14 12 -6" stroke="#946B35" stroke-width="1.4" fill="none"/></g>`;}
function furrow(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})" stroke="#AE9F55" stroke-width="1.6" stroke-linecap="round"><path d="M-14 -2 L14 -2 M-14 3 L14 3 M-14 8 L14 8" fill="none"/></g>`;}
function reed(x,y,s=1){return `<g transform="translate(${x},${y}) scale(${s})" stroke="#3F7D3B" stroke-width="1.4" stroke-linecap="round"><path d="M-3 0 L-4 -9 M0 0 L0 -11 M3 0 L4 -9" fill="none"/><ellipse cx="0" cy="-11.5" rx="1.4" ry="2.4" fill="#6B4528" stroke="none"/></g>`;}
function house(x,y,roof,wall,w=15){
  const h=w*0.62;
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.5" rx="${w*0.62}" ry="2.4" fill="rgba(0,0,0,.22)"/><rect x="${-w/2}" y="${-h}" width="${w}" height="${h}" fill="${wall}" stroke="${INK}" stroke-width=".8"/><polygon points="${-w/2-2.4},${-h} 0,${-h-w*0.62} ${w/2+2.4},${-h}" fill="${roof}" stroke="${INK}" stroke-width=".9"/><rect x="${-w*0.12}" y="${-h*0.62}" width="${w*0.24}" height="${h*0.62}" fill="#6B4528"/><rect x="${w*0.22}" y="${-h*0.8}" width="${w*0.18}" height="${w*0.18}" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/></g>`;
}
function church(x,y,roof){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="2" rx="17" ry="4" fill="rgba(0,0,0,.25)"/><rect x="-16" y="-12" width="19" height="12" fill="#EFE7D2" stroke="${INK}" stroke-width=".9"/><polygon points="-18.5,-12 -6.5,-22 5.5,-12" fill="${roof}" stroke="${INK}" stroke-width=".9"/><rect x="2" y="-30" width="9" height="30" fill="#F3EEDF" stroke="${INK}" stroke-width=".9"/><polygon points="0.5,-30 6.5,-47 12.5,-30" fill="#3F5560" stroke="${INK}" stroke-width=".9"/><path d="M6.5 -47 L6.5 -54 M3.5 -51 L9.5 -51" stroke="${INK}" stroke-width="1.3"/><rect x="4.5" y="-24" width="4" height="7" rx="2" fill="#3F5560"/><rect x="-11" y="-9" width="3.5" height="6" rx="1.7" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/><rect x="-5" y="-9" width="3.5" height="6" rx="1.7" fill="#7DB6C2" stroke="${INK}" stroke-width=".4"/></g>`;
}
function tent(x,y,cloth){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.5" rx="13" ry="3" fill="rgba(0,0,0,.22)"/><polygon points="-13,0 0,-22 13,0" fill="${cloth}" stroke="${INK}" stroke-width=".9"/><polygon points="0,-22 13,0 5,0" fill="rgba(0,0,0,.18)"/><polygon points="-3.6,0 0,-9 3.6,0" fill="#3a2418"/><path d="M0 -22 L0 -28" stroke="${INK}" stroke-width="1"/><polygon points="0,-28 7,-26 0,-24" fill="#C8452F"/></g>`;
}
function totem(x,y){return `<g transform="translate(${x},${y})"><rect x="-3" y="-22" width="6" height="22" fill="#6B4528" stroke="${INK}" stroke-width=".7"/><rect x="-6" y="-17" width="12" height="3" fill="#C8452F"/><circle cx="0" cy="-24" r="3.4" fill="#E9C46A" stroke="${INK}" stroke-width=".7"/></g>`;}
function person(x,y,col,sold){
  return `<g transform="translate(${x},${y})"><ellipse cx="0" cy="1.4" rx="3.4" ry="1.1" fill="rgba(0,0,0,.28)"/><path d="M-2.8 0 L-1.8 -5.4 L1.8 -5.4 L2.8 0 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/><circle cx="0" cy="-7.6" r="2.3" fill="#F2CDA3" stroke="${INK}" stroke-width=".6"/>${sold?`<path d="M-2.5 -8.2 A2.5 2.5 0 0 1 2.5 -8.2 Z" fill="#6B7479" stroke="${INK}" stroke-width=".4"/><line x1="4.4" y1="1" x2="4.4" y2="-12" stroke="#3a2a20" stroke-width=".9"/><path d="M4.4 -12 l-1.1 2.4 h2.2 z" fill="#d8d8d8"/>`:''}</g>`;
}
function iconCiv(x,y,col){return `<g transform="translate(${x},${y})"><circle cx="0" cy="-3.6" r="2.3" fill="#F2CDA3" stroke="${INK}" stroke-width=".6"/><path d="M-3.2 3 L-2.2 -1.2 L2.2 -1.2 L3.2 3 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/></g>`;}
function iconSol(x,y,col){return `<g transform="translate(${x},${y})"><path d="M-3 -3.4 A3 3 0 0 1 3 -3.4 Z" fill="#6B7479" stroke="${INK}" stroke-width=".6"/><path d="M-3.2 3 L-2.2 -2.6 L2.2 -2.6 L3.2 3 Z" fill="${col}" stroke="${INK}" stroke-width=".6"/><line x1="5" y1="3" x2="5" y2="-7" stroke="#3a2a20" stroke-width=".9"/></g>`;}

const ANCH_EDGE=[[-36,-1],[36,-1],[0,-21]];
const ANCH_FREE=[[-28,-6],[26,-8],[-4,-16],[-12,8],[24,7]];
function decor(terr,anchors,n){
  let s=''; const A=anchors.slice(0,n);
  A.forEach(([x,y],i)=>{
    const sc=0.85+((i*37)%5)/20;
    if(terr==='mon') s+=peak(x,y+4,sc);
    else if(terr==='pra') s+=tuft(x,y+3,sc)+tuft(x+9,y+7,0.8);
    else if(terr==='bos') s+=tree(x,y+4,sc);
    else if(terr==='rio') s+=reed(x,y+3,sc);
    else if(terr==='col') s+=hill(x,y+5,sc);
    else s+=furrow(x,y+1,sc);
  });
  return s;
}
function riverBase(){
  return `<g clip-path="url(#dia)"><path d="M-70,-4 C-38,-24 -14,12 18,-2 S56,-16 70,8" stroke="#3C86A2" stroke-width="19" fill="none" stroke-linecap="round"/><path d="M-70,-4 C-38,-24 -14,12 18,-2 S56,-16 70,8" stroke="#5BA6C0" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M-50,-7 q6,-4 12,0 M-12,2 q6,-4 12,0 M24,-6 q6,-4 12,0" stroke="#E9F4F7" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
}



const TCOL = {mon:'#B3AB9F',pra:'#9DC764',bos:'#6FA064',rio:'#A4CB74',col:'#D8AE72',lla:'#E8DA92'};
const TERRFX = {
  mon:'Berserkers defensores: iniciativa 2. Ingenieros y pobladores: +1 de producción.',
  pra:'Caballeros defensores: iniciativa 0. Agricultores y pobladores: +1 de comida.',
  bos:'Arqueros atacantes: +1 de fuerza. Comerciantes: +1 de oro.',
  rio:'Arqueros defensores: +1 de fuerza. Comerciantes: +1 de oro.',
  col:'Berserkers atacantes: iniciativa 2. Ingenieros y pobladores construyen +1.',
  lla:'Caballeros atacantes: iniciativa 0. Científicos: +1 de tecnología.'
};
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function unitCounts(z,f){ const us=z.units[f]||[]; let c=0,m=0,w=0; us.forEach(u=>{ if(UT[u.t].civ) c++; else m++; if(u.w>0) w++; }); return {c,m,w}; }

/* z: zona del juego (o simulada para la galería) */
function tileSVG(z,o){
  o=o||{};
  const owner=z.owner;
  const roof=isPl(owner)?PLN[owner].col:(owner===TRIBE?PLN[TRIBE].col:'#8B7B6B');
  const wall=WALLS[(z.id||0)%WALLS.length];
  let s='<g>';
  s+=`<polygon points="${-HW},0 0,${HH} ${HW},0 ${HW},${DEPTH} 0,${HH+DEPTH} ${-HW},${DEPTH}" fill="${SOIL}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  s+=`<polygon points="0,${HH} ${HW},0 ${HW},${DEPTH} 0,${HH+DEPTH}" fill="${SOIL2}"/>`;
  s+=`<polygon points="0,${-HH} ${HW},0 0,${HH} ${-HW},0" fill="${TCOL[z.terrain]}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  if(z.terrain==='rio') s+=riverBase();
  if(z.role==='capital') s+=decor(z.terrain,ANCH_EDGE,3);
  else if(z.role==='tribu') s+=decor(z.terrain,ANCH_EDGE,2);
  else s+=decor(z.terrain,ANCH_FREE,z.terrain==='lla'?3:4);
  const fo=(z.units&&owner!==null&&owner!==undefined)?(z.units[owner]||[]):[];
  const civ=fo.filter(u=>UT[u.t].civ).length;
  if(z.role==='capital'){ s+=house(-26,5,roof,wall,15)+house(26,3,roof,WALLS[((z.id||0)+1)%4],14)+church(-4,6,roof); }
  else if(z.role==='tribu'){ const cloth=(owner===TRIBE||owner===null||owner===undefined)?PLN[TRIBE].col:PLN[owner].col; s+=tent(-15,6,cloth)+tent(15,4,cloth)+totem(0,-4); }
  else if(isPl(owner)&&civ>0){ const h=Math.min(3,Math.ceil(civ/3)); const P=[[-22,5],[22,3],[0,10]]; for(let i=0;i<h;i++) s+=house(P[i][0],P[i][1],roof,WALLS[((z.id||0)+i)%4],13); }
  if(z.b&&z.b.some(b=>b.t==='mar')){ s+=`<g transform="translate(0,-8)"><polygon points="-10,0 0,-26 10,0" fill="#E9C46A" stroke="${INK}" stroke-width="1"/><rect x="-12" y="0" width="24" height="4" fill="#C9A24A" stroke="${INK}" stroke-width=".8"/></g>`; }
  if(isPl(owner)) s+=`<polygon points="0,${-HH} ${HW},0 0,${HH} ${-HW},0" fill="none" stroke="${PLN[owner].col}" stroke-width="3.4" stroke-linejoin="round"/>`;
  else if(owner===TRIBE) s+=`<polygon points="0,${-HH} ${HW},0 0,${HH} ${-HW},0" fill="none" stroke="#5E3B24" stroke-width="2.2" stroke-dasharray="5 4" stroke-linejoin="round"/>`;
  zoneDeps(z).forEach((d,di)=>{ s+=`<g transform="translate(${36-di*15},-13)"><circle r="6.5" fill="${RES[d.k].col}" stroke="${d.tier==='oro'?'#E2B93B':INK}" stroke-width="${d.tier==='oro'?2:1}"/><text class="zt" text-anchor="middle" y="3" font-size="8" font-weight="700" fill="#10181B">${RES[d.k].sc==='global'?'G':'L'}</text></g>`; });
  if(!o.noUnits&&z.units){
    const fs=Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).sort((a,b)=>(a===owner?-1:0)-(b===owner?-1:0));
    if(fs.length){ const f=fs[0], col=PLN[f].col; const c=z.units[f].filter(u=>UT[u.t].civ).length, m=z.units[f].length-c;
      for(let i=0;i<Math.min(3,c);i++) s+=person(-27+i*7,14,col,false);
      for(let i=0;i<Math.min(3,m);i++) s+=person(9+i*8,14,col,true); }
  }
  if(z.conflict) s+=`<g transform="translate(0,-2)"><circle r="9" fill="#C8452F" stroke="${INK}" stroke-width="1"/><path d="M-5 -5 L5 5 M5 -5 L-5 5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></g>`;
  s+='</g>';
  return s;
}
function pillsSVG(z){
  let s='', y=HH+DEPTH+4;
  if(z.b&&z.b.length){
    const n=z.b.length, w=n*11+8;
    s+=`<g transform="translate(0,${y})"><rect x="${-w/2}" y="0" width="${w}" height="13" rx="4" fill="#2A1B16" stroke="#E6D9BF" stroke-width="1"/>`;
    z.b.forEach((b,i)=>{ const x=-w/2+5+i*11; s+=`<rect x="${x}" y="2.5" width="9" height="8" rx="1.5" fill="${BT[b.t].col}" stroke="#fff" stroke-width=".5"/><text class="zt" x="${x+4.5}" y="9" text-anchor="middle" font-size="6.5" font-weight="700" fill="${['hospital','almacen','molino','mercado','mar','camino'].includes(b.t)?'#1b1b1b':'#fff'}">${b.t==='mar'?'★':b.l}</text>`; });
    s+='</g>'; y+=15;
  }
  if(!z.units) return s;
  const fs=Object.keys(z.units).map(Number).filter(f=>z.units[f].length>0).sort((a,b)=>(a===z.owner?-1:0)-(b===z.owner?-1:0));
  fs.slice(0,3).forEach((f,i)=>{
    const k=unitCounts(z,f), col=PLN[f].col;
    s+=`<g transform="translate(0,${y+i*16})"><rect x="-34" y="0" width="68" height="14" rx="7" fill="#2A1B16" stroke="${col}" stroke-width="2"/>`;
    s+=iconCiv(-24,7,col)+`<text class="zt" x="-17" y="11" font-size="11" font-weight="700" fill="#FBF8F2">${k.c}</text>`;
    s+=iconSol(6,7,col)+`<text class="zt" x="14" y="11" font-size="11" font-weight="700" fill="#FBF8F2">${k.m}</text></g>`;
  });
  return s;
}
