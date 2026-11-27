/* Two irregular glass tessellations. Each fitted shard independently unmasks the lettering beneath it. */
(() => {
"use strict";
const makeGeometry=function makeGeometry(){
 const radius=106,centers=[[146,137],[414,137]];
 const seeds=[
 [[-64,-48],[-4,-73],[60,-45],[-77,16],[-13,-7],[69,22],[-47,66],[27,65]],
 [[-56,-64],[26,-70],[71,-12],[-66,-5],[2,-22],[-27,34],[-65,71],[48,61]]
 ];
 const disk=Array.from({length:96},(_,i)=>[radius*Math.cos(i*Math.PI/48),radius*Math.sin(i*Math.PI/48)]);
 function clip(poly,nx,ny,b){
  const out=[];for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length],a=nx*p[0]+ny*p[1]-b,d=nx*q[0]+ny*q[1]-b;
   if(a<=1e-8)out.push(p);
   if((a<0&&d>0)||(a>0&&d<0)){const t=a/(a-d);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}
  }return out;
 }
 function measure(poly){let twice=0,x=0,y=0;poly.forEach((p,i)=>{const q=poly[(i+1)%poly.length],k=p[0]*q[1]-q[0]*p[1];twice+=k;x+=(p[0]+q[0])*k;y+=(p[1]+q[1])*k;});return {area:twice/2,center:[x/(3*twice),y/(3*twice)]};}
 return centers.flatMap((center,lens)=>seeds[lens].map((s,i)=>{
  let poly=disk.map(p=>p.slice());for(const q of seeds[lens]){if(q===s)continue;poly=clip(poly,q[0]-s[0],q[1]-s[1],(q[0]**2+q[1]**2-s[0]**2-s[1]**2)/2);}
  const {area,center:mid}=measure(poly);
  return {id:lens*8+i,lens,area,target:[center[0]+mid[0],center[1]+mid[1]],points:poly.map(p=>[p[0]-mid[0],p[1]-mid[1]])};
 }));
};
const NS="http://www.w3.org/2000/svg";
const near=(p,x,y,rotation)=>rotation%360===0&&Math.hypot(x-p.target[0],y-p.target[1])<=21;
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const frame=node("div","gl-board"),svg=document.createElementNS(NS,"svg");
 svg.setAttribute("viewBox","0 0 560 680");svg.setAttribute("class","gl-svg");svg.setAttribute("aria-label","Zwei zerbrochene Brillengläser und sechzehn Glasscherben");
 const E=(tag,attrs={},parent=svg)=>{const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.append(n);return n;};
 const T=(parent,attrs,text)=>{const n=E("text",attrs,parent);n.textContent=text;return n;};
 const defs=E("defs");
 function gradient(id,stops,radial=false){const g=E(radial?"radialGradient":"linearGradient",radial?{id,cx:".33",cy:".25",r:".85"}:{id,x1:"0",y1:"0",x2:"1",y2:"1"},defs);stops.forEach(([offset,color,opacity])=>E("stop",{offset,"stop-color":color,"stop-opacity":opacity??1},g));}
 gradient("gl-paper",[[0,"#fcf2d8"],[.65,"#e8d4a9"],[1,"#bfa277"]],true);
 gradient("gl-metal",[[0,"#38281b"],[.25,"#b59862"],[.42,"#f1d59a"],[.56,"#7e5834"],[.8,"#3e2e23"],[1,"#c0a16c"]]);
 gradient("gl-milk",[[0,"#e7ebd8",.86],[.48,"#d4dfd5",.65],[1,"#adbdba",.78]]);
 gradient("gl-shard",[[0,"#f1fcf4",.96],[.23,"#d5e4d9",.85],[.49,"#a3c3ba",.79],[.51,"#eff8ee",.86],[1,"#81a59d",.83]]);
 gradient("gl-clear",[[0,"#eafff6",.22],[.48,"#f5fff7",.02],[1,"#83aa9f",.16]]);
 const blur=E("filter",{id:"gl-blur",x:"-30%",y:"-80%",width:"160%",height:"260%","color-interpolation-filters":"sRGB"},defs);E("feGaussianBlur",{stdDeviation:9},blur);
 const shadow=E("filter",{id:"gl-shadow",x:"-60%",y:"-60%",width:"220%",height:"220%"},defs);E("feDropShadow",{dx:2,dy:4,stdDeviation:3,"flood-color":"#463521","flood-opacity":.33},shadow);
 const grain=E("pattern",{id:"gl-grain",width:19,height:17,patternUnits:"userSpaceOnUse"},defs);E("path",{d:"M1 4l5 -1m6 11l4 1M9 7l1 -2",stroke:"#856139","stroke-opacity":.09,"stroke-width":.6,fill:"none"},grain);
 E("rect",{width:560,height:680,rx:5,fill:"url(#gl-paper)"});E("rect",{width:560,height:680,fill:"url(#gl-grain)"});
 E("rect",{x:8,y:8,width:544,height:664,rx:3,fill:"none",stroke:"#997c4b","stroke-opacity":.5});
 const centers=[[146,137],[414,137]],pieces=makeGeometry();
 const path=(p,absolute=false)=>p.points.map(([x,y],i)=>(i?"L":"M")+(x+(absolute?p.target[0]:0)).toFixed(4)+","+(y+(absolute?p.target[1]:0)).toFixed(4)).join("")+"Z";
 function pageArt(parent,lens){
  const [x,y]=centers[lens];
  for(let i=0;i<7;i++){
   const yy=y-65+i*20;if(i===3)continue;
   T(parent,{x,y:yy,"text-anchor":"middle","font-family":"Georgia,serif","font-size":9,"letter-spacing":1,fill:"#817759",opacity:.58},["EX LIBRIS · BIBLIOTHECA","LITTERAE · MEMORIA","MCMXXIX · WIEN","", "ARS · SCIENTIA · LIBRI","IN LIBRIS VERITAS","CATALOGUS · EX LIBRIS"][i]);
  }
  E("path",{d:"M"+(x-74)+" "+(y-22)+"h148m-148 45h148",stroke:"#a88b53","stroke-width":.8,opacity:.8},parent);
  T(parent,{x,y:y+8,"text-anchor":"middle","font-family":"Georgia,serif","font-weight":700,"font-size":24,textLength:190,lengthAdjust:"spacingAndGlyphs",fill:"#273d33"},config.words[lens]);
 }
 const clearLayers=[];
 for(let lens=0;lens<2;lens++){
  const [x,y]=centers[lens],clip=E("clipPath",{id:"gl-lens-"+lens},defs);E("circle",{cx:x,cy:y,r:106},clip);
  const scene=E("g",{"clip-path":"url(#gl-lens-"+lens+")"});
  E("circle",{cx:x,cy:y,r:106,fill:"#e9dfbc"},scene);
  const blurred=E("g",{filter:"url(#gl-blur)"},scene);pageArt(blurred,lens);
  E("circle",{cx:x,cy:y,r:106,fill:"url(#gl-milk)"},scene);
  for(const p of pieces.filter(p=>p.lens===lens))E("path",{d:path(p,true),fill:"none",stroke:"#778c80","stroke-opacity":.43,"stroke-width":.8,"stroke-dasharray":"2 3"},scene);
  const clear=E("g",{},scene);clearLayers.push(clear);
 }
 const placedArt=new Map();
 for(const p of pieces){
  const clip=E("clipPath",{id:"gl-piece-"+p.id,clipPathUnits:"userSpaceOnUse"},defs);E("path",{d:path(p,true)},clip);
  const region=E("g",{"clip-path":"url(#gl-piece-"+p.id+")",display:"none"},clearLayers[p.lens]);
  E("path",{d:path(p,true),fill:"#f4e8c9"},region);pageArt(region,p.lens);
  E("path",{d:path(p,true),fill:"url(#gl-clear)",stroke:"#75978d","stroke-width":.8,"stroke-opacity":.65},region);placedArt.set(p.id,region);
 }
 const spectacles=E("g",{"pointer-events":"none"});
 E("path",{d:"M251 127 Q280 91 309 127 M38 118 L13 97 M522 118 L547 97",stroke:"#3c2a1c","stroke-width":9,fill:"none","stroke-linecap":"round"},spectacles);
 E("path",{d:"M251 126 Q280 91 309 126 M38 117 L13 96 M522 117 L547 96",stroke:"url(#gl-metal)","stroke-width":5,fill:"none","stroke-linecap":"round"},spectacles);
 for(const [x,y] of centers){
  E("circle",{cx:x,cy:y,r:110,fill:"none",stroke:"#39291c","stroke-width":8},spectacles);
  E("circle",{cx:x,cy:y,r:110,fill:"none",stroke:"url(#gl-metal)","stroke-width":5.5},spectacles);
  E("circle",{cx:x,cy:y,r:114,fill:"none",stroke:"#e5c88c","stroke-width":.85},spectacles);
  E("path",{d:"M"+(x-89)+" "+(y-42)+"Q"+(x-76)+" "+(y-82)+" "+(x-37)+" "+(y-93),fill:"none",stroke:"#fff9df","stroke-width":2,opacity:.7,"stroke-linecap":"round"},spectacles);
 }
 E("path",{d:"M22 265H538",stroke:"#a48a58","stroke-width":1});
 T(svg,{x:280,y:282,"text-anchor":"middle","font-family":"Georgia,serif","font-size":10,"letter-spacing":3,fill:"#79633d"},"DIE BRUCHSTÜCKE");
 const loose=E("g");
 const controls=node("div","gl-controls");
 const btn=(text,cls)=>{const n=node("button",cls,text);n.type="button";return n;};
 const rotateLeft=btn("↶ 90°","gl-button"),rotateRight=btn("90° ↷","gl-button"),reset=btn("Neu beginnen","gl-reset");
 rotateLeft.setAttribute("aria-label","Ausgewählte Scherbe nach links drehen");rotateRight.setAttribute("aria-label","Ausgewählte Scherbe nach rechts drehen");
 controls.append(rotateLeft,rotateRight);
 const hint=node("p","gl-hint","Ziehe die Scherben ins passende Glas. Wähle eine Scherbe an und drehe sie, bis sie genau passt.");
 const guide=node("p","gl-guide","Ziehen oder Scherbe und Ziel antippen · Drehen mit den Tasten unten (oder R)");
 const status=node("p","gl-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const feedback=node("p","gl-feedback");feedback.setAttribute("role","status");
 const result=node("div","gl-result");result.append(node("span","gl-fragment-label","FRAGMENT"),node("strong","",config.words.join(" ")));result.hidden=true;
 frame.append(svg);root.append(hint,frame,guide,controls,status,feedback,result,reset);
 let selected=null,drag=null,reported=!!options.completed,finished=false;
 const order=[11,2,14,7,9,0,13,5,3,15,6,8,12,4,10,1];
 const rotations=[90,270,180,90,270,90,180,270,90,180,270,90,180,270,90,180];
 for(const p of pieces){
  const slot=order.indexOf(p.id),x=70+(slot%4)*140,y=334+Math.floor(slot/4)*96;
  p.home=[x,y];p.rot=rotations[p.id];p.fixed=!!options.completed;
  const maxRadius=Math.max(...p.points.map(([x,y])=>Math.hypot(x,y)));
  p.scale=Math.min(.91,43/maxRadius);
  const g=E("g",{"data-piece":p.id,tabindex:0,role:"button","aria-label":"Glasscherbe "+(p.id+1),"aria-pressed":"false",class:"gl-piece"},loose);p.el=g;
  E("path",{d:path(p),fill:"url(#gl-shard)",stroke:"#3d675e","stroke-width":1.5,"stroke-linejoin":"round",filter:"url(#gl-shadow)"},g);
  E("path",{d:path(p),fill:"none",stroke:"#f5fff4","stroke-width":.7,"stroke-opacity":.8},g);
  const edge=p.points.slice(0,Math.min(p.points.length,4));E("polyline",{points:edge.map(v=>v.map(n=>n*.85).join(",")).join(" "),stroke:"#fffef2","stroke-width":2,opacity:.85,fill:"none","pointer-events":"none"},g);
  g.addEventListener("keydown",e=>{if(p.fixed)return;if(e.key==="Enter"||e.key===" "){e.preventDefault();select(p);}else if(e.key.toLowerCase()==="r"){e.preventDefault();select(p);rotate(90);}});
 }
 function drawPiece(p,x=p.home[0],y=p.home[1],scale=p.scale){p.el.setAttribute("transform","translate("+x+" "+y+") rotate("+p.rot+") scale("+scale+")");}
 function paint(){
  let count=0;for(const p of pieces){
   p.el.style.display=p.fixed?"none":"";placedArt.get(p.id).setAttribute("display",p.fixed?"inline":"none");
   p.el.classList.toggle("gl-selected",selected===p&&!p.fixed);p.el.setAttribute("aria-pressed",String(selected===p&&!p.fixed));
   if(p.fixed)count++;else if(!drag||drag.p!==p)drawPiece(p);
  }
  finished=count===16;rotateLeft.disabled=rotateRight.disabled=!selected||selected.fixed||finished;
  status.textContent=count+" / 16 Scherben eingesetzt";result.hidden=!finished;frame.classList.toggle("gl-done",finished);
  if(finished){feedback.textContent="Mendels Brille ist wieder vollständig.";if(!reported){reported=true;options.onSolved();}}
 }
 function select(p){if(p.fixed)return;selected=p;feedback.textContent="";paint();}
 function rotate(deg){if(!selected||selected.fixed)return;selected.rot=(selected.rot+deg+360)%360;if(drag)drawPiece(selected,drag.x,drag.y,1);feedback.textContent="";paint();}
 function attempt(p,x,y){if(!p||p.fixed)return false;if(near(p,x,y,p.rot)){p.fixed=true;selected=null;feedback.textContent="";paint();return true;}feedback.textContent="Die Scherbe passt noch nicht.";paint();return false;}
 function point(e){const matrix=svg.getScreenCTM();if(!matrix)return {x:0,y:0};const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(matrix.inverse());}
 function fromTarget(t){const g=t.closest&&t.closest("[data-piece]");return g?pieces[Number(g.getAttribute("data-piece"))]:null;}
 svg.addEventListener("pointerdown",e=>{
  if(finished||drag||(e.pointerType==="mouse"&&e.button!==0))return;
  const p=fromTarget(e.target),q=point(e);
  if(p&&!p.fixed){e.preventDefault();select(p);drag={p,id:e.pointerId,x:q.x,y:q.y,startX:q.x,startY:q.y,moved:false};svg.setPointerCapture(e.pointerId);loose.append(p.el);}
  else if(selected&&q.y<255){e.preventDefault();attempt(selected,q.x,q.y);}
 });
 svg.addEventListener("pointermove",e=>{
  if(!drag||e.pointerId!==drag.id)return;const q=point(e);drag.x=q.x;drag.y=q.y;
  if(Math.hypot(q.x-drag.startX,q.y-drag.startY)>5)drag.moved=true;
  if(drag.moved)drawPiece(drag.p,q.x,q.y,1);
 });
 function end(e,cancel){if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;if(!cancel&&d.moved&&d.y<265)attempt(d.p,d.x,d.y);else paint();}
 svg.addEventListener("pointerup",e=>end(e,false));svg.addEventListener("pointercancel",e=>end(e,true));svg.addEventListener("lostpointercapture",e=>end(e,true));
 svg.addEventListener("contextmenu",e=>{const p=fromTarget(e.target);if(p&&!p.fixed){e.preventDefault();select(p);rotate(90);}});
 root.addEventListener("keydown",keyHandler);function keyHandler(e){if(e.defaultPrevented)return;if(e.key.toLowerCase()==="r"&&selected){e.preventDefault();rotate(90);}}
 rotateLeft.onclick=()=>rotate(-90);rotateRight.onclick=()=>rotate(90);
 reset.onclick=()=>{selected=null;drag=null;pieces.forEach(p=>{p.fixed=false;p.rot=rotations[p.id];});feedback.textContent="";paint();};
 paint();return ()=>{root.removeEventListener("keydown",keyHandler);root.replaceChildren();};
}
window.MendelGlasses={mount,makeGeometry,near};
})();