# Cómo manejar el proyecto sin perder contexto

Guía corta de trabajo para *Los Pasos del Imperio*. Las partes entre corchetes se reemplazan.

⚠ **Quién escribe:** en este proyecto escribe siempre **Alejandro**, autor único del diseño y del código. Las preferencias de la cuenta de Claude están a nombre de otra persona (Pao); no la confundas con él, no le atribuyas ideas, decisiones ni partidas de prueba, y háblale a Alejandro en masculino.

---

## 1. Monta el Proyecto una sola vez

En Claude, crea un Proyecto llamado **Los Pasos del Imperio** y sube como conocimiento del proyecto:

| Archivo | Para qué |
|---|---|
| `docs/TRASPASO_Los_Pasos_del_Imperio.md` | El resumen de todo: idea, reglas, decisiones técnicas, qué falta |
| `docs/Reglas_v0.1.md` | La fuente de verdad de las reglas |
| `Tecnologias_v0.2.xlsx` | Las 203 tecnologías |
| `dist/Los_Pasos_del_Imperio.html` | El juego actual en un solo archivo (se genera con `python herramientas/empaquetar.py`) |
| `atlas_mapas.html` | El atlas de los 12 mapas |

El código completo está en **github.com/Alejandroinfo/Imperial-steps**.

En las **instrucciones del proyecto** pega esto:

> Trabajamos en *Los Pasos del Imperio*, un juego de territorios con planificación simultánea por pasos. Antes de responder, lee el documento de traspaso y las reglas que están en el conocimiento del proyecto; son la fuente de verdad y mandan sobre cualquier conversación.
>
> Reglas de trabajo:
> - No cambies nada marcado como ✅ decidido sin avisarme primero.
> - Distingue siempre lo decidido (✅), lo que propones tú (💡) y lo que falta definir (❓).
> - Si una cifra es una estimación tuya, dilo.
> - Todo en español, incluidos nombres de reglas y tecnologías.
> - Los números de balance van en tablas de configuración, no dentro del código.
> - Valida por código lo que se pueda (mapas, árbol de tecnologías, costos) antes de darlo por bueno.
> - Objetivo del diseño: sencillez y planificación en grupo con presión de tiempo, **sin micromanagement**. Si una propuesta añade complejidad, dilo.

---

## 2. Abre un chat por tema

Un chat largo se llena y se vuelve lento. Usa uno por tema:

- Reglas y balance
- Prototipo y errores
- Arte y estilo
- Tecnologías
- Mapas
- Paso a Python y multijugador

**Mensaje para empezar cualquier chat:**

> Hoy quiero trabajar en **[tema]**. Lee primero el traspaso y las reglas del proyecto. Dime qué entendiste del estado actual de ese tema en 5 líneas antes de proponer nada.

Ese resumen de 5 líneas te sirve para comprobar de un vistazo que no se perdió contexto.

---

## 3. Plantillas para pedir cosas

**Cambiar una regla**
> Quiero cambiar **[regla]** a **[nuevo valor]**. Antes de aplicarlo: dime qué otras reglas o números se ven afectados, y si rompe algo que ya estaba decidido. Luego aplícalo en las reglas y en el prototipo, y actualiza los pendientes.

**Arreglar algo del prototipo**
> En el prototipo, cuando hago **[acción]**, pasa **[lo que pasa]** y esperaba **[lo que esperaba]**. Pruébalo tú en el navegador antes de decirme que está arreglado, y dime qué probaste.

**Pedir una propuesta de diseño**
> Propón 3 formas de resolver **[problema]**, con sus ventajas y desventajas y cómo afecta a la sencillez del juego. No apliques nada hasta que yo elija.

**Revisar balance**
> Corre simulaciones de **[cuántas]** partidas y dime: cuánto duran, quién gana, con qué combinación de condiciones y qué números se ven rotos. Sin cambiar reglas todavía.

**Cerrar la sesión (hazlo siempre)**
> Actualiza `Reglas_v0.1.md` y `TRASPASO_Los_Pasos_del_Imperio.md` con lo que decidimos hoy: marca lo nuevo, cierra los pendientes resueltos y agrega los nuevos. Dime en una lista corta qué quedó sin resolver.

Después **reemplaza los archivos** en el conocimiento del proyecto por los actualizados. Es el paso que más se olvida y el que más contexto salva.

---

## 4. Cuando un chat se esté llenando

> Voy a continuar en una conversación nueva. Actualiza el documento de traspaso con todo lo de este chat y dame un resumen de 10 líneas de dónde quedamos, qué estaba a medias y qué sigue.

---

## 5. Buenas costumbres

- **Sube archivos en vez de pegar código.** Ocupa menos y se lee mejor.
- **Guarda versiones.** Cuando algo cambie mucho, pide un número nuevo (`Reglas_v0.2.md`) y conserva el anterior.
- **Prueba antes de decidir.** Muchas preguntas de balance solo se contestan jugando.
- **Anota por qué, no solo qué.** El traspaso tiene una tabla de decisiones con su razón; mantenerla evita repetir discusiones.
- **Un pendiente, un número.** Los pendientes de las reglas están numerados; al cerrarlos, menciónalos por número.

---

## 6. Qué hacer ahora mismo (sugerencia)

1. Juega 2 o 3 partidas del prototipo y anota lo que se sienta pesado, confuso o aburrido.
2. Abre un chat de «Reglas y balance» y cuenta eso.
3. Prioriza: si el problema es que hay demasiadas decisiones por paso, lo siguiente es **quitar**, no agregar.
4. Cuando el núcleo se sienta bien, pasa el motor a Python con pytest y arranca el simulador de balance.
