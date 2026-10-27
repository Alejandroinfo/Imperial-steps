// @ts-check
'use strict';
// Historias de 4 capítulos (reglas 13.3): encuentros encadenados. Lo que eliges en cada capítulo cambia el siguiente
// y el final. Siempre son oportunidades: cada opción puede costar algo, pero «dejarlo pasar» no cuesta nada ni castiga.
// Cada opción lleva una marca (t) que orienta el camino; el capítulo 4 depende de la marca que más elegiste.
// ganancias nuevas: rel (relación con la tribu vecina), tpob (poblador extraordinario), saber (tecnología gratis hasta ese nivel),
// bld (edificio gratis en la zona), tres (recurso estratégico temporal), además de units, res, prog y eq de los encuentros.

const STORIES = {
  caravana:{ n:'La caravana perdida', tags:['C','T'],
    1:{ txt:'Una caravana de tierras lejanas quedó varada junto a tu territorio, con los carros rotos y poca comida', opts:[
      {t:'C',lbl:'Repararles los carros',cost:{res:'prod',n:6},gain:{res:'gold',n:5}},
      {t:'T',lbl:'Guiarlos con comida hasta la tribu vecina',cost:{res:'food',n:5},gain:{rel:1}}]},
    2:{ C:{ txt:'Los mercaderes, agradecidos, ofrecen abrir negocio en tu zona', opts:[
          {t:'C',lbl:'Darles un puesto en tu mercado',cost:{res:'gold',n:4},gain:{units:{com:1}}},
          {t:'T',lbl:'Pedirles que te presenten a la tribu vecina',cost:{res:'gold',n:3},gain:{rel:1}}]},
        T:{ txt:'La tribu vecina recibe a la caravana y su jefe quiere conocerte', opts:[
          {t:'T',lbl:'Llevarle un regalo de comida',cost:{res:'food',n:6},gain:{rel:1}},
          {t:'C',lbl:'Proponerle un trato de comercio',cost:{res:'gold',n:4},gain:{res:'gold',n:10}}]}},
    3:{ C:{ txt:'La ruta comercial prospera y los mercaderes piden protección en el camino', opts:[
          {t:'C',lbl:'Poner tropas a vigilarla',cost:{res:'gold',n:5},gain:{units:{sol:2}}},
          {t:'T',lbl:'Pagarle a la tribu para que la cuide',cost:{res:'gold',n:6},gain:{rel:1}}]},
        T:{ txt:'La tribu quiere que su gente aprenda los modos de comerciar de los forasteros', opts:[
          {t:'T',lbl:'Enviarles un maestro',cost:{res:'food',n:5},gain:{prog:12}},
          {t:'C',lbl:'Abrirles tu mercado',cost:{res:'gold',n:4},gain:{units:{com:1}}}]}},
    4:{ txt:{C:'La gran ruta une tu imperio con tierras lejanas y todos quieren cerrar un último trato',T:'La tribu y los forasteros te proclaman amigo de los caminos'}, opts:[
      {lbl:'Aceptar su agradecimiento',cost:null,g:{C:{res:'gold',n:30,units:{com:1}},T:{rel:1,res:'food',n:25}}},
      {lbl:'Pedirles algo más grande',cost:{res:'gold',n:8},g:{C:{tres:{key:'sal'},res:'gold',n:20},T:{tpob:[{k:'com',l:2},{k:'agr',l:1}]}}}]}},
  maestro:{ n:'El maestro del valle', tags:['S','O'],
    1:{ txt:'Un anciano maestro busca un lugar tranquilo donde enseñar lo que sabe', opts:[
      {t:'S',lbl:'Darle una casa junto a la biblioteca',cost:{res:'food',n:4},gain:{units:{cie:1}}},
      {t:'O',lbl:'Ofrecerle un rincón en el taller',cost:{res:'prod',n:5},gain:{units:{ing:1}}}]},
    2:{ S:{ txt:'El maestro pide libros y tiempo para escribir su saber', opts:[
          {t:'S',lbl:'Darle ciencia para sus estudios',cost:{res:'tech',n:4},gain:{res:'tech',n:14}},
          {t:'O',lbl:'Pedirle que enseñe a tus ingenieros',cost:{res:'food',n:3},gain:{units:{ing:1},prog:8}}]},
        O:{ txt:'El maestro quiere probar una herramienta nueva que ideó', opts:[
          {t:'O',lbl:'Pagar el hierro necesario',cost:{res:'prod',n:6},gain:{res:'prod',n:16}},
          {t:'S',lbl:'Pedirle que la explique por escrito',cost:{res:'gold',n:3},gain:{res:'tech',n:10}}]}},
    3:{ S:{ txt:'Sus alumnos más brillantes quieren seguirlo', opts:[
          {t:'S',lbl:'Abrir una escuela',cost:{res:'food',n:5},gain:{units:{cie:2}}},
          {t:'O',lbl:'Mandarlos a aprender oficios',cost:{res:'food',n:4},gain:{units:{ing:2}}}]},
        O:{ txt:'Los talleres del valle ya imitan sus herramientas', opts:[
          {t:'O',lbl:'Cobrar por enseñar a los vecinos',cost:null,gain:{res:'gold',n:12}},
          {t:'S',lbl:'Registrar su método por escrito',cost:{res:'prod',n:3},gain:{res:'tech',n:12}}]}},
    4:{ txt:{S:'El maestro, ya muy anciano, quiere dejarte lo mejor de su saber',O:'El maestro, ya muy anciano, quiere dejar sus herramientas a tu pueblo'}, opts:[
      {lbl:'Aceptar su legado',cost:null,g:{S:{saber:3},O:{bld:'taller'}}},
      {lbl:'Pedirle que forme a un discípulo',cost:{res:'food',n:8},g:{S:{tpob:[{k:'cie',l:2},{k:'ing',l:1}]},O:{tpob:[{k:'ing',l:2},{k:'agr',l:1}]}}}]}},
  heredero:{ n:'El heredero sin trono', tags:['R','T'],
    1:{ txt:'Un joven noble exiliado llega a tus puertas pidiendo asilo, y lo persiguen hombres armados', opts:[
      {t:'R',lbl:'Esconderlo y armar a tu gente',cost:{res:'prod',n:5},gain:{units:{sol:1}}},
      {t:'T',lbl:'Ponerlo a trabajar como uno más',cost:{res:'food',n:3},gain:{units:{pob:1}}},
      {t:'-',lbl:'Entregarlo a sus perseguidores',cost:null,gain:{res:'gold',n:15}}]},
    2:{ R:{ txt:'Sus perseguidores acampan cerca y exigen que lo entregues', opts:[
          {t:'R',lbl:'Poner tropas en la frontera',cost:{res:'gold',n:4},gain:{units:{sol:2}}},
          {t:'T',lbl:'Negociar con oro',cost:{res:'gold',n:8},gain:{prog:12}}]},
        T:{ txt:'El joven demuestra talento: organiza los almacenes y los repartos', opts:[
          {t:'T',lbl:'Darle más responsabilidad',cost:{res:'food',n:3},gain:{res:'prod',n:12}},
          {t:'R',lbl:'Pedirle que entrene a tus soldados',cost:{res:'prod',n:4},gain:{eq:{arq:2}}}]}},
    3:{ R:{ txt:'Un grupo de leales al joven llega con armas buscando a su señor', opts:[
          {t:'R',lbl:'Acogerlos como guardia',cost:{res:'food',n:6},gain:{units:{esc:2}}},
          {t:'T',lbl:'Pedirles que se queden de obreros',cost:{res:'food',n:4},gain:{units:{ing:2}}}]},
        T:{ txt:'El joven te propone nuevas rutas de reparto entre tus zonas', opts:[
          {t:'T',lbl:'Seguir su consejo',cost:{res:'gold',n:3},gain:{res:'gold',n:12,prog:8}},
          {t:'R',lbl:'Fortificar tu capital con su ayuda',cost:{res:'prod',n:6},gain:{eq:{esc:2}}}]}},
    4:{ txt:{R:'Los leales proclaman al joven señor de las armas, y te deben su vida',T:'El joven, ya hombre de confianza, quiere devolverte el favor'}, opts:[
      {lbl:'Aceptar su gratitud',cost:null,g:{R:{units:{cab:1,sol:2}},T:{res:'prod',n:20,prog:15}}},
      {lbl:'Pedirle un favor mayor',cost:{res:'gold',n:8},g:{R:{tpob:[{k:'ing',l:2},{k:'agr',l:2}]},T:{tres:{key:'madera'},res:'gold',n:20}}}]}}
};
Object.assign(STORIES, STORIES_EXTRA);   // 17 historias más (js/datos/historias_extra.js): en total 20
const STORY_IDS = Object.keys(STORIES);

// La marca que más elegiste (si empatan, la última).
function storyMajority(tags,all){ const c={}; all.forEach(t=>{ c[t]=0; }); tags.forEach(t=>{ if(c[t]!==undefined) c[t]++; }); const max=Math.max(...all.map(t=>c[t])); const tied=all.filter(t=>c[t]===max); for(let i=tags.length-1;i>=0;i--) if(tied.includes(tags[i])) return tags[i]; return tied[0]; }
// Arma el capítulo que le toca al jugador, ya con los montos de la partida.
/** @param {Partida} g */
function makeChapter(g,f){
  const st=g.F[f].story, S=STORIES[st.id]; if(!st) return null;
  const zs=zonesOf(g,f).filter(z=>(z.units[f]||[]).length); if(!zs.length) return null; const z=zs.find(z=>z.capital)||zs[0];
  const tag=st.tags.length?st.tags[st.tags.length-1]:S.tags[0]; let txt,opts;
  if(st.ch===1){ txt=S[1].txt; opts=S[1].opts; }
  else if(st.ch<4){ const v=S[st.ch][tag]; txt=v.txt; opts=v.opts; }
  else { const maj=storyMajority(st.tags,S.tags); txt=S[4].txt[maj]; opts=S[4].opts.map(o=>({t:'-',lbl:o.lbl,cost:o.cost,gain:o.g[maj]})); }
  return /** @type {Encuentro} */({id:'h_'+st.id+'_'+st.ch,k:'historia',who:'«'+S.n+'» · capítulo '+st.ch+' de 4',txt,zone:z.id,cost:null,gain:null,refuse:null,step:g.step,str:0,story:{id:st.id,ch:st.ch},
    opts:opts.map(o=>({lbl:o.lbl,t:o.t||'-',cost:o.cost?{res:o.cost.res,n:encAmount(g,o.cost.n)}:null,gain:scaleGain(g,o.gain)}))});
}
// Después de resolver un capítulo (aceptes o no): se anota el camino y se programa el siguiente.
/** @param {Partida} g */
function storyAdvance(g,f,tag,L){
  const st=g.F[f].story; if(!st||st.done) return; const S=STORIES[st.id];
  st.tags.push(tag&&tag!=='-'?tag:(st.tags[st.tags.length-1]||S.tags[0])); st.ch++;
  if(st.ch>4){ st.done=1; st.nextNew=g.step+STORY_BREAK_MIN+(g.step%(STORY_BREAK_MAX-STORY_BREAK_MIN+1)); L(PLN[f].name+' termina la historia «'+S.n+'».'); g.fx.push({k:'storyend',f}); } else st.next=g.step+STORY_GAP;
}
