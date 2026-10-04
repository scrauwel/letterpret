(() => {
  'use strict';
  const $=id=>document.getElementById(id), core=window.Letterpret, online=window.LetterpretOnline, storageKey='letterpret.v2';
  let state=null, interval=null, draft=null, preparing=null, visible=false, resume=false;
  let challenge=online.decodeRound(location.hash);
  let localStore=null;try{localStore=window.localStorage;}catch{}
  const enrichment=new online.Enricher(window.fetch.bind(window),localStore);
  let letterHistory={kids:[],older:[],last:''};
  try{const saved=JSON.parse(localStore?.getItem('letterpret.letters.v1'));if(saved&&Array.isArray(saved.kids)&&Array.isArray(saved.older))letterHistory=saved;}catch{}
  const levelName=level=>level==='kids'?'6–12 JAAR · MAKKELIJK':'13 JAAR EN OUDER';
  function rememberLetter(data){const level=data.level==='kids'?'kids':'older',pool=level==='kids'?online.easyLetters:core.letters;let used=letterHistory[level].filter(x=>pool.includes(x));if(used.includes(data.letter))used=[];letterHistory[level]=[...used,data.letter];letterHistory.last=data.letter;try{localStore?.setItem('letterpret.letters.v1',JSON.stringify(letterHistory));}catch{}}
  function updateLevel(){const kids=document.querySelector('input[name=level]:checked').value==='kids';$('onlineEnabled').disabled=kids;$('onlineEnabled').closest('label').hidden=kids;$('onlineInfo').hidden=kids;$('levelHint').textContent=kids?'Vertrouwde onderwerpen en makkelijke letters. Geen moeilijke internetcategorieën.':'Meer uitdaging, met optionele internetcategorieën.';}
  const announce=text=>{$('announcement').textContent=text;};
  const save=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{}};
  const round=()=>state.round;
  const format=seconds=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  function duration(id){const el=$(id), value=Number(el.value);el.setCustomValidity('');if(!online.validDuration(value)){el.setCustomValidity('Kies een geheel aantal seconden tussen 120 en 480.');el.reportValidity();return null;}return value;}
  function hideRound(){visible=false;clearInterval(interval);$('game').hidden=true;$('answers').replaceChildren();$('letter').textContent='?';$('sourceList').replaceChildren();$('ready').hidden=false;$('intro').hidden=true;document.body.classList.remove('paper');}
  async function prepare(){
    const seconds=duration('duration');if(seconds===null)return;
    preparing?.abort();const controller=new AbortController();preparing=controller;
    const mode=state?.mode||document.querySelector('input[name=mode]:checked').value;
    const level=state?.round.level||document.querySelector('input[name=level]:checked').value;
    const useInternet=level!=='kids'&&$('onlineEnabled').checked;
    state=null;save();resume=false;draft=null;hideRound();announce('');
    $('readyTitle').textContent='Dit is jullie letter.';$('beginButton').textContent='Play · start de klok';$('beginButton').disabled=true;$('readyLetter').textContent='…';
    $('readyHint').textContent='De 13 categorieën blijven verborgen tot je op Play klikt.';
    $('readyDuration').disabled=!!challenge;$('readyDuration').value=challenge?.duration||seconds;$('readyTime').textContent=format(Number($('readyDuration').value));
    $('sourceStatus').textContent=challenge?'Gedeelde uitdaging klaarzetten…':useInternet?'Nieuwe categorieën zoeken op Wikipedia…':'Ronde klaarzetten uit de vaste voorraad…';
    let report=null;
    if(!challenge&&useInternet){const timeout=setTimeout(()=>controller.abort(),10000);report=await enrichment.refresh(controller.signal);clearTimeout(timeout);}
    if(preparing!==controller)return;
    const data=challenge||online.makeEnrichedRound(useInternet?enrichment.entries:[],seconds,report?.fresh||[],{level,usedLetters:letterHistory[level],lastLetter:letterHistory.last});
    rememberLetter(data);$('readyLetter').textContent=data.letter;$('readyLevel').textContent=levelName(data.level);
    draft={round:data,mode};challenge=null;
    const count=data.categories.filter(x=>x.source).length;
    $('sourceStatus').textContent=report?(report.successes?`${count} internetcategorieën in deze ronde · ${enrichment.entries.length} bewaard. Categorieën blijven verborgen tot Play.`:`Internet niet bereikbaar. Deze ronde gebruikt ${count} bewaarde internetcategorieën en de vaste voorraad.`):count?'Gedeelde categorieën staan klaar. De speeltijd hoort bij de uitdaging.':'13 categorieën staan klaar. De klok loopt nog niet.';
    $('bankCount').textContent=`${core.categories.length} vaste + ${enrichment.entries.length} bewaarde internetcategorieën`;
    $('beginButton').disabled=false;preparing=null;
    window.scrollTo({top:0,behavior:'instant'});$('beginButton').focus({preventScroll:true});
  }
  function countFilled(){$('filled').textContent=`${state.answers.filter(x=>x.trim()).length} / 13`;}
  function showGame(){ visible=true;$('ready').hidden=true;$('intro').hidden=true;$('game').hidden=false; }
  function render(){
    const r=round();showGame();const paper=state.mode==='paper';document.body.classList.toggle('paper',paper);$('letter').textContent=r.letter;$('roundCode').textContent=`RONDE ${r.code}`;
    $('roundLabel').textContent=levelName(r.level);$('pauseButton').hidden=state.phase!=='playing';
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
    countFilled();if(state.phase==='review'){renderReview();renderSources();}tick();
  }
  function start(){
    if(!draft||preparing)return;
    const seconds=duration('readyDuration');if(seconds===null)return;
    clearInterval(interval);
    $('shareFallback').hidden=true;
    if(!resume)state={round:{...draft.round,duration:seconds},mode:draft.mode,phase:'playing',answers:Array(13).fill(''),accepted:Array(13).fill(false),deadline:Date.now()+seconds*1000,remaining:seconds};
    else if(state.phase==='paused')state=online.resumeClock(state,Date.now());
    const wasResume=resume;resume=false;draft=null;save();announce(wasResume?'Ronde hervat. De klok loopt verder.':`De ronde is gestart. Speeltijd: ${state.round.duration} seconden.`);render();
    if(state.phase==='playing')interval=setInterval(tick,200);window.scrollTo({top:0,behavior:'instant'});if(state.mode!=='paper'&&state.phase==='playing')$('answer-0').focus({preventScroll:true});
  }
  function tick(){
    if(!state||!visible)return;
    const remaining=state.phase==='playing'?Math.max(0,Math.ceil((state.deadline-Date.now())/1000)):state.remaining;
    $('timer').textContent=format(remaining);
    $('timeFill').style.width=`${remaining/state.round.duration*100}%`;
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
  function showPaused(){
    hideRound();draft={round:state.round,mode:state.mode};resume=true;
    $('readyTitle').textContent='Even pauze.';$('readyLetter').textContent=state.round.letter;$('readyLevel').textContent=levelName(state.round.level);
    $('readyHint').textContent='De klok staat stil. De categorieën en antwoorden blijven verborgen tot je op Play klikt.';
    $('readyDuration').value=state.round.duration;$('readyDuration').disabled=true;$('readyTime').textContent=format(state.remaining);
    $('sourceStatus').textContent=`Nog ${state.remaining} seconden speeltijd. Je antwoorden zijn bewaard.`;
    $('beginButton').textContent='Play · hervatten';$('beginButton').disabled=false;$('beginButton').focus({preventScroll:true});
  }
  function pause(){if(!state||state.phase!=='playing')return;if(Date.now()>=state.deadline){finish(true);return;}state=online.pauseClock(state,Date.now());save();showPaused();announce('Gepauzeerd. De klok staat stil.');}
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
  function renderSources(){const sources=round().categories.filter(x=>x.source);$('sourceDetails').hidden=!sources.length;$('sourceDetails').open=false;$('sourceList').replaceChildren();for(const category of sources){const li=document.createElement('li'),a=document.createElement('a');a.textContent=category.name;a.href='https://nl.wikipedia.org/wiki/'+encodeURIComponent('Categorie:'+category.source);a.target='_blank';a.rel='noopener noreferrer';li.append(a);$('sourceList').append(li);}}
  function home(){preparing?.abort();preparing=null;clearInterval(interval);visible=false;draft=null;state=null;resume=false;challenge=null;save();document.body.classList.remove('paper');$('game').hidden=true;$('ready').hidden=true;$('intro').hidden=false;$('answers').replaceChildren();$('shareFallback').hidden=true;$('startHint').textContent='Je ziet eerst de letter. De categorieën verschijnen pas bij Play.';announce('');history.replaceState(null,'',location.pathname+location.search);window.scrollTo({top:0,behavior:'instant'});$('startButton').focus({preventScroll:true});}
  $('answers').addEventListener('submit',e=>e.preventDefault());
  $('startButton').addEventListener('click',prepare);
  $('beginButton').addEventListener('click',start);
  $('pauseButton').addEventListener('click',pause);
  document.querySelectorAll('input[name=level]').forEach(input=>input.addEventListener('change',updateLevel));
  $('durationRange').addEventListener('input',()=>$('duration').value=$('durationRange').value);
  $('duration').addEventListener('input',()=>{if(online.validDuration(Number($('duration').value)))$('durationRange').value=$('duration').value;});
  $('readyDuration').addEventListener('input',()=>{$('readyTime').textContent=online.validDuration(Number($('readyDuration').value))?format(Number($('readyDuration').value)):'120–480 sec.';});
  $('finishButton').addEventListener('click',()=>finish());
  $('nextButton').addEventListener('click',()=>{$('duration').value=state.round.duration;history.replaceState(null,'',location.pathname+location.search);prepare();});
  $('homeButton').addEventListener('click',home);$('readyBack').addEventListener('click',home);
  const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{announce('Volledig scherm is niet beschikbaar in deze browser. Je kunt ook de schermvullende stand van je browser gebruiken.');}};
  $('fullscreenButton').addEventListener('click',fullscreen);$('readyFullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>{for(const id of ['fullscreenButton','readyFullscreen'])$(id).textContent=document.fullscreenElement?'Verlaat volledig scherm':'Volledig scherm';});
  $('rulesButton').addEventListener('click',()=>$('rulesDialog').showModal());
  $('closeRules').addEventListener('click',()=>$('rulesDialog').close());
  $('shareButton').addEventListener('click',async()=>{
    const url=new URL(location.href);url.hash=online.encodeRound(state.round);
    $('shareFallback').hidden=false;$('shareUrl').value=url.href;
    try{if(!['http:','https:'].includes(url.protocol))throw new Error('Lokaal bestand');await navigator.clipboard.writeText(url.href);announce('Link gekopieerd. De ontvanger krijgt dezelfde letter en categorieën.');}
    catch{$('shareFallback').hidden=false;$('shareUrl').value=url.href;$('shareUrl').focus();$('shareUrl').select();announce(url.protocol==='file:'?'Dit is een lokaal bestand. Delen via een link werkt zodra het spel online staat.':'Kopieer de link uit het vakje.');}
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  window.addEventListener('pageshow',tick);
  $('bankCount').textContent=`${core.categories.length} vaste + ${enrichment.entries.length} bewaarde internetcategorieën`;
  if(challenge){$('duration').value=challenge.duration;$('durationRange').value=challenge.duration;$('startHint').textContent='Gedeelde uitdaging: dezelfde letter, categorieën en tijd. Start zelf de klok.';}
  else if(location.hash){announce('Deze uitdagingslink is ongeldig. Je kunt wel een nieuwe ronde starten.');}
  try{
    const cached=JSON.parse(sessionStorage.getItem(storageKey));
    if(!challenge&&cached&&online.validRound(cached.round)&&['playing','paused'].includes(cached.phase)&&(cached.phase!=='paused'||(Number.isFinite(cached.remainingMs)&&cached.remainingMs>0&&cached.remainingMs<=cached.round.duration*1000))&&['digital','paper'].includes(cached.mode)&&Array.isArray(cached.answers)&&cached.answers.length===13&&cached.answers.every(x=>typeof x==='string'&&x.length<=90)&&Array.isArray(cached.accepted)&&cached.accepted.length===13&&cached.accepted.every(x=>typeof x==='boolean')&&Number.isFinite(cached.deadline)&&Number.isFinite(cached.remaining)&&cached.remaining>=0&&cached.remaining<=cached.round.duration){
      state=cached;draft={round:cached.round,mode:cached.mode};resume=true;
      if(cached.phase==='paused')showPaused();
      else{hideRound();$('readyLetter').textContent=cached.round.letter;$('readyLevel').textContent=levelName(cached.round.level);$('readyTitle').textContent='Je ronde staat verborgen.';$('readyHint').textContent='Klik op Play om je categorieën en antwoorden weer te tonen.';$('beginButton').textContent='Play · hervatten';$('beginButton').disabled=false;$('readyDuration').value=cached.round.duration;$('readyDuration').disabled=true;$('readyTime').textContent=format(cached.round.duration);$('sourceStatus').textContent='Je eerdere timer loopt door. Play toont je ronde weer. Gebruik tijdens het spel Pauze om de klok stil te zetten.';}
    }
  }catch{}
  updateLevel();
})();
