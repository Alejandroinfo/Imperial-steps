"""Junta index.html, los estilos y todos los scripts en un solo archivo HTML.

Sirve para mandar el juego por correo o WhatsApp: quien lo recibe lo abre con doble clic.
El resultado queda en dist/Los_Pasos_del_Imperio.html (esa carpeta no se sube al repositorio).

Uso:  python herramientas/empaquetar.py
"""
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
html = (RAIZ / 'index.html').read_text(encoding='utf-8')

css = (RAIZ / 'css' / 'estilos.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="css/estilos.css">', '<style>\n' + css + '</style>')

def incrustar(m):
    ruta = m.group(1)
    codigo = (RAIZ / ruta).read_text(encoding='utf-8').replace('</script>', '<\\/script>')
    return f'<script>\n// ---- {ruta} ----\n{codigo}</script>'

html, n = re.subn(r'<script src="([^"]+)"></script>', incrustar, html)

salida = RAIZ / 'dist' / 'Los_Pasos_del_Imperio.html'
salida.parent.mkdir(exist_ok=True)
salida.write_text(html, encoding='utf-8')
print(f'{n} scripts incrustados → {salida.relative_to(RAIZ)} ({salida.stat().st_size // 1024} KB)')
