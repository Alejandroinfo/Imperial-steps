# Los Pasos del Imperio

Juego de estrategia por turnos simultáneos para jugar en línea con la familia. Todos planean **a la vez**; cuando todos presionan **¡Listo!**, el paso se resuelve y se ve qué pasó. La idea es recuperar la diversión de planificar en grupo con presión de tiempo, sin el micromanagement de un juego de estrategia en tiempo real.

> **Estado:** prototipo jugable v0.3 en el navegador (una persona contra 1 a 3 bots). El diseño de reglas está bastante cerrado; el motor definitivo se pasará a Python.

## Cómo jugarlo

No hace falta instalar nada. Descarga el repositorio y abre `index.html` en el navegador (Chrome, Firefox o Edge). Elige mapa, número de jugadores y modo de victoria, y presiona **Empezar**. La **📖 Guía** dentro del juego explica cada sistema.

## Cómo probar el motor

El motor no depende del navegador, así que se puede probar solo con [Node.js](https://nodejs.org) (versión 18 o más nueva):

```bash
npm test                                   # 12 mapas × 2, 3 y 4 jugadores
node pruebas/simular_partidas.js 10 80     # 10 semillas por combinación, hasta 80 pasos
```

La prueba hace jugar a los bots entre sí en todos los mapas, revisa después de cada paso que no aparezcan cantidades imposibles (negativas o no numéricas) y resume con qué condiciones se ganó. La misma prueba corre en GitHub Actions con cada cambio.

## Cómo está organizado

```
index.html                  Estructura de la página; carga los estilos y los scripts en orden
css/estilos.css             Todo el aspecto visual
js/
  datos/                    Datos puros, sin lógica
    mapas.js                Los 12 mapas para 2, 3 y 4 jugadores (zonas y caminos)
    tecnologias.js          Las 203 tecnologías y las 12 ramas
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
    acciones.js             Convierte los botones en órdenes
    flujo.js                Empezar, ¡Listo!, resolver y fin de partida
    render.js               Redibuja el estado actual
  main.js                   Punto de entrada
pruebas/
  simular_partidas.js       Partidas entre bots sin navegador
herramientas/
  atlas_mapas.html          Atlas visual de los 12 mapas (selector de 2, 3 o 4 jugadores)
docs/
  Reglas_v0.1.md            Fuente de verdad de las reglas (✅ decidido, 💡 propuesta, ❓ por definir)
  TRASPASO_Los_Pasos_del_Imperio.md   Resumen para retomar el proyecto en 10 minutos
  Como_manejar_el_proyecto.md         Cómo trabajamos
  Tecnologias_v0.2.xlsx     Catálogo de tecnologías con valoración y riesgo de balance
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
| Ganar con 2 de 7 condiciones a la vez | Hay caminos pacíficos, agresivos y mixtos, y los rivales ven el avance y pueden reaccionar |
| Motor separado de la interfaz | Se puede simular y probar sin pantalla, y luego pasar a Python con las mismas reglas |
| Números en tablas de configuración | Balancear sin reescribir el motor |

La lista completa está en [`docs/TRASPASO_Los_Pasos_del_Imperio.md`](docs/TRASPASO_Los_Pasos_del_Imperio.md).

## Qué sigue

1. Jugarlo con la familia y decidir qué se siente pesado.
2. Pasar el motor a **Python** con `pytest` y un simulador de balance de miles de partidas.
3. Multijugador real con **FastAPI + WebSockets** (salas con código y reconexión).

## Equipo

Diseño de **Pao** (idea inicial) y **Alejandro**. Cómo colaborar: [`CONTRIBUTING.md`](CONTRIBUTING.md).
