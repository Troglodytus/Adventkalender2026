/* Reusable, checked crossword with shared crossing cells and numbered extraction. */
(() => {
"use strict";
const build=function build(config){
 const cells=new Map(),entries=config.words.map((word,id)=>{
 const keys=Array.from(word.answer,(letter,i)=>{
 const x=word.x+(word.dir==="across"?i:0),y=word.y+(word.dir==="down"?i:0),key=x+","+y;
 if(x<0||y<0||x>=config.width||y>=config.height)throw Error("Cell out of bounds");
 let cell=cells.get(key);
 if(!cell){cell={x,y,letter,words:[],number:null};cells.set(key,cell);}
 if(cell.letter!==letter)throw Error("Crossing conflict "+key);
 if(cell.words.some(w=>config.words[w].dir===word.dir))throw Error("Parallel overlap "+key);
 cell.words.push(id);if(i===0){if(cell.number!==null&&cell.number!==word.number)throw Error("Number conflict");cell.number=word.number;}
 return key;
 });return {...word,keys,id};});
 const marks=new Map(config.extract.map((xy,i)=>[xy.join(","),i]));
 for(const k of marks.keys())if(!cells.has(k))throw Error("Invalid extraction");
 return {cells,entries,marks};
};
function mount(root,config,options){
 root.replaceChildren();
 const {cells,entries,marks}=build(config);
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const hint=node("p","cw-hint","Finde die Begriffe im Text und lies die goldenen Felder in ihrer nummerierten Reihenfolge.");
 const grid=node("div","cw-grid");grid.style.gridTemplateColumns="repeat("+config.width+", minmax(0, 1fr))";grid.setAttribute("role","group");grid.setAttribute("aria-label","Kreuzworträtsel");
 const fields=new Map(),clueButtons=new Map();
 let active=0,reported=Boolean(options.completed),done=false;
 for(let y=0;y<config.height;y++)for(let x=0;x<config.width;x++){
  const key=x+","+y,c=cells.get(key);
  if(!c){const blank=node("div","cw-blank");blank.setAttribute("aria-hidden","true");grid.append(blank);continue;}
  const tile=node("div","cw-cell");const mark=marks.get(key);
  if(mark!==undefined){tile.classList.add("cw-marked");tile.append(node("span","cw-mark-number",String(mark+1)));}
  if(c.number!==null)tile.append(node("span","cw-clue-number",String(c.number)));
  const input=node("input","cw-input");input.type="text";input.maxLength=1;input.autocomplete="off";input.autocapitalize="characters";input.spellcheck=false;input.setAttribute("aria-label","Zeile "+(y+1)+", Spalte "+(x+1)+(mark===undefined?"":", Lösungsfeld "+(mark+1)));
  if(options.completed)input.value=c.letter;
  tile.append(input);grid.append(tile);fields.set(key,{input,tile});
  input.addEventListener("focus",()=>{if(!c.words.includes(active))active=c.words[0];input.select();paint();});
  input.addEventListener("click",()=>{if(c.words.length>1&&document.activeElement===input&&lastClicked===key){active=c.words.find(w=>w!==active)??active;paint();}lastClicked=key;});
  input.addEventListener("input",()=>{input.value=clean(input.value).slice(-1);paint();if(input.value&&!done)advance(key,1);});
  input.addEventListener("paste",e=>{e.preventDefault();const text=clean(e.clipboardData.getData("text"));const seq=entries[active].keys,start=seq.indexOf(key);text.slice(0,seq.length-start).split("").forEach((ch,i)=>{fields.get(seq[start+i]).input.value=ch;});paint();if(!done)focus(seq[Math.min(seq.length-1,start+text.length)],active);});
  input.addEventListener("keydown",e=>{
   const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
   if(delta){e.preventDefault();const next=(x+delta[0])+","+(y+delta[1]);const dir=delta[0]?"across":"down";const entry=c.words.find(w=>entries[w].dir===dir);if(entry!==undefined)active=entry;if(fields.has(next))focus(next,active);else paint();}
   else if(e.key==="Backspace"&&!input.value){e.preventDefault();advance(key,-1,true);}
   else if(e.key==="Enter"){e.preventDefault();const next=entries.find(w=>w.keys.some(k=>!fields.get(k).input.value));if(next)focus(next.keys[0],next.id);}
  });
 }
 let lastClicked=null;
 function clean(s){return String(s).toUpperCase().replace(/[^A-ZÄÖÜ]/g,"");}
 function focus(key,id){if(!fields.has(key))return;active=id;fields.get(key).input.focus({preventScroll:true});paint();}
 function advance(key,step,erase=false){const seq=entries[active].keys,i=seq.indexOf(key),next=seq[i+step];if(next){if(erase)fields.get(next).input.value="";focus(next,active);}}
 const clues=node("div","cw-clues");
 for(const [dir,heading] of [["across","Waagerecht"],["down","Senkrecht"]]){
 const group=node("section","cw-clue-group");group.append(node("h3","cw-clue-heading",heading));
 for(const w of entries.filter(w=>w.dir===dir).sort((a,b)=>a.number-b.number)){
 const button=node("button","cw-clue",w.number+". "+w.clue+" ("+w.answer.length+")");button.type="button";button.onclick=()=>{lastClicked=null;focus(w.keys.find(k=>!fields.get(k).input.value)||w.keys[0],w.id);};clueButtons.set(w.id,button);group.append(button);
 }clues.append(group);
 }
 const result=node("div","cw-result");result.append(node("p","cw-label","Fragment"));
 const strip=node("div","cw-strip"),boxes=config.extract.map((_,i)=>{const el=node("div","cw-fragment");el.append(node("span","cw-frag-index",String(i+1)),node("span","cw-frag-letter",""));strip.append(el);return el;});result.append(strip);
 const status=node("p","cw-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const reset=node("button","cw-reset","Neu beginnen");reset.type="button";reset.onclick=()=>{fields.forEach(({input})=>{input.value="";input.readOnly=false;});active=0;lastClicked=null;paint();};
 root.append(hint,grid,clues,result,status,reset);
 function paint(){
 const correct=entries.map(w=>w.keys.every((k,i)=>fields.get(k).input.value===w.answer[i]));
 const filled=entries.map(w=>w.keys.every(k=>fields.get(k).input.value));
 done=correct.every(Boolean);
 for(const [k,{tile,input}] of fields){
 const c=cells.get(k);
 tile.classList.toggle("cw-active",!done&&c.words.includes(active));tile.classList.toggle("cw-good",c.words.some(w=>correct[w]));tile.classList.toggle("cw-wrong",!!input.value&&input.value!==c.letter&&c.words.some(w=>filled[w]&&!correct[w]));
 input.readOnly=done;
 }
 entries.forEach(w=>{const b=clueButtons.get(w.id);b.classList.toggle("cw-selected",w.id===active&&!done);b.classList.toggle("cw-solved",correct[w.id]);b.setAttribute("aria-pressed",String(w.id===active&&!done));});
 config.extract.forEach((xy,i)=>{const key=xy.join(","),c=cells.get(key),isCorrect=c.words.some(w=>correct[w]);boxes[i].querySelector(".cw-frag-letter").textContent=isCorrect?c.letter:"";boxes[i].classList.toggle("cw-revealed",isCorrect);});
 status.textContent=done?"Nicht jede Spur verweht.":correct.filter(Boolean).length+" / "+entries.length+" Begriffe gefunden";
 status.classList.toggle("cw-done",done);
 if(done&&!reported){reported=true;options.onSolved();}
 }
 paint();return ()=>root.replaceChildren();
}
window.MendelCrossword={mount};
})();