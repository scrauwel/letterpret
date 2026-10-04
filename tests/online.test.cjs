const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../dist/core.js');require('../dist/online.js');
const online=globalThis.LetterpretOnline;
const members=['Anna','Arno','Anke','Bram','Bart','Ben','Carla','Celine','Chris','Daan','Dora','Doris'].map(title=>({ns:0,title}));
test('Tijdsgrenzen zijn inclusief en vereisen gehele seconden',()=>{
  for(const n of [120,121,240,479,480])assert.equal(online.validDuration(n),true);
  for(const n of [0,119,481,120.5,NaN,Infinity,'120'])assert.equal(online.validDuration(n),false);
});
test('Internetonderwerpen moeten speelbaar zijn en voldoende voorbeelden hebben',()=>{
  const parsed=online.parseCategory('Belgisch acteur',{query:{categorymembers:[...members,{ns:14,title:'Categorie:Nederlands acteur'},{ns:14,title:'Categorie:Wikipedia:Onderhoud'}]}});
  assert.deepEqual(parsed.discovered,['Nederlands acteur']);assert.equal(parsed.entry.letters,'ABCD');
  assert.equal(online.parseCategory('Belgisch acteur',{query:{categorymembers:members.slice(0,2)}}).entry,null);
  assert.equal(online.validTopic('<script>alert(1)</script>'),false);
  assert.equal(online.validTopic('Film uit 2024'),false);
});
test('V2-deellink bewaart exact categorieën, bronnen, accenten en speeltijd',()=>{
  const r=online.makeEnrichedRound([{name:'Franse kaas',source:'Franse kaas',letters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}],480);
  assert.deepEqual(online.decodeRound(online.encodeRound(r)),r);
  assert.equal(r.categories.length,13);assert.ok(r.categories.some(c=>c.source==='Franse kaas'));
  assert.equal(online.decodeRound('#v1-00HELLO').duration,120);
  assert.equal(online.decodeRound('#v2-invalid'),null);
});
test('Online categorieën worden alleen gekozen voor ondersteunde letters',()=>{
  const bank=['Franse kaas','Belgisch acteur','Nederlands acteur'].map(name=>({name,source:name,letters:'A'}));
  for(let i=0;i<50;i++){const r=online.makeEnrichedRound(bank,120);assert.equal(r.letter,'A');assert.equal(r.categories.filter(c=>c.source).length,3);assert.ok(online.validRound(r));}
});
test('Ophalen ontdekt nieuwe categorieën en bewaart ze lokaal',async()=>{
  const data={};const storage={getItem:k=>data[k],setItem:(k,v)=>data[k]=v};
  const e=new online.Enricher(async()=>({ok:true,json:async()=>({query:{categorymembers:[...members,{ns:14,title:'Categorie:Iers acteur'}]}})}),storage);
  e.frontier=['Belgisch acteur'];const report=await e.refresh(new AbortController().signal);
  assert.equal(report.successes,1);assert.ok(e.frontier.includes('Iers acteur'));assert.equal(e.entries.length,1);
  assert.equal(new online.Enricher(async()=>{},storage).entries.length,1);
});
test('Netwerkfout of geweigerde opslag laat de basisronde werken',async()=>{
  const e=new online.Enricher(async()=>{throw new Error('Offline');},{getItem(){throw new Error('Storage blocked');},setItem(){throw new Error('Storage blocked');}});
  const report=await e.refresh(new AbortController().signal);assert.equal(report.successes,0);
  assert.ok(online.validRound(online.makeEnrichedRound(report.entries,480)));
});
test('Afgebroken requests leveren geen ongeldige categorieën op',async()=>{
  const controller=new AbortController();controller.abort();
  const e=new online.Enricher(async(_,options)=>{options.signal.throwIfAborted();},null);
  assert.equal((await e.refresh(controller.signal)).successes,0);
});
