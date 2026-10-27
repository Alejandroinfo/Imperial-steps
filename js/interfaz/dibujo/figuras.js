'use strict';
// Figuras de cada oficio y cada tropa.

const JOBC = {pob:'#B8A58A',agr:'#8DB04A',ing:'#7C8791',cie:'#F4F1EA',com:'#8E4A8E'};
/* fig(): personaje con base en (x,y), ~16 unidades de alto. col = color del jugador. quiet = sin animaciones (íconos) */
function fig(t,x,y,col,s,quiet,ring){
  s=s||1; const I=INK, skin='#F2CDA3'; const an=c=>quiet?'':` class="${c}"`;
  let g=`<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">`;
  if(t==='ari'){
    g+=`<ellipse cx="0" cy="2" rx="10" ry="2.4" fill="rgba(0,0,0,.28)"/><rect x="-8" y="-6" width="16" height="6" fill="#8A5A3A" stroke="${I}" stroke-width=".7"/><circle cx="-5" cy="1" r="2.6" fill="#5E3E29" stroke="${I}" stroke-width=".6"/><circle cx="5" cy="1" r="2.6" fill="#5E3E29" stroke="${I}" stroke-width=".6"/><rect x="-11" y="-5" width="21" height="3.4" fill="#B5844E" stroke="${I}" stroke-width=".6"/><polygon points="10,-5.4 14,-3.3 10,-1.2" fill="#9AA0A6" stroke="${I}" stroke-width=".6"/><rect x="-8" y="-9" width="9" height="3" fill="${col}" stroke="${I}" stroke-width=".5"/>`;
    return g+'</g>';
  }
  if(t==='lan'){
    g+=`<ellipse cx="0" cy="2" rx="10" ry="2.4" fill="rgba(0,0,0,.28)"/><rect x="-9" y="-3" width="18" height="3" fill="#8A5A3A" stroke="${I}" stroke-width=".6"/><circle cx="-6" cy="1" r="2.4" fill="#5E3E29" stroke="${I}" stroke-width=".6"/><circle cx="6" cy="1" r="2.4" fill="#5E3E29" stroke="${I}" stroke-width=".6"/><path d="M-2,-3 L-6,-13 M-2,-3 L2,-13" stroke="#B5844E" stroke-width="1.6" fill="none"/><g${an('catap')}><path d="M-3,-4 L8,-12" stroke="#8A5A3A" stroke-width="1.8"/><circle cx="8.6" cy="-12.4" r="2.4" fill="#8C857C" stroke="${I}" stroke-width=".6"/></g><rect x="-9" y="-6" width="5" height="2.6" fill="${col}" stroke="${I}" stroke-width=".5"/>`;
    return g+'</g>';
  }
  g+=`<ellipse cx="0" cy="1.4" rx="3.6" ry="1.2" fill="rgba(0,0,0,.28)"/>`;
  if(ring) g+=`<ellipse cx="0" cy="-4.6" rx="5.6" ry="9.4" fill="none" stroke="${ring==='tg'?'#E2B93B':'#C3CAD1'}" stroke-width="${ring==='tg'?1.3:0.9}" opacity=".95"/>`;
  const mil=!!UT[t]&&!UT[t].civ;
  const bodyCol=mil?col:JOBC[t];
  // acceso trasero (sacos, arcos)
  if(t==='com') g+=`<circle cx="-3.6" cy="-5" r="2.8" fill="#A9794A" stroke="${I}" stroke-width=".5"/>`;
  if(t==='arq') g+=`<path d="M-5,-12 Q-9,-6 -5,0" stroke="#8A5A3A" stroke-width="1" fill="none"/><line x1="-5" y1="-12" x2="-5" y2="0" stroke="#ddd" stroke-width=".3"/>`;
  // cuerpo
  g+=`<path d="M-2.8 0 L-1.8 -5.4 L1.8 -5.4 L2.8 0 Z" fill="${bodyCol}" stroke="${I}" stroke-width=".6"/>`;
  // banda del jugador (quién es el dueño)
  g+=`<rect x="-2.1" y="-4.9" width="4.2" height="1.5" fill="${col}"/>`;
  // cabeza
  g+=`<circle cx="0" cy="-7.6" r="2.3" fill="${skin}" stroke="${I}" stroke-width=".6"/>`;
  switch(t){
    case 'agr': g+=`<ellipse cx="0" cy="-9.4" rx="4.6" ry="1.2" fill="#E3C46A" stroke="${I}" stroke-width=".4"/><path d="M-2.4,-9.5 A2.4,2.4 0 0 1 2.4,-9.5 Z" fill="#E3C46A" stroke="${I}" stroke-width=".4"/><g${an('wk-agr')}><line x1="3.4" y1="-3" x2="6.2" y2="-11" stroke="#6B4528" stroke-width=".9"/><path d="M6.2,-11 l2.6,.6 l-.4,1.6 z" fill="#9AA0A6" stroke="${I}" stroke-width=".3"/></g><path d="M-4.4,-1 q-.8,-3 0,-5 M-5.6,-1 q-.8,-3 0,-5" stroke="#E3C46A" stroke-width=".7" fill="none"/>`; break;
    case 'ing': g+=`<path d="M-2.6,-8.4 A2.6,2.6 0 0 1 2.6,-8.4 Z" fill="#E0A21B" stroke="${I}" stroke-width=".4"/><circle cx="0" cy="-2.6" r="1.1" fill="none" stroke="#fff" stroke-width=".7"/><g${an('wk-ing')}><line x1="3.4" y1="-3" x2="6.4" y2="-10" stroke="#6B6F73" stroke-width="1"/><circle cx="6.6" cy="-10.6" r="1.5" fill="none" stroke="#6B6F73" stroke-width=".9"/></g>`; break;
    case 'cie': g+=`<circle cx="-.9" cy="-7.8" r=".95" fill="none" stroke="${I}" stroke-width=".35"/><circle cx=".9" cy="-7.8" r=".95" fill="none" stroke="${I}" stroke-width=".35"/><g${an('wk-cie')}><path d="M3.4,-4 l-1.2,3.4 h4.8 l-1.2,-3.4 z" fill="#5BA6E0" stroke="${I}" stroke-width=".4"/><rect x="3.6" y="-6.4" width="1.6" height="2.4" fill="#cfe7f7" stroke="${I}" stroke-width=".3"/><circle class="bub" cx="4.4" cy="-8" r=".7" fill="#9BD0F2"/><circle class="bub b2" cx="5.4" cy="-9.4" r=".5" fill="#9BD0F2"/></g>`; break;
    case 'com': g+=`<path d="M-2.4,-8.6 A2.4,2.4 0 0 1 2.4,-8.6 Z" fill="#C8452F" stroke="${I}" stroke-width=".4"/><rect x="-1" y="-9.9" width="3.8" height=".9" fill="#C8452F"/><g${an('wk-com')}><circle cx="4.6" cy="-5.2" r="1.7" fill="#E9C46A" stroke="${I}" stroke-width=".4"/><text x="4.6" y="-4.4" text-anchor="middle" font-size="2.4" font-weight="700" fill="#8A6A10" class="zt">$</text></g>`; break;
    case 'sol': g+=`<path d="M-2.6,-8.4 A2.6,2.6 0 0 1 2.6,-8.4 Z" fill="#6B7479" stroke="${I}" stroke-width=".4"/><line x1="4.4" y1="1" x2="4.4" y2="-13" stroke="#3a2a20" stroke-width=".9"/><path d="M4.4,-13 l-1.1,2.4 h2.2 z" fill="#d8d8d8" stroke="${I}" stroke-width=".3"/>`; break;
    case 'arq': g+=`<path d="M-2.8,-8 L0,-12.6 L2.8,-8 Z" fill="#4F7F3F" stroke="${I}" stroke-width=".4"/><line x1="2" y1="-4" x2="7" y2="-6.4" stroke="#3a2a20" stroke-width=".6"/><path d="M7,-6.4 l-1.6,-.2 l.3,1.2 z" fill="#d8d8d8"/>`; break;
    case 'cab': g+=`<path d="M-2.6,-8.4 A2.6,2.6 0 0 1 2.6,-8.4 Z" fill="#6B7479" stroke="${I}" stroke-width=".4"/><path d="M0,-10.8 q3,-2 4.2,1" stroke="#C8452F" stroke-width="1.2" fill="none" stroke-linecap="round"/><line x1="3.6" y1="1" x2="9" y2="-14" stroke="#3a2a20" stroke-width=".8"/><polygon points="9,-14 11,-15.6 10.6,-13" fill="${col}"/><path d="M-2.8,-5 q-3,3 -2,5" stroke="${col}" stroke-width="1.8" fill="none"/>`; break;
    case 'esc': g+=`<path d="M-2.6,-8.4 A2.6,2.6 0 0 1 2.6,-8.4 Z" fill="#8C857C" stroke="${I}" stroke-width=".4"/><circle cx="-3.6" cy="-3.4" r="3.9" fill="${col}" stroke="${I}" stroke-width=".7"/><path d="M-3.6,-6.6 v6.4 M-6.8,-3.4 h6.4" stroke="#fff" stroke-width=".8"/>`; break;
    case 'ber': g+=`<path d="M-2.6,-8.4 A2.6,2.6 0 0 1 2.6,-8.4 Z" fill="#8C857C" stroke="${I}" stroke-width=".4"/><path d="M-2.4,-9 q-2.4,-1.6 -2.2,-4 M2.4,-9 q2.4,-1.6 2.2,-4" stroke="#EDE6D2" stroke-width=".9" fill="none" stroke-linecap="round"/><line x1="3.6" y1="1" x2="5.6" y2="-12" stroke="#5E3E29" stroke-width=".9"/><path d="M5.6,-12 l3.2,.6 l-.2,3.4 l-3,-.4 z" fill="#9AA0A6" stroke="${I}" stroke-width=".4"/>`; break;
    default: break; // poblador: sin accesorio
  }
  return g+'</g>';
}
function uIcon(t,sz){ sz=sz||22; const big=(t==='ari'||t==='lan'); return `<svg class="uic" width="${sz}" height="${sz}" viewBox="-12 -19 24 24" aria-hidden="true">${fig(t,0,0,'#C8452F',big?0.85:1,true)}</svg>`; }

/* figuras de cada oficio y tropa dentro de la zona: una figura por persona (hasta 6 por tipo; si hay más,
   un globo con el resto). Si la zona tiene el edificio del oficio, la gente trabaja a su lado. */
const JOB_BLD={agr:'molino',ing:'taller',com:'mercado',cie:'biblio',sol:'cuartel',cab:'cuartel',ber:'cuartel',arq:'fort',esc:'fort',ari:'cuartel',lan:'cuartel'};
const FIG_MAX=6;
function figRows(z,f,col){
  const us=z.units[f]||[]; const by={}; us.forEach(u=>{ const k=by[u.t]||(by[u.t]={n:0,w:0}); k.n++; if(u.w>0) k.w++; });
  const types=CIV.concat(MIL).filter(t=>by[t]); const anchor={}, used={};
  // las personas de cada tipo; las tuyas, de mejor a peor rasgo (aro dorado o plateado para los de buen rasgo)
  const ppl={}; types.forEach(t=>{ ppl[t]=us.filter(u=>u.t===t); if(f===ME&&CIV.includes(t)) ppl[t].sort((a,b)=>traitScore(b)-traitScore(a)); });
  const stg=LIFE_STAGE[z.id]||(LIFE_STAGE[z.id]={houses:[],bld:{},blocks:[]});
  stg.builders={}; stg.site=null; stg.conflict=!!z.conflict;
  if(z.owner===f){
    types.forEach(t=>{
      let k=-1; if(JOB_BLD[t]) k=z.b.findIndex(b=>b.t===JOB_BLD[t]);
      if((t==='ing'||t==='pob')&&z.proj.length&&z.bplan&&z.bplan[t]>0){ k=z.b.length; stg.builders[t]=true; }   // quienes construyen, junto a la obra
      if(k>=0){ const p=SLOT_POS[k%SLOT_POS.length]; const off=(used[k]||0); used[k]=off+1; anchor[t]=[p[0]+(off?34:0)*(off%2?1:-1),p[1]+30+off*22]; }
    });
    if(z.proj.length&&!z.pauseBuild){ const sl=SLOT_POS[z.b.length%SLOT_POS.length]; stg.site=[sl[0],sl[1]]; }
  }
  const rest={civ:types.filter(t=>!anchor[t]&&CIV.includes(t)),mil:types.filter(t=>!anchor[t]&&MIL.includes(t))};
  const place=(list,y)=>{ const gw=Math.min(70,340/Math.max(1,list.length)); const x0=-(list.length-1)*gw/2; list.forEach((t,i)=>{ anchor[t]=[x0+i*gw,y]; }); };
  place(rest.civ,100); place(rest.mil,142);
  stg.anchor=anchor;
  let s='<g class="pps">';
  types.forEach(t=>{
    const k=by[t], [cx,cy]=anchor[t], big=(t==='ari'||t==='lan'); const n=Math.min(FIG_MAX,k.n);
    const per=big?2:3, sp=big?26:12;
    for(let j=0;j<n;j++){
      const r=Math.floor(j/per), c=j%per, inRow=Math.min(per,n-r*per); const hx=cx+(c-(inRow-1)/2)*sp, hy=cy+r*13; const u=ppl[t][j];
      // cada persona es un grupo propio («pp») para que el pueblo vivo (vida.js) pueda moverla y animarla
      s+=`<g class="pp" data-u="${u.id}" data-t="${t}" data-hx="${f1(hx)}" data-hy="${f1(hy)}" data-hg="${u.hg>0?1:0}" data-w="${u.w>0?1:0}" style="transform:translate(${f1(hx)}px,${f1(hy)}px)"><g class="bob"><g class="act"><g class="fl">${fig(t,0,0,col,big?1.5:1.8,false,(f===ME&&CIV.includes(t))?traitBorder(u):'')}<g class="prop"></g></g></g></g><g class="fx"></g></g>`;
    }
  });
  s+='</g>';
  types.forEach(t=>{
    const k=by[t], [cx,cy]=anchor[t];
    if(k.n>FIG_MAX) s+=`<g transform="translate(${f1(cx+26)},${f1(cy-6)})"><rect x="-13" y="-9" width="26" height="17" rx="8.5" fill="#2A1B16" stroke="${col}" stroke-width="2"/><text class="zt" text-anchor="middle" y="4" font-size="11" font-weight="700" fill="#FBF8F2">+${k.n-FIG_MAX}</text></g>`;
    if(k.w) s+=`<g transform="translate(${f1(cx-26)},${f1(cy-6)})"><circle r="7" fill="#C8452F" stroke="#fff" stroke-width="1.6"/><path d="M-3,0 h6 M0,-3 v6" stroke="#fff" stroke-width="1.8"/><text class="zt" x="10" y="4" font-size="10" font-weight="700" fill="#fff" stroke="#2A1B16" stroke-width="2.5" paint-order="stroke">${k.w}</text></g>`;
  });
  return s;
}
