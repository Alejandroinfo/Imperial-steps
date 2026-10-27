# Historias de 4 capítulos

Generado a partir de `js/motor/historias.js` (los costos y las ganancias de recursos crecen con la partida, como en los encuentros). Cada jugador vive una por partida: el capítulo 1 llega hacia el paso 10 y los demás cada 8 pasos. **Dejarlo pasar** no cuesta nada ni castiga; una opción que no te alcanza cuenta como dejarlo pasar. Cada opción lleva una marca de camino (entre paréntesis); el capítulo siguiente depende de la última marca y el final, de la que más tomaste.

## «La caravana perdida»  (caminos: C / T)

**Capítulo 1.** Una caravana de tierras lejanas quedó varada junto a tu territorio, con los carros rotos y poca comida.
- (C) **Repararles los carros** — cuesta ⚒ 6 → 🪙 +5
- (T) **Guiarlos con comida hasta la tribu vecina** — cuesta 🌾 5 → 🤝 +1 de relación con la tribu vecina

**Capítulo 2, si vienes del camino C.** Los mercaderes, agradecidos, ofrecen abrir negocio en tu zona.
- (C) **Darles un puesto en tu mercado** — cuesta 🪙 4 → 1 comerciante
- (T) **Pedirles que te presenten a la tribu vecina** — cuesta 🪙 3 → 🤝 +1 de relación con la tribu vecina

**Capítulo 2, si vienes del camino T.** La tribu vecina recibe a la caravana y su jefe quiere conocerte.
- (T) **Llevarle un regalo de comida** — cuesta 🌾 6 → 🤝 +1 de relación con la tribu vecina
- (C) **Proponerle un trato de comercio** — cuesta 🪙 4 → 🪙 +10

**Capítulo 3, si vienes del camino C.** La ruta comercial prospera y los mercaderes piden protección en el camino.
- (C) **Poner tropas a vigilarla** — cuesta 🪙 5 → 2 soldados
- (T) **Pagarle a la tribu para que la cuide** — cuesta 🪙 6 → 🤝 +1 de relación con la tribu vecina

**Capítulo 3, si vienes del camino T.** La tribu quiere que su gente aprenda los modos de comerciar de los forasteros.
- (T) **Enviarles un maestro** — cuesta 🌾 5 → 👶 +12 de crecimiento
- (C) **Abrirles tu mercado** — cuesta 🪙 4 → 1 comerciante

**Capítulo 4, final del camino C.** La gran ruta une tu imperio con tierras lejanas y todos quieren cerrar un último trato.
- **Aceptar su agradecimiento** — cuesta sin costo → 1 comerciante + 🪙 +30
- **Pedirles algo más grande** — cuesta 🪙 8 → 🪙 +20 + 💎 Sal durante 40 pasos

**Capítulo 4, final del camino T.** La tribu y los forasteros te proclaman amigo de los caminos.
- **Aceptar su agradecimiento** — cuesta sin costo → 🌾 +25 + 🤝 +1 de relación con la tribu vecina
- **Pedirles algo más grande** — cuesta 🪙 8 → 🌟 poblador extraordinario (Comercio +2, Agricultura +1)

## «El maestro del valle»  (caminos: S / O)

**Capítulo 1.** Un anciano maestro busca un lugar tranquilo donde enseñar lo que sabe.
- (S) **Darle una casa junto a la biblioteca** — cuesta 🌾 4 → 1 científico
- (O) **Ofrecerle un rincón en el taller** — cuesta ⚒ 5 → 1 ingeniero

**Capítulo 2, si vienes del camino S.** El maestro pide libros y tiempo para escribir su saber.
- (S) **Darle ciencia para sus estudios** — cuesta 🔬 4 → 🔬 +14
- (O) **Pedirle que enseñe a tus ingenieros** — cuesta 🌾 3 → 1 ingeniero + 👶 +8 de crecimiento

**Capítulo 2, si vienes del camino O.** El maestro quiere probar una herramienta nueva que ideó.
- (O) **Pagar el hierro necesario** — cuesta ⚒ 6 → ⚒ +16
- (S) **Pedirle que la explique por escrito** — cuesta 🪙 3 → 🔬 +10

**Capítulo 3, si vienes del camino S.** Sus alumnos más brillantes quieren seguirlo.
- (S) **Abrir una escuela** — cuesta 🌾 5 → 2 científicos
- (O) **Mandarlos a aprender oficios** — cuesta 🌾 4 → 2 ingenieros

**Capítulo 3, si vienes del camino O.** Los talleres del valle ya imitan sus herramientas.
- (O) **Cobrar por enseñar a los vecinos** — cuesta sin costo → 🪙 +12
- (S) **Registrar su método por escrito** — cuesta ⚒ 3 → 🔬 +12

**Capítulo 4, final del camino S.** El maestro, ya muy anciano, quiere dejarte lo mejor de su saber.
- **Aceptar su legado** — cuesta sin costo → 📜 una tecnología gratis (nivel ≤ 3)
- **Pedirle que forme a un discípulo** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ciencia +2, Ingeniería +1)

**Capítulo 4, final del camino O.** El maestro, ya muy anciano, quiere dejar sus herramientas a tu pueblo.
- **Aceptar su legado** — cuesta sin costo → 🏠 un Taller ya construido
- **Pedirle que forme a un discípulo** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +1)

## «El heredero sin trono»  (caminos: R / T)

**Capítulo 1.** Un joven noble exiliado llega a tus puertas pidiendo asilo, y lo persiguen hombres armados.
- (R) **Esconderlo y armar a tu gente** — cuesta ⚒ 5 → 1 soldado
- (T) **Ponerlo a trabajar como uno más** — cuesta 🌾 3 → 1 poblador
- (-) **Entregarlo a sus perseguidores** — cuesta sin costo → 🪙 +15

**Capítulo 2, si vienes del camino R.** Sus perseguidores acampan cerca y exigen que lo entregues.
- (R) **Poner tropas en la frontera** — cuesta 🪙 4 → 2 soldados
- (T) **Negociar con oro** — cuesta 🪙 8 → 👶 +12 de crecimiento

**Capítulo 2, si vienes del camino T.** El joven demuestra talento: organiza los almacenes y los repartos.
- (T) **Darle más responsabilidad** — cuesta 🌾 3 → ⚒ +12
- (R) **Pedirle que entrene a tus soldados** — cuesta ⚒ 4 → 2 arcos

**Capítulo 3, si vienes del camino R.** Un grupo de leales al joven llega con armas buscando a su señor.
- (R) **Acogerlos como guardia** — cuesta 🌾 6 → 2 escuderos
- (T) **Pedirles que se queden de obreros** — cuesta 🌾 4 → 2 ingenieros

**Capítulo 3, si vienes del camino T.** El joven te propone nuevas rutas de reparto entre tus zonas.
- (T) **Seguir su consejo** — cuesta 🪙 3 → 🪙 +12 + 👶 +8 de crecimiento
- (R) **Fortificar tu capital con su ayuda** — cuesta ⚒ 6 → 2 escudos

**Capítulo 4, final del camino R.** Los leales proclaman al joven señor de las armas, y te deben su vida.
- **Aceptar su gratitud** — cuesta sin costo → 1 caballero y 2 soldados
- **Pedirle un favor mayor** — cuesta 🪙 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +2)

**Capítulo 4, final del camino T.** El joven, ya hombre de confianza, quiere devolverte el favor.
- **Aceptar su gratitud** — cuesta sin costo → ⚒ +20 + 👶 +15 de crecimiento
- **Pedirle un favor mayor** — cuesta 🪙 8 → 🪙 +20 + 💎 Madera noble durante 40 pasos

