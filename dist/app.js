(() => {
  'use strict';
  const $=id=>document.getElementById(id), core=window.Letterpret, storageKey='letterpret.v1';
  let state=null, interval=null;
  const hashMatch=location.hash.match(/^#v1-([0-9A-Z]{7})$/);
  let challenge=hashMatch&&core.validCode(hashMatch[1])?hashMatch[1]:null;
  const announce=text=>{$('announcement').textContent=text;};
  const save=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{}};
  const round=()=>core.makeRound(state.code);
  function countFilled(){$('filled').textContent=`${state.answers.filter(x=>x.trim()).length} / 13`;}
  function showGame(){ $('intro').hidden=true;$('game').hidden=false; }
  function render(){
    const r=round();showGame();const paper=state.mode==='paper';document.body.classList.toggle('paper',paper);$('letter').textContent=r.letter;$('roundCode').textContent=`RONDE ${r.code}`;
    $('fullscreenButton').hidden=!paper;$('finishButton').textContent=paper?'Ronde afronden':'Klaar met invullen';
    $('answers').replaceChildren();$('results').hidden=state.phase!=='review';$('finishButton').hidden=state.phase!=='playing';
    $('gameTitle').textContent=paper?(state.phase==='review'?'Pennen neer!':'Schrijf mee op papier.'):(state.phase==='review'?'De woorden liggen op tafel.':'Laat die woorden komen.');
    $('columnLabel').textContent=state.phase==='review'?'ANTWOORD & PUNT':'JOUW ANTWOORD';
    r.categories.forEach((category,i)=>{
      const row=document.createElement('div');row.className='answer-row';
      const label=document.createElement('label');label.className='category';label.htmlFor=`answer-${i}`;
      const number=document.createElement('span');number.className='row-number';number.textContent=String(i+1).padStart(2,'0');
      const name=document.createElement('span');name.textContent=category.name;label.append(number,name);
      const control=document.createElement('div');control.className='answer-control';
      const input=document.createElement('input');input.type='text';input.id=`answer-${i}`;input.name=`answer-${i}`;input.maxLength=90;input.value=state.answers[i];input.placeholder=`${r.letter}…`;input.disabled=state.phase!=='playing';input.spellcheck=false;input.autocomplete='off';input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');
      input.addEventListener('input',()=>{if(state.phase!=='playing'||Date.now()>=state.deadline){input.value=state.answers[i];finish(true);return;}state.answers[i]=input.value;countFilled();save();});
      input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();$(`answer-${i+1}`)?.focus();}});
      control.append(input);row.append(label,control);$('answers').append(row);
    });
    countFilled();if(state.phase==='review')renderReview();tick();
  }
  function start(code,mode){
    clearInterval(interval);
    $('shareFallback').hidden=true;
    state={code:code||core.randomCode(),mode:mode||state?.mode||document.querySelector('input[name=mode]:checked').value,phase:'playing',answers:Array(13).fill(''),accepted:Array(13).fill(false),deadline:Date.now()+120000,remaining:120};
    challenge=null;save();announce('De ronde is gestart. Je hebt 120 seconden.');render();
    interval=setInterval(tick,200);window.scrollTo({top:0,behavior:'instant'});if(state.mode!=='paper')$('answer-0').focus({preventScroll:true});
  }
  function tick(){
    if(!state)return;
    const remaining=state.phase==='playing'?Math.max(0,Math.ceil((state.deadline-Date.now())/1000)):state.remaining;
    $('timer').textContent=`${Math.floor(remaining/60).toString().padStart(2,'0')}:${(remaining%60).toString().padStart(2,'0')}`;
    $('timeFill').style.width=`${remaining/120*100}%`;
    document.querySelector('.dashboard').classList.toggle('urgent',state.phase==='playing'&&remaining<=20);
    $('timerCaption').textContent=state.phase==='review'?(remaining===0?'Tijd om!':'Ronde afgerond'):'Je tijd loopt…';
    if(state.phase==='playing'&&remaining===0)finish(true);
  }
  function finish(expired=false){
    if(!state||state.phase!=='playing')return;
    state.remaining=expired?0:Math.max(0,Math.ceil((state.deadline-Date.now())/1000));state.phase='review';clearInterval(interval);
    state.accepted=core.inspect(state.answers,round().letter).map(x=>x.eligible);save();render();
    announce(state.mode==='paper'?'Pennen neer! Vergelijk jullie antwoorden op papier.':expired?'Tijd om! Je antwoorden zijn vastgezet. Kijk ze hieronder na.':'Ronde afgerond. Kijk je antwoorden na.');
    $('nextButton').focus({preventScroll:true});
  }
  function renderReview(){
    const checks=core.inspect(state.answers,round().letter);
    checks.forEach((check,i)=>{
      const control=$(`answer-${i}`).parentElement;
      if(check.eligible){
        const wrap=document.createElement('div');wrap.className='review-control';
        const box=document.createElement('input');box.type='checkbox';box.id=`point-${i}`;box.checked=state.accepted[i];
        const label=document.createElement('label');label.htmlFor=box.id;label.textContent='Geldig · 1 punt';
        box.setAttribute('aria-label',`Punt voor ${round().categories[i].name}`);
        box.addEventListener('change',()=>{state.accepted[i]=box.checked;save();updateScore();});wrap.append(box,label);control.append(wrap);
      }else{state.accepted[i]=false;const note=document.createElement('div');note.className='row-feedback';note.textContent=check.reason;control.append(note);}
    });updateScore();
  }
  function updateScore(){ $('score').replaceChildren(document.createTextNode(String(state.accepted.filter(Boolean).length)));const max=document.createElement('span');max.textContent='/ 13';$('score').append(max); }
  $('answers').addEventListener('submit',e=>e.preventDefault());
  $('startButton').addEventListener('click',()=>start(challenge));
  $('finishButton').addEventListener('click',()=>finish());
  $('nextButton').addEventListener('click',()=>{history.replaceState(null,'',location.pathname+location.search);start();});
  $('homeButton').addEventListener('click',()=>{clearInterval(interval);state=null;save();document.body.classList.remove('paper');$('game').hidden=true;$('intro').hidden=false;$('shareFallback').hidden=true;$('startHint').textContent='De letter en categorieën verschijnen zodra je start.';announce('');history.replaceState(null,'',location.pathname+location.search);window.scrollTo({top:0,behavior:'instant'});$('startButton').focus({preventScroll:true});});
  $('fullscreenButton').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Volledig scherm is niet beschikbaar in deze browser. Je kunt ook de schermvullende stand van je browser gebruiken.');}});
  document.addEventListener('fullscreenchange',()=>{$('fullscreenButton').textContent=document.fullscreenElement?'Verlaat volledig scherm':'Volledig scherm';});
  $('rulesButton').addEventListener('click',()=>$('rulesDialog').showModal());
  $('closeRules').addEventListener('click',()=>$('rulesDialog').close());
  $('shareButton').addEventListener('click',async()=>{
    const url=new URL(location.href);url.hash=`v1-${state.code}`;
    try{if(!['http:','https:'].includes(url.protocol))throw new Error('Lokaal bestand');await navigator.clipboard.writeText(url.href);announce('Link gekopieerd. De ontvanger krijgt dezelfde letter en categorieën.');}
    catch{$('shareFallback').hidden=false;$('shareUrl').value=url.href;$('shareUrl').focus();$('shareUrl').select();announce(url.protocol==='file:'?'Dit is een lokaal bestand. Delen via een link werkt zodra het spel online staat.':'Kopieer de link uit het vakje.');}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('pageshow',tick);
  $('bankCount').textContent=`${core.categories.length} categorieën · eindeloos combineren`;
  if(challenge){$('startHint').textContent='Een gedeelde uitdaging: dezelfde letter en categorieën, jouw eigen timer.';}
  else if(location.hash){announce('Deze uitdagingslink is ongeldig. Je kunt wel een nieuwe ronde starten.');}
  try{
    const cached=JSON.parse(sessionStorage.getItem(storageKey));
    if(cached&&core.validCode(cached.code)&&(!challenge||cached.code===challenge)&&['playing','review'].includes(cached.phase)&&Array.isArray(cached.answers)&&cached.answers.length===13&&cached.answers.every(x=>typeof x==='string'&&x.length<=90)&&Array.isArray(cached.accepted)&&cached.accepted.length===13&&cached.accepted.every(x=>typeof x==='boolean')&&Number.isFinite(cached.deadline)&&Number.isFinite(cached.remaining)&&cached.remaining>=0&&cached.remaining<=120){
      state=cached;render();if(state.phase==='playing')interval=setInterval(tick,200);
    }
  }catch{}
})();
