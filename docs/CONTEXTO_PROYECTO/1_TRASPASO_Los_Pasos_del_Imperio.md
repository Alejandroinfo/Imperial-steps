# TRASPASO — Los Pasos del Imperio

**Para qué sirve este documento:** permite retomar el proyecto en una conversación nueva (o con otra persona) sin tener que volver a explicar nada. Está escrito para leerse de arriba abajo en 10 minutos.

**Última actualización:** 28 de octubre de 2026 (🆕 pujas de bots por valor esperado, registro descargable, Excel al día y raíz limpia; ver sección 12). Antes, 27 de octubre de 2026, noche, con años de eventos y tribus con relación −3 a +3 (🆕 pueblo vivo, rasgos y recursos con insignias, recursos de plata y oro, crecimiento n², puestos por nivel, ofertas entre jugadores, encuentros en ventana y escenas de fin de paso; ver sección 11)
**Autor del diseño:** Alejandro.

⚠ **Quién escribe:** en este proyecto escribe siempre **Alejandro**, autor único del diseño y del código. Las preferencias de la cuenta de Claude están a nombre de otra persona (Pao); no la confundas con él, no le atribuyas ideas, decisiones ni partidas de prueba, y háblale a Alejandro en masculino.
**Estado:** diseño en papel bastante cerrado; prototipo jugable v0.13 en el navegador, organizado como proyecto en GitHub con pruebas automáticas. 🆕 Multijugador en línea con Firebase hecho, probado y en `main`; falta configurar Firebase y jugar la primera partida real.

---

## 0. Lo primero que hay que saber

| | |
|---|---|
| **Nombre** | Los Pasos del Imperio (provisional). Falta comprobar que no exista otro juego con ese nombre. |
| **Qué es** | Juego de estrategia multijugador de territorios, con **planificación simultánea por pasos**. |
| **Para quién** | Jugar en línea con primos y familia. No se busca un servidor con miles de personas. |
| **Objetivo del diseño** | Recuperar la sencillez y la diversión de planificar en grupo, con presión de tiempo, **sin el micromanagement** de un RTS. Este objetivo es la vara con la que se mide cada regla nueva. |
| **Jugadores** | Pensado para 4, diseñado para N (de 2 a 4 en el prototipo). |
| **Documento maestro de reglas** | `docs/Reglas_v0.1.md` (23 secciones). **Es la fuente de verdad.** |
| **Repositorio** | **github.com/Alejandroinfo/Imperial-steps** (README en inglés, para reclutadores). 🆕 Para jugar en el navegador: **alejandroinfo.github.io/Imperial-steps** (hay que activar GitHub Pages). El juego se abre con `index.html`; en un solo archivo, `dist/Los_Pasos_del_Imperio.html` (se genera con `python herramientas/empaquetar.py`). |

---

## 1. Archivos del proyecto

🆕 Desde el 26 de octubre de 2026 el proyecto es un **repositorio organizado por capas** (ver su `README.md` y `CONTRIBUTING.md`):

| Carpeta o archivo | Qué contiene | Estado |
|---|---|---|
| **`docs/Reglas_v0.1.md`** | Todas las reglas, con ✅ decidido, 💡 propuesta, ❓ por definir y 🆕 nuevo. La sección 20 lista los pendientes y la 23 el estado del prototipo. | Vivo |
| **`docs/TRASPASO_Los_Pasos_del_Imperio.md`** | Este documento. | Vivo |
| ~~`docs/TRASPASO_sesion_2026-10-26.md` y `..._2026-10-27.md`~~ | ✅ 🆕 Borrados el 28/10/2026 (historial de sesiones ya integrado en este documento y en las Reglas; siguen en el historial de git). | — |
| **`docs/CONTEXTO_PROYECTO/`** | 🆕 Copias listas para subir al Proyecto de Claude (3 archivos) y una guía de qué borrar. Se regenera con `python herramientas/generar_contexto.py`; **no se edita a mano**. | Generado |
| **`docs/Como_manejar_el_proyecto.md`** | Cómo trabajamos. | Estable |
| **`Tecnologias_v0.2.xlsx`** | Catálogo de 192 tecnologías. ✅ 🆕 Al día con el juego (28/10/2026; se quitaron las 17 sin efecto). | Vivo |
| **`index.html`, `css/`, `js/`** | El juego. `js/datos` (mapas y tecnologías), `js/config` (números de balance), `js/motor` (reglas, sin pantalla) y `js/interfaz` (lo que se ve). | Vivo |
| **`pruebas/`** | `revisar_capas.js`, `probar_reglas.js` (37 casos), 🆕 `probar_red.js` (estado en red, 18 casos) y `simular_partidas.js` (72 partidas entre bots). Se corren con `npm test`. 🆕 `probar_en_linea.py`: partida con dos navegadores y un Firebase falso. | Vivo |
| **`docs/multijugador.md`** | 🆕 Cómo funciona el juego en línea, cómo configurar Firebase y cómo publicarlo. | Vivo |
| **`herramientas/empaquetar.py`** | Junta todo en un solo HTML. | Estable |
| **`atlas_mapas.html`** | Atlas visual de los 12 mapas. | Estable |

**Regla de oro:** si estos archivos y lo que diga una conversación se contradicen, manda el archivo.

---

## 2. El juego en una página

1. Cada jugador empieza con **una capital y 4 pobladores básicos**, más 10 de comida, producción, oro y ciencia (el almacén de la capital es de 40).
2. Todos planean **a la vez**; cuando todos presionan ¡Listo!, el paso se resuelve y se ve qué pasó. En las pruebas **no hay reloj**: el paso avanza solo cuando todos están listos (se mide cuánto tarda cada uno).
3. Se **especializa** a la gente en oficios (agricultor, ingeniero, científico, comerciante; 🆕 el constructor se fusionó con el ingeniero), se **construye**, se **investiga** con científicos, se **mueve** gente por el mapa, se **negocia o pelea** con tribus y jugadores.
4. Se **gana cumpliendo 2 de 7 condiciones al mismo tiempo**. Si pierdes una, deja de contar.

**La idea central del diseño:** la tensión viene de **decidir bajo presión de tiempo**, no de la destreza con el mouse. Por eso hay pasos, órdenes que siguen solas y botón de ¡Listo!.

---

## 3. Reglas decididas (resumen; el detalle está en `Reglas_v0.1.md`)

### Mapa y zonas
- **12 mapas** simétricos, para 2, 3 o 4 jugadores, **6 zonas por jugador** (12, 18 o 24 zonas). Todos conectados, sin mar ni barcos.
- Por jugador: **1 capital + 2 tribus + 3 zonas vacías**, con los **6 terrenos una vez cada uno**.
- **Las tribus están en el medio entre los jugadores** (las zonas más cercanas a un rival); las vacías, junto a la capital, para poder expandirse desde el inicio.
- **Tamaño de zona** = cuántas veces ha crecido. Vacías empiezan en 3, la capital en 4. **1 espacio de edificio por cada 3 de tamaño**. La migración no cambia el tamaño.
- **Terrenos:** Montañas, Praderas, Bosques, Ríos, Colinas, Llanuras. Cada uno favorece a un tipo de unidad en un rol (atacante o defensor) y a una especialización. Riesgo ante eventos: Praderas y Llanuras ×1; Bosques y Ríos ×1,5; Montañas y Colinas ×2.
- **Especialización de zona:** la mayoría del mismo oficio **y** al menos **4** especialistas (nivel 1), **8** (nivel 2) y **12** (nivel 3); los niveles 2 y 3 piden además su tecnología. Bono de zona: 4, 8 o 12.
- **Capital:** 🆕 **+2** de cada recurso (+3 con *Capital próspera*). Se mantiene aunque la conquisten. **Perder la capital no elimina** a un jugador.

### Población y economía
- **Civiles:** poblador (1 comida + 1 producción), agricultor (2 comida), ingeniero (🆕 2 de producción **o** 2 para construir), científico (2 de ciencia o 2 para investigar), comerciante (2 de oro). Fuerza de combate 1. Se mueven gratis pero ese paso no producen. **Solo entran a zonas libres o propias.**
- **Especializar** cuesta 1 de producción (2 entre oficios, porque primero vuelven a básicos).
- **Militares:** consumen 2 de comida y no producen. Fuerza 2 que sube +1 por paso hasta 4. Moverlos cuesta 1 de oro por unidad por zona. 🆕 Entrenar cuesta el soldado (1) más su **equipo** (arco 2, escudo 4, caballo o hacha 6); si una tropa muere en tu territorio, su arma se guarda y se reutiliza. Se pueden **licenciar** para volver a ser civiles (2 o 3 de producción).
- **Recursos:** comida y producción son **locales** (🆕 tope **10 por tamaño** de zona, ampliable con Almacén); oro y ciencia son **globales**. Enviar comida o producción entre zonas cuesta oro según la distancia y los Caminos.
- 🆕 **La comida se reparte sola** dentro de tu territorio. **Fuera, hace falta una línea de suministro** de hasta 2 zonas sin pasar por el enemigo: sin ella las tropas pasan hambre y pelean con la mitad de los dados. Alimentar a todos va antes que crecer.
- **Crecimiento:** 🆕 cada zona elige **Crecer** (todo el sobrante va a crecer) o **Guardar** (se acumula). Costo = (tamaño+1)×(tamaño+2)/2.
- 🆕 **Automatizaciones:** envíos automáticos entre zonas cada paso y oficio para los que nacen.
- **Hambre:** 2 pasos sin comer y mueren (3 con *Despensas*). Herido + hambriento = muerte inmediata.

### Combate
- **Fuerza = dados** (50 % cada uno), **ataque = daño por dado exitoso**, **defensa = colchón** que absorbe daño y se recupera cada ronda, **iniciativa**: el número menor actúa primero, por oleadas.
- Unidades: aldeano, soldado, arquero, caballero, escudero, berserker (iniciativa 6), ariete y lanzapiedras (máquinas de asedio: anular fortificación y daño de área).
- Melé solo ataca melé hasta que no queda; distancia elige a cualquiera; los defensores reciben primero.
- **Civiles no mueren: quedan capturados** (heridos, sin producir, consumiendo comida) — esto es lo que frena la bola de nieve.
- **Paz o ataque** al entrar a una zona: si uno ataca y el otro no, el atacante tiene **sorpresa** (+50 %). 🆕 La **postura es de un jugador hacia otro** (Paz o Alerta): en Alerta, tus tropas atacan a las de ese jugador donde coincidan. Si dos jugadores pelean, todas las zonas donde coexisten pasan a conflicto.
- **Defensor** = quien controla la zona; si nadie controla, **ambos son atacantes**.

### Tecnologías
- **192 tecnologías en 12 ramas.** Cada rama tiene **columna vertebral** (6 o 7, una por nivel) y opcionales.
- Para el **nivel 5** de una rama hay que **acabar su columna** hasta el nivel 4. Además, mínimos de tecnologías del nivel anterior: **3 / 5 / 6 / 6**. Hasta 2 prerrequisitos directos por tecnología.
- **Costo:** nivel × 20. Los **9 edificios básicos vienen ya desarrollados** al inicio.
- 🆕 **Los científicos investigan solos** si hay algo en cola: investigan los que alcance la ciencia guardada (2 cada uno) y el resto genera ciencia. Ya no se asignan. Cola de hasta 4.
- Camino más barato a la victoria tecnológica: **1700 a 2040 puntos**.

### Edificios
- 9 básicos (Almacén, Camino, Hospital, Cuartel, Fortificación, Molino, Taller, Mercado, Biblioteca) + **Maravilla**.
- **20 de producción por nivel**; mejorar paga la diferencia; destruir devuelve la mitad. 🆕 Se construye directamente en el **nivel más alto desbloqueado**, eligiendo con qué especialización nace.
- 🆕 **Uno de cada tipo por zona**; con una tecnología de nivel 3 de ese edificio se puede tener **un segundo** (💡 cuesta 50 % más).
- Trabajadores: 2 por defecto, 3 con *Andamios*, 4 con *Grúas*. El efecto se aplica **por trabajador**.
- 🆕 **Ingenieros automáticos:** si la zona tiene una obra en cola, sus ingenieros construyen solos (cada uno usa 2 de la producción guardada); el resto produce. Sin obra, todos producen. Se acabó la capacidad de obra y la zona industrial (se fusiona con la de Producción), igual que los científicos automáticos.
- **Maravilla:** 500 de producción, sin trabajadores, ocupa un espacio; si pierdes la zona, el conquistador se la queda. 🆕 **Hay 12, una por rama, únicas en la partida.** La vertebral de nivel 5 de la rama solo la desbloquea (se paga como siempre) y solo se puede investigar si esa maravilla aún no existe; **el efecto de esa tecnología lo da la maravilla** mientras la controles (nombres y efectos en Reglas 15.3: por ejemplo, La Gran Fragua, La Torre de los Sabios y La Puerta de los Estandartes). Si pierdes la carrera, recuperas la mitad de la ciencia y la mitad de la producción puestas.
- 🆕 **Botín:** al ganar el control de una zona (conquista o anexión) te quedas con toda la comida y la producción guardadas, y con los civiles capturados. Ya funciona así en el juego.

### Tribus, eventos, victoria y fantasmas
- 🆕 **Fronteras:** entre imperios vecinos hay una tierra de nadie sin dueño; quienes estén ahí ganan 🪙 +3 por paso cada uno mientras haya paz (+4 si hay uno solo). Es el dilema del prisionero del juego.
- **Tribus:** una por oficio. **Anexar** cuesta `16 + 3 por civil + 5 por guerrero` (una típica, 30), pagado con las reservas de tus zonas cercanas; si dos pagan a la vez nadie la anexa y el precio se duplica. **Conquistar** da el 60 % de ese valor. A veces exigen **tributo** (6) y, si nadie paga, invaden.
- 🆕 **Encuentros:** sin aviso, cada 4 a 7 pasos, en una zona tuya; **40 tipos** de ofertas y apuestas (86 variantes) y **20 de elegir entre dos** (40 variantes) que piden y dan más a medida que avanza la partida; catálogo en `docs/encuentros.md`. Se deciden en el mismo paso. **Solo oportunidades:** rechazarlos no tiene consecuencias.
- 🆕 **Recursos estratégicos:** rinden más mientras más tiempo los controles (+1 a +4 por paso).
- **Eventos:** 16 en total; **uno cada 3 pasos desde el paso 6**; se anuncian con 2 pasos de anticipación (más con tecnología); el terreno multiplica el efecto.
- **Victoria (2 de 7 a la vez):** Comercial (1000 de oro), Económica (75 de población), Tecnología (5 de nivel 5 de ramas distintas), Territorial (>70 % del mapa), Militar (2 capitales), Desarrollo (20 edificios), Maravillas (3). Empate: la partida sigue hasta que uno tenga una condición más.
- **Eliminación:** solo al quedarse sin gente. Pasa a **fantasma**, controla una tribu y puede **aliarse** con un jugador vivo (ambos deben aceptar) y ganar con él. Las alianzas solo existen entre fantasma y jugador vivo.

---

## 4. Decisiones técnicas tomadas

| Tema | Decisión | Por qué |
|---|---|---|
| **Lenguaje principal del producto final** | **Python** para motor, simulaciones y análisis | Alejandro apunta a puestos de data analytics y data science; es su lenguaje fuerte |
| **Prototipo actual** | 🆕 Repositorio con HTML, CSS y JavaScript en carpetas por capas, cargados con `<script>` normales (se abre con doble clic, sin servidor); empaquetable en un solo archivo | Legible para un equipo y fácil de compartir con la familia |
| **Capas** | 🆕 `datos → config → motor → interfaz`; el motor no puede usar nada de la pantalla (lo revisa una prueba) | Permite probar el motor en Node y pasarlo a Python sin reescribir reglas |
| **Pruebas** | 🆕 `npm test` y GitHub Actions: regla de capas, 37 casos de reglas y 72 partidas entre bots | Detectar errores antes de jugar |
| **Tipos** | 🆕 `js/tipos.d.ts` + JSDoc, revisado con TypeScript (`npm run check`), sin compilar | Encontró que las Maravillas no se podían construir; marca campos mal escritos y órdenes sin atender |
| **Multijugador** | 🆕 Firebase Realtime Database: el anfitrión resuelve cada paso y publica el estado completo; los demás mandan sus órdenes (antes se pensaba en FastAPI + WebSockets) | Nadie tiene que mantener un servidor prendido, funciona en casi cualquier red y guarda la partida para reconectarse |
| **Motor** | Función pura `resolver_paso(estado, ordenes, rng)` con generador aleatorio **con semilla**, probada con **pytest** | Partidas reproducibles y tests fiables |
| **Configuración** | Todos los números en tablas o archivos de configuración, no dentro del código | Cambiar balance sin reescribir código |
| **Balance** | Simulador con bots que corre miles de partidas y mide quién gana y con qué | Es además la pieza de portafolio de datos |
| **Telemetría** | Registrar tiempo hasta ¡Listo!, órdenes por paso y condiciones alcanzadas | Con esos datos se decide la duración del paso |
| **Arte** | 2D en capas, estilo maqueta de pueblo vista desde arriba, colores planos y escenas pequeñas, inspirado en la Nueva Objetividad alemana de los años 20. El arte final debe ser **original** | Es el estilo que gustó; la claridad manda sobre el detalle |

---

## 5. Qué está terminado

- **Reglas en papel:** casi todo el juego, con 23 secciones y los puntos marcados como decididos o pendientes.
- **12 mapas** generados y validados por código, con atlas visual.
- **Catálogo de 192 tecnologías** en 12 ramas con columna vertebral.
- **Prototipo jugable v0.13** con los 12 mapas, de 2 a 4 jugadores, economía local y global, 6 oficios, 10 edificios con niveles y especializaciones, las 192 tecnologías, 8 tipos de unidad, combate completo, tribus, eventos, fantasmas, alianzas y las 7 condiciones de victoria.
- 🆕 **Interfaz (26/10/2026):** mapa como valle continuo (cercas donde hay camino, barrancos donde no), resumen de zona con quién trabaja y dónde, placas con reservas y pasos hasta el próximo poblador, edificios en tarjetas, tecnologías en subpestañas, con **«⭐ Te ayudan ahora»**, colores por rama y el **impacto que tendrían hoy** (ej.: «🌾 +3 por paso»), sugerencias del paso, tributos visibles, **visor de batallas golpe por golpe**, **sonido y efectos** (generados por código, con controles en el Menú), postura con cada jugador y turno en la barra superior.
- 🆕 **Proyecto en GitHub** (github.com/Alejandroinfo/Imperial-steps) organizado por capas, con README, guía de colaboración y pruebas automáticas.
- 🆕 **Sesión del 27/10/2026 (noche):** pueblo vivo en el mapa; rasgos y recursos con insignias y fichas; recursos de plata y oro; crecer cuesta n²; 2 puestos de trabajo por nivel de edificio; ofertas de recursos entre jugadores; encuentros en ventana emergente; avance de vecinos en Victoria; escenas de fin de paso; moverse y enviar sin listas desplegables. Detalle en las Reglas (sección 24) y en la sección 11 de este documento.

---

## 6. Qué falta (por prioridad)

### Alta
0. 🆕 **La sensación de Alejandro jugando contra bots (26/10/2026): no se siente diversión.** Los bots casi no atacan, no hay tensión para invertir en lo militar, las tribus se compran baratas y los recursos pasan desapercibidos. Las simulaciones de ese día lo confirmaban: 0 a 3 combates por partida y población estancada cerca de 10 (el informe se borró por desactualizado; con los cambios de reclutar y tribus de 28/10, los bots dan 6 a 9 combates por partida). **Esto es lo primero a resolver.**
1. 🆕 **Orden elegido por Alejandro para dar tensión:** (1) ✅ encuentros sorpresa y recursos disputados; (2) ✅ mapas más conectados con dilema del prisionero en zonas de frontera; (3) tribus como amenaza latente y tributo negociado (ofertas secretas; atacan al que dio menos); (4) multijugador.
1a. ✅ 🆕 **Multijugador para el primer playtest:** cada uno en su computadora, en videollamada. Decidido por Alejandro (27/10/2026): **Firebase Realtime Database** en vez de PeerJS o un servidor propio (ver 3c).
1b. **Jugarlo con la familia.** 🆕 Ya se trabajó lo que se sentía mal al jugar sola (opciones de partida, tecnologías, zona, mapa, edificios, combate). Falta probarlo con más personas.
2. 🆕 **Ritmo y balance después de los cambios de hoy:** con la capital a +2 y el equipo más caro, casi nadie gana antes del paso 60 en las simulaciones (pendientes 26 y 28). Revisar los umbrales del modo prueba.
3. 🆕 **Confirmar las propuestas 💡 de hoy:** reparto del sobrante de comida (pendiente 29), costo del segundo edificio (30) y valores del equipo (31). 🆕 Y las nuevas: maravillas únicas (38), ingenieros automáticos (39) y botín (40).
3b. 🆕 **Pasar al juego** las reglas decididas (Reglas 23.5), en este orden: ✅ ingenieros automáticos (v0.14, 27/10/2026) → ✅ maravillas únicas (15.3, v0.16) → lo de 13.3 y 12 (zonas peligrosas, elegir entre dos, pedidos de tribus, subasta, historias). Falta simular el ritmo con la capital a +2.
3d. 🆕 ✅ (villas, elegir entre dos, tribus: v0.17; faltan subasta e historias) **Diseño nuevo de tensión (27/10/2026, decidido por Alejandro; Reglas 13.3 y 12):** zonas peligrosas (antes fronteras; solo cuentan las tropas), subasta a sobre cerrado cada 20 pasos, encuentros de elegir entre dos, tribus que piden cosas y se anexan solo con la relación al máximo, guerra si atacas a una tribu, e historias de 4 capítulos. Falta pasarlo al juego (pendientes 41 a 44).
3c. 🆕 **Multijugador con Firebase (decidido por Alejandro):** hecho sobre la v0.13 y ya en `main` (guía en `docs/multijugador.md`), probado con dos navegadores y un Firebase falso. Falta: configurar Firebase (unos 10 minutos), publicar el juego y jugar la primera partida real.
4. ✅ 🆕 **Las 17 tecnologías sin efecto se quitaron** (28/10/2026, decidido por Alejandro); el catálogo queda en **192**. Diplomacia e imperio quedó con solo 6 (ver Reglas 23.2).
5. **Pasar el motor a Python** con pytest y tablas de configuración; después, el simulador de balance. 🆕 La separación por capas ya lo deja preparado.
6. ✅ 🆕 ~~Multijugador real~~ hecho con Firebase (salas con código y reconexión), ver 3c.
7. 🆕 ✅ El código v0.13 ya está en GitHub (27/10/2026). ✅ GitHub Pages ya está activado (lo confirma Alejandro; no pude comprobarlo desde aquí). Para jugar en línea, esa dirección hay que autorizarla en Firebase (`docs/multijugador.md`, paso 7).

3e. 🆕 **Confirmar jugando el sistema de reclutar (27/10/2026, noche):** costos de las tropas (¿demasiado baratas? con bots las batallas subieron de 2 a 9 por partida), la paga en oro, el valor de los generales (≈ 2 tropas), repoblación 50 %; los bots ya ascienden generales y *Guardia de élite* funciona; *Camino militar II* sigue sin efecto.
3f. 🆕 **Confirmar jugando lo del 27/10/2026:** años con parte cierta (±15 %) y variable y primer año de fundación, tribus cada 8 pasos con descanso de 12 y ataque en insatisfacción 3; **decidir si la inundación y los eventos de tribu se vuelven tipos de año**; probar si 2 o 3 historias por partida (descanso 6 a 10 pasos) se sienten bien; además, el crecimiento n² baja la población de los bots un 20 % (13,5 → 10,5 a los 60 pasos) y los puestos por nivel suben el rendimiento de los edificios altos: ver si la economía queda bien o hay que compensar. Valores 💡 de plata y oro. Que los bots también hagan ofertas.

### Media
7. **Bots mejores:** siguen atacando poco.
8. **Interfaz de órdenes** para muchas zonas: seleccionar varias, repetir órdenes, plantillas.
9. **Movimientos simultáneos:** qué pasa exactamente cuando dos ejércitos se cruzan en una frontera.
10. ✅ 🆕 **Comienzo guiado** de los primeros 20 pasos, que luego sigue como partida normal (v0.12). Falta probarlo con alguien que no conozca el juego.
11. **Pendientes de reglas:** los ❓ de `docs/Reglas_v0.1.md` (sección 20 y repartidos).
12. ✅ 🆕 ~~Pasar al Excel los textos de tecnologías que cambiaron~~ hecho el 28/10/2026 (209).

### Baja
13. Arte definitivo y música. 🆕 Ya hay efectos de sonido y ambiente generados por código; falta música.
14. Accesibilidad (daltonismo, tamaño de texto), más de 4 jugadores, mapas aleatorios simétricos.
15. 🆕 Ideas de interfaz que quedaron para después: ficha rápida al pasar el mouse por una zona y deshacer la última orden (Ctrl+Z).

---

## 7. Problemas conocidos y riesgos

| Problema | Detalle |
|---|---|
| **Complejidad frente al objetivo** | El objetivo era sencillez, y hoy hay 7 condiciones de victoria, 6 terrenos, 10 edificios con niveles, 8 unidades, 192 tecnologías, eventos, tribus y fantasmas. Cada pieza tiene sentido; juntas pueden volver pesado cada paso. **Medir órdenes por paso y tiempo de decisión.** |
| **Las partidas de bots no terminan** | 🆕 Con los cambios de hoy, en 72 partidas casi ninguna llega a una victoria antes del paso 60, ni en modo prueba. Los bots atacan poco. |
| **27 tecnologías con riesgo de balance alto** | Marcadas en el Excel (por ejemplo Hospital imperial, Gran manufactura, Imperio conquistador). |
| **Zonas de nivel 3 muy difíciles** | Piden 12 especialistas. 🆕 El almacén más grande y la comida automática ayudan; hay que jugarlo. |
| **Edificios amontonados** | Con muchos edificios en una zona, las ilustraciones se apiñan. 🆕 Con segundos edificios puede empeorar. |
| **El nombre** | Falta comprobar que no exista otro juego llamado igual. |

---

## 8. Reglas de trabajo y estilo que conviene mantener

1. **`Reglas_v0.1.md` es la fuente de verdad.** Toda decisión nueva se escribe ahí, con ✅ decidido, 💡 propuesta o ❓ por definir, y se marca cuando se cierra un pendiente.
2. **Construir por capas.** Capa 1: población, comida, movimiento, combate. Capa 2: especializaciones y unidades. Capa 3: edificios, tecnologías, eventos y tributos.
3. **Números siempre en tablas**, nunca dentro del código.
4. **Validar por código lo que se pueda** (conectividad de mapas, ciclos del árbol de tecnologías, costos de victoria) antes de dar algo por bueno.
5. **Distinguir lo decidido de lo propuesto.** Si una cifra es una estimación, decirlo.
6. **Probar en el navegador** cada cambio de interfaz antes de darlo por hecho, y correr `npm test` antes de subir.
7. **Idioma:** todo en español, incluidos los nombres de reglas y de tecnologías. 🆕 Desde el 28/10/2026 hay **inglés opcional** en el Menú (el español sigue siendo el idioma por defecto y el de las reglas).
8. **Estilo visual:** colores planos, formas duras, vista desde arriba, humor pequeño; la claridad por encima del detalle, porque el juego se decide en segundos.
9. **Sin reloj por ahora:** el paso avanza cuando todos están listos; primero se mide cuánto tarda la gente.
10. 🆕 **Se trabaja directo en `main`, sin ramas (27/10/2026, decidido por Alejandro):** commits pequeños que digan qué cambia, y `npm test` antes de subir (ver `CONTRIBUTING.md`); el motor nunca toca la pantalla.
11. 🆕 **Idioma del repositorio:** el juego, las reglas y el traspaso van en español; lo que ve un visitante o reclutador va en **inglés** (`README.md`, `CONTRIBUTING.md`, descripción del proyecto), con versión en español (`README.es.md`, `CONTRIBUTING.es.md`). Los mensajes de commit pueden ir en inglés.

---

## 9. Cómo seguir en una conversación nueva

Sube a un **Proyecto de Claude** como conocimiento del proyecto **solo estos 3 archivos** (están listos en `docs/CONTEXTO_PROYECTO/`, con la guía `LEEME_QUE_BORRAR_Y_QUE_QUEDARSE.md`):

- `1_TRASPASO_Los_Pasos_del_Imperio.md` (este documento)
- `2_Reglas_v0.1.md`
- `3_Como_manejar_el_proyecto.md`

No subas el juego empaquetado (`dist/…html`), el atlas ni el Excel de tecnologías: pesan mucho, se desactualizan, y Claude puede leer el código y los datos (`js/datos/tecnologias.js`) directamente en **github.com/Alejandroinfo/Imperial-steps** con el conector de GitHub. Tras cambiar documentos, corre `python herramientas/generar_contexto.py` y reemplaza los 3 archivos en el Proyecto.

Y abre un chat por tema. Mensaje inicial sugerido:

> Soy Alejandro y estoy desarrollando *Los Pasos del Imperio*. En el conocimiento del proyecto está el documento de traspaso, las reglas, el catálogo de tecnologías y el prototipo. Léelos antes de responder. Hoy quiero trabajar en **[tema]**. No cambies nada que esté marcado como ✅ decidido sin avisarme.

Al cerrar cada sesión:

> Actualiza `Reglas_v0.1.md` y el documento de traspaso con lo que decidimos hoy, marcando lo nuevo y cerrando los pendientes que ya resolvimos. Dime qué quedó sin resolver.

---

## 10. Historial de decisiones importantes

| Decisión | Por qué |
|---|---|
| Control de territorio en vez de RTS o city builder | Un RTS pedía demasiado contenido y micromanagement |
| Sin reloj en las primeras pruebas | Medir cuánto tarda la gente antes de fijar la duración del paso |
| Civiles capturados en vez de muertos | Frena la bola de nieve y da profundidad al combate |
| Columna vertebral en las ramas de tecnología | Obliga a especializarse; sin ella, la victoria tecnológica se lograba juntando las 5 más baratas de 2 ramas |
| Edificios básicos desbloqueados al inicio | Evita que los primeros pasos sean solo esperar tecnologías |
| Investigación hecha por científicos | Antes se investigaba sin que nadie hiciera el trabajo |
| Precio de tribus de 8 a unos 30 | Comprarlas era siempre mejor que conquistarlas |
| Tribus en el medio del mapa | Antes bloqueaban la expansión inicial, porque los civiles no entran a zonas de tribu |
| Eventos de cada paso a cada 3 pasos | Eran demasiado frecuentes |
| Especialización de zona: 4, 8 y 12 | Con 2 era demasiado fácil |
| Perder la capital no elimina | Da partidas más largas y resistencia a quien va perdiendo |
| 🆕 Proyecto por capas en GitHub, no un solo HTML | Que se entienda cómo está hecho y se pueda trabajar en equipo |
| 🆕 Mapa como valle continuo | Las islas sobre fondo marrón se sentían como un problema de redes, no como un pueblo |
| 🆕 Científicos automáticos | El botón de asignar era una decisión más sin interés |
| 🆕 Comida automática desde la zona más cercana | Alimentar tropas y zonas sin comida era micromanagement |
| 🆕 Almacén de 10 × tamaño | 10 fijos era muy poco para planificar o pagar tribus |
| 🆕 Equipo militar con costo y recuperable | Las tropas especializadas eran demasiado baratas; recuperar armas premia defender |
| 🆕 Postura entre jugadores en vez de por zona | La relación es entre dos jugadores, no de un lugar |
| 🆕 Capital a la mitad (+2) | Generaba demasiado |
| 🆕 Edificios en su nivel máximo y segundo del mismo tipo con nivel 3 | Evitar obras repetidas y dar más peso a las especializaciones |
| 🆕 Maravillas únicas, una por rama, con el efecto de la vertebral de nivel 5 | La producción no tenía un destino interesante y la Maravilla solo contaba para la victoria; ahora es una carrera visible |
| 🆕 La vertebral de nivel 5 solo desbloquea la maravilla y solo se investiga si la maravilla no existe | Llegar tarde cuesta algo y la carrera se siente |
| 🆕 Perder la carrera devuelve la mitad de la producción y deja la tecnología (corregido 27/10/2026) | La tecnología de nivel 5 cuenta para la victoria tecnológica; castiga sin arruinar |
| 🆕 Nombres y efectos de las 12 maravillas (Saber, Urbanismo y Guerra con efecto nuevo) | Las vertebrales de esas tres ramas eran flojas al final o no tenían efecto propio |
| 🆕 Los pobladores también construyen solos si hay obra (1 de la producción guardada); si no, producen | Misma idea que los ingenieros; evita una apertura en la que nadie puede construir |
| 🆕 Rasgos de las personas: 2 por civil, de muy malo a muy bueno, por oficio; el jugador elige a quién especializar | Da identidad a cada poblador sin que el juego decida por ti; a veces importa más la comida o el oro que un +25 % en ciencia |
| 🆕 Maravillas únicas en el juego: empate por producción destinable; la maravilla no cuenta como nivel 5; nadie pierde la tecnología ya investigada (quien pierde la carrera solo pierde la obra y recupera la mitad de la producción) | Decididas por Alejandro el 27/10/2026; la carrera se ve en Imperio y cada ganador se queda con un efecto único |
| 🆕 **20 historias** de 4 capítulos con camino y final, sin amenazas (las 3 primeras: caravana, maestro, heredero; 17 nuevas el 27/10/2026) | Aprobadas por Alejandro el 27/10/2026; dejar pasar un capítulo no castiga |
| 🆕 Subasta: catálogo de 5 con nivel bronce/plata/oro visible, pago con oro, ciencia, comida o producción de todo el imperio (en igual porcentaje por zona), cargamento directo al crecimiento y recurso temporal de 40 pasos | Decidido por Alejandro el 27/10/2026; se sabe la categoría y el nivel pero no los detalles |
| 🆕 Zonas peligrosas con bono mayor (+8/+6) y solo tropas; tribus con relación, pedidos cada 5 pasos y guerra de 5 rondas (los civiles se vuelven guerreros) | La comida cuesta oro; Alejandro prefirió subir el bono antes que alimentar gratis. En la guerra se hereda la regla de berserkers |
| 🆕 Música de Suno (plan gratis) en el repositorio con crédito (opción B) | Más cómodo que repartirla aparte; Alejandro asume el riesgo pequeño de licencia. Alternativa limpia: Suno Pro un mes o música CC0 |
| 🆕 Salud y Fuerza como rasgos enteros | Evita decimales en vida y dados |
| 🆕 Reparto entre producir y construir por balance de lo guardado (mitad y mitad con igual eficiencia) | Se acerca a cómo piensa el jugador: entradas y salidas, no órdenes de asignar |
| 🆕 Pausa de obras por zona y «pausar crecimiento» | Poder acumular producción o comida sin que se gasten solas |
| 🆕 Mover comida de otra zona cuesta oro | La logística importa; antes la comida circulaba gratis por todo el imperio |
| 🆕 *Gremios de ingenieros* y *Grandes obras* dan descuentos de obra | Sus efectos (zona industrial) quedaron repetidos con *Ingeniería básica y avanzada*; siguen siendo vertebrales de Urbanismo |
| 🆕 Botín: el conquistador se queda con todo lo guardado y con los civiles capturados | Da premio a la guerra y riesgo a acumular (pendientes 26 y 28) |
| 🆕 Tribus que se ganan con pedidos (no se anexan desde el inicio) y guerra si las atacas | Comprar tribus era demasiado fácil; ahora hay relación y riesgo |
| 🆕 Subasta a sobre cerrado cada 20 pasos, abierta a todos | Pone a competir a todos los jugadores a la vez, con información incompleta |
| 🆕 Ingenieros automáticos y constructor fusionado con ingeniero | Dos números para una sola acción complicaban construir; es la misma solución de los científicos |
| 🆕 README y guía de colaboración en inglés, con capturas y enlace para jugar | Que un reclutador entienda el proyecto y lo pruebe en un minuto |
| 🆕 Prioridad de crecer o guardar por zona, envíos automáticos y oficio al nacer | Menos micromanagement y más control sobre el ritmo de cada zona |
| 🆕 Militares más baratos (soldado 1, equipo 2 × nivel) | Con 2 y 3 × nivel nadie armaba ejércitos |
| 🆕 Entrenar sin Cuartel | El Cuartel frenaba el inicio y la agresividad |
| 🆕 Cadena de suministros fuera del territorio propio | Que elegir dónde pelear y cortar el camino al enemigo sean decisiones de verdad |
| 🆕 Etapa de fundación (crecer a mitad de precio hasta el paso 12) | El arranque era lento y con pocas decisiones |
| 🆕 Encuentros solo positivos o neutros (sin amenazas) | Un ataque inesperado de bandidos es demasiado al azar para prepararse |
| 🆕 Fronteras sin dueño entre imperios vecinos (dilema del prisionero) | Las tribus eran el único colchón y no había tensión entre vecinos |
| 🆕 Tipos con TypeScript sobre el motor, sin compilar | Detectan órdenes sin atender y campos mal escritos; documentan las reglas |
| 🆕 Seguir con SVG para dibujar; PixiJS como opción si hace falta más fluidez | En la comparación, PixiJS se ve igual y SVG funcionó bien en una computadora normal |
| 🆕 Trabajar directo en `main`, sin ramas | Las ramas confundían más de lo que ayudaban en un proyecto que lleva sobre todo una persona |
| 🆕 Multijugador con Firebase Realtime Database, con el anfitrión como autoridad | Más estable que PeerJS entre casas distintas y sin servidor propio; con una sola pantalla resolviendo, nadie se desincroniza |

---

## 11. 🆕 Última sesión (27/10/2026, noche): qué cambió y dónde mirar

Reglas en `docs/Reglas_v0.1.md`, sección 24 (con ✅ y 💡). Código nuevo o tocado:

| Tema | Dónde |
|---|---|
| Pueblo vivo (rutinas por oficio, escenario por zona, hambre y heridas) | `js/interfaz/vida.js`, `figRows` en `js/interfaz/dibujo/figuras.js`, `groundDecor` en `territorio.js`, estilos al final de `css/estilos.css` |
| Rasgos: insignias, apodos, ficha | `js/interfaz/formularios.js` (`traitBadge`, `TRAIT_EPI`, `fichaHTML`) |
| Recursos de plata y oro | `RES`, `RES_TIER` en `js/config/reglas.js`; `resMul`, `zoneDeps`, `hasRes` (devuelve 0/1/2) en `motor/estado.js`; reparto en `motor/partida.js` (azar propio); rendimiento en `motor/encuentros.js` (`holdResources`); insignias `depBadge` y tarjetas `depCardsHTML` en `formularios.js` |
| Crecer n², puestos por nivel | `growCost` en `motor/economia.js`; `WORKERS_PER_LEVEL` y `bldSlots` |
| Ofertas entre jugadores | orden `offer`; `doOffer`, `makeTradeEnc`, `refundOffer` en `motor/encuentros.js`; `offerBuilderHTML` en `paneles/zona.js` |
| Años con eventos (parte cierta + variable) | `YEAR_STEPS`, `EV_FIRST_YEAR`, `EV_BASE_PCT` en `reglas.js`; `scheduleEvents` (azar propio `g.evGen`), `applyEventMods` en `motor/eventos.js`; `g.evAct`; `z.ev.mul` en `economia.js`; `evChipsHTML` en `sugerencias.js` |
| Tribus: relación −3 a +3, descanso y relojes | `TRIBE_REQ_EVERY`, `TRIBE_REQ_COOLDOWN`, `TRIBE_REL_MIN`; `tribeIgnored`, `tribeAttacks` en `motor/combate.js`; `tz.paidAt`, `tribeNextAsk` en `eventos.js`; `relBarHTML`, `tmbar` en `zona.js` |
| **Reclutar en el Cuartel, generales, mantenimiento y repoblación** (27/10, noche) | Constantes `UNIT_COST`, `UNIT_UPKEEP`, `GEN_*`, `REPOP_*`, `RECRUIT_PER_LEVEL` en `config/reglas.js`; `recruitCost`, `recruitCap`, `canRecruit`, `doTrain`, `doDemob` en `motor/resolver_paso.js`; `payTroops`, `unitNeed`, `growCost` en `motor/economia.js`; `unitLost`, `civPop` en `motor/estado.js`; generales y liderazgo en `motor/combate.js`; tecnologías nuevas en `datos/tecnologias.js` y `config/efectos_tecnologias.js`; interfaz en `trainPickerHTML`, `demobHTML` (`paneles/zona.js`) |
| Entrenar eligiendo a quién; avisos ❗; eventos como insignias; batalla como mapa | `doTrain` (con `ids`) en `motor/resolver_paso.js`; `trainPickerHTML`, `trainPool` en `paneles/zona.js`; puesto «Ejército» en `paneles/especializar.js`; `alertInfo`, `drawTabAlerts` en `sugerencias.js`; `evBadge`, `evFichaHTML` en `formularios.js`; `battleMapSVG`, `battleLayout` en `interfaz/batalla.js` |
| Encuentros en ventana, pestañas, victoria de vecinos | `encPopup` en `sugerencias.js`; `vicNeighbors` en `paneles/ordenes.js`; `#dlgEnc` en `index.html` |
| Escenas de fin de paso | `sceneDirector` en `interfaz/animaciones.js` |
| Moverse y enviar sin listas | `moveFormHTML`, `sendCardHTML`, `neighborsHTML` en `paneles/zona.js`; acciones en `acciones.js` |
| Contenido: 20 historias, 40 encuentros, 20 de elegir entre dos | `js/datos/historias_extra.js`, `js/datos/encuentros_extra.js` (se unen a los de `motor/historias.js` y `motor/encuentros.js`); catálogos generados en `docs/historias.md` y `docs/encuentros.md` con `node herramientas/generar_catalogo.js` (no se editan a mano). Las historias salen una tras otra (`F.stories`, `F.storyUsed`, `STORY_BREAK_*`, `STORY_MAX` en `reglas.js`; lógica en `scheduleEncounters`) |
| Pruebas | `pruebas/probar_reglas.js` (más casos), `pruebas/probar_interfaz.py` (14 comprobaciones de navegador) |

**Cosas que conviene saber:** `hasRes` devuelve un número (no un booleano); las pruebas de reglas borran los depósitos del mapa (`base`) para aislarse; las copias sueltas de `.js`, CSS, audio y documentos que había en la **raíz del repositorio** eran restos de una subida accidental: ✅ se borraron el 28/10/2026 (el juego solo usa `index.html`, `js/`, `css/`, `audio/` y `docs/`).

---

## 12. 🆕 Sesión del 28/10/2026: qué cambió y dónde mirar

Reglas en `docs/Reglas_v0.1.md`, sección 25.

| Tema | Dónde |
|---|---|
| Bots pujan por el valor esperado del cofre (varianza 3) y acumulan la moneda desde el anuncio | `auctionValue` en `js/motor/subasta.js`; constantes `AUCTION_VAL_*`, `AUCTION_BOT_VAR`, `AUCTION_BOT_SPEND` en `js/config/reglas.js`; `botOrders`, `botAuctionHold`, `randNormal` en `js/motor/bots.js` |
| Subasta anunciada 10 pasos antes y cargamento variable (rango, recurso oculto) | `AUCTION_NOTICE`, `AUCTION_CAR_RANGE` en `reglas.js`; `auctionNew` y `auctionAward` en `subasta.js`; rango visible en `auctionHTML` (`paneles/imperio.js`) |
| Inundación todo el año | evento `inunda` (`flood:1`) en `reglas.js`; `scheduleEvents` y `applyEventMods` en `motor/eventos.js`; `capStore` en `motor/estado.js` |
| Registro descargable (.txt y .json) | `js/motor/registro.js` (`gameLogData`, `gameLogText`); `downloadLog`, `logButtonsHTML` en `js/interfaz/flujo.js`; acción `dllog` en `acciones.js`; botones en Historial (`paneles/ordenes.js`) y en `showEnd` |
| Excel de tecnologías | `Tecnologias_v0.2.xlsx` (192; hojas Ramas y Resumen con rangos hasta la fila 210) |
| Raíz limpia y CI | 33 archivos borrados de la raíz; `.github/workflows/pruebas.yml`. También borrados: `docs/TRASPASO_sesion_2026-10-26.md` y `..._27.md`, `docs/balance_economia.md` (de la v0.11), y 8 funciones/constantes sin uso (`TRAIT_LV`, `TERMS`, `cntT`, `netOffAll`, `panKey`, `sugBarHTML`, `sugBarHTML_old`, `encGainText`) |
| Tribus: sin Inquietud ni Furia; crecen solas cada año | `tribesGrow` en `js/motor/eventos.js` (se llama en `resolver_paso.js`); `TRIBE_YEAR_CIV`, `TRIBE_YEAR_BAR` en `reglas.js` |
| Interfaz: pestaña Recursos, cofres, maravillas con imagen, Tab entre zonas | `js/interfaz/paneles/recursos.js` (`auctionHTML`, `wondersHTML`, `mapResourcesHTML`); `js/interfaz/dibujo/ilustraciones.js` (`wonderArt`, `chestArt`); `cycleZone` en `acciones.js` y tecla Tab en `main.js`; estilos al final de `css/estilos.css` |
| Mapa sin barra, plan de red con zoom, pestañas con ícono | `js/interfaz/mapa/plan.js` (`PV`, `planFly`, `planFit`); íconos `.vmode` en `index.html`; `goZone` y `fitAll` sirven a las dos vistas en `territorio.js`; atajos C, F, Tab y Ctrl+Z en `main.js` y `acciones.js` (`cycleZone`, `undoOrder`) |
| Pedidos de tribu en Imperio, Victoria en un gráfico, resumen y envío compactos | `requestsHTML` en `paneles/imperio.js`; `panelVictoria` en `paneles/ordenes.js`; `zoneOverview` y `sendCardHTML` en `paneles/zona.js`; estilos al final de `css/estilos.css` |
| Estilo del mapa «Mesa de juego» (prototipo) | `MAPSTYLE`, `setMapStyle`, `MESA_DEFS`, `tileBase` y las ramas `mesa` de `buildTerritoryDOM` en `js/interfaz/mapa/territorio.js`; selector en el Menú (`index.html`, `main.js`) |
| Teléfono (hoja inferior, pellizco, avisos al tocar) | `js/interfaz/movil.js` (`isMovil`, `setSheet`, `initPinch`, `initTouchTips`); estilos «Teléfono» al final de `css/estilos.css` (`body.movil`, `sheet-0/1/2`); `#sheetGrip` en `index.html`; `PLANCANCEL` en `plan.js` |
| Tecnologías por ramas | `branchCardHTML`, `branchView`, `techLine`, `researchBox` en `js/interfaz/paneles/tecnologias.js`; acciones `tbranch` y `tonly` |
| Selector visual de mapas | `js/interfaz/mapas_inicio.js` (`mapStats`, `mapPace`, `mapThumb`, `renderMapPicker`); `#mapPicker` y `#mapInfo` en `index.html` |
| Tipos de conexión del mapa | `connInfo`, `noPassInfo`, `connMarker`, `CONN_RK` en `js/interfaz/mapa/territorio.js`; íconos `bridge`, `pass`, `trail`, `hills`, `cliff` en `iconos.js` |
| Inglés opcional | `js/interfaz/idioma.js` (`i18n`, `i18nAdd`, `setLang`, `downloadMissing`); diccionario `js/idiomas/en_1.js`; selector en el Menú (`#lgEs`, `#lgEn`); prueba `pruebas/probar_idioma.js` |
| Íconos propios y papel | `js/interfaz/dibujo/iconos.js` (`ICONS`, `EMOJI_ICON`, `iconify`, `iconifySVG`, `initIconos`; 67 íconos); estilos `.ic` y «Sistema visual» al final de `css/estilos.css` |
| Quitar 17 tecnologías sin efecto | `js/datos/tecnologias.js` (192); `Tecnologias_v0.2.xlsx`; Reglas 23.2; `docs/balance_tecnologias.md` regenerado |
| Quién trabaja en los edificios | `BLD_WORKER` en `config/reglas.js`; asignación en `produceZone` (`motor/economia.js`) |
| Pruebas | 7 casos nuevos en `pruebas/probar_reglas.js` (valor esperado, puja de bots, acumulación, cargamento variable, aviso a 10 pasos, inundación, registro) y 7 comprobaciones nuevas en `pruebas/probar_interfaz.py` (+ 1 caso de tratos de bots) |

**Pendientes que dejó la sesión:**
- ❓ Ver jugando la regla de **especialistas en edificios** (Reglas 25): arrancar sin edificios productivos puede resultar lento; el Hospital quedó abierto a cualquiera (💡).
- ✅ Los bots ya **proponen tratos** (🤝): `botTradeOffer` en `js/motor/bots.js`, constantes `OFFER_BOT_*` y `OFFER_VAL` en `reglas.js` (Reglas 25). ❓ Ver jugando si 10 tratos por partida entre bots son muchos o pocos para quien juega.
- ✅ Confirmado por Alejandro (28/10/2026): varianza 10 en unidades de la moneda, rangos del cargamento y **sin tope de bárbaros** por tribu; los baja él después de probar.
- ✅ Las subastas en comida y producción ya no quedan vacías (los bots acumulan desde el anuncio: objetos sin puja 40 → 3). Falta ver jugando si los bots que reservan crecen demasiado lento.
- ✅ La **inundación** dura el resto del año (decidido). ✅ **Eventos de tribu:** se quitaron Inquietud y Furia; las tribus ganan 1 civil y 2 bárbaros cada año (💡 pesan: unos +13 de precio de anexión por año; ver Reglas 25).
- ❓ Confirmar que «varianza de 10» es en unidades de la moneda (desviación ≈ 3,2) y no un 10 %; y que el cargamento variable (rangos 💡) es lo que querías.
- ❓ El flujo de pruebas automáticas solo corre `simular_partidas.js 2 40`; convendría que corra `npm test`.

---

## 13. 🆕 Sesión del 28/10/2026 (noche): inglés completo, teléfono y PWA

Reglas en `docs/Reglas_v0.1.md`, sección 26.

| Tema | Dónde |
|---|---|
| Inglés completo (interfaz, historial, comienzo guiado, encuentros, historias, Guía) | Fuente: `idiomas/en.json`; genera `js/idiomas/en.js` con `python herramientas/idiomas.py generar`; traductor en `js/interfaz/idioma.js` (`{0#}` = solo dígitos, `i18nHTML`, `i18nBlocks`/`i18nAddBlocks` para la Guía); prueba en `pruebas/probar_idioma.js` |
| Efectos Completo/Ligero/Apagado | `setFxLevel` en `js/interfaz/animaciones.js`; estilos `body.lite` al final de `css/estilos.css`; `figMax` en `dibujo/figuras.js` |
| Ficha táctil y mover una persona | `fichaSheetHTML`, `openFichaSheet` en `formularios.js`; acciones `ficha`, `fichaclose`, `movep` y atajos `mvquick` (`one`, `half`) en `acciones.js`; botón ⓘ en `paneles/especializar.js`; `takeUnits(…, {ids})` y `doMove` en `motor/resolver_paso.js` |
| PWA | `manifest.json`, `sw.js`, `icons/`; registro al final de `js/main.js` |

**Pendientes:** ver en un teléfono real si «Ligero» alcanza (si no, usar «Apagado» o simplificar el dibujo del mapa); probar la PWA instalada en iPhone y Android; nombres de zona en inglés (decidir); comentarios de diseño de algunas tecnologías sin traducir.

