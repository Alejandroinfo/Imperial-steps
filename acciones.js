'use strict';
// Traduce los botones de la interfaz en órdenes.

function addOrder(o){ ui.orders.push(o); }
function act(a,d){
  const z=ui.sel!==null?G.zones[ui.sel]:null;
  switch(a){
    case 'stance': { const t=Number(d.t); ui.orders=ui.orders.filter(o=>!(o.t==='stance'&&o.target===t)); if(d.v!==stanceOf(G,ME,t)) addOrder({t:'stance',target:t,stance:d.v}); break; }
    case 'spec': {
      const civT=CIV.filter(t=>availQ(z.id,t)>0); const from=civT.includes(fv('sp_from','pob'))?fv('sp_from','pob'):civT[0];
      const toT=CIV.filter(t=>t!==from); const to=toT.includes(fv('sp_to','agr'))?fv('sp_to','agr'):toT[0];
      const n=Math.min(Number(fv('sp_n',1))||0,availQ(z.id,from)); if(n>0) addOrder({t:'spec',zone:z.id,from,to,n}); break; }
    case 'train': {
      const opts=MIL.filter(t=>!TRAIN_TECH[t]||techOwn(G,ME,TRAIN_TECH[t])); const u=opts.includes(fv('tr_u','sol'))?fv('tr_u','sol'):opts[0];
      const weapon=['arq','esc','ber','cab'].includes(u); const from=(weapon&&fv('tr_src','civ')==='sol')?'sol':'civ';
      const avail=from==='sol'?availQ(z.id,'sol'):CIV.reduce((s,t)=>s+availQ(z.id,t),0);
      const n=Math.min(Number(fv('tr_n',1))||0,avail); if(n>0) addOrder({t:'train',zone:z.id,u,n,from:from==='sol'?'sol':'pob'}); break; }
    case 'demob': {
      const can=DEMOB_FROM.filter(t=>availQ(z.id,t)>0); if(!can.length) break;
      const u=can.includes(fv('dm_u',can[0]))?fv('dm_u',can[0]):can[0]; const to=CIV.includes(fv('dm_to','pob'))?fv('dm_to','pob'):'pob';
      const n=Math.min(Number(fv('dm_n',1))||0,availQ(z.id,u)); if(n>0) addOrder({t:'demob',zone:z.id,u,to,n}); break; }
    case 'build': addOrder({t:'build',zone:Number(d.zone),bt:d.bt,spec:d.spec||null}); ui.bpick=null; break;
    case 'bpick': ui.bpick=(ui.bpick&&ui.bpick.bt===d.bt&&ui.bpick.zone===Number(d.zone))?null:{zone:Number(d.zone),bt:d.bt}; break;
    case 'battle': openBattle(Number(d.b)); return;
    case 'bvgo': { stopBattle(); const k=Number(d.k); if(k===BV.k+1) battleSound(k); BV.k=k; renderBattle(); return; }
    case 'bvplay': playBattle(); return;
    case 'wonder': addOrder({t:'wonder',zone:Number(d.zone),w:d.w}); break;
    case 'upgrade': addOrder({t:'upgrade',zone:Number(d.zone),bi:Number(d.bi)}); break;
    case 'bspec': { const v=fv('bs_'+d.zone+'_'+d.bi,''); if(v) addOrder({t:'bspec',zone:Number(d.zone),bi:Number(d.bi),spec:v}); break; }
    case 'demolish': addOrder({t:'demolish',zone:Number(d.zone),bi:Number(d.bi)}); break;
    case 'send': { const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id); const to=others.some(a=>String(a.id)===String(fv('sd_to','')))?Number(fv('sd_to','')):others[0].id; const q=Number(fv('sd_q',5))||0; if(q>0) addOrder({t:'send',from:z.id,to,res:fv('sd_res','food'),q}); break; }
    case 'fold': ui.det=ui.det||{}; ui.det[d.k]=!ui.det[d.k]; break;
    case 'tutnext': tutNext(); return;
    case 'tutstop': tutStop(); render(); return;
    case 'encounter': ui.orders=ui.orders.filter(o=>o.t!=='encounter'); addOrder({t:'encounter',choice:d.v}); break;
    case 'growmode': ui.orders=ui.orders.filter(o=>!(o.t==='growmode'&&o.zone===z.id)); if(d.v!==(z.growMode||GROW_MODE_DEFAULT)) addOrder({t:'growmode',zone:z.id,mode:d.v}); break;
    case 'pausebuild': { const zz=G.zones[Number(d.zone)]; if(!zz||zz.owner!==ME) break; const pd=ui.orders.filter(o=>o.t==='pausebuild'&&o.zone===zz.id).pop(); const cur=pd?pd.on:!!zz.pauseBuild; ui.orders=ui.orders.filter(o=>!(o.t==='pausebuild'&&o.zone===zz.id)); if(!cur!==!!zz.pauseBuild) addOrder({t:'pausebuild',zone:zz.id,on:!cur}); break; }
    case 'autospec': ui.orders=ui.orders.filter(o=>!(o.t==='autospec'&&o.zone===z.id)); if(d.v!==(z.autoSpec||'pob')) addOrder({t:'autospec',zone:z.id,to:d.v==='pob'?null:d.v}); break;
    case 'route': { const from=d.from!==undefined?Number(d.from):z.id;
      if(d.q==='0'){ addOrder({t:'route',from,to:Number(d.to),res:d.res,q:0}); break; }
      const others=G.zones.filter(a=>a.owner===ME&&a.id!==from); const to=others.some(a=>String(a.id)===String(fv('rt_to','')))?Number(fv('rt_to','')):others[0].id;
      const q=fv('rt_q','sobrante'); ui.orders=ui.orders.filter(o=>!(o.t==='route'&&o.from===from&&o.to===to&&o.res===fv('rt_res','food')));
      addOrder({t:'route',from,to,res:fv('rt_res','food'),q:q==='sobrante'?'sobrante':Number(q)}); break; }
    case 'annex': addOrder({t:'annex',zone:Number(d.zone),from:Number(d.from)}); ui.mv=null; break;
    case 'tribute': addOrder({t:'tribute',tribe:Number(d.tribe),from:Number(d.from)}); break;
    case 'ally': addOrder({t:'ally',target:Number(d.t)}); break;
    case 'unally': addOrder({t:'ally',off:1}); break;
    case 'research': addOrder({t:'research',name:d.name}); break;
    case 'cancelres': addOrder({t:'cancelres',name:d.name}); break;
    case 'del': ui.orders.splice(Number(d.i),1); break;
    case 'mvst': ui.mv.st=d.v; break;
    case 'mvcancel': ui.mv=null; break;
    case 'mvgo': {
      const u={}; CIV.concat(MIL).forEach(t=>{ const n=Math.min(Number(fv('mv_'+t,0))||0,availQ(ui.mv.from,t)); if(n>0) u[t]=n; });
      if(Object.keys(u).length){ const via=fv('mv_via','')===''?[]:[Number(fv('mv_via',''))]; addOrder({t:'move',from:ui.mv.from,to:ui.mv.to,u,stance:ui.mv.st,via}); }
      ui.mv=null; break; }
    case 'tab': ui.tab=d.tab; break;
    case 'zsub': ui.zsub=d.s; break;
    case 'hf': ui.hf=d.v; break;
    case 'batch': ui.batch=d.b==='todos'?'todos':Number(d.b); break;
    case 'pick': { const id=Number(d.id); if(!ui.pickIds||ui.pick!==d.t) ui.pickIds=[]; ui.pick=d.t;
      if(ui.pickIds.includes(id)) ui.pickIds=ui.pickIds.filter(x=>x!==id);
      else { const list=availListQ(z.id,d.t); const b=ui.batch==='todos'?list.length:(Number(ui.batch)||1); const k=Math.max(0,list.findIndex(u=>u.id===id));
        ui.pickIds=ui.pickIds.concat(list.slice(k,k+b).map(u=>u.id).filter(x=>!ui.pickIds.includes(x))); }
      if(!ui.pickIds.length) ui.pick=null; break; }
    case 'dropst': if(ui.pick&&ui.sel!==null){ dropOnStation(ui.sel,ui.pick,d.st,ui.pickIds); return; } break;
    case 'tfbranch': ui.tf.br=d.b; break;
    case 'tview': ui.tf.view=d.v; break;
    case 'sug': goSuggestion(Number(d.i)); break;
    case 'sugnext': ui.sugI=((ui.sugI||0)+1)%Math.max(1,suggestions().length); break;
    case 'tkind': ui.tf.kind=d.v; break;
    case 'tmsel': ui.tmSel=d.name; break;
    case 'openmap': openTechMap(); return;
    case 'desel': ui.sel=null; ui.mv=null; break;
    case 'zprev': selectNextMine(-1); return;
    case 'znext': selectNextMine(1); return;
    case 'gozone': ui.mv=null; ui.sel=Number(d.id); ui.tab='zona'; ui.zsub='resumen'; if(ui.view==='terr') goZone(ui.sel,VIEW.w>1500?900:VIEW.w,600); break;
    case 'openmv': openMove(Number(d.from),Number(d.to)); break;
  }
  render(); if($('dlgTech').open) renderTechMap();
}
function onZone(id){
  if(ui.sel===id){ ui.tab='zona'; render(); return; }   // volver a tocar la zona elegida la mantiene
  sfx('select');
  ui.mv=null; ui.sel=id; ui.tab='zona'; ui.zsub=(ui.zsub==='mover'&&!(G.zones[id].units[ME]||[]).length&&!mine(G.zones[id]))?'mover':ui.zsub;
  render();
  if(ui.view==='terr'){ const x=sx(id),y=sy(id); const mx=VIEW.w*0.18,my=VIEW.h*0.18; if(x<VIEW.x+mx||x>VIEW.x+VIEW.w-mx||y<VIEW.y+my||y>VIEW.y+VIEW.h-my) goZone(id,VIEW.w,500); }
}
function selectNextMine(dir){
  const mz=G.zones.filter(z=>z.owner===ME); if(!mz.length) return; let i=mz.findIndex(z=>z.id===ui.sel); i=(i+dir+mz.length)%mz.length; if(i<0) i=0;
  ui.mv=null; ui.sel=mz[i].id; ui.tab='zona'; render(); if(ui.view==='terr') goZone(ui.sel,VIEW.w,500);
}
