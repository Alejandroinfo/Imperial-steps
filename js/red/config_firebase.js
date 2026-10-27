'use strict';
// Datos del proyecto de Firebase para jugar en línea (ver docs/multijugador.md).
// Se copian de: Consola de Firebase → ⚙ Configuración del proyecto → Tus apps → app web → «Configuración del SDK».
// No son una contraseña: solo dicen a qué proyecto conectarse. Lo que protege la sala son las reglas
// de la base de datos (firebase/reglas_base_datos.json) y el acceso anónimo de Authentication.
// Mientras diga PEGAR_AQUI, el juego funciona igual, pero solo contra bots.
const FIREBASE_CONFIG = {
  apiKey: 'PEGAR_AQUI',
  authDomain: 'PEGAR_AQUI.firebaseapp.com',
  databaseURL: 'https://PEGAR_AQUI-default-rtdb.firebaseio.com',
  projectId: 'PEGAR_AQUI',
  appId: 'PEGAR_AQUI'
};
