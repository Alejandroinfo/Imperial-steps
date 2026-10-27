# Contributing

🇪🇸 [Leer en español](CONTRIBUTING.es.md)

## Game rules

[`docs/Reglas_v0.1.md`](docs/Reglas_v0.1.md) is the **source of truth** for the rules (in Spanish). Every point carries a status:

- ✅ **Decided**: do not change it without discussing it first.
- 💡 **Proposed**: open for discussion and testing.
- ❓ **Open**: a decision is still missing.

If a code change changes a rule, the same pull request updates the rules document. Open questions are numbered (section 20); when one is closed, refer to it by number.

## Workflow

1. Open an *issue* describing the problem or idea (what happens, what you expected, on which map).
2. Create a branch from `main` with a short name: `interfaz/tech-panel`, `motor/demobilize-troops`, `reglas/open-26`.
3. Make small commits with messages that say what changes: “Zone panel: name and presence on one line”.
4. Before pushing, run `npm test` and `npm run check` (TypeScript), and open `index.html` to try what you changed.
5. Open a *pull request* to `main`, link the issue and explain what you tested.

## Where things live

| I want to change… | File |
|---|---|
| A balance number (cost, strength, food) | `js/config/reglas.js` |
| What a technology does | `js/config/efectos_tecnologias.js` and, if the text changes, `js/datos/tecnologias.js` |
| How the game resolves something | `js/motor/` |
| How something looks or is used | `js/interfaz/` and `css/estilos.css` |
| A rule-level test | `pruebas/probar_reglas.js` |
| The shape of the game state or a new order | `js/tipos.d.ts` (the type check will point to every place that must change) |

The engine (`js/motor/`) **must not** use anything from the interface or the browser (`document`, `window`, `ui`). That keeps it testable in Node and portable to Python without rewriting the rules. `pruebas/revisar_capas.js` enforces it.

## Style

- The game and the design documents are in Spanish (the game is made for our family); the README and this guide are in English for anyone visiting the repository.
- Clarity over detail in the interface: each step is decided in seconds.
- If a number is an estimate, say so.
