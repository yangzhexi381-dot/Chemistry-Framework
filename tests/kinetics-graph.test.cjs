const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(base,name),'utf8');
const knowledge=JSON.parse(read('data/knowledge.json')),chapter=JSON.parse(read('data/curriculum/pc-11.json'));
const nodes=knowledge.nodes.filter(n=>n.id.startsWith('kinetics.ch11.'));
const edges=knowledge.relations.filter(r=>r.id.startsWith('rel.kinetics11.'));
test('graph covers every published Chapter 11 section and retains textbook provenance',()=>{
 assert.equal(nodes.length,10);
 const ids=new Set(knowledge.nodes.map(n=>n.id));assert.equal(ids.size,knowledge.nodes.length);
 for(const s of chapter.sections){const n=nodes.find(n=>n.curriculum_ref===s.id);
  assert.ok(n,s.id);assert.equal(n.id,'kinetics.ch11.'+s.id.split('.').at(-1));
  assert.equal(n.statement,s.overview);assert.equal(n.description,s.subtopics[0].explanation);
  assert.deepEqual(n.equations,s.equations.slice(0,1).map(e=>e.expression));
  assert.deepEqual(n.assumptions,s.assumptions.slice(0,3));assert.deepEqual(n.limitations,s.pitfalls.slice(0,3));
  assert.ok(n.sources.some(source=>source.title.includes(s.source.printedPages.join('–'))));
  assert.ok(n.domain.includes('chemical_kinetics')&&n.review_status==='in_review');
  assert.ok(!/^11\.\d+/.test(n.title),'numbered title '+n.id);
  assert.ok(!/^11\.\d+/.test(n.graph_label),'numbered label '+n.id);
 }
});
test('graph relations have valid endpoints and conditional provenance',()=>{
 assert.equal(edges.length,14);
 const ids=new Set(knowledge.nodes.map(n=>n.id));
 for(const r of edges){assert.ok(ids.has(r.conclusion),r.id);for(const id of r.premises)assert.ok(ids.has(id),r.id+': '+id);
  assert.ok(r.claim&&r.type&&r.conditions.length&&r.steps.length&&r.limitations.length,r.id);
  assert.ok(r.sources.some(s=>s.title.includes('第六版')),r.id);
  assert.equal(r.review_status,'in_review');
 }
 assert.equal(new Set(edges.map(x=>x.id)).size,edges.length);
 assert.ok(edges.some(r=>r.type==='conditional_derivation'));
 assert.ok(edges.some(r=>r.type==='empirical_relation'));
 assert.ok(edges.some(r=>r.type==='learning_dependency'));
});
test('focused graph view and safe textbook link coexist with existing navigation',()=>{
 const code=read('src/app.js');assert.ok(code.includes("const views=[['全部视角','全部']]"));
 assert.ok(code.includes('CFUnifiedMap.build(db.nodes,db.relations)'));
 assert.ok(!code.includes("['反应动力学','kinetics11']"));
 assert.ok(!code.includes("selectedDomain==='反应动力学'"));
 assert.ok(read('src/graph-views.js').includes("domain.includes('chemical_kinetics')"));
 assert.ok(code.includes('CFGraphViews.reactionMechanismNode'));
 assert.ok(code.includes('CFGraphViews.completeRelations'));
 assert.match(code,/curriculumLink=.*?pc\\.11/s);
 assert.ok(code.includes('深入推导、适用边界与自测'));
 assert.ok(code.includes('event.key===\'Enter\''));
 const html=read('index.html');assert.ok(html.includes('id="graph"')&&html.includes('src="src/app.js?v=20261118-intuition"'));
});
