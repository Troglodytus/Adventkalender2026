/* Café Gluck furniture sliding puzzle. Collision-safe one-axis moves. */
(() => {
"use strict";
const engine=function engine(config){
 const n=config.size,p=config.pieces;
 const start=p.map(a=>a.axis==="x"?a.x:a.y);
 const location=(i,s)=>({x:p[i].axis==="x"?s[i]:p[i].x,y:p[i].axis==="y"?s[i]:p[i].y});
 function occupancy(s,ignore=-1){const board=new Int16Array(n*n).fill(-1);for(let i=0;i<p.length;i++){if(i===ignore)continue;const a=p[i],{x,y}=location(i,s);for(let k=0;k<a.len;k++){const xx=x+(a.axis==="x"?k:0),yy=y+(a.axis==="y"?k:0);if(!Number.isInteger(xx)||!Number.isInteger(yy)||xx<0||yy<0||xx>=n||yy>=n||board[yy*n+xx]!==-1)throw Error("Invalid board");board[yy*n+xx]=i;}}return board;}
 function bounds(s,i,board=occupancy(s)){const a=p[i],at=s[i],index=v=>a.axis==="x"?n*a.y+v:n*v+a.x;let min=at,max=at;while(min>0&&board[index(min-1)]===-1)min--;while(max+a.len<n&&board[index(max+a.len)]===-1)max++;return {min,max};}
 function won(s){return p[0].axis==="x"&&p[0].y===config.exitRow&&s[0]+p[0].len===n;}
 function solve(){const key=s=>s.join(","),queue=[{s:start.slice(),depth:0}],seen=new Set([key(start)]);for(let q=0;q<queue.length;q++){const {s,depth}=queue[q];if(won(s))return {state:s,depth};const board=occupancy(s);for(let i=0;i<p.length;i++){const {min,max}=bounds(s,i,board);for(let v=min;v<=max;v++){if(v===s[i])continue;const next=s.slice();next[i]=v;const k=key(next);if(!seen.has(k)){seen.add(k);queue.push({s:next,depth:depth+1});}}}}return null;}
 return {start,location,occupancy,bounds,won,solve};
};
const NS="http://www.w3.org/2000/svg";
function mount(root,config,options){
 root.replaceChildren();
 const model=engine(config),pieces=config.pieces,n=config.size,cell=60,side=n*cell;
 let state=options.completed?(model.solve()?.state||model.start.slice()):model.start.slice();
 let done=model.won(state),reported=!!options.completed,drag=null;
 const node=(tag,cls,text)=>{const a=document.createElement(tag);if(cls)a.className=cls;if(text!==undefined)a.textContent=text;return a;};
 const hint=node("p","sp-hint","Verschiebe die Möbel, bis Mendel das Café durch den Ausgang rechts verlassen kann.");
 const frame=node("div","sp-frame"),svg=document.createElementNS(NS,"svg");
 svg.setAttribute("class","sp-svg");svg.setAttribute("viewBox","0 0 "+(side+44)+" "+(side+30));svg.setAttribute("aria-label","Grundriss des Café Gluck mit beweglichen Möbeln und Ausgang rechts");
 const E=(tag,attrs={},parent=svg)=>{const x=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>x.setAttribute(k,String(v)));parent.append(x);return x;};
 const T=(parent,attrs,text)=>{const x=E("text",attrs,parent);x.textContent=text;return x;};
 const defs=E("defs");
 function gradient(id,colors){const g=E("linearGradient",{id,x1:"0",y1:"0",x2:"1",y2:"1"},defs);colors.forEach(([offset,color])=>E("stop",{offset,"stop-color":color},g));}
 gradient("sp-wood",[[0,"#c59764"],[.45,"#825338"],[1,"#4c3021"]]);
 gradient("sp-velvet",[[0,"#748f7c"],[.5,"#426456"],[1,"#263e34"]]);
 gradient("sp-marble",[[0,"#f8edda"],[.5,"#d4c5a9"],[1,"#efe3cb"]]);
 gradient("sp-brass",[[0,"#efd9a0"],[.45,"#997442"],[1,"#c4a46d"]]);
 gradient("sp-red",[[0,"#a86c56"],[.5,"#8a483b"],[1,"#5b302a"]]);
 const pattern=E("pattern",{id:"sp-floor",width:30,height:30,patternUnits:"userSpaceOnUse"},defs);
 E("rect",{width:30,height:30,fill:"#d8b98a"},pattern);
 E("path",{d:"M0 0H30V30H0ZM0 10H30M0 20H30M10 0V10M20 10V20M10 20V30",fill:"none",stroke:"#aa845b","stroke-width":.6,opacity:.65},pattern);
 const shadow=E("filter",{id:"sp-shadow",x:"-25%",y:"-30%",width:"150%",height:"170%"},defs);E("feDropShadow",{dx:1,dy:3,stdDeviation:2,"flood-color":"#39271b","flood-opacity":.38},shadow);
 E("rect",{width:side+44,height:side+30,fill:"#eee0bf"});
 const room=E("g",{transform:"translate(12 15)"});
 E("rect",{width:side,height:side,fill:"url(#sp-floor)"},room);
 for(let i=1;i<n;i++)E("path",{d:"M"+i*cell+" 0V"+side+"M0 "+i*cell+"H"+side,stroke:"#876849","stroke-width":.8,"stroke-dasharray":"2 4",opacity:.54},room);
 const exitY=config.exitRow*cell;
 E("path",{d:"M"+side+" "+exitY+"V0H0V"+side+"H"+side+"V"+(exitY+cell),stroke:"#493121","stroke-width":8,fill:"none","stroke-linejoin":"round"},room);
 E("path",{d:"M"+side+" "+exitY+"V0H0V"+side+"H"+side+"V"+(exitY+cell),stroke:"#977348","stroke-width":3,fill:"none","stroke-linejoin":"round"},room);
 E("rect",{x:side-2,y:exitY+3,width:28,height:cell-6,fill:"#b8c5a9",opacity:.65},room);
 E("path",{d:"M"+(side+4)+" "+(exitY+cell/2)+"h19m-7 -7 7 7 -7 7",stroke:"#315746","stroke-width":2.4,fill:"none","stroke-linecap":"round","stroke-linejoin":"round"},room);
 const layer=E("g",{},room),items=[];
 function makeFurniture(i){
  const p=pieces[i],g=E("g",{class:"sp-furniture",tabindex:0,role:"button","aria-label":p.kind==="mendel"?"Mendel":p.kind==="table"?"Kaffeehaustisch":p.kind==="screen"?"Ofenschirm":"Fauteuil"},layer);
  const art=E("g",{transform:p.axis==="y"?"translate("+cell+" 0) rotate(90)":"",filter:"url(#sp-shadow)"},g),w=p.len*cell-8,hh=cell-8;
  const x=4,y=4;
  if(p.kind==="mendel"){
   E("rect",{x,y,width:w,height:hh,rx:9,fill:"url(#sp-red)",stroke:"#61382c","stroke-width":1.5},art);
   E("rect",{x:x+4,y:y+4,width:w-8,height:hh-8,rx:6,fill:"url(#sp-marble)",stroke:"#c2a16a","stroke-width":1.2},art);
   E("path",{d:"M12 14Q35 6 46 23T108 33M14 43Q47 27 80 46",fill:"none",stroke:"#9d927c","stroke-width":.75,opacity:.55},art);
   T(art,{x:x+w/2,y:34,"text-anchor":"middle","font-family":"Georgia,serif","font-weight":700,"font-size":15,fill:"#473c2e"},"MENDEL");
  }else if(p.kind==="table"){
   E("rect",{x,y,width:w,height:hh,rx:8,fill:"url(#sp-wood)",stroke:"#513523","stroke-width":1.5},art);
   E("rect",{x:x+4,y:y+4,width:w-8,height:hh-8,rx:5,fill:"url(#sp-marble)",stroke:"#9a825d"},art);
   E("path",{d:"M12 20Q35 10 54 28T"+(w-5)+" 35M17 45Q45 30 80 45",fill:"none",stroke:"#a3957d",opacity:.55,"stroke-width":.8},art);
   E("ellipse",{cx:w/2+4,cy:30,rx:11,ry:9,fill:"#f4ebd2",stroke:"#9b8a69"},art);
   E("circle",{cx:w/2+4,cy:30,r:6,fill:"#79513a",stroke:"#d5c6a9","stroke-width":1.5},art);
   E("path",{d:"M"+(w/2+10)+" 26q9 0 7 6q-2 4 -7 2",stroke:"#e7d8b5",fill:"none","stroke-width":2},art);
  }else if(p.kind==="screen"){
   E("rect",{x,y,width:w,height:hh,rx:5,fill:"url(#sp-wood)",stroke:"#4d3222","stroke-width":1.5},art);
   E("rect",{x:x+5,y:y+5,width:w-10,height:hh-10,rx:3,fill:"#a58b5e",stroke:"#d2b37b"},art);
   for(let j=0;j<p.len;j++){const xx=8+j*(w-8)/p.len;E("rect",{x:xx,y:10,width:(w-8)/p.len-5,height:40,rx:2,fill:"#514f3b",stroke:"url(#sp-brass)","stroke-width":1.5},art);for(let k=0;k<4;k++)E("path",{d:"M"+(xx+5+k*10)+" 14v32",stroke:"#b49c69","stroke-width":.7,opacity:.7},art);}
  }else{
   E("rect",{x,y,width:w,height:hh,rx:9,fill:"url(#sp-wood)",stroke:"#4d3222","stroke-width":1.3},art);
   E("rect",{x:x+5,y:y+6,width:w-10,height:hh-12,rx:8,fill:"url(#sp-velvet)",stroke:"#314c3f"},art);
   E("rect",{x:x+8,y:y+4,width:w-16,height:15,rx:6,fill:"#486654",stroke:"#8da18b","stroke-width":.6},art);
   E("rect",{x:x+4,y:y+13,width:13,height:hh-17,rx:5,fill:"url(#sp-wood)"},art);
   E("rect",{x:x+w-17,y:y+13,width:13,height:hh-17,rx:5,fill:"url(#sp-wood)"},art);
   for(let j=0;j<p.len;j++){const xx=x+20+j*(w-40)/p.len;E("rect",{x:xx,y:25,width:(w-40)/p.len-2,height:23,rx:4,fill:"url(#sp-velvet)",stroke:"#99ab90","stroke-width":.6},art);}
  }
  g.addEventListener("pointerdown",ev=>begin(ev,i,g));
  g.addEventListener("keydown",ev=>{if(done||drag)return;const d=p.axis==="x"?({"ArrowLeft":-1,"ArrowRight":1}[ev.key]):({"ArrowUp":-1,"ArrowDown":1}[ev.key]);if(d===undefined)return;ev.preventDefault();const {min,max}=model.bounds(state,i);move(i,Math.max(min,Math.min(max,state[i]+d)));});
  items.push(g);
 }
 pieces.forEach((_,i)=>makeFurniture(i));
 const status=node("p","sp-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const result=node("div","sp-result");result.append(node("span","sp-label","FRAGMENT"),node("strong","",config.fragment));
 const reset=node("button","sp-reset","Neu beginnen");reset.type="button";
 frame.append(svg);root.append(hint,frame,status,result,reset);
 function paint(){items.forEach((g,i)=>{const {x,y}=model.location(i,state);g.setAttribute("transform","translate("+x*cell+" "+y*cell+")");g.setAttribute("aria-disabled",String(done));g.classList.toggle("sp-inactive",done);});frame.classList.toggle("sp-solved",done);result.hidden=!done;status.textContent=done?"Mendel hat den Ausgang erreicht.":"Ziehe die Möbel in ihrer jeweiligen Längsrichtung.";}
 function move(i,v){state[i]=v;model.occupancy(state);done=model.won(state);paint();if(done&&!reported){reported=true;options.onSolved();}}
 function point(ev){const m=svg.getScreenCTM();if(!m)return null;const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;return p.matrixTransform(m.inverse());}
 function begin(ev,i,g){if(done||drag||(ev.pointerType==="mouse"&&ev.button!==0))return;const p=point(ev);if(!p)return;ev.preventDefault();const axis=pieces[i].axis;drag={i,g,id:ev.pointerId,start:p[axis],value:state[i],...model.bounds(state,i)};g.classList.add("sp-dragging");svg.setPointerCapture(ev.pointerId);}
 function update(ev){if(!drag||ev.pointerId!==drag.id)return;const p=point(ev);if(!p)return;const d=drag,axis=pieces[d.i].axis;d.value=Math.max(d.min,Math.min(d.max,state[d.i]+(p[axis]-d.start)/cell));const pos=model.location(d.i,state);pos[axis]=d.value;d.g.setAttribute("transform","translate("+pos.x*cell+" "+pos.y*cell+")");}
 function finish(ev,cancel){if(!drag||ev.pointerId!==drag.id)return;if(!cancel)update(ev);const d=drag;drag=null;d.g.classList.remove("sp-dragging");if(cancel)paint();else move(d.i,Math.round(d.value));}
 svg.addEventListener("pointermove",update);svg.addEventListener("pointerup",ev=>finish(ev,false));svg.addEventListener("pointercancel",ev=>finish(ev,true));svg.addEventListener("lostpointercapture",ev=>finish(ev,true));
 reset.onclick=()=>{if(drag){drag.g.classList.remove("sp-dragging");drag=null;}state=model.start.slice();done=false;paint();};
 paint();return ()=>{drag=null;root.replaceChildren();};
}
window.MendelSlider={mount,engine};
})();