const test = require('node:test');
const assert = require('node:assert/strict');
const { search, MAX_RESULTS } = require('../src/intuition-literature.js');

function response(payload, status = 200) {
  return { status, ok: status >= 200 && status < 300, json: async () => payload };
}

test('maps Crossref work metadata and constructs a DOI link from canonical DOI', async () => {
  let request;
  const results = await search('edited electrocatalysis keywords', {
    fetcher: async (url, options) => {
      request = { url: new URL(url), options };
      return response({ message: { items: [{
        title: ['  A catalyst study  '], DOI: 'https://doi.org/10.1021/ja0123456',
        'published-print': { 'date-parts': [[2024, 2]] },
        'container-title': ['Journal of Testing']
      }] } });
    }
  });
  assert.equal(request.url.origin + request.url.pathname, 'https://api.crossref.org/works');
  assert.equal(request.url.searchParams.get('query.bibliographic'), 'edited electrocatalysis keywords');
  assert.equal(request.options.method, 'GET');
  assert.equal(results.length, 1);
  assert.deepEqual(results[0], {
    title: 'A catalyst study', doi: '10.1021/ja0123456', year: 2024,
    source: 'Journal of Testing', url: 'https://doi.org/10.1021/ja0123456'
  });
});

test('distinguishes valid empty results and filters malformed individual records', async () => {
  const empty = await search('keywords', { fetcher: async () => response({ message: { items: [] } }) });
  assert.deepEqual(empty, []);
  const partial = await search('keywords', { fetcher: async () => response({ message: { items: [
    { title: ['No DOI'] }, { DOI: 'bad', title: ['Bad DOI'] },
    { DOI: '10.1234/good', title: ['Good'], issued: { 'date-parts': [[2020]] } }
  ] } }) });
  assert.equal(partial.length, 1);
  assert.equal(partial[0].year, 2020);
});

test('caps returned records and rejects invalid query and invalid top-level payload', async () => {
  const items = Array.from({ length: MAX_RESULTS + 4 }, (_, i) => ({ DOI: `10.1234/item${i}`, title: [`Item ${i}`] }));
  assert.equal((await search('query', { fetcher: async () => response({ message: { items } }) })).length, MAX_RESULTS);
  await assert.rejects(search('  '), { code: 'invalid-query' });
  await assert.rejects(search('query', { fetcher: async () => response({ message: { items: {} } }) }), { code: 'invalid-payload' });
});

test('reports unavailable service and rate limiting', async () => {
  await assert.rejects(search('query', { fetcher: async () => { throw new Error('offline'); } }), { code: 'unavailable' });
  await assert.rejects(search('query', { fetcher: async () => response({}, 429) }), { code: 'rate-limited' });
  await assert.rejects(search('query', { fetcher: async () => response({}, 503) }), { code: 'http-error' });
});

test('supports caller abort and timeout', async () => {
  const aborter = new AbortController();
  const pendingFetch = (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  const aborted = search('query', { fetcher: pendingFetch, signal: aborter.signal, timeoutMs: 1000 });
  aborter.abort();
  await assert.rejects(aborted, { code: 'aborted' });

  await assert.rejects(search('query', { fetcher: pendingFetch, timeoutMs: 10 }), { code: 'timeout' });
});
