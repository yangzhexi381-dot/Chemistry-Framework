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
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f)), `missing ${f}`);
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
