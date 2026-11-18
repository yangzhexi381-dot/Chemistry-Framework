(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IntuitionLiterature = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const API = 'https://api.crossref.org/works';
  const DEFAULT_TIMEOUT_MS = 12000;
  const MAX_RESULTS = 10;

  function makeError(message, code) {
    const error = new Error(message);
    error.name = 'LiteratureSearchError';
    error.code = code;
    return error;
  }

  function canonicalDoi(value) {
    if (typeof value !== 'string') return null;
    let doi = value.trim();
    doi = doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
    try { doi = decodeURIComponent(doi); } catch (_) { return null; }
    return /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi : null;
  }

  function makeUrl(doi) {
    return 'https://doi.org/' + doi.split('/').map(encodeURIComponent).join('/');
  }

  function yearFrom(item) {
    for (const key of ['published-print', 'published-online', 'issued', 'created']) {
      const parts = item[key] && item[key]['date-parts'];
      if (Array.isArray(parts) && Array.isArray(parts[0])) {
        const year = Number(parts[0][0]);
        if (Number.isInteger(year) && year > 0) return year;
      }
    }
    return null;
  }

  async function search(query, options) {
    const opts = options || {};
    if (typeof query !== 'string' || !query.trim()) {
      throw makeError('Search keywords must be a non-empty string.', 'invalid-query');
    }
    const fetcher = opts.fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    if (typeof fetcher !== 'function') throw makeError('Fetch is unavailable in this environment.', 'unavailable');
    const timeoutMs = opts.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : Number(opts.timeoutMs);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw makeError('timeoutMs must be a positive number.', 'invalid-timeout');
    if (typeof AbortController !== 'function') throw makeError('AbortController is unavailable in this environment.', 'unavailable');
    if (opts.signal && opts.signal.aborted) throw makeError('Search was aborted.', 'aborted');

    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort();
    if (opts.signal) opts.signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    const params = new URLSearchParams({ 'query.bibliographic': query.trim(), rows: String(MAX_RESULTS) });

    try {
      let response;
      try {
        response = await fetcher(`${API}?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
      } catch (error) {
        if (timedOut) throw makeError('Crossref search timed out.', 'timeout');
        if ((opts.signal && opts.signal.aborted) || controller.signal.aborted) throw makeError('Search was aborted.', 'aborted');
        throw makeError('Crossref could not be reached.', 'unavailable');
      }
      if (!response || typeof response.status !== 'number' || typeof response.json !== 'function') {
        throw makeError('Crossref returned an invalid response.', 'invalid-response');
      }
      if (response.status === 429) throw makeError('Crossref rate limit reached; try again later.', 'rate-limited');
      if (!response.ok) throw makeError(`Crossref request failed (HTTP ${response.status}).`, 'http-error');

      let payload;
      try { payload = await response.json(); }
      catch (_) { throw makeError('Crossref returned invalid JSON.', 'invalid-payload'); }
      if (!payload || !payload.message || !Array.isArray(payload.message.items)) {
        throw makeError('Crossref returned an invalid search payload.', 'invalid-payload');
      }
      return payload.message.items.slice(0, MAX_RESULTS).flatMap((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        const doi = canonicalDoi(item.DOI);
        const title = Array.isArray(item.title) ? item.title.find((entry) => typeof entry === 'string' && entry.trim()) : null;
        if (!doi || !title) return [];
        const sources = Array.isArray(item['container-title']) ? item['container-title'] : [];
        return [{
          title: title.trim(),
          doi,
          year: yearFrom(item),
          source: sources.find((entry) => typeof entry === 'string' && entry.trim())?.trim() || item.publisher || '',
          url: makeUrl(doi)
        }];
      });
    } finally {
      clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
    }
  }

  return { search, MAX_RESULTS };
});
