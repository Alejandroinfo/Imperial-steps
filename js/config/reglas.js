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
// Entrenar: un civil pasa a soldado (2) y, si la tropa usa equipo, se fabrica su arma.
// El arma cuesta 2 × el nivel de la tecnología que la desbloquea (Arco 1, Escudos 2, Caballos y Hachas 3).
// Si una tropa con equipo muere en tu territorio, el arma queda guardada en la zona y se reutiliza.
const SOLDIER_COST = 1;
const EQUIP_COST = {arq:2, esc:4, cab:6, ber:6};
const EQUIP_N = {arq:['arco','arcos'], esc:['escudo','escudos'], cab:['caballo','caballos'], ber:['hacha','hachas']};
const TRAIN_COST = {sol:SOLDIER_COST, arq:SOLDIER_COST+EQUIP_COST.arq, esc:SOLDIER_COST+EQUIP_COST.esc,
                    cab:SOLDIER_COST+EQUIP_COST.cab, ber:SOLDIER_COST+EQUIP_COST.ber, ari:8, lan:8};
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
const FRONTIER_SHARED = 3, FRONTIER_ALONE = 4;
const FRONTIER_TERRAINS = ['pra','lla','rio','col','bos','mon'];
// Cadena de suministros: las tropas fuera de tu territorio solo comen si hay un camino seguro
// (sin pasar por zonas de un enemigo) de como máximo SUPPLY_RANGE zonas hasta una zona tuya con comida.
// Sin suministro pasan hambre, y con hambre pelean con la mitad de los dados.
const SUPPLY_RANGE = 2;            // zonas de alcance (la tecnología «Suministros de campaña» suma 1)
const HUNGRY_FIGHT = 0.5;          // multiplicador de fuerza de una tropa hambrienta
// Etapa de fundación: hasta este paso, crecer cuesta la mitad, para que el inicio no sea tan lento.
const FOUNDING_STEPS = 12;
// Bono de la capital: comida, producción, oro y ciencia por paso.
const CAPITAL_BONUS = 2;
// Ciencia que usa cada científico al investigar.
const RESEARCH_PER_SCI = 2;
// Edificios repetidos: con una tecnología de este nivel del edificio se puede tener un segundo en la zona.
// El segundo cuesta más (construirlo y mejorarlo) y necesita sus propios trabajadores y espacio.
const DUP_LEVEL = 3, MAX_SAME = 2, DUP_COST_MULT = 1.5;
const DEMOB_COST = {basico:2,especializado:3};   // regla 5.2: militar → civil básico 2, → civil especializado 3 (Reservistas: 0)
const DEMOB_FROM = ['sol','arq','cab','esc','ber']; // las máquinas de asedio no se licencian (pendiente 23)
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
const RES = {
  mitril:{n:'Mitril',sc:'local',d:'Los escudos hechos en la zona dan +1 de defensa al escudero.',col:'#9BB5C9'},
  hierro:{n:'Hierro',sc:'global',d:'Las armas cuestan 1 de producción menos en todo el imperio.',col:'#7A7F86'},
  caballos:{n:'Caballos salvajes',sc:'local',d:'Los caballeros entrenados en la zona tienen +1 de vida.',col:'#B07A4A'},
  madera:{n:'Madera noble',sc:'global',d:'Construir y mejorar edificios cuesta 5 de producción menos (mínimo 10).',col:'#6B4528'},
  piedra:{n:'Piedra de cantera',sc:'local',d:'Fortificaciones y Maravillas de la zona cuestan un 25 % menos.',col:'#A9A59C'},
  sal:{n:'Sal',sc:'global',d:'Cada zona comercial que controles da +2 de oro por paso.',col:'#E8E4DA'},
  ruinas:{n:'Ruinas antiguas',sc:'global',d:'+3 de tecnología por paso.',col:'#C9A7E0'},
  hierbas:{n:'Hierbas medicinales',sc:'global',d:'Los heridos se curan una ronda más rápido.',col:'#6FBF73'},
  gemas:{n:'Gemas',sc:'local',d:'El Mercado de la zona da +1 de oro adicional por trabajador.',col:'#E05A8A'},
  brea:{n:'Brea',sc:'local',d:'Las máquinas de asedio fabricadas en la zona tienen +1 de fuerza.',col:'#3A3A3A'}
};
const LOCAL_BY_TERR = {mon:'mitril',col:'piedra',pra:'caballos',bos:'brea',rio:'gemas',lla:'gemas'};
const GLOBAL_BY_TERR = {mon:'hierro',col:'hierro',pra:'hierbas',bos:'madera',rio:'sal',lla:'ruinas'};
// eventos
const EVENTS = [
  {id:'cosecha',n:'Buena cosecha',k:'+',terr:['pra','lla'],d:'+2 de comida por agricultor y poblador'},
  {id:'veta',n:'Veta rica',k:'+',terr:['mon','col'],d:'+2 de producción por ingeniero y poblador'},
  {id:'feria',n:'Feria',k:'+',terr:['rio','bos'],d:'+2 de oro por comerciante'},
  {id:'inspira',n:'Inspiración',k:'+',terr:['lla','col'],d:'+2 de tecnología por científico'},
  {id:'caminos',n:'Caminos despejados',k:'+',terr:['all'],d:'La logística cuesta la mitad este paso'},
  {id:'fertil',n:'Año fértil',k:'+',terr:['all'],d:'Crecer cuesta la mitad este paso'},
  {id:'sequia',n:'Sequía',k:'-',terr:['pra','lla'],d:'−1 de comida por agricultor y poblador'},
  {id:'plaga',n:'Plaga',k:'-',terr:['bos','rio'],d:'+1 de consumo de comida por persona'},
  {id:'derrumbe',n:'Derrumbe',k:'-',terr:['mon','col'],d:'−1 de producción por ingeniero y poblador'},
  {id:'inunda',n:'Inundación',k:'-',terr:['rio'],d:'Los almacenes pierden la mitad de sus reservas'},
  {id:'tormenta',n:'Tormenta',k:'-',terr:['all'],d:'La logística cuesta el doble este paso'},
  {id:'fiebre',n:'Fiebre',k:'-',terr:['all'],d:'Los heridos tardan una ronda más en curarse'},
  {id:'inquietud',n:'Inquietud tribal',k:'t',terr:[],d:'Una tribu crece +1 de población'},
  {id:'tributo',n:'Exigencia de tributo',k:'t',terr:[],d:'Una tribu exige tributo a sus vecinos'},
  {id:'exodo',n:'Éxodo tribal',k:'t',terr:[],d:'Una tribu funda una nueva tribu'},
  {id:'furia',n:'Furia tribal',k:'t',terr:[],d:'Una tribu se vuelve berserker'}
];
const EVT = {}; EVENTS.forEach(e=>{ EVT[e.id]=e; });
