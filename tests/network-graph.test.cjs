const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const db=JSON.parse(read('data/knowledge.json'));
const atlas=require('../src/unified-map.js').build(db.nodes,db.relations);
const geometry=require('../src/network-graph.js'),map=geometry.build(atlas);
test('a single spiral map retains all 64 concepts and 49 true relations',()=>{
 assert.equal(map.count,64);assert.equal(map.relationCount,49);
 assert.equal(new Set(map.points.map(p=>p.id)).size,db.nodes.length);
 assert.deepEqual(new Set(map.edges.map(e=>e.id)),new Set(db.relations.map(r=>r.id)));
 assert.equal(map.edges.filter(e=>e.cross).length,8);
 for(const edge of map.edges){
  assert.equal(edge.from.length,edge.relation.premises.length);
  assert.equal(edge.end.id,edge.relation.conclusion);
  if(edge.from.length>1)assert.ok(edge.joint,edge.id);
  else assert.equal(edge.joint,null,edge.id);
 }
 assert.equal(map.componentCount,10);
 assert.equal(map.unlinkedIds.length,6);
});
test('original free spiral has spacious, valid nodes without six rigid panels',()=>{
 assert.equal(geometry.width,1840);assert.equal(geometry.height,1380);
 assert.equal(Object.keys(map.centers).length,6);
 for(const group of atlas.groups){
  assert.equal(map.points.filter(p=>p.group===group.id).length,group.nodes.length);
  assert.equal(map.points.filter(p=>p.featured&&p.group===group.id).length,group.highlights.length);
 }
 for(let i=0;i<map.points.length;i++){
  const p=map.points[i];
  assert.ok(p.x>0&&p.x<map.width&&p.y>0&&p.y<map.height,p.id);
  for(let j=i+1;j<map.points.length;j++){
   const q=map.points[j],dist=Math.hypot(p.x-q.x,p.y-q.y);
   assert.ok(dist>85,'dots too close: '+p.id+' / '+q.id);
  }
 }
});
test('labels keep complete text, and calculated rectangles never collide when zoomed',()=>{
 for(const p of map.points){
  assert.equal(p.lines.join(''),p.label,p.id);
  assert.ok(['start','middle','end'].includes(p.labelAnchor),p.id);
  assert.ok(Number.isFinite(p.labelX)&&Number.isFinite(p.labelY));
  const a=p.labelBox;
  assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=map.width&&a.y+a.h<=map.height,p.id);
  assert.ok(p.lines.every(line=>Array.from(line).reduce((n,c)=>n+geometry.approximateWidth(c),0)<=7.55));
 }
 for(let i=0;i<map.points.length;i++)for(let j=i+1;j<map.points.length;j++){
  assert.equal(geometry.rectOverlap(map.points[i].labelBox,map.points[j].labelBox),0,'labels collide: '+map.points[i].id+' / '+map.points[j].id);
 }
});
test('screenshot style and direct touch gestures are present, without a pan-mode toggle',()=>{
 const app=read('src/app.js'),html=read('index.html'),css=read('assets/css/style.css');
 assert.match(html,/src="src\/network-graph\.js\?v=20261118-20"/);
 assert.match(html,/src="src\/app\.js\?v=20261118-20"/);
 assert.ok(app.includes("host.classList.add('unified-graph','connected-graph','radial-graph')"));
 assert.ok(app.includes("const groupSVG=''"));
 assert.ok(!app.includes('network-pan-toggle'));
 assert.ok(app.includes("kind:'pinch'"));
 assert.ok(app.includes("kind:'pan'"));
 assert.ok(app.includes("svg.addEventListener('pointerdown'"));
 assert.ok(app.includes("svg.addEventListener('pointermove'"));
 assert.ok(css.includes('.radial-graph .network-svg{touch-action:none'));
 assert.ok(css.includes('radial-gradient(circle,#e3e9e1'));
});
