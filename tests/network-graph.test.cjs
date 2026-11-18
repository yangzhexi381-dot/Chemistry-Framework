const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const d=JSON.parse(read('data/knowledge.json'));
const atlas=require('../src/unified-map.js').build(d.nodes,d.relations);
const geometry=require('../src/network-graph.js');
const net=geometry.build(atlas);
test('one visible scientific network has all nodes and all relation objects',()=>{
 assert.equal(net.count,d.nodes.length);
 assert.equal(net.relationCount,d.relations.length);
 assert.equal(net.count,64);assert.equal(net.relationCount,49);
 assert.equal(new Set(net.points.map(p=>p.id)).size,64);
 assert.equal(new Set(net.edges.map(e=>e.id)).size,49);
 assert.equal(net.edges.filter(e=>e.cross).length,8);
 for(const point of net.points){
  assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  assert.ok(point.x>=0&&point.y>=0&&point.x<=net.width&&point.y<=net.height,point.id);
  assert.ok(geometry.centers[point.group]);
 }
 for(const edge of net.edges){
  assert.equal(edge.from.length,edge.relation.premises.length);
  assert.equal(edge.end.id,edge.relation.conclusion);
  assert.ok(edge.from.every(p=>p.id!==''&&net.points.includes(p)));
  if(edge.relation.premises.length>1)assert.ok(edge.joint,'multi-premise join missing '+edge.id);
  else assert.equal(edge.joint,null);
 }
});
test('network geometry keeps six labelled groups without replacing actual dependencies',()=>{
 assert.equal(Object.keys(geometry.centers).length,6);
 for(const g of atlas.groups){
  const points=net.points.filter(p=>p.group===g.id);
  assert.equal(points.length,g.nodes.length,g.id);
  assert.equal(points.filter(p=>p.featured).length,g.highlights.length,g.id);
 }
 assert.deepEqual(new Set(net.edges.map(e=>e.relation.id)),new Set(d.relations.map(e=>e.id)));
 const index=read('index.html'),app=read('src/app.js'),css=read('assets/css/style.css');
 assert.match(index,/src="src\/network-graph\.js"/);
 assert.ok(app.includes('CFNetworkGraph.build(map)'));
 assert.ok(app.includes('network-relation'));
 assert.ok(app.includes("const cls='node network-node"));
 assert.ok(app.includes('networkFocusNode(id)'));
 assert.ok(css.includes('.network-svg'));
});

test('graph labels and nodes no longer collide in rigid rings',()=>{
 for(const group of atlas.groups){
  const points=net.points.filter(p=>p.group===group.id);
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
   const d=Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y);
   assert.ok(d>=40,'crowded nodes: '+points[i].id+' / '+points[j].id+' at '+d);
  }
  const featured=points.filter(p=>p.featured);
  assert.ok(featured.every(p=>p.y<=geometry.centers[group.id][1]),group.id+' main nodes must form top-level reading tier');
 }
 const analysis=net.points.filter(p=>p.group==='analysis');
 assert.ok(analysis.length===2);
 const center=geometry.centers.analysis[0];
 assert.equal(analysis[0].x+analysis[1].x,2*center,'two-node field must be centered');
});
test('connectivity gaps are reported honestly, never covered by fabricated graph edges',()=>{
 assert.equal(net.componentCount,10);
 assert.equal(net.unlinkedIds.length,6);
 assert.ok(net.unlinkedIds.every(id=>id.startsWith('battery.')));
 const original=new Set(d.relations.map(r=>r.id));
 assert.deepEqual(new Set(net.edges.map(e=>e.id)),original);
 const app=read('src/app.js');
 assert.ok(app.includes("networkDragMode=false"));
 assert.ok(app.includes('network-viewport'));
 assert.ok(app.includes('手指平移：'));
 assert.ok(app.includes('graph.componentCount'));
});
