# Los Pasos del Imperio

🇬🇧 [Read in English](README.md) · ▶ [Jugar en el navegador](https://alejandroinfo.github.io/Imperial-steps/)

Juego de estrategia por turnos simultáneos para jugar en línea con la familia. Todos planean **a la vez**; cuando todos presionan **¡Listo!**, el paso se resuelve y se ve qué pasó. La idea es recuperar la diversión de planificar en grupo con presión de tiempo, sin el micromanagement de un juego de estrategia en tiempo real.

> **Estado:** prototipo jugable v0.13 en el navegador, contra 1 a 3 bots o en línea con 2 a 4 personas. El diseño de reglas está bastante cerrado; el motor definitivo se pasará a Python.

## Cómo jugarlo

No hace falta instalar nada. Descarga el repositorio y abre `index.html` en el navegador (Chrome, Firefox o Edge). Para mandarlo en un solo archivo, corre `python herramientas/empaquetar.py` y comparte `dist/Los_Pasos_del_Imperio.html`. Elige mapa, número de jugadores y modo de victoria, y presiona **Empezar**. La **📖 Guía** dentro del juego explica cada sistema.

## Jugar en línea

Una persona abre **🌐 Jugar en línea…**, crea una sala y comparte el código de 4 letras o el enlace. Pueden entrar de 2 a 4 personas; los asientos libres los juega un bot. El navegador del anfitrión corre el motor y, cuando todos dan **¡Listo!**, resuelve el paso y publica el estado completo con **Firebase Realtime Database**: todas las pantallas quedan iguales y cualquiera puede recargar y volver a su asiento. Hace falta abrir el juego desde una dirección web (no con doble clic) y configurar Firebase una sola vez, unos 10 minutos. La guía paso a paso está en [`docs/multijugador.md`](docs/multijugador.md).

## Cómo probar el motor

El motor no depende del navegador, así que se puede probar solo con [Node.js](https://nodejs.org) (versión 18 o más nueva):

```bash
npm test                                   # capas + reglas + estado en red + 12 mapas × 2, 3 y 4 jugadores
node pruebas/simular_partidas.js 10 80     # 10 semillas por combinación, hasta 80 pasos
```

`pruebas/revisar_capas.js` comprueba que el motor no use nada de la pantalla. `pruebas/probar_reglas.js` arma situaciones pequeñas y revisa que cada regla dé el resultado esperado (por ejemplo, cuántos científicos investigan con la ciencia guardada). `pruebas/probar_red.js` comprueba que el estado de una partida, mandado por la red y reconstruido, siga idéntico al original. `pruebas/simular_partidas.js` hace jugar a los bots entre sí en todos los mapas, revisa después de cada paso que no aparezcan cantidades imposibles (negativas o no numéricas) y resume con qué condiciones se ganó. Las pruebas corren en GitHub Actions con cada cambio.

## Cómo está organizado

```
index.html                  Estructura de la página; carga los estilos y los scripts en orden
css/estilos.css             Todo el aspecto visual
js/
  datos/                    Datos puros, sin lógica
    mapas.js                Los 12 mapas para 2, 3 y 4 jugadores (zonas y caminos)
    tecnologias.js          Las 192 tecnologías y las 12 ramas
  config/                   Números de balance: cambiarlos cambia el juego sin tocar el motor
    reglas.js               Unidades, costos, terrenos, edificios, recursos y eventos
    efectos_tecnologias.js  Qué hace cada tecnología
  motor/                    Reglas del juego; no sabe nada de la pantalla
    estado.js               Azar con semilla y ayudantes del estado
    partida.js              Crear una partida nueva
    resolver_paso.js        resolveStep(estado, órdenes): aplica un paso completo
    eventos.js              Eventos y tribus
    economia.js             Producción, crecimiento, hambre y curación
    combate.js              Combate por oleadas de iniciativa
    victoria.js             Eliminación y condiciones de victoria
    bots.js                 Jugadores automáticos
  interfaz/                 Todo lo que se ve y se toca
    mapa/territorio.js      Mapa, cámara, minimapa y flechas de órdenes
    dibujo/                 Piezas SVG del terreno, edificios y personajes
    paneles/                Panel lateral: zona, imperio, tecnologías, victoria, órdenes
    animaciones.js          Lo que se anima al resolver un paso
    guia.js                 Guía tipo wiki
    sugerencias.js          Avisos y consejos del paso (hambre, tributos, eventos, qué hacer ahora)
    batalla.js              Visor de batallas golpe por golpe
    acciones.js             Convierte los botones en órdenes
    flujo.js                Empezar, ¡Listo!, resolver y fin de partida
    render.js               Redibuja el estado actual
  red/
    multijugador.js         Salas en línea: el anfitrión resuelve y publica el estado con Firebase
    config_firebase.js      Datos del proyecto de Firebase
  main.js                   Punto de entrada
firebase/
  reglas_base_datos.json    Reglas de seguridad de la base de datos
pruebas/
  revisar_capas.js          Comprueba que datos, config y motor no dependan de la interfaz
  probar_reglas.js          Casos concretos de cada regla (almacén, científicos, comida, equipo, edificios)
  simular_partidas.js       Partidas entre bots sin navegador
  probar_red.js             El estado mandado por la red sigue idéntico al original
  probar_en_linea.py        Partida en línea con dos navegadores y un Firebase falso
herramientas/
  empaquetar.py             Junta todo en un solo HTML para mandarlo a la familia
docs/
  Reglas_v0.1.md            Fuente de verdad de las reglas (✅ decidido, 💡 propuesta, ❓ por definir)
  TRASPASO_Los_Pasos_del_Imperio.md   Resumen para retomar el proyecto en 10 minutos
  Como_manejar_el_proyecto.md         Cómo trabajamos
  multijugador.md           Jugar en línea: configurar Firebase, publicar y jugar
Tecnologias_v0.2.xlsx       Catálogo de tecnologías con valoración y riesgo de balance
atlas_mapas.html            Atlas visual de los 12 mapas (selector de 2, 3 o 4 jugadores)
```

La regla de dependencias es simple: `datos` → `config` → `motor` → `interfaz`. Cada capa puede usar las anteriores, nunca las siguientes. Por eso la prueba del motor carga solo las tres primeras carpetas.

Los archivos se cargan con `<script>` normales, en el orden de `index.html`, para que el juego se abra con doble clic sin servidor.

## Cómo funciona un paso

1. Cada jugador da órdenes (especializar, construir, investigar, entrenar, mover, anexar…). Lo que no cambia sigue como estaba.
2. Cuando todos presionan ¡Listo!, `resolveStep` aplica en orden: nacimientos, evento, órdenes, movimientos, combates, control de zonas, economía y victoria.
3. La interfaz anima lo que pasó y empieza el paso siguiente.

El azar usa una semilla (`?seed=123` en la dirección del navegador), así que una partida se puede repetir exactamente igual.

## Decisiones de diseño

| Decisión | Por qué |
|---|---|
| Turnos simultáneos con botón ¡Listo! | La tensión viene de decidir bajo presión, no de la destreza con el mouse |
| Sin reloj en las primeras pruebas | Primero se mide cuánto tarda la gente; el juego registra tiempo hasta ¡Listo! y órdenes por paso |
| Civiles capturados en vez de muertos | Frena la bola de nieve del que va ganando |
| Lo repetitivo es automático (comida, científicos) | Las decisiones del paso son las interesantes, no el mantenimiento |
| Ganar con 2 de 7 condiciones a la vez | Hay caminos pacíficos, agresivos y mixtos, y los rivales ven el avance y pueden reaccionar |
| Motor separado de la interfaz | Se puede simular y probar sin pantalla, y luego pasar a Python con las mismas reglas |
| Números en tablas de configuración | Balancear sin reescribir el motor |

La lista completa está en [`docs/TRASPASO_Los_Pasos_del_Imperio.md`](docs/TRASPASO_Los_Pasos_del_Imperio.md).

## Qué sigue

1. Jugarlo con la familia y decidir qué se siente pesado.
2. Pasar el motor a **Python** con `pytest` y un simulador de balance de miles de partidas.
3. ~~Multijugador en línea~~ ✅ hecho con Firebase (salas con código y reconexión); falta la primera partida real con la familia.

## Equipo

Diseño y desarrollo de **Alejandro**. Cómo colaborar: [`CONTRIBUTING.es.md`](CONTRIBUTING.es.md).
