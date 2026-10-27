"""Partida en línea de prueba con dos navegadores, sin internet ni Firebase real.

Usa pruebas/firebase_falso.js en lugar del SDK de Firebase y comprueba: crear sala, unirse con
el enlace, empezar con un bot, que las dos pantallas queden con el mismo estado paso a paso,
que la invitada y el anfitrión puedan recargar la página y volver a su asiento, y los mensajes
para quien llega tarde o escribe un código que no existe.

Uso:  pip install playwright && python -m playwright install chromium
      python -m http.server 8766          (desde la raíz del repositorio, en otra terminal)
      python pruebas/probar_en_linea.py
"""
import json
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL = 'http://127.0.0.1:8766/'
CONFIG = ("'use strict';\nconst FIREBASE_CONFIG={apiKey:'AIzaPrueba',authDomain:'p.firebaseapp.com',"
          "databaseURL:'https://p-default-rtdb.firebaseio.com',projectId:'p',appId:'1:1:web:1'};\n")
ESTADO = """()=>{const G=window.__ui.G; const c={}; for(const k in G){ if(k!=='rng'&&k!=='map'&&k!=='fx') c[k]=G[k]; }
           return JSON.stringify({c, r:G.rng.state()});}"""
fallas = []


def revisar(nombre, ok):
    print(('✓ ' if ok else '✗ ') + nombre)
    if not ok:
        fallas.append(nombre)


with sync_playwright() as p:
    nav = p.chromium.launch()
    ctx = nav.new_context(viewport={'width': 1300, 'height': 850})
    ctx.add_init_script(path=str(RAIZ / 'pruebas' / 'firebase_falso.js'))
    ctx.route('**/js/red/config_firebase.js',
              lambda r: r.fulfill(status=200, content_type='application/javascript', body=CONFIG))
    ctx.route('**/gstatic.com/**', lambda r: r.abort())
    errores = []

    def pagina(n):
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errores.append(f'{n}: {e}'))
        return pg

    def mismo(a, b):
        return a.evaluate(ESTADO) == b.evaluate(ESTADO)

    def listo_ambos(a, b):
        paso = a.evaluate('window.__ui.G.step')
        b.click('#readyBtn')
        a.click('#readyBtn')
        b.wait_for_function(f'window.__ui.G.step>{paso}', timeout=20000)
        time.sleep(1.2)

    A, B = pagina('anfitrión'), pagina('invitada')
    A.goto(URL)
    A.click('#btnOnline2')
    A.fill('#redName', 'Pao')
    A.click('#redCreate')
    A.wait_for_function("document.getElementById('redCodeShow').textContent.length===4")
    codigo = A.inner_text('#redCodeShow')
    B.goto(URL + '?sala=' + codigo)
    B.wait_for_selector('#dlgRed[open]')
    revisar('el enlace trae el código de la sala', B.input_value('#redCode') == codigo)
    B.fill('#redName', 'Ale')
    B.click('#redJoin')
    A.wait_for_function("document.querySelectorAll('#redPlayers li').length===2")
    revisar('solo el anfitrión ve «Empezar partida»', A.is_visible('#redStart') and not B.is_visible('#redStart'))
    A.select_option('#redN', '3')
    A.click('#redStart')
    for pg in (A, B):
        pg.wait_for_function('window.__ui.G && window.__ui.G.N===3 && NET.on', timeout=15000)
    time.sleep(1)
    revisar('asientos y nombres', A.evaluate('ME') == 0 and B.evaluate('ME') == 1
            and A.evaluate('PLN.slice(0,3).map(p=>p.name)') == ['Pao', 'Ale', 'Bot ocre'])
    revisar('mismo estado al empezar', mismo(A, B))
    for _ in range(4):
        listo_ambos(A, B)
        if not mismo(A, B):
            break
    revisar('mismo estado después de 4 pasos', mismo(A, B))
    B.reload()
    B.wait_for_function('window.__ui.G && NET.on && ME===1', timeout=15000)
    time.sleep(1.5)
    revisar('la invitada recarga y vuelve a su asiento', mismo(A, B))
    paso = A.evaluate('window.__ui.G.step')
    B.click('#readyBtn')
    time.sleep(0.8)
    A.reload()
    A.wait_for_function('window.__ui.G && NET.on && NET.host && ME===0', timeout=15000)
    time.sleep(1.5)
    revisar('el anfitrión recarga, vuelve y ve a la invitada lista',
            A.evaluate('window.__ui.ui.ready[1]') is True and mismo(A, B))
    A.click('#readyBtn')
    B.wait_for_function(f'window.__ui.G.step>{paso}', timeout=20000)
    time.sleep(1.2)
    revisar('la partida sigue después de recargar', mismo(A, B))
    C = pagina('tarde')
    C.goto(URL + '?sala=' + codigo)
    C.wait_for_selector('#dlgRed[open]')
    C.fill('#redName', 'Tía')
    C.click('#redJoin')
    time.sleep(1.5)
    revisar('quien llega tarde recibe un aviso', 'ya empezó' in C.inner_text('#redMsg'))
    revisar('sin errores en las páginas', not errores)
    for e in errores[:5]:
        print('   ', e)
    nav.close()

print(f'\n{len(fallas)} problemas.' if fallas else '\nPartida en línea en orden.')
sys.exit(1 if fallas else 0)
