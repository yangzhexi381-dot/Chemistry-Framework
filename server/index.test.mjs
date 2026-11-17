import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { extractResponseText, validatePayload, loadConfig, makeHandler } from './index.mjs';

test('requires a non-empty hypothesis and bounds user-controlled fields', () => {
  assert.deepEqual(validatePayload({ hypothesis: '  Q < K  ', system: ' gas ' }), { hypothesis: 'Q < K', system: 'gas' });
  assert.throws(() => validatePayload({ hypothesis: '' }));
  assert.throws(() => validatePayload({ hypothesis: 'x'.repeat(3001) }));
  assert.throws(() => validatePayload({ hypothesis: 'test', system: 42 }));
});

test('parses Responses API text without inventing a result', () => {
  const sample = { output: [{ type: 'message', content: [{ type: 'output_text', text: '分析内容' }] }] };
  assert.equal(extractResponseText(sample), '分析内容');
  assert.equal(extractResponseText({ output: [] }), '');
});

test('refuses startup without secrets and checks CORS origin format', () => {
  assert.throws(() => loadConfig({ OPENAI_API_KEY: 'test' }));
  const c = loadConfig({
    OPENAI_API_KEY: 'test',
    CF_ACCESS_TOKEN: '1234567890abcdefghijklmnop',
    CF_ALLOWED_ORIGINS: 'http://localhost:8000,https://yangzhexi381-dot.github.io'
  });
  assert.equal(c.allowedOrigins.length, 2);
  assert.throws(() => loadConfig({
    OPENAI_API_KEY: 'test',
    CF_ACCESS_TOKEN: '1234567890abcdefghijklmnop',
    CF_ALLOWED_ORIGINS: 'https://example.com/some-path'
  }));
});

test('HTTP bridge enforces origin and token and calls a mocked upstream only when authorized', async () => {
  let calls = 0;
  const config = {
    apiKey: 'server-secret-do-not-send-to-client',
    accessToken: '1234567890abcdefghijklmnop',
    allowedOrigins: ['http://localhost:8000'],
    model: 'test-model'
  };
  const fakeFetch = async (url, options) => {
    calls += 1;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, 'Bearer ' + config.apiKey);
    const request = JSON.parse(options.body);
    assert.equal(request.store, false);
    return { ok: true, json: async () => ({ output: [{ content: [{ type: 'output_text', text: '待核验分析' }] }] }) };
  };
  const server = createServer(makeHandler(config, fakeFetch));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = 'http://127.0.0.1:' + server.address().port + '/api/analyze';
  try {
    const denied = await fetch(url, { method: 'POST', headers: { Origin: 'https://unknown.example', Authorization: 'Bearer ' + config.accessToken } });
    assert.equal(denied.status, 403);
    const unauthorized = await fetch(url, { method: 'POST', headers: { Origin: 'http://localhost:8000' } });
    assert.equal(unauthorized.status, 401);
    assert.equal(calls, 0);
    const allowed = await fetch(url, {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:8000',
        Authorization: 'Bearer ' + config.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ hypothesis: 'Q < K 时反应的 Gibbs 能如何变化？' })
    });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8000');
    const data = await allowed.json();
    assert.equal(data.analysis, '待核验分析');
    assert.equal(data.evidence_status, 'not_verified');
    assert.equal(data.retrieval_performed, false);
    assert.equal(calls, 1);
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});
