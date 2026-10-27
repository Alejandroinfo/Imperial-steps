'use strict';
// Qué hace cada tecnología: cada entrada modifica la tabla de modificadores del jugador.
// Las tecnologías sin entrada aquí se pueden investigar, pero todavía no tienen efecto.

function newMods(){
  return {
    agrFood:0,pobFood:0,ingProd:0,pobProd:0,comGold:0,cieTech:0,
    zl:{agr:1,ing:1,com:1,cie:1,con:1},
    zFoodLvl:0,zProdLvl:0,ruta:0,revol:0,
    tx:{mon:0,pra:0,bos:0,rio:0,col:0,lla:0},terrDouble:0,
    conUse:0,wk:2,bSub:0,refund:0.5,slotBonus:0,pullDist:1,
    growSub:0,growHalf:0,hungerSteps:2,specSub:0,specFree:0,buyCost:3,caravan:0,logiRefund:0,
    foresight:2,avoidNeg:0,evNegFood:1,evNegCons:1,evPosRisk:1,evNegRisk:1,
    imp:0,monop:0,capExtra:0,capDef:0,corte:0,
    annexDisc:1,tribDisc:1,annexDist:1,
    milMoveHalf:0,garrison:0,supplies:0,
    forceStep:1,forceMax:4,civHp:0,civHeal:0,milHeal:0,
    u:{},moral:0.5,surprise:1.5,arqFire:0,lanceros:0,berFury:0,escTortuga:0,
    weaponHalf:0,reserv:0,saqueo:0,botin:0,captHp:1,conqSize:3,conqKeep:1,conqRefund:0.5,
    colonos:0,migr:0,freeFoodAdj:0,fortHalf:0,citadel:0,
    tm:{bosArq:0,rioArq:0,praCab:0,llaCab:0,monBer:0,colBer:0},
    siege:{ari:0,lan:0},cuartelExtra:1,capWonder:0,wonderDef:0,wonderCost:500
  };
}
function mu(M,t){ return M.u[t]||(M.u[t]={str:0,def:0,hp:0,atk:0,init:null}); }
const FX = {
  // --- agricultura ---
  'Arado':M=>{M.agrFood+=1;}, 'Huertos familiares':M=>{M.pobFood+=1;}, 'Despensas':M=>{M.hungerSteps=3;},
  'Riego':M=>{M.zl.agr=Math.max(M.zl.agr,2);}, 'Abonos':M=>{M.agrFood+=1;}, 'Ganadería':M=>{M.zFoodLvl+=2;},
  'Semillas resistentes':M=>{M.evNegFood=0.5;}, 'Irrigación avanzada':M=>{M.pobFood+=1;},
  'Cosecha comunal':M=>{M.zl.agr=3;}, 'Granjas modelo':M=>{M.agrFood+=1;}, 'Revolución agrícola':M=>{M.revol=6;},
  'Pastoreo':M=>{M.tx.pra+=1;}, 'Terrazas':M=>{M.tx.mon+=1;}, 'Comercio fluvial':M=>{M.tx.rio+=1;}, 'Comercio maderero':M=>{M.tx.bos+=1;},
  'Canteras de colina':M=>{M.tx.col+=1;}, 'Observatorios':M=>{M.tx.lla+=1;}, 'Dominio del terreno':M=>{M.terrDouble=1;},
  // --- producción / construcción ---
  'Herramientas':M=>{M.ingProd+=1;}, 'Carretillas':M=>{M.pobProd+=1;}, 'Ingeniería básica':M=>{M.zl.ing=Math.max(M.zl.ing,2);},
  'Minería':M=>{M.zProdLvl+=2;}, 'Ingeniería avanzada':M=>{M.zl.ing=3;}, 'Maquinaria':M=>{M.ingProd+=1;},
  'Cuadrillas de obra':M=>{M.conUse+=1;}, 'Línea de ensamblaje':M=>{M.conUse+=1;}, 'Aprendices':M=>{M.specFree=1;},
  'Logística de obra':M=>{M.pullDist=2;}, 'Gremios de constructores':M=>{M.zl.con=2;}, 'Grandes obras':M=>{M.zl.con=3;},
  'Andamios':M=>{M.wk+=1;}, 'Grúas':M=>{M.wk+=1;}, 'Reciclaje':M=>{M.refund=0.75;}, 'Estandarización':M=>{M.bSub=10;},
  'Canteras reales':M=>{M.wonderCost=400;}, 'Guardianes de la maravilla':M=>{M.wonderDef=2;}, 'Planificación urbana':M=>{M.slotBonus+=1;},
  // --- comercio ---
  'Moneda':M=>{M.comGold+=1;}, 'Caravanas':M=>{M.caravan=5;}, 'Rutas comerciales':M=>{M.zl.com=Math.max(M.zl.com,2);},
  'Contabilidad':M=>{M.buyCost=2;}, 'Impuestos':M=>{M.imp=1;}, 'Gremios mercantiles':M=>{M.zl.com=3;}, 'Casa de moneda':M=>{M.comGold+=1;},
  'Monopolio':M=>{M.monop=2;}, 'Seguro mercantil':M=>{M.logiRefund=0.25;}, 'Gran compañía':M=>{M.comGold+=1;}, 'Ruta de la seda':M=>{M.ruta=4;},
  // --- saber ---
  'Escritura':M=>{M.cieTech+=1;}, 'Escuelas':M=>{M.specSub+=1;}, 'Academias':M=>{M.zl.cie=Math.max(M.zl.cie,2);},
  'Calendario':M=>{M.foresight=Math.max(M.foresight,3);}, 'Universidades':M=>{M.zl.cie=3;}, 'Método científico':M=>{M.cieTech+=1;},
  'Astronomía':M=>{M.foresight=Math.max(M.foresight,5);}, 'Pronóstico':M=>{M.avoidNeg=1;},
  'Reservas de emergencia':M=>{M.evNegCons=0.75;}, 'Fortuna del temerario':M=>{M.evPosRisk=1.25;}, 'Resistencia climática':M=>{M.evNegRisk=0.5;},
  // --- población ---
  'Parteras':M=>{M.growSub=Math.max(M.growSub,1);}, 'Familias numerosas':M=>{M.growSub=Math.max(M.growSub,2);},
  'Medicina popular':M=>{M.civHeal+=1;}, 'Colonos':M=>{M.colonos=1;}, 'Migraciones guiadas':M=>{M.migr=1;},
  'Pobladores resistentes':M=>{M.civHp+=1;}, 'Medicina avanzada':M=>{M.civHeal+=5;}, 'Edad de oro':M=>{M.growHalf=1;},
  'Servicio médico de campaña':M=>{M.milHeal+=1;},
  // --- diplomacia / imperio ---
  'Ofrendas':M=>{M.annexDisc*=0.75;}, 'Diplomacia tribal':M=>{M.tribDisc=0.75;}, 'Anexión a distancia':M=>{M.annexDist=2;},
  'Capital próspera':M=>{M.capExtra=1;}, 'Capital fortificada':M=>{M.capDef=2;}, 'Graneros comunes':M=>{M.freeFoodAdj=1;}, 'Corte imperial':M=>{M.corte=1;},
  // --- militares ---
  'Marcha forzada':M=>{M.cuartelExtra=2;}, 'Marcha relámpago':M=>{M.cuartelExtra=3;},
  'Entrenamiento continuo':M=>{M.forceStep=2;}, 'Veteranos':M=>{M.forceMax=5;}, 'Lanceros':M=>{M.lanceros=1;},
  'Reservistas':M=>{M.reserv=1;}, 'Armaduras ligeras':M=>{ ['sol','arq','cab','ber','ari','lan'].forEach(t=>{ mu(M,t).def+=1; }); },
  'Arco compuesto':M=>{mu(M,'arq').str+=1;}, 'Flechas de fuego':M=>{M.arqFire=1;}, 'Lluvia de flechas':M=>{mu(M,'arq').init=0;},
  'Caballería pesada':M=>{mu(M,'cab').hp+=1;}, 'Escudos reforzados':M=>{mu(M,'esc').def+=1;}, 'Falange':M=>{mu(M,'esc').init=5;},
  'Tortuga':M=>{M.escTortuga=2;}, 'Furia':M=>{M.berFury=1;}, 'Frenesí':M=>{mu(M,'ber').init=4;},
  'Arsenal':M=>{M.weaponHalf=1;},
  'Carga de caballería':M=>{M.cabCharge=1;}, 'Contraataque':M=>{M.contra=1;}, 'Veteranos de guerra':M=>{M.vetwar=1;}, 'Estandarte':M=>{M.estandarte=1;},
  'Emboscada en el bosque':M=>{M.tm.bosArq=1;}, 'Guardia ribereña':M=>{M.tm.rioArq=1;}, 'Carga en la pradera':M=>{M.tm.praCab=1;},
  'Caballería de llanura':M=>{M.tm.llaCab=1;}, 'Fortaleza de montaña':M=>{M.tm.monBer=1;}, 'Asalto de colina':M=>{M.tm.colBer=1;},
  'Saqueo':M=>{M.saqueo=1;}, 'Botín':M=>{M.botin=1;}, 'Prisioneros':M=>{M.captHp=2;}, 'Moral':M=>{M.moral=0.75;},
  'Emboscadas':M=>{M.surprise=2;}, 'Administradores':M=>{M.conqSize=4;}, 'Reconstrucción':M=>{M.conqRefund=0.75;},
  'Imperio conquistador':M=>{M.conqKeep=2;}, 'Caminos militares':M=>{M.milMoveHalf=1;}, 'Guarniciones':M=>{M.garrison=1;},
  'Suministros de campaña':M=>{M.supplies=1;}, 'Ingenieros militares':M=>{M.fortHalf=1;}, 'Ciudadela':M=>{M.citadel=1;},
  'Ingeniería de asedio':M=>{M.siege.ari=Math.max(M.siege.ari,1);}, 'Arietes reforzados':M=>{M.siege.ari=Math.max(M.siege.ari,2);}, 'Gran ariete':M=>{M.siege.ari=3;},
  'Lanzapiedras':M=>{M.siege.lan=Math.max(M.siege.lan,1);}, 'Contrapesos':M=>{M.siege.lan=Math.max(M.siege.lan,2);}, 'Trabucos':M=>{M.siege.lan=3;}
};
// efectos simulados además de FX: desbloqueos, niveles de edificio, especializaciones y unidades
const IMPL = new Set(Object.keys(FX));
Object.values(BT).forEach(b=>{ IMPL.add(b.unlock); });
Object.keys(SPECS).forEach(n=>IMPL.add(n));
['Arco','Escudos','Doma de caballos','Forja de hachas'].forEach(n=>IMPL.add(n));
TECHS.forEach(t=>{ if(['Almacén','Camino','Hospital','Cuartel','Fortificación','Molino','Taller','Mercado','Biblioteca','Maravilla'].includes(t.sr)) IMPL.add(t.n); });
['Almacenes económicos','Cuartel de instrucción'].forEach(n=>IMPL.add(n));
TECHS.forEach(t=>{ t.impl=IMPL.has(t.n)?1:0; });
const BT_BY_SR = {}; Object.keys(BT).forEach(k=>{ BT_BY_SR[BT[k].sr]=k; });
