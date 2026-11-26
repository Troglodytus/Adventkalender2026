/* Literary reconstruction of a military interrogation form; no external assets. */
(() => {
"use strict";
function evaluate(rows, values){
 return values.length===rows.length && rows.every((r,i)=>typeof values[i]==="boolean" && values[i]===r[2]);
}
function mount(root, sections, options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const sheet=node("div","pr-sheet");
 const header=node("header","pr-header");
 header.append(node("p","pr-authority","K. U. K. MILITÄRBEHÖRDE"),node("h2","pr-title","Verhörprotokoll"),node("p","pr-subtitle","Garnison Wien · Personal- und Erhebungsbogen"));
 const stamp=node("div","pr-stamp","GEHEIM");stamp.setAttribute("aria-hidden","true");header.append(stamp);
 sheet.append(header,node("p","pr-instruction","Prüfen Sie die nachstehenden Eintragungen anhand der Aussagen des Vernommenen. Jede Eintragung ist als wahr oder falsch zu beurteilen."));
 const rows=sections.flatMap(s=>s.rows);
 let values=rows.map(r=>options.completed?r[2]:null),reported=!!options.completed,complete=!!options.completed;
 const fields=[];
 const form=node("form","pr-form");
 for(const section of sections){
  const block=node("section","pr-block");block.append(node("h3","pr-heading",section.heading));
  const table=node("div","pr-table");
  const headings=node("div","pr-table-head");
  headings.append(node("span","","Eintragung"),node("span","","Wahr"),node("span","","Falsch"));table.append(headings);
  for(const [label,value] of section.rows){
   const i=fields.length;
   const line=node("div","pr-line");
   const entry=node("div","pr-entry");
   entry.append(node("span","pr-label",label),node("span","pr-value",value));line.append(entry);
   const radios=[true,false].map(choice=>{
    const wrap=node("label","pr-choice");const input=node("input","pr-radio");
    input.type="radio";input.name="pr-entry-"+i;input.value=String(choice);input.checked=values[i]===choice;
    input.setAttribute("aria-label",label+": "+value+" — "+(choice?"Wahr":"Falsch"));
    const mark=node("span","pr-mark");mark.setAttribute("aria-hidden","true");wrap.append(input,mark);
    input.addEventListener("change",()=>{values[i]=choice;complete=false;clearFeedback();paint();});
    line.append(wrap);return input;
   });
   fields.push({line,radios});table.append(line);
  }
  block.append(table);form.append(block);
 }
 const count=node("p","pr-count"),feedback=node("p","pr-feedback");feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const submit=node("button","pr-submit","Protokoll überprüfen");submit.type="submit";
 const reset=node("button","pr-reset","Neu beginnen");reset.type="button";
 const fragment=node("div","pr-fragment");fragment.append(node("span","pr-fragment-label","FRAGMENT"),node("strong","","IRRTUM"));
 fragment.hidden=!complete;
 const footer=node("div","pr-footer");footer.append(count,submit,feedback,fragment,reset);form.append(footer);sheet.append(form);root.append(sheet);
 function clearFeedback(){sheet.classList.remove("pr-incorrect","pr-correct");feedback.textContent="";fragment.hidden=true;}
 function paint(){
  const answered=values.filter(v=>typeof v==="boolean").length;
  count.textContent=answered+" / "+rows.length+" Eintragungen geprüft";
  submit.disabled=answered!==rows.length||complete;
  fields.forEach(({line,radios},i)=>{line.classList.toggle("pr-answered",values[i]!==null);radios.forEach((radio,j)=>{radio.checked=values[i]===(j===0);radio.disabled=complete;});});
 }
 form.addEventListener("submit",e=>{
  e.preventDefault();if(complete||values.some(v=>v===null))return;
  clearFeedback();complete=evaluate(rows,values);
  sheet.classList.add(complete?"pr-correct":"pr-incorrect");
  feedback.textContent=complete?"Protokoll berichtigt. Sämtliche Eintragungen sind korrekt beurteilt.":"Das Protokoll enthält noch unzutreffende Beurteilungen.";
  fragment.hidden=!complete;paint();
  if(complete&&!reported){reported=true;options.onSolved();}
 });
 reset.addEventListener("click",()=>{values=rows.map(()=>null);complete=false;clearFeedback();paint();});
 if(complete){sheet.classList.add("pr-correct");feedback.textContent="Protokoll berichtigt.";fragment.hidden=false;}
 paint();return ()=>root.replaceChildren();
}
window.MendelProtocol={mount,evaluate};
})();