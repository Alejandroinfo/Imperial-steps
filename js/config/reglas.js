'use strict';
// Constantes del juego: jugadores, terrenos, unidades, costos, edificios, recursos y eventos.
// Son los números de balance: cambiarlos aquí cambia el juego sin tocar el motor.

const TRIBE = 4;
const PLN = [
  {name:'Tú',        col:'#C8452F'},
  {name:'Bot azul',  col:'#2F7F8F'},
  {name:'Bot ocre',  col:'#D9A028'},
  {name:'Bot verde', col:'#5E8E3E'},
  {name:'Tribus',    col:'#8A5A3A'}
];
const TERRN = {mon:'Montañas',pra:'Praderas',bos:'Bosques',rio:'Ríos',col:'Colinas',lla:'Llanuras'};
const RISK = {mon:2,col:2,bos:1.5,rio:1.5,pra:1,lla:1};
const CIV = ['pob','agr','ing','cie','com'];
const MIL = ['sol','arq','cab','esc','ber','ari','lan'];
const UN = {pob:'Poblador',agr:'Agricultor',ing:'Ingeniero',cie:'Científico',com:'Comerciante',
            sol:'Soldado',arq:'Arquero',cab:'Caballero',esc:'Escudero',ber:'Berserker',ari:'Ariete',lan:'Lanzapiedras'};
const UNP = {pob:'Pobladores',agr:'Agricultores',ing:'Ingenieros',cie:'Científicos',com:'Comerciantes',
            sol:'Soldados',arq:'Arqueros',cab:'Caballeros',esc:'Escuderos',ber:'Berserkers',ari:'Arietes',lan:'Lanzapiedras'};
// hp, fuerza (dados), ataque, defensa, iniciativa (menor actúa primero)
const UT = {
  pob:{civ:1,hp:3,str:1,atk:1,def:0,init:10},
  agr:{civ:1,hp:3,str:1,atk:1,def:0,init:10},
  ing:{civ:1,hp:3,str:1,atk:1,def:0,init:10},
  cie:{civ:1,hp:3,str:1,atk:1,def:0,init:10},
  com:{civ:1,hp:3,str:1,atk:1,def:0,init:10},
  sol:{hp:3,str:2,atk:1,def:0,init:5},
  arq:{hp:3,str:2,atk:1,def:0,init:1,ranged:1},
  cab:{hp:3,str:2,atk:2,def:0,init:3},
  esc:{hp:3,str:2,atk:1,def:2,init:8},
  ber:{hp:3,str:2,atk:3,def:0,init:6},
  ari:{hp:6,str:2,atk:2,def:1,init:7,siege:1},
  lan:{hp:4,str:2,atk:1,def:0,init:2,ranged:1,aoe:1,siege:1}
};
// Rasgos de las personas: cada civil nace con 2 rasgos distintos, de nivel -2 (muy malo), -1 (malo), +1 (bueno) o +2 (muy bueno).
// Lo más común es bueno o malo; los extremos son raros y en promedio hay más positivos que negativos.
// Cada nivel cambia un TRAIT_STEP (25 %) el rendimiento en lo que afecta el rasgo.
const TRAIT_KINDS = ['agr','ing','com','cie','apt','sal','fue'];
const TRAIT_ODDS = [[-2,0.08],[-1,0.32],[1,0.43],[2,0.17]];
const TRAIT_STEP = 0.25;
const TRAIT_INFO = {
  agr:{ic:'🌾',n:'Agricultura',d:'la comida que produce (como agricultor o como poblador sin oficio)'},
  ing:{ic:'⚒',n:'Ingeniería',d:'la producción que genera y lo que puede usar al construir (como ingeniero o poblador)'},
  com:{ic:'🪙',n:'Comercio',d:'el oro que genera como comerciante'},
  cie:{ic:'🔬',n:'Ciencia',d:'la ciencia que genera y lo que usa al investigar, como científico'},
  apt:{ic:'🍽',n:'Apetito',d:'cuánta comida consume (positivo: come menos)'},
  sal:{ic:'❤',n:'Salud',d:'los puntos de vida en combate (siempre números enteros)'},
  fue:{ic:'⚔',n:'Fuerza',d:'los dados de combate (siempre números enteros)'}
};
const TRAIT_LV = {'-2':'muy malo','-1':'malo','1':'bueno','2':'muy bueno'};
// ===== Reclutar (27/10/2026, decidido por Alejandro) =====
// Las tropas se RECLUTAN en un Cuartel pagando producción, comida y oro; ya no cuestan una persona. Cada Cuartel recluta
// RECRUIT_PER_LEVEL unidades por paso y por nivel. Aparte, un civil puede ascender a GENERAL (campeón): es más fuerte que una tropa normal
// y es el último en morir de su tipo en una pelea. El mantenimiento base es comida; algunas tropas pagan además oro.
// Parte del costo de producción de las tropas con arma es su EQUIPO (arco, escudo, caballo, hacha): si muere en tu territorio queda
// guardado en la zona y se reutiliza pagando solo el soldado.
const SOLDIER_COST = 2;                        // producción del soldado básico (el resto del costo de producción es el equipo)
const EQUIP_COST = {arq:3, esc:5, cab:7, ber:7};
const EQUIP_N = {arq:['arco','arcos'], esc:['escudo','escudos'], cab:['caballo','caballos'], ber:['hacha','hachas']};
const UNIT_COST = {   // por unidad reclutada: producción, comida y oro
  sol:{prod:2, food:2, gold:1}, arq:{prod:5, food:2, gold:2}, esc:{prod:7, food:2, gold:2},
  cab:{prod:9, food:3, gold:4}, ber:{prod:9, food:3, gold:3}, ari:{prod:10, food:2, gold:3}, lan:{prod:10, food:2, gold:3}};
const RECRUIT_PER_LEVEL = 1;
// Mantenimiento por paso (comida, y oro de «paga» para algunas). Dentro de tu territorio y con suministro; los que trabajan en un Cuartel no cuestan nada.
const UNIT_UPKEEP = {
  sol:{food:1, gold:0}, arq:{food:1, gold:0}, esc:{food:1, gold:0},
  cab:{food:2, gold:0}, ber:{food:1, gold:1}, ari:{food:1, gold:1}, lan:{food:1, gold:1}};
const CAMPAIGN_FOOD = 1.5;   // fuera de tu territorio (con suministro) la comida cuesta 1,5 ×; con «Suministros de campaña», 1 ×
// Generales (campeones): un civil que asciende. Más vida, fuerza y ataque; último en morir de su grupo; cobra una paga extra.
const GEN_HP = 2, GEN_STR = 1, GEN_ATK = 1, GEN_PAY = 1;
// Liderazgo: cada general vivo suma GEN_LEAD dado(s) a su grupo de tropas del mismo tipo (hasta GEN_LEAD_MAX generales por grupo).
const GEN_LEAD = 1, GEN_LEAD_MAX = 2;
// Repoblación (27/10/2026): cuando muere o es capturado un civil (o general) que nació en una zona, el próximo crecimiento de esa zona
// cuesta menos (REPOP_PCT); si mueren 2, los 2 siguientes, hasta REPOP_MAX. Solo cuentan los nacidos por crecimiento propio.
const REPOP_PCT = 0.5, REPOP_MAX = 8;
// Dar de baja a una tropa devuelve una parte de su producción; retirar a un general lo devuelve a ser civil.
const DISBAND_REFUND = 0.5;
// Almacenamiento de cada zona: 10 por tamaño (comida y producción por separado).
// El Almacén suma 5 por tamaño por cada nivel; sus especializaciones, lo indicado en SPECS × tamaño.
const STORE_PER_SIZE = 10;
const ALMACEN_PER_SIZE = 5;
// Prioridad de cada zona para su sobrante de comida (después de alimentar y de los envíos automáticos):
//   'crecer'  → todo el sobrante del paso va al crecimiento (las reservas se mantienen)
//   'guardar' → el sobrante va al almacén; solo lo que no cabe va al crecimiento
const GROW_MODE_DEFAULT = 'crecer';
// Zonas de frontera (tierra de nadie entre dos imperios vecinos): dilema del prisionero.
// Cada jugador con gente ahí gana FRONTIER_SHARED de oro por paso mientras todos los presentes estén en paz;
// quien está solo ahí gana FRONTIER_ALONE (pero para lograrlo suele haber que pelear).
// La frontera nunca tiene dueño: cualquiera puede entrar con civiles; quien está ahí no produce,
// come de su zona más cercana y gana el oro de la frontera.
// Zonas peligrosas (antes «fronteras»): solo cuentan las tropas. Con el costo de mover comida, un bono mayor compensa tenerlas ahí.
const FRONTIER_SHARED = 6, FRONTIER_ALONE = 8;
// El bono crece +10 % por cada paso seguido con tropas ahí, hasta +100 %; si pierdes la presencia, vuelve a 0.
const FRONTIER_GROW = 0.1, FRONTIER_GROW_MAX = 1;
const FRONTIER_TERRAINS = ['pra','lla','rio','col','bos','mon'];
// Cadena de suministros: las tropas fuera de tu territorio solo comen si hay un camino seguro
// (sin pasar por zonas de un enemigo) de como máximo SUPPLY_RANGE zonas hasta una zona tuya con comida.
// Sin suministro pasan hambre, y con hambre pelean con la mitad de los dados.
const SUPPLY_RANGE = 2;            // zonas de alcance (la tecnología «Suministros de campaña» suma 1)
const HUNGRY_FIGHT = 0.5;          // multiplicador de fuerza de una tropa hambrienta
// Tribus (13.3 y 12): cada TRIBE_REQ_EVERY pasos piden algo a quien las toca; cumplirlo sube la relación (0 a 3) y con 3 se puede anexar.
// Si las atacas entran en guerra: sus civiles se vuelven guerreros y te atacan durante TRIBE_WAR_STEPS pasos o hasta que las conquistes.
const TRIBE_REQ_EVERY = 8, TRIBE_REL_MAX = 3, TRIBE_WAR_STEPS = 5;
// Después de cumplir un pedido, esa tribu no te vuelve a pedir nada durante este tiempo (para que no sienta que acabas de dar).
const TRIBE_REQ_COOLDOWN = 12;
const TRIBE_REQS = {agr:[['food',6],['food',10],['gold',6]], ing:[['prod',6],['prod',10],['gold',6]], com:[['gold',6],['gold',10],['food',8]], cie:[['tech',6],['tech',10],['gold',6]]};
// Relación con cada tribu: de −3 (insatisfacción 3: ataca) a +3 (alianza: se puede anexar). Cumplir un pedido sube 1; ignorarlo baja 1.
const TRIBE_REL_MIN = -3;
const TRIBE_REL_N = ['furiosa','enojada','molesta','desconfianza','trato','amistad','alianza'];   // índice = relación + 3
// Historias de 4 capítulos (13.3): el primer capítulo de la primera llega hacia el paso 10 y los demás cada 8 pasos.
// Al terminar una, pasan de STORY_BREAK_MIN a STORY_BREAK_MAX pasos de descanso y empieza otra (distinta, nunca se repiten en la partida),
// hasta STORY_MAX por jugador. Con estos tiempos, en una partida de 60 a 100 pasos suelen vivirse 2 o 3; en una muy larga, 3 o 4.
const STORY_FIRST = 10, STORY_GAP = 8, STORY_BREAK_MIN = 6, STORY_BREAK_MAX = 10, STORY_MAX = 4;
// Subasta a sobre cerrado (13.3): cada AUCTION_EVERY pasos, anunciada AUCTION_NOTICE pasos antes. Se sabe la moneda, la categoría y el nivel
// (bronce, plata u oro) de cada objeto, pero no los detalles. Se paga con oro, ciencia, o comida y producción de todo el imperio.
const AUCTION_EVERY = 20, AUCTION_NOTICE = 2, AUCTION_RES_STEPS = 40;
const AUCTION_CURRENCIES = ['gold','tech','food','prod'];
const AUCTION_CATS = {pel:'Pelotón', pob:'Poblador extraordinario', sab:'Saber', car:'Cargamento', rec:'Recurso temporal'};
const AUCTION_TIERS = ['bronce','plata','oro'], AUCTION_TIER_ICON = ['🥉','🥈','🥇'], AUCTION_TIER_ODDS = [0.5,0.35,0.15];
const AUCTION_PEL = [{sol:2},{sol:2,arq:2},{sol:2,arq:2,esc:2,cab:1}];     // tropas con su equipo
const AUCTION_POB = [[1,1],[2,1],[2,2]];                                    // niveles de los 2 rasgos del poblador extraordinario
const AUCTION_SAB = [2,3,4];                                                // nivel máximo de la tecnología regalada
const AUCTION_CAR = [30,55,90];                                             // cantidad del cargamento (comida o producción)
const AUCTION_REC = [['hierbas','madera'],['hierro','sal'],['ruinas']];     // recurso estratégico global temporal
// Etapa de fundación: hasta este paso, crecer cuesta la mitad, para que el inicio no sea tan lento.
const FOUNDING_STEPS = 12;
// Bono de la capital: comida, producción, oro y ciencia por paso.
const CAPITAL_BONUS = 2;
// Ciencia que usa cada científico al investigar.
const RESEARCH_PER_SCI = 2;
// Edificios repetidos: con una tecnología de este nivel del edificio se puede tener un segundo en la zona.
// El segundo cuesta más (construirlo y mejorarlo) y necesita sus propios trabajadores y espacio.
const DUP_LEVEL = 3, MAX_SAME = 2, DUP_COST_MULT = 1.5;
// Ofertas entre jugadores: lo que ofreces queda en reserva; al otro le llega como un encuentro. Caducan a los OFFER_TTL pasos (y se devuelve lo reservado).
const OFFER_TTL = 4, OFFER_MAX_OUT = 2, OFFER_RES = ['food','prod','gold','tech'];
// Puestos de trabajo de cada edificio por nivel: nivel 1 = 2, nivel 2 = 4, nivel 3 = 6, nivel 4 = 8, nivel 5 = 10 (Andamios y Grúas suman 1 cada una).
const WORKERS_PER_LEVEL = 2;
const DEMOB_COST = {basico:2,especializado:3};   // retirar a un general → civil básico 2, → civil especializado 3 (Reservistas: 0)
const DEMOB_FROM = ['sol','arq','cab','esc','ber','ari','lan'];   // todas las tropas se pueden dar de baja; solo los generales vuelven a ser civiles
const GEN_TYPES = ['sol','arq','cab','esc','ber'];   // las máquinas de asedio no tienen general
const TRAIN_TECH = {sol:null,arq:'Arco',esc:'Escudos',cab:'Doma de caballos',ber:'Forja de hachas',ari:'Ingeniería de asedio',lan:'Lanzapiedras'};
const BT = {
  almacen:{n:'Almacén',unlock:'Almacenes',sr:'Almacén',col:'#8C6A3E',l:'A'},
  camino:{n:'Camino',unlock:'Caminos',sr:'Camino',col:'#B79A6A',l:'C'},
  hospital:{n:'Hospital',unlock:'Hospitales',sr:'Hospital',col:'#C9D7C0',l:'H'},
  cuartel:{n:'Cuartel',unlock:'Cuarteles',sr:'Cuartel',mil:1,col:'#7A2E24',l:'Q'},
  fort:{n:'Fortificación',unlock:'Fortificaciones',sr:'Fortificación',mil:1,col:'#6F6962',l:'F'},
  molino:{n:'Molino',unlock:'Molinos',sr:'Molino',col:'#D7C26A',l:'M'},
  taller:{n:'Taller',unlock:'Talleres',sr:'Taller',col:'#9A5B3A',l:'T'},
  mercado:{n:'Mercado',unlock:'Mercados',sr:'Mercado',col:'#E0A21B',l:'E'},
  biblio:{n:'Biblioteca',unlock:'Bibliotecas',sr:'Biblioteca',col:'#5B7FA6',l:'B'},
  mar:{n:'Maravilla',unlock:'Maravillas',sr:'Maravilla',col:'#E9C46A',l:'★'}
};
// Las 12 maravillas (15.3): una por rama, únicas en toda la partida. La vertebral de nivel 5 de la rama solo
// desbloquea su construcción; el efecto lo da la maravilla mientras controles su zona.
const WONDERS = {
  agr:{n:'La Huerta Infinita',tech:'Granjas modelo',r:'Agricultura',d:'+1 de comida por agricultor'},
  ing:{n:'La Gran Fragua',tech:'Maquinaria',r:'Producción',d:'+1 de producción por ingeniero'},
  com:{n:'La Lonja Dorada',tech:'Gran compañía',r:'Comercio',d:'+1 de oro por comerciante'},
  cie:{n:'La Torre de los Sabios',tech:'Enciclopedia',r:'Saber',d:'cada científico genera o usa 3 en vez de 2'},
  log:{n:'La Calzada sin Fin',tech:'Red de caminos II',r:'Logística',d:'mover comida y producción por su zona es gratis'},
  urb:{n:'La Plaza Mayor',tech:'Maravillas',r:'Urbanismo',d:'tus obras cuestan un 25 % menos (no las maravillas)'},
  san:{n:'Las Termas de la Salud',tech:'Hospital imperial',r:'Sanidad y población',d:'todas tus unidades tienen 2 de vida más'},
  dip:{n:'El Palacio de los Pactos',tech:'Corte imperial',r:'Diplomacia e imperio',d:'+1 de cada recurso por cada 5 zonas'},
  arm:{n:'La Sala de los Mil Filos',tech:'Arsenal',r:'Armas y unidades',d:'las armas cuestan la mitad de producción'},
  cua:{n:'El Patio de Armas',tech:'Veteranos',r:'Cuartel y entrenamiento',d:'la fuerza máxima de las tropas sube de 4 a 5'},
  def:{n:'El Bastión Eterno',tech:'Ciudadela',r:'Defensa',d:'tus defensores tienen +4 de defensa y +1 de vida'},
  gue:{n:'La Puerta de los Estandartes',tech:'Contraataque',r:'Guerra y conquista',d:'tus atacantes tienen +1 de fuerza'}
};
const WONDER_TECH = {}; Object.keys(WONDERS).forEach(k=>{ WONDER_TECH[WONDERS[k].tech]=k; });
// Si la maravilla de la rama ya existe, la vertebral de nivel 5 no se puede investigar (quien ya la tenía la conserva).
// Quien pierde la carrera recupera esta fracción de la producción puesta en la obra.
const WONDER_REFUND = 0.5;
// especializaciones de edificio: tecnología -> {bt,key,v}
const SPECS = {
  // almacén: v = capacidad extra por tamaño de la zona; intereses: 1 de oro por cada v almacenadas
  'Almacén de comida I':{bt:'almacen',key:'comida',v:5},'Almacén de comida II':{bt:'almacen',key:'comida',v:10},
  'Almacén de comida III':{bt:'almacen',key:'comida',v:15},'Almacén de comida IV':{bt:'almacen',key:'comida',v:25},
  'Almacén de producción I':{bt:'almacen',key:'produccion',v:5},'Almacén de producción II':{bt:'almacen',key:'produccion',v:10},
  'Almacén de producción III':{bt:'almacen',key:'produccion',v:15},'Almacén de producción IV':{bt:'almacen',key:'produccion',v:25},
  'Intereses del almacén I':{bt:'almacen',key:'intereses',v:20},'Intereses del almacén II':{bt:'almacen',key:'intereses',v:10},
  'Hospital civil II':{bt:'hospital',key:'civil',v:2},'Hospital civil III':{bt:'hospital',key:'civil',v:3},
  'Hospital militar II':{bt:'hospital',key:'militar',v:2},'Hospital militar III':{bt:'hospital',key:'militar',v:3},
  'Molino-granero':{bt:'molino',key:'granero',v:1},'Taller de armería':{bt:'taller',key:'armeria',v:1},
  'Mercado de trueque':{bt:'mercado',key:'trueque',v:1},
  'Torres de vigilancia':{bt:'fort',key:'torres',v:1},'Murallas altas':{bt:'fort',key:'murallas',v:1},
  'Cuartel de instrucción':{bt:'cuartel',key:'instruccion',v:1},'Campo de entrenamiento':{bt:'cuartel',key:'campo',v:1},
  'Guardia de élite':{bt:'cuartel',key:'guardia',v:1}
};
const SPEC_NAMES = {comida:'Almacén de comida',produccion:'Almacén de producción',intereses:'Intereses (oro por reservas)',civil:'Hospital civil',militar:'Hospital militar',
  granero:'Molino-granero',armeria:'Taller de armería',trueque:'Mercado de trueque',torres:'Torres de vigilancia',murallas:'Murallas altas',
  instruccion:'Cuartel de instrucción',campo:'Campo de entrenamiento',guardia:'Guardia de élite'};
// valor por trabajador según nivel del edificio económico
const PERW = [0,1,2,2,3,5];
const MINC = {2:3,3:5,4:6,5:6};   // mínimo de tecnologías del nivel anterior
const TERMS = {};  // se llena con TECH
const TECHS = DATA.techs;
const TECH = {}; TECHS.forEach(t=>{ TECH[t.n]=t; });
const BRANCHES = DATA.branches;
// Recursos estratégicos. Cada zona puede tener un depósito de PLATA (casi todas: efecto normal) y, en 1 de cada 3, uno de ORO (efecto doble).
// d = qué hace con plata; d2 = qué hace con oro. ic = ícono. sc = local (solo su zona) o global (todo el imperio que lo controla).
const RES = {
  mitril:{n:'Mitril',ic:'💠',sc:'local',d:'Los escudos hechos en la zona dan +1 de defensa al escudero.',d2:'Los escudos hechos en la zona dan +2 de defensa al escudero.',col:'#9BB5C9'},
  hierro:{n:'Hierro',ic:'⚙',sc:'global',d:'Las armas cuestan 1 de producción menos en todo el imperio.',d2:'Las armas cuestan 2 de producción menos en todo el imperio.',col:'#7A7F86'},
  caballos:{n:'Caballos salvajes',ic:'🐎',sc:'local',d:'Los caballeros entrenados en la zona tienen +1 de vida.',d2:'Los caballeros entrenados en la zona tienen +2 de vida.',col:'#B07A4A'},
  madera:{n:'Madera noble',ic:'🪵',sc:'global',d:'Construir y mejorar edificios cuesta 5 de producción menos (mínimo 10).',d2:'Construir y mejorar edificios cuesta 10 de producción menos (mínimo 10).',col:'#6B4528'},
  piedra:{n:'Piedra de cantera',ic:'🪨',sc:'local',d:'Fortificaciones y Maravillas de la zona cuestan un 25 % menos.',d2:'Fortificaciones y Maravillas de la zona cuestan un 50 % menos.',col:'#A9A59C'},
  sal:{n:'Sal',ic:'🧂',sc:'global',d:'Cada zona comercial que controles da +2 de oro por paso.',d2:'Cada zona comercial que controles da +4 de oro por paso.',col:'#E8E4DA'},
  ruinas:{n:'Ruinas antiguas',ic:'🏛',sc:'global',d:'+3 de tecnología por paso.',d2:'+6 de tecnología por paso.',col:'#C9A7E0'},
  hierbas:{n:'Hierbas medicinales',ic:'🌿',sc:'global',d:'Los heridos se curan una ronda más rápido.',d2:'Los heridos se curan dos rondas más rápido.',col:'#6FBF73'},
  gemas:{n:'Gemas',ic:'💎',sc:'local',d:'El Mercado de la zona da +1 de oro adicional por trabajador.',d2:'El Mercado de la zona da +2 de oro adicional por trabajador.',col:'#E05A8A'},
  brea:{n:'Brea',ic:'🛢',sc:'local',d:'Las máquinas de asedio fabricadas en la zona tienen +1 de fuerza.',d2:'Las máquinas de asedio fabricadas en la zona tienen +2 de fuerza.',col:'#3A3A3A'}
};
// Niveles de depósito: lo que rinde cada paso (empieza en start y sube 1 cada RES_GROW_EVERY pasos hasta max) y cuánto multiplica el efecto.
const RES_TIER = {plata:{n:'Plata',ic:'🥈',mul:1,start:1,max:2}, oro:{n:'Oro',ic:'🥇',mul:2,start:2,max:5}};
const RES_SILVER_CHANCE = 0.9, RES_GOLD_CHANCE = 1/3;   // zonas con plata (casi una por zona) y con oro (1 de cada 3); las capitales solo llevan plata
const LOCAL_BY_TERR = {mon:'mitril',col:'piedra',pra:'caballos',bos:'brea',rio:'gemas',lla:'gemas'};
const GLOBAL_BY_TERR = {mon:'hierro',col:'hierro',pra:'hierbas',bos:'madera',rio:'sal',lla:'ruinas'};
// eventos
const EVENTS = [
  {id:'cosecha',ic:'🌾',n:'Buena cosecha',k:'+',terr:['pra','lla'],d:'+0,5 de comida por agricultor y poblador'},
  {id:'veta',ic:'⛏',n:'Veta rica',k:'+',terr:['mon','col'],d:'+0,5 de producción por ingeniero y poblador'},
  {id:'feria',ic:'🎪',n:'Feria',k:'+',terr:['rio','bos'],d:'+0,5 de oro por comerciante'},
  {id:'inspira',ic:'💡',n:'Inspiración',k:'+',terr:['lla','col'],d:'+0,5 de tecnología por científico'},
  {id:'caminos',ic:'🛤',n:'Caminos despejados',k:'+',terr:['all'],d:'La logística cuesta la mitad'},
  {id:'fertil',ic:'👶',n:'Año fértil',k:'+',terr:['all'],d:'Crecer cuesta un 30 % menos'},
  {id:'sequia',ic:'☀',n:'Sequía',k:'-',terr:['pra','lla'],d:'−0,5 de comida por agricultor y poblador'},
  {id:'plaga',ic:'🦠',n:'Plaga',k:'-',terr:['bos','rio'],d:'+25 % de consumo de comida'},
  {id:'derrumbe',ic:'🪨',n:'Derrumbe',k:'-',terr:['mon','col'],d:'−0,5 de producción por ingeniero y poblador'},
  {id:'inunda',ic:'🌊',n:'Inundación',k:'-',terr:['rio'],d:'Los almacenes pierden la mitad de sus reservas',inst:1},
  {id:'tormenta',ic:'⛈',n:'Tormenta',k:'-',terr:['all'],d:'La logística cuesta un 50 % más'},
  {id:'fiebre',ic:'🤒',n:'Fiebre',k:'-',terr:['all'],d:'Los heridos tardan una ronda más en curarse'},
  {id:'prosper',ic:'🌟',n:'Prosperidad',k:'+',terr:['all'],year:1,d:'+15 % de comida, producción, oro y tecnología',year:1},
  {id:'escasez',ic:'🥀',n:'Escasez',k:'-',terr:['all'],d:'−15 % de comida y de producción',year:1},
  {id:'inquietud',ic:'🔥',n:'Inquietud tribal',k:'t',terr:[],d:'Una tribu crece +1 de población'},
  {id:'tributo',ic:'🤝',n:'Pedido de tribu',k:'t',terr:[],d:'Una tribu pide algo a sus vecinos (cumplirlo mejora la relación; no hacerlo no tiene castigo)'},
  {id:'exodo',ic:'🏕',n:'Éxodo tribal',k:'t',terr:[],d:'Una tribu funda una nueva tribu'},
  {id:'furia',ic:'😡',n:'Furia tribal',k:'t',terr:[],d:'Una tribu se vuelve berserker'}
];
// Calendario: 1 paso = 1 mes, 12 pasos = 1 año. El primer año (pasos 1 a 12) es de fundación: sin eventos.
// Desde el año EV_FIRST_YEAR, cada año tiene dos partes que duran los 12 pasos: una CIERTA (Prosperidad o Escasez, +/- EV_BASE_PCT de lo que se produce)
// y una VARIABLE, un evento de la lista del mismo signo (cosecha, veta, sequía…). Además hay «sucesos» de un solo paso (tribus, inundación).
const YEAR_STEPS = 12, EV_FIRST_YEAR = 2, EV_BASE_PCT = 0.15, EV_FLOOD_CHANCE = 0.5, EV_FERTIL_FACTOR = 0.7, EV_TORMENTA_MULT = 1.5;
const MONTH_N = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const EVT = {}; EVENTS.forEach(e=>{ EVT[e.id]=e; });
