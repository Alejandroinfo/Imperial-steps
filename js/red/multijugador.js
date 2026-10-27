'use strict';
// Multijugador en línea con salas por código, usando Firebase Realtime Database.
//
// Cómo funciona: quien crea la sala es el ANFITRIÓN. Su navegador corre el motor como siempre
// (también los bots de los asientos libres). Las demás personas planean sus órdenes y, al
// presionar ¡Listo!, las escriben en la sala. Cuando todos están listos, el anfitrión resuelve el
// paso y escribe el estado completo, que les llega a todos. Como solo una pantalla resuelve, nadie
// se desincroniza. Firebase guarda el último paso, así que cualquiera (también el anfitrión) puede
// recargar la página y volver a su asiento.
//
// Datos de una sala (salas/CODIGO):
//   creador   uid del anfitrión            config   la partida (JSON), se escribe una vez al empezar
//   creada    hora de creación             estado   {paso, snap: JSON}: el último paso resuelto
//   jugadores a0..a3: {uid, nombre, asiento, conectado}
//   ordenes   a1..a3: {paso, listo, o: JSON}  listos  {paso, v: JSON}: quién está listo (lo escribe el anfitrión)
// Las reglas de seguridad están en firebase/reglas_base_datos.json.

const NET = {
  on: false,        // hay una partida en línea en curso
  host: false,      // esta pantalla es la del anfitrión
  code: null, seat: 0, name: '', uid: null,
  players: [],      // [{asiento, nombre, conectado}]
  humans: [],       // asientos jugados por personas (el resto, bots)
  remote: {},       // asiento -> {paso, ordenes} recibidas por el anfitrión
  cfg: null, sentSig: null, subs: []
};
const NET_BOT_NAMES = ['Bot rojo', 'Bot azul', 'Bot ocre', 'Bot verde'];
const NET_SDK = '13.1.0';
const NET_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';   // sin I ni O, para no confundirlas con 1 y 0

function netConfigured(){ return typeof FIREBASE_CONFIG === 'object' && FIREBASE_CONFIG.apiKey && !/PEGAR/.test(FIREBASE_CONFIG.apiKey); }
function netAvailable(){ return (location.protocol === 'http:' || location.protocol === 'https:') && netConfigured(); }
function netSave(){ try{ sessionStorage.setItem('pasos_sala', JSON.stringify({code:NET.code, name:NET.name})); }catch(e){} }
function netLoad(){ try{ return JSON.parse(sessionStorage.getItem('pasos_sala') || 'null'); }catch(e){ return null; } }
function netForget(){ try{ sessionStorage.removeItem('pasos_sala'); }catch(e){} }

// ---- Firebase: se carga solo cuando hace falta, así el juego contra bots no depende de internet ----
let NET_DB = null;
function netLoadScript(src){
  return new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => fail(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); });
}
async function netFirebase(){
  if(NET_DB) return NET_DB;
  if(typeof firebase === 'undefined' || !firebase.database){
    const base = 'https://www.gstatic.com/firebasejs/' + NET_SDK + '/';
    if(typeof firebase === 'undefined') await netLoadScript(base + 'firebase-app-compat.js');
    if(!firebase.auth) await netLoadScript(base + 'firebase-auth-compat.js');
    if(!firebase.database) await netLoadScript(base + 'firebase-database-compat.js');
  }
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);   // una identidad por pestaña
  // Al recargar, Firebase recupera la identidad de esta pestaña un instante después: hay que esperarla.
  await new Promise(ok => { const stop = auth.onAuthStateChanged(() => { stop(); ok(); }); });
  if(!auth.currentUser) await auth.signInAnonymously();
  NET.uid = auth.currentUser.uid;
  NET_DB = firebase.database();
  return NET_DB;
}
function netRef(p){ return NET_DB.ref('salas/' + NET.code + (p ? '/' + p : '')); }
function netOn(p, cb){ const r = netRef(p); const h = s => cb(s.val()); r.on('value', h); NET.subs.push(() => r.off('value', h)); }
function netOffAll(){ NET.subs.forEach(f => f()); NET.subs = []; }
function netErr(e){
  console.error(e);
  const t = String(e && (e.code || e.message) || e);
  if(/permission/i.test(t)) netStatus('Firebase rechazó la operación (revisa las reglas de la base de datos).');
  else if(/admin-restricted|operation-not-allowed/i.test(t)) netStatus('Falta activar el acceso «Anónimo» en Firebase Authentication.');
  else if(/unauthorized-domain/i.test(t)) netStatus('Esta dirección no está autorizada en Firebase Authentication (Dominios autorizados).');
  else netStatus('No se pudo conectar: ' + t);
}

// ---- Crear sala, unirse y volver ----
async function netCreate(){
  try{
    netStatus('Creando la sala…'); await netFirebase();
    for(let i = 0; i < 20; i++){
      const code = Array.from({length:4}, () => NET_LETTERS[Math.floor(Math.random()*NET_LETTERS.length)]).join('');
      const r = await NET_DB.ref('salas/' + code + '/creador').transaction(cur => cur === null ? NET.uid : undefined);
      if(!r.committed) continue;
      NET.code = code; NET.seat = 0; NET.host = true;
      await netRef('creada').set(firebase.database.ServerValue.TIMESTAMP);
      await netRef('jugadores/a0').set({uid:NET.uid, nombre:NET.name, asiento:0, conectado:true});
      return netEnter();
    }
    netStatus('No se pudo crear la sala. Intenta otra vez.');
  }catch(e){ netErr(e); }
}

async function netJoin(code, quiet){
  try{
    if(!quiet) netStatus('Entrando…');
    await netFirebase();
    NET.code = code;
    const sala = (await netRef().once('value')).val();
    if(!sala || !sala.creador){ NET.code = null; netForget(); netStatus('No existe una sala con ese código.'); return; }
    // ¿Ya tenía un asiento en esta sala? (por ejemplo, al recargar la página)
    const mine = Object.values(sala.jugadores || {}).find(j => j && j.uid === NET.uid);
    if(mine){ NET.seat = mine.asiento; NET.host = mine.asiento === 0; return netEnter(); }
    if(sala.config){ NET.code = null; netStatus('Esa partida ya empezó.'); return; }
    for(let n = 1; n < 4; n++){
      const me = {uid:NET.uid, nombre:NET.name, asiento:n, conectado:true};
      const r = await netRef('jugadores/a' + n).transaction(cur => cur === null ? me : undefined);
      if(r.committed){ NET.seat = n; NET.host = false; return netEnter(); }
    }
    NET.code = null; netStatus('La sala está llena (máximo 4).');
  }catch(e){ NET.code = null; netErr(e); }
}

// Ya con asiento: presencia, lista de jugadores y espera de la partida.
function netEnter(){
  netSave();
  const meRef = netRef('jugadores/a' + NET.seat + '/conectado');
  const con = NET_DB.ref('.info/connected');
  const h = s => { if(s.val() === true){ meRef.onDisconnect().set(false); meRef.set(true); } };
  con.on('value', h); NET.subs.push(() => con.off('value', h));
  netOn('jugadores', v => {
    NET.players = Object.values(v || {}).filter(Boolean).sort((a,b) => a.asiento - b.asiento)
      .map(j => ({asiento:j.asiento, nombre:j.nombre, conectado:!!j.conectado}));
    netShowLobby(); if(G && NET.on) drawChips();
  });
  netOn('config', v => { if(v && !NET.on) netBegin(JSON.parse(v)); });
  if(!$('dlgRed').open) openOnline(); else { netShowLobby(); netStatus(''); }
}

// ---- Partida ----
async function netBegin(cfg){
  NET.on = true; NET.cfg = cfg; NET.remote = {};
  NET.humans = cfg.humanos.map(h => h.asiento);
  ME = NET.seat;
  // Mismos nombres en todas las pantallas, para que el historial se lea igual para todos.
  for(let f = 0; f < 4; f++){ const h = cfg.humanos.find(x => x.asiento === f); PLN[f].name = h ? h.nombre : NET_BOT_NAMES[f]; }
  ['dlgRed','dlgSetup','dlgMenu','dlgEnd'].forEach(id => { if($(id) && $(id).open) $(id).close(); });
  if(typeof TUT !== 'undefined' && TUT.on && typeof tutStop === 'function') tutStop();
  startGame(cfg);
  if(NET.host){
    const prev = (await netRef('estado').once('value')).val();
    if(prev) netApplyState({paso:prev.paso, snap:JSON.parse(prev.snap)});   // el anfitrión vuelve
    else netSendState();                                                     // primer estado de la partida
    netOn('ordenes', netOnOrders);
  } else {
    netOn('estado', v => { if(v) netApplyState({paso:v.paso, snap:JSON.parse(v.snap)}); });
    netOn('listos', v => {
      if(!v || !G || v.paso !== G.step) return;
      JSON.parse(v.v).forEach((r,f) => { if(f !== ME) ui.ready[f] = r; }); drawChips();
    });
  }
  toast('Partida en línea', NET.host ? 'Eres el anfitrión: tu pantalla resuelve los pasos, así que no la cierres.' : 'Juegas con el color de tu capital. El paso avanza cuando todos dan ¡Listo!');
}

// El anfitrión recibe las órdenes de los demás.
function netOnOrders(v){
  if(!G || !NET.host) return;
  let ch = false;
  for(let f = 1; f < 4; f++){
    const e = v && v['a' + f];
    if(!e || e.paso !== G.step) continue;
    if(e.listo){ NET.remote[f] = {paso:e.paso, ordenes:JSON.parse(e.o || '[]')}; if(!ui.ready[f]){ ui.ready[f] = true; ch = true; } }
    else { delete NET.remote[f]; if(ui.ready[f]){ ui.ready[f] = false; ch = true; } }
  }
  if(ch){ drawChips(); netBroadcastReady(); checkAll(); }
}

// El estado completo de la partida, sin el generador (va como número) ni el mapa (se reconstruye).
function netSnapshot(){
  const c = {};
  for(const k in G){ if(k !== 'rng' && k !== 'map') c[k] = G[k]; }
  c.rngState = G.rng.state();
  return c;
}
function netRestore(s){
  const g = JSON.parse(JSON.stringify(s));
  g.rng = mulberry32(g.rngState); delete g.rngState;
  g.map = DATA.maps[g.mapIdx].v[String(g.N)];
  return g;
}

function netSendState(){
  if(!NET.on || !NET.host || !G) return;
  NET.remote = {};
  netRef('estado').set({paso:G.step, snap:JSON.stringify(netSnapshot())}).catch(netErr);
}

function netApplyState(m){
  if(!NET.on || !G) return;
  if(m.paso < G.step) return;
  const replay = m.paso > G.step;   // un paso nuevo: hay animaciones que mostrar
  const before = replay ? [...Array(G.N).keys()].map(f => victoryConds(G, f)) : null;
  G = netRestore(m.snap); recomputeMods(G);
  if(ui.sel !== null && !G.zones[ui.sel]) ui.sel = null;
  if(G.over){ render(); if(before) playFx(G.fx, before); showEnd(); return; }
  beginStep(); render(); if(before) playFx(G.fx, before);
}

function netSendReady(v){
  if(!NET.on || !G) return;
  NET.sentSig = v ? JSON.stringify(ui.orders) : null;
  netRef('ordenes/a' + NET.seat).set({paso:G.step, listo:!!v, o:v ? JSON.stringify(ui.orders) : '[]'}).catch(netErr);
}
// Si alguien cambia sus órdenes después de dar ¡Listo!, se vuelven a mandar.
function netWatchOrders(){
  if(!NET.on || NET.host || !G || !ui || !ui.ready[ME]) return;
  if(JSON.stringify(ui.orders) !== NET.sentSig) netSendReady(true);
}
function netBroadcastReady(){
  if(NET.on && NET.host && G) netRef('listos').set({paso:G.step, v:JSON.stringify(ui.ready)}).catch(netErr);
}
// Órdenes de otra persona para este paso. Se fuerza su asiento para que nadie mande por otro.
function netOrdersOf(f){
  const r = NET.remote[f];
  if(!r || !G || r.paso !== G.step) return [];
  return r.ordenes.map(o => Object.assign({}, o, {f}));
}

// ---- Ventana de la sala ----
function netStatus(txt){ const e = $('redMsg'); if(e){ e.textContent = txt || ''; e.hidden = !txt; } }

function openOnline(){
  ['dlgSetup','dlgMenu','dlgEnd'].forEach(id => { if($(id) && $(id).open) $(id).close(); });
  const ok = netAvailable();
  $('redOff').hidden = ok;
  $('redOff').textContent = !netConfigured() ? 'Falta conectar el juego con Firebase: hay que completar js/red/config_firebase.js (ver docs/multijugador.md). Mientras tanto se puede jugar contra bots.'
    : 'Para jugar en línea hay que abrir el juego desde su dirección web, no con doble clic sobre el archivo. Así solo se puede jugar contra bots.';
  if(!$('redMap').options.length){
    [...$('selMap').options].forEach(o => $('redMap').appendChild(o.cloneNode(true)));
    [...$('selThr').options].forEach(o => $('redThr').appendChild(o.cloneNode(true)));
    $('redMap').value = $('selMap').value; $('redThr').value = $('selThr').value;
  }
  const saved = netLoad(); if(saved && !$('redName').value) $('redName').value = saved.name || '';
  const q = new URLSearchParams(location.search).get('sala'); if(q && !$('redCode').value) $('redCode').value = q.toUpperCase();
  netShowLobby(); netStatus(''); $('dlgRed').showModal();
}

function netShowLobby(){
  const inRoom = !!NET.code && NET.players.length > 0;
  $('redForm').hidden = inRoom || !netAvailable(); $('redLobby').hidden = !inRoom;
  if(!inRoom) return;
  $('redCodeShow').textContent = NET.code;
  const link = location.origin + location.pathname + '?sala=' + NET.code;
  $('redLink').textContent = link; $('redLink').href = link;
  $('redPlayers').innerHTML = NET.players.map(p => `<li><span class="dot" style="background:${PLN[p.asiento].col}"></span>${esc(p.nombre)}${p.asiento === 0 ? ' (anfitrión)' : ''}${p.asiento === NET.seat ? ' — tú' : ''}${p.conectado ? '' : ' · <i>desconectado</i>'}</li>`).join('');
  $('redHost').hidden = !NET.host || NET.on;
  $('redStart').hidden = !NET.host || NET.on;
  $('redWait').hidden = NET.host || NET.on;
  const n = NET.players.length;
  [...$('redN').options].forEach(o => { o.disabled = Number(o.value) < Math.max(2, n); });
  if(Number($('redN').value) < Math.max(2, n)) $('redN').value = String(Math.max(2, n));
}

function netName(){ const v = $('redName').value.trim().slice(0, 14); return v || 'Jugador'; }

function netInit(){
  const st = document.createElement('style');
  st.textContent = '#dlgRed ul{list-style:none;padding:0;margin:8px 0}#dlgRed li{padding:3px 0}#dlgRed .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}#dlgRed input{font:inherit;padding:4px 6px}#redCodeShow{font-size:1.4em;letter-spacing:.15em}';
  document.head.appendChild(st);
  $('btnOnline').addEventListener('click', openOnline);
  $('btnOnline2').addEventListener('click', openOnline);
  $('redCreate').addEventListener('click', () => { NET.name = netName(); netCreate(); });
  $('redJoin').addEventListener('click', () => {
    const code = $('redCode').value.trim().toUpperCase(); if(!code){ netStatus('Escribe el código de la sala.'); return; }
    NET.name = netName(); netJoin(code);
  });
  $('redStart').addEventListener('click', () => {
    const N = Math.max(Number($('redN').value), NET.players.length);
    const cfg = {mapIdx:Number($('redMap').value), N, thr:$('redThr').value, seed:Math.floor(Math.random()*1e9),
                 humanos:NET.players.map(p => ({asiento:p.asiento, nombre:p.nombre}))};
    netRef('config').set(JSON.stringify(cfg)).catch(netErr);
  });
  $('redClose').addEventListener('click', () => { $('dlgRed').close(); if(!G) openSetup(); });
  $('dlgRed').addEventListener('cancel', e => { if(!G){ e.preventDefault(); $('dlgRed').close(); openSetup(); } });
  if(!netAvailable()) return;
  // Se espera a que cargue toda la página, para que main.js ya haya abierto «Partida nueva».
  window.addEventListener('load', () => {
    // Si esta pestaña ya estaba en una sala (por ejemplo, al recargar la página), vuelve sola a su asiento.
    const saved = netLoad();
    if(saved && saved.code){ NET.name = saved.name || 'Jugador'; netJoin(saved.code, true); }
    // Con un enlace ?sala=ABCD se abre directo la ventana para unirse.
    else if(new URLSearchParams(location.search).get('sala')) openOnline();
  });
}
netInit();
setInterval(netWatchOrders, 500);
