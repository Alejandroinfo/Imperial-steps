// Tipos de Los Pasos del Imperio.
// Este archivo no se carga en el navegador: lo usa TypeScript para revisar el motor (`npm run check`).
// Describe la forma de cada pieza del juego; si una regla nueva usa un campo que no existe o una orden
// que el motor no atiende, el revisor lo marca antes de jugar.

/** Índice de un jugador (0..N-1). La tribu usa el índice TRIBE (4). */
type Jugador = number;
/** Índice de una zona en `Partida.zones`. */
type ZonaId = number;
type Terreno = 'mon' | 'pra' | 'bos' | 'rio' | 'col' | 'lla';
type Civil = 'pob' | 'agr' | 'ing' | 'cie' | 'com';
type Militar = 'sol' | 'arq' | 'cab' | 'esc' | 'ber' | 'ari' | 'lan';
type TipoUnidad = Civil | Militar;
type Recurso = 'food' | 'prod' | 'gold' | 'tech';
type TipoEdificio = 'almacen' | 'camino' | 'hospital' | 'cuartel' | 'fort' | 'molino' | 'taller' | 'mercado' | 'biblio' | 'mar';
type Postura = 'paz' | 'alerta';

interface Unidad {
  t: TipoUnidad;
  hp: number;        // vida actual
  w: number;         // heridas (pasos para curarse)
  str: number;       // fuerza = dados
  busy: number;      // 1 si cambió de oficio este paso (no produce)
  mv: number;        // 1 si se movió este paso (no produce)
  hg: number;        // pasos con hambre
  need?: number;     // comida que necesita este paso
  id?: number;       // identificador de la persona (para elegirla)
  tr?: { k: string; l: number }[];   // rasgos: k = agr|ing|com|cie|apt, l = -2, -1, 1 o 2
  half?: number; mit?: number; cabhp?: number; brea?: number; cb?: number; dead?: number;
}

interface Edificio { t: TipoEdificio; l: number; s: string | null; wk: number; cost: number; dup?: number; w?: string; }
interface Proyecto { k: 'b' | 'u' | 'w'; w?: string; prev?: number; bt?: TipoEdificio; bi?: number; to?: number; left: number; tot: number; dup?: number; lvl?: number; spec?: string | null; }
interface EnvioAuto { to: ZonaId; res: 'food' | 'prod'; q: number | 'sobrante'; }

interface Zona {
  id: ZonaId; sector: number; k: number;
  role: 'capital' | 'tribu' | 'vacia' | 'frontera';
  terrain: Terreno; x: number; y: number; adj: ZonaId[]; name?: string;
  owner: Jugador | null;
  size: number; food: number; prod: number; prog: number; grow: number;
  conflict: boolean; capital: boolean;
  units: { [f: number]: Unidad[] };
  att: { [f: number]: boolean };
  b: Edificio[]; proj: Proyecto[];
  res: string | null; tspec: Civil | null; tmult: number; tbase?: number; settled?: number;
  ev: { [k: string]: any };
  // economía de la zona
  growMode?: 'crecer' | 'guardar'; pauseBuild?: boolean; rel?: { [f: number]: number }; fh?: { [f: number]: number }; autoSpec?: Civil | null; routes?: EnvioAuto[];
  bplan?: {ing:number; pob:number; bonus:number; cap:number; work:number; stock:number; pot?:number; paused?:boolean; ids?:number[]} | null; resN?: number; resBonus?: number; rcap?: number; nres?: number;
  f0?: number; p0?: number; feedOut?: number;
  feed?: { [f: number]: { gold?: number; need: number; local: number; from: { [z: number]: number }; short: number; line: ZonaId | null } };
  last?: { food: number; prod: number; gold: number; tech: number };
  lastBy?: any; sp?: { spec: string; lvl: number; n: number };
  // equipo militar guardado y recursos estratégicos
  eq?: { [t: string]: number }; eqPend?: { [t: string]: number };
  resHeld?: number; resOwner?: Jugador | null; resGain?: { res: Recurso; n: number }; resO?: string | null; paidAt?: { [f: number]: number }; resGains?: { key: string; tier: string; res: Recurso; n: number }[];
  frontGain?: { [f: number]: number };
}

interface Oferta { id: number; from: Jugador; to: Jugador; give: { res: Recurso; n: number }; ask: { res: Recurso; n: number }; step: number }
interface Encuentro {
  id: string; k: 'oferta' | 'apuesta' | 'eleccion' | 'historia' | 'trato'; offer?: Oferta; offerOk?: number; story?: { id: string; ch: number }; opts?: { lbl: string; t?: string; cost: { res: Recurso; n: number } | null; gain: any }[]; who: string; txt: string; zone: ZonaId; step: number; str: number;
  cost: { res: Recurso; n: number } | null;
  gain: { units?: { [t: string]: number }; res?: Recurso; n?: number; eq?: { [t: string]: number }; prog?: number; gamble?: { p: number; res: Recurso; n: number }; rel?: number; tpob?: { k: string; l: number }[]; saber?: number; bld?: TipoEdificio; tres?: { key: string } } | null;
  refuse: any;
}

interface EstadoJugador {
  gold: number; tech: number;
  techs: { [nombre: string]: number };
  out: boolean; ghost: boolean; ally: Jugador | null; req: Jugador | null;
  lastAvoid: number; notes: string[];
  rq: { name: string; left: number; tot: number }[]; rcap: number; rspent?: number;
  stance: { [otro: number]: Postura };
  enc: Encuentro | null; encNext?: number; caravanUsed?: number; story?: { id: string; ch: number; next: number; tags: string[]; done?: number; nextNew?: number }; stories?: number; storyUsed?: string[]; tres?: { key: string; until: number }[];
}

interface Partida {
  nid: number; mapIdx: number; N: number; seed: number; rng: () => number;
  zones: Zona[]; map: { n: any[]; e: [ZonaId, ZonaId][] };
  step: number; over: boolean; winner: Jugador[]; thr: string;
  F: EstadoJugador[]; M: any[];
  hist: { step: number; ev: string | null; lines: string[] }[];
  log: string[]; logNow?: string[]; fx?: any[];
  evq: { step: number; id: string; dur?: number }[]; evNow?: { step: number; id: string; dur?: number } | null; evAct?: { id: string; start: number; end: number; avoid?: { [f: number]: number } }[]; evGen?: { yr: number; signs: number[]; s: number };
  offers: Oferta[]; offerSeq?: number;
  tributes: { zone: ZonaId; amount: number; due: number; paid: { [f: number]: number }; targets: Jugador[]; res: Recurso }[];
  battles?: any[]; logiMult: number; fever?: number; growHalfEv?: number;
  wars: { tribe: ZonaId; f: Jugador; left: number }[];
  auction: { step: number; cur: Recurso; items: { cat: string; tier: number; det: any }[]; bids: { [f: number]: { [i: number]: number } } } | null;
  tele: any; vic?: any; lay?: any;
}

/** Todas las órdenes que puede dar un jugador en un paso. `f` es quien la da. */
type Orden = { f?: Jugador } & (
  | { t: 'research'; name: string }
  | { t: 'cancelres'; name: string }
  | { t: 'stance'; target: Jugador; stance: Postura }
  | { t: 'spec'; zone: ZonaId; from: Civil; to: Civil; n: number; ids?: number[] }
  | { t: 'demob'; zone: ZonaId; u: Militar; to: Civil; n: number }
  | { t: 'train'; zone: ZonaId; u: Militar; n: number; from?: 'pob' | 'sol' }
  | { t: 'build'; zone: ZonaId; bt: TipoEdificio; spec?: string | null }
  | { t: 'wonder'; zone: ZonaId; w: string }
  | { t: 'upgrade'; zone: ZonaId; bi: number }
  | { t: 'bspec'; zone: ZonaId; bi: number; spec: string }
  | { t: 'demolish'; zone: ZonaId; bi: number }
  | { t: 'send'; from: ZonaId; to: ZonaId; res: 'food' | 'prod'; q: number; auto?: number }
  | { t: 'route'; from: ZonaId; to: ZonaId; res: 'food' | 'prod'; q: number | 'sobrante' }
  | { t: 'growmode'; zone: ZonaId; mode: 'crecer' | 'guardar' }
  | { t: 'pausebuild'; zone: ZonaId; on: boolean }
  | { t: 'autospec'; zone: ZonaId; to: Civil | null }
  | { t: 'tribute'; tribe: ZonaId; from: ZonaId }
  | { t: 'ally'; target?: Jugador; off?: number }
  | { t: 'offer'; to: Jugador; give: { res: Recurso; n: number }; ask: { res: Recurso; n: number } }
  | { t: 'annex'; zone: ZonaId; from: ZonaId }
  | { t: 'move'; from: ZonaId; to: ZonaId; u: { [t: string]: number }; stance: 'paz' | 'ataque'; via?: ZonaId[] }
  | { t: 'encounter'; choice: 'si' | 'no' | 'a' | 'b' | 'c' }
  | { t: 'bid'; item: number; amount: number }
);
type TipoOrden = Orden['t'];
