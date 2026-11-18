const {test} = require('node:test');
const assert = require('node:assert/strict');
const data = require('../data/knowledge.json');
const {analyze, createIndex} = require('../src/intuition-analysis.js');
const index = createIndex(data.nodes, data.relations);

const photo = '光化学反应ΔG≤Wf，Wf是非膨胀功。也就是说反应只取决于吸收的光子数……看起来是不满足热力学第二定律的，但有没有可能“非膨胀功”可以说是一个“标准”，只是热化学反应是基态分子的反应，且成立条件是Wf = 0。';

test('the screenshot question keeps its compound claims and reaches real photochemistry and work concepts', () => {
  const previous = analyze('铅酸蓄电池端电压能说明多少容量吗？', '', index);
  assert.ok(previous.matches.some(match => match.id === 'battery.measurement'));
  const result = analyze(photo, '持续光照，恒温恒压', index);
  assert.equal(result.original, photo);
  assert.ok(result.keywords.some(term => /光子/.test(term)));
  assert.deepEqual(new Set(result.matches.map(match => match.id)), new Set([
    'kinetics.photoexcitation','kinetics.photochemical_quantum_yield','thermo.gibbs_nonexpansion_work'
  ]));
  assert.ok(result.clauses.some(clause => clause.checks.some(check => check.includes('熵交换'))));
  assert.ok(result.clauses.some(clause => clause.checks.some(check => check.includes('符号约定'))));
  assert.ok(result.relations.some(item => item.matched.length >= 2));
  assert.ok(result.relations.every(({relation, endpoints}) => data.relations.includes(relation)
    && endpoints.every(id => index.byId.has(id))));
  assert.match(result.searchQuery, /quantum yield/i);
});

test('unrecognized questions can be searched without selecting any saved example or unrelated nodes', () => {
  const result = analyze('Cr³⁺是否改变 UOR 的亚硝酸盐选择性？', '', index);
  assert.equal(result.matches.length, 0);
  assert.deepEqual(result.relations, []);
  assert.ok(result.keywords.includes('UOR'));
  assert.ok(result.keywords.includes('Cr³⁺'));
  assert.match(result.searchQuery, /UOR/);
  assert.equal(analyze('为什么会这样？', '', index).searchQuery, '');
});

test('context keywords are marked distinctly and formula recognition respects charge and token boundaries', () => {
  const result = analyze('浓度变化能支持这个推断吗？', '粉末 XRD', index);
  const xrd = result.matches.find(match => match.id === 'analysis.xrd_phase_assignment');
  assert.ok(xrd.hits.some(hit => hit.name === 'XRD' && !hit.inQuestion));
  assert.ok(analyze('N₂O₄ 与 NO₂ 有什么关系？', '', index).matches.some(match => match.id === 'matter.no2'));
  for (const text of ['NO₂⁻ 是什么？','HNO2 是什么？','NO₂Cl 是什么？']) {
    assert.ok(!analyze(text, '', index).matches.some(match => match.id === 'matter.no2'), text);
  }
});

test('keyword association is deterministic and handles a multi-domain question without substituting a title', () => {
  const raw = '  原问题：XRD 物相鉴定与反应速率之间的推断如何检验？\n实际考虑过电势。  ';
  const result = analyze(raw, '', index);
  assert.equal(result.original, raw);
  for (const id of ['analysis.xrd_phase_assignment', 'kinetics.reaction_rate', 'battery.polarization']) {
    assert.ok(result.matches.some(match => match.id === id), id);
  }
  assert.deepEqual(result, analyze(raw, '', index));
});
