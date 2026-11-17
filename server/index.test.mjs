import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractResponseText, validatePayload, loadConfig } from './index.mjs';

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
