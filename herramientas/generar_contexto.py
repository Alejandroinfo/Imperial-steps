"""Genera docs/CONTEXTO_PROYECTO/: los archivos listos para subir al Proyecto de Claude y la guía de qué borrar.

Uso:  python herramientas/generar_contexto.py

Copia los 3 documentos vivos (con un número delante para que queden en orden) y escribe
LEEME_QUE_BORRAR_Y_QUE_QUEDARSE.md. Esa carpeta es una COPIA: no se edita a mano; se edita el original en docs/
y se vuelve a correr este script cada vez que cambie un documento.
"""
import pathlib, datetime, re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DOCS = RAIZ / 'docs'
SALIDA = DOCS / 'CONTEXTO_PROYECTO'
SUBIR = [  # (original, nombre en el Proyecto)
    ('TRASPASO_Los_Pasos_del_Imperio.md', '1_TRASPASO_Los_Pasos_del_Imperio.md'),
    ('Reglas_v0.1.md', '2_Reglas_v0.1.md'),
    ('Como_manejar_el_proyecto.md', '3_Como_manejar_el_proyecto.md'),
]
SALIDA.mkdir(exist_ok=True)
for viejo in SALIDA.glob('*.md'):
    viejo.unlink()
hoy = datetime.date.today().isoformat()
# las instrucciones se PEGAN en el campo «Instrucciones del proyecto» (no se suben como archivo)
(SALIDA / '0_INSTRUCCIONES_DEL_PROYECTO_pegar_en_instrucciones.md').write_text((DOCS / 'INSTRUCCIONES_DEL_PROYECTO.md').read_text(encoding='utf-8'), encoding='utf-8')
filas, total = [], 0
for orig, destino in SUBIR:
    texto = (DOCS / orig).read_text(encoding='utf-8')
    (SALIDA / destino).write_text(texto, encoding='utf-8')
    kb = len(texto.encode('utf-8')) / 1024
    total += kb
    ult = re.search(r'\*\*Última actualización:\*\*\s*([^\n]+)', texto)
    filas.append(f'| `{destino}` | {kb:.0f} KB |')

leeme = f"""# Qué subir al Proyecto de Claude (y qué borrar)

*Generado el {hoy} con `python herramientas/generar_contexto.py`. Esta carpeta es una copia: no se edita a mano.*

## 0. Instrucciones del proyecto (se PEGAN, no se suben como archivo)

Abre el Proyecto → «Instrucciones» → reemplaza el texto por el contenido de `0_INSTRUCCIONES_DEL_PROYECTO_pegar_en_instrucciones.md`.

## 1. Sube SOLO estos {len(SUBIR)} archivos (están en esta carpeta)

| Archivo | Tamaño |
|---|---|
""" + '\n'.join(filas) + f"""

Total: **unos {total:.0f} KB**. Si ya hay otras versiones de estos archivos en el Proyecto, **bórralas primero** y sube estas.

## 2. BORRA del Proyecto todo lo demás

Si ves alguno de estos nombres en el conocimiento del Proyecto, bórralo:

| Archivo | Por qué |
|---|---|
| `Reglas_v0_1.md`, `Reglas_v0_1 (1).md` (cualquier otra copia de las reglas) | Duplicados y desactualizados; lo vigente es `2_Reglas_v0.1.md` |
| `TRASPASO_Los_Pasos_del_Imperio.md`, `TRASPASO_Los_Pasos_del_Imperio (1).md` | Duplicados y desactualizados; lo vigente es `1_TRASPASO_…` |
| `TRASPASO_sesion_2026-10-26.md` y `TRASPASO_sesion_2026-10-27.md` | Es historial: lo importante ya está integrado en el traspaso general y en las Reglas. Ya no están en el repositorio (se borraron el 28/10/2026; siguen en el historial de git) |
| `Como_manejar_el_proyecto.md` (versión vieja) | Reemplazado por `3_Como_manejar_el_proyecto.md` |
| `Los_Pasos_del_Imperio_v0_13.html` (cualquier juego empaquetado) | Pesa ~500 KB, está desactualizado y Claude lee el código directo en GitHub |
| `Mapas_v0_1.html`, `atlas_mapas.html` | Pesa ~80 KB y casi nunca hace falta; está en el repositorio |
| `Tecnologias_v0_2.xlsx` | Desactualizado (faltan 3 textos) y la fuente real es `js/datos/tecnologias.js` en GitHub |

**Regla simple:** en el Proyecto solo van documentos de diseño y de trabajo (los {len(SUBIR)} de arriba). El código, los datos y el juego se leen desde GitHub (`Alejandroinfo/Imperial-steps`), con el conector.

## 3. Cada vez que cambie algo

1. Edita el original en `docs/` (no esta carpeta; las instrucciones son `docs/INSTRUCCIONES_DEL_PROYECTO.md`).
2. Corre `python herramientas/generar_contexto.py`.
3. En el Proyecto, borra los {len(SUBIR)} archivos viejos, sube los nuevos y, si cambiaron, vuelve a pegar las instrucciones.

## 4. Mensaje para empezar un chat nuevo

> Soy Alejandro y estoy desarrollando *Los Pasos del Imperio* (repositorio github.com/Alejandroinfo/Imperial-steps). En el conocimiento del proyecto están el traspaso y las reglas: léelos antes de responder y dime en 5 líneas qué entendiste del estado actual. No cambies nada marcado ✅ decidido sin avisarme. Hoy quiero trabajar en **[tema]**.
"""
(SALIDA / 'LEEME_QUE_BORRAR_Y_QUE_QUEDARSE.md').write_text(leeme, encoding='utf-8')
print(f'{len(SUBIR)} archivos + guía → {SALIDA.relative_to(RAIZ)} ({total:.0f} KB para subir)')
