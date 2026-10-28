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
      const mode=['new','civ','sol'].includes(fv('tr_mode','new'))?fv('tr_mode','new'):'new';
      const all=MIL.filter(t=>!TRAIN_TECH[t]||techOwn(G,ME,TRAIN_TECH[t])); const opts=mode==='civ'?all.filter(t=>GEN_TYPES.includes(t)):mode==='sol'?all.filter(t=>WEAPON_T.includes(t)):all;
      const u=opts.includes(fv('tr_u','sol'))?fv('tr_u','sol'):opts[0]; if(!u) break;
      if(mode==='new'){ const n=Math.min(Math.max(1,Number(fv('tr_n',1))||1),recruitLeft(z)); if(n>0&&canRecruit(G,ME,z,u)) addOrder({t:'train',zone:z.id,u,n,from:'new'}); ui.form.tr_n=1; break; }
      const pool=trainPool(z); const ids=(ui.trainIds||[]).filter(id=>pool.some(p=>p.id===id));
      if(ids.length) addOrder({t:'train',zone:z.id,u,n:ids.length,from:mode,ids}); ui.trainIds=[]; break; }
    case 'trmode': ui.form.tr_mode=d.v; ui.trainIds=[]; break;
    case 'trn': ui.form.tr_n=Math.max(1,(Number(fv('tr_n',1))||1)+Number(d.d)); break;
    case 'trtype': ui.form.tr_u=d.v; break;
    case 'trpick': { const id=Number(d.id); ui.trainIds=ui.trainIds||[]; ui.trainIds=ui.trainIds.includes(id)?ui.trainIds.filter(x=>x!==id):ui.trainIds.concat(id); break; }
    case 'trbest': ui.trainIds=trainPool(z).slice(0,Number(d.n)).map(u=>u.id); break;
    case 'trclear': ui.trainIds=[]; break;
    case 'dmstep': ui.form[d.k]=Math.max(0,Math.min(Number(d.mx||999),(Number(fv(d.k,0))||0)+Number(d.d))); break;
    case 'demob': {
      DEMOB_FROM.forEach(t=>{ ['baja','ret'].forEach(k=>{ const key='dm_'+k+'_'+t; const n=Math.min(Number(fv(key,0))||0,milFree(z,t,k==='ret')); if(n>0) addOrder({t:'demob',zone:z.id,u:t,to:k==='baja'?'baja':'pob',n}); ui.form[key]=0; }); }); break; }
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
    case 'bid': { const i=Number(d.i); const el=document.querySelector('[data-f="bid_'+i+'"]'); const amt=Math.max(0,Math.floor(Number(el?el.value:0)||0)); ui.orders=ui.orders.filter(o=>!(o.t==='bid'&&o.item===i)); addOrder({t:'bid',item:i,amount:amt}); break; }
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
    case 'ofopen': ui.offerTo=(ui.offerTo===Number(d.t))?null:Number(d.t); break;
    case 'ofset': ui.form[d.k]=d.v; break;
    case 'ofstep': { const cur=Number(fv(d.k,5))||0; const mx=d.k==='of_gn'?Math.floor(ownedTotal(G,ME,fv('of_give','gold'))):999; ui.form[d.k]=Math.max(0,Math.min(mx,cur+Number(d.d))); break; }
    case 'ofgo': { const to=Number(d.t); const give=fv('of_give','gold'); let ask=fv('of_ask','food'); if(ask===give) ask=['gold','food','prod','tech'].find(r=>r!==give);
      const gn=Math.min(Math.floor(ownedTotal(G,ME,give)),Number(fv('of_gn',5))||0), an=Number(fv('of_an',5))||0; if(gn>0&&an>0){ addOrder({t:'offer',to,give:{res:give,n:gn},ask:{res:ask,n:an}}); ui.offerTo=null; toast('Oferta lista','Se envía a '+PLN[to].name+' al presionar ¡Listo!','pos','🤝'); } break; }
    case 'enclater': { const e=G.F[ME].enc; if(e) ui.encHide=e.step; break; }
    case 'encopen': ui.encHide=null; break;
    case 'mvst': ui.mv.st=d.v; break;
    case 'mvstep': { const t=d.k.slice(3); const mx=availQ(ui.mv.from,t); ui.form[d.k]=Math.max(0,Math.min(mx,(Number(fv(d.k,0))||0)+Number(d.d))); break; }
    case 'mvquick': { CIV.concat(MIL).forEach(t=>{ const mx=availQ(ui.mv.from,t); const hostile=G.zones[ui.mv.to].owner!==null&&G.zones[ui.mv.to].owner!==ME&&!allied(G,ME,G.zones[ui.mv.to].owner);
        ui.form['mv_'+t]=d.v==='none'?0:(d.v==='mil'?(MIL.includes(t)&&t!=='ari'&&t!=='lan'?mx:0):(CIV.includes(t)&&hostile?0:mx)); }); break; }
    case 'mvvia': ui.form.mv_via=d.v; break;
    case 'sdset': ui.form[d.k]=d.k==='sd_q'&&d.v!=='sobrante'?Number(d.v):d.v; if(d.k==='sd_mode'&&d.v==='each'&&ui.form.sd_q!=='sobrante'&&![1,2,5,10].includes(Number(ui.form.sd_q))) ui.form.sd_q=5; break;
    case 'sdq': { const cur=fv('sd_q',5); const base=cur==='sobrante'?5:Number(cur)||0; const mx=fv('sd_mode','once')==='each'?99:Math.floor(z[fv('sd_res','food')==='prod'?'prod':'food']); ui.form.sd_q=Math.max(0,Math.min(mx,base+Number(d.d))); break; }
    case 'sendgo': { const others=G.zones.filter(a=>a.owner===ME&&a.id!==z.id); const to=others.some(a=>String(a.id)===String(fv('sd_to','')))?Number(fv('sd_to','')):others[0].id; const res=fv('sd_res','food')==='prod'?'prod':'food'; const q=fv('sd_q',5);
      if(fv('sd_mode','once')==='each'){ ui.orders=ui.orders.filter(o=>!(o.t==='route'&&o.from===z.id&&o.to===to&&o.res===res)); addOrder({t:'route',from:z.id,to,res,q:q==='sobrante'?'sobrante':Number(q)}); }
      else { const n=Math.min(Number(q)||0,Math.floor(z[res])); if(n>0) addOrder({t:'send',from:z.id,to,res,q:n}); }
      break; }
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
