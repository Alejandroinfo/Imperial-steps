'use strict';
// Encuentros adicionales: 20 más (16 ofertas y 4 apuestas, con 43 variantes de quién llega) y 14 de elegir entre dos
// (2 variantes cada uno). Con los de js/motor/encuentros.js suman 40 encuentros base (86 variantes) y 20 de elegir entre dos (40).
// Mismo formato: SIEMPRE son oportunidades (nada de amenazas); rechazar no cuesta nada. Los montos son los básicos y se
// escalan con el paso de la partida. Si quien llega es uno solo, el verbo se pasa a singular con ENC_SING.

const ENCOUNTERS_EXTRA = [
  {id:'cartografo', k:'oferta', who:['Un cartógrafo','Una exploradora','Un grupo de topógrafos'], txt:'ofrecen mapas de la comarca', cost:{res:'gold',n:5}, gain:{res:'tech',n:10}},
  {id:'cocineros', k:'oferta', who:['Un cocinero viajero','Una cofradía de panaderos'], txt:'enseñan sus recetas a tu gente', cost:{res:'food',n:3}, gain:{prog:10}},
  {id:'domadores', k:'oferta', who:['Un domador de caballos','Unos jinetes de la estepa'], txt:'venden un potro bien criado', cost:{res:'gold',n:9}, gain:{units:{cab:1}}, terr:['pra','lla']},
  {id:'maestro_armas', k:'oferta', who:['Un maestro de armas','Un capitán retirado'], txt:'entrenarían a tus soldados', cost:{res:'gold',n:8}, gain:{units:{esc:2}}},
  {id:'peregrinos', k:'oferta', who:['Unos peregrinos','Una procesión de viajeros'], txt:'se quedarían una temporada y ayudarían', cost:{res:'food',n:4}, gain:{units:{pob:2}}},
  {id:'minero', k:'oferta', who:['Un minero solitario','Una cuadrilla de picapedreros','Unos buscadores de vetas'], txt:'venden mineral', cost:{res:'food',n:5}, gain:{res:'prod',n:12}, terr:['mon','col']},
  {id:'tejedoras', k:'oferta', who:['Unas tejedoras','Una cooperativa de costureras'], txt:'cambian telas por comida', cost:{res:'food',n:5}, gain:{res:'gold',n:10}},
  {id:'carpinteros', k:'oferta', who:['Unos carpinteros','Un gremio de maestros de obra'], txt:'trabajarían a cambio de techo', cost:{res:'food',n:5}, gain:{units:{ing:2}}},
  {id:'escribas', k:'oferta', who:['Unos escribas','Una monja copista'], txt:'copiarían tus libros', cost:{res:'gold',n:5}, gain:{res:'tech',n:12}},
  {id:'cazadores', k:'oferta', who:['Unos cazadores','Un montero'], txt:'cambian carne por herramientas', cost:{res:'prod',n:4}, gain:{res:'food',n:12}, terr:['bos','mon']},
  {id:'fundidor', k:'oferta', who:['Un fundidor ambulante','Una fragua itinerante'], txt:'fabrican puntas de flecha', cost:{res:'prod',n:5}, gain:{eq:{arq:3}}},
  {id:'curtidor', k:'oferta', who:['Un curtidor','Unos talabarteros'], txt:'fabrican corazas de cuero', cost:{res:'prod',n:6}, gain:{eq:{esc:2}}},
  {id:'semilleros', k:'oferta', who:['Unos viajeros con semillas','Una agricultora de tierras lejanas'], txt:'dejan semillas raras', cost:{res:'gold',n:4}, gain:{res:'food',n:14}},
  {id:'postas', k:'oferta', who:['Un jefe de postas','Unos mensajeros del reino'], txt:'abrirían una posta en tu zona', cost:{res:'gold',n:7}, gain:{units:{com:2}}},
  {id:'ermitano', k:'oferta', who:['Un ermitaño','Una sabia de la montaña'], txt:'comparten su saber a cambio de compañía', cost:{res:'food',n:4}, gain:{res:'tech',n:8}, terr:['mon','col']},
  {id:'tribu_amiga', k:'oferta', who:['Unos emisarios de una tribu','Un cacique amistoso','Una anciana de la tribu'], txt:'quieren estrechar lazos', cost:{res:'food',n:5}, gain:{rel:1}},
  {id:'dados', k:'apuesta', who:['Unos jugadores de dados','Un tahúr'], txt:'te retan a una partida', cost:{res:'gold',n:4}, gain:{gamble:{p:0.5,res:'gold',n:16}}},
  {id:'vidente', k:'apuesta', who:['Una vidente','Un alquimista errante'], txt:'promete una gran revelación', cost:{res:'gold',n:5}, gain:{gamble:{p:0.5,res:'tech',n:22}}},
  {id:'carrera', k:'apuesta', who:['Unos apostadores','Un dueño de potros'], txt:'organizan una carrera de caballos', cost:{res:'gold',n:6}, gain:{gamble:{p:0.4,res:'gold',n:24}}, terr:['pra','lla']},
  {id:'zahori', k:'apuesta', who:['Un zahorí','Una buscadora de aguas'], txt:'jura que hay agua buena bajo tu tierra', cost:{res:'prod',n:4}, gain:{gamble:{p:0.5,res:'food',n:22}}}
];

const CHOICES_EXTRA = [
  {id:'ch_cosecha', who:['Un granjero y un molinero','Dos cooperativas de campesinos'], txt:'se disputan ayudar a tu pueblo, pero solo cabe uno', opts:[{lbl:'Semillas mejoradas',cost:{res:'gold',n:4},gain:{res:'food',n:14}},{lbl:'Un molino prestado',cost:{res:'prod',n:4},gain:{prog:12}}]},
  {id:'ch_viaje', who:['Un cartógrafo y un guía','Una exploradora y un mapero'], txt:'ofrecen sus servicios, pero solo puedes aceptar a uno', opts:[{lbl:'Mapa de caminos',cost:{res:'gold',n:4},gain:{res:'tech',n:12}},{lbl:'Guía de montaña',cost:{res:'food',n:4},gain:{units:{arq:1}}}]},
  {id:'ch_festin', who:['Un cocinero y una cervecera','Dos cofradías de festejos'], txt:'quieren organizar la fiesta, pero no caben las dos', opts:[{lbl:'Banquete',cost:{res:'food',n:5},gain:{prog:14}},{lbl:'Cervezas',cost:{res:'gold',n:3},gain:{res:'gold',n:10}}]},
  {id:'ch_defensa', who:['Un capitán de muros y un ingeniero de torres','Dos maestros de fortificación'], txt:'proponen reforzar tu zona, pero solo uno a la vez', opts:[{lbl:'Escudos para la guardia',cost:{res:'prod',n:6},gain:{eq:{esc:2}}},{lbl:'Arcos para la torre',cost:{res:'gold',n:5},gain:{eq:{arq:2}}}]},
  {id:'ch_medicos', who:['Una partera y un cirujano','Dos hermanas curanderas'], txt:'ofrecen sus cuidados, pero no hay sitio para las dos', opts:[{lbl:'Cuidar a las familias',cost:{res:'food',n:4},gain:{prog:12}},{lbl:'Curar a los soldados',cost:{res:'gold',n:5},gain:{units:{sol:2}}}]},
  {id:'ch_arte', who:['Un escultor y una poeta','Un pintor y un cantor'], txt:'quieren dejar una obra en tu pueblo, pero solo una', opts:[{lbl:'Estatua del pueblo',cost:{res:'prod',n:5},gain:{res:'gold',n:12}},{lbl:'Poema épico',cost:{res:'gold',n:3},gain:{prog:12}}]},
  {id:'ch_aguas', who:['Un pescador y una barquera','Dos familias del río'], txt:'ofrecen su trabajo, pero solo hay un muelle', opts:[{lbl:'Red de pesca',cost:{res:'prod',n:4},gain:{res:'food',n:14}},{lbl:'Barca de carga',cost:{res:'gold',n:4},gain:{res:'gold',n:10}}]},
  {id:'ch_cantera', who:['Un cantero y un minero','Dos cuadrillas de picapedreros'], txt:'ofrecen sus materiales, pero no puedes con los dos', opts:[{lbl:'Piedra tallada',cost:{res:'food',n:5},gain:{res:'prod',n:12}},{lbl:'Mineral en bruto',cost:{res:'food',n:5},gain:{res:'gold',n:10}}]},
  {id:'ch_escuela', who:['Un maestro de números y una de letras','Dos escuelas itinerantes'], txt:'quieren enseñar, pero el aula es chica', opts:[{lbl:'Números y cuentas',cost:{res:'food',n:5},gain:{res:'tech',n:10}},{lbl:'Letras y libros',cost:{res:'food',n:4},gain:{units:{cie:1}}}]},
  {id:'ch_peregrinos', who:['Un fraile y un ermitaño','Dos peregrinos distintos'], txt:'ofrecen sus consejos, pero solo escucharás a uno', opts:[{lbl:'Su bendición',cost:{res:'food',n:3},gain:{prog:10}},{lbl:'Su sabiduría',cost:{res:'gold',n:4},gain:{res:'tech',n:10}}]},
  {id:'ch_ganado', who:['Un pastor y un jinete','Dos ganaderos rivales'], txt:'ofrecen sus animales, pero el corral es pequeño', opts:[{lbl:'Un rebaño de ovejas',cost:{res:'gold',n:4},gain:{res:'food',n:14}},{lbl:'Un potro',cost:{res:'gold',n:7},gain:{units:{cab:1}}}]},
  {id:'ch_trueque', who:['Dos mercaderes del este','Una dama y un contrabandista'], txt:'ofrecen su mercancía, pero solo puedes comprar a uno', opts:[{lbl:'Especias',cost:{res:'prod',n:5},gain:{res:'gold',n:12}},{lbl:'Telas finas',cost:{res:'food',n:5},gain:{units:{com:1}}}]},
  {id:'ch_guardia', who:['Un sargento y un cazador','Dos veteranos que no se hablan'], txt:'se ofrecen para vigilar tu zona, pero solo uno', opts:[{lbl:'Una ronda nocturna',cost:{res:'gold',n:5},gain:{units:{sol:2}}},{lbl:'Rastreadores de caza',cost:{res:'gold',n:6},gain:{units:{arq:2}}}]},
  {id:'ch_taller', who:['Un carpintero y una tejedora','Dos talleres vecinos'], txt:'quieren instalarse, pero hay un solo local', opts:[{lbl:'Herramientas de madera',cost:{res:'food',n:4},gain:{units:{ing:1}}},{lbl:'Telares',cost:{res:'food',n:4},gain:{units:{com:1}}}]}
];
