# Traspaso — sesión del 26 de octubre de 2026 (v0.3 → v0.13)

**Para qué sirve este documento:** continuar el proyecto en una conversación nueva sin repetir nada. Se centra en **lo que se decidió o cambió en esta sesión**; todo lo anterior ya está en `docs/Reglas_v0.1.md` y `docs/TRASPASO_Los_Pasos_del_Imperio.md`, que se actualizaron y siguen siendo la fuente de verdad.

**Orden de lectura sugerido:** este documento → `docs/TRASPASO_Los_Pasos_del_Imperio.md` (visión general) → `docs/Reglas_v0.1.md` (regla por regla).

---

## 0. Qué subir al Proyecto de Claude

| Archivo | Para qué |
|---|---|
| `docs/TRASPASO_sesion_2026-10-26.md` | Este documento |
| `docs/TRASPASO_Los_Pasos_del_Imperio.md` | Visión general del proyecto |
| `docs/Reglas_v0.1.md` | Fuente de verdad de las reglas (✅ decidido, 💡 propuesta, ❓ por definir, 🆕 nuevo) |
| `dist/Los_Pasos_del_Imperio_v0.13.html` | El juego en un solo archivo |
| `Tecnologias_v0.2.xlsx` | Catálogo de tecnologías (desactualizado, ver pendiente 22) |

Mensaje inicial sugerido para el chat nuevo:

> Estoy desarrollando *Los Pasos del Imperio*. En el conocimiento del proyecto está el traspaso de la última sesión, el traspaso general, las reglas y el prototipo. Léelos antes de responder. Hoy quiero trabajar en **[tema]**. No cambies nada marcado como ✅ decidido sin avisarme.

---

## 1. Idea general y género

Sin cambios respecto de lo ya documentado: **juego de estrategia de territorios con planificación simultánea por pasos**, para jugar en línea con la familia (2 a 4 jugadores). Todos planean a la vez y, cuando todos presionan **¡Listo!**, el paso se resuelve. Se gana cumpliendo **2 de 7 condiciones al mismo tiempo**.

🆕 **Lo que esta sesión agregó a la identidad del juego** (a partir de un comentario clave de Pao: *«no siento diversión, la agresividad es casi nula, no siento tensión»*):

- **La tensión es ahora el eje del diseño.** Tres sistemas nuevos existen solo para eso: fronteras con dilema del prisionero, encuentros inesperados y cadena de suministros.
- **Lo repetitivo se automatiza; lo interesante se decide.** La comida se reparte sola, los científicos investigan solos, los envíos pueden ser recurrentes y los recién nacidos se especializan solos. El objetivo explícito es que cada paso tenga decisiones con peso, no mantenimiento.
- **Doble público:** el juego es para la familia (en español), y el repositorio es además una pieza de portafolio para Alejandro (README y guía de colaboración en inglés).

---

## 2. Mecánicas decididas o cambiadas en esta sesión

Todas están en las reglas con su sección. ✅ = decidido por Pao · 💡 = propuesta mía pendiente de confirmar jugando.

### 2.1 Tensión y conflicto

| Mecánica | Detalle | Estado |
|---|---|---|
| **Fronteras (tierra de nadie)** | Entre cada par de imperios vecinos se genera una zona que **nunca tiene dueño**. El camino que unía sus dos tribus ahora pasa por ella y se conecta con una zona libre de cada lado, así que los vecinos se tocan directamente y las tribus dejan de ser el colchón. | ✅ (4.2, 11) |
| **Dilema del prisionero** | Quien tiene gente en la frontera no produce y come de su zona más cercana, pero gana oro: **+3 por paso a cada uno** si todos están en paz, **+4** si está solo. Si alguien ataca, ese paso nadie gana y el atacante tiene sorpresa. | ✅ regla / 💡 valores (11) |
| **Cadena de suministros** | Dentro del territorio propio la comida circula lejos. **Fuera**, las tropas solo comen si hay un camino de **hasta 2 zonas** (3 con *Suministros de campaña*) hasta una zona propia con comida, **sin pasar por zonas enemigas**. Sin eso pasan hambre; con hambre pelean con **la mitad de los dados** y luego mueren. Una zona propia rodeada queda sitiada (solo sus reservas). | ✅ (8.0) |
| **Encuentros** | Llegan **sin aviso** a una zona (de preferencia de frontera) cada 4 a 7 pasos desde el paso 4, y se deciden en ese mismo paso. 20 tipos con 43 variantes; los montos crecen con la partida. **Solo oportunidades:** ofertas y apuestas. Rechazar o no responder **no tiene consecuencias** (Pao descartó explícitamente las amenazas: «demasiado inesperado y random para estar preparado»). | ✅ (13.2) |
| **Recursos disputados** | Cada recurso estratégico **rinde más mientras más tiempo se controla**: +1 por paso al tomarlo y +1 más cada 5 pasos, hasta +4. Al cambiar de dueño, el contador vuelve a cero. | ✅ regla / 💡 valores (6.3) |
| **Postura entre jugadores** | La postura **Paz / Alerta** es de un jugador hacia otro, **no de una zona**. En Alerta, las tropas atacan a las de ese jugador en cualquier zona donde coincidan. Reemplaza la «postura de zona» y cierra el pendiente de la «segunda ventana de decisión». | ✅ (2, 11) |
| **Entrenar sin Cuartel** | Se puede entrenar en cualquier zona propia. El Cuartel conserva sus ventajas (sus militares no comen, movimiento extra, especializaciones). Motivo: el Cuartel frenaba el inicio y la agresividad. | ✅ (9) |

### 2.2 Economía

| Mecánica | Detalle | Estado |
|---|---|---|
| **Almacenamiento** | 10 por **punto de tamaño** de la zona (antes 10 fijos). El Almacén suma 5 por tamaño por nivel; sus especializaciones, 5/10/15/25 por tamaño; los intereses dan 1 de oro por cada 20 (I) o 10 (II) guardados. | ✅ (8, 15.1) |
| **Prioridad de la comida** | Cada zona elige **Crecer** (todo el sobrante del paso va al crecimiento) o **Guardar** (se acumula; solo lo que no cabe va a crecer). Reemplaza la propuesta de repartir mitad y mitad. | ✅ (8) |
| **Alimentación automática** | Cada zona come de lo suyo y lo que falte sale, sin costo, de la zona propia más cercana con comida (limitado por la cadena de suministros). **Alimentar va antes que crecer.** | ✅ (8) |
| **Etapa de fundación** | Hasta el paso 12, crecer cuesta la mitad. Motivo: el arranque era lento y con pocas decisiones. | 💡 (8) |
| **Capital** | Pasa de +4 a **+2** de cada recurso; *Capital próspera* la sube a +3. | ✅ (7) |
| **Costo de las tropas** | Soldado **1** + equipo = **2 × el nivel de la tecnología** del arma (arco 2, escudo 4, caballo y hacha 6). Antes era 2 y 3 × nivel, y nadie armaba ejércitos. | ✅ regla / 💡 valores (9) |
| **Equipo recuperable** | Si una tropa con equipo muere **en territorio propio**, el arma queda guardada en la zona; cuando no hay conflicto, se reutiliza pagando solo el soldado. Si conquistan la zona, se pierde. | ✅ (9) |
| **Licenciar tropas** | Orden en la pestaña Militar: militar → civil básico 2, → civil especializado 3; gratis con *Reservistas*. Solo tropas sanas, en cualquier zona propia; las máquinas de asedio no se licencian. | ✅ regla / 💡 detalles (5.2) |

### 2.3 Investigación, edificios y automatizaciones

| Mecánica | Detalle | Estado |
|---|---|---|
| **Científicos automáticos** | Si hay algo en cola, investigan solos: lo hacen tantos como alcance la ciencia guardada (2 cada uno) y **el resto genera ciencia**. **Desapareció la orden de asignar.** | ✅ (14.0) |
| **Construir al nivel máximo** | Un edificio nuevo nace directamente en el nivel más alto desbloqueado, en una sola obra (20 por nivel), y se elige con qué especialización nace. | ✅ (15) |
| **Segundo edificio del mismo tipo** | Con una tecnología de **nivel 3** de ese edificio se puede tener un segundo en la zona, con la misma especialización (doble efecto) u otra. Cuesta 50 % más, necesita sus propios trabajadores y otro espacio. | ✅ regla / 💡 costo (15) |
| **Envíos automáticos** | Una zona manda cada paso comida o producción a otra zona propia (cantidad fija o todo el sobrante), pagando la logística en oro. Se hace después de alimentar y antes de crecer. | ✅ (8.0b) |
| **Oficio al nacer** | Cada zona puede fijar en qué oficio nacen sus nuevos pobladores; se especializan al instante si hay producción. | ✅ (8.0b) |

---

## 3. Interfaz: lo que cambió en esta sesión

Casi toda la interfaz se rehízo a partir del juego real de Pao. Lo principal:

- **Mapa como valle continuo.** Las zonas son parcelas que se tocan: **cerca baja** donde hay camino, **barranco con rocas** donde no se puede pasar, campo silvestre entre medio y bosque espeso alrededor. Antes eran islas sobre fondo marrón, que se sentía «un problema de redes, no un pueblo».
- **Placa de zona:** nombre corto de una palabra (Adrianópolis, Saucedo, Brasca…), nivel de la zona (I, II, III), comida y producción con su tope, y pasos hasta el próximo poblador.
- **Resumen de zona nuevo:** comida neta del paso, reservas con barras y **«quién trabaja y dónde»** (cada oficio, su edificio y lo que aporta), más los bonos de capital y de zona.
- **Figuras:** una por persona (hasta 6 por oficio, con «+N»), trabajando junto a su edificio.
- **Edificios en tarjetas** con dibujo, nivel, costo y explicación al pasar el mouse.
- **Tecnologías:** subpestañas (Disponibles, En curso, Mías, Todas), **«⭐ Te ayudan ahora»** y una línea 💡 con el impacto real en tu partida, calculada simulando el próximo paso con y sin la tecnología. Cada rama tiene color e ícono.
- **Turno arriba** (paso, jugadores, recursos, ¡Listo!), y las opciones de partida en una ventana y en el Menú.
- **Visor de batallas:** repite cada combate golpe por golpe, oleada por oleada en orden de iniciativa, con los dos bandos, su vida y el resultado final.
- **Sonido y efectos** generados por código con Web Audio (sin archivos): clic, ¡Listo!, obras, tecnologías, monedas, combates, eventos, victoria y derrota, más ambiente de viento y pájaros. Efectos: temblor de cámara, polvo, destellos y confeti. Controles en el Menú.
- **Sugerencias del paso:** una línea con avisos (hambre, tributos, eventos) e ideas (especializar, poblar, construir, ocupar la frontera); al tocarla lleva al lugar exacto.
- **Tributos y encuentros** con tarjetas claras y botones de pago.
- **Costos explícitos** al mover o enviar: total en el botón, desglose debajo y costo en la flecha del mapa.
- **Panel más corto:** las secciones poco usadas (Licenciar, Enviar ahora, Los que nazcan) se pliegan y el panel recuerda cómo se dejaron.
- **Menos texto, más íconos:** 🌾 comida, ⚒ producción, 🪙 oro, 🔬 ciencia en costos, tributos, anexiones y entrenamiento.
- **Comienzo guiado (tutorial) de 20 pasos:** ver sección 5.

---

## 4. Personajes y elementos (sin cambios de fondo)

- **Civiles:** poblador, agricultor, ingeniero, constructor, científico, comerciante. Cada uno con su figura y herramienta.
- **Militares:** soldado, arquero, caballero, escudero, berserker, más ariete y lanzapiedras (máquinas de asedio).
- **Tribus** (neutrales, una por oficio), **fantasmas** (jugadores eliminados que controlan una tribu y pueden aliarse) y 🆕 **fronteras** como lugar, no como facción.
- **Nombres nuevos** 🆕: capitales Adrianópolis, Zafiria, Ambaria y Esmeralda; tribus Brasca, Morrena, Lobera…; fronteras Encrucijada, Lindero, Mojón, Confín, Raya y Vado Real; zonas libres según su terreno (Peñascal, Robledo, Trigal…).

---

## 5. Comienzo guiado (tutorial)

Decisión de Pao: **no un tutorial corto, sino una forma de empezar a jugar**. Son los primeros 20 pasos de una partida real (mapa Anillo, contra un bot, semilla fija 777) y al terminar la partida sigue normal, con encuentros.

- Una tarjeta sobre el mapa presenta **un sistema por paso** y **resalta con brillo el botón exacto**. Los objetivos se cumplen al hacerlos; las etapas que dependen de la partida tienen «Saltar».
- Recorrido: 1 oficios · 2 tecnología · 3 Molino y constructor · 4 frontera y victoria · 5 expansión y sugerencias · 6 eventos · 7 oficio al nacer · 8 primer encuentro (siempre refugiados) · 9 crecer o guardar · 10 Cuartel · 11 cola de investigación · 12 recursos · 13 tribus · 14 postura · 15 envíos automáticos · 16 soldados · 17 historial · 18 mejorar edificios · 19 combates · 20 despedida.
- Durante el tutorial no llegan encuentros sorpresa; se activan al terminar o al salir con ✕.
- Está en `js/interfaz/tutorial.js`. Para agregar o mover etapas, basta editar `TUT_STEPS` (el código las ordena por paso).

---

## 6. Decisiones técnicas

### 6.1 Motor y lenguaje

- **Hoy:** aplicación web sin dependencias. HTML y **SVG** para dibujar, JavaScript puro para la lógica, cargado con `<script>` normales. Se abre con doble clic, sin servidor ni compilación.
- 🆕 **Comparación de motores de dibujo** (se hizo una demo real con la misma escena en SVG, PixiJS y Phaser, con medidor de FPS y prueba de esfuerzo). **Decisión de Pao: seguir con SVG**, porque funcionó bien en su computadora y PixiJS se ve prácticamente igual. **PixiJS queda como la opción elegida** si algún día el mapa necesita más fluidez: se cambiaría solo el dibujo del mapa y los paneles HTML quedarían intactos. Phaser solo tendría sentido si se rehace todo el cliente.
- **Futuro (sin cambios):** motor en **Python** con pytest y simulador de balance; multijugador con **FastAPI + WebSockets**. Para el primer playtest se propuso además una alternativa rápida: conexión directa entre navegadores (WebRTC con PeerJS), que funcionaría desde GitHub Pages sin servidor propio.

### 6.2 Arquitectura por capas

Regla de dependencias en un solo sentido, verificada por una prueba:

```
js/datos  →  js/config  →  js/motor  →  js/interfaz
(mapas,      (números de    (reglas,      (lo que se
 tecnologías) balance)      sin pantalla)  ve y se toca)
```

El motor **no puede** usar `document`, `window`, `ui` ni generar HTML. Por eso corre sin pantalla en Node (pruebas y simulaciones) y es portable a Python.

### 6.3 Estructura de archivos

```
index.html                  Estructura; carga estilos y scripts en orden
css/estilos.css             Todo el aspecto visual
js/tipos.d.ts            🆕 Tipos: Partida, Zona, Unidad, EstadoJugador, Encuentro, Orden
js/datos/      mapas.js · tecnologias.js
js/config/     reglas.js (números de balance) · efectos_tecnologias.js
js/motor/      estado.js · partida.js · resolver_paso.js · economia.js · combate.js ·
               eventos.js · encuentros.js 🆕 · victoria.js · bots.js · proyeccion.js 🆕
js/interfaz/   mapa/territorio.js · dibujo/{terreno,figuras}.js · paneles/{zona,imperio,
               tecnologias,ordenes,especializar,mapa_tecnologias,mis_zonas}.js ·
               animaciones.js · sonido.js 🆕 · batalla.js 🆕 · sugerencias.js ·
               tutorial.js 🆕 · formularios.js · guia.js · render.js · acciones.js · flujo.js
js/main.js                  Punto de entrada
pruebas/       revisar_capas.js · probar_reglas.js (37 casos) · simular_partidas.js
herramientas/  empaquetar.py · escenarios_balance.js 🆕 · balance_tecnologias.js 🆕
docs/          Reglas_v0.1.md · TRASPASO…md · Como_manejar_el_proyecto.md ·
               balance_economia.md 🆕 · balance_tecnologias.md 🆕 · img/*.jpg
README.md / README.es.md · CONTRIBUTING.md / .es.md · CHANGELOG.md 🆕 · tsconfig.json 🆕
```

Tamaño: unas 4.200 líneas de JavaScript (motor 1.400, interfaz 2.200, datos y configuración 620) más 455 de pruebas y herramientas.

### 6.4 Tipos (TypeScript sin compilar) 🆕

- `js/tipos.d.ts` describe las piezas del juego y **las 20 órdenes** posibles.
- El motor lleva `// @ts-check` y JSDoc; se revisa con `npm run check` y en GitHub Actions. **No hay paso de compilación**: el juego se sigue abriendo con doble clic.
- `resolver_paso.js` tiene un `Record<TipoOrden, number>` con la fase de cada orden: si se agrega una orden y nadie la atiende, la revisión falla. **Así se descubrió que las Maravillas no se podían construir.**
- Estado: **0 avisos** en 87 funciones tipadas. Al pasar el motor a Python, estos tipos se traducen casi directo a dataclasses con mypy.

### 6.5 Pruebas y herramientas de balance

| Comando | Qué hace |
|---|---|
| `npm test` | Regla de capas + 37 pruebas de reglas + 72 partidas entre bots en los 12 mapas |
| `npm run check` | Revisión de tipos del motor |
| `npm run balance` | Escenarios de balance económico + valoración de las 203 tecnologías |
| `python herramientas/empaquetar.py` | Junta todo en `dist/Los_Pasos_del_Imperio.html` |

Los informes quedan en `docs/balance_economia.md` y `docs/balance_tecnologias.md`.

### 6.6 Repositorio y portafolio

- **github.com/Alejandroinfo/Imperial-steps.** README y guía de colaboración **en inglés** (con versiones en español), capturas, diagrama de arquitectura en Mermaid, sección de «engineering highlights» y `CHANGELOG.md`.
- ⚠ **En GitHub está subido solo hasta la v0.4 del código.** Los documentos sí están al día en `docs/`. Ver sección 9.

---

## 7. Qué está terminado

- **Prototipo jugable v0.13** con todo lo listado arriba: 12 mapas (2 a 4 jugadores), economía local y global, 6 oficios, 10 edificios con niveles y especializaciones, 203 tecnologías, 8 tipos de unidad, combate por oleadas con repetición golpe a golpe, tribus, eventos, encuentros, fronteras, recursos, fantasmas, alianzas y las 7 condiciones de victoria.
- **Comienzo guiado de 20 pasos**, recorrido entero con clics reales y sin errores.
- **Proyecto como pieza de portafolio:** capas, tipos, pruebas, simuladores de balance, documentación en dos idiomas y CI.
- **Errores corregidos en esta sesión** (cada uno con su prueba):
  1. **Las Maravillas no se podían construir** (la interfaz creaba la orden `wonder` y el motor no la atendía). Lo encontró la revisión de tipos.
  2. **Trabajadores contados mal:** con varios edificios en una zona, se saltaba a una persona o se la asignaba dos veces.
  3. **Tribus sin gente:** su zona seguía figurando como tribu y el juego se caía al anexarla o al exigir tributo.
  4. Los botones verdes «Ir» aparecían en todas las zonas, sin selección.
  5. *Reservistas* figuraba como simulada pero no hacía nada.
  6. El aviso de hambre saltaba aunque la zona vecina tuviera comida de sobra.
  7. Al expandirse sin pobladores, el formulario de «Ir» no proponía a ningún civil.
  8. El Molino del tutorial se quedaba en 5 % porque la capital se quedaba sin constructores.

---

## 8. Qué falta (por prioridad)

### Alta
1. **Playtest con personas.** Todo lo medido es con bots, que juegan distinto. Pao quiere **multijugador en tiempo real, cada uno en su computadora, en videollamada**; no le molesta que la partida dure muchos pasos.
2. **Multijugador.** Propuesta pendiente: WebRTC con PeerJS (uno crea la sala, los demás entran con un código, funciona desde GitHub Pages). Alternativa de fondo: FastAPI + WebSockets.
3. **Tribus como amenaza latente y tributo negociado** (lo que sigue en el orden que eligió Pao): barra de inquietud visible que sube con el tiempo y con tropas cerca, precio de anexión más alto, y tributo con ofertas secretas donde la tribu ataca al que dio menos.
4. **Confirmar jugando las propuestas 💡** de esta sesión: bonos de frontera, alcance del suministro, etapa de fundación, valores del equipo, costo del segundo edificio.
5. **Ritmo y balance:** la población de los bots se estanca cerca de 10 y casi nadie gana antes del paso 60 (pendientes 28 y 32).
6. **19 de 203 tecnologías** siguen sin efecto simulado (lista en la sección 23.2 de las reglas).
7. **Motor a Python** con pytest y simulador de balance.

### Media
8. Bots mejores (siguen atacando poco).
9. **El mapa completo se ve cargado** con 20 zonas: convendría que al alejar se muestren solo nombres y colores.
10. Guardar y cargar partida (un playtest real se corta).
11. Registro descargable de la partida (tiempos, órdenes, victorias) para decidir el reloj con datos.
12. Pasar al Excel los textos de tecnologías que cambiaron (pendiente 22).
13. Los ❓ de la sección 20 de las reglas.

### Baja
14. Música (los efectos de sonido ya están), arte definitivo, accesibilidad, más de 4 jugadores.
15. Ideas de interfaz pendientes: ficha rápida al pasar el mouse por una zona, deshacer con Ctrl+Z.

---

## 9. Problemas y riesgos pendientes

| Problema | Detalle |
|---|---|
| **El código v0.13 no está en GitHub** | Allí está la v0.4. La subida la hace Alejandro con git desde el zip (`cp -R ../v013/Imperial-steps/. .`, `git add -A`, commit, push). Mi conexión no puede crear archivos en `.github/workflows` ni subir binarios, así que `pruebas.yml` (suelto en la raíz) debe moverse a `.github/workflows/pruebas.yml` a mano. |
| **GitHub Pages sin activar** | Settings → Pages → rama `main`, carpeta raíz. Hasta entonces, el enlace «Play it in your browser» del README no funciona. |
| **Caminos que cruzan otra zona** | Tras agregar las fronteras, 25 de los 36 mapas quedan limpios; en 11 (sobre todo Espiral y Dientes de sierra) un camino todavía pasa por encima de una tercera zona. Es solo visual. |
| **Economía estancada** | La población de los bots se queda cerca de 10 hasta el paso 60; mejoró con fundación y fronteras, pero sigue abierto. Puede ser propio de los bots (se expanden poco). |
| **Tecnologías desbalanceadas** | *Arado* y *Moneda* se pagan en 2 o 3 pasos; la línea de *Fortificación* sube hasta +51 puntos el porcentaje de victorias al defender; *Armaduras ligeras*, unos +30. Detalle en `docs/balance_tecnologias.md`. |
| **Demasiados sistemas para una primera partida** | Sigue siendo el riesgo principal frente al objetivo de sencillez. Idea no implementada: un «modo primera partida» que apague eventos y fantasmas. |
| **Excel desactualizado** | Los textos de Almacén, Intereses del almacén y Capital próspera cambiaron en el juego pero no en `Tecnologias_v0.2.xlsx`. |
| **44 tecnologías militares** no cambian nada en una batalla normal (son de terreno, movimiento o conquista): no es un error de balance, pero hay que medirlas de otra forma. |

---

## 10. Reglas de estilo que hay que mantener

### Diseño
1. **`docs/Reglas_v0.1.md` es la fuente de verdad.** Toda decisión se escribe ahí con ✅ decidido, 💡 propuesta, ❓ por definir y 🆕 nuevo de la sesión; al cerrar un pendiente, mencionarlo por su número.
2. **No cambiar nada marcado ✅ sin avisar antes.**
3. **Distinguir siempre** lo decidido por Pao de lo propuesto por mí, y decirlo cuando una cifra es una estimación.
4. **La vara es la sencillez con tensión:** si una propuesta agrega complejidad sin agregar decisiones interesantes, decirlo.
5. **Nada negativo que llegue sin aviso.** Los encuentros son oportunidades; las amenazas inesperadas se descartaron.
6. **Automatizar lo repetitivo** y dejar al jugador las decisiones con peso.

### Código
7. **El motor nunca toca la pantalla** (lo verifica `pruebas/revisar_capas.js`).
8. **Todos los números de balance en `js/config/reglas.js`**, nunca dentro del código.
9. **Cada regla nueva lleva su prueba** en `pruebas/probar_reglas.js`.
10. **Antes de dar algo por hecho:** `npm test`, `npm run check` y probarlo en el navegador de verdad (con Playwright, haciendo clics reales y mirando capturas).
11. **Las preguntas de balance se responden con simulaciones**, no con intuición.
12. **Sin paso de compilación:** el juego se abre con doble clic.
13. **Tipos al día:** si cambia la forma del estado o se agrega una orden, actualizar `js/tipos.d.ts`.

### Idioma y tono
14. **El juego y los documentos de diseño, en español**, incluidos los nombres de reglas y tecnologías. **README, CONTRIBUTING, CHANGELOG y commits, en inglés** (con versiones en español de los dos primeros).
15. **Interfaz clara antes que detallada:** el juego se decide en segundos; íconos antes que párrafos; la explicación larga al pasar el mouse.
16. **Estilo visual:** colores planos, formas duras, vista desde arriba, humor pequeño, inspirado en la Nueva Objetividad alemana de los años 20. Arte original.
17. **Con Pao:** tono cálido y cercano, respuestas concisas, decir primero lo que se hizo y después lo que falta; marcar con 💡 lo que es propuesta mía para que ella decida.
