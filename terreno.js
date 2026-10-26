'use strict';
// Piezas SVG del terreno: árboles, montañas, casas, iglesia, tiendas.

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
  if(z.res) s+=`<g transform="translate(36,-13)"><circle r="6.5" fill="${RES[z.res].col}" stroke="${INK}" stroke-width="1"/><text class="zt" text-anchor="middle" y="3" font-size="8" font-weight="700" fill="#10181B">${RES[z.res].sc==='global'?'G':'L'}</text></g>`;
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
