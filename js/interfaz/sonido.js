'use strict';
// Sonido del juego, generado con Web Audio (sin archivos): efectos de cada acción y un ambiente
// suave de viento y pájaros. El navegador solo deja sonar después de un clic, así que el audio
// se enciende con la primera interacción (el botón Empezar).

const SFX={ctx:null,master:null,on:true,vol:0.55,amb:true,ambNodes:null,last:{},birdT:null};

function sfxInit(){
  if(SFX.ctx) { if(SFX.ctx.state==='suspended') SFX.ctx.resume(); return; }
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  const ctx=new AC(); SFX.ctx=ctx;
  const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=4; comp.connect(ctx.destination);
  SFX.master=ctx.createGain(); SFX.master.gain.value=SFX.on?SFX.vol:0; SFX.master.connect(comp);
  if(SFX.amb) ambientStart();
}
function sfxSetVolume(v){ SFX.vol=v; if(SFX.master) SFX.master.gain.setTargetAtTime(SFX.on?v:0,SFX.ctx.currentTime,0.05); }
function sfxSetOn(on){ SFX.on=on; sfxSetVolume(SFX.vol); }

/* ---------- piezas básicas ---------- */
function tone(freq,dur,o){
  o=o||{}; const c=SFX.ctx; if(!c) return; const t=c.currentTime+(o.at||0);
  const osc=c.createOscillator(), g=c.createGain(); osc.type=o.type||'sine'; osc.frequency.setValueAtTime(freq,t);
  if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to,t+dur);
  const peak=(o.gain||0.3), a=o.attack||0.005;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  osc.connect(g); g.connect(o.dest||SFX.master); osc.start(t); osc.stop(t+dur+0.02);
}
let NOISE=null;
function noiseBuf(){ if(NOISE) return NOISE; const c=SFX.ctx, n=c.sampleRate*1.5, b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; NOISE=b; return b; }
function noise(dur,o){
  o=o||{}; const c=SFX.ctx; if(!c) return; const t=c.currentTime+(o.at||0);
  const src=c.createBufferSource(); src.buffer=noiseBuf(); const f=c.createBiquadFilter(); f.type=o.ftype||'bandpass'; f.frequency.setValueAtTime(o.freq||1200,t); f.Q.value=o.q||1;
  if(o.to) f.frequency.exponentialRampToValueAtTime(o.to,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(o.gain||0.3,t+(o.attack||0.004)); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(f); f.connect(g); g.connect(o.dest||SFX.master); src.start(t,Math.random()*0.5); src.stop(t+dur+0.02);
}
const NOTE=n=>440*Math.pow(2,(n-69)/12);   // número MIDI → frecuencia

/* ---------- efectos ---------- */
const SOUNDS={
  click:()=>tone(1800,0.04,{type:'triangle',gain:0.06}),
  select:()=>{ tone(660,0.07,{type:'triangle',gain:0.09}); tone(990,0.06,{type:'triangle',gain:0.05,at:0.03}); },
  ready:()=>{ [76,83].forEach((n,i)=>tone(NOTE(n),0.5,{type:'sine',gain:0.16,at:i*0.08})); tone(NOTE(88),0.7,{type:'sine',gain:0.06,at:0.16}); },
  unready:()=>tone(NOTE(71),0.18,{type:'triangle',gain:0.1,to:NOTE(64)}),
  step:()=>{ tone(110,0.35,{type:'sine',gain:0.35,to:55}); noise(0.18,{freq:180,q:0.7,gain:0.18}); tone(NOTE(57),0.6,{type:'triangle',gain:0.07,at:0.05}); },
  move:()=>{ for(let i=0;i<4;i++) noise(0.06,{freq:500+Math.random()*200,q:2,gain:0.07,at:i*0.14}); },
  hammer:()=>{ for(let i=0;i<3;i++){ noise(0.08,{freq:2400,q:6,gain:0.16,at:i*0.16}); tone(320,0.09,{type:'square',gain:0.04,at:i*0.16}); } },
  built:()=>{ SOUNDS.hammer(); [72,76,79].forEach((n,i)=>tone(NOTE(n),0.45,{type:'triangle',gain:0.1,at:0.55+i*0.07})); },
  upgrade:()=>{ [74,79,83].forEach((n,i)=>tone(NOTE(n),0.4,{type:'triangle',gain:0.09,at:i*0.07})); },
  tech:()=>{ [81,85,88,93].forEach((n,i)=>tone(NOTE(n),0.5,{type:'sine',gain:0.09,at:i*0.06})); noise(0.5,{ftype:'highpass',freq:6000,gain:0.03,attack:0.05}); },
  coin:()=>{ tone(NOTE(88),0.12,{type:'square',gain:0.04}); tone(NOTE(95),0.25,{type:'square',gain:0.04,at:0.06}); },
  born:()=>{ tone(NOTE(84),0.35,{type:'sine',gain:0.12}); tone(NOTE(91),0.45,{type:'sine',gain:0.08,at:0.09}); },
  spec:()=>tone(NOTE(79),0.1,{type:'triangle',gain:0.08,to:NOTE(86)}),
  train:()=>{ noise(0.12,{freq:3500,q:8,gain:0.1}); tone(NOTE(55),0.2,{type:'square',gain:0.05}); },
  clash:()=>{ noise(0.16,{freq:3200+Math.random()*1200,q:9,gain:0.2}); tone(1500+Math.random()*700,0.18,{type:'square',gain:0.03}); },
  miss:()=>noise(0.18,{freq:900,to:2500,q:1.5,gain:0.06}),
  thud:()=>{ tone(90,0.25,{type:'sine',gain:0.3,to:45}); noise(0.12,{freq:250,q:1,gain:0.15}); },
  battle:()=>{ for(let i=0;i<5;i++) noise(0.14,{freq:2800+Math.random()*1500,q:8,gain:0.13,at:i*0.11+Math.random()*0.05}); tone(70,0.5,{type:'sine',gain:0.2,to:40}); },
  fanfare:()=>{ [[67,0],[72,0.14],[76,0.28],[79,0.42],[84,0.6]].forEach(([n,t])=>{ tone(NOTE(n),t===0.6?0.8:0.2,{type:'sawtooth',gain:0.06,at:t}); tone(NOTE(n-12),t===0.6?0.8:0.2,{type:'triangle',gain:0.05,at:t}); }); },
  goodEvent:()=>{ [60,64,67,72].forEach((n,i)=>tone(NOTE(n),0.7,{type:'triangle',gain:0.07,at:i*0.09})); },
  badEvent:()=>{ [64,61,57,52].forEach((n,i)=>tone(NOTE(n),0.7,{type:'triangle',gain:0.08,at:i*0.11})); noise(0.6,{freq:300,q:0.6,gain:0.05,attack:0.2}); },
  horn:()=>{ tone(NOTE(50),0.9,{type:'sawtooth',gain:0.07,attack:0.12}); tone(NOTE(57),0.9,{type:'sawtooth',gain:0.05,attack:0.12,at:0.05}); },
  warn:()=>{ tone(NOTE(69),0.15,{type:'triangle',gain:0.08}); tone(NOTE(69),0.15,{type:'triangle',gain:0.08,at:0.2}); },
  out:()=>{ tone(NOTE(45),1.4,{type:'sine',gain:0.25,attack:0.02}); tone(NOTE(52),1.4,{type:'sine',gain:0.1,at:0.02}); },
  victory:()=>{ SOUNDS.fanfare(); [[72,0.9],[76,1.05],[79,1.2],[84,1.4],[88,1.6]].forEach(([n,t])=>tone(NOTE(n),0.9,{type:'triangle',gain:0.08,at:t})); },
  encounter:()=>{ [67,71,74,79,83].forEach((n,i)=>tone(NOTE(n),0.6,{type:'triangle',gain:0.07,at:i*0.07})); },
  defeat:()=>{ [[67,0],[63,0.35],[60,0.7],[55,1.1]].forEach(([n,t])=>tone(NOTE(n),0.6,{type:'triangle',gain:0.09,at:t})); }
};
// Reproduce un efecto. Evita repetir el mismo efecto muchas veces seguidas.
function sfx(name,minGap){
  if(!SFX.ctx||!SFX.on||!SOUNDS[name]) return;
  const now=performance.now(); if(now-(SFX.last[name]||0)<(minGap===undefined?70:minGap)) return; SFX.last[name]=now;
  try{ SOUNDS[name](); }catch(e){}
}
function sfxLater(name,ms,gap){ setTimeout(()=>sfx(name,gap),ms); }

/* ---------- ambiente: viento y pájaros ---------- */
function ambientStart(){
  const c=SFX.ctx; if(!c||SFX.ambNodes) return;
  const src=c.createBufferSource(); src.buffer=noiseBuf(); src.loop=true;
  const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; f.Q.value=0.6;
  const g=c.createGain(); g.gain.value=0.045;
  const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=0.07; lg.gain.value=180; lfo.connect(lg); lg.connect(f.frequency);
  src.connect(f); f.connect(g); g.connect(SFX.master); src.start(); lfo.start();
  SFX.ambNodes={src,lfo,g};
  const bird=()=>{ if(!SFX.ambNodes) return; if(SFX.on&&document.visibilityState==='visible'){ const base=2200+Math.random()*1600, n=2+Math.floor(Math.random()*4);
      for(let i=0;i<n;i++) tone(base*(1+Math.random()*0.15),0.09,{type:'sine',gain:0.025,to:base*(1.25+Math.random()*0.3),at:i*0.12}); }
    SFX.birdT=setTimeout(bird,3500+Math.random()*7000); };
  SFX.birdT=setTimeout(bird,2500);
}
function ambientStop(){ if(!SFX.ambNodes) return; try{ SFX.ambNodes.src.stop(); SFX.ambNodes.lfo.stop(); }catch(e){} SFX.ambNodes=null; clearTimeout(SFX.birdT); }
function sfxSetAmbient(on){ SFX.amb=on; if(on&&SFX.ctx) ambientStart(); else ambientStop(); }
