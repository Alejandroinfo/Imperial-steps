#!/usr/bin/env python3
"""Fuente única de la traducción al inglés.

  idiomas/en.json  →  js/idiomas/en.js   (python herramientas/idiomas.py generar)
  js/idiomas/en_*.js  →  idiomas/en.json (python herramientas/idiomas.py exportar; solo para migrar desde los .js antiguos)

El juego carga js/idiomas/en.js con un <script> normal (así funciona con doble clic, GitHub Pages y el archivo único).
Se edita idiomas/en.json; en.js es un archivo generado y no se toca a mano.
Cada sección tiene "bloques": true si es el cuerpo de la Guía (se busca por bloque entero, ver i18nAddBlocks en js/interfaz/idioma.js).
Marcas en las claves: {0}, {1}… = cualquier texto; {0#} = solo dígitos. Cada marca debe repetirse igual en la traducción.
"""
import json, re, sys, pathlib
RAIZ = pathlib.Path(__file__).resolve().parent.parent
JSON_ = RAIZ / 'idiomas' / 'en.json'
SALIDA = RAIZ / 'js' / 'idiomas' / 'en.js'
LINEA = re.compile(r'^\s*("(?:[^"\\]|\\.)*"):\s*("(?:[^"\\]|\\.)*"),?\s*$')
CAB = re.compile(r'^i18nAdd(Blocks)?\(\{\s*(?://\s*(.*))?$')

def exportar():
    secciones = []
    for f in sorted((RAIZ / 'js' / 'idiomas').glob('en_*.js')):
        sec = None
        for linea in f.read_text(encoding='utf-8').split('\n'):
            m = CAB.match(linea)
            if m:
                sec = {'nombre': (m.group(2) or f.stem).strip(), 'bloques': bool(m.group(1)), 'pares': {}}; secciones.append(sec); continue
            if linea.startswith('})'): sec = None; continue
            p = LINEA.match(linea)
            if p and sec is not None: sec['pares'][json.loads(p.group(1))] = json.loads(p.group(2))
    JSON_.parent.mkdir(exist_ok=True)
    JSON_.write_text(json.dumps({'_leeme': 'Fuente de la traducción al inglés. Edita aquí y corre: python herramientas/idiomas.py generar', 'secciones': secciones}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('exportado:', sum(len(s['pares']) for s in secciones), 'entradas en', len(secciones), 'secciones')

def marcas(s): return sorted(x.replace('#', '') for x in re.findall(r'\{\d+#?\}', s))

def generar():
    d = json.loads(JSON_.read_text(encoding='utf-8'))
    malas = [(k, v) for s in d['secciones'] for k, v in s['pares'].items() if marcas(k) != marcas(v) or not v.strip()]
    if malas: sys.exit('Entradas con marcas distintas o vacías:\n' + '\n'.join('  ' + k[:80] for k, _ in malas[:10]))
    out = ["'use strict';", '// GENERADO por herramientas/idiomas.py a partir de idiomas/en.json: no se edita a mano.',
           '// Diccionario español → inglés. {0#} = solo dígitos; las secciones «bloques» son el cuerpo de la Guía (i18nAddBlocks).']
    for s in d['secciones']:
        out.append('\n' + ('i18nAddBlocks' if s['bloques'] else 'i18nAdd') + '({ // ' + s['nombre'])
        for k, v in s['pares'].items(): out.append('  ' + json.dumps(k, ensure_ascii=False) + ': ' + json.dumps(v, ensure_ascii=False) + ',')
        out.append('});')
    SALIDA.write_text('\n'.join(out) + '\n', encoding='utf-8')
    print('generado:', SALIDA.relative_to(RAIZ), '-', sum(len(s['pares']) for s in d['secciones']), 'entradas')

if __name__ == '__main__':
    {'exportar': exportar, 'generar': generar}.get(sys.argv[1] if len(sys.argv) > 1 else '', lambda: sys.exit(__doc__))()
