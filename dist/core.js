(function(root){
  'use strict';
  // Version 1: keep order stable so shared round codes remain reproducible.
  const categories = [
    'Een dier','Een beroep','Een stad','Een land','Een voornaam','Iets om te eten','Iets om te drinken','Een plant of bloem','Een sport','Een kledingstuk','Iets in de keuken','Een vervoermiddel','Een bekend persoon',
    'Een fruitsoort','Een groente','Een dessert','Iets op de boterham','Een gerecht','Een ingrediënt','Iets bij de bakker','Een kruid of specerij','Een snack','Iets op een menukaart','Iets bij het ontbijt','Iets in de koelkast','Iets op een barbecue',
    'Een vogel','Een zoogdier','Een insect','Iets in de zee','Iets in het bos','Iets in de tuin','Een boom','Iets op de boerderij','Iets in de natuur','Iets dat vliegt','Iets dat zwemt','Een huisdier','Iets met poten',
    'Een meubel','Iets in de badkamer','Iets in de slaapkamer','Iets in de woonkamer','Een huishoudtoestel','Iets in de garage','Een stuk gereedschap','Iets om schoon te maken','Iets aan de muur','Iets op zolder','Iets in een lade','Iets van glas','Iets van hout',
    'Een film','Een tv-programma','Een boek','Een zanger of zangeres','Een muziekgroep','Een muziekinstrument','Een liedjestitel','Een stripfiguur','Een sprookjesfiguur','Een acteur of actrice','Een spel','Een hobby','Iets in een museum',
    'Iets in je schooltas','Een schoolvak','Iets op kantoor','Iets op een bureau','Iets dat je kunt leren','Iets dat je kunt schrijven','Een taal','Een app of website','Een merk','Een winkel','Iets in de supermarkt','Iets in een winkelstraat','Een cadeau',
    'Een lichaamsdeel','Een gevoel','Een karaktereigenschap','Iets waar je bang voor bent','Iets dat je blij maakt','Iets dat lawaai maakt','Iets dat lekker ruikt','Iets dat stinkt','Iets dat zacht is','Iets dat hard is','Iets dat rond is','Iets dat rood is','Iets dat groen is',
    'Iets dat geel is','Iets dat koud is','Iets dat warm is','Iets dat duur is','Iets dat je verzamelt','Iets dat je kunt verliezen','Iets dat je kunt openen','Iets dat je kunt breken','Iets dat je kunt dragen','Iets dat je kunt huren','Iets dat je kunt vouwen','Iets met een knop','Iets met wielen',
    'Een vakantiebestemming','Iets in je koffer','Iets op het strand','Iets op een camping','Iets in een hotel','Iets op een luchthaven','Iets op een station','Iets in het verkeer','Iets op een kaart','Een bezienswaardigheid','Een rivier','Een eiland','Iets in de bergen',
    'Iets op een feestje','Iets op een trouwfeest','Iets met Kerstmis','Iets in een pretpark','Iets in een speeltuin','Iets op de kermis','Iets in een sporthal','Iets in een zwembad','Iets op een voetbalveld','Iets bij de dokter','Iets bij de kapper','Iets in een restaurant','Iets in een theater',
    'Een werkwoord','Een bijvoeglijk naamwoord','Een woord van vijf letters','Een woord van zes letters','Iets dat je elke dag gebruikt','Iets dat licht geeft','Iets dat stroom nodig heeft','Iets dat kan smelten','Iets dat kan groeien','Iets dat kan rollen','Iets dat je moet opladen','Iets dat je op slot doet','Iets dat je in je zak steekt'
  ];
  const letters = 'ABCDEFGHIJKLMNOPRSTUVWZ';
  function randomCode(){const n=new Uint32Array(1);root.crypto.getRandomValues(n);return n[0].toString(36).toUpperCase().padStart(7,'0');}
  function validCode(code){return typeof code==='string' && /^[0-9A-Z]{7}$/.test(code) && parseInt(code,36)<=0xffffffff;}
  function makeRound(code){
    if(!validCode(code)) throw new Error('Ongeldige rondecode');
    let a=parseInt(code,36)>>>0;
    const random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
    const letter=letters[Math.floor(random()*letters.length)];
    const pool=categories.map((name,id)=>({name,id}));
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
    return {code,letter,categories:pool.slice(0,13)};
  }
  function normalize(value){return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleUpperCase('nl-NL').replace(/\s+/g,' ');}
  function inspect(answers,letter){const seen=new Set();return answers.map(value=>{const word=normalize(value);if(!word)return {eligible:false,reason:'Geen antwoord'};if(!word.startsWith(letter))return {eligible:false,reason:`Begint niet met ${letter}`};if(seen.has(word))return {eligible:false,reason:'Dit woord is al gebruikt'};seen.add(word);return {eligible:true,reason:''};});}
  root.Letterpret={categories,letters,randomCode,validCode,makeRound,normalize,inspect};
})(typeof window!=='undefined'?window:globalThis);
