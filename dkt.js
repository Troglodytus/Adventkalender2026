/* Local hot-seat KaffeeDKT. Data are separated from the game engine. */
(() => {
"use strict";
function newGame(config,players){return {players:players.map(p=>({name:p.name,color:p.color,money:config.startMoney,pos:0})),owners:Array(config.fields.length).fill(null),turn:0,phase:"roll",die:null,turns:0,log:[],pending:null,newsIndex:0};}
function add(s,msg){s.log.unshift(msg);s.log=s.log.slice(0,40);}
function current(s){return s.players[s.turn];}
function transfer(s,from,to,amount){s.players[from].money-=amount;if(to!==null)s.players[to].money+=amount;}
function next(s){s.turn=(s.turn+1)%s.players.length;s.phase="roll";s.die=null;s.pending=null;s.turns++;}
function roll(s,n){if(s.phase!=="roll"||!Number.isInteger(n)||n<1||n>6)return false;s.die=n;s.phase="move";add(s,current(s).name+" würfelt "+n+".");return true;}
function land(config,s,target){if(s.phase!=="move")return false;const p=current(s),count=config.fields.length,raw=p.pos+s.die;if(target!==raw%count)return false;
 if(raw>=count){p.money+=config.lapBonus;add(s,p.name+" erhält "+config.lapBonus+" K für die Umrundung.");}
 p.pos=target;const f=config.fields[target],owner=s.owners[target];add(s,p.name+" erreicht "+f.name+".");
 if(f.type==="cafe"){if(owner===null){s.phase="buy";s.pending={field:target};}else if(owner!==s.turn){transfer(s,s.turn,owner,f.rent);s.phase="notice";s.pending={title:"Konsumation",text:p.name+" zahlt "+f.rent+" K an "+s.players[owner].name+".",amount:f.rent};add(s,s.pending.text);}else{s.phase="notice";s.pending={title:f.name,text:"Dein eigenes Kaffeehaus – keine Konsumation."};}}
 else if(f.type==="gluck"){p.money+=config.gluckBonus;s.phase="notice";s.pending={title:f.name,text:"Du erhältst "+config.gluckBonus+" K von der Bank."};add(s,p.name+" erhält "+config.gluckBonus+" K im Café Gluck.");}
 else if(f.type==="news"){const card=config.news[s.newsIndex++%config.news.length];if(card.amount<0)transfer(s,s.turn,null,-card.amount);else p.money+=card.amount;s.phase="notice";s.pending={title:f.name,text:card.text};add(s,p.name+": "+card.text);}
 else if(f.type==="billiards"){s.phase="duel";s.pending={opponent:(s.turn+1)%s.players.length,a:null,b:null};}
 else{s.phase="notice";s.pending={title:f.name,text:"Geschäftseröffnung – die nächste Runde beginnt."};}
 return true;
}
function buy(config,s,yes){if(s.phase!=="buy")return false;const i=s.pending.field,f=config.fields[i];if(yes){if(s.owners[i]!==null||current(s).money<f.price)return false;transfer(s,s.turn,null,f.price);s.owners[i]=s.turn;add(s,current(s).name+" pachtet "+f.name+" für "+f.price+" K.");}else add(s,current(s).name+" verzichtet auf "+f.name+".");next(s);return true;}
function duel(config,s,a,b){if(s.phase!=="duel"||![a,b].every(n=>Number.isInteger(n)&&n>=1&&n<=6))return false;const other=s.pending.opponent;if(a===b){add(s,"Karambolbillard: Gleichstand – erneut würfeln.");return false;}const win=a>b?s.turn:other,lose=a>b?other:s.turn;transfer(s,lose,win,config.duelStake);s.phase="notice";s.pending={title:"Karambolbillard",text:s.players[s.turn].name+" "+a+" : "+b+" "+s.players[other].name+". "+s.players[win].name+" gewinnt "+config.duelStake+" K."};add(s,s.pending.text);return true;}
function mount(root,config,options){
 root.replaceChildren();
 const node=(tag,cls,t)=>{const a=document.createElement(tag);if(cls)a.className=cls;if(t!==undefined)a.textContent=t;return a;};
 const btn=(t,fn,cls="kd-button")=>{const b=node("button",cls,t);b.type="button";b.onclick=fn;return b;};
 const shell=node("div","kd-shell"),main=node("div","kd-main"),board=node("div","kd-board"),side=node("aside","kd-side"),holdings=node("div","kd-holdings");
 const center=node("div","kd-center");center.append(node("span","kd-eyebrow","WIENER KAFFEEHAUSGESELLSCHAFT"),node("h2","kd-logo","KaffeeDKT"),node("p","kd-tagline","Pachten · Konsumieren · Genießen"));
 const centralStatus=node("p","kd-central-status");center.append(centralStatus);board.append(center);
 const cells=[];
 function coords(i){if(i<=5)return [6,6-i];if(i<=10)return [11-i,1];if(i<=15)return [1,i-9];return [i-14,6];}
 config.fields.forEach((f,i)=>{const t=btn("",()=>chooseField(i),"kd-field "+(f.type==="cafe"?"kd-cafe":"kd-corner"));const [row,col]=coords(i);t.style.gridRow=row;t.style.gridColumn=col;if(f.color)t.style.setProperty("--group",f.color);const band=node("span","kd-band"),name=node("span","kd-field-name",f.name),cost=node("span","kd-price",f.price?f.price+" K":f.type==="start"?"+ "+config.lapBonus+" K":f.type==="gluck"?"+ "+config.gluckBonus+" K":f.type==="news"?"Zeitung":"Würfelduell");const owner=node("span","kd-owner"),tokens=node("div","kd-tokens");t.append(band,name,cost,owner,tokens);board.append(t);cells.push({t,owner,tokens});});
 main.append(board);shell.append(main,side,holdings);
 const setup=node("section","kd-setup"),score=node("section","kd-score"),controls=node("section","kd-controls"),history=node("section","kd-history");
 side.append(setup,score,controls,history);root.append(shell);
 const overlay=node("div","kd-overlay"),card=node("div","kd-modal");overlay.hidden=true;overlay.append(card);root.append(overlay);
 let s=null,reported=!!options.completed,dragging=null;
 const colors=["#9c4140","#36765a","#376a98","#d09c35","#78486f","#797c7e"];
 const inputs=colors.map((color,i)=>{const row=node("div","kd-player-input");const name=node("input","kd-name");name.placeholder="Spieler "+(i+1);name.maxLength=24;name.setAttribute("aria-label","Name Spieler "+(i+1));const swatch=node("input","kd-color");swatch.type="color";swatch.value=color;swatch.setAttribute("aria-label","Farbe Spieler "+(i+1));row.append(name,swatch);return {row,name,swatch};});
 setup.append(node("h3","","Spieler"),node("p","kd-small","2–6 Spieler · leere Einträge werden ignoriert."),...inputs.map(x=>x.row));
 const setupError=node("p","kd-error");setup.append(setupError,btn("Partie starten",()=>{const p=inputs.map(x=>({name:x.name.value.trim(),color:x.swatch.value})).filter(x=>x.name);if(p.length<2){setupError.textContent="Mindestens zwei Spieler eintragen.";return;}if(new Set(p.map(x=>x.color)).size!==p.length){setupError.textContent="Bitte unterschiedliche Spielfarben wählen.";return;}s=newGame(config,p);render();}));
 const coin=n=>n.toLocaleString("de-AT")+" K";
 function save(){try{if(s)localStorage.setItem(options.storageKey,JSON.stringify(s));else localStorage.removeItem(options.storageKey);}catch{}}
 try{const saved=JSON.parse(localStorage.getItem(options.storageKey)||"null");if(saved&&saved.players.length>=2&&saved.owners.length===config.fields.length&&["roll","move","buy","notice","duel"].includes(saved.phase))s=saved;}catch{}
 function completeTurn(){next(s);if(!reported){reported=true;options.onSolved();}render();}
 function random(){return 1+Math.floor(Math.random()*6);}
 function chooseField(i){if(!s)return;if(s.phase==="move"){if(!land(config,s,i)){centralStatus.textContent="Bitte genau "+s.die+" Felder im Uhrzeigersinn weiterziehen.";return;}render();}else if(s.phase==="roll"&&config.fields[i].type==="cafe")showInfo(i);}
 function showInfo(i){const f=config.fields[i];card.replaceChildren(property(f,s.owners[i]===null?null:s.players[s.owners[i]]),btn("Schließen",()=>overlay.hidden=true));overlay.hidden=false;}
 function property(f,owner){const c=node("div","kd-property");c.style.setProperty("--group",f.color);c.append(node("div","kd-property-band","BESITZKARTE"),node("h3","",f.name),node("p","","Pacht: "+coin(f.price)),node("p","","Konsumation: "+coin(f.rent)));if(owner)c.append(node("p","kd-small","In Besitz von "+owner.name));return c;}
 function renderModal(){overlay.hidden=true;card.replaceChildren();if(!s)return;
  if(s.phase==="buy"){const f=config.fields[s.pending.field];card.append(property(f,null));const yes=btn("Pachten · "+coin(f.price),()=>{if(buy(config,s,true)){if(!reported){reported=true;options.onSolved();}render();}});yes.disabled=current(s).money<f.price;card.append(yes,btn("Nicht kaufen",()=>{buy(config,s,false);if(!reported){reported=true;options.onSolved();}render();}));if(yes.disabled)card.append(node("p","kd-error","Nicht genügend Kronen."));overlay.hidden=false;}
  if(s.phase==="notice"){card.append(node("h3","",s.pending.title),node("p","kd-notice",s.pending.text),btn("Nächster Spieler",completeTurn));overlay.hidden=false;}
  if(s.phase==="duel"){const other=s.players[s.pending.opponent];card.append(node("h3","","Karambolbillard"),node("p","",current(s).name+" gegen "+other.name+" · Einsatz "+coin(config.duelStake)),btn("Beide würfeln",()=>{const a=random(),b=random();if(duel(config,s,a,b)){render();}else{render();card.append(node("p","","Gleichstand: "+a+" : "+b));}}));overlay.hidden=false;}
 }
 function render(){setup.hidden=!!s;score.hidden=!s;controls.hidden=!s;history.hidden=!s;holdings.hidden=!s;
  cells.forEach(({t,owner,tokens},i)=>{tokens.replaceChildren();owner.textContent="";t.classList.remove("kd-target","kd-owned");t.style.removeProperty("--owner");if(!s)return;const idx=s.owners[i];if(idx!==null){owner.textContent=s.players[idx].name;t.style.setProperty("--owner",s.players[idx].color);t.classList.add("kd-owned");}s.players.forEach((p,j)=>{if(p.pos!==i)return;const token=node("span","kd-token");token.style.background=p.color;token.title=p.name;token.setAttribute("aria-label",p.name);if(j===s.turn&&s.phase==="move"){token.draggable=true;token.classList.add("kd-draggable");token.addEventListener("dragstart",e=>{dragging=j;e.dataTransfer.setData("text/plain",String(j));e.dataTransfer.effectAllowed="move";});token.addEventListener("dragend",()=>dragging=null);}tokens.append(token);});if(s.phase==="move"&&i===(current(s).pos+s.die)%config.fields.length)t.classList.add("kd-target");});
  if(!s){centralStatus.textContent="Trage rechts eure Namen ein und eröffnet das Geschäft.";overlay.hidden=true;save();return;}
  const p=current(s);centralStatus.textContent=s.phase==="move"?p.name+" zieht "+s.die+" Felder.":p.name+" ist am Zug.";
  score.replaceChildren(node("h3","","Spieler & Kontostand"));
  s.players.forEach((v,i)=>{const r=node("div","kd-player "+(i===s.turn?"kd-active":""));r.style.setProperty("--player",v.color);r.append(node("span","kd-player-name",v.name),node("strong","kd-money",coin(v.money)));score.append(r);});
  const dice=node("div","kd-dice",s.die===null?"–":String(s.die));dice.setAttribute("aria-label",s.die===null?"Noch nicht gewürfelt":"Würfel "+s.die);
  const rollBtn=btn("Würfeln",()=>{if(roll(s,random()))render();});rollBtn.disabled=s.phase!=="roll";
  controls.replaceChildren(node("h3","",p.name+" ist am Zug"),dice,rollBtn,node("p","kd-small",s.phase==="move"?"Figur ziehen oder Zielfeld anklicken.":"Nach dem Würfeln manuell ziehen."),btn("Neue Partie",()=>{if(confirm("Aktuelle Partie beenden und neu beginnen?")){s.players.forEach((v,i)=>{inputs[i].name.value=v.name;inputs[i].swatch.value=v.color;});s=null;render();}},"kd-secondary"));
  history.replaceChildren(node("h3","","Spielprotokoll"),...s.log.slice(0,10).map(x=>node("p","kd-log",x)));
  holdings.replaceChildren();s.players.forEach((v,i)=>{const section=node("section","kd-holding");section.style.setProperty("--player",v.color);section.append(node("h3","",v.name+" · Besitzkarten"));const cards=node("div","kd-cards");s.owners.forEach((owner,j)=>{if(owner===i){const f=config.fields[j],mini=btn(f.name,()=>showInfo(j),"kd-mini");mini.style.setProperty("--group",f.color);mini.append(node("small","",coin(f.rent)+" Konsumation"));cards.append(mini);}});if(!cards.children.length)cards.append(node("p","kd-small","Noch keine Kaffeehäuser."));section.append(cards);holdings.append(section);});
  renderModal();save();
 }
 cells.forEach(({t},i)=>{t.addEventListener("dragover",e=>{if(s?.phase==="move"&&dragging===s.turn)e.preventDefault();});t.addEventListener("drop",e=>{e.preventDefault();if(s?.phase==="move"&&dragging===s.turn){dragging=null;chooseField(i);}});});
 render();return ()=>{save();root.replaceChildren();};
}
window.MendelDKT={mount,newGame,roll,land,buy,duel,next,transfer};
})();