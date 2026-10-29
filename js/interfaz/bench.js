'use strict';
// Banco de pruebas de dibujo del mapa (se abre con ?bench=1; no forma parte del juego normal).
// Mide el MISMO valle dibujado de cuatro maneras, para decidir si conviene migrar el mapa a PixiJS:
//   1. SVG actual, efectos completos      2. SVG actual, efectos ligeros
//   3. SVG en dos capas con cámara CSS (fondo fijo + zonas vivas; mover la cámara no repinta nada)
//   4. PixiJS (fondo en texturas, figuras, textos y nubes como objetos de GPU)
// Cada una se mide quieta (3 s) y moviendo/acercando la cámara (3 s). Los números salen en pantalla y se copian con un botón.

const BENCH = { res: [], busy: false, k: 1.5, stage: null, cur: null, css: '', c0: [0, 0] };
const benchWait = ms => new Promise(r => setTimeout(r, ms));
const benchRaf = () => new Promise(r => requestAnimationFrame(r));

// ---------- utilidades de SVG ----------
function benchCss() {
  if (BENCH.css) return BENCH.css; let t = '';
  [...document.styleSheets].forEach(s => { try { [...s.cssRules].forEach(r => { t += r.cssText + '\n'; }); } catch (e) {} });
  return (BENCH.css = t);
}
function benchVb() { const v = $('terr').viewBox.baseVal; return { x: v.x, y: v.y, w: v.width, h: v.height }; }
// Serializa un trozo de escena con sus ids renombrados (así no chocan con los del mapa original).
function benchSvgString(nodes, defs, vb, tag, withCss) {
  const xs = new XMLSerializer(); let body = (defs ? xs.serializeToString(defs) : '') + nodes.map(n => xs.serializeToString(n)).join('');
  const ids = new Set((body.match(/ id="[^"]+"/g) || []).map(s => s.slice(5, -1)));
  ids.forEach(id => { const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); body = body.split(' id="' + id + '"').join(' id="' + tag + id + '"').split('url(#' + id + ')').join('url(#' + tag + id + ')').split('href="#' + id + '"').join('href="#' + tag + id + '"'); });
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${vb.w}" height="${vb.h}">${withCss ? '<style>' + benchCss() + '</style>' : ''}${body}</svg>`;
}
// Parte la escena viva en: fondo (todo menos zonas y nubes) y capa viva (zonas + nubes). Devuelve clones.
function benchSplit() {
  const w = $('worldT'); const c = w.cloneNode(true);
  const defs = c.querySelector('defs'); if (defs) defs.remove();
  const zones = c.querySelector('#zonesT'); const clouds = [...c.querySelectorAll('.cloud')];
  zones && zones.remove(); clouds.forEach(x => x.remove());
  return { defs, back: c, zones, clouds };
}

// ---------- variante 3: SVG en dos capas con cámara CSS ----------
function benchBuildLayers(stage) {
  const vb = benchVb(), sp = benchSplit();
  const mk = (nodes, tag, z) => { const d = document.createElement('div'); d.className = 'benchLayer'; d.style.cssText = `position:absolute;left:0;top:0;width:${vb.w}px;height:${vb.h}px;transform-origin:0 0;will-change:transform;z-index:${z}`; d.innerHTML = benchSvgString(nodes, sp.defs, vb, tag, false); stage.appendChild(d); return d; };
  const back = mk([sp.back], 'bb', 1), live = mk([sp.zones, ...sp.clouds].filter(Boolean), 'bl', 2);
  return { vb, setCamera(cx, cy, w) { const s = stage.clientWidth / w, tx = stage.clientWidth / 2 - (cx - vb.x) * s, ty = stage.clientHeight / 2 - (cy - vb.y) * s, t = `translate(${tx}px,${ty}px) scale(${s})`; back.style.transform = t; live.style.transform = t; }, destroy() { back.remove(); live.remove(); } };
}

// ---------- variante 4: PixiJS ----------
function benchLoadImg(svg) { return new Promise((res, rej) => { const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })); const im = new Image(); im.onload = () => { URL.revokeObjectURL(url); res(im); }; im.onerror = e => { URL.revokeObjectURL(url); rej(new Error('no se pudo rasterizar el SVG')); }; im.src = url; });
}
// Rasteriza una escena a 2×2 trozos (para no pasar del tamaño máximo de textura de los teléfonos) y devuelve los sprites.
async function benchTiles(svg, vb, k, parent) {
  const W = Math.ceil(vb.w * k), H = Math.ceil(vb.h * k); svg = svg.replace('width="' + vb.w + '" height="' + vb.h + '"', 'width="' + W + '" height="' + H + '"');   // el SVG se rasteriza ya al tamaño final (k veces el mundo)
  const im = await benchLoadImg(svg), tw = Math.ceil(W / 2), th = Math.ceil(H / 2); let bytes = 0;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const c = document.createElement('canvas'); c.width = tw; c.height = th; c.getContext('2d').drawImage(im, i * tw, j * th, tw, th, 0, 0, tw, th);
    const sp = new PIXI.Sprite(PIXI.Texture.from(c)); sp.scale.set(1 / k); sp.position.set(vb.x + i * tw / k, vb.y + j * th / k); parent.addChild(sp); bytes += tw * th * 4;
  }
  return bytes;
}
async function benchBuildPixi(stage, onInfo) {
  if (typeof PIXI === 'undefined') throw new Error('falta vendor/pixi.min.js');
  const vb = benchVb(), k = BENCH.k, w0 = $('worldT'), sp = benchSplit();
  const app = new PIXI.Application(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
  await app.init({ width: stage.clientWidth, height: stage.clientHeight, backgroundAlpha: 0, antialias: false, resolution: dpr, autoDensity: true, preference: 'webgl' });
  app.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'; stage.appendChild(app.canvas);
  const world = new PIXI.Container(); app.stage.addChild(world); const back = new PIXI.Container(), zon = new PIXI.Container(), dyn = new PIXI.Container(); world.addChild(back, zon, dyn);
  // fondo y zonas (sin personas ni textos) a textura
  const liveZ = w0.querySelector('#zonesT'); const zc = sp.zones; zc.querySelectorAll('.pp, text').forEach(e => e.remove());
  let bytes = await benchTiles(benchSvgString([sp.back, zc], sp.defs, vb, 'pb', true), vb, k, back);   // fondo + zonas en una sola textura (en el juego real, cada zona se re-rasterizaría al cambiar)
  // figuras: una textura por forma distinta, un sprite por persona
  const toWorld = el => w0.getCTM().inverse().multiply(el.getCTM()); const texCache = new Map(); const figs = []; const FK = 3;
  const people = [...liveZ.querySelectorAll('.pp')];
  for (const el of people) {
    const bb = el.getBBox(); if (!bb.width || !bb.height) continue; const cl = el.cloneNode(true); cl.removeAttribute('transform'); cl.removeAttribute('style');
    const pad = 2, key = cl.outerHTML + bb.x + bb.y; let ent = texCache.get(key);
    if (!ent) { const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bb.x - pad} ${bb.y - pad} ${bb.width + 2 * pad} ${bb.height + 2 * pad}" width="${(bb.width + 2 * pad) * FK}" height="${(bb.height + 2 * pad) * FK}"><style>${benchCss()}</style>${new XMLSerializer().serializeToString(cl)}</svg>`; const im = await benchLoadImg(s); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); ent = { tex: PIXI.Texture.from(c), ox: bb.x - pad, oy: bb.y - pad }; texCache.set(key, ent); bytes += c.width * c.height * 4; }
    const m = toWorld(el).translate(ent.ox, ent.oy).scale(1 / FK); const s = new PIXI.Sprite(ent.tex); s.setFromMatrix(new PIXI.Matrix(m.a, m.b, m.c, m.d, m.e, m.f));
    dyn.addChild(s); figs.push({ s, y0: s.y, x0: s.x, ph: Math.random() * 6.28, sp: 1.2 + Math.random() * 1.6, rot0: s.rotation, work: Math.random() < 0.5 });
  }
  // textos (placas de zona, rótulos)
  const texts = []; [...liveZ.querySelectorAll('text')].forEach(el => {
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) || 10, m = toWorld(el), bb = el.getBBox(); if (!el.textContent.trim()) return;
    const t = new PIXI.Text({ text: el.textContent, style: { fontFamily: cs.fontFamily, fontSize: fs, fontWeight: cs.fontWeight, fill: cs.fill && cs.fill !== 'none' ? cs.fill : '#fff' }, resolution: Math.min(4, k * dpr * 1.5) });
    t.anchor.set(0.5, 0.5); const p = new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(m); t.position.set(p.x, p.y); t.scale.set(Math.hypot(m.a, m.b)); dyn.addChild(t); texts.push(t);
  });
  // nubes que cruzan el mapa
  const clouds = []; for (const el of sp.clouds) { const bb = (() => { const o = [...w0.querySelectorAll('.cloud')][clouds.length]; return o ? o.getBBox() : { x: 0, y: 0, width: 200, height: 100 }; })(); const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bb.x} ${bb.y} ${bb.width} ${bb.height}" width="${bb.width * 1.5}" height="${bb.height * 1.5}">${new XMLSerializer().serializeToString(el)}</svg>`; try { const im = await benchLoadImg(s); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); const sp2 = new PIXI.Sprite(PIXI.Texture.from(c)); sp2.scale.set(1 / 1.5); sp2.position.set(bb.x, bb.y); sp2.alpha = 0.8; dyn.addChild(sp2); clouds.push({ s: sp2, x0: bb.x, sp: 8 + Math.random() * 10 }); } catch (e) {} }
  // motas de producción (como las del pueblo vivo)
  const motes = []; for (let i = 0; i < 40; i++) { const g = new PIXI.Graphics().circle(0, 0, 2.4).fill(0xE9C46A); const f = figs[i % Math.max(1, figs.length)]; g.position.set((f ? f.x0 : 0) + 6, (f ? f.y0 : 0) - 10); dyn.addChild(g); motes.push({ g, ph: Math.random() * 6.28, x0: g.x, y0: g.y }); }
  const t0 = performance.now(); app.ticker.add(() => { const t = (performance.now() - t0) / 1000;
    figs.forEach(f => { f.s.y = f.y0 + Math.sin(t * f.sp + f.ph) * 1.2; if (f.work) f.s.rotation = f.rot0 + Math.sin(t * f.sp * 1.5 + f.ph) * 0.08; });
    clouds.forEach(c => { c.s.x = c.x0 + ((t * c.sp) % 400); });
    motes.forEach(m => { const u = ((t * 0.5 + m.ph) % 1); m.g.y = m.y0 - u * 22; m.g.alpha = 1 - u; }); });
  onInfo({ texMB: Math.round(bytes / 1048576), figs: figs.length, texts: texts.length, clouds: clouds.length, motes: motes.length });
  return { vb, setCamera(cx, cy, w) { const s = stage.clientWidth / w; world.scale.set(s); world.position.set(stage.clientWidth / 2 - cx * s, stage.clientHeight / 2 - cy * s); }, destroy() { app.destroy(true, { children: true, texture: true }); } };
}

// ---------- medición ----------
function benchFrames(ms, onFrame) {
  return new Promise(res => { const t = []; let last = performance.now(); const end = last + ms; (function f(n) { if (onFrame) onFrame((n - last) / 1); t.push(n - last); last = n; if (n < end) requestAnimationFrame(f); else { t.shift(); t.sort((a, b) => a - b); const sum = t.reduce((a, b) => a + b, 0); res({ fps: Math.round(1000 * t.length / sum), p95: Math.round(t[Math.floor(t.length * .95)] || 0), max: Math.round(t[t.length - 1] || 0), lag: t.filter(x => x > 50).length }); } })(performance.now()); });
}
async function benchMove(ms, setCam) {
  const c0x = BENCH.c0[0], c0y = BENCH.c0[1], t0 = performance.now();
  return benchFrames(ms, () => { const u = (performance.now() - t0) / ms; const a = u * Math.PI * 4; setCam(c0x + Math.sin(a) * 300, c0y + Math.cos(a * 0.7) * 220, 1019 - (0.5 - 0.5 * Math.cos(a * 0.5)) * 420); });
}
function benchSetStage(show, keepCam) {
  const cam = $('cam'), vp = cam.parentNode;   // #cam es el mundo entero (enorme y movido con CSS); el visor es su contenedor
  if (!BENCH.stage) { const st = document.createElement('div'); st.id = 'benchStage'; vp.insertBefore(st, cam.nextSibling); BENCH.stage = st; }
  const st = BENCH.stage; st.hidden = !show;
  st.style.cssText = 'position:absolute;left:0;top:0;width:' + vp.clientWidth + 'px;height:' + vp.clientHeight + 'px;overflow:hidden;background:#3E5A2E;z-index:1' + (show ? '' : ';display:none');
  cam.style.display = show && !keepCam ? 'none' : '';
  return st;
}

const BENCH_VARIANTS = [
  { id: 'svg-full', name: '1. SVG actual, efectos completos', run: async () => { setFxLevel('full'); LIFE.on = false; const s = benchSetStage(false); return { cam: (x, y, w) => setView(x, y, w), done() {} }; } },
  { id: 'svg-lite', name: '2. SVG actual, efectos ligeros', run: async () => { setFxLevel('lite'); LIFE.on = false; benchSetStage(false); return { cam: (x, y, w) => setView(x, y, w), done() {} }; } },
  { id: 'capas', name: '3. SVG en dos capas, cámara CSS', run: async () => { setFxLevel('full'); LIFE.on = false; const st = benchSetStage(true, true); const L = benchBuildLayers(st); $('cam').style.display = 'none'; return { cam: (x, y, w) => L.setCamera(x, y, w), done() { L.destroy(); } }; } },
  { id: 'pixi', name: '4. PixiJS', run: async (info) => { setFxLevel('full'); LIFE.on = false; const st = benchSetStage(true, true); const P = await benchBuildPixi(st, info); $('cam').style.display = 'none'; return { cam: (x, y, w) => P.setCamera(x, y, w), done() { P.destroy(); } }; } },
];
async function benchRunAll(onStatus) {
  if (BENCH.busy) return; BENCH.busy = true; BENCH.res = [];
  if (VIEW.anim) { cancelAnimationFrame(VIEW.anim); VIEW.anim = null; }   // que la animación de entrada del juego no mueva la cámara mientras se mide
  { const mc = myCapital(); BENCH.c0 = [sx(mc), sy(mc) + 30]; }
  const fx0 = FXS.level || 'full';
  for (const v of BENCH_VARIANTS) {
    onStatus('Preparando: ' + v.name + '…'); let info = {}, rec = { name: v.name };
    try {
      const h = await v.run(i => { info = i; }); await benchWait(900); h.cam(BENCH.c0[0], BENCH.c0[1], 1019); await benchWait(300);
      onStatus('Midiendo quieta: ' + v.name); rec.idle = await benchFrames(3000);
      onStatus('Midiendo con la cámara en movimiento: ' + v.name); rec.move = await benchMove(3000, h.cam); rec.info = info; h.done();
    } catch (e) { rec.error = String(e && e.message || e); }
    BENCH.res.push(rec); benchSetStage(false);
  }
  setFxLevel(fx0, false); benchSetStage(false); BENCH.busy = false; onStatus('Listo.');
}
function benchEnv() {
  let gpu = '?'; try { const c = document.createElement('canvas'), g = c.getContext('webgl'), e = g.getExtension('WEBGL_debug_renderer_info'); gpu = e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER); } catch (e) {}
  return `Aparato: ${navigator.userAgent}\nPantalla: ${screen.width}×${screen.height}, ratio ${window.devicePixelRatio}, ventana ${innerWidth}×${innerHeight}\nNúcleos: ${navigator.hardwareConcurrency || '?'}, memoria: ${navigator.deviceMemory || '?'} GB\nGPU: ${gpu}`;
}
function benchReport() {
  const f = r => r ? `${r.fps} cuadros/s (p95 ${r.p95} ms, peor ${r.max} ms, ${r.lag} tirones)` : '—';
  return benchEnv() + '\n\n' + BENCH.res.map(r => r.error ? `${r.name}\n   ERROR: ${r.error}` : `${r.name}\n   quieta:    ${f(r.idle)}\n   en movimiento: ${f(r.move)}` + (r.info && r.info.texMB !== undefined ? `\n   texturas: ~${r.info.texMB} MB, ${r.info.figs} figuras, ${r.info.texts} textos` : '')).join('\n\n');
}
function benchPanel() {
  const ya = $('benchPanel'); if (ya) { ya.hidden = false; return; }
  const p = document.createElement('div'); p.id = 'benchPanel'; p.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9999;background:#FBF6EA;border:3px solid #2A1B16;border-radius:12px;padding:10px 12px;max-width:min(520px,94vw);max-height:92vh;overflow:auto;font:13px/1.35 system-ui;box-shadow:0 4px 0 #2A1B16';
  p.innerHTML = '<b style="font-size:15px">Prueba de rendimiento del mapa</b><div style="color:#6B5B50;margin:4px 0">Mide el mismo valle de cuatro maneras (≈ 40 s). No toques nada mientras corre. Prueba con la pantalla encendida y sin otras apps abiertas.</div><label style="display:block;margin:4px 0">Resolución del fondo en Pixi: <select id="benchK"><option value="1">1× (ligero)</option><option value="1.5" selected>1,5×</option><option value="2">2× (nítido, pesa más)</option></select></label><button id="benchGo" style="padding:8px 14px;font-weight:700">▶ Medir todo</button> <button id="benchCopy" style="padding:8px 14px" hidden>📋 Copiar resultados</button> <button id="benchHide" style="padding:8px 10px" title="Ocultar el panel">✕</button><div id="benchSt" style="margin-top:6px;font-weight:700"></div><pre id="benchOut" style="white-space:pre-wrap;margin:6px 0 0;font:12px/1.4 ui-monospace,monospace"></pre>';
  document.body.appendChild(p);
  $('benchGo').onclick = async () => { BENCH.k = Number($('benchK').value); $('benchOut').textContent = ''; $('benchCopy').hidden = true; $('benchGo').disabled = true; await benchRunAll(t => { $('benchSt').textContent = t; }); $('benchGo').disabled = false; $('benchOut').textContent = benchReport(); $('benchCopy').hidden = false; };
  $('benchCopy').onclick = async () => { try { await navigator.clipboard.writeText(benchReport()); $('benchSt').textContent = 'Copiado: pégalo en el chat.'; } catch (e) { $('benchSt').textContent = 'No se pudo copiar: selecciona el texto y cópialo a mano.'; } };
  $('benchHide').onclick = () => { p.hidden = true; };
}
function benchInit() {
  if ($('dlgSetup') && $('dlgSetup').open) $('dlgSetup').close();
  if (!G) { sfxInit(); startGame(); }
  if (typeof TUT !== 'undefined' && TUT.on) tutStop();
  const sm = $('startMsg'); if (sm) sm.className = 'startmsg';
  benchPanel();
}
