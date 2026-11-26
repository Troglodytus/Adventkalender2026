/* Three fictional literary letters and a numbered selection puzzle. */
(() => {
"use strict";
function evaluate(config,index){return Number.isInteger(index)&&index===config.correctIndex;}
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const stack=node("div","co-stack");
 config.letters.forEach((letter,i)=>{
  const paper=node("article","co-letter co-letter-"+i);
  const head=node("header","co-letterhead");
  if(letter.sender){head.append(node("span","co-monogram",i===0?"P":"S"),node("p","co-sender",letter.sender));if(letter.role)head.append(node("p","co-role",letter.role));}
  else {head.append(node("p","co-anonymous","Privat · Vertraulich"));}
  const place=node("p","co-place",letter.place);paper.append(head,place,node("p","co-salutation",letter.salutation));
  letter.body.forEach(p=>paper.append(node("p","co-body",p)));
  if(i===2){const list=node("ol","co-book-list");config.choices.forEach(title=>list.append(node("li","",title)));paper.append(list,node("p","co-body",letter.closingBody));}
  const signature=node("footer","co-signature");signature.append(node("p","co-closing",letter.closing),node("p","co-sign-name",letter.signature));paper.append(signature);
  stack.append(paper);
 });
 const form=node("form","co-form");
 const question=node("h3","co-question",config.question);form.append(question);
 const answers=node("div","co-answers");answers.setAttribute("role","group");answers.setAttribute("aria-label",config.question);
 let selected=options.completed?config.correctIndex:null,solved=!!options.completed,reported=solved;
 const radios=config.choices.map((title,i)=>{
  const label=node("label","co-choice");const radio=node("input","co-radio");radio.type="radio";radio.name="co-choice";radio.value=String(i);
  label.append(radio,node("span","co-index",String(i+1)+"."),node("span","co-choice-title",title));answers.append(label);
  radio.addEventListener("change",()=>{selected=i;feedback.textContent="";form.classList.remove("co-wrong");paint();});
  return {label,radio};
 });
 const button=node("button","co-submit","Antwort überprüfen");button.type="submit";
 const feedback=node("p","co-feedback");feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const result=node("div","co-result");result.append(node("span","co-result-label","GEFUNDENER TITEL"),node("strong","",config.choices[config.correctIndex]));
 form.append(answers,button,feedback,result);root.append(stack,form);
 function paint(){
  radios.forEach(({label,radio},i)=>{radio.checked=selected===i;radio.disabled=solved;label.classList.toggle("co-selected",selected===i);label.classList.toggle("co-right",solved&&i===config.correctIndex);});
  button.disabled=selected===null||solved;result.hidden=!solved;form.classList.toggle("co-correct",solved);
 }
 form.addEventListener("submit",e=>{e.preventDefault();if(selected===null||solved)return;
  solved=evaluate(config,selected);
  form.classList.toggle("co-wrong",!solved);feedback.textContent=solved?"Der gesuchte Titel ist gefunden.":"Noch nicht ganz.";
  paint();if(solved&&!reported){reported=true;options.onSolved();}
 });
 if(solved)feedback.textContent="Der gesuchte Titel ist gefunden.";
 paint();return ()=>root.replaceChildren();
}
window.MendelCorrespondence={mount,evaluate};
})();