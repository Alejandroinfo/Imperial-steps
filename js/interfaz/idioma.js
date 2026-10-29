'use strict';
// Idioma de la interfaz (español por defecto, inglés opcional).
// El juego está escrito en español; para ofrecer inglés sin reescribir cada texto, un traductor cambia lo que aparece en pantalla
// usando un diccionario (js/idiomas/en_*.js). Las entradas con {0}, {1}… son plantillas para frases con números o nombres.
// Lo que no esté en el diccionario se queda en español y se puede descargar desde el Menú para completarlo.
const LANG={cur:'es',dict:new Map(),pats:[],cache:new Map(),missing:new Map(),enSet:new Set()};
const LANG_EN_RE=/\b(the|to|per|you|your|of|and|for|is|with|would|give|missing|steps?|offer|grow|recruit|every|auction|help|now|in|next|from|at|by|not|are|has|its|this|that|will|can|it|settler|settlers)\b/i;   // ya está en inglés: no se registra como pendiente
const LANG_ATTRS=['title','aria-label','placeholder','alt'];
function i18nAdd(obj){
  for(const k in obj){ LANG.enSet.add(obj[k]); if(/\{\d+#?\}/.test(k)){ const parts=k.split(/\{\d+#?\}/), marks=k.match(/\{\d+#?\}/g); let src=''; parts.forEach((p,i)=>{ src+=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); if(i<marks.length) src+=marks[i].includes('#')?'(\\d+)':'(.+?)'; }); LANG.pats.push({re:new RegExp('^'+src+'$','s'),out:obj[k],n:k.length}); } else LANG.dict.set(k,obj[k]); }   // {0} = cualquier texto; {0#} = solo dígitos
  LANG.pats.sort((a,b)=>b.n-a.n); LANG.cache.clear();
}
// Bloques de la Guía (HTML de un <p>, <li>, <td>…): tabla aparte, para que las plantillas sueltas del resto del juego no los toquen.
LANG.blocks=new Map(); LANG.blockPats=[];
function i18nAddBlocks(obj){
  for(const k in obj){ LANG.enSet.add(obj[k]);
    if(/\{\d+#?\}/.test(k)){ const parts=k.split(/\{\d+#?\}/), marks=k.match(/\{\d+#?\}/g); let src=''; parts.forEach((p,i)=>{ src+=p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); if(i<marks.length) src+=marks[i].includes('#')?'(\\d+)':'(.+?)'; }); LANG.blockPats.push({re:new RegExp('^'+src+'$','s'),out:obj[k]}); }
    else LANG.blocks.set(k,obj[k]); }
}
function i18nBlock(key){ if(LANG.blocks.has(key)) return LANG.blocks.get(key); for(const p of LANG.blockPats){ const m=key.match(p.re); if(m) return p.out.replace(/\{(\d+)#?\}/g,(_,i)=>m[Number(i)+1]||''); } return null; }
function i18nExact(s){ return LANG.dict.has(s)?LANG.dict.get(s):null; }
// Traduce un texto completo; devuelve null si no hay traducción.
function i18nCore(core){
  if(LANG.cache.has(core)) return LANG.cache.get(core);
  let r=i18nExact(core);
  if(r===null&&core.includes('\n')){ const ls=core.split('\n').map(x=>x.trim()?i18nCore(x.trim()):''); if(core.split('\n').every((x,i)=>!x.trim()||ls[i]!==null)) r=ls.join('\n'); }   // varias líneas (avisos del paso)
  if(r===null&&core.includes(' y ')&&!/[:.]/.test(core)){ const ts=core.split(' y ').map(x=>i18nCore(x.trim())); if(ts.every(x=>x!==null)) r=ts.join(' and '); }   // «2 soldados y 1 arquero»
  if(r===null) for(const p of LANG.pats){ const m=core.match(p.re); if(m){ r=p.out.replace(/\{(\d+)#?\}/g,(_,i)=>{ const g=m[Number(i)+1]; if(g===undefined) return ''; const t=i18nCore(g.trim()); return t===null?g:t; }); break; } }
  if(r===null&&/ [·→]$/.test(core)){ const t=i18nCore(core.slice(0,-2).trim()); if(t!==null) r=t+core.slice(-2); }   // «Red de pesca ·»
  if(r===null&&core.includes(' + ')){ const ts=core.split(' + ').map(x=>i18nCore(x.trim())); if(ts.every(x=>x!==null)) r=ts.join(' + '); }   // «Prosperidad + Inspiración»
  if(r===null&&/[.!]$/.test(core)&&core.length>4){ const t=i18nCore(core.slice(0,-1)); if(t!==null) r=t+core.slice(-1); }   // el mismo texto con punto final
  if(r===null&&core.includes(', ')){ const parts=core.split(', '); const ts=parts.map(x=>i18nCore(x.trim())); if(ts.every(x=>x!==null)) r=ts.join(', '); }   // listas: «Cargamento, Saber»
  LANG.cache.set(core,r); return r;
}
const LANG_ES_RE=/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/;
function i18n(s){
  if(LANG.cur==='es'||typeof s!=='string') return s;
  const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/); const core=m[2]; if(!core||!LANG_ES_RE.test(core)) return s;
  let r=i18nExact(core), pre='';
  if(r===null){ const pm=core.match(/^([^\p{L}\p{N}{¿¡«(+\-]+)(\p{L}[\s\S]*)$/u); if(pm){ const t=i18nCore(pm[2]); if(t!==null){ pre=pm[1]; r=t; } } }   // quita adornos del principio (emoji, ★, ▶…) antes de probar plantillas: «👶 en 3 pasos»
  if(r===null) r=i18nCore(core);
  if(r===null){ if(!LANG_EN_RE.test(core)&&!LANG.enSet.has(core)) LANG.missing.set(core,(LANG.missing.get(core)||0)+1); return s; }
  return m[1]+pre+r+m[3];
}
// Para textos con etiquetas (<b>…</b>) que se arman completos antes de mostrarse (inicio guiado): se traduce la frase entera, así el orden de las palabras en inglés es natural.
function i18nHTML(s){ if(LANG.cur==='es'||typeof s!=='string') return s; const r=i18nCore(s); return r===null?s:'<span data-noi18n>'+r+'</span>'; }   // lo traducido se marca para que el traductor de nodos no lo toque otra vez
// Artículos de la Guía: se traducen por bloques (<p>, <li>, <td>…) con búsqueda exacta; los dibujos <svg> se apartan y se devuelven a su lugar.
const LANG_BLOCK=/<(p|li|td|th|h4|div)(\s[^>]*)?>((?:(?!<\/?(?:p|li|ul|ol|table|tr|td|th|h4|div)\b)[\s\S])*?)<\/\1>/g;
function i18nBlocks(html){
  if(LANG.cur==='es'||typeof html!=='string') return html;
  return html.replace(LANG_BLOCK,(m,t,a,inner)=>{
    const svgs=[]; const key=inner.replace(/<svg[\s\S]*?<\/svg>/g,x=>{ svgs.push(x); return '⟦svg⟧'; }).trim();
    const r=i18nBlock(key); if(r===null){ if(LANG_ES_RE.test(key.replace(/<[^>]+>/g,'')) ) LANG.missing.set(key,(LANG.missing.get(key)||0)+1); return m; }
    let i=0; return '<'+t+(a||'')+' data-noi18n>'+r.replace(/⟦svg⟧/g,()=>svgs[i++]||'')+'</'+t+'>';
  });
}
const LANG_SKIP=/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/;
function i18nNode(n){
  if(n.__en!==undefined&&n.nodeValue===n.__en) return;
  const p=n.parentNode; if(!p||LANG_SKIP.test(p.nodeName)||(p.closest&&p.closest('[data-noi18n]'))) return;
  const es=(n.__es!==undefined&&n.nodeValue===n.__en)?n.__es:n.nodeValue; const en=i18n(es);
  if(en!==es){ n.__es=es; n.__en=en; n.nodeValue=en; }
}
function i18nAttrs(el){
  if(!el.getAttribute||el.tagName==='X-IC') return;
  LANG_ATTRS.forEach(a=>{ const v=el.getAttribute(a); if(v===null) return; const cur=el['__en_'+a]; if(cur!==undefined&&cur===v) return; const en=i18n(v); if(en!==v){ el['__es_'+a]=v; el['__en_'+a]=en; el.setAttribute(a,en); } });
}
function i18nApply(root){
  if(LANG.cur==='es'||!root) return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const ns=[]; while(w.nextNode()) ns.push(w.currentNode); ns.forEach(i18nNode);
  if(root.nodeType===1){ i18nAttrs(root); root.querySelectorAll&&root.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(i18nAttrs); }
}
// Volver al español: se restauran los textos originales.
function i18nRestore(){
  const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); const ns=[]; while(w.nextNode()) ns.push(w.currentNode);
  ns.forEach(n=>{ if(n.__es!==undefined&&n.nodeValue===n.__en){ n.nodeValue=n.__es; } n.__es=n.__en=undefined; });
  document.querySelectorAll('[title],[aria-label],[placeholder],[alt]').forEach(el=>LANG_ATTRS.forEach(a=>{ if(el['__es_'+a]!==undefined&&el.getAttribute(a)===el['__en_'+a]) el.setAttribute(a,el['__es_'+a]); el['__es_'+a]=el['__en_'+a]=undefined; }));
}
function setLang(l){
  l=l==='en'?'en':'es'; if(l===LANG.cur&&LANG._init) return; LANG._init=true;
  if(l==='es'&&LANG.cur==='en') i18nRestore();
  LANG.cur=l; LANG.cache.clear(); document.documentElement.lang=l; try{ localStorage.setItem('pasos_idioma',l); }catch(e){}
  { const n=document.getElementById('lgNote'); if(n) n.hidden=l!=='en'; }
  ['lgEs','lgEn'].forEach(id=>{ const b=document.getElementById(id); if(b) b.setAttribute('aria-pressed',String((id==='lgEn')===(l==='en'))); });
  if(l==='en') i18nApply(document.body);
  if(typeof G!=='undefined'&&G&&typeof ui!=='undefined'&&ui) render();
}
function downloadMissing(){
  const list=[...LANG.missing.entries()].sort((a,b)=>b[1]-a[1]); const obj={}; list.forEach(([k])=>{ obj[k]=''; });
  const blob=new Blob([JSON.stringify(obj,null,1)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='textos_sin_traducir.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function initIdioma(){
  let l='es'; try{ l=localStorage.getItem('pasos_idioma')==='en'?'en':'es'; }catch(e){}
  new MutationObserver(ms=>{ if(LANG.cur==='es') return; for(const m of ms){
      if(m.type==='attributes'){ i18nAttrs(m.target); continue; }
      if(m.type==='characterData'){ i18nNode(m.target); continue; }
      m.addedNodes.forEach(n=>{ if(n.nodeType===3) i18nNode(n); else if(n.nodeType===1) i18nApply(n); }); } })
    .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:LANG_ATTRS});
  setLang(l);
}
