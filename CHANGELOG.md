# Changelog

All notable changes, newest first. The game and the design documents are in Spanish; this log is in English.

## Unreleased
- **Living villages** (`js/interfaz/vida.js`, interface only): every person on the map has their own routine by trade and temperament: farmers till the field and carry sacks to the mill, engineers hammer and haul logs and stone, scientists read and tinker, merchants tend the stall, villagers wander, chat in pairs, sit or go indoors, soldiers spar, patrol and stand guard, archers shoot at a target. Hungry people slump and ask for bread; wounded ones walk slower. Only visible zones animate, and it stops with effects off.
- **Warmer traits**: drawn badges with level dots instead of emoji chips, a name and a nickname per person ("Mano verde", "Pulgar negro"), a small hover card instead of long tooltips, and star/medal counts in the zone summary.
- **Moving and sending without dropdowns**: neighbour zones are cards; the move form uses +/- steppers per trade, quick buttons (all / troops only / nobody), a big Peace/Attack switch and chips for the Barracks extra hop. Sending resources is one card: resource, destination tiles, amount chips, and a "once / every step" switch that merges one-off sends and automatic routes.
- New `pruebas/probar_interfaz.py` browser smoke test.
- **Compact top**: the title, turn status, Ready button and Guide/Menu share one row, the view buttons and the hint share another, and the map gets the freed height (about 70 px more). Panel tabs shrink their text on narrow panels so they stay on one row.
- **Compact side panel**: the main tabs fit on one row (they scroll sideways if the panel is narrow), the zone sub-tabs stay at the top while you scroll, and the Population view is shorter (smaller stations and tokens; the long trade descriptions moved into the hover text).
- **Four-chapter stories**: each player lives one of three stories per game (The lost caravan, The valley's teacher, The heir without a throne). Chapters arrive as encounters with 2 or 3 options plus "let it pass" (no cost, no penalty); what you pick changes the next chapter and the ending. New rewards: tribe relationship, an extraordinary settler, a free technology, a ready-made building, a temporary strategic resource. Full text in `docs/historias.md`. This completes everything planned in rules 13.3.
- **Sealed-bid auction** every 20 steps, announced 2 steps ahead. Currency is gold, science, or food/production taken in equal percentage from every zone holding it. Five categories (platoon, extraordinary settler, knowledge, cargo that can go straight into your capital's growth, a 40-step strategic resource) with a visible bronze/silver/gold tier but no details. Highest bid wins, ties all win, losers pay nothing. Bots bid.
- **Danger zones (zonas peligrosas)** replace the frontier zones: only troops count, the bonus is higher (8 gold alone, 6 each when sharing in peace), it grows 10 % per consecutive step up to double while you keep troops there (it restarts if you lose your presence), and 2-player maps get a second one. Bots station soldiers there instead of civilians.
- **Choose-one-of-two encounters**: one in three encounters offers two deals; take one or none, no penalty.
- **Tribes**: every 5 steps a tribe asks its neighbours for something related to its trade; fulfilling it raises your relationship (0 to 3) and at 3 you can annex it. Refusing has no penalty. Attacking a tribe is war: its civilians become warriors and attack your nearest zones for 5 steps or until you conquer it.
- **Unique wonders**: 12 wonders, one per branch, each existing once per game. The level-5 spine technology of a branch only unlocks it; the effect comes from the wonder while you hold its zone (and passes to a conqueror). Starting one is announced to everyone and listed in the Empire tab as a race; whoever finishes first keeps it, the others lose the build and get half of the production back, and keep the technology (it counts for the technology victory). Ties go to whoever could put more production into it that step. Camino, Hospital and Fortification now top out at level 4 (level 5 comes with the wonder). Bots start wonders too.
- **Automatic engineers**: the builder job is gone (5 civilian jobs) and the Industrial zone merged into Production. If a zone has a build queued, its engineers (2 each) and settlers (1 each) build on their own using the zone's stored production; the rest produce. Guilds of Engineers and Great Works now give build discounts. The zone summary shows who is building.
- **Music**: background music from `audio/` (menu, two planning pieces that alternate with a 2 s crossfade, a battle loop, and short stingers for resolving a step and for winning), with its own volume (30 % by default) and mute, remembered in the browser. It ducks under stingers and pauses when the tab is hidden; the game works the same without the files. Credits and licence notes in `docs/audio.md`.
- **Traits, phase C**: Health (+/-1 or 2 life) and Strength (+/-1 or 2 dice) for combat, always whole numbers.
- **Zone life**: particles rising from a zone in the colour of what it produced, sparks on active builds, a pause badge, a hunger warning and gold or silver rings around people with good traits; the zone summary counts them.
- **Traits for people**: every civilian has 2 traits (very bad, bad, good, very good) that change what it produces in one job (farming, engineering, trade, science) or how much it eats. Good traits are drawn with a silver border and very good ones with a gold border, with an icon and a tooltip. The player chooses whom to specialize, one person at a time (click or drag).
- **Build split**: stored production plus what the others produce decides who builds; when the balance is negative the best producers produce first (half and half at equal efficiency).
- **Pause**: a button next to the current build pauses all builds in the zone so production is stored; "Pause growth" stores the food surplus.
- **Moving food from another zone now costs logistics gold** (distance, roads, caravans); without gold that food does not arrive.
- Fixed: a player could annex two tribes in one step paying more science than they had, ending with negative science.
- **Online multiplayer with Firebase Realtime Database**: one player creates a room and shares a 4-letter code or a link; 2 to 4 people can join and empty seats are played by bots. The host's browser runs the engine and, once everyone is ready, resolves the step and publishes the full game state, so every screen stays in sync. Anyone, including the host, can reload the page and rejoin their seat. The Firebase SDK is loaded only when playing online; games against bots still work offline. Setup guide in `docs/multijugador.md` (Spanish); security rules in `firebase/reglas_base_datos.json`.
- The seeded random generator exposes `state()`, so a game can be sent over the network and continued exactly.
- New tests: `pruebas/probar_red.js` (a game state sent over the network stays identical, 18 cases, part of `npm test`) and `pruebas/probar_en_linea.py` (a two-browser online game against a fake Firebase, no internet needed).

## 0.13
- **Supply lines**: outside your own territory, troops only eat if there is a safe path of at most 2 zones to a zone of yours with food. Hungry troops fight with half their dice. Supply lines are drawn on the map (green, red, or a "no supply" warning), so cutting an enemy's route is now a real tactic.
- Training no longer requires barracks, so armies can appear earlier.
- **Founding era**: growth costs half until step 12, making the opening faster.
- Movement and shipping costs are shown explicitly (totals on the button, breakdown below, cost on the map arrow).
- Long side-panel sections are now collapsible and remembered.

## 0.12
- **Guided start**: the first 20 steps of a real game introduce one system per step (jobs, technology, buildings, expansion, frontier, victory, events, a first encounter, growth priority, barracks, research queue, resources, tribes, stance, shipments, soldiers, history, upgrades, combat). A coach card highlights the exact button; goals complete when the player does them, optional ones can be skipped. Then the game continues normally, with encounters.

## 0.11
- **Frontier zones** between neighbouring empires: no one can own them; everyone present earns 3 gold per step while at peace, or 4 if alone (a prisoner's dilemma). Tribes are no longer the only buffer between empires.
- **TypeScript checking** of the engine through `js/tipos.d.ts` and JSDoc (`npm run check`, also in CI). It found that wonders could not be built.
- Bots expand toward frontiers, station troops there and sometimes betray a shared frontier.
- Fixed: empty tribe zones now become free; tribute raids from empty tribes no longer crash.

## 0.10
- **Encounters**: unannounced offers and gambles (20 types, 43 variants) that scale with the game. Only opportunities: refusing has no downside.
- **Strategic resources** yield more the longer they are held (+1 to +4 per step).
- Technology panel recommends what helps most right now; branches have their own colour and icon; less text, more icons.

## 0.9
- Per-zone food priority (grow or store), automatic shipments between zones, and auto-specialization of newborns.
- Cheaper troops; smarter bots; balance scenario and technology rating tools.

## 0.8
- Procedurally generated sound effects and ambience (Web Audio); screen shake, dust, sparkles and confetti.
- Each technology previews its impact on your current situation.

## 0.7
- Battle replay viewer, blow by blow in initiative order. Buildings are built at the highest unlocked level.

## 0.4 – 0.6
- Project split into layers (`data → config → engine → interface`) with tests and CI.
- Map redrawn as a continuous valley (fences where there is a road, ravines where there is not).
- Zone summary showing who works where; stance is now between players instead of per zone; automatic feeding from the nearest zone; storage scales with zone size; recoverable military equipment.

## 0.3
- First playable prototype in a single HTML file: 12 maps, 203 technologies, combat, tribes, events and 7 victory conditions.
