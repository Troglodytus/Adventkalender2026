/* Reusable, dependency-free legal chess puzzle player. */
(() => {
"use strict";
const rules = (function chessRules(){
 const dirs={n:[-33,-31,-18,-14,14,18,31,33],b:[-17,-15,15,17],r:[-16,-1,1,16],k:[-17,-16,-15,-1,1,15,16,17],q:[-17,-16,-15,-1,1,15,16,17]};
 const on=i=>i>=0&&i<128&&!(i&0x88);
 const side=p=>!p||p==="."?0:p===p.toUpperCase()?1:-1;
 const square=i=>"abcdefgh"[i&7]+(8-(i>>4));
 const index=s=>(8-Number(s[1]))*16+"abcdefgh".indexOf(s[0]);
 const key=m=>square(m[0])+square(m[1])+m[2];
 function parse(fen){
  const f=fen.trim().split(/\s+/),rows=f[0].split("/"),b=Array(128).fill(".");
  if(rows.length!==8||!/^[wb]$/.test(f[1])||!/^(?:-|K?Q?k?q?)$/.test(f[2])||!/^(?:-|[a-h][36])$/.test(f[3]))throw Error("Ungültige FEN");
  rows.forEach((row,r)=>{let c=0;for(const p of row){if(/^[1-8]$/.test(p))c+=Number(p);else{if(!/^[prnbqkPRNBQK]$/.test(p)||c>=8)throw Error("Ungültige FEN-Reihe");b[r*16+c++]=p;}}if(c!==8)throw Error("Ungültige FEN-Reihe");});
  if(b.filter(p=>p==="K").length!==1||b.filter(p=>p==="k").length!==1)throw Error("Könige fehlen");
  return {b,t:f[1]==="w"?1:-1,c:(f[2].includes("K")?1:0)|(f[2].includes("Q")?2:0)|(f[2].includes("k")?4:0)|(f[2].includes("q")?8:0),ep:f[3]==="-"?-1:index(f[3]),half:Number(f[4]||0),full:Number(f[5]||1)};
 }
 function attacked(s,target,by){
  for(let f=0;f<128;f++){if(!on(f)||side(s.b[f])!==by)continue;const p=s.b[f].toLowerCase();
   if(p==="p"){if(target===f-16*by-1||target===f-16*by+1)return true;continue;}
   for(const d of dirs[p])for(let t=f+d;on(t);t+=d){if(t===target)return true;if(s.b[t]!=="."||p==="n"||p==="k")break;}
  }return false;
 }
 const checked=(s,color=s.t)=>attacked(s,s.b.indexOf(color===1?"K":"k"),-color);
 function apply(s,m){
  const [f,t,promo,flag]=m,b=s.b.slice(),piece=b[f],captured=b[t];let c=s.c;
  b[f]=".";b[t]=promo?(s.t===1?promo.toUpperCase():promo):piece;
  if(flag==="ep")b[t+16*s.t]=".";
  if(flag==="castle"){const rf=t>f?f+3:f-4,rt=t>f?f+1:f-1;b[rt]=b[rf];b[rf]=".";}
  if(piece==="K")c&=~3;if(piece==="k")c&=~12;
  const bits={119:1,112:2,7:4,0:8};
  if(piece.toLowerCase()==="r")c&=~(bits[f]||0);if(captured.toLowerCase()==="r")c&=~(bits[t]||0);
  return {b,t:-s.t,c,ep:piece.toLowerCase()==="p"&&Math.abs(t-f)===32?(t+f)/2:-1,half:piece.toLowerCase()==="p"||captured!=="."||flag==="ep"?0:s.half+1,full:s.full+(s.t===-1?1:0)};
 }
 function pseudo(s){
  const out=[];
  for(let f=0;f<128;f++){if(!on(f)||side(s.b[f])!==s.t)continue;const p=s.b[f].toLowerCase();
   const add=(t,flag="")=>{if(s.b[t].toLowerCase()==="k")return;if(p==="p"&&((t>>4)===0||(t>>4)===7))for(const q of ["q","r","b","n"])out.push([f,t,q,flag]);else out.push([f,t,"",flag]);};
   if(p==="p"){const t=f-16*s.t;if(on(t)&&s.b[t]==="."){add(t);const u=t-16*s.t;if((f>>4)===(s.t===1?6:1)&&s.b[u]===".")add(u);}for(const d of [-1,1]){const u=t+d;if(!on(u))continue;if(side(s.b[u])===-s.t)add(u);else if(u===s.ep&&s.b[u]==="."&&s.b[u+16*s.t]===(s.t===1?"p":"P"))add(u,"ep");}}
   else{for(const d of dirs[p])for(let t=f+d;on(t);t+=d){if(side(s.b[t])===s.t)break;add(t);if(s.b[t]!=="."||p==="n"||p==="k")break;}
    const home=s.t===1?116:4,rook=s.t===1?"R":"r",bits=s.t===1?[1,2]:[4,8];if(p==="k"&&f===home&&!checked(s)){
    if((s.c&bits[0])&&s.b[f+3]===rook&&s.b[f+1]==="."&&s.b[f+2]==="."&&!attacked(s,f+1,-s.t)&&!attacked(s,f+2,-s.t))add(f+2,"castle");
    if((s.c&bits[1])&&s.b[f-4]===rook&&s.b[f-1]==="."&&s.b[f-2]==="."&&s.b[f-3]==="."&&!attacked(s,f-1,-s.t)&&!attacked(s,f-2,-s.t))add(f-2,"castle");
    }
   }
  }return out;
 }
 const legal=s=>pseudo(s).filter(m=>!checked(apply(s,m),s.t));
 function san(s,m){
  const [f,t,promo,flag]=m,p=s.b[f].toUpperCase(),capture=s.b[t]!=="."||flag==="ep";let text="";
  if(flag==="castle")text=t>f?"O-O":"O-O-O";else{
   if(p!=="P"){text=p;const other=legal(s).filter(x=>x[0]!==f&&x[1]===t&&s.b[x[0]]===s.b[f]);if(other.length)text+=!other.some(x=>(x[0]&7)===(f&7))?square(f)[0]:!other.some(x=>(x[0]>>4)===(f>>4))?square(f)[1]:square(f)[0]+square(f)[1];}else if(capture)text=square(f)[0];
   text+=(capture?"x":"")+square(t)+(promo?"="+promo.toUpperCase():"");
  }const next=apply(s,m);return text+(checked(next)?legal(next).length?"+":"#":"");
 }
 return {parse,legal,apply,checked,san,square,index,key,side};
})();
const glyph={K:"♚",Q:"♛",R:"♜",B:"♝",N:"♞",P:"♟︎",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟︎",".":""};
const names={k:"König",q:"Dame",r:"Turm",b:"Läufer",n:"Springer",p:"Bauer"};
function mount(root,config,options){
 const {parse,legal,apply,checked,san,square,key,side}=rules;
 const player=config.player==="b"?-1:1;
 const initial=parse(config.fen), line=config.line.slice(), snapshots=[initial], labels=[];
 let test=initial;
 for(const u of line){const m=legal(test).find(x=>key(x)===u);if(!m)throw Error("Ungültiger Rätselzug: "+u);labels.push((test.t===1?test.full+". ":test.full+"... ")+san(test,m));test=apply(test,m);snapshots.push(test);}
 root.replaceChildren();
 function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 const status=node("p","chess-status");status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const board=node("div","chess-board");board.setAttribute("role","group");board.setAttribute("aria-label","Schachbrett");
 const moves=node("p","chess-moves");
 const promotion=node("div","chess-promotion");promotion.hidden=true;
 const restart=node("button","chess-restart","Partie neu beginnen");restart.type="button";
 root.append(status,board,moves,promotion,restart);
 let s=initial,step=0,selected=-1,last=null,waiting=false,disposed=false,timer=null,drag=null,feedback="",finished=false;
 const cells=new Map();
 for(let j=0;j<64;j++){
   const r=player===1?j>>3:7-(j>>3),c=player===1?j&7:7-(j&7),i=r*16+c;
   const cell=node("button","chess-square "+((r+c)%2?"dark":"light"));cell.type="button";
   const piece=node("span","chess-piece");
   cell.append(piece);
   if(j%8===0)cell.append(node("span","chess-rank",String(8-r)));
   if(j>=56)cell.append(node("span","chess-file",square(i)[0]));
   cell.addEventListener("click",()=>click(i));
   cell.addEventListener("dragstart",e=>{if(waiting||finished||s.t!==player||side(s.b[i])!==player){e.preventDefault();return;}drag=i;selected=i;e.dataTransfer.setData("text/plain",square(i));e.dataTransfer.effectAllowed="move";paint();});
   cell.addEventListener("dragover",e=>{if(drag!==null)e.preventDefault();});
   cell.addEventListener("drop",e=>{e.preventDefault();if(drag!==null){selected=drag;drag=null;click(i);}});
   cell.addEventListener("dragend",()=>{drag=null;});
   cells.set(i,{cell,piece});board.append(cell);
 }
 function paint(){
   const targets=selected<0?[]:legal(s).filter(m=>m[0]===selected).map(m=>m[1]);
   for(const [i,{cell,piece}] of cells){
     const p=s.b[i];piece.textContent=glyph[p];piece.className="chess-piece "+(side(p)===1?"white-piece":"black-piece");
     cell.setAttribute("aria-label",square(i)+(p==="."?", leer":", "+(side(p)===1?"weiß ":"schwarz ")+names[p.toLowerCase()]));
     cell.classList.toggle("selected",selected===i);
     cell.classList.toggle("target",targets.includes(i));
     cell.classList.toggle("capture",targets.includes(i)&&p!==".");
     cell.classList.toggle("last",!!last&&(last[0]===i||last[1]===i));
     cell.classList.toggle("in-check",p===(s.t===1?"K":"k")&&checked(s));
     cell.draggable=!waiting&&!finished&&s.t===player&&side(p)===player;
   }
   status.classList.toggle("wrong",!!feedback);
   status.classList.toggle("done",finished);
   status.textContent=feedback||(finished?"Zugfolge gelöst.":waiting?(s.t===1?"Weiß zieht …":"Schwarz zieht …"):(player===1?"Weiß ist am Zug.":"Schwarz ist am Zug.")+(checked(s)?" Schach.":""));
   moves.textContent=labels.slice(0,step).join("   ");
 }
 function advance(m){
   s=apply(s,m);last=m;step++;selected=-1;feedback="";promotion.hidden=true;
   if(step===line.length){finished=true;waiting=false;paint();options.onSolved();return;}
   if(s.t!==player){auto();return;}waiting=false;paint();
 }
 function auto(){
   waiting=true;selected=-1;paint();
   timer=setTimeout(()=>{if(disposed)return;const m=legal(s).find(x=>key(x)===line[step]);if(!m){waiting=false;feedback="Die Zugfolge kann nicht fortgesetzt werden.";paint();return;}advance(m);},650);
 }
 function attempt(m){
   if(key(m)!==line[step]){feedback="Nicht der gesuchte Zug. Versuch es noch einmal.";selected=-1;promotion.hidden=true;paint();return;}
   advance(m);
 }
 function click(i){
   if(disposed||waiting||finished||s.t!==player||!promotion.hidden)return;
   feedback="";
   if(side(s.b[i])===player){selected=selected===i?-1:i;paint();return;}
   if(selected<0)return;
   const choices=legal(s).filter(m=>m[0]===selected&&m[1]===i);
   if(!choices.length){feedback="Dieser Zug ist nicht möglich.";paint();return;}
   if(choices.length===1){attempt(choices[0]);return;}
   promotion.replaceChildren(node("span","","Umwandlung:"));
   for(const m of choices){const b=node("button","chess-restart",names[m[2]]);b.type="button";b.onclick=()=>attempt(m);promotion.append(b);}
   const cancel=node("button","chess-restart","Abbrechen");cancel.type="button";cancel.onclick=()=>{promotion.hidden=true;};promotion.append(cancel);promotion.hidden=false;
 }
 restart.onclick=()=>{clearTimeout(timer);s=initial;step=0;selected=-1;last=null;waiting=false;feedback="";finished=false;promotion.hidden=true;if(s.t!==player)auto();else paint();};
 if(options.completed){s=snapshots[line.length];step=line.length;finished=true;const prev=snapshots[step-1];last=legal(prev).find(m=>key(m)===line[step-1]);paint();options.onSolved();}else if(s.t!==player)auto();else paint();
 return ()=>{disposed=true;clearTimeout(timer);root.replaceChildren();};
}
window.MendelChess={mount};
})();