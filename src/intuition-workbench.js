(function (global) {
  const storageKey = 'chemistry-framework-inquiries';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));

  function init({nodes, relations, examples, relationLabels}) {
    const $ = id => document.getElementById(id);
    const input = $('intuition');
    const context = $('system');
    const host = $('analysis');
    const index = global.CFIntuitionAnalysis.createIndex(nodes, relations);
    const savedHost = $('saved-inquiries');
    const initial = host.innerHTML;
    let records = [];
    let current = null;
    let pending = null;

    try {
      const stored = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(stored)) records = stored.filter(item => typeof item?.user_intuition === 'string');
    } catch (_) {}

    function conceptLink(node, text = node.title) {
      return '<a class="concept-link" href="#concept/' + encodeURIComponent(node.id) + '">' + escape(text) + '</a>';
    }

    function cancelSearch() {
      pending?.abort();
      pending = null;
    }

    function invalidate() {
      if (!current) return;
      cancelSearch();
      current = null;
      host.innerHTML = initial;
    }

    function renderSaved() {
      $('saved-count').textContent = '(' + records.length + ')';
      savedHost.innerHTML = records.length ? [...records].reverse().map(record =>
        '<button type="button" class="saved-item" data-id="' + escape(record.id) + '"><span>' +
        escape(record.user_intuition.trim().split('\n')[0].slice(0,80)) + '</span><small>待核验</small></button>'
      ).join('') : '<p class="fineprint">还没有保存的查询。</p>';
    }

    function renderKnowledge(result) {
      if (!result.matches.length) return '<p>当前知识网络没有识别到足够明确的概念。可补充化学名称、物理量或实验条件后再分析，也可以直接编辑检索词。</p>';
      const concepts = result.matches.map(({node, hits}) => {
        const reasons = hits.slice(0,3).map(hit => escape(hit.name) + (hit.inQuestion ? '' : '（来自体系条件）'));
        const boundary = (Array.isArray(node.limitations) ? node.limitations : [node.limitations]).filter(Boolean)[0];
        return '<li>' + conceptLink(node) + '<small>命中 ' + reasons.join('、') + '</small><p>' +
          escape(node.statement) + '</p>' + (boundary ? '<p class="inquiry-boundary">适用边界　' + escape(boundary) + '</p>' : '') + '</li>';
      }).join('');
      const paths = result.relations.map(({relation, matched, endpoints}) => {
        const conditions = (relation.conditions || []).map(escape).join('；');
        return '<li><div class="concept-links">' + endpoints.map(id =>
          conceptLink(index.byId.get(id))).join('') + '</div><p><strong>' +
          escape(relationLabels[relation.type] || relation.type) + ' · ' +
          (matched.length > 1 ? '连接已命中概念' : '由命中概念延伸') + '</strong>　' + escape(relation.claim) +
          '</p>' + (conditions ? '<p class="inquiry-boundary">成立条件　' + conditions + '</p>' : '') + '</li>';
      }).join('');
      return '<ul class="inquiry-evidence">' + concepts + '</ul><h5>网络已有关系</h5>' +
        (paths ? '<ul class="inquiry-evidence">' + paths + '</ul>' : '<p>当前网络还没有可显示的相关关系。</p>');
    }

    const retrievalCopy = {
      not_started:'尚未检索。',
      loading:'正在查询 Crossref…',
      empty:'检索完成。未找到可展示的题录，可换一组检索词重试。',
      failed:'暂时无法完成检索。保留当前分析，可再次尝试。',
      rate_limited:'Crossref 当前限制查询频率，请稍后重试。',
      offline:'浏览器当前离线。恢复网络后可重试。'
    };

    function renderLiterature() {
      const {state, items, searchedQuery} = current.retrieval;
      const button = $('literature-search');
      button.textContent = state === 'loading' ? '检索中…' : '联网检索';
      button.disabled = state === 'loading';
      $('literature-status').textContent = state === 'found'
        ? 'Crossref 返回 ' + items.length + ' 条题录。阅读对应原文并核对适用条件后，才能形成证据判断。'
        : retrievalCopy[state];
      $('literature-used-query').textContent = searchedQuery ? '当次检索词　' + searchedQuery : '';
      $('literature-results').innerHTML = items.map(item => '<li><a href="' + escape(item.url) +
        '" target="_blank" rel="noopener noreferrer">' + escape(item.title) + '</a><small>' +
        [item.year, item.source, item.doi].filter(Boolean).map(escape).join(' · ') + '</small></li>').join('');
    }

    function renderResult(focus) {
      const {result, record} = current;
      const snippets = result.clauses.map(({text, checks}) => '<li><p>' + escape(text) +
        '</p><ul>' + checks.map(check => '<li>' + escape(check) + '</li>').join('') + '</ul></li>').join('');
      const keywords = result.keywords.map(term => '<li>' + escape(term) + '</li>').join('');
      host.innerHTML = `<div class="analysis-title"><h3 id="inquiry-result-heading" tabindex="-1">原命题的检查线索</h3><span class="assessment">待核验</span></div>
        <div class="analysis-block">
          <h4>原始问题</h4><p class="inquiry-original">${escape(result.original)}</p>
          ${result.context.trim() ? '<p class="inquiry-boundary">体系与条件　' + escape(result.context) + '</p>' : ''}
          ${keywords ? '<h5>识别到的关键词</h5><ul class="inquiry-keywords">' + keywords + '</ul>' : ''}
        </div>
        <div class="analysis-block"><h4>关联知识网络</h4>${renderKnowledge(result)}</div>
        <div class="analysis-block"><h4>逐句核对</h4><ol class="inquiry-clauses">${snippets}</ol></div>
        <div class="analysis-block">
          <h4>联网查文献</h4>
          <form id="literature-form" class="literature-form">
            <label class="field-label" for="literature-query">检索词（可编辑）</label>
            <div class="literature-controls">
              <input id="literature-query" required maxlength="160" aria-describedby="literature-disclosure" value="${escape(current.retrieval.query)}">
              <button id="literature-search" type="submit" class="primary">联网检索</button>
            </div>
            <p id="literature-disclosure" class="fineprint">点击后向 Crossref 发送此栏检索词。可先移除未公开的名称或数据。</p>
          </form>
          <p id="literature-status" role="status"></p>
          <p id="literature-used-query" class="inquiry-boundary"></p>
          <ul id="literature-results" class="inquiry-evidence"></ul>
        </div>
        <div class="save-row"><small id="inquiry-save-status" role="status">${record ? '已载入本地记录' : ''}</small><button type="button" id="save-inquiry">保存查询记录</button></div>`;
      $('literature-query').addEventListener('input', event => event.target.setCustomValidity(''));
      $('literature-form').addEventListener('submit', searchLiterature);
      $('save-inquiry').addEventListener('click', save);
      renderLiterature();
      if (focus && global.matchMedia('(max-width: 760px)').matches) $('inquiry-result-heading').focus();
    }

    function validStoredItems(items) {
      if (!Array.isArray(items)) return [];
      return items.slice(0,10).filter(item => typeof item?.title === 'string' &&
        typeof item.doi === 'string' && /^10\.\d{4,9}\/\S+$/i.test(item.doi))
        .map(item => ({...item, url:'https://doi.org/' + item.doi.split('/').map(encodeURIComponent).join('/')}));
    }

    function analyze(record = null, focus = true) {
      if (!input.value.trim()) {
        input.setCustomValidity('请输入想检验的化学问题。');
        input.reportValidity();
        return;
      }
      cancelSearch();
      const result = global.CFIntuitionAnalysis.analyze(input.value, context.value, index);
      const saved = record?.literature;
      const items = validStoredItems(saved?.items);
      const hasStoredQuery = typeof saved?.searchedQuery === 'string' && saved.searchedQuery.trim();
      const state = hasStoredQuery ? (items.length ? 'found' : saved.state === 'empty' ? 'empty' : 'not_started') : 'not_started';
      const retrieval = {state, items, searchedQuery:hasStoredQuery ? saved.searchedQuery : '',
        query:typeof saved?.query === 'string' ? saved.query : result.searchQuery};
      current = {result, retrieval, record};
      renderResult(focus);
    }

    async function searchLiterature(event) {
      event.preventDefault();
      const queryInput = $('literature-query');
      const query = queryInput.value.trim();
      if (!query) {
        queryInput.setCustomValidity('请输入至少一个检索词。');
        queryInput.reportValidity();
        return;
      }
      cancelSearch();
      const controller = new AbortController();
      const state = current;
      pending = controller;
      state.retrieval = {query, searchedQuery:query, state:'loading', items:[]};
      renderLiterature();
      try {
        const items = await global.IntuitionLiterature.search(query, {signal:controller.signal});
        if (pending !== controller) return;
        state.retrieval = {query, searchedQuery:query, state:items.length ? 'found' : 'empty', items};
      } catch (error) {
        if (pending !== controller) return;
        const failure = global.navigator.onLine === false ? 'offline' : error.code === 'rate-limited' ? 'rate_limited' : 'failed';
        state.retrieval = {query, searchedQuery:query, state:failure, items:[]};
      } finally {
        if (pending === controller) {
          pending = null;
          renderLiterature();
        }
      }
    }

    function save() {
      const {result, retrieval, record} = current;
      const snapshot = {
        id:record?.id || 'inq.local.' + (global.crypto?.randomUUID?.() || Date.now().toString(36)),
        title:result.original.trim().split('\n')[0].slice(0,80),
        user_intuition:result.original,
        context:{system:result.context},
        linked_nodes:result.matches.map(match => match.id),
        keywords:result.keywords,
        claims:result.clauses.map(({text, checks}) => ({text, checks})),
        literature:{...retrieval, state:retrieval.state === 'loading' ? 'not_started' : retrieval.state,
          query:$('literature-query').value.trim()},
        assessment:{status:'not_assessed', retrieval_state:retrieval.state === 'loading' ? 'not_started' : retrieval.state}
      };
      const next = record ? records.map(item => item === record ? snapshot : item) : [...records, snapshot];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        records = next;
        current.record = snapshot;
        renderSaved();
        $('inquiry-save-status').textContent = '已保存在此浏览器。';
      } catch (_) {
        $('inquiry-save-status').textContent = '未能保存。请检查浏览器存储设置后重试。';
      }
    }

    $('case-list').innerHTML = examples.map(example =>
      '<button type="button" class="case-btn" data-case="' + escape(example.id) + '">' +
      '<small>' + escape(example.tag) + '</small>' + escape(example.title) + '</button>').join('');
    $('case-list').addEventListener('click', event => {
      const button = event.target.closest('[data-case]');
      if (!button) return;
      input.value = examples.find(example => example.id === button.dataset.case).title;
      context.value = '';
      input.setCustomValidity('');
      invalidate();
      input.focus();
    });
    $('intuit-form').addEventListener('submit', event => {
      event.preventDefault();
      const record = current?.record;
      analyze(record && record.user_intuition === input.value ? record : null);
    });
    input.addEventListener('input', () => { input.setCustomValidity(''); invalidate(); });
    context.addEventListener('input', invalidate);
    savedHost.addEventListener('click', event => {
      const button = event.target.closest('[data-id]');
      const record = button && records.find(item => item.id === button.dataset.id);
      if (!record) return;
      input.value = record.user_intuition;
      const system = record.context?.system;
      context.value = system === '由用户补充' ? '' : (system || '');
      input.setCustomValidity('');
      analyze(record);
    });
    $('analyze').disabled = false;
    renderSaved();
  }

  global.CFIntuitionWorkbench = {init};
})(window);
