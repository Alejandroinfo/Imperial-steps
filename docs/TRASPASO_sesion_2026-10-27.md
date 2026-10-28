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


## Segunda parte de la sesión (reglas y mejoras pedidas por Alejandro)
Ver `Reglas_v0.1.md` sección 28 y `CHANGELOG.md`.
1. **Reglas:** crecer cuesta n²; puestos de trabajo = 2 por nivel; recursos de **plata** (casi todas las zonas) y **oro** (1 de cada 3, efecto doble). Nuevo `zoneDeps(z)`, `resMul(z,key)`; `hasRes` ahora devuelve 0/1/2. Los depósitos usan un azar propio en `newGame` (no mueve el resto de la partida). En las pruebas, `base` borra los depósitos para aislarlas.
2. **Ofertas entre jugadores** (`doOffer`, `makeTradeEnc`, `refundOffer` en `encuentros.js`; orden `offer`; `g.offers`). Reutiliza el mecanismo de encuentros (`k:'trato'`). Lo ofrecido queda en reserva y se devuelve si no se acepta. Interfaz: `offerBuilderHTML` en `zona.js` (sección Rivales de Imperio).
3. **Interfaz:** encuentros en ventana (`#dlgEnc`), pestañas que no se aplastan, avance de vecinos en Victoria (`vicNeighbors`, `vicRivalHTML`), insignias y fichas de recursos (`depBadge`, `depCardsHTML`), escenas de fin de paso (`sceneDirector`).
4. **Pruebas:** `npm test` (72 partidas, 0 errores), `npm run check`, `pruebas/probar_interfaz.py` (14 comprobaciones).

### Pendiente
- Confirmar jugando los 💡: valores de plata/oro, valor de los bots en ofertas, que el crecimiento n² no deje la economía lenta (bots −20 % de población).
- Que los bots también ofrezcan; carretas sobre los envíos automáticos; escenas con sonido propio.
- Borrar del repo las copias sueltas en la raíz (el juego solo usa `index.html`, `js/` y `css/`).
- Reemplazar en el Proyecto: Reglas, traspaso general y este traspaso; ver la lista de archivos a eliminar que te di.
