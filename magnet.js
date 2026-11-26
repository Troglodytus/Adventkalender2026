/* Magnetic dipole model, six letter dials, two reference needles. */
(() => {
"use strict";
const model = (function model(){
 const points=[[70,65],[180,65],[290,65],[70,191],[180,191],[290,191]];
 const wrap=a=>(a%360+360)%360;
 const difference=(a,b)=>Math.abs(wrap(a-b+180)-180);
 function angles(x,rotation){const t=rotation*Math.PI/180,mx=Math.cos(t),my=Math.sin(t);return points.map(([px,py])=>{const dx=px-x,dy=py-128,r=Math.hypot(dx,dy),ux=dx/r,uy=dy/r,dot=ux*mx+uy*my;return wrap(Math.atan2(3*uy*dot-my,3*ux*dot-mx)*180/Math.PI+90);});}
 const sector=a=>Math.round(wrap(a)/45)%8;
 const targetAngles=angles(180,0), target="MESMER";
 const base=["QALXTUBF","HSCPVZDK","BTKQJHCA","GVUFXKPL","YQTFKJBA","XCKHTPUG"];
 const rings=base.map((s,i)=>{const a=s.split("");a[sector(targetAngles[i])]=target[i];return a;});
 function evaluate(x,r){const a=angles(x,r),word=a.map((v,i)=>rings[i][sector(v)]).join("");const aligned=[1,4].map(i=>difference(a[i],270)<=8);return {a,word,aligned,success:aligned.every(Boolean)&&word===target};}
 return {points,rings,evaluate,target};
})();
const NS="http://www.w3.org/2000/svg";
function mount(root, options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const hint=node("p","magnet-hint","Richte die Nadeln nach den Hinweisen im Buch aus.");
 const chart=document.createElementNS(NS,"svg");
 chart.setAttribute("viewBox","0 0 360 256");chart.setAttribute("class","magnet-chart");chart.setAttribute("role","img");chart.setAttribute("aria-label","Sechs Magnetnadeln um einen beweglichen Stabmagneten");
 chart.innerHTML='<defs><radialGradient id="mag-face"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#e6d5aa"/></radialGradient><linearGradient id="mag-brass" x2="0" y2="1"><stop stop-color="#f0d7a0"/><stop offset=".48" stop-color="#a38349"/><stop offset="1" stop-color="#76582e"/></linearGradient><linearGradient id="mag-red" x2="0" y2="1"><stop stop-color="#bb6555"/><stop offset="1" stop-color="#79342e"/></linearGradient><linearGradient id="mag-blue" x2="0" y2="1"><stop stop-color="#718c98"/><stop offset="1" stop-color="#344c58"/></linearGradient></defs><rect x="1" y="1" width="358" height="254" rx="4" fill="#e9dcc0" stroke="#bba47b"/><path d="M12 128H348" stroke="#bba47b" stroke-dasharray="2 5" opacity=".65"/>';
 const svg=(tag,attrs,parent=chart)=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);parent.append(el);return el;};
 const needles=[],ringTexts=[],centers=[];
 for(let i=0;i<6;i++){
   const [x,y]=model.points[i],g=svg("g",{transform:"translate("+x+" "+y+")"});
   svg("circle",{cy:2,r:41,fill:"#5b452c",opacity:".18"},g);
   const edge=svg("circle",{r:41,fill:"url(#mag-brass)",stroke:"#76592f","stroke-width":1},g);centers.push(edge);
   svg("circle",{r:37,fill:"url(#mag-face)",stroke:"#9b7c44"},g);
   svg("circle",{r:26,fill:"none",stroke:"#bba375","stroke-width":".65"},g);
   const labels=[];
   for(let j=0;j<8;j++){
     const a=j*Math.PI/4,tx=Math.sin(a)*31,ty=-Math.cos(a)*31;
     const t=svg("text",{x:tx,y:ty+3,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"9",fill:"#594a34"},g);
     t.textContent=model.rings[i][j];labels.push(t);
     svg("path",{d:"M0 -25V-22",transform:"rotate("+(j*45)+")",stroke:"#8d7854","stroke-width":".7"},g);
   }
   ringTexts.push(labels);
   for(const [j,label] of [[0,"N"],[2,"O"],[4,"S"],[6,"W"]]){
     const a=j*Math.PI/4,t=svg("text",{x:Math.sin(a)*18,y:-Math.cos(a)*18+2.4,"text-anchor":"middle","font-size":"6.7",fill:"#81704f","font-family":"Georgia,serif"},g);t.textContent=label;
   }
   const n=svg("g",{},g);needles.push(n);
   svg("path",{d:"M0 -24L3.8 0L0 24L-3.8 0Z",fill:"#435b66",stroke:"#665438","stroke-width":".45"},n);
   svg("path",{d:"M0 -24L3.8 0H-3.8Z",fill:"#a54035"},n);
   svg("circle",{r:2.6,fill:"#c9a766",stroke:"#7c6239","stroke-width":".55"},g);
   const no=svg("text",{x:0,y:52,"text-anchor":"middle","font-size":"8","font-family":"Georgia,serif",fill:"#746143"},g);no.textContent=String(i+1);
 }
 const bar=svg("g",{"class":"magnet-bar"});
 svg("rect",{x:-44,y:-10,width:88,height:26,rx:4,fill:"#57452d",opacity:".22"},bar);
 svg("rect",{x:-44,y:-13,width:88,height:26,rx:3,fill:"url(#mag-blue)",stroke:"#695238","stroke-width":".65"},bar);
 svg("path",{d:"M0 -13H41Q44 -13 44 -10V10Q44 13 41 13H0Z",fill:"url(#mag-red)"},bar);
 svg("path",{d:"M-40 -10H40",stroke:"#fff",opacity:".35"},bar);
 for(const [x,s] of [[-22,"S"],[22,"N"]]){const t=svg("text",{x,y:5,"text-anchor":"middle","font-family":"Georgia,serif","font-size":"16",fill:"#fff2d6"},bar);t.textContent=s;}
 const controls=node("div","magnet-controls");
 function range(label,min,max,value,unit){
  const row=node("label","magnet-control"), name=node("span","",label),input=node("input"),out=node("output");
  input.type="range";input.min=min;input.max=max;input.step=5;input.value=value;
  out.textContent=value+unit;row.append(name,input,out);controls.append(row);return {input,out,unit};
 }
 const pos=range("Position",115,245,135,""),rot=range("Drehung",-180,180,-65,"°");
 const letters=node("div","magnet-letters");letters.setAttribute("aria-label","Abgelesene Buchstaben");
 const boxes=Array.from({length:6},()=>node("span","magnet-letter","–"));letters.append(...boxes);
 const status=node("p","magnet-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const reset=node("button","chess-restart","Neu beginnen");reset.type="button";
 root.append(hint,chart,controls,letters,status,reset);
 let completed=Boolean(options.completed);
 function paint(){
   const x=Number(pos.input.value),r=Number(rot.input.value);
   pos.out.textContent=Math.round((x-115)/130*100)+" %";rot.out.textContent=r+"°";
   const state=model.evaluate(x,r);
   bar.setAttribute("transform","translate("+x+" 128) rotate("+r+")");
   state.a.forEach((a,i)=>{
    needles[i].setAttribute("transform","rotate("+a+")");
    const j=Math.round(a/45)%8;
    ringTexts[i].forEach((t,k)=>{t.setAttribute("fill",k===j?"#244c38":"#594a34");t.setAttribute("font-weight",k===j?"bold":"normal");t.setAttribute("font-size",k===j?"11":"9");});
    boxes[i].textContent=state.word[i];
   });
   const correct = state.word === model.target;
   letters.classList.toggle("complete",correct);
   status.textContent="Lies die roten Nadelspitzen von links nach rechts.";
   if(correct&&!completed){completed=true;options.onSolved();}
 }
 pos.input.addEventListener("input",paint);rot.input.addEventListener("input",paint);
 reset.addEventListener("click",()=>{pos.input.value=135;rot.input.value=-65;paint();});
 paint();
 return ()=>root.replaceChildren();
}
window.MendelMagnet={mount};
})();