const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../dist/core.js');
const game=globalThis.Letterpret;
test('Elke ronde heeft 13 unieke categorieën en een speelbare letter',()=>{
  for(let i=0;i<1000;i++){
    const r=game.makeRound(i.toString(36).toUpperCase().padStart(7,'0'));
    assert.equal(r.categories.length,13);assert.equal(new Set(r.categories.map(x=>x.id)).size,13);assert.ok(game.letters.includes(r.letter));
  }
});
test('Gedeelde codes reproduceren exact dezelfde uitdaging',()=>assert.deepEqual(game.makeRound('00HELLO'),game.makeRound('00HELLO')));
test('Leeg, verkeerde letter, accenten en dubbele antwoorden',()=>{
  const results=game.inspect(['',' fiets','Aap',' aap ','Áppel','auto'],'A');
  assert.deepEqual(results.map(x=>x.eligible),[false,false,true,false,true,true]);
});
test('Onbetrouwbare rondecodes worden geweigerd',()=>{for(const code of ['<script>','ZZZZZZZ','123','abcdefg',null])assert.equal(game.validCode(code),false);});
test('Categorieën zijn uniek en de bank is ruim genoeg',()=>{assert.ok(game.categories.length>=130);assert.equal(new Set(game.categories).size,game.categories.length);});
