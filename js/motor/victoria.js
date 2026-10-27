// @ts-check
'use strict';
// Eliminación (fantasmas) y las 7 condiciones de victoria (2 a la vez).

/** @param {Partida} g */
function checkOut(g,L){
  for(let f=0;f<g.N;f++){
    const F=g.F[f]; if(F.out) continue;
    if(totalPop(g,f)===0){
      F.out=true; F.enc=null; L(PLN[f].name+' queda eliminado y pasa a ser fantasma.'); g.fx.push({k:'out',f});
      g.zones.forEach(z=>{ if(z.owner===f){ z.owner=null; z.proj=[]; } });
      const tz=g.zones.filter(z=>z.owner===TRIBE&&(z.units[TRIBE]||[]).length);
      if(tz.length){ const z=tz[Math.floor(g.rng()*tz.length)]; z.owner=f; z.units[f]=z.units[TRIBE]; delete z.units[TRIBE]; F.ghost=true; L(PLN[f].name+' controla ahora la tribu de '+zname(z)+'.'); }
      if(F.ally!==null){ const a=F.ally; F.ally=null; if(g.F[a].ally===f) g.F[a].ally=null; }
    }
  }
}
/** @param {Partida} g */
function thrOf(g){ return g.thr==='prueba'?{gold:300,pop:25,tech:3,terr:0.4,dev:7,wond:2}:{gold:1000,pop:75,tech:5,terr:0.7,dev:20,wond:3}; }
/** @param {Partida} g */
function victoryConds(g,f){
  const T=thrOf(g), F=g.F[f]; const zs=zonesOf(g,f);
  const l5=new Set(TECHS.filter(t=>F.techs[t.n]&&t.l===5).map(t=>t.r)).size;
  const caps=zs.filter(z=>z.capital).length;
  const dev=zs.reduce((a,z)=>a+z.b.filter(b=>b.t!=='mar').length,0);
  const wond=zs.reduce((a,z)=>a+z.b.filter(b=>b.t==='mar').length,0);
  const pop=totalPop(g,f);
  const need=Math.floor(g.zones.length*T.terr)+1;
  return [
    {k:'Comercial',d:'Oro en cofres',v:Math.floor(F.gold),t:T.gold,ok:F.gold>=T.gold},
    {k:'Económica',d:'Población',v:pop,t:T.pop,ok:pop>=T.pop},
    {k:'Tecnología',d:'Nivel 5 de ramas distintas',v:l5,t:T.tech,ok:l5>=T.tech},
    {k:'Territorial',d:'Zonas controladas',v:zs.length,t:need,ok:zs.length>=need},
    {k:'Militar',d:'Capitales controladas',v:caps,t:2,ok:caps>=2},
    {k:'Desarrollo',d:'Edificios',v:dev,t:T.dev,ok:dev>=T.dev},
    {k:'Maravillas',d:'Maravillas',v:wond,t:T.wond,ok:wond>=T.wond}
  ];
}
/** @param {Partida} g */
function checkVictory(g,L){
  const alive=[]; for(let f=0;f<g.N;f++) if(!g.F[f].out) alive.push(f);
  g.vic=alive.map(f=>({f,n:victoryConds(g,f).filter(c=>c.ok).length}));
  const best=Math.max(0,...g.vic.map(x=>x.n)); const leaders=g.vic.filter(x=>x.n===best);
  if(best>=2&&leaders.length===1){ g.over=true; g.winner=[leaders[0].f]; }
  else if(alive.length===1){ g.over=true; g.winner=[alive[0]]; }
  else if(best>=2&&leaders.length>1) L('Varios jugadores cumplen '+best+' condiciones a la vez: la partida continúa hasta que uno tenga más.');
  if(g.over){ for(let f=0;f<g.N;f++){ if(g.F[f].ghost&&g.F[f].ally!==null&&g.winner.includes(g.F[f].ally)) g.winner.push(f); } }
}
