const {test}=require('node:test');const assert=require('node:assert/strict');
require('../dist/core.js');require('../dist/online.js');const game=globalThis.LetterpretOnline;
test('200 zelfbedachte categorieën zijn uniek, kort en deelbaar',()=>{
 const all=[...game.creativeKids,...game.creativeOlder];assert.equal(all.length,200);assert.equal(new Set(all).size,200);assert.ok(all.every(x=>x.length<=100&&!/[<>\n]/.test(x)));
});
test('Beide niveaus hebben minstens acht creatieve opdrachten en vermijden vier vorige rondes',()=>{
 for(const level of ['kids','older']){let recent=[];const creative=level==='kids'?game.creativeKids:game.creativeOlder;
  for(let i=0;i<100;i++){
   const entries=['Franse kaas','Belgisch acteur','Nederlands acteur'].map(name=>({name,source:name,letters:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'}));
   const r=game.makeEnrichedRound(entries,240,[],{level,recentCategories:recent});
   assert.ok(game.validRound(r));assert.ok(r.categories.filter(x=>creative.includes(x.name)).length>=8);
   assert.ok(r.categories.every(x=>!recent.includes(x.name)));assert.ok(r.categories.filter(x=>x.source).length<=3);
   assert.deepEqual(game.decodeRound(game.encodeRound(r)),r);
   recent=[...recent,...r.categories.map(x=>x.name)].slice(-52);
  }
 }
});
test('Een volledig gebruikte voorraad blijft een geldige ronde opleveren',()=>{
 const recent=[...game.kidsBank,...game.creativeOlder,...globalThis.Letterpret.categories];
 for(const level of ['kids','older'])assert.ok(game.validRound(game.makeEnrichedRound([],120,[],{level,recentCategories:recent})));
});
