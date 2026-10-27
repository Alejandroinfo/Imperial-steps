# Los Pasos del Imperio — Reglas v0.1

Documento de trabajo para corregir y construir encima. Reúne todo lo conversado hasta ahora.

**Leyenda de estado**

- ✅ **Decidido** — ustedes lo definieron.
- 💡 **Propuesta** — sugerencia mía, aún no aprobada.
- ❓ **Por definir** — falta una decisión o hay ambigüedad.
- 🆕 **Nuevo en la última sesión** (26 de octubre de 2026). Junto a ✅ o 💡 indica si lo decidieron ustedes o si es una propuesta mía.

**Última actualización:** 26 de octubre de 2026 (prototipo v0.13). 🆕 El 27 de octubre de 2026 se escribieron las reglas de **maravillas únicas**, **botín** e **ingenieros automáticos** (secciones 15.2 y 15.3); el prototipo ya tiene los **ingenieros automáticos** (15.2, 27/10/2026, v0.14); las maravillas únicas y lo de 13.3 todavía no (ver 23.5).

Cómo usarlo: cambien el emoji de estado cuando decidan algo, tachen lo que no les guste y escriban encima.

---

## 1. Visión general

- ✅ Juego multijugador de **planificación simultánea por pasos con tiempo real**: todos deciden a la vez durante una ventana de tiempo y luego el juego resuelve el paso.
- ✅ Un paso dura por defecto unos **30 segundos**; la duración es **configurable** en ajustes.
- ✅ **En las primeras pruebas no habrá límite de tiempo de partida**, para medir cuánto se demora la gente cuando el tiempo es ilimitado. Después se decide la duración por paso y la duración total con esos datos.
- ✅ **En las primeras pruebas el paso avanza solo cuando todos los jugadores están listos** (todos presionan "Listo"), sin reloj. Se mide cuánto tarda cada uno.
- 💡 Para las primeras partidas probar con 60–90 s y bajar cuando todos dominen el juego.
- ✅ Botón **"Listo"**: si todos los jugadores lo presionan, el paso se resuelve antes.
- ✅ **Órdenes automáticas**: lo que no se cambia sigue como estaba (producción, trabajo, etc.).
- ✅ Pensado para **4 jugadores**, pero diseñado para **N jugadores** (mínimo 2).
- ✅ Objetivo: la sencillez y diversión de planificar con presión de tiempo, **sin el micromanagement** de un RTS.
- ✅ Primer objetivo: jugarlo en línea con primos y familiares, antes de pensar en servidores grandes.
- ✅ Enfoque elegido: **control de territorio** (opción 2) con capa económica (opción 3).

---

## 2. Orden de resolución de un paso

Versión original de ustedes:

1. Acciones de la ronda (órdenes, cambios, elecciones)
2. Movimientos
3. Decisiones sobre zonas en tensión
4. Conflictos

Propuesta de versión extendida (lo que sería `resolver_paso`):

1. 💡 Crecimiento de población (según la comida del paso anterior)
2. 💡 Eventos (aplicar modificadores)
3. 💡 Órdenes (construir, investigar, especializar, posturas)
4. 💡 Movimientos
5. 💡 Cambios de relación (paz / tensión / guerra)
6. 💡 Combates, zona por zona
7. 💡 Control de zonas (quien queda solo con presencia, la toma)
8. 💡 Producción
9. 💡 Consumo de comida y hambre
10. 💡 Curación

~~❓ **Problema de ritmo:** la fase "decisiones sobre zonas en tensión" era una segunda ventana de decisión dentro del mismo paso.~~
✅ 🆕 **Resuelto (26/10/2026, decidido por Alejandro):** la postura es **de un jugador hacia otro**, no de una zona (ver sección 11). Cada movimiento elige además paz o ataque al entrar. Ya no hay segunda ventana de decisión.

---

## 3. Órdenes

- ✅ **Sin límite de órdenes por ahora.** Se prueba y se decide después cuántas se usan.
- 💡 Registrar cuántas órdenes da cada jugador por paso para decidir con datos si hace falta limitar.
- ❓ Si luego se limita: el límite aplicaría a las "órdenes nuevas" por paso (idea original: 2, configurable).
- 💡 Producción, comida y especialización funcionan como órdenes permanentes automáticas.

---

## 4. Mapa

- ✅ **Tamaño del mapa:** aproximadamente **6 zonas por jugador** (antes se pensó 4), es decir 6 × N zonas en total. No es la cantidad con la que empieza cada jugador.
- ❓ El mapa se define en el siguiente mensaje (zonas, conexiones, tipos de terreno, posiciones de tribus, zonas centrales, zonas riesgosas).
- ✅ **Cada jugador empieza solo en su capital.** Las demás zonas del mapa son de dos tipos:
  - **Tribus neutrales:** 2 por jugador (en un mapa de 3 jugadores, 6 tribus).
  - **Zonas vacías:** empiezan en **tamaño 3** y **sin personas**; se pueblan moviendo gente.
- 💡 Composición del mapa que resulta: por cada jugador, 1 capital + 2 tribus + 3 zonas vacías (suman 6). ❓ Confirmar cuántas zonas vacías.
- ❓ Límite de unidades por zona (mencionado como "algunas zonas tienen límites", falta definir cuáles).
- 💡 Diseñar el mapa como **grafo** (zonas conectadas) y que escale con el número de jugadores.
- 💡 Mapa abierto al inicio (sin niebla de guerra) en el primer prototipo.

### 4.1 Tipos de terreno

Cada zona tiene un terreno. Algunos efectos dependen de si la unidad es **atacante** o **defensora** (ver sección 10.0). Menor iniciativa actúa primero.

| Terreno | Combate | Economía |
|---|---|---|
| **Montañas** | Berserkers **defensores**: iniciativa 2 | Ingenieros y pobladores: +1 de producción |
| **Praderas** | Caballeros **defensores**: iniciativa 0 | Agricultores y pobladores: +1 de comida |
| **Bosques** | Arqueros **atacantes**: +1 de fuerza (un dado más) | Comerciantes: +1 de oro |
| **Ríos** | Arqueros **defensores**: +1 de fuerza (un dado más) | Comerciantes: +1 de oro |
| **Colinas** | Berserkers **atacantes**: iniciativa 2 | Ingenieros construyen usando +1 de producción (🆕 💡 antes también pobladores; ver 15.2) |
| **Llanuras** | Caballeros **atacantes**: iniciativa 0 | Científicos: +1 de tecnología |

- ✅ Cada terreno favorece a un tipo de unidad en un rol (atacante o defensor) y a una especialización.
- ✅ **Ríos:** el efecto es para arqueros **defensores** (el "atacantes" del texto original era un error de escritura).
- ✅ **Bosques y Ríos:** el bono es **+1 de fuerza**, es decir, **un dado más** (no +1 de daño por dado).
- ❓ ¿Qué terrenos son **riesgosos** o **muy riesgosos** para los eventos (sección 13)?
- 💡 Iniciativa 0 pone a los caballeros por delante de los arqueros (1), así que Praderas y Llanuras los vuelven los primeros en golpear. Revisar en simulación.

### 4.2 Mapas propuestos (v0.1)

- ✅ Hay **12 mapas** para **2, 3 y 4 jugadores**, con 6 zonas por jugador (12, 18 y 24 zonas), todos **conectados** y **simétricos**: cada jugador tiene la misma posición, los mismos terrenos y las mismas distancias.
- ✅ Cada sector de jugador tiene **1 capital, 2 tribus y 3 zonas vacías**, con los **6 terrenos una vez cada uno**.
- ✅ **Las tribus están en el medio entre los jugadores:** en cada mapa, las 2 tribus de cada sector son las zonas más cercanas a la capital de algún rival, y las 3 zonas vacías son las más cercanas a la propia capital. Así cada jugador tiene al menos una zona libre vecina para expandirse desde el inicio, y las tribus quedan como la frontera que se anexa, se conquista o se negocia.
- ✅ No hay mar ni barcos por ahora.
- Se pueden ver en el archivo **Mapas_v0.1.html** (selector de 2, 3 o 4 jugadores).

| # | Mapa | Idea | Pasos mínimos entre capitales |
|---|---|---|---|
| 1 | Anillo | Camino largo que rodea el mapa | 5 |
| 2 | Estrella | Capitales en las puntas y anillo interior | 5 |
| 3 | Doble corona | Dos anillos con travesaños; agresivo | 3 |
| 4 | Archipiélago | Un puente por vecino, vigilado por una tribu | 5 |
| 5 | Espiral | Cadena larga que se enrosca | 6 |
| 6 | Pasos tribales | Cruzar al vecino obliga a pasar por una tribu | 5 |
| 7 | Fortaleza | Capital al fondo con una sola entrada; el más lento | 7 |
| 8 | Malla | Dos conexiones con cada vecino; el más rápido | 3 |
| 9 | Corazón | Anillo central compartido | 5 |
| 10 | Dientes de sierra | Zigzag con atajos interiores | 4 |
| 11 | Frontera ancha | Dos pasos paralelos entre vecinos | 3 |
| 12 | Rueda | Todo pasa por un centro compartido | 7 |

- ✅ 🆕 **Fronteras (26/10/2026, decidido por Alejandro: mapas más conectados y que las tribus no sean el colchón entre imperios):** entre cada par de imperios vecinos se agrega una **zona de frontera** («tierra de nadie»). El camino que unía las dos tribus ahora pasa por ella, y además se une con la zona libre más cercana de cada imperio, así que los vecinos se tocan directamente. 💡 Se ubica con un criterio geométrico para que sus caminos no pasen por encima de otras zonas; en 25 de los 36 mapas no hay ningún cruce (los mapas originales tenían 30 de 36). Ver la regla en la sección 11. 🆕 Ahora se llaman **villas francas** (ver 13.3).
- 💡 Para la primera partida de mesa, probar un mapa de ritmo medio (por ejemplo 1, 4 o 10) con 3 jugadores, y comparar después con uno rápido (8) y uno lento (7).
- ❓ Especialización y tamaño de población de cada tribu en cada mapa.

---

## 5. Población

### 5.1 Civiles

- ✅ Producen según su especialización (ver sección 7).
- ✅ Fuerza de combate **1**.
- ✅ Pueden moverse a territorios adyacentes. El movimiento es **gratuito**, pero ese paso **no generan nada**.
- ✅ **Dónde pueden entrar los civiles:** solo a zonas que, al moverse, estén **sin control** o **bajo tu control**. No entran a zonas controladas por otro (esa es tarea de los militares).
- ✅ En el paso en que se mueven **no producen nada**. Si al final de la ronda son los **únicos** en la zona, la siguiente ronda la zona estará **bajo tu control** y producirán normal.
- ✅ Si otro jugador movió a la misma zona al mismo tiempo, primero se decide **paz o conflicto**. Con paz, la zona **sigue sin control** (hay más de un jugador presente) y los civiles **siguen sin producir** la ronda siguiente.
- ✅ 🆕 Con paz entre varios jugadores en una zona sin control, los civiles comen de la zona propia más cercana que tenga comida (alimentación automática, sección 8).
- ✅ Para cambiar de especialización, primero pasan a **básico** y de ahí a la nueva (ej.: científico → ingeniero cuesta 2 de producción).

### 5.2 Militares

- ✅ Consumen **2 de comida** (el doble) y **no generan nada**.
- ✅ Fuerza inicial **2**; cada ronda que se mantienen como militares **sube +1** hasta un máximo de **4**.
- ✅ Convertir a civil básico cuesta **2** de producción; a civil especializado, **3**.
  - ✅ 🆕 Se hace con la orden **Licenciar** de la pestaña Militar; la tecnología *Reservistas* lo deja gratis.
  - 💡 🆕 Se puede licenciar en cualquier zona propia (sin Cuartel); las tropas heridas esperan a curarse; las máquinas de asedio no se licencian (ver pendiente 23).
- ✅ Moverlos cuesta **1 de oro por unidad por espacio** movido. 🆕 El formulario de «Ir» y la flecha del mapa muestran el costo exacto, y recuerdan que los civiles se mueven gratis pero ese paso no producen.
- ✅ 🆕 **Entrenar no necesita Cuartel (26/10/2026, decidido por Alejandro: el Cuartel frenaba el inicio y la agresividad):** se puede entrenar en cualquier zona propia. El Cuartel mantiene sus ventajas: sus militares no comen, dan movimiento extra y permite sus especializaciones.

### 5.3 Estados de una unidad

- ✅ **Activo:** realiza una tarea (producir, moverse, especializarse).
- ✅ **Inactivo:** no genera nada; es el estado para recuperarse.
- ✅ **Hambriento:** si no recibe comida. Si la siguiente ronda sigue hambriento, **muere**. Curarlo requiere consumir **el doble de comida por dos rondas consecutivas**.
- ✅ **Herido:** pasa tras un combate. No produce; entra en estado inactivo. Mientras está herido, su fuerza es **la mitad**.
- ✅ **Herido y hambriento:** muere de inmediato.
- ✅ **Tiempo de recuperación:** una unidad herida debe estar inactiva **tantas rondas como vida haya perdido** (ej.: vida 4, recibió 3 de daño, queda con 1 → 3 rondas).
- ✅ Los heridos **sí pelean** en combate, con la mitad de fuerza y menos vida, por lo que es más fácil que sean capturados (civiles) o mueran (militares).
- ❓ 💡 Muerte por hambre en 2 rondas puede ser muy dura con pasos cortos; probar 3.

---

### 5.4 Rasgos de las personas (🆕 27/10/2026, decididos por Alejandro; en el juego desde la v0.14, fases A y B)

- ✅ Cada civil nace (o llega, o se crea con su tribu) con **2 rasgos distintos**, de nivel **muy malo (−2), malo (−1), bueno (+1) o muy bueno (+2)**. **Lo más común es bueno y malo**; los extremos son raros y **en promedio hay más positivos que negativos**.
- ✅ Los rasgos se **reconocen con un ícono** de lo que afectan; al pasar el mouse se explica. **Borde dorado** si la persona tiene un rasgo muy bueno, **plateado** si solo bueno.
- ✅ **Productividad por oficio:** el rasgo solo afecta ese oficio (🌾 Agricultura, ⚒ Ingeniería, 🪙 Comercio, 🔬 Ciencia): un +25 % de oro solo vale si la persona es comerciante. 🆕 El rasgo de oficio vale **también para el poblador sin oficio** (su 1 de comida o de producción), y 🌱 *Fertilidad* se quitó porque el crecimiento sale solo de la comida.
- ✅ 🍽 **Apetito:** cuánta comida consume (bueno: come menos).
- ✅ **El jugador elige a quién especializar**, persona por persona (tocándola o arrastrándola). Se automatiza con la orden *oficio al nacer*, no eligiendo a los mejores por él. Motivo: a veces conviene más comida u oro que un +25 % en ciencia.
- 💡 **Probabilidades** por rasgo: muy malo 8 %, malo 32 %, bueno 43 %, muy bueno 17 % (promedio de unos +7 %). **Efecto**: ±25 % por nivel (±50 % en los extremos). Estimaciones mías; hay que jugarlas y simularlas.
- 💡 Los rasgos **no cambian** y viajan con la persona al cambiar de oficio, ser capturada o licenciada. Las tribus también tienen gente con rasgos, y se conservan al anexarlas o conquistarlas. Los bots eligen a los de mejor rasgo para cada oficio.
- 💡 Apetito: las fracciones se suman por zona y se redondean hacia arriba.
- ❓ **Fase C (sin hacer):** ❤ Salud (vida) y ⚔ Fuerza (dados) para el combate; son valores enteros (vida 3, fuerza 2) y hay que decidir y simular cuánto valen (💡 ±1 y ±2).
- ❓ Mostrar los rasgos también en el mapa y en el resumen de la zona, no solo en Población.

## 6. Recursos

### 6.1 Básicos

| Recurso | Para qué sirve | Quién lo produce | Logística |
|---|---|---|---|
| **Comida** | Mantener y hacer crecer la población | Aldeanos normales (+1), granjeros (+2) | Local; mover entre zonas cuesta **oro** |
| **Producción** | Construir edificios y armas, y especializar aldeanos | Aldeanos normales (+1), ingenieros (+2) | Local; mover entre zonas cuesta **oro** |
| **Oro** | Logística, y comprar un recurso faltante al precio de mercado (inicial **3 de oro por recurso faltante**) | Zona comercial y comerciantes | Sin costo |
| **Tecnología** | Desarrollar tecnologías, mejorar armas, desbloquear edificios | Científicos (+2) y zona tecnológica | Sin costo |

- ✅ Oro y tecnología son globales; comida y producción son locales.
- ❓ Unificar nombre: en las notas aparece **"Ciencia"** y **"Tecnología"** para lo mismo.

### 6.2 Recursos especiales y estratégicos

- ✅ Distribuidos en el mapa. Al controlar la zona, según su especialización, generan más comida, tecnología, producción u oro.
- ✅ Algunos dan **ventajas globales** mientras se controlen (más fuerza, reducción de algún costo).
- 💡 **Propuesta de lista de recursos y efectos:** ver la sección 6.3.

### 6.3 Recursos estratégicos en el mapa (💡 propuesta)

- ✅ Algunos recursos afectan **de forma local** (a la zona) y otros **de forma global** (a todo tu imperio) mientras controles la zona.
- ✅ Ayudan al desarrollo de tecnologías, a construir ciertas cosas y dan mejoras especiales (por ejemplo, el mitril).
- 💡 Se necesita **controlar la zona** para obtener el efecto; si la pierdes, pierdes el recurso.

| Recurso | Terreno típico | Alcance | Efecto |
|---|---|---|---|
| **Mitril** | Montañas | Local | Los escudos fabricados en la zona dan +1 de defensa al escudero que los lleve |
| **Hierro** | Colinas | Global | Las armas cuestan 1 de producción menos en todo el imperio |
| **Caballos salvajes** | Praderas | Local | Los caballeros entrenados en la zona empiezan con +1 de vida |
| **Madera noble** | Bosques | Global | Construir y mejorar edificios cuesta 5 de producción menos (mínimo 10) |
| **Piedra de cantera** | Colinas o Montañas | Local | Las Fortificaciones y Maravillas de la zona cuestan un 25 % menos |
| **Sal** | Ríos | Global | Cada zona comercial que controles da +2 de oro por paso |
| **Ruinas antiguas** | Llanuras | Global | +3 de tecnología por paso |
| **Hierbas medicinales** | Praderas o Bosques | Global | Los heridos se curan una ronda más rápido (mínimo 1) |
| **Gemas** | Montañas | Local | El Mercado de la zona da +1 de oro adicional por trabajador |
| **Brea** | Ríos o Bosques | Local | Las máquinas de asedio fabricadas en la zona tienen +1 de fuerza |

- ✅ 🆕 **Recursos disputados (26/10/2026, decidido por Alejandro: que se sientan más importantes):** además de su efecto, cada recurso **rinde más mientras más tiempo lo controles**: 💡 +1 por paso al tomarlo y +1 más cada 5 pasos, hasta +4 (comida o producción en la zona, oro o ciencia global, según el recurso). Si cambia de dueño, el contador vuelve a cero. Se ve en el mapa (con el color de quien lo tiene y su rendimiento) y en el panel Imperio, que lista todos los recursos del mapa. Los bots priorizan atacar zonas con recursos.
- 💡 **Reparto en el mapa:** por jugador, 1 recurso global y 2 locales, en zonas que no sean la capital y repartidos igual para todos (para mantener la simetría). Las tribus también pueden custodiar recursos: conquistar o anexar la tribu te los da.
- 💡 Las Maravillas podrían exigir tener cerca una Piedra de cantera; es opcional.
- ❓ ¿Los recursos se agotan, o duran toda la partida? Se asume que duran.
- ❓ ¿Los recursos aparecen en los mapas del atlas? Hoy no están; se pueden agregar de forma simétrica.

---

## 7. Zonas y especialización

- ✅ La especialización de una zona depende de **qué es la mayoría de la población** de la zona del jugador que la controla.
- ✅ Si hay suficientes aldeanos especializados, sube a **nivel 2 o 3**. Además requiere la **tecnología específica** para subir de nivel.
- ✅ **Número de especializados para cada nivel de zona:** hacen falta **4** para que la zona se especialice (nivel 1), **8** para el nivel 2 y **12** para el nivel 3, además de la mayoría y de la tecnología correspondiente en los niveles 2 y 3.

| Zona | Mayoría | Efecto por unidad | Bono de zona (nivel 1 / 2 / 3) |
|---|---|---|---|
| **Básica** | Pobladores | 1 comida y 1 producción por poblador; autosuficiente | — |
| **Producción** | Ingenieros | Ingeniero: **genera 2 de producción o usa 2 para construir** (normal: 1) | +4 / +8 / +12 producción (🆕 o de capacidad de obra mientras sus ingenieros construyen; ver 15.2) |
| ~~Industrial~~ | ~~Constructores~~ | ✅ 🆕 **Desaparece (27/10/2026, decidido por Alejandro):** se fusiona con la zona de Producción | — |
| **Agricultura** | Agricultores | Agricultor: 2 de comida (normal: 1) | +4 / +8 / +12 comida |
| **Tecnología** | Científicos | Científico: genera 2 o usa 2 de tecnología (solo ellos pueden) | 4 / 8 / 12 de tecnología |
| **Comercial** | Comerciantes | Comerciante: 2 de oro por paso | +4 / +8 / +12 oro |

Detalles:

- ✅ **Zona básica:** especializar es barato, **1 de producción por persona** que se especializa.
- ~~**Zona industrial:** usa producción local y, si no alcanza, la de la vecina.~~ ✅ 🆕 **Obras con producción de zonas vecinas:** una obra gasta la producción guardada de su zona y, si no alcanza, trae la de las zonas vecinas. Cada espacio de distancia cuesta **1 de oro por unidad de producción** movida (la regla es la misma de antes, pero ya no depende de una zona industrial).
- ✅ **Agricultura:** civiles no militares consumen 1 de comida, militares 2. El consumo es **local**.
- ✅ 🆕 **Capital (26/10/2026, decidido por Alejandro: la mitad de antes):** atributo de la zona inicial de cada jugador. Genera **+2 de producción, +2 de comida, +2 de tecnología y +2 de oro**, adicional a cualquier especialización. *Capital próspera* lo sube a **+3**. (Antes: +4 y +6.)
- ✅ El atributo de capital **se mantiene en la zona aunque sea conquistada** (son zonas muy especiales y perderlas debe doler). Se entiende que sus bonos pasan al conquistador. ❓ Confirmar esa interpretación.
- ❓ ¿Qué pasa con un bono de zona si la mayoría deja de ser de esa especialización?

---

## 8. Comida y crecimiento

- ✅ 🆕 **Alimentación automática (26/10/2026, decidido por Alejandro):** cada zona come primero de lo suyo; lo que falte sale de la zona propia más cercana que tenga comida (guardada o producida), y luego de la siguiente. ~~Sin costo.~~ ✅ 🆕 **Cambio del 27/10/2026 (decidido por Alejandro): mover esa comida cuesta oro de logística**, igual que un envío normal (distancia, Caminos, caravanas; *Graneros comunes* sigue dejando gratis la zona contigua). Si no hay oro suficiente, esa comida no llega y esa gente pasa hambre; vale también para las tropas fuera de casa. Vale igual para militares fuera de casa y para civiles de zonas que no producen comida. **Evitar el hambre va antes que crecer.** Después de alimentar a todos, el **excedente** se puede:
  1. **Almacenar** — ✅ 🆕 máximo **10 por punto de tamaño** de la zona, para comida y para producción por separado (antes 10 fijos). Ampliable con el Almacén (ver 15.1).
  2. **Enviar** a otra zona pagando la logística.
  3. **Crecer:** se gasta en progreso hacia un nuevo aldeano. 🆕 **Etapa de fundación:** hasta el paso 12, crecer cuesta la mitad, para que el inicio no sea tan lento (💡 `FOUNDING_STEPS = 12`). ✅ 🆕 **Cada zona elige su prioridad (decidido por Alejandro):** **Crecer** (todo el sobrante del paso, después de alimentar y de los envíos automáticos, va al crecimiento; es lo normal) o **Guardar** (el sobrante va al almacén; solo lo que no cabe va a crecer). Reemplaza la propuesta de repartir mitad y mitad.
- ✅ Costo del nuevo poblador según el **tamaño de la zona** (número de crecimientos que ha hecho, no la población actual): el 3.º cuesta **6**, el 4.º **10**, el 5.º **15**… (fórmula equivalente: n(n+1)/2).
- ✅ La comida invertida en crecer **se gasta** (a diferencia de almacenarla).
- ✅ Al inicio de cada ronda se revisa si la ronda anterior alcanzó el costo; si sí, el nuevo aldeano **aparece y trabaja esa misma ronda**.
- 💡 🆕 El progreso de crecimiento es **por zona** y **se acumula** si no se completa (así funciona el prototipo).
- 💡 🆕 Con la capital a +2: 4 pobladores producen unos 6 de comida y consumen 4 (+2 por paso). Especializando 2 agricultores sube a +4. En la prueba el primer poblador nació a los 6 pasos. La placa de cada zona muestra en cuántos pasos nace el siguiente.

### 8.0 Cadena de suministros (🆕 26/10/2026, decidido por Alejandro)

- ✅ **Dentro de tu territorio** (y en las fronteras) la comida circula por tus caminos y llega lejos.
- ✅ **Fuera**, tus tropas solo comen si hay una **línea de suministro**: un camino de como máximo 💡 **2 zonas** (3 con *Suministros de campaña*) hasta una zona tuya con comida, **sin pasar por zonas de un enemigo**.
- ✅ Una tropa **con hambre pelea con la mitad de los dados** y, si sigue sin comer, muere (💡 `HUNGRY_FIGHT = 0.5`).
- ✅ Una zona propia **rodeada** queda sitiada: solo come de sus reservas.
- ✅ En el mapa se dibuja la línea de suministro (verde si llega, roja si hay hambre) y un aviso **⚠ Sin suministros** si está cortada; la pestaña Militar dice desde dónde viene.
- 💡 Consecuencia buscada: **elegir dónde pelear** importa. Cortarle el camino al enemigo tomando una zona intermedia puede valer más que vencerlo de frente, y guardar comida (Recursos → Guardar) permite resistir un asedio.

### 8.0b Automatizaciones (🆕 26/10/2026, decididas por Alejandro)

- ✅ **Envíos automáticos:** una zona puede mandar cada paso comida o producción a otra zona propia (una cantidad fija o todo su sobrante), pagando la logística en oro como un envío normal. Se hace después de alimentar y antes de crecer.
- ✅ **Oficio de los que nacen:** cada zona puede elegir que los nuevos pobladores se especialicen al nacer (agricultor, ingeniero, etc.) si hay producción para pagarlo; si no, quedan como pobladores.
- ✅ **Prioridad de la comida:** Crecer o Guardar (ver arriba).

### 8.1 Tamaño de zona y migración

- ✅ **Tamaño de zona** = número de veces que la zona ha crecido. La capital inicial empieza con 4 aldeanos y **tamaño 4**.
- ✅ El tamaño **determina el costo del siguiente crecimiento** (tamaño 4 → el siguiente cuesta 15).
- ✅ **La migración no afecta el tamaño ni el costo de crecimiento.**
  - Si llegan 2 migrantes a una ciudad de tamaño 4, el siguiente crecimiento sigue costando 15 y, después de crecer, el tamaño pasa a 5 (no a 7).
  - Si una zona de tamaño 4 pierde 2 personas porque se van, sigue siendo de tamaño 4 y necesita acumular 15 para el siguiente.
- ✅ Las **zonas vacías** empiezan en **tamaño 3** sin personas; llenarlas por migración no cambia su tamaño, y el siguiente crecimiento (el 4.º) cuesta **10**.
- ✅ El tamaño **baja** cuando una zona controlada por otro jugador es conquistada: pasa a **tamaño 3** (ver sección 15).
- 💡 Consecuencia de diseño: el costo depende del tamaño y no de la gente, así que una zona de tamaño bajo crece más barato que una grande. Como las zonas vacías ya empiezan en 3, expandirse **no** es tan barato como pensé antes (corrección a una nota previa mía); el 4.º crecimiento ya cuesta 10.
- ❓ ¿Se asume que el tamaño **no** baja por otras causas (hambre, muerte de población)? Por ahora sí.
- ❓ Tamaño de las zonas de **tribus** al conquistarlas o anexarlas.

---

## 9. Unidades militares

- ✅ **Fuerza** = número de dados que se lanzan. **Ataque** = daño por dado exitoso. **Defensa** = armadura. **Iniciativa**: el **número menor actúa primero**.
- ✅ Todas tienen 3 de vida y 0 de armadura por defecto.

| Unidad | Tipo | Vida | Fuerza | Ataque | Defensa | Iniciativa |
|---|---|---|---|---|---|---|
| Aldeano | Melé | 3 | 1 | 1 | 0 | 10 |
| Soldado básico | Melé | 3 | 2 (sube hasta 4) | 1 | 0 | 5 |
| Arquero | Distancia | 3 | 2 (sube hasta 4) | 1 | 0 | 1 |
| Caballero | Melé | 3 | 2 (sube hasta 4) | 2 | 0 | 3 |
| Escudero | Melé | 3 | 2 (sube hasta 4) | 1 | 2 | 8 |
| Berserker | Melé | 3 | 2 (sube hasta 4) | 3 | 0 | 6 |

- ✅ **Al crear la unidad:** sin arma es soldado básico. Con **arco** → arquero. **Caballo** → caballero. **Escudo** → escudero. **Hacha** → berserker.
- ✅ 🆕 **Costo con equipo (26/10/2026, decidido por Alejandro):** las tropas especializadas pagan su equipo además del soldado. 💡 🆕 Valores bajados porque los militares salían muy caros: soldado **1**; equipo = **2 × el nivel de su tecnología** (arco 2, escudo 4, caballo 6, hacha 6). Arquero 3, escudero 5, caballero y berserker 7. Equipar a un soldado existente paga solo el equipo.
- ✅ 🆕 **Equipo recuperable:** si una tropa con equipo muere **en tu territorio**, su arma queda guardada en la zona; cuando la zona deja de estar en conflicto, se puede usar para entrenar otra pagando solo el soldado. 💡 Si conquistan la zona, el equipo guardado se pierde.
- ✅ **Berserker:** iniciativa **6** (antes 4). Actúa después del soldado básico (5) y antes del escudero (8) y el aldeano (10).
- ✅ Las tecnologías y sus efectos sobre estas unidades se definen **después**, y recién ahí se hace el simulador de balance.
- 💡 Modelar las tecnologías como **modificadores** sobre esta tabla base (ej.: "+1 armadura al escudero"), no como unidades nuevas.

### 9.1 Máquinas de asedio (💡 propuesta a partir de tu idea)

- ✅ Son **unidades**, no edificios. Se construyen con **producción** en un **Cuartel**, se desbloquean con **tecnologías** y tienen **niveles**.
- ✅ Hay **2 tipos**:
  1. **De daño de área:** su daño se aplica **por unidad** del grupo objetivo (cada unidad del grupo recibe el daño), en lugar de repartirse de una en una.
  2. **De asedio de fortificaciones:** **anulan la defensa extra** que da una Fortificación. Con más nivel, anulan más.

| Máquina | Tipo | Vida | Fuerza | Ataque | Defensa | Iniciativa | Costo (producción) |
|---|---|---|---|---|---|---|---|
| **Lanzapiedras** (daño de área) | Distancia | 4 | 2 | 1 por unidad del grupo objetivo | 0 | 2 | 8 |
| **Ariete** (anti-fortificación) | Melé | 6 | 2 | 2 | 1 | 7 | 8 |

**Niveles (propuesta):**

| Nivel | Lanzapiedras | Ariete |
|---|---|---|
| 1 | 1 de daño por unidad por dado exitoso | Anula 1 de defensa de la Fortificación |
| 2 | +1 de fuerza (3 dados) | Anula 2 de defensa |
| 3 | +1 de ataque (2 de daño por unidad) | Anula 3 de defensa |

- 💡 Cuántas máquinas puedes tener la limita el Cuartel (cada una es una unidad militar más) y, sobre todo, el costo de 8 de producción.
- 💡 Como el Lanzapiedras es de distancia, las unidades de melé enemigas no pueden elegirlo como objetivo hasta que mueran todos los de melé; los arqueros sí. El Ariete, al ser de melé, queda en primera línea.
- 💡 **Tecnologías propuestas** (sustituyen a *Asedio* y *Catapultas* del catálogo actual): *Ingeniería de asedio* (nivel 3, arietes nivel 1), *Arietes reforzados* (nivel 4, nivel 2), *Gran ariete* (nivel 5, nivel 3); *Lanzapiedras* (nivel 3), *Contrapesos* (nivel 4) y *Trabucos* (nivel 5).
- ⚠️ El daño de área es muy fuerte contra grupos grandes y contra civiles (que quedan capturados en masa). Hay que probarlo en la simulación.
- ❓ ¿Las máquinas consumen comida como los militares (2)? ¿Cuánto cuesta moverlas en oro?
- ❓ ¿Cuentan como población (para la condición de 75) y como militares (para el Cuartel y la eliminación de un jugador)? Se asume que sí.
- ❓ Si pierdes la zona donde están, ¿las máquinas se destruyen o se capturan?

---

## 10. Combate

### 10.0 Atacante y defensor

- ✅ **Defensor:** quien tiene el **control** de la zona y está siendo invadido por otro.
- ✅ **Atacante:** quien está en el conflicto y **no tiene el control**.
- ✅ Si **ninguno** tiene el control de la zona, **ambos son atacantes**.
- Estos roles activan los efectos de terreno de la sección 4.1.

### 10.1 Procedimiento

1. ✅ En cada zona en conflicto, **por separado**, pelean los dos ejércitos (con animación).
2. ✅ Se determina cuántas unidades pelean por jugador (algunas zonas tienen límites).
3. ✅ **Generación de daño:** por cada punto de fuerza se lanza un dado con **50 %** de hacer daño igual a su **ataque**, o 0.
4. ✅ Luego se aplican **modificadores** según tipo de unidad y terreno.
5. ✅ Las **olas de daño** se dan por **iniciativa**. Mismo nivel de iniciativa = al mismo tiempo.
6. ✅ Las unidades del mismo tipo forman un grupo y atacan a un grupo de enemigos si pueden.
7. ✅ Si el número de una unidad se reduce antes de actuar, su daño se reduce.

### 10.2 Selección de objetivos

- ✅ Los de **melé** solo pueden elegir melé hasta que mueran todos; después pueden elegir a distancia.
- ✅ Los de **distancia** pueden elegir a cualquiera.
- ✅ Las unidades de melé reciben el daño primero. Entre ellas, los **defensores** lo reciben primero.

### 10.3 Asignación de daño y armadura

- ✅ La armadura funciona como un **colchón por unidad**: cada unidad absorbe `armadura + vida`.
- ✅ Se asigna el daño total del grupo atacante unidad por unidad; el sobrante pasa a la siguiente.
- ✅ La armadura **se recupera después de cada ronda de combate**.
- ✅ **Ejemplo:** 8 arqueros hacen 10 de daño contra escuderos (3 de vida + 2 de armadura = 5): mueren 2. Con 12, igual mueren 2 y el tercero no sufre nada. Con 13, el tercero queda **herido**.

### 10.4 Sorpresa

- ✅ Quien ataca cuando el otro no (ver sección 11) tiene **ventaja de sorpresa**. Opciones consideradas: +1 de fuerza, +50 % de daño, o que el atacante actúe primero.
- ❓ Decidir cuál. 💡 Dejarlo como parámetro configurable (`modo_sorpresa`), empezar con +50 % de daño.

### 10.5 Ronda de combate

- ✅ Una **ronda de combate** es una pasada completa por todos los niveles de iniciativa.
- ✅ Al terminar, los militares pueden **elegir retirarse**.
- ✅ Si sobreviven unidades de ambos bandos y ninguno se retira, la zona queda **en conflicto** para el siguiente paso.

### 10.6 Civiles en combate y captura

- ✅ Los civiles **pelean igual** que los militares, pero en vez de morir quedan **capturados** (con **1 de vida**, heridos, necesitan tiempo para curarse).
- ✅ Mientras las tropas invasoras estén en la zona, los civiles siguen capturados.
- ✅ Si las tropas invasoras **se van**, los capturados **se quedan y vuelven a su dueño**.
- ✅ Si las tropas **defensoras se retiran** y las invasoras se quedan, los capturados **pasan al vencedor**.
- ✅ Los capturados no producen nada y **consumen comida** y **oro de logística** hasta curarse. Si no se les alimenta, mueren (herido + hambriento = muerte inmediata). Esto frena la bola de nieve.

### 10.7 Número aleatorio

- 💡 El motor recibe un generador de números aleatorios **con semilla**, para que los tests y las batallas sean reproducibles.

---

## 11. Paz, ataque y tensión

- ✅ **Zona sin control:** al mover una unidad a una zona sin control, si al **final de la ronda** la zona queda ocupada por **una sola facción** (un jugador o una unidad neutral), esa facción **obtiene el control** de la zona. Reemplaza la regla anterior de "al siguiente turno".
- ✅ Si llegan **dos o más jugadores** a la vez a una zona sin control, primero se decide **paz o conflicto**. Con paz, la zona **sigue sin control** mientras haya más de un jugador presente.
- ✅ **Zona vacía con dueño:** permanece bajo el control de su dueño **hasta que otro llega**. Si al final de la ronda ese invasor es el **único** ahí, **se conquista la zona**, con las reglas de conquista de la sección 15: baja a tamaño 3, se saquean los edificios y se queda con uno.
- ✅ **Vocabulario:** **"conquistar"** es quitarle una zona a un jugador; **"anexar"** es solo para las tribus que se unen por paz (al darles lo que piden).
- ✅ **Zona controlada por otro jugador:** al entrar, el atacante elige **paz o ataque** en su orden de movimiento; el defensor responde según su **postura hacia ese jugador** (✅ 🆕 ver abajo).
  - Ambos paz → hay paz en la zona.
  - Uno ataca y el otro no → pelean, y el que atacó tiene **ventaja de sorpresa**.
  - Ambos atacan → pelean sin ventaja.
- ✅ La zona queda **en tensión**. Si hay conflicto en cualquier lugar del mapa entre esos dos jugadores, **todas las zonas en tensión** que tengan entre ellos pasan a conflicto. Los beneficios de la zona los sigue teniendo quien la controlaba.
- ✅ **Zona en conflicto:** si alguien ataca y al terminar la ronda de combate quedan tropas de ambos sin retirarse, sigue en conflicto el siguiente paso.
- ✅ 🆕 **Dilema del prisionero en la frontera (26/10/2026, decidido por Alejandro; 🆕 27/10/2026 pasa a las villas francas y cuentan solo las tropas, ver 13.3):** la frontera **nunca tiene dueño**; cualquiera puede entrar con civiles o tropas. Quien tiene gente ahí no produce y come de su zona más cercana, pero gana oro: 💡 **+3 por paso a cada uno** mientras todos los presentes estén en paz, o **+4** si está solo. Si alguien ataca, ese paso nadie gana, y el atacante tiene sorpresa si el otro estaba en Paz. Cooperar conviene a los dos; traicionar conviene a uno.
- ✅ 🆕 **Postura entre jugadores (26/10/2026, decidido por Alejandro):** cada jugador tiene una postura **hacia cada rival**: **Paz** (por defecto) o **Alerta**. Con Alerta, sus tropas atacan a las de ese jugador **en cualquier zona donde coincidan**, con sorpresa si el otro está en Paz. Se elige en Imperio → Relaciones o en la pestaña Militar. Reemplaza la «postura de zona».

---

## 12. Tribus neutrales

- ✅ Término único: **tribus** (equivale a las "tropas neutrales" de las primeras notas).
- ✅ Comienzan con una cantidad de personas; están en **una sola zona** y especializadas en **un tipo**.
- ✅ Hay **2 tribus por jugador** al inicio (6 en un mapa de 3 jugadores).
- ✅ **Conquistar por conflicto** da una gran cantidad de recursos de su tipo.
- ✅ **Anexar** una tribu requiere darle **ese mismo recurso** que pide.
- ✅ **Precio de anexión (más caro):** `16 + 3 por cada civil + 5 por cada guerrero` de la tribu. Una tribu típica (3 civiles y 1 guerrero) cuesta **30**, y sube si la tribu crece. *Ofrendas* lo baja un 25 %, y un empate lo duplica. Si el recurso es comida o producción, se paga con la **suma de las reservas de tus zonas cercanas** (🆕 cada zona guarda 10 por punto de tamaño, así que una o dos zonas suelen alcanzar).
- ✅ **Conquistar** una tribu da el **60 %** de su precio base en el recurso que producen (unos 18 para una tribu típica).
- ✅ **Cómo se ejecuta la anexión:** se **paga desde la zona fronteriza** a la tribu, como una orden; no entra ninguna unidad. Esto reemplaza la regla original de mandar un civil y elegir paz.
- ✅ Si el recurso pedido es **producción o comida**, se paga además el **oro de logística** por moverlo hasta la zona fronteriza desde donde se paga. Con **oro** (y tecnología) no hay costo de logística.
- ✅ **Anexión simultánea:** si dos o más jugadores pagan por la misma tribu en el mismo paso, **nadie la anexa y se devuelven los pagos**. En la **ronda siguiente**, el costo de anexarla es el **doble**.
- ✅ El costo doble **se mantiene hasta que alguien anexe la tribu**, y **se vuelve a duplicar con cada empate** (x2, x4, x8…).
- ✅ **Cómo se conoce una tribu:** al ser vecino, es decir, al tener **alguna unidad en una zona fronteriza** a la tribu en ese momento, te enteras de **qué tipo de tribu es** y de **las condiciones para anexarla**.
- ✅ Lo que piden para unirse **no cambia** una vez revelado; cuanta más población, más piden (comida, producción u oro).
- ✅ Si se unen, pasan a ser parte del imperio, **en el mismo trabajo** que tenían.
- ✅ **Crecimiento y defensa:** crecen por eventos. Si las atacan, o por evento, **todos se vuelven berserkers antes del combate**.
- ✅ **Tributo y expansión:**
  - Por evento pueden pedir **tributo** a los jugadores vecinos.
  - Si hay un solo vecino, debe superar la cantidad pedida. Si hay dos o más, quien menos da recibe la invasión.
  - Si se paga, la tribu busca un espacio libre y funda una **nueva tribu con la mitad de su población inicial**. Si no hay espacio, se queda.
  - Si no se paga, **invade con toda su población** y se queda hasta ser eliminada o hasta que se le pague. Habrá al menos una ronda de conflicto. Su zona inicial queda vacía mientras tanto.
  - Si logran el territorio, **se destruyen los edificios** de ahí y se regresa la mitad a la tribu original. La nueva tribu tiene la misma especialización.
- ❓ Aclarar "se regresa la mitad a la tribu original" (¿mitad de qué?).
- ❓ Aclarar cuál vecino recibe la invasión cuando hay empate o varios.
- 💡 El sistema de tributos e invasiones es complejo; dejarlo para una capa posterior.
- 🆕 **Cambios del 27/10/2026 (decididos por Alejandro), que reemplazan parte de lo anterior; detalle en 13.3:**
  - ✅ **Ya no se puede anexar una tribu desde el inicio.** Primero hay que **ganarse su confianza** cumpliendo sus pedidos; recién con la relación al máximo se puede anexar pagando recursos.
  - ✅ **El tributo deja de ser una amenaza:** pasa a ser un pedido más, sin invasión si nadie paga.
  - ✅ **Si atacas a una tribu, entras en guerra con ella:** ataca con **todas sus unidades** a tus zonas más cercanas hasta que la conquistes.
  - ✅ **Los militares de las tribus no consumen comida.**

---

## 13. Eventos

- ✅ Ocurre un evento **cada 3 rondas**, a partir de la **ronda 6**.
- ✅ **Positivos:** aumentan la producción de recursos en ciertas zonas, o reducen costos logísticos ese paso.
- ✅ **Negativos:** aumentan el consumo de recursos para tareas, o la comida consumida.
- ✅ **Neutrales:** afectan a las tribus.
- ✅ **Riesgo del terreno** (amplifica el efecto): terreno neutral (climatológico) = efecto normal; **riesgoso** = +50 %; **muy riesgoso** = +100 %. Se aplica igual a positivos y negativos.
- ✅ Hay varios **tipos de terreno** y algunos eventos solo afectan a ciertos tipos.
- ✅ Se conoce el efecto con **2 rondas de anticipación**. Con tecnología se sabe más y se pueden **evitar**.
- ✅ Los tipos de terreno están definidos en la sección 4.1.
- 💡 **Propuesta de catálogo de eventos y de riesgo por terreno:** ver la sección 13.1.

### 13.1 Catálogo de eventos y riesgo por terreno (💡 propuesta)

**Riesgo por terreno** (propuesta): el riesgo es el precio de las ventajas del terreno. Un efecto base se multiplica por el factor de la zona (redondeando).

| Riesgo | Terrenos | Factor |
|---|---|---|
| Seguro | Praderas, Llanuras | x1 |
| Riesgoso | Bosques, Ríos | x1,5 (+50 %) |
| Muy riesgoso | Montañas, Colinas | x2 (+100 %) |

**Catálogo** (cada evento afecta solo a los terrenos que indica; todos se anuncian con 2 rondas de anticipación):

| Evento | Tipo | Efecto base | Terrenos afectados |
|---|---|---|---|
| Buena cosecha | Positivo | +2 de comida por agricultor y poblador | Praderas, Llanuras |
| Veta rica | Positivo | +2 de producción por ingeniero y poblador | Montañas, Colinas |
| Feria | Positivo | +2 de oro por comerciante | Ríos, Bosques |
| Inspiración | Positivo | +2 de tecnología por científico | Llanuras, Colinas |
| Caminos despejados | Positivo | Mover comida y producción cuesta la mitad ese paso | Todos |
| Año fértil | Positivo | Crecer cuesta la mitad ese paso | Todos |
| Sequía | Negativo | −1 de comida por agricultor y poblador | Praderas, Llanuras |
| Plaga | Negativo | +1 de consumo de comida por persona | Bosques, Ríos |
| Derrumbe | Negativo | −1 de producción por ingeniero y poblador | Montañas, Colinas |
| Inundación | Negativo | Los almacenes pierden la mitad de sus reservas | Ríos |
| Tormenta | Negativo | Mover comida y producción cuesta el doble ese paso | Todos |
| Fiebre | Negativo | Los heridos tardan una ronda más en curarse | Todos |
| Inquietud tribal | Neutral | Una tribu crece +1 de población | Tribus |
| Exigencia de tributo | Neutral | Una tribu pide tributo a sus vecinos (ver sección 12) | Tribus |
| Éxodo tribal | Neutral | Una tribu funda una nueva tribu (ver sección 12) | Tribus |
| Furia tribal | Neutral | Una tribu se vuelve berserker antes de su próximo combate | Tribus |

- ✅ Se sortea **1 evento cada 3 rondas** a partir de la ronda 6 (antes era uno por ronda, y resultaba demasiado frecuente), con generador aleatorio con semilla para que las partidas se puedan repetir.
- 💡 Conexión con las tecnologías: *Calendario*, *Astronomía* y *Pronóstico* (ver con más anticipación y evitar), *Semillas resistentes*, *Reservas de emergencia*, *Fortuna del temerario* y *Resistencia climática*.
- ❓ ¿El evento afecta a todas las zonas del terreno indicado o solo a algunas sorteadas? Se asume que a todas, para que sea justo con el mapa simétrico.

### 13.2 Encuentros (🆕 26/10/2026, decididos por Alejandro)

- ✅ Llegan **sin aviso** a una zona del jugador (de preferencia de frontera) y se deciden **en ese mismo paso**; no hay que prepararse, hay que jugar alrededor de ellos.
- ✅ 🆕 **Solo oportunidades (decidido por Alejandro):** son ofertas o apuestas que conviene aprovechar si se puede. **Nada negativo** si se rechazan o no se responden: una amenaza que llega sin aviso es demasiado al azar para poder prepararse.
- ✅ **Entre más avanza la partida, más piden y más dan** (💡 los montos se multiplican por 1 + paso/15; las personas que llegan suben 1 cada 20 pasos).
- 💡 Frecuencia: uno cada 4 a 7 pasos por jugador, desde el paso 4.
- 💡 **20 tipos con 43 variantes** de quién llega; algunos dependen del terreno. Dos clases:
  - **Ofertas** (pagas y recibes): mercenarios, veteranos, arqueros, jinetes, refugiados, artesanos, mercaderes, sabio, escuela, caravana de hierro, mercado de granos, compradores, herrero, armero, juglares, parteras, pescadores, mineros.
  - **Apuestas** (pagas y puede salir mal): mapa del tesoro, alquimista.
- ✅ Los bots también reciben encuentros y los deciden con una regla simple.

### 13.3 Villas francas, subastas, tribus amigas e historias (🆕 27/10/2026, decididas por Alejandro)

**Villas francas (antes «zonas de frontera»)**
- ✅ Nadie puede adquirirlas. Los locales se gobiernan solos y **pagan a quien los protege**: tener **tropas** ahí da un flujo de recursos.
- 💡 Nombre «villa franca» (franca = libre, sin señor). Solo cuentan los **militares**, ya no cualquier persona. Se mantiene el dilema del prisionero: +4 de oro por paso a quien protege solo, +3 a cada uno si son varios en paz, y nada si hay pelea.
- ✅ Están en los **puntos medios entre donde empiezan los jugadores**, con **un promedio de una por jugador**, buscando simetría sin que sea obligatoria.
- 💡 Hoy salen 1 (2 jugadores), 3 (3 jugadores) y 4 (4 jugadores) en los 12 mapas: falta **una segunda en los mapas de 2 jugadores**.

**Subasta a sobre cerrado**
- ✅ **Cada 20 pasos** hay una subasta abierta a **todos** los jugadores. Se sabe **en qué moneda** hay que pagar, pero no exactamente qué se ofrece.
- ✅ Se ofrecen **tantos objetos como jugadores**, y **cada objeto se subasta por separado**: ofreces lo que quieras por cada uno, en secreto.
- ✅ Gana la oferta más alta y **a los demás se les devuelve lo que ofrecieron**. **Si hay empate arriba, todos los empatados se lo llevan.**
- 💡 Se anuncia **2 pasos antes**, con la moneda, para que todos puedan juntar. La moneda es oro o ciencia (globales); si fuera comida o producción, se paga desde la capital.
- ❓ Qué se ofrece (tropas, tecnologías, personas, equipo, objetos únicos) y cuánta pista se da antes.

**Encuentros de elegir entre dos**
- ✅ Una categoría nueva dentro de los encuentros: llegan **dos ofertas** y eliges **una o ninguna**. Da costo de oportunidad sin castigar a nadie.

**Pedidos de las tribus vecinas y relación**
- ✅ Una **tribu neutral que toca tus zonas** te hace pedidos. **Cumplirlos mejora la relación**, hasta que puedes **anexarla pagando recursos**.
- ✅ **Frecuencia fija y conocida, no al azar**, con pedidos sacados de una lista, igual para todos los vecinos.
- 💡 Un pedido **cada 5 pasos**, en el mismo paso para todos, según el oficio de la tribu (la agrícola pide comida, la de producción pide herramientas…).
- 💡 Relación de **0 a 3** (desconfianza, trato, amistad, alianza); en el nivel 3 se puede anexar. Rechazar un pedido no tiene castigo, solo no avanzas. Si dos jugadores la anexan en el mismo paso, se aplica el empate de siempre (nadie la anexa y el precio se duplica).
- ✅ Conquistarla sigue siendo posible, pero **atacarla es entrar en guerra** con ella (ver sección 12).

**Historias de 4 capítulos**
- ✅ Encuentros encadenados: lo que eliges en cada capítulo cambia el siguiente, y la historia vuelve a lo largo de la partida.
- 💡 Una historia por jugador y por partida, con un capítulo cada 8 pasos más o menos y un final distinto según el camino. Para empezar, 3 historias para elegir al azar.
- ❓ Los argumentos de las historias y sus recompensas.

---

## 14. Tecnologías

- ✅ Tres tipos:
  - **Civiles:** mejoran la producción de los civiles.
  - **De construcción:** desbloquean edificios en todo el imperio.
  - **Militares:** permiten crear armas para especializar unidades y dan bonificaciones.
- ✅ **Compartir:** al inicio de la ronda, si estás al lado de un vecino, puedes darle una tecnología que no tenga, gratis o a un precio. Para quien la recibe, el costo de desarrollarla en puntos de tecnología se **reduce a la mitad**.
- ✅ Las tecnologías tienen **niveles** (1 a 5) y se organizan en **ramas**: completar algunas tecnologías **abre las de abajo** (las del nivel siguiente de esa rama).
- ✅ **Costo según el nivel** (en puntos de tecnología): nivel 1 = **20**, nivel 2 = **40**, nivel 3 = **60**, nivel 4 = **80**, nivel 5 = **100**. (Los niveles 3 y 4 siguen la progresión; confirmar.)
- 💡 Con el árbol propuesto en 14.1, el camino más barato para la victoria por tecnología (5 tecnologías de nivel 5, con sus requisitos) cuesta unos **1600 puntos** de tecnología.
- 💡 Como compartir una tecnología a un vecino le reduce el costo a la mitad, el intercambio puede acelerar mucho esta victoria; tenerlo presente en las pruebas.
- ✅ **Estructura en red** (idea tuya): cada tecnología tiene **prerrequisitos directos** con sentido, y para investigar una de nivel más alto hace falta además un **mínimo de tecnologías del nivel anterior**.
- 💡 **Propuesta de catálogo de 200 tecnologías:** ver la sección 14.1 y el archivo **Tecnologias_v0.2.xlsx**.

### 14.0 Cómo se investiga (científicos)

- ✅ **Investigar no es instantáneo ni gratuito en personas:** hace falta tener **científicos**.
- ✅ 🆕 **Científicos automáticos (26/10/2026, decidido por Alejandro):** si hay una tecnología en cola, **todos los científicos investigan solos**, cada uno usando 2 de la ciencia guardada. Si la ciencia guardada no alcanza para todos, investigan los que alcance y **el resto genera ciencia** (ej.: con 4 guardados y 3 científicos, 2 investigan y 1 genera). Sin nada en cola, todos generan. **Ya no existe la orden de asignar.** Un científico genera 2 **o** usa 2, no ambas cosas.
- ✅ Una zona de tecnología suma además su bono (4, 8 o 12) **como capacidad de investigación** mientras sus científicos investigan (también limitado por la ciencia guardada).
- ✅ Una tecnología cuesta su nivel × 20 y **avanza cada paso hasta la capacidad de los científicos que investigan**, gastando de la ciencia guardada (que producen los científicos libres, las bibliotecas y la capital).
- ✅ Se puede tener una **cola de hasta 4** tecnologías en investigación.
- ✅ Las tecnologías que ya están en curso y las de nivel 5 siguen cumpliendo los requisitos (prerrequisitos, mínimos del nivel anterior y columna vertebral) al **empezar** a investigarlas.
- 💡 Consecuencia de diseño: al inicio no tienes científicos; hay que especializar pobladores (cuesta 1 de producción cada uno) antes de que la ciencia guardada sirva de algo.

### 14.1 Árbol de tecnologías: 12 ramas con columna vertebral (💡 propuesta, para corregir)

El catálogo completo está en **Tecnologias_v0.2.xlsx** (hojas *Reglas*, *Tecnologías*, *Ramas* y *Resumen*): 203 tecnologías con nivel, costo, tipo, rama, si son vertebrales u opcionales, efecto, prerrequisitos, origen, valoración de 1 a 5 y comentario.

**Reglas del árbol:**

- ✅ Hay **12 ramas**. Cada rama tiene una **columna vertebral** (de 6 a 7 tecnologías, con una sola de nivel 5) y tecnologías **opcionales** (especializaciones y extras).
- ✅ Para investigar una tecnología de **nivel 5** de una rama hay que **acabar su columna vertebral** (niveles 1 a 4). Las opcionales no cuentan para acabarla.
- ✅ Además hay un **mínimo de tecnologías del nivel anterior** (de cualquier rama): 3 para el nivel 2, 5 para el 3, 6 para el 4 y 6 para el 5. Son parámetros editables.
- Cada tecnología tiene hasta 2 prerrequisitos directos, siempre de un nivel menor. Costo: 20 por nivel.
- Cada edificio se desbloquea con una tecnología de nivel 1 (la Maravilla, con una de nivel 5). Las tecnologías de zona desbloquean los niveles 2 y 3 de las zonas especializadas.

| Rama | Tipo | Tecnologías | Columna | Opcionales | Costo de la columna (hasta nivel 4 / completa) |
|---|---|---|---|---|---|
| Agricultura | Civil | 17 | 6 | 11 | 240 / 340 |
| Producción | Civil | 14 | 6 | 8 | 240 / 340 |
| Comercio | Civil | 20 | 6 | 14 | 240 / 340 |
| Saber | Civil | 21 | 7 | 14 | 320 / 420 |
| Diplomacia e imperio | Civil | 12 | 7 | 5 | 260 / 360 |
| Logística (Almacén y Camino) | Construcción | 19 | 6 | 13 | 220 / 320 |
| Urbanismo (obras, zonas industriales, Maravillas) | Construcción | 13 | 6 | 7 | 280 / 380 |
| Sanidad y población | Construcción | 18 | 7 | 11 | 260 / 360 |
| Armas y unidades (incluye máquinas de asedio) | Militar | 23 | 7 | 16 | 340 / 440 |
| Cuartel y entrenamiento | Militar | 14 | 6 | 8 | 240 / 340 |
| Defensa | Militar | 12 | 6 | 6 | 280 / 380 |
| Guerra y conquista | Militar | 20 | 7 | 13 | 340 / 440 |
| **Total** | | **203** | **77** | **126** | |

- Los **niveles**: 20 de nivel 1, 48 de nivel 2, 51 de nivel 3, 49 de nivel 4 y 35 de nivel 5. Por tipo, 79 son civiles, 54 de construcción y 70 militares.
- Las **36 tecnologías de tu lista** están incluidas con tus efectos. Se eliminó *Pacificación* (contradecía las capturas) y se reemplazaron *Asedio* y *Catapultas* por 6 tecnologías de máquinas de asedio (sección 9.1).
- **Victoria tecnológica:** con la columna vertebral, el camino más barato a 5 tecnologías de nivel 5 **de ramas distintas** cuesta entre **1700 y 2040** puntos, según qué 5 ramas elijas.
- ⚠️ Si bastara con **cualquier** 5 tecnologías de nivel 5, se lograría con solo 2 ramas por unos 1500 puntos (Logística y Armas), porque varias ramas tienen más de una de nivel 5. Por eso propongo que sean **de ramas distintas** (💡, falta confirmar).
- Hay 27 tecnologías con **riesgo de balance alto** para revisar con el simulador.
- ❓ ¿Los mínimos del nivel anterior deben ser de cualquier rama o del mismo tipo? Se asume de cualquier rama.
- ❓ Varias propuestas usan mecánicas que aún no existen (vender recursos, mercenarios, rendiciones por intimidación, zonas riesgosas).

---

## 15. Edificios

- ✅ Existe la idea de almacenes (+capacidad sobre el almacenamiento base, 🆕 10 por punto de tamaño) y la posibilidad de que las tribus tengan edificios que se destruyen al ser invadidas.
- ✅ **Cuántos edificios puede tener una zona:** **1 por cada 3 de tamaño**. Con tamaño 4 (la capital al inicio) puede tener 1; con tamaño 9, 3 edificios.
- ✅ **Operar un edificio requiere trabajadores** en él. El tipo de edificio dice qué unidades necesita: por regla general, **edificios civiles → unidades civiles** y **edificios militares → unidades militares**.
- ✅ Por defecto, **2 personas por edificio**. La tecnología puede mejorar la **producción** del edificio y **cuántas personas** pueden trabajar ahí.
- ✅ Los trabajadores **siguen generando** mientras usan el edificio: el edificio es un lugar donde producen **mejor**, no una tarea que reemplaza su trabajo.
- ✅ **Conquista de una zona controlada por otro jugador:**
  - El tamaño de la zona se reduce a **3**.
  - Conserva como máximo **1 edificio** (consecuencia directa de la regla 1 edificio por cada 3 de tamaño).
  - Los **edificios extra se retiran** y se recupera **la mitad de la producción** que costó construirlos.
- ✅ La mitad de la producción recuperada se la lleva **el conquistador**, si el dueño anterior ya se fue de la zona.
- ✅ 🆕 **Botín (27/10/2026, decidido por Alejandro; corregido el mismo día):** al **ganar el control de una zona** (por conquista o por anexión), te quedas con **toda la comida y la producción guardadas** en ella, y con los **civiles capturados** en el combate. ~~La mitad de la producción guardada.~~ ✅ **El juego ya lo hace así:** las reservas no se borran al cambiar de dueño, los civiles vencidos pasan al ganador como pobladores heridos, y al anexar una tribu toda su gente pasa a ser tuya. Así guardar mucho en una zona expuesta es un riesgo y las guerras tienen premio (pendientes 26 y 28).
- ✅ El atributo de **capital se mantiene** en la zona conquistada (ver sección 7).
- ❓ ¿Quién elige qué edificio se conserva?
- ✅ Un jugador que pierde su capital **puede seguir jugando** con sus otras zonas; solo se elimina por la condición de la sección 17.
- ❓ Cuánto mejora la producción cada tipo de edificio. Para edificios militares falta definir qué mejoran, porque las unidades militares no producen nada.
- ❓ ¿Qué pasa con un edificio si no tiene trabajadores (porque murieron, migraron o fueron capturados)? Se asume que deja de funcionar pero no se destruye.
- ✅ **Los 9 edificios básicos vienen desbloqueados desde el inicio**, como si su tecnología de nivel 1 ya estuviera desarrollada: Almacén, Camino, Hospital, Cuartel, Fortificación, Molino, Taller, Mercado y Biblioteca. Esas 9 tecnologías cuentan como ya tuyas (para los mínimos del nivel 1 y la columna vertebral). La **Maravilla** sigue requiriendo una tecnología de nivel 5.
- ✅ **Cada edificio se mejora con las tecnologías de niveles superiores** (la Maravilla, con una de nivel 5). Con tecnologías de niveles superiores se **mejora** a nivel 2, 3, etc. o se **especializa** ("Esp.").
- ✅ **Costo por nivel (en producción):** nivel 1 = **20**, nivel 2 = **40**, nivel 3 = **60**… (20 por nivel, igual que las tecnologías).
- ✅ 🆕 **Se construye en el nivel más alto desbloqueado (26/10/2026, decidido por Alejandro):** un edificio nuevo nace directamente en el máximo nivel que permiten tus tecnologías, en una sola obra que cuesta 20 por nivel (lo mismo que construir y mejorar). Si ya tienes especializaciones para él, **eliges con cuál nace** (o sin especializar).
- ✅ 🆕 **Segundo edificio del mismo tipo (26/10/2026, decidido por Alejandro):** cada zona tiene uno de cada tipo; con una tecnología de **nivel 3** de ese edificio se puede tener **un segundo**, con la misma especialización (doble efecto) o con otra. 💡 Balance: el segundo cuesta **50 % más** (al construirlo y al mejorarlo), necesita sus propios trabajadores y ocupa otro espacio.
- 💡 🆕 Con dos hospitales, cada uno puede tener su especialización (civil y militar) y ambas cuentan.
- ✅ **Mejorar un edificio** cuesta **solo la diferencia**: si tienes un granero de nivel 2 y sacas la tecnología de nivel 3, pagas los 20 que faltan.
- ✅ **Destruir un edificio** que ya no necesitas devuelve **la mitad de su costo**. (Es la misma proporción que se recupera al retirar edificios en una conquista.)
- ✅ **Cuartel** (militar-ofensivo): los militares que trabajan ahí **no consumen comida**. Si se movilizan, pueden moverse **una zona extra** en un turno, y ese movimiento **sigue costando oro**.
- ✅ **Maravilla:** edificio especial **sin espacios para trabajadores**. Cuesta **500 de producción** cada una y **ocupa uno de los espacios de edificio** de la zona. Controlar **3 maravillas** es una de las condiciones de victoria (ver sección 16.3). ✅ 🆕 Hay **12, una por rama, y cada una es única en la partida**; da el efecto de la vertebral de nivel 5 de su rama (ver 15.3).
- ✅ Construirla en una zona pequeña obliga a llevar ingenieros y a pagar el oro de logística para traer la producción, así que no es barato.
- ~~💡 Requiere la tecnología **Arte monumental** (Construcción nivel 5).~~ ✅ 🆕 Requiere la **vertebral de nivel 5 de su rama** (ver 15.3).
- ✅ 🆕 ~~¿Tiene algún efecto aparte de contar para la victoria?~~ Sí: el efecto de la vertebral de nivel 5 de su rama (15.3).
- ✅ 🆕 ~~¿Hay un máximo de maravillas en la partida?~~ Sí: **una de cada** (12 en total), y quien la construye primero la tiene (15.3).
- 💡 **Propuesta de catálogo de edificios:** ver la sección 15.1.
- ✅ Sustituye a mi propuesta anterior de espacios por nivel: ahora los espacios dependen del **tamaño** de la zona.

### 15.1 Catálogo de edificios (💡 propuesta, para corregir)

**Reglas generales (ya decididas, ver sección 15):** cada edificio se desbloquea con una tecnología de nivel 1, cuesta **20 de producción por nivel** (40 el nivel 2, 60 el 3…), se mejora pagando la diferencia y se destruye recuperando la mitad. Necesita trabajadores (2 por defecto; 3 con *Andamios* y 4 con *Grúas*). Los efectos de cada nivel y las especializaciones vienen de las tecnologías (ver 14.1 y el archivo de tecnologías).

| Edificio | Trabajadores | Se desbloquea con | Efecto base (nivel 1) | Mejoras y especializaciones |
|---|---|---|---|---|
| **Almacén** | Civiles | Almacenes | 🆕 +5 de capacidad por punto de tamaño de la zona y por nivel (comida y producción). 💡 Especializaciones: +5/+10/+15/+25 por tamaño; intereses: 1 de oro por cada 20 (I) o 10 (II) guardados | 11 tecnologías: almacén de comida, de producción, intereses en oro… |
| **Camino** | Civiles | Caminos | Mover comida y producción desde o hacia la zona cuesta la mitad de oro | 6: variantes civil y militar, 1/3 del costo, gratis |
| **Hospital** | Civiles | Hospitales | Los heridos se curan en la mitad de rondas | 7: variantes civil y militar, curación en 1 ronda, bonos de eficiencia |
| **Cuartel** | Militares | Cuarteles | Los militares que trabajan ahí no consumen comida; pueden moverse 1 zona extra (cuesta oro) | 6: más zonas extra, entrenamiento, élite |
| **Fortificación** | Militares | Fortificaciones | Defensores: +1 de defensa | 5: +2 y +3 de defensa, torres, murallas, ciudadela |
| **Molino** | Civiles | Molinos | +1 de comida por trabajador | 4: +2, +3 y +5, y una especialización |
| **Taller** | Civiles | Talleres | +1 de producción por trabajador | 4: +2, +3 y +5, y una especialización |
| **Mercado** | Civiles | Mercados | +1 de oro por trabajador | 4: +2, +3 y +5, y una especialización |
| **Biblioteca** | Civiles (científicos) | Bibliotecas | +1 de tecnología por trabajador | 4: +2, +3 y +5, y una especialización |
| **Maravilla** | Ninguno | 🆕 Vertebral de nivel 5 de su rama (12 maravillas, una por rama) | 500 de producción; da el efecto de esa vertebral; cuenta para la victoria; ocupa un espacio | 2: más barata, más defensa |

**Equipar y entrenar** (propuesta, para completar lo que faltaba sobre cuánto cuesta un militar):

| Acción | Costo de producción |
|---|---|
| Convertir un civil en soldado básico (en un Cuartel) | 2 |
| Equipar con arco | 3 |
| Equipar con escudo | 4 |
| Equipar con hacha | 4 |
| Equipar con caballo | 6 |

- Con la tecnología *Arsenal*, las armas cuestan la mitad.
- ✅ El movimiento extra del Cuartel **sigue costando oro** (1 por unidad por espacio).
- ❓ Los bonos de los edificios económicos crecen rápido (+5 por trabajador en nivel 5 con 4 trabajadores = +20 por paso). Alternativa más suave: +1, +1, +2, +2, +3. Decidir con el simulador.
- ❓ ¿Se entrena en cualquier zona con Cuartel, o el equipo debe fabricarse en una zona industrial?
- ❓ ¿Cada edificio cuenta como 1 para la condición "Desarrollo" sin importar su nivel? Se asume que sí. ¿Y la Maravilla cuenta como edificio?
- ❓ Si una zona tiene una maravilla y otros edificios, ¿cuál se conserva al conquistarla? Se asume que siempre la maravilla, que pasa al conquistador.

### 15.2 Producción y obras: ingenieros automáticos (🆕 27/10/2026)

Es la misma idea que los científicos automáticos (sección 14.0), aplicada a la producción.

- ✅ 🆕 **Fusión de constructores en ingenieros (decidido por Alejandro):** desaparece el oficio de constructor (de **6 a 5 oficios**) y la zona Industrial se junta con la de Producción. Se acaba la «capacidad de obra» como un número aparte de la producción guardada.
- ✅ 🆕 **Ingenieros automáticos (decidido por Alejandro: «si no está construyendo nada, está produciendo»):** si la zona tiene una obra en cola, sus ingenieros **construyen solos**, cada uno usando 2 de la producción guardada de la zona. Si la producción guardada no alcanza para todos, construyen los que alcance y **el resto produce** (ej.: con 4 guardados y 3 ingenieros, 2 construyen y 1 produce). Sin obra en cola, todos producen. Un ingeniero produce 2 **o** usa 2, no ambas cosas. **No existe orden de asignar.**
- ✅ 🆕 **Cómo se reparte el trabajo en cada paso (decidido por Alejandro, 27/10/2026; v0.14):** se parte de la **producción guardada del paso anterior** y se ve si lo que se gastaría en obra supera lo que hay (guardado + lo que producen los demás + el bono seguro de la capital). Si la cuenta queda **en negativo**, pasan a producir primero **quienes mejor producen** hasta cerrar la brecha. Con la misma eficiencia es **mitad y mitad**: una mitad produce para que la otra construya. Si falta, se puede traer producción de zonas cercanas pagando oro (como ya era). Solo construyen los necesarios para lo que queda de las obras.
- ✅ 🆕 **Pausa de obras (27/10/2026, decidido por Alejandro):** un botón ⏸ junto a la obra en curso pausa **todas las obras de la zona**: nadie construye, todos producen y la producción se **guarda en el almacén** (el exceso sobre el tope se pierde). Es una orden que queda activa hasta que se reanuda. 💡 Junto a «Crecer» el botón «⏸ Pausar crecimiento» es el mismo «Guardar» de siempre con otro nombre: el sobrante de comida se guarda.
- ✅ 🆕 **Zona de Producción:** su bono (4, 8 o 12) cuenta **como capacidad de obra** mientras sus ingenieros construyen (también limitado por la producción guardada); si no hay obra, cuenta como producción de siempre. 💡 Cuenta como capacidad si al menos un ingeniero o poblador de la zona construye ese paso; lo que no se use en obra, produce.
- ✅ Una obra cuesta 20 por nivel y **avanza cada paso hasta la capacidad de los ingenieros que construyen**, gastando de la producción guardada de la zona (la que producen los pobladores, los ingenieros libres, los talleres y la capital).
- ✅ 🆕 **Los pobladores también construyen solos (decidido por Alejandro, 27/10/2026):** si hay algo en la lista de obras, cada poblador usa **1** de la producción guardada y **no genera su 1 de producción** (💡 sigue produciendo su 1 de comida); si no hay obra, produce como siempre. Es la misma idea que los ingenieros. 💡 Primero se asignan los ingenieros (usan más) y después los pobladores.
- 💡 🆕 **Sin tiempo mínimo para la Maravilla:** la velocidad sale de cuántos ingenieros tienes (por ejemplo, 12 ingenieros en una zona de Producción nivel 3 serían unos 36 por paso, o sea unos 14 pasos para 500). Hay que simularlo.
- ❓ 🆕 **Costo real de construir:** como el ingeniero que construye deja de producir, construir cuesta más en la práctica que antes. 🆕 **Medido (27/10/2026, 72 partidas de bots de 40 pasos):** con el sistema nuevo los bots construyen **más** (2,6 edificios por jugador al paso 40 contra 1,8; 1,5 contra 0,8 al paso 20), con algo más de población (10,4 contra 8,5) y algo menos de tecnologías (11,1 contra 12,4). Los bots no son personas: hay que confirmarlo jugando.
- ✅ 🆕 **Tecnologías retocadas (v0.14, decidido por Alejandro):** *Cuadrillas de obra* y *Línea de ensamblaje* dicen «ingeniero que construye»; *Logística de obra*, «las obras traen producción de zonas a 2 espacios»; *Canteras de colina* ya hablaba de ingenieros y pobladores. Los niveles 2 y 3 de la zona de Producción ya los abrían *Ingeniería básica* e *Ingeniería avanzada*, así que *Gremios de constructores* (ahora **«Gremios de ingenieros»**) y *Grandes obras* pasan a dar un **descuento**: 💡 Gremios, construir y mejorar cuestan un **10 %** menos; Grandes obras, mejorar a nivel 3 o más cuesta **10 de producción menos** (mínimo 10). Las dos cifras son estimaciones mías y hay que simularlas. Siguen siendo vertebrales de Urbanismo.

### 15.3 Maravillas únicas ligadas a las ramas (🆕 27/10/2026)

- ✅ 🆕 **12 maravillas, una por rama, únicas en toda la partida (decidido por Alejandro).**
- ✅ 🆕 **La vertebral de nivel 5 desbloquea la maravilla (decidido por Alejandro):** se paga como siempre (ciencia: 100), pero **por sí sola no da su efecto**: desbloquea la construcción de la maravilla de esa rama. **El efecto lo da la maravilla** mientras la controles; si te conquistan la zona, el efecto pasa al conquistador (ya decidido en 16.3).
- ✅ 🆕 **Solo se puede investigar esa tecnología si su maravilla todavía no se ha construido** (por nadie).
- ✅ 🆕 **Si pierdes la carrera (decidido por Alejandro):** si otro jugador termina la maravilla antes que tú, tu obra se cancela y pierdes la tecnología que la desbloqueaba, y **recuperas la mitad de la ciencia y la mitad de la producción** que habías puesto (por ejemplo, 50 de los 100 de ciencia). Si la tecnología aún estaba en la cola, se cancela y recuperas la mitad de la ciencia ya gastada.
- 💡 🆕 La obra se **anuncia a todos al empezar**, para que la carrera se vea.
- 💡 🆕 **Empate:** si dos jugadores terminan la misma maravilla en el mismo paso, **nadie la logra** y a cada uno le cuesta el doble lo que le falte (el mismo empate que las tribus).
- 💡 🆕 Las maravillas **no se pueden demoler** (sí conquistar), para que nadie reabra la carrera por capricho.
- 💡 🆕 Defensa solo tiene una tecnología de nivel 5 (la vertebral): quien construye esa maravilla cierra la rama a los demás. Es un detalle estratégico, no un error.
- 💡 🆕 *Canteras reales* (maravillas a 400) y *Guardianes de la maravilla* (+2 de defensa), de Urbanismo, siguen valiendo y pesan más ahora.

- ✅ 🆕 **Nombres y efectos de las 12 (27/10/2026, decidido por Alejandro):**

| Rama | Maravilla | Efecto mientras la controles | Nota |
|---|---|---|---|
| Agricultura | La Huerta Infinita | +1 de comida por agricultor | Efecto de su vertebral, tal cual |
| Producción | La Gran Fragua | +1 de producción por ingeniero | Tal cual |
| Comercio | La Lonja Dorada | +1 de oro por comerciante | Tal cual |
| Saber | La Torre de los Sabios | 🆕 Cada científico **genera o usa 3** (en vez de 2) | Reemplaza el efecto de *Enciclopedia*, que era casi inútil al final |
| Logística | La Calzada sin Fin | Mover comida y producción por su zona es gratis | Tal cual (riesgo de balance alto) |
| Urbanismo | La Plaza Mayor | 🆕 Tus obras cuestan **un 25 % menos** (no aplica a maravillas) | Nuevo: su vertebral desbloqueaba la Maravilla en general |
| Sanidad y población | Las Termas de la Salud | Todas las unidades con 2 de vida más | Tal cual (riesgo alto) |
| Diplomacia e imperio | El Palacio de los Pactos | +1 de cada recurso por cada 5 zonas | Tal cual |
| Armas y unidades | La Sala de los Mil Filos | Las armas cuestan la mitad de producción | Tal cual |
| Cuartel y entrenamiento | El Patio de Armas | La fuerza máxima sube de 4 a 5 | Tal cual |
| Defensa | El Bastión Eterno | Defensores con +4 de defensa y +1 de vida | Tal cual (riesgo alto) |
| Guerra y conquista | La Puerta de los Estandartes | 🆕 Tus **atacantes** tienen +1 de fuerza | Reemplaza *Contraataque*; es el espejo del Bastión |

- 💡 🆕 Se revisó que ningún nombre choque con una tecnología del catálogo.
- 💡 🆕 Alternativas que se descartaron: +1 espacio de edificio por zona para Urbanismo (empujaba demasiado la victoria de Desarrollo) y botín completo para Guerra.
- ❓ 🆕 **Excel:** cambiar el texto de las vertebrales de nivel 5 de las 12 ramas a «Desbloquea [maravilla]», y el efecto de *Enciclopedia*, *Maravillas* y *Contraataque* por los nuevos.
- ❓ 🆕 **Victoria tecnológica:** ¿una maravilla controlada cuenta como «nivel 5» para la condición de Tecnología? 💡 Yo diría que sí, porque da el efecto, pero un mismo logro alimentaría dos condiciones.
- ❓ 🆕 **Ritmo:** con la capital a +2, ¿cuántos pasos tarda una maravilla típica y cuántos las 3 de la condición de victoria? Simular antes de dar los números por buenos.

---

## 16. Condiciones de victoria

- ✅ **Se gana cumpliendo 2 de las siguientes 7 condiciones.** Gana el primero que lo logre; así los demás pueden ver el avance y reaccionar.
- ✅ Los valores son **provisionales**: se revalidan con la simulación y se bajan si resultan muy altos.

| Condición | Requisito |
|---|---|
| **Comercial** | Acumular **1000 de oro** |
| **Económica** | Tener **75 de población** |
| **Tecnología** | Desarrollar **5 tecnologías de nivel 5** (cada una cuesta 100; ver sección 14) |
| **Territorial** | Controlar **más del 70 %** del mapa |
| **Militar** | Controlar **2 capitales** (una puede ser la propia) |
| **Desarrollo** | Tener **20 edificios** en todo tu imperio |
| **Maravillas** | Controlar **3 maravillas** (500 de producción cada una; ver sección 16.3) |

- ✅ **Las condiciones se deben mantener**: las 2 tienen que estar cumplidas **al mismo tiempo**. Si pierdes una (por ejemplo, pierdes el control de una capital), esa condición **deja de contar**.
- ✅ **Oro:** debe estar **en tus cofres** (no cuenta lo gastado ni lo ganado antes). Hay que tener los 1000 mientras se cumple la segunda condición.
- ✅ **Edificios:** cuentan solo los que están **bajo tu control**; los que pierdes dejan de contar.
- ✅ El aliado fantasma de un jugador que gana también gana, por asociación (sección 17).

### 16.1 Cómo se ven los requisitos con cada tamaño de mapa

- Territorial (más del 70 % del total): hacen falta **9 zonas** de 12 (2 jugadores), **13** de 18 (3 jugadores) y **17** de 24 (4 jugadores).
- Militar (2 capitales): con 2 jugadores equivale a conquistar la capital rival y conservar la propia. Con 3 o 4 jugadores sigue siendo 2, así que pesa menos cuanto más jugadores haya.
- 💡 Para escalar con el número de jugadores N, la Militar podría ser "la mitad de las capitales, redondeando hacia arriba, más una" (2, 2 y 3 capitales para N = 2, 3 y 4). Decidir después de simular.
- Económica (75 de población): son unos 71 crecimientos desde las 4 personas iniciales. Como el costo sube con el tamaño de cada zona (10, 15, 21, 28, 36, 45…), repartir el crecimiento en muchas zonas sale mucho más barato que concentrarlo. Un cálculo muy aproximado, con 12 zonas creciendo unas 6 veces cada una desde tamaño 3, da del orden de 2000 de comida solo en crecimiento. Sigue siendo exigente; la simulación dirá.
- Desarrollo (20 edificios): cada zona permite 1 edificio por cada 3 de tamaño y cada edificio necesita 2 trabajadores, así que hacen falta unos 40 trabajadores y varias zonas pobladas. Es alcanzable expandiéndose, sin necesidad de zonas enormes.
- 💡 Con 7 condiciones y 2 requeridas hay 21 combinaciones. Hay caminos agresivos (Militar + Territorial), pacíficos (Comercial + Tecnología, Desarrollo + Económica) y mixtos (Maravillas + Militar, por ejemplo). Registrar en la simulación **cuál combinación gana más a menudo** para detectar caminos demasiado fáciles.

### 16.2 Pendientes de las condiciones

- ❓ ¿En qué momento se comprueba la victoria? Se asume que **al final de cada paso**, después de resolver combates y producción.
- ✅ **Empate:** si dos o más jugadores cumplen las condiciones en el mismo paso, **el juego continúa** hasta que uno tenga **una condición más cumplida que los demás** (por ejemplo, una tercera).
- ✅ **Tecnología:** definida en la sección 14 (niveles, ramas y costos). Falta el catálogo concreto.
- ✅ **Población:** cuentan **todas las personas, civiles o militares, que viven en tu imperio**. **No** es el tamaño de las zonas, porque este puede cambiar por conquistas.
- ❓ ¿Los civiles capturados cuentan para quien los capturó mientras no pasan a su control definitivo? Se asume que no hasta que pasen a su bando.
- ❓ **Territorial:** ¿las tribus anexadas y las zonas vacías controladas cuentan como zonas del mapa? Se asume que sí.
- ❓ **Edificios:** ¿cuentan también los que no tienen trabajadores asignados? Se asume que sí, mientras estén bajo tu control.
- 💡 Mostrar el **progreso de cada jugador** de forma pública, para cada una de las 7 condiciones.
- 💡 Como las condiciones se pueden perder, los rivales ya tienen una forma de reaccionar (reconquistar una capital, saquear edificios). Si en las pruebas la victoria llega demasiado de golpe, se puede exigir además mantenerlas durante N pasos.
- 💡 **Límite de duración** (60–90 min) con puntaje de respaldo si nadie gana.

### 16.3 Condición de maravillas

- ✅ **Controlar 3 maravillas** es una de las 7 condiciones: cuenta como una más dentro del "2 de ellas", no es una vía independiente.
- ✅ Una **maravilla** es un edificio especial, **sin espacios para trabajadores**, que cuesta **500 de producción** (1500 en total para las 3) y **ocupa un espacio de edificio** de la zona. 🆕 Las 3 deben ser **distintas** (hay una por rama, ver 15.3) y cada una se desbloquea con la vertebral de nivel 5 de su rama; las 3 ramas más baratas hasta el nivel 4 suman unos 640 de ciencia (💡 estimación sobre el catálogo v0.2).
- ✅ Construirla en una zona pequeña requiere llevar ingenieros y pagar el oro de logística para traer la producción.
- ✅ Si otro jugador te quita una zona donde construiste una maravilla, **la pierdes** y **él gana el control de ella**.
- ✅ Como el resto de las condiciones, las 3 maravillas deben estar **bajo tu control al mismo tiempo**.
- ❓ En una conquista, la zona baja a tamaño 3 y conserva un solo edificio. Se asume que **la maravilla es el edificio que se conserva**.
- ❓ ¿La maravilla cuenta como edificio para la condición de Desarrollo?
- 💡 Como las maravillas se pierden con la zona, construirlas es una apuesta visible: todos saben dónde están y se convierten en el objetivo natural de los demás jugadores.

---

## 17. Jugador eliminado ("fantasma") y alianzas

- ✅ **Condición de eliminación:** un jugador se vuelve fantasma solo si **pierde todas sus unidades militares** y **todas sus civiles son capturadas o mueren** (por ejemplo, de hambre). **Perder la capital no elimina**: puede seguir con sus otras zonas.
- ✅ Al ser eliminado, el jugador pasa a **"no poder ganar solo"**.
- ❓ ¿Qué pasa con las zonas que aún tenga el jugador eliminado (si quedan sin gente)? ¿Pasan a ser vacías o neutrales?
- ✅ Controla una **tribu neutral** si existe alguna libre. Su zona y población son pequeñas, y su **tecnología es la que tenía al ser eliminado**.
- ✅ Si **todas las zonas están ocupadas**, queda como **observador**.
- ✅ Puede **aliarse con un jugador vivo** y "ganar" con él (**ganar por asociación**). Ambos deben querer.
- ✅ **Solo hay alianzas entre fantasma y jugadores vivos**, no entre jugadores vivos.
- ✅ Mientras dure la alianza: **no pueden atacarse** y la movilidad entre ellos es **libre**, sin revisar conflicto.
- ✅ Para terminar la alianza se **avisa** y se hace efectiva la **siguiente ronda**.
- ✅ Las unidades del fantasma **defienden** las zonas del aliado si están ahí.
- ✅ Consumen la **comida del aliado**, o se define al hacer la alianza si el aliado les da comida y producción.
- ✅ Si el **aliado es eliminado**, el fantasma queda **libre**.
- ✅ La tribu del fantasma **puede ser atacada** por otros jugadores, como cualquier tribu.
- ✅ Para la victoria cuenta **solo lo del jugador vivo**.
- ❓ Si el fantasma ya tiene alianza, ¿puede el jugador vivo rechazar o limitar cuántos fantasmas acepta?
- 💡 Con pocos jugadores, un fantasma puede decidir quién gana (hacedor de reyes). Es parte de la diversión, pero hay que tenerlo presente al probar.

---

## 18. Condiciones iniciales

- ✅ Cada jugador comienza en su **capital** con **4 personas**.
- ✅ Recursos iniciales: **10 de comida, 10 de producción, 10 de oro y 10 de tecnología**.
- ✅ 🆕 La capital empieza con **10 de comida y 10 de producción**; su almacén base es 40 (10 × tamaño 4).
- ✅ La capital empieza con **tamaño 4**, por lo que ya puede tener **1 edificio**.
- ✅ **Nadie empieza con científicos:** los 4 pobladores iniciales son básicos. La primera decisión de cada jugador es elegir su apertura: **crecimiento explosivo** (hacerlos agricultores) o **ciencia primero** (especializar 1 o 2 científicos, que investigan solos cuando hay algo en cola).
- 💡 🆕 **Tampoco hay ingenieros al inicio:** para construir hay que especializarlos (1 de producción cada uno), igual que a los científicos (ver 15.2).
- ✅ Cada jugador empieza **solo con su capital**. El resto del mapa son tribus neutrales (2 por jugador) y zonas vacías de tamaño 3 (ver sección 4).
- ❓ Orden de turno / asignación de posiciones iniciales.

---

## 19. Arquitectura técnica (para después de cerrar las reglas)

- ✅ **Lenguaje principal: Python** (motor, simulaciones y análisis); es el más alineado con roles de data analytics y data science.
- 💡 **Motor puro:** `resolver_paso(estado, ordenes, rng)`, sin red ni pantalla, con tests en **pytest**.
- 💡 **Configuración en tablas** (unidades, zonas, costos) en un archivo que el simulador lee; cambiar un número no requiere cambiar código.
- 💡 **Simulaciones masivas** con bots (miles de partidas) para balancear: victorias por posición inicial, ventajas de unidades, duración de partida.
- 💡 **Telemetría** de partidas reales guardada en una base (SQL): órdenes por paso, tiempo de decisión, condiciones de victoria alcanzadas.
- ~~💡 **Servidor** con FastAPI + WebSockets; cliente simple en HTML/JavaScript (D3 para el mapa).~~ ✅ 🆕 **Multijugador con Firebase Realtime Database** (27/10/2026, decidido por Alejandro), sin servidor propio: ver pendiente 35 y `docs/multijugador.md`.
- 💡 La animación del combate **no frena el timer**: el estado ya está calculado.
- 💡 Un **notebook final** que cuente la historia del balance (para el portafolio).

### 19.1 Dirección de arte (💡 propuesta)

**Referencia:** el cuadro que mandaste (una vista aérea de un pueblo con tejados rojos y verdes, iglesia, carnicero con un cerdo, carroza fúnebre, detalles cómicos). Recuerda al estilo de la Nueva Objetividad alemana de los años 20: colores planos y saturados, formas duras y precisas, perspectiva elevada y pequeñas escenas humorísticas.

- 💡 **Concepto:** cada zona es una **maqueta de pueblo vista desde arriba**, con su terreno, sus edificios y personajes diminutos haciendo cosas (agricultores, comerciantes, un carnicero…). El tablero entero se ve como un juguete o un diorama.
- 💡 **Paleta:** marrones tierra y ocres, rojos de teja, verdes y verde azulado, cielo en degradado; contornos limpios y sombras marcadas.
- 💡 **Humor:** viñetas pequeñas que reflejan el estado de la zona (hambre, fiesta, evento, combate). Las animaciones de combate, con tono cómico, ya están previstas.
- 💡 **Claridad primero:** el juego se decide en 30 a 60 segundos, así que el arte no puede tapar la información. Se usan anillos de color por jugador, íconos simples de recursos y el mismo código de letras de terreno del atlas. El detalle fino va en un segundo nivel (al acercarte o al pasar el cursor).
- 💡 **Técnica:** arte 2D en capas (fondo de terreno, edificios, personajes) dibujado como imágenes vectoriales o ilustraciones, mostrado en el navegador con HTML y SVG o canvas. No requiere un motor 3D.
- 💡 **Ruta de trabajo:** (1) una zona de prueba en este estilo para fijarlo; (2) lista de piezas: 6 terrenos, 10 edificios en 3 aspectos visuales, 6 unidades militares y 2 máquinas de asedio con 2 animaciones, 6 civiles, íconos de recursos y eventos; (3) producir todo con un ilustrador o con herramientas de apoyo, manteniendo un solo estilo. Orden de magnitud: de 150 a 250 piezas para una primera versión.
- ⚠️ El estilo se puede imitar, pero no se deben reutilizar el cuadro ni otras obras tal cual: el arte del juego tiene que ser original.
- ✅ El **mock visual** se hizo dentro del prototipo jugable (sección 23): cada zona es una maqueta con terreno, edificios, tiendas y personajes. Hay una galería de estilo con los 6 terrenos en 4 variantes.

### 19.2 Pruebas sin límite de tiempo y telemetría (💡 propuesta)

- 💡 Registrar por paso y por jugador: **tiempo hasta presionar "Listo"**, número de órdenes, tipos de órdenes, recursos y condiciones de victoria.
- 💡 Registrar por partida: duración total, quién gana y con qué condiciones, tecnologías investigadas, cuántas veces se usó paz o ataque.
- 💡 Con esos datos se decide: duración del paso, si hay que limitar las órdenes y cuánto tiene que valer cada condición de victoria.

---

## 20. Pendientes y posibles contradicciones

1. ✅ 🆕 **Mapa:** cerrado. Hay 12 mapas para 2, 3 y 4 jugadores (sección 4.2 y atlas).
2. ✅ Condiciones de victoria definidas (2 de 7); quedan los detalles de la sección 16.2.
3. ❓ Unificar **Ciencia / Tecnología**.
4. ❓ Decidir **modo de sorpresa**.
5. ❓ Fórmula de **niveles de zona** (cuántos especializados hacen falta).
6. ❓ Lista de **eventos** (las propuestas de tecnologías y edificios están en 14.1 y 15.1).
7. ❓ Aclarar frases ambiguas del sistema de **tributos** de las tribus.
8. ✅ 🆕 **Segunda ventana de decisión:** resuelto. La postura es de un jugador hacia otro y se fija con una orden más (secciones 2 y 11).
9. ❓ **Hambre**: ¿2 o 3 rondas?
10. ✅ Iniciativa del berserker: ahora es 6.
11. ❓ Qué pasa con las **unidades de la tribu fantasma** si su aliado pierde la zona donde están.
12. ❓ **Tamaño de zona:** qué tamaño tienen las zonas de tribus al conquistarlas o anexarlas, y confirmar que el tamaño solo baja por conquista.
13. ❓ **Edificios:** cuánto mejora cada tipo la producción, qué mejoran los militares, y qué pasa si faltan trabajadores (se asume que el edificio deja de funcionar pero no se destruye). 🆕 El resumen de la zona avisa cuando faltan trabajadores.
14. ❓ **Conquista de zonas:** quién elige el edificio que se conserva.
15. ❓ **Composición del mapa:** confirmar 1 capital + 2 tribus + 3 zonas vacías por jugador (suman las 6 zonas por jugador del tamaño del mapa).
16. ✅ 🆕 **Comida de civiles en zonas sin control:** resuelto con la alimentación automática desde la zona propia más cercana (sección 8).
17. ❓ **Zonas de un jugador eliminado:** qué pasa con ellas si quedan sin gente.
18. ✅ Anexión simultánea de tribus: resuelta (ver sección 12).
19. ❓ **Terrenos:** qué terrenos son riesgosos o muy riesgosos para los eventos.
20. ❓ **Mapas:** elegir cuáles probar primero; definir especialización y tamaño de cada tribu.
21. ✅ 🆕 **Maravillas:** resuelto el máximo (una de cada, 12 en total) y el efecto (el de la vertebral de nivel 5 de su rama), ver 15.3. ❓ Sigue pendiente si cuentan para la condición de Desarrollo.
22. ❓ **Tecnologías y edificios:** revisar y corregir el catálogo de 203 tecnologías (Tecnologias_v0.2.xlsx) y los edificios de la sección 15.1. 🆕 Los textos de Almacén, Intereses del almacén y Capital próspera ya se actualizaron en el juego; falta pasarlos al Excel.
23. ❓ **Máquinas de asedio:** movimiento, comida, qué pasa si pierdes la zona, si cuentan como población y si se pueden licenciar (sección 9.1).
24. ❓ **Eventos y recursos:** revisar el catálogo de eventos (13.1) y la lista de recursos estratégicos (6.3), y añadirlos de forma simétrica al atlas.
25. ❓ **Arte:** revisar el estilo del prototipo (secciones 19.1 y 23). 🆕 El mapa pasó a ser un valle continuo: ¿se sigue en esa dirección?
26. ❓ **Economía militar:** 🆕 ahora las tropas con equipo cuestan más (sección 9) y la capital produce la mitad. Hay que volver a medir si los ejércitos quedan demasiado chicos.
27. ❓ **Victoria tecnológica:** confirmar que las 5 tecnologías de nivel 5 sean de ramas distintas (14.1).
28. ❓ 🆕 **Ritmo de la partida:** con la capital a +2 y el equipo más caro, en 72 partidas simuladas casi nadie gana antes del paso 60, ni siquiera en modo prueba. Revisar los umbrales del modo prueba o el ritmo económico.
29. ✅ 🆕 **Reparto del sobrante de comida:** resuelto. Cada zona elige Crecer o Guardar (sección 8).
30. ❓ 🆕 **Segundo edificio del mismo tipo** (💡 +50 % de costo): confirmar que no rompe el balance, sobre todo con Almacén, Cuartel y Biblioteca.
31. ❓ 🆕 **Valores del equipo** (💡 ahora 2 × nivel de la tecnología y soldado 1) y si el equipo guardado lo toma el conquistador en vez de perderse.
32. ❓ 🆕 **Economía estancada** (sigue abierta, aunque mejoró con la etapa de fundación y las fronteras): en las simulaciones la población se queda cerca de 10 hasta el paso 60 (ver `docs/balance_economia.md`). Decidir si se cambia el costo de crecer, lo que da el agricultor o el poblador, o si basta con que los jugadores se expandan.
33. ❓ 🆕 **Tecnologías muy fuertes según la simulación** (`docs/balance_tecnologias.md`): *Arado* y *Moneda* se pagan en 2 o 3 pasos; la línea de *Fortificación* sube hasta +51 puntos el % de victorias al defender; *Armaduras ligeras* +28 y +30.
34. ❓ 🆕 **Diseño para más tensión**, en el orden que eligió Alejandro: ✅ encuentros sorpresa y recursos disputados (secciones 13.2 y 6.3) → ✅ mapas más conectados con dilema del prisionero en la frontera (secciones 4.2 y 11) → tribus como amenaza latente y tributo negociado → multijugador por videollamada.
36. ❓ 🆕 **Fronteras:** confirmar los bonos (+3 / +4) jugando, y revisar los 11 mapas donde un camino todavía pasa por encima de otra zona (sobre todo Espiral y Dientes de sierra).
37. ✅ 🆕 **Maravillas:** no se podían construir (la orden no se atendía); corregido al agregar la revisión de tipos.
35. ❓ 🆕 **Multijugador para el primer playtest** por videollamada, cada uno en su computadora. ✅ 🆕 **Con Firebase Realtime Database (27/10/2026, decidido por Alejandro: más estable que PeerJS y nadie tiene que dejar su compu prendida como servidor).** Salas con código de 4 letras; el anfitrión resuelve cada paso y escribe el estado completo; cualquiera puede recargar y volver a su asiento. Hecho sobre la v0.13 (ya en `main`) y probado con dos navegadores y un Firebase falso (ver `docs/multijugador.md`). ❓ Falta la primera partida con el Firebase real. La versión anterior con servidor propio (rama `red/multijugador-salas`, sobre la v0.4) queda descartada.
38. ❓ 🆕 **Maravillas únicas (15.3):** ✅ nombres y efectos ya decididos; falta pasarlos al Excel, decidir si cuentan como «nivel 5» para la victoria tecnológica, y confirmar las propuestas 💡 (empate, no demoler, anuncio de la obra).
39. ✅ 🆕 **Ingenieros automáticos (15.2):** ya están en el juego (v0.14) y los pobladores también construyen solos. Quedan ❓ confirmar jugando el costo real de construir, las cifras 💡 de *Gremios de ingenieros* y *Grandes obras*, (los textos nuevos de esas cinco tecnologías ya están en `Tecnologias_v0.2.xlsx`).
40. ✅ 🆕 **Botín (sección 15):** toda la comida y la producción guardadas, más los civiles capturados, al ganar el control por conquista o anexión. Ya funciona así en el juego.
41. ❓ 🆕 **Villas francas (13.3):** segunda villa en los mapas de 2 jugadores, y confirmar que solo cuenten las tropas.
42. ❓ 🆕 **Subasta (13.3):** qué se ofrece, cuánta pista se da y con cuánta anticipación se anuncia.
43. ❓ 🆕 **Tribus amigas (13.3 y 12):** lista de pedidos por oficio, niveles de relación y precio de anexión con la relación al máximo.
44. ❓ 🆕 **Historias (13.3):** argumentos, capítulos y recompensas.
45. ❓ 🆕 **Rasgos de las personas (5.4):** ✅ fases A y B hechas. Falta la fase C (Salud y Fuerza en combate), confirmar jugando las probabilidades y el ±25 %, y mostrar los rasgos en el mapa y el resumen de la zona.

---

## 21. Plan por capas (para no ahogarse)

- **Capa 1:** población, comida, crecimiento, zonas básica y agrícola, soldado básico, movimiento, combate con dados, victoria simple, fantasmas.
- **Capa 2:** resto de especializaciones, armas y tipos de unidad, tribus como guarniciones, capturas.
- **Capa 3:** edificios, tecnologías y su intercambio, eventos, tributos, comercio, recursos especiales.

**Siguientes pasos sugeridos:** probar el prototipo jugable (sección 23) → corregir lo que se sienta pesado o confuso → armar `config` con las tablas → `resolver_combate` con pytest en Python → primera partida en mesa o en línea con la familia.

---

## 22. Qué falta por diseñar o mejorar (análisis)

**Prioridad alta**

1. **Riesgo de complejidad frente al objetivo original.** La meta era recuperar la sencillez de planificar con presión de tiempo y sin el micromanagement de un RTS. Hoy el juego tiene 7 condiciones de victoria, 6 terrenos, 10 edificios con niveles, 8 tipos de unidades, eventos, tribus, fantasmas y un árbol de cientos de tecnologías. Cada una tiene sentido, pero juntas pueden volver cada paso un trabajo grande. La forma de controlarlo es medir (órdenes por paso, tiempo de decisión) y construir por capas.
2. **Prototipo mínimo.** 💡 Capa 1 con 3 jugadores en el mapa **Anillo**, solo comida y población, soldado básico, mover, paz o ataque y victoria por controlar 2 capitales. Sin tecnologías, edificios ni eventos. Si ese núcleo es divertido, el resto es sabor.
3. **Interfaz de órdenes.** Cómo se dan muchas órdenes en poco tiempo: seleccionar varias unidades, repetir órdenes automáticas, plantillas de producción y botón "Listo". Es lo que decide si se siente como RTS.
4. **Resolución de movimientos simultáneos.** Falta definir con precisión qué pasa cuando dos ejércitos se cruzan en una frontera, cuando dos grupos llegan a una zona vacía a la vez, o cuando alguien se retira mientras otro avanza.
5. **Línea base económica.** Comprobar con números que el inicio (4 personas, 10 de cada recurso) no se atasca ni se desborda: consumo de comida, crecimiento, costo de especializar.
6. **Telemetría y pruebas sin límite de tiempo** (sección 19.2), para decidir el reloj con datos.

**Prioridad media**

7. **Jugadores lentos o desconectados** y **bots** para completar partidas y probar a solas. Los bots también sirven para el simulador.
8. **Qué ve cada jugador y cuándo:** mapa abierto, progreso de victoria público, eventos anunciados.
9. **Tutorial por capas**, para que un primo nuevo entienda el juego en 5 minutos.
10. **Reglas ambiguas por cerrar** (sección 20).
11. **Guardado, reconexión y salas** para jugar en línea con familia.

**Prioridad baja**

12. **Nombre del juego**: provisional, *Los Pasos del Imperio* (otras opciones consideradas: Compás de Aldeas, Pueblo a Pueblo, Hogar y Corona). Música, sonidos y animaciones pendientes.
13. **Accesibilidad:** colores para daltónicos (el atlas ya usa letras), tamaño de texto, idioma.
14. **Modos extra:** más de 4 jugadores, mapas aleatorios simétricos.

---

## 23. Prototipo jugable (v0.13) y repositorio

🆕 **El prototipo ya no es un solo archivo.** Vive en el repositorio **github.com/Alejandroinfo/Imperial-steps**, organizado en capas: `js/datos` (mapas y tecnologías), `js/config` (números de balance), `js/motor` (reglas, sin nada de pantalla) y `js/interfaz` (lo que se ve). Se abre con `index.html`, sin instalar nada. Para compartirlo en un solo archivo: `python herramientas/empaquetar.py` → `dist/Los_Pasos_del_Imperio.html`.

**Pruebas automáticas** (`npm test`): `pruebas/revisar_capas.js` (el motor no toca la pantalla), `pruebas/probar_reglas.js` (37 casos concretos de reglas) y `pruebas/simular_partidas.js` (72 partidas entre bots en los 12 mapas, sin errores). 🆕 **Tipos** (`npm run check`): el motor se revisa con TypeScript a partir de `js/tipos.d.ts` (partida, zona, unidad, jugador, órdenes, encuentro), sin paso de compilación.

**Qué es:** una versión jugable con casi todo lo diseñado. Juegas contra 1 a 3 bots en cualquiera de los **12 mapas**, para **2, 3 o 4 jugadores**. El paso avanza cuando todos están listos, sin reloj.

### 23.1 Cambios de la sesión del 26 de octubre de 2026 (v0.3 → v0.13)

**Interfaz**
- Las opciones de partida nueva están en una ventana al empezar y en el **Menú**, no en pantalla mientras juegas.
- El **turno** (paso, jugadores listos, recursos y ¡Listo!) está en la barra superior.
- **Tecnologías** en subpestañas: Disponibles (solo las que puedes empezar, con filtro por tipo), En curso, Mías y Todas.
- **Tecnologías recomendadas y por color:** arriba, «⭐ Te ayudan ahora» con las 3 o 4 que más aportan en tu situación; el resto, agrupado por rama con su color e ícono, en filas cortas con el impacto en íconos (la descripción aparece al pasar el mouse).
- **Menos texto, más íconos:** 🌾 comida, ⚒ producción, 🪙 oro y 🔬 ciencia en costos, encuentros, tributos, anexiones, entrenamiento y reservas; las personas ofrecidas se muestran con su figura.
- **Impacto de cada tecnología hoy:** una línea 💡 calcula con el motor tu próximo paso con y sin ella (ej.: con 3 agricultores, *Arado* → «🌾 +3 por paso»; *Molino de piedra* → «al mejorar tu Molino: 🌾 +2»). Si hoy no se nota, dice por qué («beneficia a los ingenieros: hoy no tienes ninguno»).
- **Zona:** nombre corto de una palabra (Adrianópolis, Saucedo, Brasca…), tu gente al lado del nombre y el terreno en una línea (su efecto se ve al pasar el mouse).
- **Resumen de zona nuevo:** comida neta del paso (lo producido menos lo que se come), reservas con barras, crecimiento con pasos hasta el próximo poblador, **quién trabaja y dónde** (oficio, edificio y lo que aporta cada uno), bonos de capital y de zona, tropas y de dónde vino la comida.
- **Mapa como valle continuo:** las zonas se tocan; entre dos zonas con camino hay una cerca baja y entre dos sin camino, un barranco con rocas. Alrededor, bosque espeso. Tus zonas llevan un tinte de tu color.
- **Placa de zona:** comida y producción con su tope, pasos hasta el próximo poblador y el **nivel de la zona** (I, II, III) en el emblema.
- **Figuras:** una por persona (hasta 6 por oficio, con «+N» si hay más), trabajando junto a su edificio (agricultores en el molino, constructores en la obra…).
- **Edificios en tarjetas** con dibujo, nombre, nivel y costo; al pasar el mouse se ve qué hacen y por qué no se pueden construir.
- **Sugerencias del paso:** una línea arriba del panel con avisos (hambre, tributos, eventos) e ideas (especializar científicos, poblar una zona libre, construir); al tocarla te lleva al lugar.
- **Tributos:** aviso rojo en el mapa y recuadro con botones de pago en la zona de la tribu.
- **Visor de batallas:** cada combate se puede repetir golpe por golpe, oleada por oleada en orden de iniciativa: quién ataca, dados, aciertos, defensa absorbida, caídos y heridos, y un resultado final. Se abre desde el aviso, la zona o el Historial.
- La partida empieza con tu capital elegida.
- **Comienzo guiado (v0.12, decidido por Alejandro: 20 pasos y luego partida normal):** partida en el mapa Anillo contra un bot. Una tarjeta sobre el mapa presenta un sistema por paso y resalta el botón exacto; cada objetivo se cumple al hacerlo y las etapas que dependen de la partida se pueden saltar. Pasos 1 a 5: oficios (2 agricultores y 1 científico), tecnología, Molino y un constructor (sin pobladores ni constructores las obras no avanzan), frontera y victoria, y expansión; 6 eventos; 7 oficio al nacer; 8 primer encuentro (siempre el mismo: refugiados); 9 crecer o guardar; 10 Cuartel; 11 cola de investigación; 12 recursos estratégicos; 13 tribus; 14 postura; 15 envíos automáticos; 16 soldados; 17 historial; 18 mejorar edificios; 19 combates; 20 despedida. Los encuentros sorpresa se activan al terminar.
- **Sonido y efectos:** sonidos generados por código (sin archivos): clic, ¡Listo!, resolución del paso, obras, tecnologías, monedas, nacimientos, combates golpe a golpe en el visor, conquistas, eventos buenos y malos, victoria y derrota; ambiente de viento y pájaros. Efectos nuevos: temblor en los combates, polvo al terminar una obra, destellos y confeti al ganar. Se controlan en el Menú (sonido, volumen, ambiente).

**Reglas** (detalle en cada sección): licenciar tropas (5.2), capital +2 (7), almacén 10 × tamaño y alimentación automática (8), equipo con costo y recuperable (9), postura entre jugadores (11), científicos automáticos (14.0), construir en el nivel máximo con especialización y segundo edificio del mismo tipo (15).

**Errores corregidos:** los botones «Ir» aparecían en todas las zonas; *Reservistas* figuraba como simulada pero no hacía nada; al repartir trabajadores entre varios edificios se podía saltar a una persona o dejar a otra en dos lugares.

### 23.2 Qué todavía NO tiene efecto simulado
19 de las 203 tecnologías aparecen como «aún sin efecto»: Embajadas comerciales, Exportaciones, Intercambio académico, Espionaje científico, Atajo del sabio, Enciclopedia, Embajadores, Aliados de ultratumba, Tratados de paz, Cultura tribal, Maestros de la paz, Censo, Mercenarios, Jinetes veloces, Exploradores, Contraespionaje, Caballos de carga, Guerra relámpago e Intimidación. Se pueden investigar (cuentan para la columna vertebral y los mínimos), pero no hacen nada.

### 23.3 Simplificaciones
- Los oponentes son bots sencillos: investigan, especializan, construyen, entrenan, anexan, se ponen en Alerta con quien tiene tropas cerca y a veces atacan.
- Algunas especializaciones de edificio no tienen efecto propio (Camino civil y militar; Hospital civil I y militar I).
- El tributo exigido es siempre 6 del recurso de la tribu.
- Un solo jugador humano.

### 23.4 Lo que muestran las simulaciones entre bots
- El motor no tiene errores ni cantidades inválidas en los 12 mapas con 2, 3 y 4 jugadores.
- 🆕 Antes de los cambios de hoy, en modo prueba se ganaba casi siempre por **Comercial + Desarrollo**. Después de bajar la capital a +2 y encarecer el equipo, casi nadie gana antes del paso 60 (pendiente 28).

### 23.5 Reglas decididas que el prototipo todavía no tiene (🆕 27/10/2026)

- **Maravillas únicas** ligadas a las ramas (15.3).
- ~~**Botín** al conquistar (sección 15).~~ Ya funciona: las reservas y los civiles capturados pasan al nuevo dueño.
- **Villas francas** (nombre nuevo, solo tropas, segunda villa en mapas de 2), **subastas**, **encuentros de elegir entre dos**, **pedidos de las tribus y anexión por relación**, **guerra con las tribus** e **historias** (13.3 y 12).
- ~~**Ingenieros automáticos** y fusión de constructores en ingenieros (15.2).~~ ✅ **Hecho en v0.14 (27/10/2026):** 5 oficios, obras automáticas, la zona Industrial se fusiona con la de Producción y los números nuevos están en `js/config/efectos_tecnologias.js`.
- Al pasarlo al código hay que mover también los números a `js/config/`. (Las tecnologías de 15.2 ya se retocaron.)

### 23.6 Cambios del 27 de octubre de 2026 (v0.14)

- **Ingenieros automáticos (15.2):** desaparece el constructor (5 oficios civiles) y la zona Industrial; las obras se construyen solas con la producción guardada; los pobladores también construyen si hay obra. La zona muestra «N construyen: obra (x %)». El tutorial del paso 3 ahora pide un ingeniero (opcional).
- **Tecnologías:** textos de *Cuadrillas de obra*, *Línea de ensamblaje*, *Logística de obra*, *Gremios de ingenieros* y *Grandes obras* (ver 15.2). Ya están pasados al Excel.
- **Error corregido:** un jugador podía anexar dos tribus en el mismo paso pagando más ciencia de la que tenía y quedaba con ciencia negativa (la comprobación se hacía antes de cobrar la primera).
- **Pruebas:** 9 casos nuevos de obras automáticas, tecnologías y oficios, y 1 de la doble anexión.
- **Reparto entre producir y construir (27/10/2026):** se parte de lo guardado, y si la cuenta queda en negativo producen primero los que mejor producen; con igual eficiencia, mitad y mitad (15.2).
- **Pausa de obras por zona** (botón ⏸ junto a la obra) y «⏸ Pausar crecimiento» junto a Crecer (15.2 y 8).
- **La comida que se mueve de otra zona cuesta oro** (8). Con 48 partidas de bots las muertes por hambre no empeoran (425 contra 457 antes), pero conviene confirmarlo jugando.
- **Pruebas:** 4 casos nuevos (pausa, acumulación con pausa, cobro de oro, hambre sin oro) y 3 del reparto mitad y mitad.
- **Rasgos de las personas (fases A y B, 5.4):** identificador y 2 rasgos por civil, producción, ciencia, oro y comida por persona, elegir a quién especializar (tocar o arrastrar), fichas con íconos y bordes en Población. 11 casos de prueba nuevos.
