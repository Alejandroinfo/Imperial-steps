# Prueba de rendimiento del mapa (¿conviene migrar a PixiJS?)

Experimento para decidir con datos, en los aparatos reales de la familia, si vale la pena rehacer el dibujo del mapa con PixiJS (GPU) en vez de seguir con SVG. **No cambia el juego normal**: solo existe con `?bench=1`.

## Cómo correrla

1. Dentro del juego, abre el **Menú → 🧪 Prueba de rendimiento**. (O abre el juego con `?bench=1&seed=7` al final del enlace.) Por ejemplo: `https://alejandroinfo.github.io/Imperial-steps/?bench=1&seed=7` (la semilla fija hace que todos midan el mismo mapa).
2. Aparece un panel arriba a la izquierda (si en su lugar sale un aviso rojo, es que falta subir al sitio la carpeta `vendor/` o `js/interfaz/bench.js`). Elige la resolución del fondo de Pixi (1,5× por defecto; 2× se ve más nítido pero pesa más memoria) y toca **▶ Medir todo**.
3. Tarda unos 40 segundos. **No toques nada** mientras corre; deja la pantalla encendida y cierra otras apps.
4. Toca **📋 Copiar resultados** y pégalos en el chat (o saca una captura).
5. Repite en cada aparato: tu compu, tu celular y, sobre todo, **el aparato más lento de la familia**.

## Qué mide

Cada variante dibuja el mismo valle (con las mismas zonas, figuras y textos) y se mide 3 s quieta y 3 s con la cámara moviéndose y acercando:

1. **SVG actual, efectos completos** (como se juega hoy).
2. **SVG actual, efectos ligeros** (el modo del teléfono).
3. **SVG en dos capas, cámara CSS**: el fondo (árboles, ríos, caminos) queda en una capa que no se repinta y solo la capa de zonas, figuras y nubes se anima. Es la mejora barata: no cambia la tecnología.
4. **PixiJS**: el fondo y las zonas son una textura en la GPU; figuras, textos, nubes y motas son objetos que se mueven con transformaciones.

## Cómo leer los números

- **cuadros/s** (fps): 60 es lo ideal; menos de 30 se siente a tirones.
- **p95 (ms)**: el tiempo que tarda el 95 % de los cuadros; si pasa de 33 ms se nota.
- **tirones**: cuadros que tardaron más de 50 ms.
- **texturas (MB)**: memoria de GPU que usa Pixi. Es el **costo** de Pixi: un teléfono flojo puede quedarse sin memoria. A 1,5× son unos 61 MB; a 2× unos 108 MB; a 1×, unos 27 MB.

**Regla para decidir** (propuesta mía, ajustable): migrar a Pixi si en el aparato más lento gana **al menos 1,5 veces** en cuadros por segundo a la mejor variante de SVG y no se queda sin memoria; si la variante 3 ya alcanza 30 cuadros/s o más, es mejor quedarse con SVG en capas (mucho menos trabajo y sin riesgo visual).

## Limitaciones del prototipo (a tener en cuenta)

- El fondo y las zonas son una **textura fija** (una foto del mapa). En el juego real cada zona tendría que volver a rasterizarse cuando cambie (construcción, dueño), y el zoom mostrará algo menos de nitidez que el SVG, que es vectorial. Cuanto mayor la resolución, mayor la memoria.
- Las figuras solo se mecen y las motas suben: no caminan como en el pueblo vivo.
- No se midió con tarjeta gráfica real en el entorno de desarrollo (el navegador de pruebas usa gráficos por software), así que **solo cuentan las cifras de aparatos reales**.
- Pixi (`vendor/pixi.min.js`, versión 8.22, licencia MIT) solo se carga con `?bench=1`.
