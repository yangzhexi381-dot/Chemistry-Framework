const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { searchRecords, search, targetHash } = require('../src/curriculum.js');
const directory = path.join(__dirname, '../data/curriculum');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'index.json'), 'utf8'));
const chapter = JSON.parse(fs.readFileSync(path.join(directory, 'pc-11.json'), 'utf8'));
const records = searchRecords([chapter], catalog.books);

test('full-text search reaches explanations, equation conditions, reasoning, boundaries and answers in actual kinetics chapter', () => {
  const section = chapter.sections[0];
  for (const field of [section.overview, ...section.subtopics.map(topic => topic.explanation),
    ...section.equations.flatMap(equation => [equation.expression, equation.meaning, equation.conditions]),
    ...section.derivation, ...section.assumptions, ...section.pitfalls, ...section.examples.flatMap(example => [example.question, example.answer])]) {
    const phrase = field.trim().split(/\s+/)[0];
    assert.ok(search(records, phrase).some(record => record.section.id === section.id), `not searchable: ${field}`);
  }
});

test('search combines book metadata with section keywords and treats special characters literally', () => {
  const section = chapter.sections[0], book = catalog.books.find(item => item.id === chapter.bookId);
  assert.ok(search(records, book.title + ' ' + section.id).some(record => record.section.id === section.id));
  assert.equal(search(records, section.id + ' 一个确实不存在于教材的数据词').length, 0);
  assert.deepEqual(search(records, '   '), []);
  assert.doesNotThrow(() => search(records, '[.*'));
  assert.ok(search(records, section.id.toUpperCase()).some(record => record.section.id === section.id));
});

test('stable section and model links reject unsupported URLs and executable content', () => {
  assert.equal(targetHash('pc.11.1'), '#learn/pc.11.1');
  assert.equal(targetHash('pc.12.1'), '#learn/pc.12.1');
  assert.equal(targetHash('sc.appendix.1'), '#learn/sc.appendix.1');
  for (const target of ['model.h2plus', 'model.n2o4', 'electrochem']) assert.equal(targetHash(target), '#' + target);
  for (const target of ['javascript:alert(1)', 'https://example.com', 'pc.11.1" onclick="alert(1)', '../data', '__proto__']) assert.equal(targetHash(target), null);
});
