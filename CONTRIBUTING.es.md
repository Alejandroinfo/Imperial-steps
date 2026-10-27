# Cómo colaborar

🇬🇧 [Read in English](CONTRIBUTING.md)

## Reglas del juego

`docs/Reglas_v0.1.md` es la **fuente de verdad**. Cada punto lleva un estado:

- ✅ **Decidido**: no se cambia sin conversarlo antes.
- 💡 **Propuesta**: se puede discutir y probar.
- ❓ **Por definir**: falta una decisión.

Si un cambio de código cambia una regla, el mismo cambio actualiza el documento de reglas. Los pendientes están numerados (sección 20); al cerrar uno, se menciona por su número.

## Flujo de trabajo

Se trabaja directo en `main`, sin ramas ni *pull requests*: el proyecto es chico y lo lleva sobre todo una persona.

1. Si quieres, abre un *issue* para anotar un problema o una idea (qué pasa, qué esperabas, en qué mapa).
2. Haz commits pequeños con mensajes que digan qué cambia: «Panel de zona: nombre y presencia en una línea».
3. Antes de subir, corre `npm test` y `npm run check` (tipos), y abre `index.html` para probar lo que cambiaste.
4. Sube a `main`. Si algo se rompe, se arregla con un commit nuevo.

## Dónde va cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Un número de balance (costo, fuerza, comida) | `js/config/reglas.js` |
| Lo que hace una tecnología | `js/config/efectos_tecnologias.js` y, si cambia el texto, `js/datos/tecnologias.js` |
| Cómo se resuelve algo del juego | `js/motor/` |
| Cómo se ve o se usa algo | `js/interfaz/` y `css/estilos.css` |

El motor (`js/motor/`) **no puede** usar nada de la interfaz ni del navegador (`document`, `window`, `ui`). Así se puede probar en Node y pasar a Python sin reescribir las reglas.

## Estilo

- Todo en español, incluidos los nombres de reglas y tecnologías.
- Interfaz clara antes que detallada: el juego se decide en segundos.
- Si una cifra es una estimación, se dice.
