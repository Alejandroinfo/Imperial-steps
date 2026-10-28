# Changelog

All notable changes, newest first. The game and the design documents are in Spanish; this log is in English.

## Unreleased
- **Who works in buildings**: Mill → farmers, Workshop → engineers, Market → traders, Library → scientists; Storehouse, Road and Hospital accept any civilian (`BLD_WORKER`). Specialist buildings are staffed first. Over 24 bot games at step 60: population 18.5 → 16.1, gold 248 → 199.
- **Map header removed**: the *My capital / Chosen zone / Whole map* buttons and the help text are gone; the two view modes are small icons in the map corner; **C** and **F** center on your capital / fit the whole map.
- **Network plan is now usable**: zoom (wheel, ＋/－), drag, arrows/WASD and centering on zones (new `js/interfaz/mapa/plan.js`).
- **Tabs are icons** (the name only on the selected one; icons only on narrow screens); alerts are shorter (max 2).
- **Compact panels**: zone summary (four chips + one growth line), send-resources form (fits without scrolling), single comparative Victory chart (you and your neighbours; "see all" adds the rest).
- **Tribe requests** moved out of the zone tab to one line each at the top of *Empire* (with pay buttons); the tribe card in its zone is much shorter.
- **Ctrl+Z / "Undo"** removes the last order of the step.
- **Interface**: new *Resources* tab (auction, wonders, map resources) so *Empire* is no longer an endless scroll; auction shown as bronze/silver/gold chests with ＋/－ bids and the rules moved to the help icon; the story is a one-line card; wonders are cards with their own illustration (12) and a green ✓ icon instead of the word "free"; **Tab** / **Shift+Tab** cycle through your zones keeping the current sub-tab.
- **Bots propose trades**: every 8 steps (staggered per bot), from step 24, with 50 % chance, a bot offers up to 30 % of what it holds most of and asks for something of equal or greater value in what it holds least (rounded up); never with the currency of the upcoming auction. Measured over 24 bot games of 85 steps: 251 offers, 70 closed, none losing value (`botTradeOffer`, `OFFER_BOT_*`).
- **Tribe events reworked**: *Tribal unrest* and *Tribal fury* are removed. Instead every tribe grows by itself at the start of each year (from year 2): +1 civilian of its trade and +2 barbarians (berserkers) (`TRIBE_YEAR_CIV`, `TRIBE_YEAR_BAR`, `tribesGrow`). Measured over 24 bot games of 85 steps: people per tribe at step 80 2.7 → 18.3, unclaimed tribes at step 80 3.6 → 5.0, battles per game 6.3 → 8.7. Only *Tribal request* and *Tribal exodus* remain as yearly tribe events.
- Bot auction bids now use a variance of 10 (was 3).
- **Bots bid the expected value of each auction lot**: every lot has an estimated value in "gold equivalent" computed only from what is public at the announcement (category and tier; for the resource cargo it averages the range and both resources), and bots bid it plus noise with variance 10 (`AUCTION_BOT_VAR`), never more than 60 % of what they hold in that currency. Before, bots spread a random share of their funds.
- **Auctions are announced 10 steps ahead** (`AUCTION_NOTICE`, was 2) so the currency can be saved; bots now reserve it while deciding, put zones on "Save" (food) or pause construction (production), and undo it afterwards. Measured over 96 auctions: lots without any bid 40 → 3 of ~288; median food held at the auction 10 → 64, production 106 → 134.
- **The resource cargo is variable**: players see only a range per tier (20–40, 40–70, 70–110; same means as before) and not which resource it is.
- **Flood lasts the rest of the year**: on its first step stored food and production are halved, and until the year ends storehouses in affected zones hold half (`z.ev.flooded` in `capStore`). Shown as a year badge.
- **Downloadable game log**: the History tab and the end-of-game dialog offer a readable `.txt` and a `.json` (map, players, seed, final victory conditions, full history, time-to-ready and orders per step). New pure module `js/motor/registro.js`; 2 rule tests and 5 browser checks.
- **Technology spreadsheet synced with the game**: `Tecnologias_v0.2.xlsx` now has the 209 technologies (6 added, 26 texts and 4 ratings updated, formulas and filters extended; 0 formula errors).
- **Repository cleanup**: removed 33 stale copies of source, docs and audio files that had been uploaded to the repository root by mistake (the game only uses `index.html`, `js/`, `css/`, `audio/`, `docs/`), and moved the CI workflow to `.github/workflows/pruebas.yml`, where GitHub Actions actually reads it. Also removed the per-session handoff notes (`docs/TRASPASO_sesion_*.md`, already merged into the main handoff), the v0.11 economy report `docs/balance_economia.md` (outdated) and eight unused functions/constants.
- **Recruit instead of converting civilians**: troops are now recruited in a Barracks paying production, food and gold (one per level per step; *Levas* adds one). A civilian you choose can instead be promoted to **general** (stronger, last of its type to die, leads its group, extra gold pay). Maintenance is food plus a per-type gold pay for some units. Disbanding troops refunds part of the production; only generals can return to civilian life. The Economic victory counts civilians only. Bots recruit in Barracks too (measured: battles per 80-step game 2.0 → 9.4).
- **Repopulation**: when a civilian or general born in a zone by its own growth dies or is captured, the next growth of that zone costs 50 % less (two deaths → the next two). Captured people, encounter/auction recruits, tribes' people and recruited troops do not count; migration does not either.
- Bots now promote generals (0.44 per player by step 80) and *Elite guard* works (+1 defense to troops working in that Barracks).
- **Six new technologies and eight reworked** to fit (209 in total).
- **Train who you choose**: the Military tab now has troop cards and a picker of people with their health/strength traits and a "fighting aptitude" score ("the N most apt" shortcuts); you can also drag people to a new "Army" station in the Population tab. The `train` order carries the chosen `ids`. Without a choice, the most apt people go first (instead of the first in the list).
- **Alerts instead of the suggestions bar**: a ❗ on the tab (and on the zone sub-tab) where something needs attention, with the short list at the top of that tab; new alert when a rival is close to winning.
- **Year events as badges** with a hover card (name, effect, terrains, a bar of the year and the steps left).
- **Battle as a map**: the battle viewer shows a battlefield with both armies in formation, lunges, flying arrows and stones, damage numbers and fallen troops.
- **Smaller map labels**: move arrow, zone plates, order labels and resource tags are smaller and scale less when zooming out.
- **Several stories per game**: each player now lives stories one after another (never repeating, chosen from the 20), with a 6–10 step break between them and at most 4 per player. Measured with bots: 2 stories by step 60, 3 by step 80, 4 by step 130.
- **More content**: 20 stories of 4 chapters with branches (17 new, in `js/datos/historias_extra.js`), 40 base encounters with 86 variants of who arrives (20 new with 43 variants) and 20 choose-one-of-two encounters with 40 variants (14 new; the 6 existing ones got a second variant where they had one). New content is a bit more generous than the original (median value/cost 2.2–2.5 vs 2.0–2.2); extremes were trimmed. Catalogs in `docs/historias.md` and `docs/encuentros.md`, generated by `node herramientas/generar_catalogo.js`. New tests play every story through both paths.
- **Years instead of single-step events**: 1 step = 1 month, 12 = 1 year. Year 1 is a calm founding year. From year 2 every year has a certain part (Prosperity +15 % or Scarcity −15 % of what is produced) and a variable part (an event of the same sign, e.g. Inspiration gives an extra for science), both lasting the whole year. One-step "happenings" (a tribe event, floods in bad years) stay instant. Active events show in the top bar with the steps left, next to year and month. The separate event-timing RNG keeps dice and everything else unchanged.
- **Tribes**: requests every 8 steps (was 5); after you fulfil one, that tribe leaves you alone for 12 steps. Relationship now runs from −3 to +3: fulfilling a request raises it by 1, ignoring one lowers it by 1, and at −3 ("dissatisfaction 3") the tribe declares war for 5 steps. Requests show a countdown and what would happen to your relationship; tribes show "next request in N steps". Fixed UI text that wrongly said unpaid requests lead to an invasion; "Tribute demand" event renamed "Tribe request".
- **Growth cost is now n²**: growing a zone to size *n* costs *n × n* (3rd = 9, 4th = 16, 10th = 100). Bots' average population at step 60 drops about 20 % (13.5 → 10.5 in our test set).
- **Building workers scale with level**: 2 per level (level 1 = 2, level 2 = 4, level 3 = 6…), plus 1 each from Scaffolding and Cranes (`WORKERS_PER_LEVEL`, `bldSlots`).
- **Silver and gold deposits**: almost every zone has a silver deposit (normal effect, yields +1 up to +2); one in three also has a gold deposit (double effect, yields +2 up to +5). Capitals only get silver, danger zones none. Deposits show as badges (like traits) with a hover card and a description card for explorers. Deposit assignment uses its own RNG so it does not change anything else in a game.
- **Offers between players**: from the Empire tab you can offer resources and say what you want back. What you offer is held in reserve; the other player gets it as a "deal" encounter. Accepted = trade; rejected, ignored or expired (4 steps) = refunded. Bots evaluate offers by value.
- **Encounters as a pop-up** (they no longer take space in the panel; "decide later" leaves a pill), main tabs no longer collapse on mid-size screens, suggestions are capped at 2 lines, intro message and banners dismiss on click.
- **Victory tab shows your neighbours' progress** (nearest rivals) with progress bars and a "close to winning" warning.
- **Step scenes**: after a step resolves the camera visits up to three key moments (battles, conquests, finished buildings/wonders, your new technologies) and returns; any click cancels it.
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
