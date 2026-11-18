const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const {reactionMechanismNode,completeRelations}=require('../src/graph-views.js');
const knowledge=JSON.parse(read('data/knowledge.json')),nodes=knowledge.nodes.filter(reactionMechanismNode),relations=completeRelations(nodes,knowledge.relations);
test('Reaction & Mechanism includes 10 kinetics sections, measurable rate and battery application',()=>{
  assert.equal(nodes.length,15);assert.equal(nodes.filter(n=>/^kinetics\.ch11\.\d+$/.test(n.id)).length,10);
  assert.ok(nodes.some(n=>n.id==='kinetics.reaction_rate'));
  assert.ok(nodes.some(n=>n.id==='battery.lead_acid'));
  assert.equal(relations.length,15);
});
test('all visible relation constraints are self-contained and scientifically typed',()=>{
  const ids=new Set(nodes.map(n=>n.id));
  for(const edge of relations){
    assert.ok(ids.has(edge.conclusion),edge.id);
    assert.ok(edge.premises.length>0&&edge.premises.every(id=>ids.has(id)),edge.id);
    assert.ok(edge.conditions?.length&&edge.limitations?.length,edge.id);
  }
  assert.ok(relations.some(r=>r.id==='rel.kinetics.view.rate_definition'&&r.type==='definition_link'));
  assert.ok(relations.some(r=>r.id==='rel.kinetics.view.battery_example'&&r.type==='application_example'));
  assert.ok(!relations.some(r=>r.id==='rel.kinetics11.thermo_scope'));
  assert.ok(!relations.some(r=>r.id==='rel.kinetics11.detailed_balance'));
});
test('other views and all source text remain intact; canonical knowledge routes persist',()=>{
  const app=read('src/app.js');
  assert.match(app,/selectedDomain==='热力学与动力学'/);
  assert.match(app,/selectedDomain==='反应与机理'/);
  assert.match(app,/CFGraphViews\.reactionMechanismNode/);
  assert.match(read('index.html'),/src="src\/graph-views\.js\?v=20261118-18"/);
  for(let i=1;i<=10;i++)assert.ok(knowledge.nodes.some(n=>n.id==='kinetics.ch11.'+i&&n.curriculum_ref==='pc.11.'+i));
});
