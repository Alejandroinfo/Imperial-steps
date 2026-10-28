'use strict';
// Idioma de la interfaz (español por defecto, inglés opcional).
// El juego está escrito en español; para ofrecer inglés sin reescribir cada texto, un traductor cambia lo que aparece en pantalla
// usando un diccionario (js/idiomas/en_*.js). Las entradas con {0}, {1}… son plantillas para frases con números o nombres.
// Lo que no esté en el diccionario se queda en español y se puede descargar desde el Menú para completarlo.
const LANG={cur:'es',dict:new Map(),pats:[],cache:new Map(),missing:new Map(),enSet:new Set()};
const LANG_EN_RE=/\b(the|to|per|you|your|of|and|for|is|with|would|give|missing|steps?|offer|grow|recruit|every|auction|help|now)\b/i;   // ya está en inglés: no se registra como pendiente
const LANG_ATTRS=['title','aria-label','placeholder','alt'];
function i18nAdd(obj){
  for(const k in obj){ LANG.enSet.add(obj[k]); if(/\{\d+\}/.test(k)){ const parts=k.split(/\{\d+\}/); const re=new RegExp('^'+parts.map(p=>p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.+?)')+'$','s'); LANG.pats.push({re,out:obj[k],n:k.length}); } else LANG.dict.set(k,obj[k]); }
  LANG.pats.sort((a,b)=>b.n-a.n); LANG.cache.clear();
}
function i18nExact(s){ return LANG.dict.has(s)?LANG.dict.get(s):null; }
// Traduce un texto completo; devuelve null si no hay traducción.
function i18nCore(core){
  if(LANG.cache.has(core)) return LANG.cache.get(core);
  let r=i18nExact(core);
  if(r===null) for(const p of LANG.pats){ const m=core.match(p.re); if(m){ r=p.out.replace(/\{(\d+)\}/g,(_,i)=>{ const g=m[Number(i)+1]; if(g===undefined) return ''; const t=i18nCore(g.trim()); return t===null?g:t; }); break; } }
  if(r===null&&core.includes(', ')){ const parts=core.split(', '); const ts=parts.map(x=>i18nCore(x.trim())); if(ts.every(x=>x!==null)) r=ts.join(', '); }   // listas: «Cargamento, Saber»
  LANG.cache.set(core,r); return r;
}
const LANG_ES_RE=/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}/;
function i18n(s){
  if(LANG.cur==='es'||typeof s!=='string') return s;
  const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/); const core=m[2]; if(!core||!LANG_ES_RE.test(core)) return s;
  let r=i18nCore(core), pre='';
  if(r===null){ const pm=core.match(/^([^\p{L}\p{N}{¿¡«(+\-]+)(\p{L}[\s\S]*)$/u); if(pm){ const t=i18nCore(pm[2]); if(t!==null){ pre=pm[1]; r=t; } } }   // quita adornos del principio (emoji, ★, ▶…)
  if(r===null){ if(!LANG_EN_RE.test(core)&&!LANG.enSet.has(core)) LANG.missing.set(core,(LANG.missing.get(core)||0)+1); return s; }
  return m[1]+pre+r+m[3];
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
