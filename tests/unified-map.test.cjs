const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(base,p),'utf8');
const data=JSON.parse(read('data/knowledge.json'));
const {groups,idFor,build}=require('../src/unified-map.js');
const map=build(data.nodes,data.relations);
test('the one atlas contains every existing scientific node and all relations',()=>{
 assert.equal(data.nodes.length,64);
 assert.equal(data.relations.length,49);
 assert.equal(map.nodeCount,64);
 assert.equal(map.relationCount,49);
 assert.equal(map.assignedCount,64);
 assert.equal(groups.length,6);
 assert.deepEqual(map.groups.map(g=>[g.id,g.nodes.length]),[
 ['matter',15],['structure',13],['thermo',15],['kinetics',12],['electrochem',7],['analysis',2]]);
 const ids=map.groups.flatMap(g=>g.nodes.map(n=>n.id));
 assert.equal(new Set(ids).size,data.nodes.length);
 assert.equal(ids.filter(id=>id.startsWith('kinetics.ch11.')).length,10);
 assert.equal(ids.filter(id=>id.startsWith('element.')||id.startsWith('matter.')).length,15);
});
test('all 49 stored relations remain accessible and eight true cross-field edges are distinguished',()=>{
 assert.equal(map.bridges.length,8);
 const countInternal=map.groups.reduce((a,g)=>a+g.relations.length,0);
 assert.equal(countInternal+map.bridges.length,49);
 for(const edge of map.bridges){
  assert.ok(edge.groups.length>1);
  assert.ok(edge.premises?.length&&edge.conditions?.length&&edge.claim);
  assert.ok(edge.groups.every(g=>groups.some(x=>x.id===g)));
 }
 for(const n of data.nodes)assert.ok(idFor(n),n.id);
});
test('UI exposes the whole atlas without separate material or kinetics filter pages',()=>{
 const app=read('src/app.js'),html=read('index.html');
 assert.ok(app.includes('renderAtlas()'));
 assert.ok(app.includes("const views=[['全部视角','全部']]"));
 assert.ok(!app.includes("['物质与组成','entities']"));
 assert.ok(!app.includes("['反应与机理','reaction']"));
 assert.ok(app.includes('CFUnifiedMap.build(db.nodes,db.relations)'));
 assert.match(html,/src="src\/unified-map\.js"/);
 assert.match(html,/class="map-layout unified-map-layout"/);
 assert.match(html,/class="atlas-all-relations"/);
 assert.match(read('tests/curriculum-browser.cjs'),/expectedGroups=\{matter:15,structure:13/);
});
