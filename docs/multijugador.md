# Jugar en línea (Firebase)

Este documento explica cómo funciona el multijugador, cómo conectar el juego con Firebase una sola vez y cómo se juega. ✅ Decidido por Alejandro (27/10/2026): el multijugador usa **Firebase Realtime Database**, en lugar de un servidor propio o de PeerJS.

## Cómo funciona

- Una persona crea una **sala** y recibe un código de 4 letras y un enlace. Los demás entran con el código o el enlace. Juegan de 2 a 4 personas; los asientos libres los juega un bot.
- Quien crea la sala es el **anfitrión**. Su navegador corre el motor como siempre, también los bots. Los demás planean y, al dar **¡Listo!**, escriben sus órdenes en la sala.
- Cuando todos están listos, el anfitrión resuelve el paso y escribe el **estado completo** de la partida, que les llega a todos al instante. Como solo una pantalla resuelve, nadie se desincroniza.
- Firebase guarda el último paso. Si alguien recarga la página o se le corta internet, vuelve solo a su asiento, también el anfitrión. 🆕 Si cierra el navegador (o cambia de aparato), vuelve entrando a la sala con **el mismo nombre**: recupera su asiento si está desconectado. Nadie puede quitarle el asiento a alguien que sigue conectado. Lo único que no puede pasar es que el anfitrión cierre la pestaña **para siempre**: sin él, nadie resuelve los pasos.
- Contra bots, el juego no necesita internet ni Firebase: Firebase se carga solo al usar «Jugar en línea».

## Configurar Firebase (una sola vez, unos 10 minutos)

Todo se hace en la [consola de Firebase](https://console.firebase.google.com) con la cuenta de Google. El plan gratuito (Spark) alcanza de sobra: si algún día se pasara de sus límites, Firebase apaga el servicio hasta el mes siguiente en lugar de cobrar.

1. **Crear el proyecto.** «Crear un proyecto» → un nombre (por ejemplo, `pasos-del-imperio`). Google Analytics no hace falta.
2. **Registrar la app web.** En la página del proyecto, el ícono **`</>`** (Web) → un apodo → «Registrar app». Firebase Hosting no hace falta en este paso.
3. **Crear la base de datos.** Menú → Compilación → **Realtime Database** → «Crear base de datos» → una ubicación → empezar en **modo bloqueado**.
4. **Pegar las reglas.** En Realtime Database, pestaña **Reglas**: borrar lo que haya, pegar el contenido de `firebase/reglas_base_datos.json` y presionar **Publicar**. 🆕 Cada vez que cambie ese archivo hay que volver a pegarlo y publicarlo. Las reglas hacen que solo puedan entrar personas con el juego abierto, que cada quien escriba solo sus propias órdenes y que solo el anfitrión escriba el resultado de cada paso.
5. **Activar el acceso anónimo.** Menú → Compilación → **Authentication** → «Comenzar» → pestaña «Método de acceso» → **Anónimo** → Habilitar → Guardar. Así nadie tiene que crear una cuenta ni escribir una contraseña.
6. **Copiar la configuración al juego.** ⚙ Configuración del proyecto → «Tus apps» → la app web → «Configuración del SDK» → opción **Config**. Copiar los valores a `js/red/config_firebase.js`, reemplazando cada `PEGAR_AQUI`. Si no aparece `databaseURL`, se copia la dirección que muestra arriba la página de Realtime Database (empieza con `https://` y termina en `firebaseio.com` o `firebasedatabase.app`).
7. **Autorizar la dirección donde se publique el juego.** Authentication → Configuración → **Dominios autorizados** → «Agregar dominio» (por ejemplo, `pasos-del-imperio.pages.dev`). `localhost` ya viene autorizado, para probar en la propia compu.

Los datos de `config_firebase.js` **no son una contraseña**: solo dicen a qué proyecto conectarse y viajan a cada navegador que abre el juego. Lo que protege las salas son las reglas del paso 4 y el acceso anónimo del paso 5.

## Publicar el juego

Para jugar en línea, el juego tiene que abrirse desde una dirección web (`https://…`): con doble clic sobre el archivo solo se juega contra bots, porque Firebase no acepta conexiones desde archivos locales.

- 💡 **Lo más simple: Cloudflare Pages, subiendo los archivos.** Es gratis y no tiene límite de visitas para un sitio como este. En Cloudflare: Workers & Pages → crear un proyecto de Pages → la opción de subir archivos → subir una carpeta con el juego empaquetado renombrado como `index.html`. Cloudflare da una dirección `https://….pages.dev`, que hay que autorizar en el paso 7.
- **Desde el repositorio:** Cloudflare Pages también puede publicar directo desde GitHub (incluso si el repositorio es privado) cada vez que se suben cambios.
- **Firebase Hosting** es otra opción dentro del mismo proyecto, pero necesita instalar la herramienta de línea de comandos de Firebase.

## Cómo se juega

1. El anfitrión abre el juego → **🌐 Jugar en línea…** → escribe su nombre → **Crear sala**.
2. Presiona **📋 Copiar enlace de invitación** y lo pega en la videollamada o en WhatsApp.
3. Los demás abren el enlace: solo escriben su nombre y presionan **Entrar a la sala**.
4. El anfitrión elige mapa, número de jugadores y victoria → **Empezar partida**.
5. Cada paso, todos planean y dan **¡Listo!**. El paso avanza cuando están todos.

## Límites y cuidados

- Hasta **4 jugadores** (son los mapas que hay). El plan gratuito de Realtime Database permite 100 conexiones a la vez, así que la red no es el límite.
- Cada paso pesa unos 20 a 30 KB. El plan gratuito guarda 1 GB: alcanza para miles de partidas. De vez en cuando se pueden borrar salas viejas desde la consola (Realtime Database → Datos → `salas`).
- Una sala sirve para **una partida**. Para jugar otra, se crea una sala nueva.
- Cada pestaña es una persona distinta. Para probar solo, se pueden abrir dos pestañas o dos navegadores.

## Para quien programa

- `js/red/multijugador.js`: salas, presencia, órdenes y estado. Carga el SDK compat 13.1.0 desde el CDN de Firebase solo cuando hace falta.
- `js/red/config_firebase.js`: los datos del proyecto.
- `firebase/reglas_base_datos.json`: reglas de seguridad de la base de datos.
- Cambios chicos en el resto: `mulberry32` expone `state()` para mandar el azar por la red (`js/motor/estado.js`); `ME` pasa de `const` a `let` (`js/interfaz/formularios.js`); `startGame(cfg)`, `isBotSeat`, `isAuthority` y `setMyReady` en `js/interfaz/flujo.js`; ventana «Jugar en línea» en `index.html`. Sin sala, el juego funciona exactamente igual que antes.
- Pruebas: `node pruebas/probar_red.js` (el estado mandado por la red sigue idéntico al original, 18 casos) y `python pruebas/probar_en_linea.py` (partida con dos navegadores usando `pruebas/firebase_falso.js`, sin internet). ⚠ La prueba con dos navegadores usa un Firebase falso que no aplica las reglas de seguridad; la primera partida con el Firebase real es la prueba que falta.

## Texto para el README (en inglés)

> ### Play online
> One player creates a room and shares a 4-letter code or link; 2–4 people can join, and empty seats are played by bots. The host's browser runs the engine and, once everyone presses **Ready**, resolves the step and publishes the full game state through **Firebase Realtime Database**, so every screen stays in sync and anyone can reload and rejoin their seat. Setup takes about 10 minutes: create a Firebase project, a Realtime Database with the rules in `firebase/reglas_base_datos.json`, enable anonymous sign-in, and fill in `js/red/config_firebase.js`. See `docs/multijugador.md` (in Spanish).
