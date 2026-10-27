'use strict';
// Animaciones del paso: movimientos, combates, obras, nacimientos y avisos.

const FXS = {on:true};
const SVGNS='http://www.w3.org/2000/svg';
function mkEl(tag,attrs,html){ const e=document.createElementNS(SVGNS,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); if(html!==undefined) e.innerHTML=html; return e; }
function fxLayer(){ return ui.view==='terr'?$('fxT'):$('fxP'); }
function zp(zid){ const z=G.zones[zid]; return ui.view==='terr'?[sx(zid),sy(zid)]:[zx(z),zy(z)]; }
function fxScale(){ return ui.view==='terr'?Math.max(0.8,Math.min(2.2,1/CAM.k)):0.62; }
function fxAnim(el,frames,opt,done){ const a=el.animate(frames,Object.assign({fill:'forwards',easing:'ease-out'},opt)); a.onfinish=()=>{ if(done) done(); else el.remove(); }; return a; }
const RESC={food:['#9DC764','C','comida'],prod:['#B98A66','P','producción'],gold:['#E9C46A','O','oro'],tech:['#7FB2E5','T','tecnología']};

function fxFloat(zid,text,color,delay,dx,dy){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  const g=mkEl('g',{transform:`translate(${f1(p[0]+(dx||0)*s)},${f1(p[1]+(dy||-40)*s)})`});
  const t=mkEl('text',{x:0,y:0,'text-anchor':'middle','font-size':f1(26*s),'font-weight':'700',fill:color||'#fff',stroke:'#2A1B16','stroke-width':f1(5*s),'paint-order':'stroke','class':'zt'},esc(text));
  g.appendChild(t); L.appendChild(g);
  fxAnim(g,[{opacity:0,transform:`translate(${f1(p[0]+(dx||0)*s)}px,${f1(p[1]+(dy||-40)*s)}px) scale(.6)`},{opacity:1,offset:.18},{opacity:1,offset:.7},{opacity:0,transform:`translate(${f1(p[0]+(dx||0)*s)}px,${f1(p[1]+(dy||-40)*s-90*s)}px) scale(1)`}],{duration:1700,delay:delay||0});
  g.style.opacity=0;
}
function fxChip(zid,res,amount,delay,slot){
  if(!FXS.on||!amount) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale(); const c=RESC[res];
  const bx=p[0]+(-135+slot*90)*s, by=p[1]+30*s;
  const g=mkEl('g',{});
  g.innerHTML=`<rect x="${f1(-30*s)}" y="${f1(-15*s)}" width="${f1(60*s)}" height="${f1(30*s)}" rx="${f1(15*s)}" fill="#2A1B16" stroke="${c[0]}" stroke-width="${f1(3*s)}"/><circle cx="${f1(-16*s)}" cy="0" r="${f1(9*s)}" fill="${c[0]}"/><text x="${f1(-16*s)}" y="${f1(4*s)}" text-anchor="middle" font-size="${f1(11*s)}" font-weight="700" fill="#10181B" class="zt">${c[1]}</text><text x="${f1(8*s)}" y="${f1(6*s)}" font-size="${f1(18*s)}" font-weight="700" fill="#FBF8F2" class="zt">${amount>0?'+':''}${amount}</text>`;
  g.style.opacity=0; L.appendChild(g);
  fxAnim(g,[{opacity:0,transform:`translate(${f1(bx)}px,${f1(by)}px) scale(.4)`},{opacity:1,transform:`translate(${f1(bx)}px,${f1(by-24*s)}px) scale(1.12)`,offset:.2},{opacity:1,transform:`translate(${f1(bx)}px,${f1(by-60*s)}px) scale(1)`,offset:.72},{opacity:0,transform:`translate(${f1(bx)}px,${f1(by-100*s)}px) scale(1)`}],{duration:2000,delay:delay||0});
}
function fxRing(zid,color,delay){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  const c=mkEl('circle',{cx:f1(p[0]),cy:f1(p[1]),r:f1(20*s),fill:'none',stroke:color,'stroke-width':f1(10*s)}); c.style.opacity=0; L.appendChild(c);
  const a=c.animate([{r:f1(20*s),opacity:.95},{r:f1(190*s),opacity:0}],{duration:1100,delay:delay||0,fill:'forwards',easing:'ease-out'}); a.onfinish=()=>c.remove();
}
function fxBurst(zid,delay){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  const g=mkEl('g',{}); let h='';
  for(let k=0;k<10;k++){ const a=k*Math.PI/5; h+=`<line x1="${f1(Math.cos(a)*30*s)}" y1="${f1(Math.sin(a)*30*s)}" x2="${f1(Math.cos(a)*(54+(k%2)*16)*s)}" y2="${f1(Math.sin(a)*(54+(k%2)*16)*s)}" stroke="${k%2?'#FFE27A':'#C8452F'}" stroke-width="${f1(6*s)}" stroke-linecap="round"/>`; }
  h+=`<path d="M${f1(-26*s)},${f1(-26*s)} L${f1(26*s)},${f1(26*s)} M${f1(26*s)},${f1(-26*s)} L${f1(-26*s)},${f1(26*s)}" stroke="#fff" stroke-width="${f1(9*s)}" stroke-linecap="round"/><path d="M${f1(-26*s)},${f1(-26*s)} L${f1(26*s)},${f1(26*s)} M${f1(26*s)},${f1(-26*s)} L${f1(-26*s)},${f1(26*s)}" stroke="#2A1B16" stroke-width="${f1(3.5*s)}" stroke-linecap="round"/>`;
  g.innerHTML=h; g.style.opacity=0; L.appendChild(g);
  fxAnim(g,[{opacity:0,transform:`translate(${f1(p[0])}px,${f1(p[1])}px) scale(.3) rotate(-25deg)`},{opacity:1,transform:`translate(${f1(p[0])}px,${f1(p[1])}px) scale(1.15) rotate(0deg)`,offset:.3},{opacity:1,transform:`translate(${f1(p[0])}px,${f1(p[1])}px) scale(1) rotate(6deg)`,offset:.7},{opacity:0,transform:`translate(${f1(p[0])}px,${f1(p[1])}px) scale(1.4) rotate(0deg)`}],{duration:1100,delay:delay||0});
}
function fxMove(a,b,f,n,mil,delay,st){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const col=PLN[f].col, s=fxScale();
  const route=routeZones(a,b); const segs=[];
  for(let k=0;k<route.length-1;k++){ if(ui.view==='terr') segs.push(hopPts(route[k],route[k+1])); else { const A=zp(route[k]),B=zp(route[k+1]); segs.push({A,B,C:[(A[0]+B[0])/2,(A[1]+B[1])/2]}); } }
  const dur=1500*Math.min(2,segs.length)*(ui.view==='terr'?1:0.8), cnt=Math.min(4,Math.max(1,n));
  // estela: camino resaltado
  const trail=mkEl('path',{d:segs.map((g,k)=>`${k?'L':'M'}${f1(g.A[0])},${f1(g.A[1])} Q${f1(g.C[0])},${f1(g.C[1])} ${f1(g.B[0])},${f1(g.B[1])}`).join(' '),fill:'none',stroke:col,'stroke-width':f1(14*s),'stroke-linecap':'round','stroke-dasharray':`${f1(18*s)} ${f1(14*s)}`,opacity:0}); L.appendChild(trail);
  const g=mkEl('g',{}); let h='';
  for(let k=0;k<cnt;k++) h+=person((k-(cnt-1)/2)*16,(k%2)*6,col,k<Math.min(cnt,mil));
  g.innerHTML=`<g transform="scale(${f1(1.9*s)})">${h}</g><g transform="translate(0,${f1(-44*s)})"><rect x="${f1(-34*s)}" y="${f1(-14*s)}" width="${f1(68*s)}" height="${f1(28*s)}" rx="${f1(14*s)}" fill="#2A1B16" stroke="${st==='ataque'?'#C8452F':col}" stroke-width="${f1(3*s)}"/><text x="0" y="${f1(6*s)}" text-anchor="middle" font-size="${f1(16*s)}" font-weight="700" fill="#fff" class="zt">${n}${st==='ataque'?' ⚔':''}</text></g>`;
  g.style.opacity=0; L.appendChild(g);
  const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; const t0=performance.now()+(delay||0);
  const step=t=>{
    if(t<t0){ requestAnimationFrame(step); return; }
    const k=Math.min(1,(t-t0)/dur), e=ease(k), sg=k*segs.length, idx=Math.min(segs.length-1,Math.floor(sg)), u=ease(sg-idx>1?1:sg-idx);
    const sgm=segs[idx], P=qpt(sgm.A,sgm.C,sgm.B,k>=1?1:u);
    g.setAttribute('transform',`translate(${f1(P[0])},${f1(P[1])})`);
    const op=k<.1?k/.1:(k>.92?(1-k)/.08:1); g.style.opacity=op; trail.setAttribute('opacity',(0.45*op).toFixed(2));
    if(k<1) requestAnimationFrame(step); else { g.remove(); trail.remove(); fxRing(b,col,0); }
  };
  requestAnimationFrame(step);
}
function fxBuild(zid,bt,delay){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  const g=mkEl('g',{}); g.innerHTML=`<g transform="scale(${f1(3.2*s)})">${bGlyph(bt,0,false)}</g>`; g.style.opacity=0; L.appendChild(g);
  fxAnim(g,[{opacity:0,transform:`translate(${f1(p[0])}px,${f1(p[1]+10*s)}px) scale(.2)`},{opacity:1,transform:`translate(${f1(p[0])}px,${f1(p[1]-30*s)}px) scale(1.25)`,offset:.35},{opacity:1,transform:`translate(${f1(p[0])}px,${f1(p[1]-36*s)}px) scale(1)`,offset:.7},{opacity:0,transform:`translate(${f1(p[0])}px,${f1(p[1]-60*s)}px) scale(1)`}],{duration:1700,delay:delay||0});
}
// Efectos visuales nuevos: temblor de la vista, polvo de obra, destellos y confeti.
function shakeView(){ if(!FXS.on) return; const v=$('vp'); v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake'); setTimeout(()=>v.classList.remove('shake'),600); }
function fxDust(zid,delay){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  for(let k=0;k<9;k++){ const a=Math.PI*2*k/9+Math.random()*0.4, r0=20*s, r1=(80+Math.random()*50)*s;
    const c=mkEl('circle',{cx:f1(p[0]+Math.cos(a)*r0),cy:f1(p[1]+30*s+Math.sin(a)*r0*0.5),r:f1((10+Math.random()*8)*s),fill:'#CDB48C',opacity:0}); L.appendChild(c);
    const an=c.animate([{opacity:.0,transform:'translate(0,0) scale(.6)'},{opacity:.75,offset:.2},{opacity:0,transform:`translate(${f1(Math.cos(a)*r1)}px,${f1(Math.sin(a)*r1*0.5-20*s)}px) scale(1.6)`}],{duration:1100,delay:delay||0,easing:'ease-out',fill:'forwards'}); an.onfinish=()=>c.remove(); }
}
function fxSparkle(zid,delay,color){
  if(!FXS.on) return; const L=fxLayer(); if(!L) return; const p=zp(zid), s=fxScale();
  for(let k=0;k<14;k++){ const a=Math.random()*Math.PI*2, r1=(60+Math.random()*90)*s;
    const st=mkEl('path',{d:`M0,${f1(-7*s)} L${f1(2*s)},${f1(-2*s)} L${f1(7*s)},0 L${f1(2*s)},${f1(2*s)} L0,${f1(7*s)} L${f1(-2*s)},${f1(2*s)} L${f1(-7*s)},0 L${f1(-2*s)},${f1(-2*s)} Z`,fill:color||'#FFE27A',stroke:'#fff','stroke-width':f1(0.8*s),opacity:0}); L.appendChild(st);
    const an=st.animate([{opacity:0,transform:`translate(${f1(p[0])}px,${f1(p[1]-40*s)}px) scale(.3)`},{opacity:1,offset:.25},{opacity:0,transform:`translate(${f1(p[0]+Math.cos(a)*r1)}px,${f1(p[1]-40*s+Math.sin(a)*r1)}px) scale(1.2) rotate(90deg)`}],{duration:1300,delay:(delay||0)+k*30,easing:'ease-out',fill:'forwards'}); an.onfinish=()=>st.remove(); }
}
function confetti(){
  if(!FXS.on) return; const box=document.createElement('div'); box.className='confetti'; document.body.appendChild(box);
  const cols=['#C8452F','#2F7F8F','#D9A028','#5E8E3E','#FFE27A','#7FB2E5'];
  for(let k=0;k<120;k++){ const d=document.createElement('i'); d.style.left=(Math.random()*100)+'%'; d.style.background=cols[k%cols.length]; d.style.animationDelay=(Math.random()*1.2)+'s'; d.style.animationDuration=(2.4+Math.random()*1.8)+'s'; d.style.transform=`rotate(${Math.random()*360}deg)`; box.appendChild(d); }
  setTimeout(()=>box.remove(),5200);
}
function toast(title,body,kind,icon,action){
  const box=$('toasts'); if(!box) return; const d=document.createElement('div'); d.className='toast '+(kind||'')+(action?' act':''); if(action){ d.dataset.act=action.act; Object.keys(action).forEach(k=>{ if(k!=='act') d.dataset[k]=action[k]; }); } d.innerHTML=`<span class="ti">${icon||'✦'}</span><div><b>${esc(title)}</b>${body?`<div>${esc(body)}</div>`:''}</div>`;
  box.appendChild(d); while(box.children.length>4) box.removeChild(box.firstChild);
  setTimeout(()=>{ d.classList.add('out'); setTimeout(()=>d.remove(),400); },action?9000:(FXS.on?4200:5200));
}
function banner(text,kind){
  const b=$('banner'); b.className='banner show '+(kind||''); b.textContent=text; clearTimeout(b._t); b._t=setTimeout(()=>{ b.className='banner'; },3800);
}
function tween(el,to,suffix){
  const from=Number(el.dataset.v||to); el.dataset.v=to; if(!FXS.on||from===to){ el.textContent=to+(suffix||''); return; }
  const t0=performance.now(), dur=700; const step=t=>{ const k=Math.min(1,(t-t0)/dur); el.textContent=Math.round(from+(to-from)*k)+(suffix||''); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}

/* ---------- reproducir los eventos de un paso ---------- */
function playFx(list,condsBefore){
  if(!list) return;
  const mine=z=>G.zones[z].owner===ME||true;
  let tProd=0, slotUse={};
  list.forEach(e=>{
    switch(e.k){
      case 'event': { const ev=EVT[e.id]; banner(ev.n+' — '+ev.d, ev.k==='+'?'pos':ev.k==='-'?'neg':'tri'); sfxLater(ev.k==='+'?'goodEvent':ev.k==='-'?'badEvent':'horn',250,0); break; }
      case 'move': fxMove(e.from,e.to,e.f,e.n,e.mil,0,e.st); if(e.f===ME) sfxLater('move',100,300); break;
      case 'send': fxFloat(e.to,'+'+e.q+' '+(e.res==='food'?'comida':'prod.'),'#E9C46A',700,0,-10); break;
      case 'fight': {
        fxBurst(e.zone,900); sfxLater('battle',900,250); if(e.facs.includes(ME)) setTimeout(shakeView,950);
        e.facs.forEach((f,i)=>{ const l=e.losses[f]; if(l&&(l.mil>0||l.civ>0)) fxFloat(e.zone,'−'+(l.mil+l.civ),PLN[f].col,1100+i*160,(i-(e.facs.length-1)/2)*70,-10); });
        e.surprise.forEach(f=>fxFloat(e.zone,'¡Sorpresa!','#FFE27A',900,0,-110));
        Object.keys(e.capt).forEach(f=>{ if(e.capt[f]>0) fxFloat(e.zone,'¡'+e.capt[f]+' capturados!',PLN[f].col,1500,0,-150); });
        if(e.facs.includes(ME)&&e.battle!==undefined) toast('Combate en '+zname(G.zones[e.zone]),'Toca para ver la batalla golpe a golpe.','neg','⚔',{act:'battle',b:e.battle});
        break; }
      case 'conq': sfxLater(e.f===ME?'fanfare':'horn',1400,0); fxRing(e.zone,PLN[e.f].col,1400); fxFloat(e.zone,'¡Conquistada!',PLN[e.f].col,1400,0,-120); if(e.f===ME) toast('Zona conquistada',zname(G.zones[e.zone])+' ahora es tuya.','pos','⚑'); else if(G.zones[e.zone]) toast(PLN[e.f].name+' conquista '+zname(G.zones[e.zone]),'','neg','⚔'); break;
      case 'annex': if(e.f===ME){ sfxLater('fanfare',1400,0); fxSparkle(e.zone,1400,PLN[ME].col); } fxRing(e.zone,PLN[e.f].col,1400); fxFloat(e.zone,'¡Anexada!',PLN[e.f].col,1400,0,-120); if(e.f===ME) toast('Tribu anexada',zname(G.zones[e.zone])+' se une a tu imperio.','pos','🤝'); break;
      case 'take': fxRing(e.zone,PLN[e.f].col,1400); if(e.f===ME) fxFloat(e.zone,'Zona tomada',PLN[e.f].col,1400,0,-120); break;
      case 'built': fxBuild(e.zone,e.bt,1700); fxRing(e.zone,'#7CE0A0',1700); fxDust(e.zone,1650); if(e.f===ME) sfxLater('built',1500,400); if(e.f===ME) toast('Obra terminada',BT[e.bt].n+' en '+zname(G.zones[e.zone]),'pos','🏗'); break;
      case 'upg': fxFloat(e.zone,BT[e.bt].n+' nivel '+e.l,'#7CE0A0',1700,0,-100); fxRing(e.zone,'#FFE27A',1700); if(e.f===ME){ fxSparkle(e.zone,1700); sfxLater('upgrade',1700,300); } if(e.f===ME) toast('Edificio mejorado',BT[e.bt].n+' sube a nivel '+e.l,'pos','⬆'); break;
      case 'train': if(e.f===ME) sfxLater('train',1500,200); if(e.f===ME) fxFloat(e.zone,'+'+e.n+' '+(e.n>1?UNP[e.u]:UN[e.u]).toLowerCase(),'#FFE27A',1500,0,-80); break;
      case 'spec': if(e.f===ME) sfxLater('spec',1500,150); if(e.f===ME) fxFloat(e.zone,e.n+' → '+UNP[e.to].toLowerCase(),'#FFE27A',1500,0,-60); break;
      case 'born': if(e.f===ME) sfxLater('born',2000,300); if(e.f===ME) fxFloat(e.zone,'+'+e.n+' poblador'+(e.n>1?'es':''),'#9DC764',2000,0,-70); break;
      case 'tech': if(e.f===ME){ sfxLater('tech',600,300); const mc=myCapital(); if(G.zones[mc]&&G.zones[mc].owner===ME) fxSparkle(mc,600,'#7FB2E5'); toast('Tecnología desarrollada',e.name,'tech','🔬'); ui.justTech=e.name; setTimeout(()=>{ ui.justTech=null; },3500); } break;
      case 'enc': if(e.f===ME){ if(e.ok){ sfxLater('coin',400,0); fxSparkle(e.zone,400,'#E9C46A'); } else sfxLater('badEvent',400,0); } break;
      case 'out': sfxLater('out',300,0); toast(PLN[e.f].name+' queda eliminado','Pasa a ser fantasma.','neg','☠'); break;
      case 'prod': if(e.f===ME){ if(e.gold>0) sfxLater('coin',2500,900); const items=[['food',e.food],['prod',e.prod],['gold',e.gold],['tech',e.tech]].filter(x=>x[1]>0); items.forEach((it,i)=>fxChip(e.zone,it[0],it[1],2400+i*140+(e.zone%5)*40,i%4)); } break;
    }
  });
  if(condsBefore){
    for(let f=0;f<G.N;f++){ const after=victoryConds(G,f); after.forEach((c,i)=>{ if(c.ok&&!(condsBefore[f]&&condsBefore[f][i]&&condsBefore[f][i].ok)){ toast(f===ME?'¡Condición de victoria cumplida!':PLN[f].name+' cumple una condición',c.k+' ('+c.d+')',f===ME?'pos':'neg','★'); ui.justCond=ui.justCond||{}; ui.justCond[f+'_'+i]=1; setTimeout(()=>{ if(ui.justCond) delete ui.justCond[f+'_'+i]; },4000); } }); }
  }
}
