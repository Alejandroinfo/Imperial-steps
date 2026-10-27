"""Prueba de humo de la interfaz con un navegador real (Playwright).
Uso:  python pruebas/probar_interfaz.py     (levanta su propio servidor local)
Comprueba, con clics reales y sin errores de JavaScript: pueblo vivo, fichas de rasgos, movimiento, envíos y tutorial."""
import http.server, socketserver, threading, pathlib, sys, functools
from playwright.sync_api import sync_playwright
RAIZ = pathlib.Path(__file__).resolve().parent.parent
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RAIZ))
H.log_message = lambda *a, **k: None
srv = socketserver.TCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
fallos = []
def ok(cond, msg):
    print(('✓ ' if cond else '✗ ') + msg)
    if not cond: fallos.append(msg)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1500, 'height': 900}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'http://127.0.0.1:{port}/index.html'); pg.wait_for_timeout(500)
    pg.click('#btnStart'); pg.wait_for_timeout(1200)
    cap = pg.evaluate('myCapital()')
    pg.evaluate(f'onZone({cap}); goZone({cap},640,0)'); pg.wait_for_timeout(6000)
    acts = pg.evaluate("new Set(Object.values(LIFE.st).map(s=>s.last).filter(Boolean)).size")
    ok(pg.evaluate("document.querySelectorAll('.pp').length") > 0, 'la gente se dibuja como grupos animables')
    ok(acts >= 2, f'la gente hace actividades distintas ({acts} tipos en 6 s)')
    pg.evaluate("ui.zsub='poblacion'; renderPanel()"); pg.locator('.token[data-id]').first.hover(); pg.wait_for_timeout(300)
    ok(pg.evaluate("!!document.querySelector('#ficha.on')"), 'la ficha de rasgos aparece al pasar el mouse')
    pg.evaluate("ui.zsub='mover'; renderPanel()"); pg.locator('.ntile').first.click(); pg.locator('.stp .sb button').first.click()
    pg.click('[data-act=mvgo]'); ok(pg.evaluate("ui.orders.some(o=>o.t==='move')"), 'mover con tarjetas y botones crea la orden')
    pg.evaluate("(c)=>{ const z=G.zones[c]; G.zones[z.adj[0]].owner=0; z.food=20; ui.orders=[]; }", cap)
    pg.evaluate("ui.zsub='recursos'; renderPanel()"); pg.click('[data-act=sendgo]')
    ok(pg.evaluate("ui.orders.some(o=>o.t==='send')"), 'enviar una vez crea la orden')
    pg.locator('.sdmode button').nth(1).click(); pg.click('[data-act=sendgo]')
    ok(pg.evaluate("ui.orders.some(o=>o.t==='route')"), 'enviar cada paso crea el envío automático')
    # --- ronda 2: popup de encuentros, victoria, recursos, ofertas, escenas ---
    pg.evaluate("ui.orders=[]; G.F[0].enc={id:'refugiados',k:'oferta',who:'Unos refugiados',txt:'piden quedarse',zone:myCapital(),cost:{res:'food',n:5},gain:{units:{pob:2}},refuse:null,step:G.step}; renderPanel()"); pg.wait_for_timeout(300)
    ok(pg.evaluate("document.getElementById('dlgEnc').open"), 'un encuentro nuevo sale en ventana emergente')
    pg.click('#dlgEnc [data-act=encounter][data-v=si]')
    ok(not pg.evaluate("document.getElementById('dlgEnc').open") and pg.evaluate("ui.orders.some(o=>o.t==='encounter')"), 'al decidir, la ventana se cierra y la decisión queda en Órdenes')
    pg.evaluate("ui.tab='vic'; renderPanel()"); ok(pg.evaluate("document.querySelectorAll('.vrival').length")>0, 'Victoria muestra el avance de los vecinos')
    pg.evaluate(f"onZone({cap}); ui.zsub='mover'; renderPanel()"); ok(pg.evaluate("document.querySelectorAll('.ntile .db').length")>0, 'las zonas vecinas muestran sus recursos con insignias')
    pg.locator('.ntile .db').first.hover(); pg.wait_for_timeout(250); ok(pg.evaluate("!!document.querySelector('#ficha.on')"), 'la ficha del recurso dice qué hace')
    pg.evaluate("ui.orders=[]; ui.tab='imperio'; renderPanel()"); pg.locator('[data-act=ofopen]').first.click(); pg.locator('.ofres').nth(1).locator('button').nth(1).click(); pg.click('[data-act=ofgo]')
    ok(pg.evaluate("ui.orders.some(o=>o.t==='offer')"), 'ofrecer recursos a un rival crea la orden')
    pg.evaluate("window.__f=G.zones.find(z=>z.role==='vacia'&&z.id!==myCapital()).id; playFx([{k:'fight',zone:window.__f,facs:[0,4],losses:{0:{mil:1,civ:0},4:{mil:0,civ:0}},surprise:[],capt:{}}],null)"); pg.wait_for_timeout(1700)
    ok(pg.evaluate("Math.abs(VIEW.x+VIEW.w/2-sx(window.__f))<60"), 'la cámara visita la batalla del paso')
    ok(len(errs) == 0, 'sin errores de JavaScript: ' + '; '.join(errs[:3]))
    b.close()
srv.shutdown()
sys.exit(1 if fallos else 0)
