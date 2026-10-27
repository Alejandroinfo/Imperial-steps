# Traspaso — sesión del 27 de octubre de 2026 (interfaz viva)

Continúa `TRASPASO_sesion_2026-10-26.md`. **Solo cambió la interfaz**: ninguna regla ✅ se tocó, el motor no cambió y `npm test` sigue con 72 partidas sin errores.

## Estado real del repositorio (el traspaso anterior estaba atrás)
El repo ya trae cosas que el traspaso del 26/10 no menciona: **multijugador con Firebase** (`js/red/`, `docs/multijugador.md`), **subasta a sobre cerrado** (`js/motor/subasta.js`), **historias de 4 capítulos** (`js/motor/historias.js`), **zonas peligrosas** (antes fronteras), **rasgos individuales** por civil (2 rasgos de −2 a +2, ver `TRAIT_*` en `js/config/reglas.js`) y la pestaña de órdenes. ⚠ La raíz del repo tiene copias sueltas de casi todos los `.js` y del CSS (desfasadas): el juego solo usa `index.html` + `js/` + `css/`; conviene borrarlas.

## Hecho en esta sesión 🆕
1. **Pueblo vivo** (`js/interfaz/vida.js`, estilos al final de `css/estilos.css`): cada persona es un grupo `.pp` con rutina propia por oficio y temperamento, sin repetir la actividad anterior. Escenario por zona en `LIFE_STAGE` (casas, edificios, campo, pila, blanco, obra). Hambre y heridas se notan. Solo se anima lo visible; se apaga con efectos desactivados, mapa alejado o pestaña oculta. Para añadir una actividad: entrada en `LIFE_ACTS` + función en `LIFE_ACT`.
2. **Rasgos más cálidos** (`formularios.js`): insignias con puntitos, nombre y apodo (`TRAIT_EPI`, `FIRST_NAMES`; solo se ven, no son estado de partida), ficha emergente `#ficha`, medallas ★/☆ en el resumen.
3. **Moverse y enviar sin listas desplegables** (`paneles/zona.js`, `acciones.js`): tarjetas de vecinos, selectores ＋/－, interruptor Paz/Ataque, fichas para el salto del Cuartel; envío unificado (recurso, destino, cantidad, «una vez / 🔁 cada paso»). Órdenes sin cambios (`move`, `send`, `route`). Tutorial pasos 5 y 15 actualizados.
4. `pruebas/probar_interfaz.py` (Playwright): pueblo vivo, ficha, mover, enviar una vez y cada paso, sin errores de JS.

## Pendiente / ideas
- Probar el pueblo vivo en una partida larga y con 4 jugadores (rendimiento con muchas zonas visibles).
- Carretas animadas sobre los envíos automáticos (idea, no hecha).
- Los caminos de las personas cruzan en línea recta: pueden pasar «por detrás» de edificios.
- Los apodos de rasgos son 💡 propuesta mía; confirmar el tono con Pao.
- Siguen abiertos los pendientes de alta prioridad del 26/10 (playtest, tribus como amenaza latente, ritmo y balance).
