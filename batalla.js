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
function renderBattle(){
  const b=BV.b; if(!b) return; const acts=battleActs(b), k=BV.k, st=battleState(b,k), cur=acts[k-1];
  const z=G.zones[b.zone]; const order=b.facs.slice().sort((x,y)=>(y===b.owner)-(x===b.owner));
  const attk=new Set(cur?cur.who:[]), hitS=new Set(cur?cur.hits.map(h=>h.i):[]);
  let h=`<div class="bvh"><h2>⚔ Batalla en ${esc(zname(z))}</h2><span class="hint">paso ${b.step} · ${TERRN[b.terr]}${b.surprise.length?' · <b>sorpresa</b> de '+b.surprise.map(f=>esc(PLN[f].name)).join(' y '):''}</span></div>`;
  h+='<div class="bvarena">';
  order.forEach(f=>{
    const mine=b.units.map((u,i)=>[u,i]).filter(([u])=>u.f===f); const alive=mine.filter(([u,i])=>!st[i].dead).length;
    h+=`<div class="bvside" style="--pc:${PLN[f].col}"><div class="bvsh"><span class="dot" style="background:${PLN[f].col}"></span><b>${esc(PLN[f].name)}</b><span class="hint">${f===b.owner?'defiende':'ataca'} · ${alive}/${mine.length} en pie</span></div>`;
    const types=[...new Set(mine.map(([u])=>u.t))].sort((a,c)=>b.units.find(u=>u.t===a).init-b.units.find(u=>u.t===c).init);
    types.forEach(t=>{
      const us=mine.filter(([u])=>u.t===t); const u0=us[0][0];
      h+=`<div class="bvgrp"><div class="bvgl">${esc((us.length>1?UNP[t]:UN[t]))} <small>iniciativa ${u0.init} · ${u0.dice} dados · ataque ${u0.atk}${u0.ranged?' · distancia':''}</small></div><div class="bvunits">`;
      us.forEach(([u,i])=>{ const s=st[i]; const hearts=Array.from({length:u.hpMax},(_,j)=>`<i class="${j<s.hp?'on':''}"></i>`).join('');
        h+=`<div class="bvu ${s.dead?'dead':''} ${attk.has(i)?'att':''} ${hitS.has(i)?'hit':''}" title="${esc(UN[t])}: vida ${s.hp}/${u.hpMax}${s.cush?', defensa '+s.cush:''}">${uIcon(t,38)}<div class="bvhp">${hearts}</div>${s.cush?`<span class="bvsh2">🛡${s.cush}</span>`:''}${s.dead?'<span class="bvx">✕</span>':''}</div>`; });
      h+='</div></div>';
    });
    h+='</div>';
  });
  h+='</div>';
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
