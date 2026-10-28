'use strict';
// Visor de batallas: repite un combate golpe por golpe, oleada por oleada, en orden de iniciativa.
// Usa el registro que deja el motor en G.battles (unidades, oleadas, golpes y resultado final).

const BV={b:null,k:0,timer:null};
const GRP_N=(t,n)=>t==='civ'?(n===1?'civil':'civiles'):(n===1?UN[t]:UNP[t]).toLowerCase();
function openBattle(i){ const b=(G.battles||[])[i]; if(!b) return; stopBattle(); BV.b=b; BV.k=0; musicPlay('combate'); $('dlgBattle').showModal(); renderBattle(); }
function battleActs(b){ const out=[]; b.waves.forEach((w,wi)=>w.acts.forEach(a=>out.push(Object.assign({wave:wi,init:w.init},a)))); return out; }
// estado de cada unidad después de aplicar las primeras k acciones
function battleState(b,k){
  const st=b.units.map(u=>({hp:u.hp,cush:u.cush,dead:false}));
  battleActs(b).slice(0,k).forEach(a=>a.hits.forEach(h=>{ const s=st[h.i]; s.cush=Math.max(0,s.cush-h.abs); s.hp=Math.max(0,s.hp-h.dmg); if(h.dead) s.dead=true; }));
  return st;
}
function actText(b,a){
  const att=`<b style="color:${PLN[a.f].col}">${a.who.length} ${GRP_N(a.t,a.who.length)}</b> de ${esc(PLN[a.f].name)}`;
  let s=`${att} tira${a.who.length>1?'n':''} <b>${a.dice} dado${a.dice===1?'':'s'}</b> → <b>${a.succ} acierto${a.succ===1?'':'s'}</b>`;
  if(!a.succ||!a.target) return s+'. No hacen daño.';
  const per=a.who.length?b.units[a.who[0]].atk:1;
  s+=` × ${per} de ataque = <b>${a.dmg} de daño</b>${a.aoe?' a cada uno':''} contra <b style="color:${PLN[a.target.f].col}">${GRP_N(a.target.t,2)}</b> de ${esc(PLN[a.target.f].name)}.`;
  const abs=a.hits.reduce((x,h)=>x+h.abs,0), dmg=a.hits.reduce((x,h)=>x+h.dmg,0), dead=a.hits.filter(h=>h.dead).length, hurt=a.hits.filter(h=>!h.dead&&h.dmg>0).length;
  const parts=[]; if(abs) parts.push(`la defensa absorbe ${abs}`); if(dmg) parts.push(`${dmg} de vida perdida`); if(dead) parts.push(`<b>${dead} cae${dead>1?'n':''}</b>`); if(hurt) parts.push(`${hurt} herido${hurt>1?'s':''}`);
  return s+(parts.length?' '+parts.join(', ').replace(/^./,c=>c.toUpperCase())+'.':'');
}

/* ---------- campo de batalla: se ve dónde está cada tropa y cómo se golpean ---------- */
const BM = {W:960, H:380, CX:480, CY:190};
// tamaño de las figuras según cuántas haya (con muchas se achican para que quepan)
const battleScale=b=>{ const m=Math.max(...b.facs.map(f=>b.units.filter(u=>u.f===f).length)); return m<=6?2.7:m<=12?2.35:m<=20?2.0:1.65; };
// posición de cada unidad (formación: cuerpo a cuerpo adelante, tropas de distancia y máquinas atrás), mirando al centro
function battleLayout(b){
  if(BV.posFor===b&&BV.pos) return BV.pos; const pos=b.units.map(()=>null);
  const order=b.facs.slice().sort((x,y)=>(y===b.owner)-(x===b.owner)); const n=order.length;
  const ang=n<=2?[Math.PI,0]:[Math.PI,0,-Math.PI/2,Math.PI/2];
  order.forEach((f,fi)=>{
    const a=ang[fi%ang.length], d=[Math.cos(a),Math.sin(a)], p=[-d[1],d[0]], vert=Math.abs(d[1])>0.5;
    const mine=b.units.map((u,i)=>[u,i]).filter(([u])=>u.f===f);
    const back=([u])=>(u.ranged||u.t==='ari'||u.t==='lan'?1:0); mine.sort((x,y)=>back(x)-back(y)||x[0].init-y[0].init);
    const sc0=battleScale(b); const cap=vert?10:(n<=2?Math.max(4,Math.floor(300/(sc0*17))):5), front=vert?66:78, gx=sc0*17, gy=sc0*14.5;
    // ranks: se llenan de a cap unidades; los de atrás empiezan una fila nueva
    const rows=[]; mine.forEach(m=>{ const last=rows[rows.length-1]; if(!last||last.items.length>=cap||last.back!==back(m)) rows.push({back:back(m),items:[m]}); else last.items.push(m); });
    rows.forEach((row,ri)=>{ row.items.forEach((m,si)=>{ const off=(si-(row.items.length-1)/2)*(vert?gx:gy); const dist=front+ri*(vert?gy:gx);
      pos[m[1]]={x:BM.CX+d[0]*dist+p[0]*off, y:BM.CY+d[1]*dist*(vert?1:1)+p[1]*off, face:d[0]>0.5?-1:1}; }); });
  });
  BV.posFor=b; BV.pos=pos; return pos;
}
function battleMapSVG(b,st,cur){
  const pos=battleLayout(b); const n=b.units.length; const sc=battleScale(b); const T=TCOL[b.terr]||'#B8A58C';
  const rnd=mulberry32(b.zone*17+b.step*5+3); let h=`<svg class="bvsvg" viewBox="0 0 ${BM.W} ${BM.H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Campo de batalla">`;
  h+=`<rect x="0" y="0" width="${BM.W}" height="${BM.H}" rx="16" fill="${T}"/><rect x="6" y="6" width="${BM.W-12}" height="${BM.H-12}" rx="12" fill="none" stroke="rgba(42,27,22,.35)" stroke-width="3" stroke-dasharray="10 8"/>`;
  // la línea del frente y un poco de paisaje en los bordes
  h+=`<path d="M${BM.CX},16 V${BM.H-16}" stroke="rgba(255,255,255,.28)" stroke-width="4" stroke-dasharray="3 12" stroke-linecap="round"/>`;
  const cfg={bos:['tree',9],mon:['peak',5],pra:['tuft',14],col:['hill',6],lla:['furrow',8],rio:['reed',9]}[b.terr]||['tuft',9]; const dec=[];
  for(let i=0,t=0;i<cfg[1]&&t<200;t++){ const x=24+rnd()*(BM.W-48), y=rnd()<0.5?(18+rnd()*34):(BM.H-18-rnd()*30); if(Math.abs(x-BM.CX)<14) continue; dec.push({x,y,s:1.1+rnd()*0.7}); i++; }
  dec.sort((a,b2)=>a.y-b2.y).forEach(it=>{ h+=terrDecor({t:cfg[0],x:it.x,y:it.y,s:it.s}); });
  const tgt=cur&&cur.target?b.units.map((u,i)=>[u,i]).filter(([u,i])=>u.f===cur.target.f&&((cur.target.t==='civ')?UT[u.t].civ:u.t===cur.target.t)&&!st[i].dead).map(x=>x[1]):[];
  const hitI=new Set(cur?cur.hits.map(x=>x.i):[]), dying=new Set(cur?cur.hits.filter(x=>x.dead).map(x=>x.i):[]), att=new Set(cur?cur.who:[]);
  const tIdx=cur&&cur.hits.length?cur.hits.map(x=>x.i):tgt; const cen=tIdx.length?[tIdx.reduce((a,i)=>a+pos[i].x,0)/tIdx.length,tIdx.reduce((a,i)=>a+pos[i].y,0)/tIdx.length]:null;
  const order=b.units.map((u,i)=>i).sort((a,c)=>pos[a].y-pos[c].y);
  order.forEach(i=>{ const u=b.units[i], P=pos[i], s=st[i]; const col=PLN[u.f].col; let cls='bvf'+(s.dead&&!dying.has(i)?' dead':'')+(dying.has(i)?' dying':'')+(hitI.has(i)?' hit':'')+(att.has(i)?' att':'');
    let dx=0,dy=0; if(att.has(i)&&cen){ const L=Math.hypot(cen[0]-P.x,cen[1]-P.y)||1; const reach=u.ranged?5:Math.min(34,Math.max(12,L-26)); dx=(cen[0]-P.x)/L*reach; dy=(cen[1]-P.y)/L*reach; }
    const hearts=Array.from({length:Math.min(6,u.hpMax)},(_,j)=>`<rect x="${f1((j-(Math.min(6,u.hpMax)-1)/2)*6.4-2.6)}" y="${f1(sc*1.2+3)}" width="5.2" height="4" rx="1" fill="${j<s.hp?'#4CAF6A':'#d9cbb8'}" stroke="rgba(42,27,22,.6)" stroke-width=".4"/>`).join('');
    h+=`<g class="${cls}" transform="translate(${f1(P.x)},${f1(P.y)})" style="--dx:${f1(dx)}px;--dy:${f1(dy)}px"><title>${esc(UN[u.t])} de ${esc(PLN[u.f].name)}: vida ${s.hp}/${u.hpMax}${s.cush?', defensa '+s.cush:''}${s.dead?' (cayó)':''}</title><g class="bvfl"><g transform="scale(${P.face},1)">${fig(u.civ&&u.t==='civ'?'pob':u.t,0,0,col,sc,true,u.gen?'gen':'')}</g></g>${s.dead?'':hearts}${s.cush&&!s.dead?`<text x="${f1(Math.min(6,u.hpMax)*3.2+5)}" y="${f1(sc*1.2+7.5)}" font-size="9" class="zt">🛡${s.cush}</text>`:''}${s.dead?'<text y="-2" text-anchor="middle" font-size="16" fill="#C8452F" font-weight="900" class="zt">✕</text>':''}</g>`; });
  // proyectiles (flechas y piedras) y números de daño
  if(cur&&cen){
    const shooters=cur.who.filter(i=>b.units[i].ranged).slice(0,6);
    shooters.forEach((i,k)=>{ const P=pos[i], lan=b.units[i].t==='lan'; const tx=cen[0]+(k%3-1)*7, ty=cen[1]+(Math.floor(k/3)-0.5)*7; const ang=Math.atan2(ty-P.y,tx-P.x)*180/Math.PI;
      h+=`<g class="bvproj" style="--x0:${f1(P.x)}px;--y0:${f1(P.y-10)}px;--x1:${f1(tx)}px;--y1:${f1(ty-10)}px;animation-delay:${k*70}ms">${lan?'<circle r="4" fill="#8C857C" stroke="#2A1B16" stroke-width="1"/>':`<g transform="rotate(${f1(ang)})"><line x1="-8" x2="6" stroke="#3a2a20" stroke-width="1.6"/><path d="M6,0 l-4,-2.4 v4.8 z" fill="#d8d8d8"/></g>`}</g>`; });
    if(!cur.who.some(i=>b.units[i].ranged)&&cur.succ>0) h+=`<g transform="translate(${f1(cen[0])},${f1(cen[1]-14)})" class="bvspark"><path d="M0,-9 l2.6,6 6.6,.8 -5,4.4 1.6,6.4 -5.8,-3.6 -5.8,3.6 1.6,-6.4 -5,-4.4 6.6,-.8 z" fill="#FFF3B0" stroke="#C8452F" stroke-width="1.2"/></g>`;
    cur.hits.slice(0,10).forEach((x,k)=>{ const P=pos[x.i]; const t=x.dmg>0?'−'+x.dmg:(x.abs>0?'🛡':''); if(t) h+=`<text class="bvdmg zt" x="${f1(P.x+(k%2?6:-6))}" y="${f1(P.y-sc*13)}" text-anchor="middle" font-size="${x.dead?20:17}" font-weight="900" fill="${x.dmg>0?'#FFE9E4':'#DDEBFF'}" stroke="${x.dmg>0?'#8B2E22':'#2A4B7A'}" stroke-width="3.4" paint-order="stroke" style="animation-delay:${k*60}ms">${t}${x.dead?' ☠':''}</text>`; });
  }
  return h+'</svg>';
}
function renderBattle(){
  const b=BV.b; if(!b) return; const acts=battleActs(b), k=BV.k, st=battleState(b,k), cur=acts[k-1];
  const z=G.zones[b.zone]; const order=b.facs.slice().sort((x,y)=>(y===b.owner)-(x===b.owner));
  const attk=new Set(cur?cur.who:[]), hitS=new Set(cur?cur.hits.map(h=>h.i):[]);
  let h=`<div class="bvh"><h2>⚔ Batalla en ${esc(zname(z))}</h2><span class="hint">paso ${b.step} · ${TERRN[b.terr]}${b.surprise.length?' · <b>sorpresa</b> de '+b.surprise.map(f=>esc(PLN[f].name)).join(' y '):''}</span></div>`;
  h+='<div class="bvleg">'+order.map(f=>{ const mine=b.units.map((u,i)=>[u,i]).filter(([u])=>u.f===f); const alive=mine.filter(([u,i])=>!st[i].dead).length; return `<span class="bvl" style="--pc:${PLN[f].col}"><span class="dot" style="background:${PLN[f].col}"></span><b>${esc(PLN[f].name)}</b> <small>${f===b.owner?'defiende':'ataca'} · ${alive}/${mine.length} en pie</small></span>`; }).join('')+'</div>';
  h+=`<div class="bvmap" style="background:${TCOL[b.terr]||'#B8A58C'}">${battleMapSVG(b,st,cur)}</div>`;
  // línea de tiempo: oleadas y acciones
  h+='<div class="bvlog">';
  b.waves.forEach((w,wi)=>{
    h+=`<div class="bvw"><b>Oleada ${wi+1}</b> <span class="hint">iniciativa ${w.init} (menor actúa antes)</span></div>`;
    acts.forEach((a,ai)=>{ if(a.wave!==wi) return; h+=`<div class="bva ${ai===k-1?'cur':ai<k?'done':''}" data-act="bvgo" data-k="${ai+1}">${actText(b,a)}</div>`; });
  });
  if(k>=acts.length){
    const dead={}, hurt={}; b.end.dead.forEach(i=>{ const u=b.units[i]; dead[u.f]=(dead[u.f]||0)+1; }); b.end.wounded.forEach(i=>{ const u=b.units[i]; hurt[u.f]=(hurt[u.f]||0)+1; });
    h+=`<div class="bvend"><b>Resultado</b>${b.facs.map(f=>`<div><span class="dot" style="background:${PLN[f].col}"></span> ${esc(PLN[f].name)}: ${dead[f]||0} caído${(dead[f]||0)===1?'':'s'}, ${hurt[f]||0} herido${(hurt[f]||0)===1?'':'s'}${b.end.capt[f]?`, captura ${b.end.capt[f]} civil${b.end.capt[f]>1?'es':''}`:''}</div>`).join('')}<div class="hint">Los heridos pelean con menos fuerza y no producen hasta curarse. Los civiles que caen quedan capturados por quien los venció.</div></div>`;
  }
  h+='</div>';
  h+=`<div class="bvctl">${btnHTML('bvgo','⏮ Inicio','data-k="0"')}${btnHTML('bvgo','◀ Anterior',`data-k="${Math.max(0,k-1)}"`)}${btnHTML('bvplay',BV.timer?'⏸ Pausa':'▶ Reproducir','','primary')}${btnHTML('bvgo','Siguiente ▶',`data-k="${Math.min(acts.length,k+1)}"`)}${btnHTML('bvgo','Final ⏭',`data-k="${acts.length}"`)}<span class="hint">${k}/${acts.length} golpes</span></div>`;
  $('battleBody').innerHTML=h;
  const c=$('battleBody').querySelector('.bva.cur'); if(c) c.scrollIntoView({block:'nearest'});
}
function battleSound(k){ const a=battleActs(BV.b)[k-1]; if(!a) return; if(!a.succ||!a.target){ sfx('miss',0); return; } sfx('clash',0); if(a.hits.some(h=>h.dead)) sfxLater('thud',180,0); }
function stopBattle(){ if(BV.timer){ clearInterval(BV.timer); BV.timer=null; } }
function playBattle(){
  if(BV.timer){ stopBattle(); renderBattle(); return; }
  const n=battleActs(BV.b).length; if(BV.k>=n) BV.k=0;
  BV.timer=setInterval(()=>{ BV.k++; battleSound(BV.k); if(BV.k>=n) stopBattle(); renderBattle(); },FXS.on?1500:600); renderBattle();
}
function battlesAt(zid,step){ return (G.battles||[]).map((b,i)=>[b,i]).filter(([b])=>(zid===null||b.zone===zid)&&(step===null||b.step===step)); }
function battleButtons(list){ return list.map(([b,i])=>btnHTML('battle',`⚔ Ver la batalla en ${esc(zname(G.zones[b.zone]))}`,`data-b="${i}"`)).join(' '); }
