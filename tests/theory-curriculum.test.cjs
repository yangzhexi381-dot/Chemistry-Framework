const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),controller=read('src/curriculum.js');

test('Theory Tools contains the textbook learning section without a separate top-level tab',()=>{
  assert.equal((html.match(/class="tab(?: active)?" data-page=/g)||[]).length,4);
  assert.doesNotMatch(html,/data-page="learn"/);
  assert.equal((html.match(/id="theory"/g)||[]).length,1);
  assert.equal((html.match(/id="learn"/g)||[]).length,1);
  assert.match(html,/<section id="theory" class="page">[\s\S]*?<div class="unified-theory-board"[\s\S]*?<section id="learn" class="theory-curriculum"[\s\S]*?<\/section>\s*<\/div>\s*<\/section>\s*<footer>/);
  assert.match(html,/id="theory-cards"/);
  assert.match(html,/id="curriculum-search-form"/);
  assert.match(html,/id="curriculum-chapter"/);
  assert.match(html,/id="curriculum-sections"/);
  assert.match(html,/<section class="theory-electrochem"[\s\S]*?<div class="textbook-chapters">/);
  assert.equal((html.match(/<details(?: open)?>/g)||[]).length,3);
});

test('legacy chapter and workbench links still navigate with the correct parent page',()=>{
  const {targetHash}=require('../src/curriculum.js');
  assert.equal(targetHash('pc.11.1'),'#learn/pc.11.1');
  assert.equal(targetHash('pc.11.10'),'#learn/pc.11.10');
  assert.equal(targetHash('model.n2o4'),'#model.n2o4');
  assert.equal(targetHash('electrochem'),'#electrochem');
  assert.equal((html.match(/data-page="electrochem"/g)||[]).length,0);
  assert.match(html,/<section id="workbench" class="page">[\s\S]*?<section id="electrochem" class="combined-subsection">/);
  assert.match(controller,/electrochem:\s*\['workbench',\s*'electrochem'\]/);
  assert.match(controller,/activatePage\('theory'\); clearQuery\(\)/);
  assert.match(controller,/hash === 'theory'[\s\S]*?if \(!started\) load\(\)/);
  assert.match(controller,/hash === 'learn'[\s\S]*?scrollIntoView/);
  assert.match(html,/href="#concept\/model\.h2plus\.frozen_1s_lcao"/);
  assert.match(read('src/app.js'),/href="#learn\/\$\{esc\(n\.curriculum_ref\)\}"/);
  assert.doesNotMatch(controller,/activatePage\('learn'\)/);
  assert.match(read('src/app.js'),/href="#learn\/\$\{esc\(n\.curriculum_ref\)\}"/);
});
