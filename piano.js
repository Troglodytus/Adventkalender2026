/* Public-domain Radetzky March (J. Strauss I, op. 228).
Simplified monophonic theme from the historical piano score (Wikimedia Commons / IMSLP).
No recording, dependencies, or remote audio assets. */
(() => {
"use strict";
function judge(melody,length,entered,note){
 if(entered.length>=length||note!==melody[entered.length])return "wrong";
 return entered.length+1===length?"complete":"next";
}
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const hint=node("p","pi-hint","Höre die Tonfolge und spiele sie anschließend aus dem Gedächtnis nach. In jeder Runde kommen neue Töne hinzu.");
 const instrument=node("div","pi-instrument");
 const plaque=node("div","pi-plaque");plaque.append(node("span","pi-brand","Café Gluck"),node("span","pi-city","WIEN"));instrument.append(plaque);
 const keyboard=node("div","pi-keyboard");keyboard.setAttribute("role","group");keyboard.setAttribute("aria-label","Klaviertastatur");
 const white=[72,74,76,77,79,81,83,84],black=[{m:73,pos:1},{m:75,pos:2},{m:78,pos:4},{m:80,pos:5},{m:82,pos:6}];
 const names=["C","Cis","D","Dis","E","F","Fis","G","Gis","A","B","H"];
 const keys=new Map(),keyMap={a:72,w:73,s:74,e:75,d:76,f:77,t:78,g:79,y:80,h:81,u:82,j:83,k:84};
 function makeKey(m,isBlack,pos){
  const n=node("button","pi-key "+(isBlack?"pi-black":"pi-white"));n.type="button";n.setAttribute("aria-label",names[m%12]+Math.floor(m/12-1));
  if(isBlack)n.style.left=(pos/8*100)+"%";else n.style.left=(pos/8*100)+"%";
  n.addEventListener("click",()=>hit(m));keyboard.append(n);keys.set(m,n);
 }
 white.forEach((m,i)=>makeKey(m,false,i));black.forEach(o=>makeKey(o.m,true,o.pos));
 instrument.append(keyboard);
 const rounds=node("div","pi-rounds");rounds.setAttribute("aria-label","Rundenfortschritt");
 const badges=config.rounds.map((_,i)=>{const n=node("span","pi-round",String(i+1));rounds.append(n);return n;});
 const status=node("p","pi-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const notes=node("div","pi-notes");notes.setAttribute("aria-label","Eingabefortschritt");
 const controls=node("div","pi-controls");
 const start=node("button","pi-action","Melodie anhören");start.type="button";
 const reset=node("button","pi-reset","Neu beginnen");reset.type="button";
 const mute=node("button","pi-reset","Ton aus");mute.type="button";mute.setAttribute("aria-pressed","false");
 controls.append(start,reset,mute);
 const result=node("div","pi-result");result.append(node("span","pi-fragment-label","FRAGMENT"),node("strong","",config.fragment),node("p","pi-piece",config.piece));
 const help=node("p","pi-help","Die richtige Reihenfolge zählt, nicht das Tempo. Die Tasten leuchten beim Vorspielen auf.");
 root.append(hint,instrument,rounds,status,notes,controls,help,result);
 let round=options.completed?config.rounds.length:0,entered=[],phase=options.completed?"done":"idle",reported=!!options.completed,disposed=false,muted=false,audio=null,gain=null,serial=0;
 const timers=new Set(),voices=new Set();
 const schedule=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);return id;};
 function clearLights(){keys.forEach(n=>n.classList.remove("pi-lit","pi-hit","pi-error"));}
 function stop(){
  serial++;timers.forEach(id=>clearTimeout(id));timers.clear();clearLights();
  for(const o of voices){try{o.stop();}catch{}}
  voices.clear();
 }
 function audioReady(){
  if(muted)return;
  try{
   if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();gain=audio.createGain();gain.gain.value=.45;gain.connect(audio.destination);}
   if(audio.state==="suspended")audio.resume().catch(()=>{});
  }catch{}
 }
 function tone(m,seconds=.32){
  if(muted||!audio||audio.state!=="running"||disposed)return;
  const now=audio.currentTime,freq=440*2**((m-69)/12);
  for(const [multiple,amp,decay] of [[1,.28,.8],[2,.10,.55],[3,.04,.35],[4,.018,.25]]){
   const o=audio.createOscillator(),env=audio.createGain();o.type="sine";o.frequency.value=freq*multiple;
   env.gain.setValueAtTime(.0001,now);env.gain.exponentialRampToValueAtTime(amp,now+.009);env.gain.exponentialRampToValueAtTime(amp*.13,now+Math.max(.05,seconds*decay));env.gain.exponentialRampToValueAtTime(.0001,now+seconds+.16);
   o.connect(env);env.connect(gain);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();env.disconnect();};o.start(now);o.stop(now+seconds+.18);
  }
 }
 function paint(){
  const done=phase==="done",len=done?config.rounds.at(-1):config.rounds[round];
  badges.forEach((n,i)=>{n.classList.toggle("pi-passed",i<round);n.classList.toggle("pi-current",i===round&&!done);n.textContent=i<round?"✓":String(i+1);});
  notes.replaceChildren();if(!done)for(let i=0;i<len;i++){const dot=node("span","pi-note"+(i<entered.length?" pi-note-filled":""));dot.setAttribute("aria-hidden","true");notes.append(dot);}
  keys.forEach(n=>{n.disabled=phase!=="input";});
  start.disabled=phase==="playing"||phase==="transition"||done;
  start.textContent=phase==="input"?"Noch einmal anhören":phase==="wrong"?"Runde wiederholen":"Melodie anhören";
  result.hidden=!done;instrument.classList.toggle("pi-done",done);instrument.classList.toggle("pi-wrong",phase==="wrong");
  if(done)status.textContent="Alle fünf Runden gemeistert.";
  else if(phase==="playing")status.textContent="Runde "+(round+1)+" / 5 · Höre aufmerksam zu.";
  else if(phase==="input")status.textContent="Runde "+(round+1)+" / 5 · Spiele die "+len+" Töne nach ("+entered.length+" / "+len+").";
  else if(phase==="wrong")status.textContent="Ein falscher Ton. Versuche diese Runde erneut.";
  else if(phase==="transition")status.textContent="Richtig! Die Melodie wird länger …";
  else status.textContent="Runde 1 / 5 · "+len+" Töne";
 }
 function playback(){
  if(disposed||phase==="done")return;
  stop();audioReady();entered=[];phase="playing";paint();
  const token=serial,len=config.rounds[round],beat=275;let offset=500;
  for(let i=0;i<len;i++){
   const m=config.melody[i],duration=config.rhythm[i]*beat;
   const sounding=Math.min(duration-60,230);
   schedule(()=>{if(serial!==token)return;clearLights();keys.get(m).classList.add("pi-lit");tone(m,sounding/1000);},offset);
   schedule(()=>{if(serial===token)keys.get(m).classList.remove("pi-lit");},offset+sounding);
   offset+=duration;
  }
  schedule(()=>{if(serial!==token)return;clearLights();phase="input";paint();},offset+300);
 }
 function hit(m){
  if(phase!=="input"||disposed)return;
  audioReady();tone(m,.26);const outcome=judge(config.melody,config.rounds[round],entered,m),key=keys.get(m);
  key.classList.remove("pi-hit","pi-error");void key.offsetWidth;
  key.classList.add(outcome==="wrong"?"pi-error":"pi-hit");
  schedule(()=>key.classList.remove("pi-hit","pi-error"),260);
  if(outcome==="wrong"){phase="wrong";paint();return;}
  entered.push(m);
  if(outcome==="complete"){
   if(round===config.rounds.length-1){round=config.rounds.length;phase="done";paint();if(!reported){reported=true;options.onSolved();}}
   else{phase="transition";paint();schedule(()=>{round++;playback();},900);}
  }else paint();
 }
 start.onclick=()=>{audioReady();playback();};
 reset.onclick=()=>{stop();round=0;entered=[];phase="idle";paint();};
 mute.onclick=()=>{muted=!muted;mute.textContent=muted?"Ton an":"Ton aus";mute.setAttribute("aria-pressed",String(muted));if(gain)gain.gain.value=muted?0:.45;if(!muted)audioReady();};
 function keydown(e){if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||phase!=="input")return;const m=keyMap[e.key.toLowerCase()];if(m!==undefined){e.preventDefault();hit(m);}}
 root.addEventListener("keydown",keydown);
 paint();
 return ()=>{disposed=true;stop();root.removeEventListener("keydown",keydown);if(audio&&audio.state!=="closed")audio.close().catch(()=>{});root.replaceChildren();};
}
window.MendelPiano={mount,judge};
})();