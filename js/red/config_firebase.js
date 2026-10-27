'use strict';
// Datos del proyecto de Firebase para jugar en línea (ver docs/multijugador.md).
// Se copian de: Consola de Firebase → ⚙ Configuración del proyecto → Tus apps → app web → «Configuración del SDK».
// No son una contraseña: solo dicen a qué proyecto conectarse. Lo que protege la sala son las reglas
// de la base de datos (firebase/reglas_base_datos.json) y el acceso anónimo de Authentication.
// Mientras diga PEGAR_AQUI, el juego funciona igual, pero solo contra bots.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXrqr4wSe4QSowTuE6_v6f7vav_FjVv2I",
  authDomain: "empire-steps.firebaseapp.com",
  projectId: "empire-steps",
  storageBucket: "empire-steps.firebasestorage.app",
  messagingSenderId: "1070514885360",
  appId: "1:1070514885360:web:e7fbb4182aee8f03cc2835",
  measurementId: "G-JF4Q0W6WQ7"
};
