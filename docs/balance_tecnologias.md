# Balance de tecnologías (simulación)

Generado por `herramientas/balance_tecnologias.js` con las reglas actuales. Fecha: 2026-10-28.

**Cómo se mide**

- **Económicas:** la tecnología se aplica a tres imperios de referencia (temprano: 5 personas; medio: unas 20 en 2 zonas; avanzado: unas 35 en 3 zonas) y se mide la ganancia de un paso (comida + producción + oro + ciencia). Si mejora un edificio que ya existe, se cuenta como mejorado. **Pasos para recuperar** = costo en ciencia ÷ mejor ganancia por paso.
- **Militares:** 150 batallas por caso entre dos ejércitos iguales (2 soldados, 2 arqueros, 1 escudero, 1 caballero, 1 berserker, fuerza 4) repartidas en los 6 terrenos, en campo abierto y defendiendo con la Fortificación al nivel que permiten las tecnologías (el atacante trae 2 tropas más para que el caso base quede parejo). Se informa cuántos puntos sube el % de victorias del que tiene la tecnología (sin tecnología: 37 % y 49 %).

**Resumen:** 71 situacional (no medible así) · 52 situacional (no se nota en batalla) · 21 fuerte · 17 sin efecto simulado · 14 normal (almacén o crecimiento) · 13 ⚠ muy fuerte · 11 normal · 9 viene de inicio · 1 débil.

## Las más fuertes (revisar primero)

| Tecnología | Nivel | Costo | Ganancia por paso (temprano / medio / avanzado) | Pasos para recuperar | Combate (campo / defensa) |
|---|---|---|---|---|---|
| Gran molino | 5 | 100 | 23 / 45 / 52 | 2 | — |
| Gran manufactura | 5 | 100 | 0 / 41 / 34 | 2 | — |
| Bolsa imperial | 5 | 100 | 0 / 33 / 48 | 2 | — |
| Arado | 1 | 20 | 3 / 8 / 11 | 2 | — |
| Banco | 4 | 80 | 0 / 19 / 24 | 3 | — |
| Moneda | 1 | 20 | 0 / 2 / 8 | 3 | — |
| Molino hidráulico | 4 | 80 | 13 / 21 / 22 | 4 | — |
| Taller de maquinaria | 4 | 80 | 0 / 21 / 12 | 4 | — |
| Abonos | 3 | 60 | 3 / 8 / 11 | 5 | — |
| Fortificación II | 2 | 40 | 0 / 0 / 0 | — | +0 / +31 |
| Fortificación III | 3 | 60 | 0 / 0 / 0 | — | +0 / +44 |
| Torres de vigilancia | 4 | 80 | 0 / 0 / 0 | — | +0 / +44 |
| Armaduras ligeras | 3 | 60 | 0 / 0 / 0 | — | +32 / +27 |

## Las más débiles

| Tecnología | Nivel | Costo | Ganancia por paso | Pasos para recuperar |
|---|---|---|---|---|
| Archivo | 4 | 80 | 0 / 0 / 1 | 80 |

## Todas

| Tecnología | Rama | Nivel | Costo | Ganancia por paso (T / M / A) | Recupera en | Almacén (+) | Crecer (−costo) | Combate campo | Combate defensa | Veredicto |
|---|---|---|---|---|---|---|---|---|---|---|
| Molinos | Agricultura | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Arado | Agricultura | 1 | 20 | 3 / 8 / 11 | 2 |  |  |  |  | ⚠ muy fuerte |
| Molino de piedra | Agricultura | 2 | 40 | 6 / 6 / 6 | 7 |  |  |  |  | fuerte |
| Riego | Agricultura | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Huertos familiares | Agricultura | 2 | 40 | 2 / 4 / 4 | 10 |  |  |  |  | fuerte |
| Despensas | Agricultura | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Pastoreo | Agricultura | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Molino-granero | Agricultura | 3 | 60 | 8 / 10 / 8 | 6 |  |  |  |  | fuerte |
| Abonos | Agricultura | 3 | 60 | 3 / 8 / 11 | 5 |  |  |  |  | ⚠ muy fuerte |
| Ganadería | Agricultura | 3 | 60 | 0 / 2 / 2 | 30 |  |  |  |  | normal |
| Semillas resistentes | Agricultura | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Molino hidráulico | Agricultura | 4 | 80 | 13 / 21 / 22 | 4 |  |  |  |  | ⚠ muy fuerte |
| Cosecha comunal | Agricultura | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Irrigación avanzada | Agricultura | 4 | 80 | 2 / 4 / 4 | 20 |  |  |  |  | normal |
| Gran molino | Agricultura | 5 | 100 | 23 / 45 / 52 | 2 |  |  |  |  | ⚠ muy fuerte |
| Granjas modelo | Agricultura | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Revolución agrícola | Agricultura | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Arco | Armas y unidades | 1 | 20 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Escudos | Armas y unidades | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Doma de caballos | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Forja de hachas | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Arco compuesto | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +22 | +16 | fuerte |
| Escudos reforzados | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +4 | +1 | normal |
| Armaduras ligeras | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +32 | +27 | ⚠ muy fuerte |
| Ingeniería de asedio | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Lanzapiedras | Armas y unidades | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Flechas de fuego | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +1 | situacional (no se nota en batalla) |
| Carga de caballería | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +12 | +0 | fuerte |
| Caballería pesada | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +1 | +2 | situacional (no se nota en batalla) |
| Falange | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +13 | +10 | fuerte |
| Furia | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +4 | +0 | normal |
| Arietes reforzados | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Contrapesos | Armas y unidades | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Arsenal | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Lluvia de flechas | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +19 | +11 | fuerte |
| Jinetes veloces | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Tortuga | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +4 | normal |
| Frenesí | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +14 | +15 | fuerte |
| Gran ariete | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Trabucos | Armas y unidades | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Mercados | Comercio | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Moneda | Comercio | 1 | 20 | 0 / 2 / 8 | 3 |  |  |  |  | ⚠ muy fuerte |
| Mercado central | Comercio | 2 | 40 | 0 / 6 / 6 | 7 |  |  |  |  | fuerte |
| Rutas comerciales | Comercio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Caravanas | Comercio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Impuestos | Comercio | 2 | 40 | 0 / 1 / 1 | 40 |  |  |  |  | normal |
| Exportaciones | Comercio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Comercio fluvial | Comercio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Comercio maderero | Comercio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Mercado de trueque | Comercio | 3 | 60 | 0 / 10 / 10 | 6 |  |  |  |  | fuerte |
| Contabilidad | Comercio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Embajadas comerciales | Comercio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Banco | Comercio | 4 | 80 | 0 / 19 / 24 | 3 |  |  |  |  | ⚠ muy fuerte |
| Gremios mercantiles | Comercio | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Casa de moneda | Comercio | 4 | 80 | 0 / 2 / 8 | 10 |  |  |  |  | fuerte |
| Monopolio | Comercio | 4 | 80 | 2 / 4 / 6 | 13 |  |  |  |  | fuerte |
| Seguro mercantil | Comercio | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Bolsa imperial | Comercio | 5 | 100 | 0 / 33 / 48 | 2 |  |  |  |  | ⚠ muy fuerte |
| Gran compañía | Comercio | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Ruta de la seda | Comercio | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Cuarteles | Cuartel y entrenamiento | 1 | 20 | 0 / 0 / 0 | — |  |  | +0 | +0 | viene de inicio |
| Marcha forzada | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Cuartel de instrucción | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Entrenamiento continuo | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Lanceros | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +4 | normal |
| Mercenarios | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Levas | Cuartel y entrenamiento | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Campo de entrenamiento | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Estandarte | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Reservistas | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Veteranos de guerra | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +1 | +2 | situacional (no se nota en batalla) |
| Intendencia militar | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Campeones | Cuartel y entrenamiento | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Marcha relámpago | Cuartel y entrenamiento | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Guardia de élite | Cuartel y entrenamiento | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Mando | Cuartel y entrenamiento | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Ejército permanente | Cuartel y entrenamiento | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Veteranos | Cuartel y entrenamiento | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Fortificaciones | Defensa | 1 | 20 | 0 / 0 / 0 | — |  |  | +0 | +0 | viene de inicio |
| Fortificación II | Defensa | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +31 | ⚠ muy fuerte |
| Guardia ribereña | Defensa | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Trampas | Defensa | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Fortificación III | Defensa | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +44 | ⚠ muy fuerte |
| Capital fortificada | Defensa | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Ingenieros militares | Defensa | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Torres de vigilancia | Defensa | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +44 | ⚠ muy fuerte |
| Murallas altas | Defensa | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Carga en la pradera | Defensa | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +3 | normal |
| Fortaleza de montaña | Defensa | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +1 | situacional (no se nota en batalla) |
| Ciudadela | Defensa | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Embajadores | Diplomacia e imperio | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Censo | Diplomacia e imperio | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Ofrendas | Diplomacia e imperio | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Capital próspera | Diplomacia e imperio | 2 | 40 | 4 / 4 / 4 | 10 |  |  |  |  | fuerte |
| Diplomacia tribal | Diplomacia e imperio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Aliados de ultratumba | Diplomacia e imperio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Tratados de paz | Diplomacia e imperio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Graneros comunes | Diplomacia e imperio | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Anexión a distancia | Diplomacia e imperio | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Cultura tribal | Diplomacia e imperio | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Maestros de la paz | Diplomacia e imperio | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Corte imperial | Diplomacia e imperio | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Exploradores | Guerra y conquista | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Caminos militares | Guerra y conquista | 1 | 20 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Emboscada en el bosque | Guerra y conquista | 2 | 40 | 0 / 0 / 0 | — |  |  | +2 | +0 | situacional (no se nota en batalla) |
| Saqueo | Guerra y conquista | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Botín | Guerra y conquista | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Guarniciones | Guerra y conquista | 2 | 40 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Prisioneros | Guerra y conquista | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Moral | Guerra y conquista | 3 | 60 | 0 / 0 / 0 | — |  |  | +2 | +3 | situacional (no se nota en batalla) |
| Contraespionaje | Guerra y conquista | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Suministros de campaña | Guerra y conquista | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Administradores | Guerra y conquista | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Caballería de llanura | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  | +2 | +0 | situacional (no se nota en batalla) |
| Asalto de colina | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  | +1 | +0 | situacional (no se nota en batalla) |
| Emboscadas | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Caballos de carga | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Reconstrucción | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Intimidación | Guerra y conquista | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Contraataque | Guerra y conquista | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Guerra relámpago | Guerra y conquista | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Imperio conquistador | Guerra y conquista | 5 | 100 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Almacenes | Logística | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Caminos | Logística | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Almacén de comida I | Logística | 2 | 40 | 0 / 0 / 0 | — | 60 |  |  |  | normal (almacén o crecimiento) |
| Almacén de producción I | Logística | 2 | 40 | 0 / 0 / 0 | — | 60 |  |  |  | normal (almacén o crecimiento) |
| Almacenes económicos | Logística | 2 | 40 | 0 / 0 / 0 | — | 60 |  |  |  | normal (almacén o crecimiento) |
| Intereses del almacén I | Logística | 2 | 40 | 0 / 0 / 0 | — | 60 |  |  |  | normal (almacén o crecimiento) |
| Camino civil I | Logística | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Camino militar I | Logística | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Almacén de comida II | Logística | 3 | 60 | 0 / 0 / -2 | — | 120 |  |  |  | normal (almacén o crecimiento) |
| Almacén de producción II | Logística | 3 | 60 | 0 / 0 / -2 | — | 120 |  |  |  | normal (almacén o crecimiento) |
| Red de caminos I | Logística | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Almacén de comida III | Logística | 4 | 80 | 0 / 0 / -2 | — | 180 |  |  |  | normal (almacén o crecimiento) |
| Almacén de producción III | Logística | 4 | 80 | 0 / 0 / -2 | — | 180 |  |  |  | normal (almacén o crecimiento) |
| Intereses del almacén II | Logística | 4 | 80 | 0 / 0 / -2 | — | 180 |  |  |  | normal (almacén o crecimiento) |
| Camino civil II | Logística | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Camino militar II | Logística | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Almacén de comida IV | Logística | 5 | 100 | 0 / 0 / -2 | — | 240 |  |  |  | normal (almacén o crecimiento) |
| Almacén de producción IV | Logística | 5 | 100 | 0 / 0 / -2 | — | 240 |  |  |  | normal (almacén o crecimiento) |
| Red de caminos II | Logística | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Talleres | Producción | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Herramientas | Producción | 1 | 20 | 0 / 2 / 3 | 7 |  |  |  |  | fuerte |
| Taller de herrería | Producción | 2 | 40 | 0 / 6 / 0 | 7 |  |  |  |  | fuerte |
| Ingeniería básica | Producción | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Carretillas | Producción | 2 | 40 | 2 / 4 / 5 | 8 |  |  |  |  | fuerte |
| Aprendices | Producción | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Terrazas | Producción | 2 | 40 | 2 / 5 / 5 | 8 |  |  |  |  | fuerte |
| Taller de armería | Producción | 3 | 60 | 0 / 10 / 2 | 6 |  |  |  |  | fuerte |
| Minería | Producción | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Taller de maquinaria | Producción | 4 | 80 | 0 / 21 / 12 | 4 |  |  |  |  | ⚠ muy fuerte |
| Ingeniería avanzada | Producción | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Línea de ensamblaje | Producción | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Gran manufactura | Producción | 5 | 100 | 0 / 41 / 34 | 2 |  |  |  |  | ⚠ muy fuerte |
| Maquinaria | Producción | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Bibliotecas | Saber | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Escritura | Saber | 1 | 20 | 1 / 3 / 3 | 7 |  |  |  |  | fuerte |
| Scriptorium | Saber | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Academias | Saber | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Calendario | Saber | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Escuelas | Saber | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Biblioteca abierta | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Intercambio académico | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Espionaje científico | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Atajo del sabio | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | sin efecto simulado |
| Observatorios | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Reservas de emergencia | Saber | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Archivo | Saber | 4 | 80 | 0 / 0 / 1 | 80 |  |  |  |  | débil |
| Universidades | Saber | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Astronomía | Saber | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Método científico | Saber | 4 | 80 | 1 / 3 / 3 | 27 |  |  |  |  | normal |
| Fortuna del temerario | Saber | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Resistencia climática | Saber | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Gran biblioteca | Saber | 5 | 100 | 0 / 0 / 3 | 33 |  |  |  |  | normal |
| Pronóstico | Saber | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Enciclopedia | Saber | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospitales | Sanidad y población | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | viene de inicio |
| Parteras | Sanidad y población | 1 | 20 | 0 / 0 / 0 | — |  | 1 |  |  | normal (almacén o crecimiento) |
| Hospital civil I | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospital militar I | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Familias numerosas | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  | 1 |  |  | normal (almacén o crecimiento) |
| Medicina popular | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Colonos | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Memoria del pueblo | Sanidad y población | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospital civil II | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospital militar II | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Migraciones guiadas | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Pobladores resistentes | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Medicina avanzada | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Servicio médico de campaña | Sanidad y población | 3 | 60 | 0 / 0 / 0 | — |  |  | +0 | +0 | situacional (no se nota en batalla) |
| Hospital civil III | Sanidad y población | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospital militar III | Sanidad y población | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Planificación urbana | Sanidad y población | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Raíces profundas | Sanidad y población | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Hospital imperial | Sanidad y población | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Edad de oro | Sanidad y población | 5 | 100 | 0 / 0 / 0 | — |  | 42 |  |  | normal (almacén o crecimiento) |
| Cuadrillas de obra | Urbanismo | 1 | 20 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Gremios de ingenieros | Urbanismo | 2 | 40 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Logística de obra | Urbanismo | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Canteras de colina | Urbanismo | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Reciclaje | Urbanismo | 3 | 60 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Andamios | Urbanismo | 3 | 60 | 1 / 3 / 6 | 10 |  |  |  |  | fuerte |
| Grandes obras | Urbanismo | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Grúas | Urbanismo | 4 | 80 | 1 / 3 / 6 | 13 |  |  |  |  | fuerte |
| Estandarización | Urbanismo | 4 | 80 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Maravillas | Urbanismo | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Canteras reales | Urbanismo | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Guardianes de la maravilla | Urbanismo | 5 | 100 | 0 / 0 / 0 | — |  |  |  |  | situacional (no medible así) |
| Dominio del terreno | Urbanismo | 5 | 100 | 2 / 5 / 5 | 20 |  |  |  |  | normal |
