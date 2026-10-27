// Firebase falso para pruebas: imita la parte del SDK compat que usa js/red/multijugador.js
// (app, auth anónimo y Realtime Database), compartiendo los datos entre pestañas del mismo
// navegador con BroadcastChannel. Sirve para probar salas, pasos y reconexión sin internet.
// No reemplaza una prueba con el Firebase real: no aplica las reglas de seguridad.
(function(){
  const canal = new BroadcastChannel('firebase-falso');
  let arbol = {}; let sincronizado = false; const subs = [];
  const listo = new Promise(ok => { canal.addEventListener('message', function f(e){ if(e.data.t === 'arbol'){ canal.removeEventListener('message', f); ok(); } }); setTimeout(ok, 300); });
  const copia = v => v === undefined ? null : JSON.parse(JSON.stringify(v));
  const partes = p => p.split('/').filter(Boolean);
  function leer(p){ let n = arbol; for(const k of partes(p)){ if(n === null || typeof n !== 'object' || !(k in n)) return null; n = n[k]; } return copia(n); }
  function marcaHora(v){ if(v && typeof v === 'object'){ if(v['.sv'] === 'timestamp') return Date.now(); for(const k in v) v[k] = marcaHora(v[k]); } return v; }
  function escribirLocal(p, v){
    const ps = partes(p); v = copia(v);
    if(!ps.length){ arbol = v || {}; } else {
      let n = arbol; for(let i = 0; i < ps.length - 1; i++){ if(n[ps[i]] === null || typeof n[ps[i]] !== 'object') n[ps[i]] = {}; n = n[ps[i]]; }
      if(v === null) delete n[ps[ps.length - 1]]; else n[ps[ps.length - 1]] = v;
    }
    avisar();
  }
  function avisar(){ subs.forEach(s => { const v = leer(s.p); const j = JSON.stringify(v); if(j !== s.ult){ s.ult = j; setTimeout(() => s.cb(foto(v)), 0); } }); }
  function escribir(p, v){ v = marcaHora(copia(v)); escribirLocal(p, v); canal.postMessage({t:'set', p, v}); }
  canal.onmessage = e => {
    const m = e.data;
    if(m.t === 'set') escribirLocal(m.p, m.v);
    else if(m.t === 'hola') canal.postMessage({t:'arbol', arbol});
    else if(m.t === 'arbol' && !sincronizado){ sincronizado = true; arbol = m.arbol || {}; avisar(); }
  };
  canal.postMessage({t:'hola'});
  const foto = v => ({ val: () => copia(v), exists: () => v !== null });
  const pendientes = [];
  addEventListener('pagehide', () => pendientes.forEach(([p, v]) => escribir(p, v)));
  function ref(p){
    p = partes(p || '').join('/');
    return {
      key: partes(p).pop() || null,
      child: k => ref(p + '/' + k),
      set: v => listo.then(() => escribir(p, v)),
      update: o => listo.then(() => { for(const k in o) escribir(p + '/' + k, o[k]); }),
      remove: () => listo.then(() => escribir(p, null)),
      once: () => listo.then(() => foto(leer(p))),
      on(tipo, cb){
        if(p === '.info/connected'){ setTimeout(() => cb(foto(true)), 0); return cb; }
        const s = {p, cb, ult: undefined}; subs.push(s);
        listo.then(() => { s.ult = JSON.stringify(leer(p)); cb(foto(leer(p))); });
        return cb;
      },
      off(tipo, cb){ const i = subs.findIndex(s => s.p === p && s.cb === cb); if(i >= 0) subs.splice(i, 1); },
      transaction: fn => listo.then(() => { const nv = fn(leer(p)); if(nv === undefined) return {committed:false, snapshot:foto(leer(p))}; escribir(p, nv); return {committed:true, snapshot:foto(leer(p))}; }),
      onDisconnect: () => ({ set: v => { pendientes.push([p, v]); return Promise.resolve(); } })
    };
  }
  let uid = sessionStorage.getItem('ff_uid'); if(!uid){ uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('ff_uid', uid); }
  const auth = { currentUser: null, setPersistence: () => Promise.resolve(), onAuthStateChanged(cb){ setTimeout(() => cb(auth.currentUser), 0); return () => {}; }, signInAnonymously(){ auth.currentUser = {uid}; return Promise.resolve({user:auth.currentUser}); } };
  const db = { ref };
  window.firebase = {
    apps: [], initializeApp(cfg){ this.apps.push(cfg); },
    auth: Object.assign(() => auth, { Auth: { Persistence: { SESSION: 'session' } } }),
    database: Object.assign(() => db, { ServerValue: { TIMESTAMP: {'.sv':'timestamp'} } })
  };
})();
