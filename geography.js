/* Self-contained blank world map puzzle. No tile server or external requests. */
(() => {
"use strict";
const math=(function geographyMath(){
 const earth=6371.0088,rad=Math.PI/180,deg=180/Math.PI;
 const wrap=lon=>((lon+180)%360+360)%360-180;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const project=(lat,lon)=>[2*(lon+180),2*(90-lat)];
 const unproject=(x,y)=>({lat:clamp(90-y/2,-90,90),lon:wrap(x/2-180)});
 function distance(a,b){
  const dlat=(b.lat-a.lat)*rad,dlon=(b.lon-a.lon)*rad;
  const h=Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlon/2)**2;
  return 2*earth*Math.asin(Math.sqrt(clamp(h,0,1)));
 }
 function destination(center,km,bearing){
  const a=center.lat*rad,l=center.lon*rad,d=km/earth,t=bearing*rad;
  const lat=Math.asin(clamp(Math.sin(a)*Math.cos(d)+Math.cos(a)*Math.sin(d)*Math.cos(t),-1,1));
  const lon=l+Math.atan2(Math.sin(t)*Math.sin(d)*Math.cos(a),Math.cos(d)-Math.sin(a)*Math.sin(lat));
  return {lat:lat*deg,lon:wrap(lon*deg)};
 }
 function ring(center,km){
  const points=[];let previous=center.lon;
  for(let i=0;i<=120;i++){
    const p=destination(center,km,i*3);
    while(p.lon-previous>180)p.lon-=360;
    while(p.lon-previous< -180)p.lon+=360;
    previous=p.lon;points.push(project(p.lat,p.lon));
  }
  return points.map(([x,y],i)=>(i?"L":"M")+x.toFixed(5)+","+y.toFixed(5)).join("")+"Z";
 }
 return {earth,clamp,project,unproject,distance,destination,ring};
})();
const NS="http://www.w3.org/2000/svg";
function mount(root,config,options){
 root.replaceChildren();
 const {clamp,project,unproject,distance,ring}=math;
 const target={lat:config.latitude,lon:config.longitude},radius=config.radiusKm;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const frame=node("div","geo-frame");
 const svg=document.createElementNS(NS,"svg");
 svg.setAttribute("class","geo-map");svg.setAttribute("viewBox","0 0 720 360");svg.setAttribute("aria-label","Unbeschriftete Weltkarte. Tippe auf die Karte, um einen Pin zu setzen. Mit Plus und Minus zoomen, mit Pfeiltasten verschieben, Enter setzt den Pin in die Mitte.");svg.setAttribute("tabindex","0");svg.setAttribute("role","group");
 const element=(tag,attrs,parent=svg)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;};
 element("rect",{x:0,y:0,width:720,height:360,fill:"#dce4df"});
 element("path",{d:window.MendelWorld.land,fill:"#e9d8b4",stroke:"#927d59","stroke-width":".7","vector-effect":"non-scaling-stroke","fill-rule":"evenodd"});
 element("path",{d:window.MendelWorld.countries,fill:"none",stroke:"#aa9572","stroke-opacity":".53","stroke-width":".5","vector-effect":"non-scaling-stroke"});
 const rangeLayer=element("g",{"pointer-events":"none"});
 const ranges=[-720,0,720].map(dx=>element("path",{transform:"translate("+dx+" 0)",fill:"#9f3f38","fill-opacity":".12",stroke:"#9f3f38","stroke-width":"1.5","stroke-dasharray":"4 3","vector-effect":"non-scaling-stroke"},rangeLayer));
 const pinLayer=element("g",{"data-pin":"true"});
 const pin=element("g",{"data-pin":"true"},pinLayer);
 element("circle",{r:4,fill:"#813c31",stroke:"#fff7e6","stroke-width":"1.2"},pin);
 element("path",{d:"M0 0C-2 -5 -11 -12 -11 -19A11 11 0 1 1 11 -19C11 -12 2 -5 0 0Z",fill:"#873d34",stroke:"#fff7e6","stroke-width":"1.4","stroke-linejoin":"round","data-pin":"true"},pin);
 element("circle",{cy:-19,r:4,fill:"#fff3d8","pointer-events":"none"},pin);
 rangeLayer.style.display="none";pinLayer.style.display="none";
 frame.append(svg);
 const controls=node("div","geo-controls");
 const button=(text,label,cls="geo-control")=>{const b=node("button",cls,text);b.type="button";b.setAttribute("aria-label",label);return b;};
 const plus=button("+","Hineinzoomen"),minus=button("−","Herauszoomen"),home=button("Welt","Gesamte Welt anzeigen");
 controls.append(plus,minus,home);frame.append(controls);
 const hint=node("p","geo-hint","Setze den Pin so, dass die Universität im 100-km-Umkreis liegt.");
 const guide=node("p","geo-guide","Tippen / klicken: Pin setzen · Ziehen: Karte verschieben · + / −: Zoom");
 const lock=button("LOCK IN","Position bestätigen","geo-lock");lock.disabled=true;
 const status=node("p","geo-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const source=node("p","geo-source","Kartendaten: Natural Earth");
 root.append(hint,frame,guide,lock,status,source);
 let view={x:0,y:0,w:720},guess=null,reported=Boolean(options.completed),timer=null,disposed=false;
 const pointers=new Map();let gesture=null;
 function clearFeedback(){clearTimeout(timer);frame.classList.remove("geo-wrong","geo-correct");status.textContent="";}
 function paint(){
  const h=view.w/2;
  svg.setAttribute("viewBox",[view.x,view.y,view.w,h].join(" "));
  plus.disabled=view.w<=720/32+.001;minus.disabled=view.w>=720-.001;
  lock.disabled=!guess;
  if(!guess)return;
  const [x,y]=project(guess.lat,guess.lon),d=ring(guess,radius);
  ranges.forEach(p=>p.setAttribute("d",d));rangeLayer.style.display="";pinLayer.style.display="";
  const pixelScale=view.w/Math.max(1,svg.getBoundingClientRect().width);
  pinLayer.setAttribute("transform","translate("+x+" "+y+")");
  pin.setAttribute("transform","scale("+pixelScale+")");
 }
 function setView(x,y,w){
  w=clamp(w,720/32,720);view={x:clamp(x,0,720-w),y:clamp(y,0,360-w/2),w};paint();
 }
 function local(clientX,clientY){const r=svg.getBoundingClientRect();return {x:clamp((clientX-r.left)/r.width,0,1),y:clamp((clientY-r.top)/r.height,0,1)};}
 function pointAt(clientX,clientY){const p=local(clientX,clientY);return {x:view.x+p.x*view.w,y:view.y+p.y*view.w/2};}
 function setPin(clientX,clientY){const p=pointAt(clientX,clientY);guess=unproject(p.x,p.y);clearFeedback();paint();}
 function zoom(factor,ax=.5,ay=.5){
  const w=clamp(view.w/factor,720/32,720);setView(view.x+ax*(view.w-w),view.y+ay*(view.w-w)/2,w);
 }
 plus.onclick=()=>zoom(2);minus.onclick=()=>zoom(.5);home.onclick=()=>setView(0,0,720);
 svg.addEventListener("wheel",e=>{e.preventDefault();const p=local(e.clientX,e.clientY);zoom(Math.exp(clamp(-e.deltaY*.002,-.5,.5)),p.x,p.y);},{passive:false});
 function midpoint(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};}
 function length(a,b){return Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));}
 svg.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0)return;
  e.preventDefault();svg.focus({preventScroll:true});svg.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size===1){gesture={kind:e.target.closest("[data-pin]")?"pin":"pan",start:{x:e.clientX,y:e.clientY},view:{...view},moved:false};}
  else if(pointers.size===2){const [a,b]=[...pointers.values()];const center=midpoint(a,b);gesture={kind:"pinch",length:length(a,b),anchor:pointAt(center.x,center.y),view:{...view}};}
 });
 svg.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId)||!gesture)return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(gesture.kind==="pinch"&&pointers.size>=2){
   const [a,b]=[...pointers.values()],mid=midpoint(a,b),p=local(mid.x,mid.y);
   const w=clamp(gesture.view.w*gesture.length/length(a,b),720/32,720);
   setView(gesture.anchor.x-p.x*w,gesture.anchor.y-p.y*w/2,w);return;
  }
  if(pointers.size!==1||gesture.kind==="pinch")return;
  const dx=e.clientX-gesture.start.x,dy=e.clientY-gesture.start.y;
  if(Math.hypot(dx,dy)>5)gesture.moved=true;
  if(!gesture.moved)return;
  if(gesture.kind==="pin"){setPin(e.clientX,e.clientY);return;}
  const rect=svg.getBoundingClientRect(),scale=gesture.view.w/rect.width;
  setView(gesture.view.x-dx*scale,gesture.view.y-dy*scale,gesture.view.w);
 });
 function end(e,cancelled){
  if(!pointers.has(e.pointerId))return;
  if(!cancelled&&pointers.size===1&&gesture&&gesture.kind!=="pinch"&&!gesture.moved)setPin(e.clientX,e.clientY);
  pointers.delete(e.pointerId);
  if(pointers.size===0)gesture=null;
  else if(pointers.size===1){const p=[...pointers.values()][0];gesture={kind:"pan",start:p,view:{...view},moved:true};}
 }
 svg.addEventListener("pointerup",e=>end(e,false));svg.addEventListener("pointercancel",e=>end(e,true));svg.addEventListener("lostpointercapture",e=>end(e,true));
 svg.addEventListener("keydown",e=>{
  const d=view.w*.12;
  if(e.key==="+"||e.key==="=")zoom(2);else if(e.key==="-")zoom(.5);
  else if(e.key==="ArrowLeft")setView(view.x-d,view.y,view.w);else if(e.key==="ArrowRight")setView(view.x+d,view.y,view.w);
  else if(e.key==="ArrowUp")setView(view.x,view.y-d,view.w);else if(e.key==="ArrowDown")setView(view.x,view.y+d,view.w);
  else if(e.key==="Enter"||e.key===" "){guess=unproject(view.x+view.w/2,view.y+view.w/4);clearFeedback();paint();}
  else return;e.preventDefault();
 });
 lock.onclick=()=>{
  if(!guess||disposed)return;clearFeedback();
  const correct=distance(guess,target)<=radius+1e-9;
  frame.classList.add(correct?"geo-correct":"geo-wrong");
  status.textContent=correct?"Richtig.":"Noch nicht ganz.";
  if(correct&&!reported){reported=true;options.onSolved();}
  timer=setTimeout(()=>{if(!disposed)clearFeedback();},correct ? 6000 : 1500);
 };
 const observer=typeof ResizeObserver==="function"?new ResizeObserver(paint):null;
 if(observer)observer.observe(svg);paint();
 return ()=>{disposed=true;clearTimeout(timer);if(observer)observer.disconnect();root.replaceChildren();};
}
window.MendelGeography={mount};
})();