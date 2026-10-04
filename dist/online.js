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
  const creativeKids=["Iets dat een draak zou eten","Een cadeau voor een reus","Iets in de rugzak van een piraat","Iets dat een robot niet begrijpt","Een huisdier voor een heks","Iets dat je meeneemt naar de maan","Een schuilplek tijdens verstoppertje","Iets waarmee je een hut bouwt","Iets dat je met modder kunt maken","Iets dat je in een schatkist stopt","Iets dat je op een onbewoond eiland zoekt","Iets dat je met een vergrootglas bekijkt","Iets dat je onder je bed kunt vinden","Iets dat je kwijt bent vlak voor school","Iets dat niet in een brooddoos hoort","Iets dat je liever niet in je schoen vindt","Iets dat je in een sneeuwpop steekt","Iets waarmee je een monster laat lachen","Een naam voor een pratende kat","Een naam voor een knuffel","Iets dat je zou tekenen op een vlag","Iets dat je uit klei kunt maken","Iets dat je met je ogen dicht herkent","Iets dat je in het donker hoort","Iets dat kraakt","Iets dat plakt","Iets dat stuitert","Iets dat smelt","Iets dat drijft","Iets dat schittert","Iets dat kietelt","Iets dat stinkt","Iets dat piept","Iets met strepen","Iets met stippen","Iets met een deksel","Iets met een staart","Iets met knoppen","Iets dat groter is dan jij","Iets dat kleiner is dan je duim","Iets dat je met twee handen draagt","Iets dat in je broekzak past","Iets dat je kunt stapelen","Iets dat je kunt oprollen","Iets dat je kunt opblazen","Iets dat je kunt vouwen","Iets dat je deelt met een vriend","Iets dat je doet op een regendag","Iets dat je doet als je niet kunt slapen","Iets dat je kunt nadoen","Iets waarmee je muziek maakt","Iets waarmee je water schept","Iets dat je in een zandkasteel gebruikt","Iets dat je op een picknick legt","Iets dat je bij een kampvuur doet","Iets dat je op een kinderfeestje speelt","Iets dat je op een verkleedfeest draagt","Iets dat je op een taart zet","Iets dat je in een toverdrank gooit","Iets dat je in een droom kunt tegenkomen","Iets dat je met een toverstaf zou veranderen","Iets dat je zou doen als je kon vliegen","Iets dat je zou doen als je heel klein was","Iets dat je in een boomhut wilt","Iets dat je op een springkasteel niet meeneemt","Iets dat je aan een sneeuwman cadeau geeft","Iets dat een dier zou bestellen op restaurant","Iets dat je met een emmer kunt doen","Iets dat je uit een doos kunt bouwen","Iets dat je aan een ballon kunt hangen","Iets dat je op een stoep kunt tekenen","Iets dat je in een poppenhuis zet","Iets dat een superheld nodig heeft","Iets dat je in een speelgoedwinkel zou kiezen","Iets dat je aan een beer zou vragen","Iets dat je op een regenboog zou willen zien","Iets dat je blij maakt na een slechte dag","Iets dat je iemand kunt leren","Iets dat je samen beter kunt doen","Iets dat je zonder woorden kunt uitbeelden"];
  const creativeOlder=["Een slechte schuilplaats voor een olifant","Een nutteloze superkracht","Een excuus om een vergadering te verlaten","Iets dat een tijdreiziger niet begrijpt","Een beroerd cadeau voor je baas","Een onverwachte inhoud van een koffer","Iets dat je niet in een lift wilt horen","Een rare reden om te laat te komen","Een onhandige plek voor een eerste date","Een uitvinding die niemand nodig heeft","Een taak die je aan een robot zou geven","Een nieuwe regel voor op kantoor","Een slechte naam voor een restaurant","Een vreemde naam voor een parfum","Een product dat je niet tweedehands wilt","Iets waarvoor je spontaan zou omrijden","Iets dat duurder klinkt dan het is","Iets dat je liever huurt dan koopt","Iets dat altijd net op is","Iets dat verdwijnt zodra je het nodig hebt","Iets dat niemand graag schoonmaakt","Iets dat je stiekem googelt","Iets dat je vakantie kan verpesten","Iets dat je op een rommelmarkt hoopt te vinden","Iets dat je in een tijdcapsule stopt","Iets dat je van vroeger terug wilt","Iets dat je nooit uitleent","Iets dat je onnodig bewaart","Iets dat je uitstelt tot morgen","Iets dat je alleen op vakantie doet","Iets dat een alien als souvenir koopt","Een baan voor een vampier","Een hobby voor een zeemeermin","Een klacht van een kabouter","Iets op het boodschappenlijstje van een spook","Een angst van een superheld","Een luxeprobleem van een koning","Een reden waarom een robot ontslag neemt","Een verboden voorwerp op een ruimteschip","Een attractie in een pretpark voor monsters","Een slechte plek om te kamperen","Iets dat niet thuishoort in een sauna","Iets dat je niet door de microfoon wilt zeggen","Iets dat een stille treinrit verstoort","Iets dat je niet in een hotelkamer verwacht","Iets dat een museum bewaker liever niet ziet","Iets dat je niet met witte kleren doet","Iets dat op een trouwfeest mis kan gaan","Iets dat je niet wilt horen bij de kapper","Iets dat een familiefoto verpest","Een onwaarschijnlijke olympische sport","Een wedstrijd waarin jij zou kunnen winnen","Een regel voor een land dat jij bestuurt","Een titel voor je eigen levensverhaal","Een onderwerp voor een absurde documentaire","Een rampzalig thema voor een kinderfeest","Een onverwachte vulling voor een praline","Een smaak die je niet in tandpasta wilt","Een vreemd ingrediënt voor een smoothie","Een slechte vervanger voor een hoofdkussen","Iets dat je als trofee zou gebruiken","Iets dat je als deurstop kunt gebruiken","Iets dat je in een noodpakket stopt","Iets dat je tegen verveling doet","Iets dat je helpt bij een stroompanne","Iets waarvoor je een handleiding nodig hebt","Iets dat makkelijker lijkt dan het is","Iets dat je beter niet haastig doet","Iets dat veel geduld vraagt","Iets dat met de jaren beter wordt","Iets dat je humeur onmiddellijk verbetert","Iets dat je buren kunnen horen","Iets dat je liever niet deelt met je buren","Iets dat een groepschat doet ontploffen","Iets dat je op een festival kwijtraakt","Iets dat je tijdens een verhuis terugvindt","Iets dat je heimwee geeft","Iets dat je aan je jeugd doet denken","Iets dat je als kind verkeerd begreep","Iets dat je nog zonder internet kunt","Een reden om je telefoon uit te zetten","Een slechte wifi-naam voor een hotel","Een vreemde melding op je smartwatch","Een app die nog uitgevonden moet worden","Iets dat je printer op het slechtste moment doet","Een overdreven belofte in reclame","Een product voor een onmogelijke reclamespot","Een slogan voor een luie superheld","Een absurde klacht bij de klantendienst","Een onhandige mascotte voor een sportclub","Iets dat in een geheime kelder ligt","Een aanwijzing in een detectiveverhaal","Iets dat een slechterik in zijn tas heeft","Een reden waarom een piraat met pensioen gaat","Een reisbestemming voor iemand die alles al zag","Iets dat je zou ruilen voor een vrije dag","Iets dat je doet met een miljoen euro","Iets dat je redt uit een zinkende boot","Een geluid dat je niet als wekker wilt","Een geur die je terugbrengt naar een plek","Iets dat onverwacht romantisch is","Iets dat je niet op je cv zet","Een talent dat op geen enkel diploma staat","Iets waarvoor je een applaus verdient","Een kleine overwinning op een moeilijke dag","Iets dat een etentje gezelliger maakt","Een vraag die je aan je toekomstige zelf stelt","Een raad die je aan je jongere zelf geeft","Iets dat je zou verbieden op maandagochtend","Iets dat je doet als niemand kijkt","Iets dat je niet aan een papegaai wilt leren","Een voorwerp met een verrassend tweede leven","Een reden om midden in de nacht op te staan","Iets dat je op een verlaten station niet wilt vinden","Een vreemde opdracht voor een butler","Een slechte plek om je wachtwoord te bewaren","Iets dat je op een onbewoond eiland zou missen","Iets dat leuker is zonder planning","Iets dat je nooit tijdens een videogesprek wilt zien","Iets dat je met een lege hangar zou doen"];
  const kidsBank=[...easyCategories,...creativeKids];
  const easyLetters='ABDEGKLMNPRSTV';
  function remainingLetters(level,used=[],last=''){
    const pool=(level==='kids'?easyLetters:core.letters).split('');
    const remaining=pool.filter(x=>!used.includes(x)&&x!==last);
    return remaining.length?remaining:pool.filter(x=>x!==last);
  }
  function pauseClock(state,now){const ms=Math.max(0,state.deadline-now);return {...state,phase:ms?'paused':'review',remainingMs:ms,remaining:Math.ceil(ms/1000)};}
  function resumeClock(state,now){return {...state,phase:'playing',deadline:now+state.remainingMs};}
  function makeEnrichedRound(entries,duration,fresh=[],settings={}){
    const code=core.randomCode();
    const level=settings.level==='kids'?'kids':'older';
    if(level==='kids'){entries=[];fresh=[];}
    const available=remainingLetters(level,settings.usedLetters,settings.lastLetter);
    const options=available.filter(letter=>entries.filter(x=>x.letters.includes(letter)).length>=3);
    const letter=shuffle(options.length?options:available)[0];
    const key=name=>core.normalize(name).replace(/^(EEN|HET|DE) /,'');
    const recent=new Set((settings.recentCategories||[]).map(key));
    const used=new Set(),selected=[];
    const take=(items,count,allowRecent=false)=>{
      let added=0;
      for(const item of items){const k=key(item.name);if(added>=count)break;if(used.has(k)||(!allowRecent&&recent.has(k)))continue;used.add(k);selected.push(item);added++;}
    };
    const creative=shuffle((level==='kids'?creativeKids:creativeOlder).map(name=>({name})));
    const classic=shuffle((level==='kids'?easyCategories:core.categories).map(name=>({name})));
    const sources=[...new Map([...shuffle(fresh),...shuffle(entries)].filter(x=>x.letters.includes(letter)).map(x=>[key(x.name),{name:x.name,source:x.source}])).values()];
    // Original prompts dominate every round; recent rounds are skipped before any fallback.
    take(creative,8);
    take(sources,3);
    take(creative,11-selected.length);
    take(classic,13-selected.length);
    take([...creative,...classic],13-selected.length);
    take([...creative,...classic],13-selected.length,true);
    const categories=shuffle(selected);
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
  root.LetterpretOnline={Enricher,parseCategory,validTopic,validDuration,validRound,makeEnrichedRound,encodeRound,decodeRound,easyCategories,kidsBank,creativeKids,creativeOlder,easyLetters,remainingLetters,pauseClock,resumeClock};
})(typeof window!=='undefined'?window:globalThis);
