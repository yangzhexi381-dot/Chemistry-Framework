const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=(x)=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const knowledge=JSON.parse(read('data/knowledge.json')),html=read('index.html'),js=read('src/structure-studio.js'),app=read('src/app.js'),route=read('src/curriculum.js');
const M=require('../src/models/structure-chemistry.js');
test('all seven science models are wired to the unified graph and both native modules',()=>{
 const ids=new Set(knowledge.nodes.map(n=>n.id)),edges=knowledge.relations.filter(r=>r.id.startsWith('rel.structure.'));
 assert.equal(edges.length,8);
 for(const m of M.catalog){
  assert.ok(ids.has(m.node),m.id);
  const n=knowledge.nodes.find(n=>n.id===m.node);
  assert.equal(n.model_ref,m.id);
  assert.ok(n.assumptions?.length&&n.limitations?.length&&n.sources?.length);
  assert.equal(n.review_status,'in_review');
  assert.ok(route.includes("'model.structure."+m.id+"'"));
  assert.ok(html.includes('data-structure-mode="'+m.id+'"'));
  assert.match(js,new RegExp('model\\.structure\\.'));
 }
 assert.ok(knowledge.module_paths.theory.paths.some(p=>p.node_ids.includes(M.catalog[0].node)));
 assert.ok(knowledge.module_paths.workbench.paths.some(p=>p.node_ids.includes(M.catalog[3].node)));
 for(const e of edges){assert.ok(ids.has(e.conclusion));for(const id of e.premises)assert.ok(ids.has(id));assert.ok(e.conditions?.length&&e.limitations?.length)}
});
test('UI is a scoped native integration, not a nested original app',()=>{
 assert.ok(html.includes('id="structure-studio"'));
 assert.ok(html.includes('id="sc-theory-grid"'));
 assert.equal((html.match(/class="tab(?: active)?" data-page=/g)||[]).length,4);
 assert.match(html,/src="src\/models\/structure-chemistry\.js(?:\?[^" ]+)?"/);
 assert.match(html,/src="src\/structure-studio\.js(?:\?[^" ]+)?"/);
 assert.ok(html.includes('assets/css/structure-studio.css'));
 assert.ok(!html.includes('STRUCTURE LAB'));
 assert.ok(js.includes('root.querySelector(s)'));
 assert.ok(js.includes('IntersectionObserver'));
 assert.ok(app.includes('renderStructureTheory();'));
 assert.ok(app.includes('打开交互模型并调整参数'));
});
