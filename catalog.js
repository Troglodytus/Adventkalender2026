/* Bibliographic matching game. The configuration is kept in raetsel.js. */
(() => {
"use strict";
const match = function match(config, pairs, selected, author){
 if(selected<0||pairs[selected]!==undefined||Object.values(pairs).includes(author))return {pairs,wrong:false,ignored:true};
 if(config.books[selected].author!==author)return {pairs,wrong:true,ignored:false};
 return {pairs:{...pairs,[selected]:author},wrong:false,ignored:false};
};
const fragment = function fragment(config,pairs){return config.books.map((book,i)=>pairs[i]===book.author?book.letter:"").join("");};
function mount(root, config, options) {
  root.replaceChildren();
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(cls)=>{const n=node("button",cls);n.type="button";return n;};
  const hint=node("p","catalog-hint","Ordne jedem Werk seinen Verfasser zu.");
  const progressHead=node("div","catalog-progress-head");
  const count=node("span","","0 / "+config.books.length);
  progressHead.append(node("span","","Katalogisierung"),count);
  const progress=node("div","catalog-progress");
  progress.setAttribute("role","progressbar");progress.setAttribute("aria-label","Katalogisierung");progress.setAttribute("aria-valuemin","0");progress.setAttribute("aria-valuemax",String(config.books.length));
  const bar=node("span");progress.append(bar);
  const grid=node("div","catalog-grid");
  grid.append(node("h3","catalog-column-title","Werke"),node("h3","catalog-column-title","Verfasser"));
  const bookCards=[],authorCards=new Map(),authorChecks=new Map();
  const colors=["#6a4135","#405d4b","#76633b","#4b5d70"];
  let pairs=options.completed?Object.fromEntries(config.books.map((b,i)=>[i,b.author])):{};
  let selected=-1,wrong=-1,wrongAuthor=-1,reported=Boolean(options.completed);
  for(let i=0;i<config.books.length;i++){
    const book=config.books[i],a=config.order[i];
    const left=button("catalog-card catalog-book");
    const icon=node("span","catalog-book-icon");icon.setAttribute("aria-hidden","true");
    icon.innerHTML='<svg viewBox="0 0 25 43" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="23" height="41" rx="2" fill="'+colors[i%colors.length]+'" stroke="#463626"/><rect x="4" y="4" width="17" height="35" rx="1" fill="none" stroke="#bc9d60" stroke-width=".8"/><path d="M2 9H23M2 13H23M2 32H23M2 36H23" stroke="#bc9d60" stroke-width=".9"/><path d="M12.5 18L17 23L12.5 28L8 23Z" fill="none" stroke="#d3b679"/></svg>';
    const details=node("span","catalog-book-details");
    details.append(node("span","catalog-book-title",book.title),node("span","catalog-year",String(book.year)));
    left.append(icon,details);
    left.addEventListener("click",()=>{if(pairs[i]!==undefined)return;selected=selected===i?-1:i;wrong=-1;wrongAuthor=-1;paint();});
    bookCards.push(left);
    const right=button("catalog-card catalog-author");
    const check=node("span","catalog-check","✓");check.hidden=true;check.setAttribute("aria-hidden","true");
    right.append(node("span","catalog-author-name",config.authors[a]),check);
    right.addEventListener("click",()=>{
      const result=match(config,pairs,selected,a);
      if(result.ignored)return;
      if(result.wrong){wrong=selected;wrongAuthor=a;paint();return;}
      pairs=result.pairs;selected=-1;wrong=-1;wrongAuthor=-1;paint();
    });
    authorCards.set(a,right);authorChecks.set(a,check);
    grid.append(left,right);
  }
  const feedback=node("p","catalog-feedback");feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
  const result=node("div","catalog-result");
  result.append(node("p","catalog-fragment-label","Fragment"));
  const letters=node("div","catalog-letters");letters.setAttribute("aria-label","Lösungsfragment");
  const boxes=config.books.map(()=>node("span","catalog-letter"));letters.append(...boxes);result.append(letters);
  const completion=node("p","catalog-completion");completion.setAttribute("role","status");completion.setAttribute("aria-live","polite");
  const reset=button("catalog-reset");reset.textContent="Neu katalogisieren";
  reset.onclick=()=>{pairs={};selected=-1;wrong=-1;wrongAuthor=-1;paint();};
  root.append(hint,progressHead,progress,grid,feedback,result,completion,reset);
  function paint(){
    const total=Object.keys(pairs).length,done=total===config.books.length;
    count.textContent=total+" / "+config.books.length;
    progress.setAttribute("aria-valuenow",String(total));bar.style.width=(total/config.books.length*100)+"%";
    bookCards.forEach((card,i)=>{
      const solved=pairs[i]!==undefined;
      card.disabled=solved;
      card.classList.toggle("matched",solved);card.classList.toggle("selected",selected===i);card.classList.toggle("wrong",wrong===i);
      card.setAttribute("aria-pressed",String(selected===i));
      boxes[i].textContent=solved?config.books[i].letter:"";
      boxes[i].classList.toggle("matched",solved);
    });
    for(const [a,card] of authorCards){
      const solved=Object.values(pairs).includes(a);
      card.disabled=solved;card.classList.toggle("matched",solved);card.classList.toggle("wrong",wrongAuthor===a);
      authorChecks.get(a).hidden=!solved;
    }
    feedback.textContent=wrong>=0?"Dieser Eintrag stimmt noch nicht.":"";
    completion.textContent=done?"Der Katalog ist vollständig.":"";
    if(done&&!reported){reported=true;options.onSolved();}
  }
  paint();
  return ()=>root.replaceChildren();
}
window.MendelCatalog={mount};
})();