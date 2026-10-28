// @ts-check
'use strict';
// Combate por oleadas de iniciativa: dados de fuerza, ataque, defensa como colchón, sorpresa y capturas.

function fortDefOf(z){
  let best=0; z.b.forEach(b=>{ if(b.t==='fort'){ const v=[0,1,2,3,3,4][Math.min(5,b.l)]; if(v>best) best=v; } }); return best;
}
/** @param {Partida} g */
function fightZone(g,z,facs,att,L){
  const rng=g.rng;
  const isDef=f=>(z.owner===f||allied(g,f,z.owner));
  const anyPassive=facs.some(f=>!att[f]);
  const surprise={}; facs.forEach(f=>{ surprise[f]=att[f]&&anyPassive; });
  const hasMurallas=z.b.some(b=>b.t==='fort'&&b.s==='murallas');
  if(hasMurallas) facs.forEach(f=>{ if(!isDef(f)) surprise[f]=false; });
  // nivel de ariete enemigo vivo por facción
  const ramLvl={}; facs.forEach(f=>{ if(lst(z,f).some(u=>u.t==='ari')) ramLvl[f]=(g.M[f]||newMods()).siege.ari; });
  const cu=[]; 
  facs.forEach(f=>{
    const M=g.M[f]||newMods(); const def=isDef(f);
    lst(z,f).forEach(u=>{
      const b=UT[u.t], mm=M.u[u.t]||{str:0,def:0,hp:0,atk:0,init:null};
      const T=z.terrain;
      let hpMax=Math.max(1,b.hp+mm.hp+(b.civ?M.civHp:0)+trInt(u,'sal'))+(u.cabhp||0)+((M.bastion&&def)?1:0)+(u.gen?GEN_HP+M.genHp:0);   // los generales aguantan más
      let str=b.civ?Math.max(0,1+trInt(u,'fue')):Math.max(1,u.str+mm.str+trInt(u,'fue')+(u.gen?GEN_STR+M.genStr:0)), atk=b.atk+mm.atk+(u.gen?GEN_ATK:0), d=b.def+mm.def, init=(mm.init!==null&&mm.init!==undefined)?mm.init:b.init;
      const wounded=u.w>0;
      if(wounded) str=b.civ?0:Math.floor(str*M.moral);
      if((u.hg>0||u.unp)&&!b.civ) str=Math.max(1,Math.floor(str*HUNGRY_FIGHT));   // sin suministros o sin paga se pelea mal
      if(u.t==='ber'&&def&&T==='mon') init=M.tm.monBer?1:2;
      if(u.t==='ber'&&!def&&T==='col'){ init=2; if(M.tm.colBer) str+=1; }
      if(u.t==='cab'&&def&&T==='pra'){ init=0; if(M.tm.praCab) atk+=1; }
      if(u.t==='cab'&&!def&&T==='lla'){ init=0; if(M.tm.llaCab) str+=1; }
      if(u.t==='arq'&&!def&&T==='bos') str+=1+(M.tm.bosArq?1:0);
      if(u.t==='arq'&&def&&T==='rio') str+=1+(M.tm.rioArq?1:0);
      if(u.t==='arq'&&def&&z.b.some(x=>x.t==='fort'&&x.s==='torres')) str+=1;
      if(u.t==='ber'&&!def&&M.berFury) str+=1;
      if(u.t==='sol'&&def&&M.lanceros) atk+=1;
      if(u.t==='cab'&&!def&&M.cabCharge&&!z.conflict) atk+=1;
      if(!def&&M.puerta&&!b.civ) str+=1;   // La Puerta de los Estandartes
      if(M.estandarte&&z.capital&&z.owner===f&&!b.civ) str+=1;
      if(M.vetwar&&(u.cb||0)>=3&&!b.civ) d+=1;
      if(u.free&&!b.civ&&z.owner===f&&z.b.some(x=>x.t==='cuartel'&&x.s==='guardia')) d+=1;   // Guardia de élite: los que trabajan en ese Cuartel
      if(u.t==='esc'&&def&&M.escTortuga) d+=M.escTortuga;
      if(u.t==='esc'&&u.mit) d+=u.mit;
      if(b.siege&&u.brea) str+=u.brea;
      if(u.t==='lan'){ const Lv=M.siege.lan; if(Lv>=2) str+=1; if(Lv>=3) atk+=1; }
      if(def&&M.bastion) d+=4;   // El Bastión Eterno
      if(def&&isPl(z.owner)){
        let fd=fortDefOf(z);
        if(fd>0){ let anti=0; facs.forEach(e=>{ if(isEnemy(g,f,e)&&ramLvl[e]) anti=Math.max(anti,ramLvl[e]); }); fd=Math.max(0,fd-anti); }
        d+=fd; if(z.capital&&z.owner===f) d+=M.capDef; if(z.b.some(x=>x.t==='mar')) d+=M.wonderDef;
      }
      if(str>0&&surprise[f]) str=Math.ceil(str*M.surprise);
      const hp=Math.max(1,hpMax-u.w);
      cu.push({u,f,t:u.t,civ:!!b.civ,gen:!!u.gen,def,hp,hpMax,cush:d,dice:Math.max(0,Math.round(str)),atk:Math.max(0,atk),init,ranged:!!b.ranged,aoe:!!b.aoe,siege:!!b.siege,dead:false,kb:null,fire:u.t==='arq'&&M.arqFire});
    });
  });
  const start={}; facs.forEach(f=>{ start[f]={mil:lst(z,f).filter(u=>!UT[u.t].civ).length,civ:lst(z,f).filter(u=>UT[u.t].civ).length}; });
  // Mando: con la tecnología, las tropas de un tipo que tienen un general vivo en la batalla ganan +1 de defensa
  facs.forEach(f=>{ if(!(g.M[f]||newMods()).mando) return; const has={}; cu.forEach(c=>{ if(c.f===f&&c.gen) has[c.t]=1; }); cu.forEach(c=>{ if(c.f===f&&!c.gen&&has[c.t]&&!c.civ) c.cush+=1; }); });
  // registro de la batalla, para poder repetirla golpe por golpe
  cu.forEach((c,i)=>{ c.i=i; });
  const BL={zone:z.id,step:g.step,terr:z.terrain,owner:z.owner,facs:facs.slice(),surprise:facs.filter(f=>surprise[f]),waves:[],
    units:cu.map(c=>({f:c.f,t:c.t,civ:c.civ,gen:c.gen,def:c.def,hp:c.hp,hpMax:c.hpMax,cush:c.cush,dice:c.dice,atk:c.atk,init:c.init,ranged:c.ranged,aoe:c.aoe}))};
  let curHits=null;
  const hit=(c,x)=>{ const abs=Math.min(x,c.cush); c.cush-=abs; const rem=x-abs; const take=Math.min(rem,c.hp); c.hp-=take; if(c.hp<=0) c.dead=true; if(curHits&&(abs||take)) curHits.push({i:c.i,abs,dmg:take,dead:!!c.dead}); return abs+take; };
  const inits=[...new Set(cu.map(c=>c.init))].sort((a,b)=>a-b);
  for(const w of inits){
    const groups=/** @type {Object<string,any>} */({});
    cu.filter(c=>!c.dead&&c.init===w&&c.dice>0).forEach(c=>{
      let s=0; for(let k=0;k<c.dice;k++) if(rng()<0.5) s++;
      const key=c.f+'_'+(c.civ?'civ':c.t); const gr=groups[key]||(groups[key]={f:c.f,t:c.civ?'civ':c.t,ranged:c.ranged,aoe:c.aoe,dmg:0,fire:c.fire,who:[],dice:0,succ:0});
      gr.dmg+=s*c.atk; gr.who.push(c.i); gr.dice+=c.dice; gr.succ+=s; gr.gen=(gr.gen||0)+(c.gen?1:0); gr.atk1=gr.atk1||c.atk;
    });
    // liderazgo: los generales suman dados a su grupo
    Object.values(groups).forEach(gr=>{ if(gr.gen&&gr.t!=='civ'){ const extra=Math.min(GEN_LEAD_MAX,gr.gen)*GEN_LEAD; for(let k=0;k<extra;k++){ gr.dice++; if(rng()<0.5){ gr.succ++; gr.dmg+=gr.atk1; } } } });
    const hits=Object.values(groups); const wave={init:w,acts:[]}; BL.waves.push(wave);
    hits.forEach(gr=>{
      const act={f:gr.f,t:gr.t,who:gr.who,dice:gr.dice,succ:gr.succ,dmg:gr.dmg,aoe:!!gr.aoe,fire:!!gr.fire,target:null,hits:[]}; wave.acts.push(act);
      if(gr.dmg<=0) return;
      const en={};
      cu.forEach(c=>{ if(!c.dead&&isEnemy(g,gr.f,c.f)){ const k=c.f+'_'+(c.civ?'civ':c.t); (en[k]=en[k]||{units:[],melee:!c.ranged,def:c.def}).units.push(c); } });
      let cand=Object.values(en); if(!cand.length) return;
      if(!gr.ranged){ const m=cand.filter(x=>x.melee); if(m.length) cand=m; }
      cand.sort((a,b)=>(b.def?1:0)-(a.def?1:0)||b.units.length-a.units.length);
      const tg=cand[0]; tg.units.sort((a,b)=>(a.gen?1:0)-(b.gen?1:0));   // los generales son los últimos en caer de su grupo
      act.target={f:tg.units[0].f,t:tg.units[0].civ?'civ':tg.units[0].t}; curHits=act.hits;
      if(gr.fire) tg.units.forEach(c=>{ c.cush=Math.max(0,c.cush-1); });
      if(gr.aoe){ tg.units.forEach(c=>{ hit(c,gr.dmg); if(c.dead&&c.kb===null) c.kb=gr.f; }); }
      else { let d=gr.dmg; for(const c of tg.units){ if(d<=0) break; const used=hit(c,d); d-=used; if(c.dead&&c.kb===null) c.kb=gr.f; } }
      curHits=null;
    });
    if(!wave.acts.length) BL.waves.pop();
  }
  // resultados
  const capt={}, kills={}; facs.forEach(f=>{ capt[f]=0; kills[f]=0; });
  facs.forEach(f=>{ z.units[f]=[]; });
  cu.forEach(c=>{
    if(c.dead){
      unitLost(g,c.u,c.f);   // repoblación: la zona natal de un civil o general caído gana una reducción para el próximo crecimiento
      if(c.kb!==null&&c.kb!==undefined){ kills[c.kb]++; if(c.civ&&isPl(c.kb)) capt[c.kb]++; }
      if(EQUIP_COST[c.t]&&z.owner===c.f){ z.eqPend=z.eqPend||{}; z.eqPend[c.t]=(z.eqPend[c.t]||0)+1; }
    } else {
      if(c.hp<c.hpMax) c.u.w=Math.max(c.u.w,c.hpMax-c.hp);
      c.u.hp=c.hp; c.u.cb=(c.u.cb||0)+1; z.units[c.f].push(c.u);
    }
  });
  facs.forEach(f=>{
    const mil=z.units[f].filter(u=>!UT[u.t].civ).length, civ=z.units[f].filter(u=>UT[u.t].civ).length;
    const lm=start[f].mil-mil, lc=start[f].civ-civ;
    if(lm>0||lc>0) L('Combate en '+zname(z)+': '+PLN[f].name+' pierde '+lm+' militar'+(lm!==1?'es':'')+' y '+lc+' civil'+(lc!==1?'es':'')+'.');
    if(isPl(f)&&g.M[f].botin&&kills[f]>0) g.F[f].gold+=kills[f];
  });
  BL.end={dead:cu.filter(c=>c.dead).map(c=>c.i),wounded:cu.filter(c=>!c.dead&&c.hp<c.hpMax).map(c=>c.i),capt:Object.assign({},capt)};
  g.battles=(g.battles||[]).concat([BL]).slice(-40);
  facs.forEach(f=>{ if(capt[f]>0){ for(let i=0;i<capt[f];i++){ const u=mkUnit(g,f,'pob'); u.w=Math.max(1,3-g.M[f].captHp+1); z.units[f].push(u); } L(PLN[f].name+' captura '+capt[f]+' civil'+(capt[f]>1?'es':'')+' en '+zname(z)+'.'); } });
  facs.forEach(f=>{ if(surprise[f]) L(PLN[f].name+' atacó por sorpresa en '+zname(z)+'.'); });
  { const lo={}; facs.forEach(f=>{ lo[f]={mil:start[f].mil-(z.units[f]||[]).filter(u=>!UT[u.t].civ).length,civ:start[f].civ-(z.units[f]||[]).filter(u=>UT[u.t].civ).length+(capt[f]||0)*0}; }); g.fx.push({k:'fight',zone:z.id,facs:facs.slice(),surprise:facs.filter(f=>surprise[f]),losses:lo,capt:Object.assign({},capt),battle:g.battles.length-1}); }
  facs.forEach(f=>{ if(!z.units[f].length) delete z.units[f]; });
  const ps=presentF(z); z.conflict=ps.some(a=>ps.some(b=>a<b&&isEnemy(g,a,b)));
}
/** @param {Partida} g */
function tributeWave(g,arrivals,L){
  // Los pedidos vencidos caducan; a quien no los cumplió, la tribu lo toma a mal: la relación baja 1 (y en insatisfacción 3 ataca).
  { const vencidos=g.tributes.filter(t=>t.due<g.step); g.tributes=g.tributes.filter(t=>t.due>=g.step);
    vencidos.forEach(t=>{ const tz=g.zones[t.zone]; if(tz.owner!==TRIBE) return; t.targets.forEach(f=>{ if(!t.paid[f]&&isPl(f)&&!g.F[f].out) tribeIgnored(g,tz,f,L); }); }); }
  g.wars=(g.wars||[]).filter(w=>{
    const tz=g.zones[w.tribe]; if(tz.owner!==TRIBE){ L('La guerra con la tribu de '+zname(tz)+' terminó.'); return false; }
    if(g.F[w.f].out) return false;
    const cand=tz.adj.map(a=>g.zones[a]).filter(a=>a.owner===w.f).sort((a,b)=>(a.units[w.f]||[]).length-(b.units[w.f]||[]).length);
    const us=(tz.units[TRIBE]||[]).filter(u=>!u.mv);
    if(cand.length&&us.length){ us.forEach(u=>{ tz.units[TRIBE].splice(tz.units[TRIBE].indexOf(u),1); u.mv=1; }); arrivals.push({f:TRIBE,to:cand[0].id,units:us,st:'ataque'}); L('La tribu de '+zname(tz)+' ataca '+zname(cand[0])+' con todos los suyos.'); }
    w.left--; if(w.left<=0){ L('La guerra con la tribu de '+zname(tz)+' terminó.'); return false; } return true;
  });
}
// Ignorar un pedido baja la relación 1 (hasta −3). En insatisfacción 3 la tribu declara la guerra.
/** @param {Partida} g */
function tribeIgnored(g,tz,f,L){
  tz.rel=tz.rel||{}; const r=Math.max(TRIBE_REL_MIN,(tz.rel[f]||0)-1); tz.rel[f]=r;
  if(r<=TRIBE_REL_MIN){ tribeAttacks(g,tz,f,L); return; }
  L('La tribu de '+zname(tz)+' se siente ignorada por '+PLN[f].name+': relación '+r+' ('+TRIBE_REL_N[r+3]+')'+(r<0?'; insatisfacción '+(-r)+' de '+(-TRIBE_REL_MIN)+' (con '+(-TRIBE_REL_MIN)+' ataca)':'')+'.');
}
/** @param {Partida} g */
function tribeAttacks(g,tz,f,L){
  g.wars=g.wars||[]; if(g.wars.some(w=>w.tribe===tz.id&&w.f===f)) return;
  g.wars.push({tribe:tz.id,f,left:TRIBE_WAR_STEPS}); tz.rel=tz.rel||{}; tz.rel[f]=0;
  (tz.units[TRIBE]||[]).forEach(u=>{ if(u.t!=='ber'){ u.t='ber'; u.hp=mhp(g,TRIBE,'ber',tz); u.str=2; u.w=0; } });
  g.tributes=g.tributes.filter(t=>!(t.zone===tz.id&&t.targets.length===1&&t.targets[0]===f));
  L('¡La tribu de '+zname(tz)+', harta de que '+PLN[f].name+' la ignore, le declara la guerra! Atacará con todos los suyos durante '+TRIBE_WAR_STEPS+' pasos.'); g.fx.push({k:'tribewar',zone:tz.id,f});
}
// Atacar a una tribu es entrar en guerra con ella: sus civiles se vuelven guerreros (berserkers) y durante unos pasos
// atacan con todos los suyos a tus zonas más cercanas. La relación con esa tribu vuelve a 0.
/** @param {Partida} g */
function declareTribeWar(g,tz,f,L){
  g.wars=g.wars||[]; const w=g.wars.find(x=>x.tribe===tz.id&&x.f===f); if(w){ w.left=TRIBE_WAR_STEPS; return; }
  g.wars.push({tribe:tz.id,f,left:TRIBE_WAR_STEPS}); tz.rel=tz.rel||{}; tz.rel[f]=0;
  (tz.units[TRIBE]||[]).forEach(u=>{ if(u.t!=='ber'){ u.t='ber'; u.hp=mhp(g,TRIBE,'ber',tz); u.str=2; u.w=0; } });
  g.tributes=g.tributes.filter(t=>!(t.zone===tz.id&&t.targets.length===1&&t.targets[0]===f));
  L('¡'+PLN[f].name+' ataca a la tribu de '+zname(tz)+'! Entran en guerra: todos los suyos se vuelven guerreros y atacarán durante '+TRIBE_WAR_STEPS+' pasos.');
}
