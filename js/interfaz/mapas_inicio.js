'use strict';
// Elegir el mapa viendo cómo es: una miniatura de cada mapa con sus zonas y conexiones, y qué lo hace distinto.
// Todo se calcula con los datos del mapa (js/datos/mapas.js), para el número de jugadores elegido.
const MAPROLE_N=['capital','tribu','zona libre'];
// Distancias entre capitales, entradas a la capital, frentes con los vecinos y tribus en el camino.
function mapStats(mi,N){
  const V=DATA.maps[mi].v[String(N)]; const nodes=V.n, E=V.e, n=nodes.length; const adj=Array.from({length:n},()=>[]);
  E.forEach(([a,b])=>{ adj[a].push(b); adj[b].push(a); });
  const caps=nodes.map((x,i)=>x[2]===0?i:-1).filter(i=>i>=0);
  let best=null;   // el par de capitales más cercano
  caps.forEach(a=>{ const d=Array(n).fill(-1), tr=Array(n).fill(99); d[a]=0; tr[a]=0; const q=[a];
    while(q.length){ const u=q.shift(); adj[u].forEach(v=>{ const w=nodes[v][2]===1?1:0; if(d[v]<0){ d[v]=d[u]+1; tr[v]=tr[u]+w; q.push(v); } else if(d[v]===d[u]+1) tr[v]=Math.min(tr[v],tr[u]+w); }); }
    caps.forEach(b=>{ if(b>a&&d[b]>0&&(!best||d[b]<best.d||(d[b]===best.d&&tr[b]<best.t))) best={d:d[b],t:tr[b]}; }); });
  const fronts=E.filter(([a,b])=>nodes[a][0]!==nodes[b][0]).length;
  const entries=Math.min(...caps.map(c=>adj[c].length));
  const deg=E.length*2/n;
  return {zones:n,caps:caps.length,dist:best?best.d:0,tribesOnPath:best?best.t:0,fronts,entries,deg:Math.round(deg*10)/10,edges:E.length};
}
function mapPace(st){ return st.dist<=3?{k:'Rápido',s:'Rápido',c:'#C8452F',t:'Los imperios se tocan casi desde el principio: hay combate y decisiones difíciles pronto.'}:st.dist<=5?{k:'Equilibrado',s:'Medio',c:'#C9A24A',t:'Hay tiempo de crecer antes del primer choque, pero no demasiado.'}:{k:'Lento',s:'Lento',c:'#2F7F4F',t:'Mucho espacio para crecer en paz; el primer contacto llega tarde.'}; }
// Miniatura: aristas = conexiones; capital = color del jugador; tribu = ficha marrón; zona libre = color de su terreno.
function mapThumb(mi,N,big){
  const V=DATA.maps[mi].v[String(N)]; const nodes=V.n; const W=big?240:132, Hh=big?200:110, pad=big?16:11;
  const xs=nodes.map(x=>x[4]), ys=nodes.map(x=>x[5]); const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const sc=Math.min((W-2*pad)/Math.max(0.01,x1-x0),(Hh-2*pad)/Math.max(0.01,y1-y0)); const cx=(x0+x1)/2, cy=(y0+y1)/2;
  const P=i=>[W/2+(nodes[i][4]-cx)*sc, Hh/2+(nodes[i][5]-cy)*sc];
  let s=`<svg class="mthumb" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Miniatura del mapa ${esc(DATA.maps[mi].name)}"><rect width="${W}" height="${Hh}" rx="8" fill="#3B7355"/>`;
  V.e.forEach(([a,b])=>{ const A=P(a),B=P(b); const cross=nodes[a][0]!==nodes[b][0]; s+=`<line x1="${f1(A[0])}" y1="${f1(A[1])}" x2="${f1(B[0])}" y2="${f1(B[1])}" stroke="#E2C79B" stroke-width="${big?3.2:2.2}" stroke-linecap="round" ${cross?'':'opacity=".75"'}/>`; });
  const r=big?[10,7,6]:[7,5,4.2];
  nodes.forEach((nd,i)=>{ const p=P(i), role=nd[2], col=TCOL[nd[3]]||'#ccc';
    if(role===0) s+=`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r[0]}" fill="${PLN[nd[0]%4].col}" stroke="#2A1B16" stroke-width="2"/><path d="M${f1(p[0])},${f1(p[1]-r[0]*.55)} l${f1(r[0]*.18)},${f1(r[0]*.4)} ${f1(r[0]*.42)},${f1(r[0]*.05)} -${f1(r[0]*.32)},${f1(r[0]*.3)} ${f1(r[0]*.1)},${f1(r[0]*.42)} -${f1(r[0]*.38)},-${f1(r[0]*.22)} -${f1(r[0]*.38)},${f1(r[0]*.22)} ${f1(r[0]*.1)},-${f1(r[0]*.42)} -${f1(r[0]*.32)},-${f1(r[0]*.3)} ${f1(r[0]*.42)},-${f1(r[0]*.05)}z" fill="#fff" opacity=".9"/>`;
    else if(role===1) s+=`<rect x="${f1(p[0]-r[1])}" y="${f1(p[1]-r[1])}" width="${r[1]*2}" height="${r[1]*2}" rx="2" fill="#8A5A3A" stroke="#2A1B16" stroke-width="1.6" transform="rotate(45 ${f1(p[0])} ${f1(p[1])})"/>`;
    else s+=`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r[2]}" fill="${col}" stroke="#2A1B16" stroke-width="1.2"/>`; });
  return s+'</svg>';
}
function renderMapPicker(){
  const N=Number($('selN').value), cur=Number($('selMap').value); const box=$('mapPicker'); if(!box) return;
  box.innerHTML=DATA.maps.map((m,i)=>{ const st=mapStats(i,N), pc=mapPace(st); return `<button class="mcard ${i===cur?'on':''}" data-map="${i}" aria-pressed="${i===cur}" title="${esc(m.short)}">${mapThumb(i,N)}<b>${m.id}. ${esc(m.name)}</b><span class="mpace" style="--pc:${pc.c}">${pc.s} · ${st.dist} pasos</span></button>`; }).join('');
  const m=DATA.maps[cur], st=mapStats(cur,N), pc=mapPace(st);
  $('mapInfo').innerHTML=`<div class="mibig">${mapThumb(cur,N,true)}<div class="mileg"><span><i style="background:${PLN[0].col}"></i>capital (cada color, un jugador)</span><span><i class="sq"></i>tribu</span><span><i style="background:#E8DA92;border:1px solid #2A1B16"></i>zona libre</span><span><i class="ln"></i>conexión</span></div></div>`
    +`<div class="mitx"><h3>${m.id}. ${esc(m.name)}</h3><p>${esc(m.short)}.</p><div class="mfacts">`
    +`<div title="Pasos mínimos entre dos capitales"><b>${st.dist}</b><small>pasos entre capitales</small></div>`
    +`<div title="Conexiones que tiene tu capital con sus vecinas: pocas = fácil de defender"><b>${st.entries}</b><small>${st.entries===1?'entrada':'entradas'} a tu capital</small></div>`
    +`<div title="Conexiones directas entre territorios de imperios distintos"><b>${st.fronts}</b><small>${st.fronts===1?'paso':'pasos'} entre imperios</small></div>`
    +`<div title="Tribus que hay que cruzar (como mínimo) para llegar de una capital a otra"><b>${st.tribesOnPath}</b><small>${st.tribesOnPath===1?'tribu':'tribus'} en el camino</small></div></div>`
    +`<p class="mpace2" style="--pc:${pc.c}"><b>${pc.k}.</b> ${pc.t}</p><p class="hint">${st.zones} zonas en total. Todos los mapas tienen lo mismo por jugador (1 capital, 2 tribus y 3 zonas libres, con los 6 terrenos); cambia cómo se conectan.</p></div>`;
}
function initMapPicker(){
  const nb=document.querySelectorAll('#nSeg button'); const setN=n=>{ $('selN').value=String(n); nb.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.n)===n))); renderMapPicker(); };
  nb.forEach(b=>b.addEventListener('click',()=>setN(Number(b.dataset.n))));
  $('mapPicker').addEventListener('click',e=>{ const c=e.target.closest('.mcard'); if(!c) return; $('selMap').value=c.dataset.map; showMapShort(); renderMapPicker(); });
  $('selN').addEventListener('change',()=>{ nb.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.n)===Number($('selN').value)))); renderMapPicker(); });
  $('selMap').addEventListener('change',renderMapPicker);
  setN(Number($('selN').value));
}
