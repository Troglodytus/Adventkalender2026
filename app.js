(() => {
  "use strict";
  const config = window.MENDEL;
  const $ = id => document.getElementById(id);
  const calendar = $("calendar"), dialog = $("day-dialog"), letters = $("letters");
  const pad = n => String(n).padStart(2,"0");
  const normalize = s => String(s).toUpperCase().replace(/Ä/g,"AE").replace(/Ö/g,"OE").replace(/Ü/g,"UE").replace(/[^A-Z0-9]/g,"");
  const dateKey = (date = new Date()) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:config.timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date).map(p=>[p.type,p.value]));
    return parts.year+"-"+parts.month+"-"+parts.day;
  };
  const dayKey = day => config.year+"-12-"+pad(day);
  const isOpen = day => dev || dateKey() >= dayKey(day);
  const icon = {
    locked:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>',
    solved:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>'
  };
  let dev = Boolean(config.developerEnabled);
  let active = null, lastButton = null;
  const memory = {};
  const storageKey = () => "mendel-"+config.year+(dev?"-test":"-progress")+"-v1";
  function readProgress(){
    try {const data=JSON.parse(localStorage.getItem(storageKey())||"{}");return data&&typeof data==="object"&&!Array.isArray(data)?data:{};}
    catch {return memory[storageKey()]||{};}
  }
  let progress = readProgress();
  function saveProgress(){
    memory[storageKey()] = progress;
    try {localStorage.setItem(storageKey(),JSON.stringify(progress));}catch{}
  }
  function solved(day) {
    const puzzle=config.days[day];
    return Boolean(puzzle?.answer && progress[day]===normalize(puzzle.answer));
  }
  function el(tag, className, content) {
    const node=document.createElement(tag); if(className)node.className=className;
    if(content!==undefined)node.textContent=content;return node;
  }
  function render(){
    const today=dateKey();
    const restoreDay=document.activeElement?.dataset?.day;
    calendar.replaceChildren();
    let count=0;
    for(let day=1;day<=24;day++){
      const open=isOpen(day), done=open&&solved(day);
      if(done)count++;
      const button=el("button","door");
      button.type="button";button.dataset.day=day;button.disabled=!open;
      if(done)button.classList.add("solved");
      if(today===dayKey(day))button.classList.add("today");
      const status=done?"Gelöst":open?"Öffnen":"Gesperrt";
      button.setAttribute("aria-label",day+". Dezember, "+status);
      button.append(el("span","number",pad(day)));
      const label=el("span","status");
      if(done||!open)label.innerHTML=done?icon.solved:icon.locked;
      label.append(document.createTextNode(status));button.append(label);
      button.addEventListener("click",()=>{lastButton=button;openDay(day);});
      calendar.append(button);
    }
    if(restoreDay && !dialog.open)calendar.querySelector('[data-day="'+restoreDay+'"]')?.focus();
    $("count").textContent=count+" / 24 gelöst";
    $("progress").style.width=(count/24*100)+"%";
    $("progress").parentElement.setAttribute("aria-valuenow",count);
    $("calendar-note").textContent=dev?"Testmodus · Alle 24 Türchen sind geöffnet.":today<dayKey(1)?"Das erste Türchen öffnet sich am 1. Dezember.":today>dayKey(24)?"Alle Türchen stehen dir offen.":"Jeden Tag öffnet sich ein neuer Eintrag.";
    const fragments=Array.from({length:24},(_,i)=>i+1).filter(d=>isOpen(d)&&solved(d)&&config.days[d]?.fragment).map(d=>config.days[d].fragment);
    const finalReady=count===24&&Boolean(config.finale);
    $("register").hidden=!fragments.length&&!finalReady;
    $("fragments").replaceChildren(...fragments.map(f=>el("span","",f)));
    $("finale").hidden=!finalReady;
    $("finale").textContent=finalReady?config.finale:"";
    $("reset").hidden=!dev;
  }
  function openDay(day){
    if(!isOpen(day))return;
    active=day;
    const puzzle=config.days[day];
    $("day-date").textContent=pad(day)+". Dezember "+config.year;
    $("day-title").textContent=puzzle?.title||"Eintrag "+pad(day);
    $("day-page").textContent=puzzle?.page?"Buchmendel · Seite "+puzzle.page:"";
    $("day-prompt").textContent=puzzle?.prompt||"Dieser Eintrag wartet noch auf seine Geschichte.";
    $("answer-form").hidden=!puzzle?.answer;
    $("solution").hidden=true;
    $("solution-fragment").hidden=true;
    $("feedback").textContent="";
    $("feedback").classList.remove("success");
    letters.className="letters";letters.replaceChildren();
    if(puzzle?.answer){
      const answer=normalize(puzzle.answer), boxes=[];
      function assign(start, value){
        const chars=normalize(value).split("");
        if(!chars.length){boxes[start].value="";check();return;}
        chars.slice(0,boxes.length-start).forEach((ch,i)=>boxes[start+i].value=ch);
        const next=Math.min(start+chars.length,boxes.length-1);
        if(start+chars.length<boxes.length)boxes[next].focus();
        else boxes[boxes.length-1].focus();
        check();
      }
      function check(){
        const values=boxes.map(b=>b.value);
        const guess=values.join("");
        const complete=values.every(Boolean);
        const correct=complete&&[answer,...(puzzle.aliases||[]).map(normalize)].includes(guess);
        letters.classList.toggle("wrong",complete&&!correct);
        letters.classList.toggle("correct",correct);
        $("feedback").classList.toggle("success",correct);
        $("feedback").textContent=correct?"Richtig.":complete?"Noch nicht ganz. Versuch es noch einmal.":"";
        if(correct){
          progress[day]=answer;saveProgress();
          boxes.forEach(b=>{b.readOnly=true;});
          $("solution-word").textContent=puzzle.answer;
          $("solution-text").textContent=puzzle.solution||"Ein weiterer Eintrag ist gefunden.";
          $("solution-fragment").hidden=!puzzle.fragment;
          $("solution-fragment").textContent=puzzle.fragment?"Fundstück: "+puzzle.fragment:"";
          $("solution").hidden=false;render();
        }
      }
      for(let i=0;i<answer.length;i++){
        const box=el("input","letter");
        box.type="text";box.inputMode=/^[0-9]+$/.test(answer)?"numeric":"text";box.autocomplete="off";box.autocapitalize="characters";box.spellcheck=false;
        box.setAttribute("aria-label","Zeichen "+(i+1)+" von "+answer.length);
        box.addEventListener("focus",()=>box.select());
        box.addEventListener("input",()=>{if(!box.readOnly)assign(i,box.value);});
        box.addEventListener("paste",e=>{if(box.readOnly)return;e.preventDefault();assign(i,e.clipboardData.getData("text"));});
        box.addEventListener("keydown",e=>{
          if(e.key==="ArrowLeft"&&i>0){e.preventDefault();boxes[i-1].focus();}
          if(e.key==="ArrowRight"&&i<boxes.length-1){e.preventDefault();boxes[i+1].focus();}
          if(e.key==="Backspace"&&!box.value&&i>0&&!box.readOnly){e.preventDefault();boxes[i-1].value="";boxes[i-1].focus();check();}
          if(e.key==="Enter"){e.preventDefault();check();}
        });
        boxes.push(box);letters.append(box);
      }
      if(solved(day)){boxes.forEach((b,i)=>b.value=answer[i]);check();}
    }
    if(!dialog.open)dialog.showModal();
    // On mobile, avoid opening the keyboard automatically before the clue can be read.
    $("close").focus();
  }
  $("answer-form").addEventListener("submit",e=>e.preventDefault());
  $("close").addEventListener("click",()=>dialog.close());
  $("back").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
  dialog.addEventListener("close",()=>{
    const button=calendar.querySelector('[data-day="'+active+'"]')||lastButton;
    button?.focus();active=null;
  });
  $("dev-control").hidden=!config.developerEnabled;
  $("dev-toggle").checked=dev;
  $("dev-toggle").addEventListener("change",e=>{
    dev=Boolean(config.developerEnabled&&e.target.checked);progress=readProgress();render();
  });
  $("reset").addEventListener("click",()=>{
    if(!dev||!confirm("Nur den Testfortschritt löschen?"))return;
    progress={};saveProgress();render();
  });
  window.addEventListener("storage",e=>{if(e.key===storageKey()){progress=readProgress();if(!dialog.open)render();}});
  let lastDate=dateKey();
  function refreshDate(){const next=dateKey();if(next!==lastDate){lastDate=next;if(dialog.open&&!isOpen(active))dialog.close();render();}}
  setInterval(refreshDate,15000);
  document.addEventListener("visibilitychange",refreshDate);
  render();
})();