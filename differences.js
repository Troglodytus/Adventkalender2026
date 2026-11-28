/* Spot the differences. Coordinates are percentages of each image, not its displayed pixel size.
Optional spot.positions = [leftCoordinates, rightCoordinates] for nonidentical framing. */
(() => {
"use strict";
const region=(spot,index)=>spot.positions?.[index]||spot;
function hit(spots,index,x,y){return spots.findIndex(spot=>{const p=region(spot,index);return ((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2<=1;});}
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const hint=node("p","df-hint","Vergleiche die beiden Bilder. Markiere die fünf Unterschiede durch Anklicken oder Antippen.");
 const board=node("div","df-board");
 const status=node("p","df-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const feedback=node("p","df-feedback");feedback.setAttribute("role","status");
 const result=node("div","df-result");result.append(node("span","df-label","FRAGMENT"),node("strong","",config.fragment));
 const reset=node("button","df-reset","Neu beginnen");reset.type="button";
 let found=new Set(options.completed?config.spots.map((_,i)=>i):[]),reported=!!options.completed,timeout=null;
 const panels=config.images.map((src,i)=>{
  const panel=node("figure","df-panel"),picture=node("div","df-picture"),img=node("img","df-image");
  img.src=src;img.alt="Ansicht "+(i+1)+" des Kaffeehauses";img.draggable=false;
  const overlay=node("div","df-overlay");overlay.setAttribute("aria-hidden","true");
  const caption=node("figcaption","df-caption",config.labels?.[i]||"Bild "+(i+1));
  picture.append(img,overlay);panel.append(caption,picture);board.append(panel);
  picture.addEventListener("click",event=>{
   if(found.size===config.spots.length)return;
   const r=img.getBoundingClientRect();if(!r.width||!r.height)return;
   const x=(event.clientX-r.left)*100/r.width,y=(event.clientY-r.top)*100/r.height;
   const index=hit(config.spots,i,x,y);
   if(index>=0){
    if(found.has(index)){flash("Diesen Unterschied hast du bereits gefunden.");return;}
    found.add(index);paint();flash(found.size===config.spots.length?"":"Richtig!");
    if(found.size===config.spots.length&&!reported){reported=true;options.onSolved();}
   }else{
    flash("Hier ist kein Unterschied.");
    const mark=node("span","df-miss");mark.style.left=x+"%";mark.style.top=y+"%";overlay.append(mark);
    setTimeout(()=>mark.remove(),600);
   }
  });
  return overlay;
 });
 function flash(message){clearTimeout(timeout);feedback.textContent=message;if(message)timeout=setTimeout(()=>{feedback.textContent="";},1800);}
 function paint(){
  panels.forEach((overlay,index)=>{
   overlay.replaceChildren();
   found.forEach(i=>{const p=region(config.spots[i],index),mark=node("span","df-mark");mark.style.left=p.x+"%";mark.style.top=p.y+"%";mark.style.width=2*p.rx+"%";mark.style.height=2*p.ry+"%";overlay.append(mark);});
  });
  const done=found.size===config.spots.length;board.classList.toggle("df-solved",done);status.textContent=found.size+" / "+config.spots.length+" Unterschiede gefunden";result.hidden=!done;
 }
 reset.onclick=()=>{found.clear();flash("");paint();};
 root.append(hint,board,status,feedback,result,reset);paint();
 return ()=>{clearTimeout(timeout);root.replaceChildren();};
}
window.MendelDifferences={mount,hit};
})();