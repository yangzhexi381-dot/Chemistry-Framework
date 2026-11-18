const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const db=JSON.parse(read('data/knowledge.json')),cat=JSON.parse(read('data/curriculum/index.json')),html=read('index.html'),app=read('src/app.js'),route=read('src/curriculum.js');
test('all five modules share valid knowledge references',()=>{
 const modules=['explore','inquire','theory','electrochem','workbench'],ids=new Set(db.nodes.map(x=>x.id)),rels=new Map(db.relations.map(x=>[x.id,x]));
 assert.deepEqual(Object.keys(db.module_paths).sort(),modules.sort());
 for(const module of modules){
   assert.equal(html.split('data-knowledge-module="'+module+'"').length,2,module);
   for(const p of db.module_paths[module].paths){
     assert.ok(p.title&&p.node_ids.length>=2);
     for(const id of p.node_ids)assert.ok(ids.has(id),id);
     if(p.relation_id){const r=rels.get(p.relation_id);assert.ok(r,p.relation_id);assert.ok(p.node_ids.some(id=>r.premises.includes(id)||r.conclusion===id));}
   }
 }
 assert.ok(app.includes('renderModulePaths();'));
 assert.ok(app.includes('module_paths:bundled.module_paths'));
 assert.ok(route.includes("hash.startsWith('concept/')"));
});
test('navigation uses knowledge graph and does not expose standalone textbook framing',()=>{
 assert.doesNotMatch(html,/>[^<>]*教材[^<>]*</);
 assert.doesNotMatch(html,/data-page="learn"/);
 assert.match(html,/href="#concept\/battery\.polarization"/);
 assert.match(html,/href="#concept\/model\.h2plus\.frozen_1s_lcao"/);
 assert.ok(app.includes('href="#concept/'));
 assert.equal(cat.books[0].title,'物理化学 · 反应动力学');
});
test('source attribution and review status remain available',()=>{
 for(const n of db.nodes.filter(n=>n.curriculum_ref)){
   assert.ok(n.sources?.length && n.assumptions?.length && n.limitations?.length && n.review_status);
 }
 assert.ok(route.includes('sourceText(section.source)'));
 assert.ok(route.includes('内容审核状态'));
 assert.match(read('tests/curriculum-browser.cjs'),/for\(const moduleId of/);
});
