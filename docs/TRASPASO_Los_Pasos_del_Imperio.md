# TRASPASO — Los Pasos del Imperio

**Para qué sirve este documento:** permite retomar el proyecto en una conversación nueva (o con otra persona) sin tener que volver a explicar nada. Está escrito para leerse de arriba abajo en 10 minutos.

**Última actualización:** 26 de octubre de 2026
**Autores del diseño:** Pao (idea inicial) y Alejandro.
**Estado:** diseño en papel bastante cerrado; prototipo jugable v0.7 en el navegador, organizado como proyecto en GitHub con pruebas automáticas; sin servidor multijugador todavía.

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
| **Repositorio** | **github.com/Alejandroinfo/Imperial-steps**. El juego se abre con `index.html`; en un solo archivo, `dist/Los_Pasos_del_Imperio.html` (se genera con `python herramientas/empaquetar.py`). |

---

## 1. Archivos del proyecto

🆕 Desde el 26 de octubre de 2026 el proyecto es un **repositorio organizado por capas** (ver su `README.md` y `CONTRIBUTING.md`):

| Carpeta o archivo | Qué contiene | Estado |
|---|---|---|
| **`docs/Reglas_v0.1.md`** | Todas las reglas, con ✅ decidido, 💡 propuesta, ❓ por definir y 🆕 nuevo. La sección 20 lista los pendientes y la 23 el estado del prototipo. | Vivo |
| **`docs/TRASPASO_Los_Pasos_del_Imperio.md`** | Este documento. | Vivo |
| **`docs/Como_manejar_el_proyecto.md`** | Cómo trabajamos. | Estable |
| **`Tecnologias_v0.2.xlsx`** | Catálogo de 203 tecnologías. ⚠ Los textos de Almacén, Intereses del almacén y Capital próspera cambiaron en el juego y falta pasarlos al Excel. | Vivo |
| **`index.html`, `css/`, `js/`** | El juego. `js/datos` (mapas y tecnologías), `js/config` (números de balance), `js/motor` (reglas, sin pantalla) y `js/interfaz` (lo que se ve). | Vivo |
| **`pruebas/`** | `revisar_capas.js`, `probar_reglas.js` (14 casos) y `simular_partidas.js` (72 partidas entre bots). Se corren con `npm test`. | Vivo |
| **`herramientas/empaquetar.py`** | Junta todo en un solo HTML. | Estable |
| **`atlas_mapas.html`** | Atlas visual de los 12 mapas. | Estable |

**Regla de oro:** si estos archivos y lo que diga una conversación se contradicen, manda el archivo.

---

## 2. El juego en una página

1. Cada jugador empieza con **una capital y 4 pobladores básicos**, más 10 de comida, producción, oro y ciencia (el almacén de la capital es de 40).
2. Todos planean **a la vez**; cuando todos presionan ¡Listo!, el paso se resuelve y se ve qué pasó. En las pruebas **no hay reloj**: el paso avanza solo cuando todos están listos (se mide cuánto tarda cada uno).
3. Se **especializa** a la gente en oficios (agricultor, ingeniero, constructor, científico, comerciante), se **construye**, se **investiga** con científicos, se **mueve** gente por el mapa, se **negocia o pelea** con tribus y jugadores.
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
- **Civiles:** poblador (1 comida + 1 producción), agricultor (2 comida), ingeniero (2 producción), constructor (2 de capacidad de obra), científico (2 de ciencia o 2 para investigar), comerciante (2 de oro). Fuerza de combate 1. Se mueven gratis pero ese paso no producen. **Solo entran a zonas libres o propias.**
- **Especializar** cuesta 1 de producción (2 entre oficios, porque primero vuelven a básicos).
- **Militares:** consumen 2 de comida y no producen. Fuerza 2 que sube +1 por paso hasta 4. Moverlos cuesta 1 de oro por unidad por zona. 🆕 Entrenar cuesta el soldado (2) más su **equipo** (arco 3, escudo 6, caballo o hacha 9); si una tropa muere en tu territorio, su arma se guarda y se reutiliza. Se pueden **licenciar** para volver a ser civiles (2 o 3 de producción).
- **Recursos:** comida y producción son **locales** (🆕 tope **10 por tamaño** de zona, ampliable con Almacén); oro y ciencia son **globales**. Enviar comida o producción entre zonas cuesta oro según la distancia y los Caminos.
- 🆕 **La comida se reparte sola:** cada zona come de lo suyo y lo que falta sale de la zona propia más cercana que tenga. Alimentar a todos va antes que crecer.
- **Crecimiento:** 💡 🆕 la mitad del sobrante del paso va a crecer y la otra mitad se guarda; lo que no cabe en el almacén va todo a crecer. Costo = (tamaño+1)×(tamaño+2)/2.
- **Hambre:** 2 pasos sin comer y mueren (3 con *Despensas*). Herido + hambriento = muerte inmediata.

### Combate
- **Fuerza = dados** (50 % cada uno), **ataque = daño por dado exitoso**, **defensa = colchón** que absorbe daño y se recupera cada ronda, **iniciativa**: el número menor actúa primero, por oleadas.
- Unidades: aldeano, soldado, arquero, caballero, escudero, berserker (iniciativa 6), ariete y lanzapiedras (máquinas de asedio: anular fortificación y daño de área).
- Melé solo ataca melé hasta que no queda; distancia elige a cualquiera; los defensores reciben primero.
- **Civiles no mueren: quedan capturados** (heridos, sin producir, consumiendo comida) — esto es lo que frena la bola de nieve.
- **Paz o ataque** al entrar a una zona: si uno ataca y el otro no, el atacante tiene **sorpresa** (+50 %). 🆕 La **postura es de un jugador hacia otro** (Paz o Alerta): en Alerta, tus tropas atacan a las de ese jugador donde coincidan. Si dos jugadores pelean, todas las zonas donde coexisten pasan a conflicto.
- **Defensor** = quien controla la zona; si nadie controla, **ambos son atacantes**.

### Tecnologías
- **203 tecnologías en 12 ramas.** Cada rama tiene **columna vertebral** (6 o 7, una por nivel) y opcionales.
- Para el **nivel 5** de una rama hay que **acabar su columna** hasta el nivel 4. Además, mínimos de tecnologías del nivel anterior: **3 / 5 / 6 / 6**. Hasta 2 prerrequisitos directos por tecnología.
- **Costo:** nivel × 20. Los **9 edificios básicos vienen ya desarrollados** al inicio.
- 🆕 **Los científicos investigan solos** si hay algo en cola: investigan los que alcance la ciencia guardada (2 cada uno) y el resto genera ciencia. Ya no se asignan. Cola de hasta 4.
- Camino más barato a la victoria tecnológica: **1700 a 2040 puntos**.

### Edificios
- 9 básicos (Almacén, Camino, Hospital, Cuartel, Fortificación, Molino, Taller, Mercado, Biblioteca) + **Maravilla**.
- **20 de producción por nivel**; mejorar paga la diferencia; destruir devuelve la mitad. 🆕 Se construye directamente en el **nivel más alto desbloqueado**, eligiendo con qué especialización nace.
- 🆕 **Uno de cada tipo por zona**; con una tecnología de nivel 3 de ese edificio se puede tener **un segundo** (💡 cuesta 50 % más).
- Trabajadores: 2 por defecto, 3 con *Andamios*, 4 con *Grúas*. El efecto se aplica **por trabajador**.
- **Construir lleva varios pasos** según la **capacidad de obra** de la zona (1 por poblador, 2 por constructor).
- **Maravilla:** 500 de producción, sin trabajadores, ocupa un espacio; si pierdes la zona, el conquistador se la queda.

### Tribus, eventos, victoria y fantasmas
- **Tribus:** una por oficio. **Anexar** cuesta `16 + 3 por civil + 5 por guerrero` (una típica, 30), pagado con las reservas de tus zonas cercanas; si dos pagan a la vez nadie la anexa y el precio se duplica. **Conquistar** da el 60 % de ese valor. A veces exigen **tributo** (6) y, si nadie paga, invaden.
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
| **Pruebas** | 🆕 `npm test` y GitHub Actions: regla de capas, 14 casos de reglas y 72 partidas entre bots | Detectar errores antes de jugar |
| **Servidor futuro** | FastAPI + WebSockets; cliente sencillo en HTML/JS (D3 o SVG) | Con pasos largos, la latencia no importa; lo más simple que funcione |
| **Motor** | Función pura `resolver_paso(estado, ordenes, rng)` con generador aleatorio **con semilla**, probada con **pytest** | Partidas reproducibles y tests fiables |
| **Configuración** | Todos los números en tablas o archivos de configuración, no dentro del código | Cambiar balance sin reescribir código |
| **Balance** | Simulador con bots que corre miles de partidas y mide quién gana y con qué | Es además la pieza de portafolio de datos |
| **Telemetría** | Registrar tiempo hasta ¡Listo!, órdenes por paso y condiciones alcanzadas | Con esos datos se decide la duración del paso |
| **Arte** | 2D en capas, estilo maqueta de pueblo vista desde arriba, colores planos y escenas pequeñas, inspirado en la Nueva Objetividad alemana de los años 20. El arte final debe ser **original** | Es el estilo que gustó; la claridad manda sobre el detalle |

---

## 5. Qué está terminado

- **Reglas en papel:** casi todo el juego, con 23 secciones y los puntos marcados como decididos o pendientes.
- **12 mapas** generados y validados por código, con atlas visual.
- **Catálogo de 203 tecnologías** en 12 ramas con columna vertebral.
- **Prototipo jugable v0.7** con los 12 mapas, de 2 a 4 jugadores, economía local y global, 6 oficios, 10 edificios con niveles y especializaciones, las 203 tecnologías, 8 tipos de unidad, combate completo, tribus, eventos, fantasmas, alianzas y las 7 condiciones de victoria.
- 🆕 **Interfaz (26/10/2026):** mapa como valle continuo (cercas donde hay camino, barrancos donde no), resumen de zona con quién trabaja y dónde, placas con reservas y pasos hasta el próximo poblador, edificios en tarjetas, tecnologías en subpestañas, sugerencias del paso, tributos visibles, **visor de batallas golpe por golpe**, postura con cada jugador y turno en la barra superior.
- 🆕 **Proyecto en GitHub** (github.com/Alejandroinfo/Imperial-steps) organizado por capas, con README, guía de colaboración y pruebas automáticas.

---

## 6. Qué falta (por prioridad)

### Alta
1. **Jugarlo con la familia.** 🆕 Ya se trabajó lo que se sentía mal al jugar sola (opciones de partida, tecnologías, zona, mapa, edificios, combate). Falta probarlo con más personas.
2. 🆕 **Ritmo y balance después de los cambios de hoy:** con la capital a +2 y el equipo más caro, casi nadie gana antes del paso 60 en las simulaciones (pendientes 26 y 28). Revisar los umbrales del modo prueba.
3. 🆕 **Confirmar las propuestas 💡 de hoy:** reparto del sobrante de comida (pendiente 29), costo del segundo edificio (30) y valores del equipo (31).
4. **19 de 203 tecnologías no tienen efecto simulado** (lista en la sección 23.2 de las reglas).
5. **Pasar el motor a Python** con pytest y tablas de configuración; después, el simulador de balance. 🆕 La separación por capas ya lo deja preparado.
6. **Multijugador real** (FastAPI + WebSockets, salas con código, reconexión).

### Media
7. **Bots mejores:** siguen atacando poco.
8. **Interfaz de órdenes** para muchas zonas: seleccionar varias, repetir órdenes, plantillas.
9. **Movimientos simultáneos:** qué pasa exactamente cuando dos ejércitos se cruzan en una frontera.
10. **Tutorial** para que un primo entienda el juego en 5 minutos. 🆕 Las sugerencias del paso son un primer paso.
11. **Pendientes de reglas:** los ❓ de `docs/Reglas_v0.1.md` (sección 20 y repartidos).
12. 🆕 **Pasar al Excel** los textos de tecnologías que cambiaron (pendiente 22).

### Baja
13. Arte definitivo, música, sonidos.
14. Accesibilidad (daltonismo, tamaño de texto), más de 4 jugadores, mapas aleatorios simétricos.
15. 🆕 Ideas de interfaz que quedaron para después: ficha rápida al pasar el mouse por una zona y deshacer la última orden (Ctrl+Z).

---

## 7. Problemas conocidos y riesgos

| Problema | Detalle |
|---|---|
| **Complejidad frente al objetivo** | El objetivo era sencillez, y hoy hay 7 condiciones de victoria, 6 terrenos, 10 edificios con niveles, 8 unidades, 203 tecnologías, eventos, tribus y fantasmas. Cada pieza tiene sentido; juntas pueden volver pesado cada paso. **Medir órdenes por paso y tiempo de decisión.** |
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
7. **Idioma:** todo en español, incluidos los nombres de reglas y de tecnologías.
8. **Estilo visual:** colores planos, formas duras, vista desde arriba, humor pequeño; la claridad por encima del detalle, porque el juego se decide en segundos.
9. **Sin reloj por ahora:** el paso avanza cuando todos están listos; primero se mide cuánto tarda la gente.
10. 🆕 **Trabajo en equipo:** ramas, *issues* y *pull requests* como dice `CONTRIBUTING.md`; el motor nunca toca la pantalla.

---

## 9. Cómo seguir en una conversación nueva

Sube a un **Proyecto de Claude** como conocimiento del proyecto:

- `docs/TRASPASO_Los_Pasos_del_Imperio.md` (este documento)
- `docs/Reglas_v0.1.md`
- `Tecnologias_v0.2.xlsx`
- `dist/Los_Pasos_del_Imperio.html` (el juego en un solo archivo; se genera con `python herramientas/empaquetar.py`)
- El atlas de mapas (`atlas_mapas.html`) si se va a trabajar en mapas.

🆕 El código está en **github.com/Alejandroinfo/Imperial-steps**; con el conector de GitHub, Claude puede leerlo y subir cambios.

Y abre un chat por tema. Mensaje inicial sugerido:

> Estoy desarrollando *Los Pasos del Imperio*. En el conocimiento del proyecto está el documento de traspaso, las reglas, el catálogo de tecnologías y el prototipo. Léelos antes de responder. Hoy quiero trabajar en **[tema]**. No cambies nada que esté marcado como ✅ decidido sin avisarme.

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
