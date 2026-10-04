(function(root){
  'use strict';
  const core=root.Letterpret;
  const seeds=['Belgisch acteur','Nederlands acteur','Amerikaans acteur','Belgisch schrijver','Nederlands schrijver','Nederlands zanger','Belgisch zanger','Britse band','Amerikaanse band','Gerecht','Franse kaas','Italiaanse keuken','Fruit','Groente','Muziekinstrument','Sport','Beroep','Hondenras','Kattenras','Vogel','Zoogdier','Boom (plant)','Bloemplant','Rivier in België','Rivier in Nederland','Stad in Frankrijk','Stad in Duitsland','Eiland','Film naar genre','Stripreeks','Gezelschapsspel','Automerk','Kleding'];
  const blocked=/[\d<>:{}\[\]\n]|wikipedia|wikimedia|sjabloon|onderhoud|doorverwijz|artikel|pagina|afbeelding|geboren|overleden|eeuw|seizoen|porn|seks|oorlog|misdaad|moord|terror|nazi|verkrach|folter|zelfmoord|drug|ziekte|aandoening/i;
  const topics=/acteur|actrice|schrijver|dichter|zanger|zangeres|band\b|muziek|componist|gerecht|keuken|kaas|fruit|groente|sport|beroep|hond|katten|vogel|zoogdier|boom|plant|bloem|rivier|stad|plaats|eiland|film|strip|spel|auto|kleding|dans|voed|brood|gebak|dessert|vis\b|museum|bouwwerk|gebergte|meer\b|fiets|schilder|kunstenaar/i;
  const validTopic=name=>typeof name==='string'&&name.length>=3&&name.length<=60&&!blocked.test(name)&&topics.test(name);
  const playable=name=>validTopic(name)&&!(/\bnaar\b|\blijst|\boverzicht|\bgeschiedenis|\bcultuur/i.test(name));
  const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){const values=new Uint32Array(1);root.crypto.getRandomValues(values);const j=values[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
  function parseCategory(name,data){
    const members=data?.query?.categorymembers;
    if(!Array.isArray(members))throw new Error('Geen geldige categoriegegevens');
    const discovered=members.filter(x=>x.ns===14&&typeof x.title==='string').map(x=>x.title.replace(/^Categorie:/,'')).filter(validTopic);
    const counts={};
    const pages=members.filter(x=>x.ns===0&&typeof x.title==='string'&&!blocked.test(x.title));
    for(const p of pages){const letter=core.normalize(p.title)[0];if(core.letters.includes(letter))counts[letter]=(counts[letter]||0)+1;}
    const letters=Object.keys(counts).filter(x=>counts[x]>=2).join('');
    const entry=playable(name)&&pages.length>=10&&letters.length>=3?{name,source:name,letters}:null;
    return {discovered,entry};
  }
  class Enricher{
    constructor(fetcher=root.fetch.bind(root),storage=root.localStorage){
      this.fetcher=fetcher;this.storage=storage;this.entries=[];this.frontier=[...seeds];this.visited={};
      try{const data=JSON.parse(storage?.getItem('letterpret.online.v1'));if(data){this.entries=(data.entries||[]).filter(x=>playable(x.name)&&x.source===x.name&&typeof x.letters==='string'&&/^[A-Z]+$/.test(x.letters)).slice(-2000);this.frontier=[...new Set([...seeds,...(data.frontier||[]).filter(validTopic)])].slice(-4000);this.visited=Object.fromEntries(Object.entries(data.visited||{}).filter(([k,v])=>validTopic(k)&&Number.isFinite(v)).slice(-4000));}}catch{}
    }
    async refresh(signal){
      const unseen=shuffle(this.frontier.filter(x=>!this.visited[x]));
      const selection=unseen.slice(0,6);
      if(selection.length<6)selection.push(...shuffle(this.frontier.filter(x=>!selection.includes(x))).sort((a,b)=>(this.visited[a]||0)-(this.visited[b]||0)).slice(0,6-selection.length));
      let successes=0;const fresh=[];
      await Promise.allSettled(selection.map(async name=>{
        const url=new URL('https://nl.wikipedia.org/w/api.php');
        url.search=new URLSearchParams({action:'query',format:'json',origin:'*',list:'categorymembers',cmtitle:`Categorie:${name}`,cmtype:'page|subcat',cmlimit:'500'});
        const response=await this.fetcher(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
        if(!response.ok)throw new Error('Bron niet beschikbaar');
        const parsed=parseCategory(name,await response.json());
        successes++;this.visited[name]=Date.now();this.frontier=[...new Set([...this.frontier,...parsed.discovered])].slice(-4000);
        if(parsed.entry){this.entries=this.entries.filter(x=>x.name!==name);this.entries.push(parsed.entry);fresh.push(parsed.entry);}
      }));
      this.entries=this.entries.slice(-2000);
      try{this.storage?.setItem('letterpret.online.v1',JSON.stringify({entries:this.entries,frontier:this.frontier,visited:this.visited}));}catch{}
      return {successes,fresh,entries:this.entries};
    }
  }
  const easyCategories=['Een dier','Een voornaam','Iets om te eten','Iets om te drinken','Een kledingstuk','Iets in de keuken','Een vervoermiddel','Een fruitsoort','Een groente','Een dessert','Iets op de boterham','Een gerecht','Een snack','Iets bij het ontbijt','Iets in de koelkast','Een vogel','Iets in de zee','Iets in het bos','Iets in de tuin','Iets op de boerderij','Iets dat vliegt','Iets dat zwemt','Een huisdier','Iets met poten','Een meubel','Iets in de badkamer','Iets in de slaapkamer','Iets in de woonkamer','Een spel','Een hobby','Iets in je schooltas','Iets in de supermarkt','Een cadeau','Een lichaamsdeel','Iets dat je blij maakt','Iets dat lawaai maakt','Iets dat lekker ruikt','Iets dat zacht is','Iets dat hard is','Iets dat rond is','Iets dat rood is','Iets dat groen is','Iets dat geel is','Iets dat koud is','Iets dat warm is','Iets met wielen','Iets op het strand','Iets in een speeltuin','Iets op een feestje','Iets dat je kunt dragen'];
  const easyLetters='ABDEGKLMNPRSTV';
  function remainingLetters(level,used=[],last=''){
    const pool=(level==='kids'?easyLetters:core.letters).split('');
    const remaining=pool.filter(x=>!used.includes(x)&&x!==last);
    return remaining.length?remaining:pool.filter(x=>x!==last);
  }
  function pauseClock(state,now){const ms=Math.max(0,state.deadline-now);return {...state,phase:ms?'paused':'review',remainingMs:ms,remaining:Math.ceil(ms/1000)};}
  function resumeClock(state,now){return {...state,phase:'playing',deadline:now+state.remainingMs};}
  function makeEnrichedRound(entries,duration,fresh=[],settings={}){
    const code=core.randomCode(), base=core.makeRound(code);
    const level=settings.level==='kids'?'kids':'older';
    if(level==='kids'){entries=[];fresh=[];}
    const available=remainingLetters(level,settings.usedLetters,settings.lastLetter);
    const options=available.filter(letter=>entries.filter(x=>x.letters.includes(letter)).length>=3);
    const letter=shuffle(options.length?options:available)[0];
    const pool=shuffle(entries.filter(x=>x.letters.includes(letter)));
    const preferred=shuffle(fresh.filter(x=>x.letters.includes(letter)));
    const online=[...new Map([...preferred,...pool].map(x=>[x.name,x])).values()].slice(0,8).map(x=>({name:x.name,source:x.source}));
    const key=name=>core.normalize(name).replace(/^(EEN|HET|DE) /,'');
    const used=new Set(online.map(x=>key(x.name)));
    const bank=level==='kids'?shuffle(easyCategories.map(name=>({name}))):[...base.categories,...shuffle(core.categories.map(name=>({name})))];
    const local=bank.filter(x=>{const k=key(x.name);if(used.has(k))return false;used.add(k);return true;}).slice(0,13-online.length).map(x=>({name:x.name}));
    const categories=shuffle([...online,...local]);
    return {code,letter,duration,categories,level};
  }
  function validDuration(value){return Number.isInteger(value)&&value>=120&&value<=480;}
  function validRound(r){return r&&core.validCode(r.code)&&typeof r.letter==='string'&&r.letter.length===1&&core.letters.includes(r.letter)&&validDuration(r.duration)&&Array.isArray(r.categories)&&r.categories.length===13&&r.categories.every(x=>x&&typeof x.name==='string'&&x.name.length>0&&x.name.length<=100&&!/[<>\x00-\x1f]/.test(x.name)&&(!x.source||(typeof x.source==='string'&&validTopic(x.source))))&&new Set(r.categories.map(x=>core.normalize(x.name))).size===13;}
  function encodeRound(round){if(!validRound(round))throw new Error('Ongeldige ronde');return '#v2-'+btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(round)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decodeRound(hash){
    try{if(hash.length>14000)return null;if(/^#v1-[0-9A-Z]{7}$/.test(hash)){const r=core.makeRound(hash.slice(4));return {...r,duration:120,categories:r.categories.map(x=>({name:x.name}))};}
      if(!/^#v2-[A-Za-z0-9_-]+$/.test(hash))return null;
      const r=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(hash.slice(4).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));return validRound(r)?r:null;
    }catch{return null;}
  }
  root.LetterpretOnline={Enricher,parseCategory,validTopic,validDuration,validRound,makeEnrichedRound,encodeRound,decodeRound,easyCategories,easyLetters,remainingLetters,pauseClock,resumeClock};
})(typeof window!=='undefined'?window:globalThis);
