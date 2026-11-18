const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const {matterCompositionNode,completeRelations}=require('../src/graph-views.js');
const db=JSON.parse(read('data/knowledge.json')),nodes=db.nodes.filter(matterCompositionNode),relations=completeRelations(nodes,db.relations);
const byId=new Map(nodes.map(n=>[n.id,n]));
const eq=(ids)=>ids.reduce((sum,id)=>{const n=byId.get(id);for(const [e,c]of Object.entries(n.composition))sum[e]=(sum[e]||0)+c;return sum},{});
test('materials & composition view is populated with elements, substances and meaningful relations',()=>{
 assert.equal(nodes.length,15);
 assert.equal(nodes.filter(n=>n.type==='chemical_element').length,6);
 assert.equal(nodes.filter(n=>n.type==='chemical_entity').length,9);
 assert.equal(relations.length,11);
 assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
 for(const n of nodes)assert.ok(n.composition&&n.sources?.length&&n.assumptions?.length&&n.limitations?.length&&n.review_status);
 for(const r of relations){assert.ok(r.conditions?.length&&r.limitations?.length);assert.ok(r.premises.every(p=>byId.has(p)));assert.ok(byId.has(r.conclusion));}
 const connected=new Set(relations.flatMap(r=>[...r.premises,r.conclusion]));
 assert.ok(nodes.every(n=>connected.has(n.id)),'no disconnected substance/element nodes');
});
test('chemical formula stoichiometries and net charge are correct',()=>{
 assert.deepEqual(byId.get('matter.h2plus').composition,{H:2});
 assert.equal(byId.get('matter.h2plus').charge,1);
 assert.deepEqual(byId.get('matter.n2o4').composition,{N:2,O:4});
 assert.deepEqual(byId.get('matter.no2').composition,{N:1,O:2});
 assert.deepEqual(byId.get('matter.lead_sulfate').composition,{Pb:1,S:1,O:4});
 assert.equal(byId.get('matter.butadiene').composition.C,4);
 assert.equal(byId.get('matter.water').composition.O,1);
 for(const n of nodes.filter(n=>n.type==='chemical_entity')){
  assert.equal(Object.entries(n.composition).some(([_,c])=>!Number.isInteger(c)||c<1),false);
 }
});
test('dimerization and lead-acid reactions conserve every element',()=>{
 const dimer={...byId.get('matter.no2').composition};
 for(const [e,k] of Object.entries(dimer))dimer[e]=2*k;
 assert.deepEqual(dimer,byId.get('matter.n2o4').composition);
 const add=(a,b,coeff=1)=>{const out={...a};for(const[e,c]of Object.entries(b))out[e]=(out[e]||0)+coeff*c;return out;};
 let lhs={};lhs=add(lhs,byId.get('matter.lead_metal').composition);lhs=add(lhs,byId.get('matter.lead_dioxide').composition);lhs=add(lhs,byId.get('matter.sulfuric_acid').composition,2);
 let rhs={};rhs=add(rhs,byId.get('matter.lead_sulfate').composition,2);rhs=add(rhs,byId.get('matter.water').composition,2);
 assert.deepEqual(lhs,rhs);
 assert.ok(relations.some(r=>r.id==='rel.matter.nox_dimer'&&r.type==='reversible_stoichiometric_reaction'));
 assert.ok(relations.some(r=>r.id==='rel.matter.lead_acid_discharge'&&r.type==='balanced_overall_reaction'));
});
test('models and clickable matter graph are connected without breaking other views',()=>{
 const app=read('src/app.js');
 assert.ok(app.includes("CFGraphViews.matterCompositionNode"));
 assert.ok(app.includes("focusedMatter=selectedDomain==='物质与组成'"));
 assert.ok(app.includes('materialModelLink'));
 assert.ok(read('tests/curriculum-browser.cjs').includes("expectedGroups={matter:15,structure:13,thermo:15,kinetics:12,electrochem:7,analysis:2}"));
 assert.equal(require('../src/unified-map.js').build(db.nodes,db.relations).groups.find(g=>g.id==='matter').nodes.length,15);
 for(const n of nodes.filter(n=>n.model_route))assert.ok(/^#(?:model\.|electrochem)/.test(n.model_route));
});
