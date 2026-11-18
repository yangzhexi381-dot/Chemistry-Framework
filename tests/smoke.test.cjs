const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('knowledge dataset has nodes, relations and cases', () => {
  const d = JSON.parse(read('data/knowledge.json'));
  assert.ok(Array.isArray(d.nodes) && d.nodes.length > 0);
  assert.ok(Array.isArray(d.relations) && d.relations.length > 0);
  assert.ok(Array.isArray(d.science_cases));
  const ids = d.nodes.map(x => x.id);
  assert.equal(ids.length, new Set(ids).size, 'node ids must be unique');
});

test('all static assets referenced by index exist', () => {
  const html = read('index.html');
  const files = [...html.matchAll(/(?:src|href)="((?:src|assets)\/[^"]+)"/g)].map(x => x[1]);
  assert.ok(files.length >= 5);
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f.split('?')[0])), `missing ${f}`);
});

test('N2O4 educational kinetics model responds to K', () => {
  const context = { window: {} };
  vm.runInNewContext(read('src/models/n2o4.js'), context);
  const mod = context.window.CFModels.n2o4;
  const out = mod.simulate({K: 5, lambda: 1, steps: 100, dt: 0.002});
  assert.equal(out.rows.length, 101);
  assert.ok(Number.isFinite(out.final.dgOverRT));
  assert.ok(out.final.n2 > 0);
});

test('lead-acid progress is clamped to [0, 1]', () => {
  const context = { window: {} };
  vm.runInNewContext(read('src/models/lead-acid.js'), context);
  const f = context.window.CFModels.leadAcid.normalizedExtent;
  assert.equal(f(-5).fraction, 0);
  assert.equal(f(110).fraction, 1);
});


test('N2O4 UI reads the actual Gibbs-energy result field', () => {
  const ui = read('src/workbench.js');
  assert.match(ui, /Math\.abs\(last\.dgOverRT\)/);
  assert.match(ui, /last\.dgOverRT\s*<\s*0/);
  assert.doesNotMatch(ui, /\blast\.dg\b/, 'undefined last.dg would misclassify the direction');
});

test('N2O4 Gibbs-energy sign agrees with reaction quotient and direction', () => {
  const context = { window: {} };
  vm.runInNewContext(read('src/models/n2o4.js'), context);
  const model = context.window.CFModels.n2o4;
  const forward = model.simulate({K: 5, lambda: 0.001, steps: 10, dt: 0.002});
  const reverse = model.simulate({K: 0.001, lambda: 1, steps: 10, dt: 0.002});
  assert.ok(forward.final.Q < forward.K);
  assert.ok(forward.final.dgOverRT < 0, 'Q < K implies forward is thermodynamically favorable');
  assert.ok(reverse.final.Q > reverse.K);
  assert.ok(reverse.final.dgOverRT > 0, 'Q > K implies reverse is thermodynamically favorable');
  assert.ok(Math.abs(forward.final.dgOverRT - Math.log(forward.final.Q / forward.K)) < 1e-12);
  assert.ok(Math.abs(reverse.final.dgOverRT - Math.log(reverse.final.Q / reverse.K)) < 1e-12);
});

test('N2O4 reaches near-equilibrium and conserves nitrogen units', () => {
  const context = { window: {} };
  vm.runInNewContext(read('src/models/n2o4.js'), context);
  const mod = context.window.CFModels.n2o4;
  const out = mod.simulate({K: 5, lambda: 1, steps: 6000, dt: 0.002});
  assert.ok(Math.abs(out.final.dgOverRT) < 0.03);
  assert.ok(Math.abs(out.final.qratio - 1) < 0.03);
  for (const row of out.rows) {
    assert.ok(row.n4 >= 0 && row.n2 >= 0);
    assert.ok(Math.abs((2 * row.n4 + row.n2) - 2.1) < 1e-9, '2[N2O4] + [NO2] remains constant');
  }
});

test('N2O4 rate scale changes approach speed but not equilibrium constant', () => {
  const context = { window: {} };
  vm.runInNewContext(read('src/models/n2o4.js'), context);
  const mod = context.window.CFModels.n2o4;
  const slow = mod.simulate({K: 5, lambda: 0.25, steps: 50, dt: 0.002});
  const fast = mod.simulate({K: 5, lambda: 2, steps: 50, dt: 0.002});
  assert.equal(slow.K, fast.K);
  assert.ok(fast.final.qratio > slow.final.qratio, 'higher λ approaches Q/K=1 more rapidly in this time window');
});


test('knowledge relations reference existing nodes and computational H2+ has provenance',()=>{
  const d=JSON.parse(read('data/knowledge.json')),ids=new Set(d.nodes.map(n=>n.id));
  for(const r of d.relations){
    assert.ok(ids.has(r.conclusion),r.id);
    for(const id of r.premises)assert.ok(ids.has(id),`${r.id}: ${id}`);
  }
  const n=d.nodes.find(n=>n.id==='model.h2plus.frozen_1s_lcao');
  assert.ok(n.sources.length>=2&&n.assumptions.length>0&&n.limitations.length>0);
});
