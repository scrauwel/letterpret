const {test}=require('node:test');const assert=require('node:assert/strict');
require('../dist/core.js');require('../dist/online.js');const game=globalThis.LetterpretOnline;
test('Kinderniveau bevat uitsluitend eenvoudige categorieën en letters',()=>{
 for(let i=0;i<100;i++){const r=game.makeEnrichedRound([{name:'Belgisch acteur',source:'Belgisch acteur',letters:'ABCD'}],120,[],{level:'kids'});assert.equal(r.level,'kids');assert.ok(game.easyLetters.includes(r.letter));assert.equal(r.categories.length,13);assert.ok(r.categories.every(c=>game.kidsBank.includes(c.name)&&!c.source));}
});
test('Letters wisselen altijd, ook bij een nieuwe reeks en niveauwissel',()=>{
 const history={kids:[],older:[]};let last='';
 for(let i=0;i<500;i++){const level=i%31===0?'older':'kids';const r=game.makeEnrichedRound([],120,[],{level,usedLetters:history[level],lastLetter:last});assert.notEqual(r.letter,last);if(history[level].includes(r.letter)){assert.ok(game.remainingLetters(level,history[level],last).length);history[level]=[];}history[level].push(r.letter);last=r.letter;}
});
test('De eerste kinderreeks herhaalt geen enkele letter',()=>{let used=[];for(let i=0;i<game.easyLetters.length;i++){const r=game.makeEnrichedRound([],120,[],{level:'kids',usedLetters:used,lastLetter:used.at(-1)});assert.ok(!used.includes(r.letter));used.push(r.letter);}});
test('Pauze bewaart milliseconden en telt pauzetijd niet mee',()=>{
 const paused=game.pauseClock({phase:'playing',deadline:121000},23456);assert.equal(paused.phase,'paused');assert.equal(paused.remainingMs,97544);assert.equal(paused.remaining,98);
 const resumed=game.resumeClock(JSON.parse(JSON.stringify(paused)),300000);assert.equal(resumed.deadline,397544);assert.equal(resumed.phase,'playing');assert.equal(game.pauseClock(resumed,397544).phase,'review');
});
test('Een deellink bewaart het gekozen niveau en de letter',()=>{const r=game.makeEnrichedRound([],240,[],{level:'kids'});assert.deepEqual(game.decodeRound(game.encodeRound(r)),r);});
