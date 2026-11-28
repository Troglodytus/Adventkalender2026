/* Tag 21: replace pictures, answers and aliases in raetsel.js. */
(() => {
"use strict";
function normalize(s){return String(s??"").trim().toUpperCase().replace(/Ä/g,"AE").replace(/Ö/g,"OE").replace(/Ü/g,"UE").replace(/ẞ/g,"SS").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]/g,"");}
function matches(p,value){const n=normalize(value);return !!n&&[p.answer,...(p.aliases||[])].some(a=>normalize(a)===n);}
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const hint=node("p","mm-hint","Erkennst du die Orte dieser Erinnerungen?");
 const album=node("div","mm-album"),status=node("p","mm-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const result=node("div","mm-result");result.append(node("span","mm-label","FRAGMENT"),node("strong","",config.fragment));
 const reset=node("button","mm-reset","Neu beginnen");reset.type="button";
 let reported=!!options.completed;
 const rows=config.pictures.map((p,i)=>{
  const row=node("div","mm-row"),photo=node("div","mm-photo"),img=node("img","mm-img");img.src=p.image;img.alt="Erinnerung "+(i+1);img.draggable=false;photo.append(img);
  const fields=node("div","mm-fields"),label=node("label","mm-label","ORT "+String(i+1).padStart(2,"0"));
  const form=node("form","mm-form"),input=node("input","mm-input");input.type="text";input.id="mm-place-"+i;label.htmlFor=input.id;input.placeholder="Welcher Ort?";input.autocomplete="off";input.spellcheck=false;input.setAttribute("autocapitalize","words");
  const check=node("button","mm-check","Prüfen");check.type="submit";
  const feedback=node("span","mm-feedback");feedback.setAttribute("aria-live","polite");
  form.append(input,check);fields.append(label,form,feedback);row.append(photo,fields);album.append(row);
  const item={p,row,input,check,feedback,correct:!!options.completed};
  if(item.correct)input.value=p.answer;
  form.addEventListener("submit",e=>{e.preventDefault();if(item.correct||!normalize(input.value))return;if(matches(p,input.value)){item.correct=true;item.feedback.textContent="Richtig.";paint();}else{row.classList.add("mm-wrong");feedback.textContent="Noch nicht ganz.";input.setAttribute("aria-invalid","true");}});
  input.addEventListener("input",()=>{row.classList.remove("mm-wrong");input.removeAttribute("aria-invalid");feedback.textContent="";});
  return item;
 });
 function paint(){const count=rows.filter(r=>r.correct).length,done=count===rows.length;
  rows.forEach(r=>{r.row.classList.toggle("mm-correct",r.correct);r.input.readOnly=r.correct;r.check.disabled=r.correct;r.check.textContent=r.correct?"✓":"Prüfen";if(r.correct){r.row.classList.remove("mm-wrong");r.input.removeAttribute("aria-invalid");r.feedback.textContent="Richtig.";}});
  album.classList.toggle("mm-solved",done);status.textContent=count+" / "+rows.length+" Orte erkannt";result.hidden=!done;
  if(done&&!reported){reported=true;options.onSolved();}
 }
 reset.onclick=()=>{rows.forEach(r=>{r.correct=false;r.input.value="";r.row.classList.remove("mm-wrong");r.input.removeAttribute("aria-invalid");r.feedback.textContent="";});paint();};
 root.append(hint,album,status,result,reset);paint();return ()=>root.replaceChildren();
}
window.MendelMemories={mount,matches};
})();