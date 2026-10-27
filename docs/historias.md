# Historias de 4 capítulos

Generado por `node herramientas/generar_catalogo.js` a partir de `js/motor/historias.js` y `js/datos/historias_extra.js` (**no se edita a mano**). Hay **20 historias**; los costos y las ganancias de recursos crecen con la partida, como en los encuentros (aquí se ven los montos básicos). Cada jugador vive varias por partida, una tras otra y sin repetir (hasta 4; lo normal son 2 o 3): el capítulo 1 de la primera llega hacia el paso 10, los demás cada 8 pasos, y entre una historia y la siguiente hay un descanso de 6 a 10 pasos. Siempre son oportunidades: dejarlo pasar no cuesta nada ni castiga. Lo que eliges en cada capítulo cambia el siguiente y el final (cada historia tiene dos caminos, marcados con una letra).

## 1. «La caravana perdida»  (caminos: C / T)

**Capítulo 1.** Una caravana de tierras lejanas quedó varada junto a tu territorio, con los carros rotos y poca comida
- (C) **Repararles los carros** — cuesta ⚒ 6 → 🪙 +5
- (T) **Guiarlos con comida hasta la tribu vecina** — cuesta 🌾 5 → 🤝 +1 de relación con la tribu vecina

**Capítulo 2, si vienes del camino C.** Los mercaderes, agradecidos, ofrecen abrir negocio en tu zona
- (C) **Darles un puesto en tu mercado** — cuesta 🪙 4 → 1 comerciante
- (T) **Pedirles que te presenten a la tribu vecina** — cuesta 🪙 3 → 🤝 +1 de relación con la tribu vecina

**Capítulo 2, si vienes del camino T.** La tribu vecina recibe a la caravana y su jefe quiere conocerte
- (T) **Llevarle un regalo de comida** — cuesta 🌾 6 → 🤝 +1 de relación con la tribu vecina
- (C) **Proponerle un trato de comercio** — cuesta 🪙 4 → 🪙 +10

**Capítulo 3, si vienes del camino C.** La ruta comercial prospera y los mercaderes piden protección en el camino
- (C) **Poner tropas a vigilarla** — cuesta 🪙 5 → 2 soldado
- (T) **Pagarle a la tribu para que la cuide** — cuesta 🪙 6 → 🤝 +1 de relación con la tribu vecina

**Capítulo 3, si vienes del camino T.** La tribu quiere que su gente aprenda los modos de comerciar de los forasteros
- (T) **Enviarles un maestro** — cuesta 🌾 5 → 👶 +12 de crecimiento
- (C) **Abrirles tu mercado** — cuesta 🪙 4 → 1 comerciante

**Capítulo 4, final del camino C.** La gran ruta une tu imperio con tierras lejanas y todos quieren cerrar un último trato
- **Aceptar su agradecimiento** — cuesta sin costo → 1 comerciante + 🪙 +30
- **Pedirles algo más grande** — cuesta 🪙 8 → 🪙 +20 + 💎 Sal durante 40 pasos

**Capítulo 4, final del camino T.** La tribu y los forasteros te proclaman amigo de los caminos
- **Aceptar su agradecimiento** — cuesta sin costo → 🌾 +25 + 🤝 +1 de relación con la tribu vecina
- **Pedirles algo más grande** — cuesta 🪙 8 → 🌟 poblador extraordinario (Comercio +2, Agricultura +1)

## 2. «El maestro del valle»  (caminos: S / O)

**Capítulo 1.** Un anciano maestro busca un lugar tranquilo donde enseñar lo que sabe
- (S) **Darle una casa junto a la biblioteca** — cuesta 🌾 4 → 1 científico
- (O) **Ofrecerle un rincón en el taller** — cuesta ⚒ 5 → 1 ingeniero

**Capítulo 2, si vienes del camino S.** El maestro pide libros y tiempo para escribir su saber
- (S) **Darle ciencia para sus estudios** — cuesta 🔬 4 → 🔬 +14
- (O) **Pedirle que enseñe a tus ingenieros** — cuesta 🌾 3 → 1 ingeniero + 👶 +8 de crecimiento

**Capítulo 2, si vienes del camino O.** El maestro quiere probar una herramienta nueva que ideó
- (O) **Pagar el hierro necesario** — cuesta ⚒ 6 → ⚒ +16
- (S) **Pedirle que la explique por escrito** — cuesta 🪙 3 → 🔬 +10

**Capítulo 3, si vienes del camino S.** Sus alumnos más brillantes quieren seguirlo
- (S) **Abrir una escuela** — cuesta 🌾 5 → 2 científico
- (O) **Mandarlos a aprender oficios** — cuesta 🌾 4 → 2 ingeniero

**Capítulo 3, si vienes del camino O.** Los talleres del valle ya imitan sus herramientas
- (O) **Cobrar por enseñar a los vecinos** — cuesta sin costo → 🪙 +12
- (S) **Registrar su método por escrito** — cuesta ⚒ 3 → 🔬 +12

**Capítulo 4, final del camino S.** El maestro, ya muy anciano, quiere dejarte lo mejor de su saber
- **Aceptar su legado** — cuesta sin costo → 📜 una tecnología gratis (hasta nivel 3)
- **Pedirle que forme a un discípulo** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ciencia +2, Ingeniería +1)

**Capítulo 4, final del camino O.** El maestro, ya muy anciano, quiere dejar sus herramientas a tu pueblo
- **Aceptar su legado** — cuesta sin costo → 🏠 un Taller ya construido
- **Pedirle que forme a un discípulo** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +1)

## 3. «El heredero sin trono»  (caminos: R / T)

**Capítulo 1.** Un joven noble exiliado llega a tus puertas pidiendo asilo, y lo persiguen hombres armados
- (R) **Esconderlo y armar a tu gente** — cuesta ⚒ 5 → 1 soldado
- (T) **Ponerlo a trabajar como uno más** — cuesta 🌾 3 → 1 poblador
- (-) **Entregarlo a sus perseguidores** — cuesta sin costo → 🪙 +15

**Capítulo 2, si vienes del camino R.** Sus perseguidores acampan cerca y exigen que lo entregues
- (R) **Poner tropas en la frontera** — cuesta 🪙 4 → 2 soldado
- (T) **Negociar con oro** — cuesta 🪙 8 → 👶 +12 de crecimiento

**Capítulo 2, si vienes del camino T.** El joven demuestra talento: organiza los almacenes y los repartos
- (T) **Darle más responsabilidad** — cuesta 🌾 3 → ⚒ +12
- (R) **Pedirle que entrene a tus soldados** — cuesta ⚒ 4 → 🛠 2 arcos

**Capítulo 3, si vienes del camino R.** Un grupo de leales al joven llega con armas buscando a su señor
- (R) **Acogerlos como guardia** — cuesta 🌾 6 → 2 escudero
- (T) **Pedirles que se queden de obreros** — cuesta 🌾 4 → 2 ingeniero

**Capítulo 3, si vienes del camino T.** El joven te propone nuevas rutas de reparto entre tus zonas
- (T) **Seguir su consejo** — cuesta 🪙 3 → 🪙 +12 + 👶 +8 de crecimiento
- (R) **Fortificar tu capital con su ayuda** — cuesta ⚒ 6 → 🛠 2 escudos

**Capítulo 4, final del camino R.** Los leales proclaman al joven señor de las armas, y te deben su vida
- **Aceptar su gratitud** — cuesta sin costo → 1 caballero + 2 soldado
- **Pedirle un favor mayor** — cuesta 🪙 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +2)

**Capítulo 4, final del camino T.** El joven, ya hombre de confianza, quiere devolverte el favor
- **Aceptar su gratitud** — cuesta sin costo → ⚒ +20 + 👶 +15 de crecimiento
- **Pedirle un favor mayor** — cuesta 🪙 8 → 🪙 +20 + 💎 Madera noble durante 40 pasos

## 4. «El pozo que canta»  (caminos: M / P)

**Capítulo 1.** Un pozo del pueblo empezó a cantar de noche y nadie logra dormir
- (M) **Pedirle a una sabia que lo escuche** — cuesta 🔬 3 → 🔬 +10
- (P) **Taparlo con una buena tapa de piedra** — cuesta ⚒ 5 → 🌾 +8

**Capítulo 2, si vienes del camino M.** La sabia dice que el pozo repite una vieja canción de la tribu vecina
- (M) **Aprender la canción** — cuesta 🔬 3 → 1 científico
- (P) **Regalársela a la tribu vecina** — cuesta 🪙 3 → 🤝 +1 de relación con la tribu vecina

**Capítulo 2, si vienes del camino P.** Bajo la tapa descubren que el agua es excelente para regar
- (P) **Abrir una acequia** — cuesta ⚒ 6 → 🌾 +14
- (M) **Preguntarle a la sabia por qué canta** — cuesta 🪙 3 → 🔬 +10

**Capítulo 3, si vienes del camino M.** La canción atrae a viajeros curiosos que quieren oírla
- (M) **Cobrar la entrada** — cuesta sin costo → 🪙 +12
- (P) **Abrirles un mesón** — cuesta 🌾 4 → 1 comerciante

**Capítulo 3, si vienes del camino P.** El pueblo quiere repartir el agua entre todas las casas
- (P) **Poner cañerías de barro** — cuesta ⚒ 6 → 👶 +14 de crecimiento
- (M) **Dejar un pozo sin tocar, por si acaso** — cuesta 🌾 3 → 🔬 +10

**Capítulo 4, final del camino M.** El pozo ya canta de día y el valle entero viene a escucharlo
- **Aceptar el regalo del valle** — cuesta sin costo → 1 científico + 🪙 +25
- **Pedirle un deseo al pozo** — cuesta 🪙 8 → 🌟 poblador extraordinario (Ciencia +2, Comercio +1)

**Capítulo 4, final del camino P.** El pozo da agua para todos y las cosechas lo agradecen
- **Aceptar el regalo del valle** — cuesta sin costo → 🌾 +25 + 👶 +10 de crecimiento
- **Pedirle un deseo al pozo** — cuesta 🪙 8 → 🌾 +15 + 💎 Hierbas medicinales durante 40 pasos

## 5. «La curandera del bosque»  (caminos: H / B)

**Capítulo 1.** Una curandera llega del bosque con un cesto de hierbas y pide un lugar donde trabajar
- (H) **Darle una casita junto a los enfermos** — cuesta 🌾 4 → 👶 +10 de crecimiento
- (B) **Ofrecerle una cabaña en el lindero** — cuesta ⚒ 4 → 🌾 +10

**Capítulo 2, si vienes del camino H.** La curandera enseña a tus parteras sus remedios
- (H) **Comprar los frascos** — cuesta 🪙 3 → 👶 +14 de crecimiento
- (B) **Pedirle sus secretos del bosque** — cuesta 🌾 3 → 🌾 +12

**Capítulo 2, si vienes del camino B.** Entre los árboles encuentra un claro lleno de plantas raras
- (B) **Cuidar el claro** — cuesta ⚒ 4 → ⚒ +12
- (H) **Recolectar con respeto** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 3, si vienes del camino H.** Los enfermos de la comarca vienen a que los cure
- (H) **Abrirles una sala** — cuesta 🌾 5 → 2 poblador
- (B) **Aceptar sus regalos** — cuesta sin costo → 🪙 +10

**Capítulo 3, si vienes del camino B.** Los animales del bosque se acercan al pueblo sin miedo
- (B) **Hacerles un corral** — cuesta ⚒ 5 → 🌾 +14
- (H) **Pedirle que cure a los heridos** — cuesta 🌾 4 → 👶 +12 de crecimiento

**Capítulo 4, final del camino H.** La curandera es famosa y quiere dejarte su botica
- **Aceptar su gratitud** — cuesta sin costo → 🌾 +20 + 👶 +12 de crecimiento
- **Pedirle una aprendiz** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ciencia +2, Agricultura +1)

**Capítulo 4, final del camino B.** El bosque entero parece cuidar de tu pueblo
- **Aceptar su gratitud** — cuesta sin costo → ⚒ +20 + 👶 +10 de crecimiento
- **Pedirle una aprendiz** — cuesta 🌾 8 → 🌾 +15 + 💎 Hierbas medicinales durante 40 pasos

## 6. «El herrero errante»  (caminos: A / U)

**Capítulo 1.** Un herrero con un carro lleno de yunques busca un sitio para encender su fragua
- (A) **Pedirle espadas y puntas de lanza** — cuesta 🪙 4 → 🛠 1 arco
- (U) **Pedirle arados y herramientas** — cuesta ⚒ 4 → ⚒ +10

**Capítulo 2, si vienes del camino A.** El herrero se luce con las armas y la guardia pide más
- (A) **Encargar una tanda de arcos** — cuesta ⚒ 5 → 🛠 2 arcos
- (U) **Mejor que forje clavos y bisagras** — cuesta 🌾 3 → ⚒ +12

**Capítulo 2, si vienes del camino U.** Las herramientas nuevas duplican lo que rinde el taller
- (U) **Equipar a todos los ingenieros** — cuesta ⚒ 5 → 1 ingeniero
- (A) **Probar con unos escudos** — cuesta ⚒ 5 → 🛠 2 escudos

**Capítulo 3, si vienes del camino A.** Sus armas llegan a oídos de un capitán que quiere tropas bien armadas
- (A) **Armar a tu guardia** — cuesta 🪙 6 → 2 soldado
- (U) **Vender el excedente** — cuesta sin costo → 🪙 +10

**Capítulo 3, si vienes del camino U.** Los campesinos de la comarca vienen a comprarle herramientas
- (U) **Abrirle una tienda** — cuesta 🌾 4 → 🪙 +12
- (A) **Pedirle una espada para tu capitán** — cuesta 🪙 5 → 1 caballero

**Capítulo 4, final del camino A.** El herrero se ha vuelto el mejor armero del valle y quiere agradecértelo
- **Aceptar su regalo** — cuesta sin costo → 🛠 2 escudos + 🛠 2 arcos
- **Pedirle una obra maestra** — cuesta 🪙 8 → 1 caballero + 2 soldado

**Capítulo 4, final del camino U.** El herrero ya no es errante: tu taller es su casa
- **Aceptar su regalo** — cuesta sin costo → 1 ingeniero + ⚒ +25
- **Pedirle una obra maestra** — cuesta 🪙 8 → 🏠 un Taller ya construido

## 7. «El cartógrafo»  (caminos: E / S)

**Capítulo 1.** Un cartógrafo con el mapa a medio terminar pide ayuda para recorrer la comarca
- (E) **Darle una escolta y provisiones** — cuesta 🌾 4 → 🪙 +8
- (S) **Dejarlo estudiar en tu biblioteca** — cuesta 🪙 3 → 🔬 +10

**Capítulo 2, si vienes del camino E.** El mapa revela un atajo entre dos valles
- (E) **Abrir el atajo** — cuesta ⚒ 5 → 🪙 +12
- (S) **Copiar el mapa para guardarlo** — cuesta 🪙 3 → 🔬 +10

**Capítulo 2, si vienes del camino S.** El cartógrafo corrige los mapas de tus escribas
- (S) **Imprimir copias** — cuesta ⚒ 4 → 🔬 +14
- (E) **Mandar una expedición** — cuesta 🌾 4 → 1 arquero

**Capítulo 3, si vienes del camino E.** La expedición encuentra rutas de comercio olvidadas
- (E) **Enviar mercaderes** — cuesta 🪙 4 → 1 comerciante
- (S) **Anotar todo para estudiarlo** — cuesta 🪙 3 → 🔬 +12

**Capítulo 3, si vienes del camino S.** Los mapas atraen a sabios de otras tierras
- (S) **Recibirlos con una cena** — cuesta 🌾 5 → 1 científico
- (E) **Pedirles una expedición juntos** — cuesta 🌾 4 → 🪙 +12

**Capítulo 4, final del camino E.** El cartógrafo termina su gran mapa con el nombre de tu pueblo en el centro
- **Aceptar el mapa** — cuesta sin costo → 1 comerciante + 🪙 +22
- **Pedirle lo que los demás no ven** — cuesta 🪙 8 → 🪙 +15 + 💎 Madera noble durante 40 pasos

**Capítulo 4, final del camino S.** El gran mapa llena tu biblioteca de saber
- **Aceptar el mapa** — cuesta sin costo → 🔬 +25
- **Pedirle lo que los demás no ven** — cuesta 🪙 8 → 📜 una tecnología gratis (hasta nivel 3)

## 8. «La feria de otoño»  (caminos: C / F)

**Capítulo 1.** Se acerca la feria de otoño y los vecinos quieren celebrarla en tu pueblo
- (C) **Dejar que los mercaderes monten sus puestos** — cuesta ⚒ 4 → 🪙 +10
- (F) **Preparar bailes y música** — cuesta 🌾 4 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino C.** Los puestos se llenan de gente y las monedas corren
- (C) **Cobrar por cada puesto** — cuesta sin costo → 🪙 +10
- (F) **Invitar a todos a una cena** — cuesta 🌾 5 → 👶 +12 de crecimiento

**Capítulo 2, si vienes del camino F.** El baile dura hasta el amanecer y nadie quiere irse
- (F) **Repartir pan y vino** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (C) **Vender entradas para la segunda noche** — cuesta sin costo → 🪙 +10

**Capítulo 3, si vienes del camino C.** Un gran mercader quiere abrir una sucursal si le aseguras buen trato
- (C) **Darle un puesto fijo** — cuesta 🪙 4 → 1 comerciante
- (F) **Pedirle que traiga músicos** — cuesta 🪙 3 → 👶 +12 de crecimiento

**Capítulo 3, si vienes del camino F.** Las familias de la comarca quieren casarse durante la feria
- (F) **Organizar una boda grande** — cuesta 🌾 6 → 2 poblador
- (C) **Cobrar la licencia** — cuesta sin costo → 🪙 +10

**Capítulo 4, final del camino C.** La feria se hace famosa y trae mercaderes de todas partes
- **Aceptar las ganancias** — cuesta sin costo → 🪙 +30
- **Fundar la gran feria anual** — cuesta 🪙 8 → 🪙 +12 + 🏠 un Mercado ya construido

**Capítulo 4, final del camino F.** La feria se vuelve la fiesta más querida del valle
- **Aceptar las ganancias** — cuesta sin costo → 🌾 +15 + 👶 +20 de crecimiento
- **Fundar la gran feria anual** — cuesta 🪙 8 → 2 poblador + 1 comerciante

## 9. «El monje del manuscrito»  (caminos: S / D)

**Capítulo 1.** Un monje cansado llega con un manuscrito antiguo y pide un lugar tranquilo para leerlo
- (S) **Darle una mesa en la biblioteca** — cuesta 🪙 3 → 🔬 +10
- (D) **Ofrecerle una celda y comida** — cuesta 🌾 4 → 👶 +8 de crecimiento

**Capítulo 2, si vienes del camino S.** El monje descifra un capítulo sobre cómo ordenar los números
- (S) **Copiarlo con cuidado** — cuesta ⚒ 3 → 🔬 +14
- (D) **Leerlo en voz alta al pueblo** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino D.** El monje reza con tu gente y el ánimo del pueblo mejora
- (D) **Construir una capilla pequeña** — cuesta ⚒ 5 → 🌾 +12
- (S) **Pedirle que enseñe a tus niños** — cuesta 🌾 4 → 1 científico

**Capítulo 3, si vienes del camino S.** Otros monjes llegan atraídos por el manuscrito
- (S) **Abrirles un taller de copistas** — cuesta ⚒ 5 → 🔬 +14
- (D) **Dejar que ayuden en las cosechas** — cuesta sin costo → 🌾 +12

**Capítulo 3, si vienes del camino D.** La gente del valle viene a pedirle consejo
- (D) **Recibirlos con una sopa** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (S) **Cobrar una ofrenda** — cuesta sin costo → 🪙 +10

**Capítulo 4, final del camino S.** El manuscrito se completa y todos quieren leerlo
- **Aceptar su regalo** — cuesta sin costo → 1 científico + 🔬 +25
- **Pedirle la mejor página** — cuesta 🪙 8 → 📜 una tecnología gratis (hasta nivel 3)

**Capítulo 4, final del camino D.** El monje se ha vuelto el guía espiritual de la comarca
- **Aceptar su regalo** — cuesta sin costo → 🌾 +25 + 👶 +10 de crecimiento
- **Pedirle la mejor página** — cuesta 🪙 8 → 🌟 poblador extraordinario (Agricultura +2, Ciencia +1)

## 10. «Los bandoleros arrepentidos»  (caminos: R / T)

**Capítulo 1.** Una banda de bandoleros cansados de huir pide perdón y un lugar donde quedarse
- (R) **Ofrecerles servir como guardia** — cuesta 🌾 4 → 1 soldado
- (T) **Ofrecerles trabajo en el taller** — cuesta ⚒ 3 → ⚒ +10

**Capítulo 2, si vienes del camino R.** El jefe de la banda demuestra ser un buen sargento
- (R) **Darle mando sobre tus soldados** — cuesta 🪙 4 → 2 soldado
- (T) **Pedirle que enseñe un oficio a los suyos** — cuesta 🌾 3 → ⚒ +12

**Capítulo 2, si vienes del camino T.** Los bandoleros trabajan duro para ganarse la confianza
- (T) **Pagarles su primera paga** — cuesta 🪙 3 → 1 ingeniero
- (R) **Ofrecerles armas si prometen defender el pueblo** — cuesta 🪙 5 → 🛠 2 arcos

**Capítulo 3, si vienes del camino R.** Corre la voz y otros bandoleros se acercan a ver
- (R) **Reclutar a los más fuertes** — cuesta 🌾 5 → 2 arquero
- (T) **Ofrecerles también trabajo** — cuesta ⚒ 4 → 1 ingeniero

**Capítulo 3, si vienes del camino T.** Los vecinos dudan de ellos, pero los ven trabajar y se les pasa
- (T) **Organizar un día de trabajo en común** — cuesta 🌾 4 → 👶 +12 de crecimiento
- (R) **Ponerlos de ronda nocturna** — cuesta sin costo → 🪙 +8

**Capítulo 4, final del camino R.** Los antiguos bandoleros ya son tu mejor guardia
- **Aceptar su lealtad** — cuesta sin costo → 2 soldado + 1 arquero
- **Pedirles que traigan a su capitán** — cuesta 🪙 8 → 1 caballero + 1 escudero

**Capítulo 4, final del camino T.** Los antiguos bandoleros ya son los mejores trabajadores del pueblo
- **Aceptar su lealtad** — cuesta sin costo → 2 ingeniero
- **Pedirles que traigan a su capitán** — cuesta 🪙 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +1)

## 11. «El cometa»  (caminos: C / M)

**Capítulo 1.** Un cometa cruza el cielo y el pueblo se divide entre los curiosos y los asustados
- (C) **Observarlo con instrumentos** — cuesta 🔬 3 → 🔬 +10
- (M) **Reunir al pueblo para tranquilizarlo** — cuesta 🌾 4 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino C.** Los instrumentos muestran que el cometa vuelve cada cien años
- (C) **Anotar su trayectoria** — cuesta 🪙 3 → 🔬 +14
- (M) **Explicarlo en la plaza** — cuesta 🌾 3 → 👶 +12 de crecimiento

**Capítulo 2, si vienes del camino M.** La gente reza y el miedo se calma con la compañía
- (M) **Repartir velas y pan** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (C) **Mostrarles el cometa por un tubo** — cuesta 🪙 3 → 🔬 +10

**Capítulo 3, si vienes del camino C.** Un sabio de otra tierra viene a ver el cometa contigo
- (C) **Compartir tu observatorio** — cuesta ⚒ 4 → 1 científico
- (M) **Pedirle que hable al pueblo** — cuesta 🌾 4 → 👶 +12 de crecimiento

**Capítulo 3, si vienes del camino M.** Un predicador dice que el cometa trae buena suerte
- (M) **Dejarlo predicar** — cuesta sin costo → 🪙 +10
- (C) **Pedirle que mire por el telescopio** — cuesta 🪙 3 → 🔬 +12

**Capítulo 4, final del camino C.** El cometa se aleja y tu pueblo queda con un saber nuevo
- **Aceptar la fama** — cuesta sin costo → 🔬 +25
- **Fundar una torre de observación** — cuesta 🪙 8 → 📜 una tecnología gratis (hasta nivel 3)

**Capítulo 4, final del camino M.** El cometa se aleja y el pueblo queda más unido que nunca
- **Aceptar la fama** — cuesta sin costo → 🌾 +15 + 👶 +18 de crecimiento
- **Fundar una torre de observación** — cuesta 🪙 8 → 2 poblador + 1 científico

## 12. «La reina de las abejas»  (caminos: M / C)

**Capítulo 1.** Un enjambre de abejas se instala en tu huerta y una apicultora ofrece cuidarlo
- (M) **Aceptar la miel como pago** — cuesta sin costo → 🌾 +8
- (C) **Pedirle cera para velas** — cuesta ⚒ 3 → ⚒ +10

**Capítulo 2, si vienes del camino M.** La miel es tan buena que los vecinos la quieren comprar
- (M) **Venderla en el mercado** — cuesta sin costo → 🪙 +12
- (C) **Guardar cera para el invierno** — cuesta 🌾 3 → ⚒ +12

**Capítulo 2, si vienes del camino C.** Las velas de cera alumbran las noches de trabajo
- (C) **Hacer más velas** — cuesta ⚒ 4 → ⚒ +14
- (M) **Probar un pastel con miel** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 3, si vienes del camino M.** Los campos cercanos florecen con tanta abeja
- (M) **Sembrar más flores** — cuesta 🌾 4 → 🌾 +14
- (C) **Hacer más colmenas** — cuesta ⚒ 5 → ⚒ +12

**Capítulo 3, si vienes del camino C.** Un cofrade pide cera para la capilla y paga bien
- (C) **Venderle la cera** — cuesta sin costo → 🪙 +14
- (M) **Pedirle a cambio un favor** — cuesta 🌾 3 → 👶 +12 de crecimiento

**Capítulo 4, final del camino M.** Las abejas de tu pueblo se hacen famosas por su miel
- **Aceptar el reconocimiento** — cuesta sin costo → 🪙 +22 + 👶 +10 de crecimiento
- **Pedirle a la apicultora que enseñe a otros** — cuesta 🌾 8 → 🌟 poblador extraordinario (Agricultura +2, Comercio +1)

**Capítulo 4, final del camino C.** Las velas de tu pueblo alumbran toda la comarca
- **Aceptar el reconocimiento** — cuesta sin costo → ⚒ +22 + 👶 +10 de crecimiento
- **Pedirle a la apicultora que enseñe a otros** — cuesta 🌾 8 → 🌟 poblador extraordinario (Ingeniería +2, Agricultura +1)

## 13. «El puente roto»  (caminos: I / V)

**Capítulo 1.** El puente sobre el arroyo se rompió y el paso quedó cortado
- (I) **Mandar a tus ingenieros a repararlo** — cuesta ⚒ 5 → ⚒ +8
- (V) **Pedir ayuda a los vecinos** — cuesta 🌾 4 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino I.** Los ingenieros descubren que el arco de piedra aguanta mejor
- (I) **Hacerlo de piedra** — cuesta ⚒ 6 → ⚒ +14
- (V) **Invitar a los vecinos a verlo** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino V.** Los vecinos traen madera y herramientas
- (V) **Darles de comer** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (I) **Ponerlos a las órdenes de tus ingenieros** — cuesta sin costo → ⚒ +10

**Capítulo 3, si vienes del camino I.** El puente nuevo atrae a transportistas de toda la comarca
- (I) **Cobrar el peaje** — cuesta sin costo → 🪙 +12
- (V) **Dejarlo gratis para ganar amigos** — cuesta 🌾 3 → 🤝 +1 de relación con la tribu vecina

**Capítulo 3, si vienes del camino V.** El puente se convierte en el lugar de encuentro de las aldeas
- (V) **Hacer una fiesta de inauguración** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (I) **Mejorar los caminos que llegan a él** — cuesta ⚒ 5 → ⚒ +12

**Capítulo 4, final del camino I.** El puente es una obra de la que tus ingenieros se enorgullecen
- **Aceptar los honores** — cuesta sin costo → 1 ingeniero + ⚒ +22
- **Pedir que se amplíe la calzada** — cuesta ⚒ 8 → 🏠 un Camino ya construido

**Capítulo 4, final del camino V.** El puente une más que dos orillas: une a todo el valle
- **Aceptar los honores** — cuesta sin costo → 🪙 +15 + 🤝 +1 de relación con la tribu vecina
- **Pedir que se amplíe la calzada** — cuesta ⚒ 8 → 👶 +10 de crecimiento + 🏠 un Camino ya construido

## 14. «La trovadora»  (caminos: L / N)

**Capítulo 1.** Una trovadora llega a tu pueblo cantando historias de tierras lejanas
- (L) **Pedirle que cante una leyenda** — cuesta 🌾 3 → 👶 +8 de crecimiento
- (N) **Preguntarle qué ha visto en el camino** — cuesta 🪙 3 → 🔬 +8

**Capítulo 2, si vienes del camino L.** La leyenda habla de un tesoro enterrado en las lomas
- (L) **Mandar a buscarlo** — cuesta 🌾 4 → 🪙 +12
- (N) **Preguntar a los ancianos si es cierto** — cuesta 🪙 3 → 🔬 +10

**Capítulo 2, si vienes del camino N.** La trovadora cuenta que una tribu vecina anda preocupada
- (N) **Llevarles un regalo** — cuesta 🌾 4 → 🤝 +1 de relación con la tribu vecina
- (L) **Pedirle una canción que los alegre** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 3, si vienes del camino L.** La canción de la leyenda se vuelve famosa en el pueblo
- (L) **Hacer una fiesta con ella** — cuesta 🌾 5 → 👶 +14 de crecimiento
- (N) **Venderle la copia a otra aldea** — cuesta sin costo → 🪙 +10

**Capítulo 3, si vienes del camino N.** Las noticias de la trovadora te ahorran un mal trato
- (N) **Agradecérselo con un banquete** — cuesta 🌾 4 → 🪙 +12
- (L) **Dejar que cante en el mercado** — cuesta sin costo → 🪙 +8

**Capítulo 4, final del camino L.** Tu pueblo sale en las canciones de toda la comarca
- **Aceptar la fama** — cuesta sin costo → 🪙 +15 + 👶 +20 de crecimiento
- **Pedirle que se quede para siempre** — cuesta 🪙 8 → 🌟 poblador extraordinario (Comercio +2, Ciencia +1)

**Capítulo 4, final del camino N.** La trovadora se ha vuelto tus ojos y oídos en el camino
- **Aceptar la fama** — cuesta sin costo → 🔬 +20 + 🤝 +1 de relación con la tribu vecina
- **Pedirle que se quede para siempre** — cuesta 🪙 8 → 2 comerciante + 🔬 +15

## 15. «Los caballos de la llanura»  (caminos: D / L)

**Capítulo 1.** Una manada de caballos salvajes se acerca a tus tierras buscando agua
- (D) **Acercarles cuerdas y pesebres** — cuesta ⚒ 4 → 🛠 1 arco
- (L) **Dejarles agua y respetar su paso** — cuesta 🌾 3 → 🌾 +10

**Capítulo 2, si vienes del camino D.** Una yegua se deja tocar y los demás la siguen
- (D) **Domar a los más mansos** — cuesta 🌾 4 → 1 caballero
- (L) **Dejarlos en paz una temporada** — cuesta sin costo → 🌾 +10

**Capítulo 2, si vienes del camino L.** La manada se queda cerca y fertiliza los pastos
- (L) **Cercar solo los cultivos** — cuesta ⚒ 4 → 🌾 +14
- (D) **Observarlos para aprender a montar** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 3, si vienes del camino D.** Tu primer jinete aprende a montar con ayuda de un vaquero
- (D) **Pagar sus lecciones** — cuesta 🪙 5 → 1 caballero
- (L) **Pedirle que enseñe a los niños** — cuesta 🌾 4 → 👶 +12 de crecimiento

**Capítulo 3, si vienes del camino L.** Los potros nacidos entre tus pastos son cada vez más fuertes
- (L) **Cuidar a las crías** — cuesta 🌾 5 → 🌾 +14
- (D) **Quedarte con un potro** — cuesta 🪙 6 → 1 caballero

**Capítulo 4, final del camino D.** Tu caballería es la envidia de la comarca
- **Aceptar el regalo de la llanura** — cuesta sin costo → 2 caballero
- **Elegir al mejor semental** — cuesta 🪙 8 → 1 caballero + 1 escudero + 🛠 1 escudo

**Capítulo 4, final del camino L.** La manada considera tus pastos su hogar
- **Aceptar el regalo de la llanura** — cuesta sin costo → 🌾 +25 + 👶 +10 de crecimiento
- **Elegir al mejor semental** — cuesta 🪙 8 → 🌾 +15 + 💎 Caballos salvajes durante 40 pasos

## 16. «La mina olvidada»  (caminos: E / S)

**Capítulo 1.** Un niño encuentra la entrada de una mina abandonada detrás de la colina
- (E) **Mandar a mirar adentro** — cuesta ⚒ 4 → ⚒ +10
- (S) **Apuntalar la entrada primero** — cuesta ⚒ 4 → 🪙 +6

**Capítulo 2, si vienes del camino E.** Adentro quedan vetas sin tocar
- (E) **Cavar unas galerías** — cuesta ⚒ 6 → ⚒ +16
- (S) **Reforzar los techos antes** — cuesta ⚒ 4 → 🪙 +8

**Capítulo 2, si vienes del camino S.** Los puntales dejan la mina segura y los mineros pierden el miedo
- (S) **Contratar mineros** — cuesta 🌾 4 → 1 ingeniero
- (E) **Empezar a extraer ya** — cuesta ⚒ 4 → ⚒ +12

**Capítulo 3, si vienes del camino E.** La mina rinde mucho mineral y los carros no dan abasto
- (E) **Hacer carros nuevos** — cuesta ⚒ 5 → 🪙 +14
- (S) **Reforzar los puntales otra vez** — cuesta ⚒ 4 → ⚒ +12

**Capítulo 3, si vienes del camino S.** La mina es segura y atrae a mineros de otros valles
- (S) **Recibirlos con techo y comida** — cuesta 🌾 5 → 2 ingeniero
- (E) **Cobrarles por cavar aquí** — cuesta sin costo → 🪙 +12

**Capítulo 4, final del camino E.** La mina te da más hierro del que sabes usar
- **Aceptar la riqueza** — cuesta sin costo → ⚒ +28
- **Abrir una galería nueva** — cuesta ⚒ 8 → 🪙 +15 + 💎 Hierro durante 40 pasos

**Capítulo 4, final del camino S.** La mina es la más segura de la comarca y todos quieren trabajar en ella
- **Aceptar la riqueza** — cuesta sin costo → 2 ingeniero + ⚒ +15
- **Abrir una galería nueva** — cuesta ⚒ 8 → 🏠 un Fortificación ya construido

## 17. «El tribunal del pueblo»  (caminos: J / P)

**Capítulo 1.** Dos vecinos se pelean por un pozo y piden que alguien decida
- (J) **Escuchar a los dos y dictar sentencia** — cuesta 🌾 3 → 👶 +8 de crecimiento
- (P) **Proponerles que compartan el pozo** — cuesta 🌾 3 → 🌾 +8

**Capítulo 2, si vienes del camino J.** Tu sentencia justa se comenta en toda la aldea
- (J) **Anotar la ley por escrito** — cuesta 🪙 3 → 🔬 +10
- (P) **Invitar a los dos a una comida** — cuesta 🌾 4 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino P.** Los vecinos se estrechan la mano y cavan juntos un segundo pozo
- (P) **Ayudarles con los trabajos** — cuesta ⚒ 4 → 🌾 +12
- (J) **Proponerles un acuerdo escrito** — cuesta 🪙 3 → 🔬 +8

**Capítulo 3, si vienes del camino J.** Llegan más casos y hace falta un juez fijo
- (J) **Nombrar a un juez del pueblo** — cuesta 🪙 4 → 1 escudero
- (P) **Pedir que los vecinos se arreglen solos** — cuesta sin costo → 🌾 +8

**Capítulo 3, si vienes del camino P.** El pueblo se vuelve conocido por resolver las peleas hablando
- (P) **Abrir un lugar de reunión** — cuesta ⚒ 5 → 👶 +14 de crecimiento
- (J) **Cobrar una pequeña tasa** — cuesta sin costo → 🪙 +10

**Capítulo 4, final del camino J.** Tu pueblo tiene fama de justo y los forasteros piden juicio aquí
- **Aceptar el respeto** — cuesta sin costo → 2 escudero
- **Fundar la casa del consejo** — cuesta 🪙 8 → 🌟 poblador extraordinario (Ciencia +2, Comercio +1)

**Capítulo 4, final del camino P.** Tu pueblo tiene fama de pacífico y los forasteros vienen a vivir aquí
- **Aceptar el respeto** — cuesta sin costo → 🪙 +20 + 🤝 +1 de relación con la tribu vecina
- **Fundar la casa del consejo** — cuesta 🪙 8 → 🌟 poblador extraordinario (Agricultura +2, Comercio +1)

## 18. «La maestra de esgrima»  (caminos: F / E)

**Capítulo 1.** Una maestra de esgrima ofrece enseñar a tus soldados a pelear con elegancia
- (F) **Aceptar sus lecciones de espada** — cuesta 🪙 4 → 1 soldado
- (E) **Pedirle que enseñe a cubrirse con el escudo** — cuesta 🪙 4 → 🛠 1 escudo

**Capítulo 2, si vienes del camino F.** Tus soldados aprenden a golpear con precisión
- (F) **Hacer un torneo** — cuesta 🌾 4 → 1 soldado
- (E) **Practicar también la defensa** — cuesta ⚒ 4 → 🛠 1 escudo

**Capítulo 2, si vienes del camino E.** Tus soldados aprenden a aguantar con calma
- (E) **Encargar más escudos** — cuesta ⚒ 5 → 🛠 2 escudos
- (F) **Dejar que prueben con la espada** — cuesta 🪙 4 → 1 soldado

**Capítulo 3, si vienes del camino F.** La fama de la maestra atrae a jóvenes que quieren ser soldados
- (F) **Aceptar a los mejores** — cuesta 🌾 5 → 2 soldado
- (E) **Pedirles que prueben los escudos** — cuesta ⚒ 4 → 🛠 1 escudo

**Capítulo 3, si vienes del camino E.** Un capitán quiere copiar su método de defensa
- (E) **Vendérselo** — cuesta sin costo → 🪙 +12
- (F) **Pedirle que envíe un instructor** — cuesta 🪙 5 → 1 escudero

**Capítulo 4, final del camino F.** Tu guardia pelea como si cada golpe estuviera ensayado
- **Aceptar su gratitud** — cuesta sin costo → 2 soldado + 🛠 1 arco
- **Pedirle que forme a tu mejor guerrero** — cuesta 🪙 8 → 1 berserker + 1 caballero

**Capítulo 4, final del camino E.** Tu guardia aguanta lo que le echen sin perder la calma
- **Aceptar su gratitud** — cuesta sin costo → 🛠 3 escudos
- **Pedirle que forme a tu mejor guerrero** — cuesta 🪙 8 → 2 escudero + 1 soldado

## 19. «El barco encallado»  (caminos: T / M)

**Capítulo 1.** Un barco mercante quedó encallado en el río, con la carga a medio hundir
- (T) **Rescatar la carga** — cuesta ⚒ 4 → 🪙 +8
- (M) **Ayudar a la tripulación primero** — cuesta 🌾 4 → 1 poblador

**Capítulo 2, si vienes del camino T.** En la carga hay telas finas y especias
- (T) **Secarlas al sol** — cuesta ⚒ 4 → 🪙 +14
- (M) **Ofrecer parte a la tripulación** — cuesta sin costo → 🪙 +8

**Capítulo 2, si vienes del camino M.** Los marineros, agradecidos, cuentan historias de puertos lejanos
- (M) **Invitarlos a quedarse unos días** — cuesta 🌾 4 → 🔬 +10
- (T) **Pedirles que lleven tu mercancía** — cuesta 🪙 3 → 🪙 +10

**Capítulo 3, si vienes del camino T.** El capitán del barco quiere pagar por la ayuda y abrir una ruta
- (T) **Cerrar el trato** — cuesta sin costo → 🪙 +14
- (M) **Pedirle un par de marineros** — cuesta 🌾 3 → 1 comerciante

**Capítulo 3, si vienes del camino M.** Los marineros te enseñan a hacer redes y nudos
- (M) **Aprender sus nudos** — cuesta ⚒ 3 → 🌾 +12
- (T) **Pedirles que lleven un cargamento** — cuesta ⚒ 4 → 🪙 +12

**Capítulo 4, final del camino T.** El puerto del río se llena de barcos que traen todo tipo de cosas
- **Aceptar las ganancias** — cuesta sin costo → 🪙 +28
- **Pedirle al capitán un cargamento especial** — cuesta 🪙 8 → 🪙 +15 + 💎 Sal durante 40 pasos

**Capítulo 4, final del camino M.** La tripulación se queda a vivir y el río ya es tu mejor camino
- **Aceptar las ganancias** — cuesta sin costo → 2 comerciante
- **Pedirle al capitán un cargamento especial** — cuesta 🪙 8 → 🌟 poblador extraordinario (Comercio +2, Agricultura +1)

## 20. «El sembrador de semillas raras»  (caminos: R / C)

**Capítulo 1.** Un sembrador viajero ofrece semillas raras de plantas que nadie conoce
- (R) **Probar las semillas raras** — cuesta 🌾 4 → 🌾 +8
- (C) **Pedirle consejos para sembrar mejor lo de siempre** — cuesta 🌾 3 → 👶 +8 de crecimiento

**Capítulo 2, si vienes del camino R.** Las plantas raras crecen rápido y dan frutos extraños
- (R) **Sembrar un campo entero** — cuesta ⚒ 4 → 🌾 +14
- (C) **Mezclarlas con tu trigo** — cuesta 🌾 3 → 👶 +10 de crecimiento

**Capítulo 2, si vienes del camino C.** Los consejos del sembrador aumentan la cosecha sin riesgo
- (C) **Aplicar sus consejos en todos los campos** — cuesta ⚒ 4 → 🌾 +14
- (R) **Reservar un rincón para las raras** — cuesta 🌾 3 → 🌾 +10

**Capítulo 3, si vienes del camino R.** Los frutos raros se venden como lujo
- (R) **Venderlos en el mercado** — cuesta sin costo → 🪙 +14
- (C) **Guardar las semillas para más tarde** — cuesta 🌾 3 → 👶 +12 de crecimiento

**Capítulo 3, si vienes del camino C.** Los campos se llenan de trigo parejo y bien cuidado
- (C) **Hacer una trilla grande** — cuesta ⚒ 4 → 🌾 +16
- (R) **Probar una variedad nueva** — cuesta 🌾 3 → 🌾 +12

**Capítulo 4, final del camino R.** Tus frutos raros se hacen famosos en la comarca
- **Aceptar la fama** — cuesta sin costo → 🪙 +20 + 👶 +10 de crecimiento
- **Pedirle que se quede un año** — cuesta 🌾 8 → 🌟 poblador extraordinario (Agricultura +2, Comercio +1)

**Capítulo 4, final del camino C.** Tus campos son los mejor cuidados del valle
- **Aceptar la fama** — cuesta sin costo → 🌾 +30
- **Pedirle que se quede un año** — cuesta 🌾 8 → 🌟 poblador extraordinario (Agricultura +2, Ingeniería +1)

