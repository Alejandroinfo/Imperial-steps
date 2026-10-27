# Música y sonido

## Cómo suena el juego

- **Efectos y ambiente (viento y pájaros):** generados por código con Web Audio, sin archivos (`js/interfaz/sonido.js`).
- **Música:** archivos MP3 en `audio/`, que se reproducen con elementos `<audio>`. Si faltan, el juego funciona igual, sin música.
  - **Menú:** `menu.mp3`.
  - **Planificación:** `plan_1.mp3` y `plan_2.mp3`, que se turnan con un cruce de 2 s.
  - **Visor de batalla:** `combate.mp3`, en bucle con cruce. Al cerrar el visor vuelve la planificación.
  - **Remates:** `resolucion.mp3` al resolverse cada paso, `victoria.mp3` al ganar y `derrota.mp3` al perder (todavía no existe: el juego lo omite).
- **Controles** (Menú): música con volumen propio (30 % por defecto, porque se juega en videollamada), recordado en el navegador.
- La música baja sola mientras suena un remate y se pausa si la pestaña no está visible.
- Al abrir el HTML único (`dist/`) la música solo suena si la carpeta `audio/` está a su lado.

## Origen y licencia (27/10/2026)

Las 6 pistas se generaron con **Suno, plan gratis** (cuenta de Alejandro). Ese plan da uso **personal y no comercial**, y Suno conserva la propiedad de las canciones. Las pistas del repositorio son versiones recomprimidas (MP3 de 64 kbps, normalizadas y recortadas) de las originales:

| Archivo | Original | Notas |
|---|---|---|
| `menu.mp3` | Symphonie des Civilisations | |
| `plan_1.mp3` | Thoughtful Anticipation | se comprimió su rango dinámico |
| `plan_2.mp3` | Bienvenue dans l'Aventure | |
| `combate.mp3` | Pulse of the Battle | |
| `resolucion.mp3` | Rising Urgency | recortada: solo el golpe final |
| `victoria.mp3` | Triumphal Fanfare | |

⚠ **No se pueden reutilizar fuera de este proyecto personal sin fines de lucro.** Decisión de Alejandro (B): se dejan en el repositorio con crédito a Suno, asumiendo el pequeño riesgo de que la licencia gratuita no cubra redistribuirlas. Para publicarlas sin dudas: suscribirse a Suno Pro, regenerar y descargar las pistas **con la suscripción activa** (guardar los recibos) o usar música CC0. Conviene guardar copia de las pistas originales: las descargas del plan gratis están muy limitadas desde el 3 de septiembre de 2026.

## Pendiente

- `derrota.mp3` y, si se quiere, una tercera variante de planificación (prompts en el plan de sonido).
- 3 o 4 efectos realistas CC0 (espadas, martillazos): anotar aquí origen y licencia de cada uno.
