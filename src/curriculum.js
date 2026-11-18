/* Textbook controller. Scientific explanations and equations live in chapter JSON. */
(function (global) {
  'use strict';
  const levels = { theory: '理论', approximation: '近似模型', empirical: '经验规律', concept: '概念' };
  const modelRoutes = { 'model.h2plus': ['workbench', 'h2plus-calculation'], 'model.n2o4': ['workbench', 'n2o4-physical-model'], electrochem: ['electrochem', 'electrochem'] };
  function strings(value) {
    if (typeof value === 'string' || typeof value === 'number') return [String(value)];
    if (Array.isArray(value)) return value.flatMap(strings);
    if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
    return [];
  }
  function searchRecords(chapters, books) {
    return chapters.flatMap(chapter => (chapter.sections || []).map(section => {
      const book = books.find(item => item.id === chapter.bookId) || {};
      const content = strings(section).join(' ');
      return { chapter, book, section, content, haystack: [book.title, chapter.title, content].join(' ').toLocaleLowerCase() };
    }));
  }
  function search(records, query) {
    const terms = String(query).trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return terms.length ? records.filter(record => terms.every(term => record.haystack.includes(term))) : [];
  }
  function targetHash(target) {
    if (target === 'learn' || Object.hasOwn(modelRoutes, target)) return '#' + target;
    if (/^(sc|pc)\.[a-z0-9]+\.[a-z0-9.]+$/i.test(target)) return '#learn/' + encodeURIComponent(target);
    return null;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { searchRecords, search, targetHash };
  const doc = global.document;
  if (!doc || !doc.getElementById('learn')) return;
  const $ = id => doc.getElementById(id);
  let catalog = null, records = [], selectedChapter = null, selectedSection = null;
  let query = '', loading = false, started = false, routeWarning = '', pendingSectionScroll = false;
  const chapters = new Map(), failures = new Map();
  function element(tag, text, className) {
    const node = doc.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  }
  function link(text, hash, className) {
    const node = element('a', text, className); node.href = hash; return node;
  }
  function button(text, action) {
    const node = element('button', text); node.type = 'button'; node.addEventListener('click', action); return node;
  }
  function clearQuery() {
    query = ''; $('curriculum-search').value = ''; $('curriculum-clear').hidden = true;
  }
  function chapterName(chapter) {
    return (chapter.number === 'appendix' ? '附录' : '第 ' + chapter.number + ' 章') + ' · ' + chapter.title;
  }
  function sourceText(source) {
    function range(values) { return Array.isArray(values) && values.length ? values.join('–') : '未录入'; }
    return '原书印刷页 ' + range(source?.printedPages) + ' · PDF 文件页 ' + range(source?.pdfPages);
  }
  function note(parent, label, text) {
    const p = element('p'); p.append(element('b', label + '：'), doc.createTextNode(String(text || '未录入'))); parent.append(p);
  }
  function block(title, className) {
    const node = element('section', undefined, 'curriculum-block' + (className ? ' ' + className : ''));
    node.append(element('h3', title)); return node;
  }
  function listBlock(title, values, ordered) {
    const node = block(title), list = element(ordered ? 'ol' : 'ul');
    for (const value of values || []) list.append(element('li', value));
    if (list.childNodes.length) node.append(list); else node.append(element('p', '本节未另列此项。'));
    return node;
  }
  function chapterOptions(bookId) { return catalog.chapters.filter(chapter => chapter.bookId === bookId); }
  function renderNavigation() {
    if (!catalog) return;
    const entry = catalog.chapters.find(chapter => chapter.id === selectedChapter) || catalog.chapters[0];
    if (!entry) return;
    const bookSelect = $('curriculum-book'), chapterSelect = $('curriculum-chapter');
    bookSelect.replaceChildren(...catalog.books.map(book => {
      const option = element('option', book.title); option.value = book.id; return option;
    }));
    bookSelect.disabled = false; bookSelect.value = entry.bookId;
    chapterSelect.replaceChildren(...chapterOptions(entry.bookId).map(chapter => {
      const state = failures.has(chapter.id) ? '（加载失败）' : chapters.has(chapter.id) ? '' : '（加载中）';
      const option = element('option', chapterName(chapter) + state); option.value = chapter.id; return option;
    }));
    chapterSelect.disabled = false; chapterSelect.value = entry.id;
    const nav = $('curriculum-sections'); nav.replaceChildren();
    for (const section of chapters.get(entry.id)?.sections || []) {
      const node = link(section.number + '　' + section.title, targetHash(section.id));
      if (section.id === selectedSection) { node.className = 'active'; node.setAttribute('aria-current', 'location'); }
      nav.append(node);
    }
  }
  function renderErrors() {
    const host = $('curriculum-errors'); host.replaceChildren(); host.hidden = !failures.size;
    if (!failures.size) return;
    host.append(element('b', catalog ? failures.size + ' 个章节尚未加载，已加载内容仍可使用。' : '教材目录暂时无法加载。'));
    const list = element('ul');
    for (const [id, reason] of failures) {
      const title = catalog?.chapters.find(chapter => chapter.id === id)?.title || '教材目录';
      list.append(element('li', title + '：' + reason));
    }
    const retry = button('重试未加载内容', () => load()); retry.disabled = loading;
    host.append(list, retry);
  }
  function renderStatus() {
    const total = catalog?.chapters.length || 0;
    $('curriculum-status').textContent = loading ? '正在加载教材内容：' + chapters.size + ' / ' + total + ' 章。' : catalog ? '已加载 ' + chapters.size + ' / ' + total + ' 章 · ' + records.length + ' 节' + (failures.size ? '；搜索范围暂不含未加载章节。' : ' · 可检索全部章节。') : '教材加载未完成，可重试。';
    $('curriculum-status').setAttribute('aria-busy', String(loading)); renderErrors();
  }
  function renderSearch() {
    const host = $('curriculum-main'), matches = search(records, query); host.replaceChildren();
    const head = element('div', undefined, 'curriculum-results-head');
    head.append(element('h3', '“' + query + '” · ' + matches.length + ' 个小节'), element('p', '范围：全部已加载章节。点击结果阅读完整说明。')); host.append(head);
    if (!matches.length) host.append(element('p', loading ? '当前已加载内容未匹配；章节加载完成后会更新。' : failures.size ? '当前已加载内容未匹配。部分章节加载失败，可先重试，或更换关键词。' : '没有匹配的小节。可缩短关键词，或使用教材中的概念名称。', 'curriculum-placeholder'));
    for (const record of matches) {
      const card = element('article', undefined, 'curriculum-search-result');
      card.append(element('small', record.book.title + ' / ' + record.chapter.title));
      const heading = element('h4'); heading.append(link(record.section.number + '　' + record.section.title, targetHash(record.section.id))); card.append(heading);
      const firstTerm = query.toLocaleLowerCase().split(/\s+/)[0], index = record.content.toLocaleLowerCase().indexOf(firstTerm), start = Math.max(0, index - 45);
      card.append(element('p', (start ? '…' : '') + record.content.slice(start, start + 180) + (record.content.length > start + 180 ? '…' : '')), element('small', sourceText(record.section.source))); host.append(card);
    }
  }
  function renderSection(chapter, section, book) {
    const article = element('article', undefined, 'curriculum-article'); article.id = 'curriculum-current';
    const heading = element('header', undefined, 'curriculum-article-head');
    heading.append(element('div', book.title + ' / ' + chapterName(chapter), 'curriculum-breadcrumb'), element('span', levels[section.level] || section.level, 'curriculum-level'));
    const title = element('h2', section.number + '　' + section.title); title.tabIndex = -1;
    heading.append(title, element('p', section.overview, 'curriculum-overview'), link('本节固定链接 ↗', targetHash(section.id), 'curriculum-permalink')); article.append(heading);
    const topics = block('知识点与解释');
    for (const topic of section.subtopics || []) {
      const item = element('div', undefined, 'curriculum-topic'); item.append(element('h4', topic.title), element('p', topic.explanation)); topics.append(item);
    }
    article.append(topics);
    const equations = block('方程、变量与适用条件');
    if (!section.equations?.length) equations.append(element('p', '本节以概念和结构关系为主，没有另列定量方程。'));
    for (const equation of section.equations || []) {
      const card = element('div', undefined, 'curriculum-equation'); card.append(element('h4', equation.label), element('pre', equation.expression));
      note(card, '变量、物理意义与单位', equation.meaning); note(card, '适用条件', equation.conditions); equations.append(card);
    }
    article.append(equations, listBlock('推理与推导', section.derivation, true));
    const boundary = element('div', undefined, 'curriculum-boundary-grid'); boundary.append(listBlock('基本假设与边界', section.assumptions), listBlock('易错点', section.pitfalls)); article.append(boundary);
    const checks = block('原创自测 · 先作答，再看解析');
    for (const [index, example] of (section.examples || []).entries()) {
      const item = element('div', undefined, 'curriculum-check'); item.append(element('h4', '自测 ' + (index + 1)), element('p', example.question));
      const answer = element('details'); answer.append(element('summary', '展开答案与解析'), element('p', example.answer)); item.append(answer); checks.append(item);
    }
    article.append(checks);
    const relations = block('知识连接与模型应用');
    if (!section.links?.length) relations.append(element('p', '本节尚未另列跨节连接。'));
    for (const relation of section.links || []) {
      const hash = targetHash(relation.target);
      const sectionReady = !hash?.startsWith('#learn/') || records.some(item => item.section.id === relation.target);
      if (hash && sectionReady) relations.append(link(relation.label + ' →', hash, 'curriculum-crosslink'));
      else relations.append(element('p', relation.label + '（关联章节待接入）'));
    }
    article.append(relations);
    const source = block('来源与核对', 'curriculum-source');
    source.append(element('p', [book.title, Array.isArray(book.authors) ? book.authors.join('、') : book.authors, book.edition].filter(Boolean).join(' · ')));
    source.append(element('p', sourceText(section.source)), element('p', '本章范围：' + sourceText(chapter.source)), element('p', book.sourceNote || '依据原书目录与正文编写原创教学重述。'));
    if (catalog.review) source.append(element('p', '内容审核状态：' + catalog.review.status + '。' + (catalog.review.note || '')));
    source.append(element('p', '以上为学习说明与原创自测，不代替原书正文、原题或独立科学核验。')); article.append(source);
    const index = chapter.sections.indexOf(section), nav = element('nav', undefined, 'curriculum-sequence'); nav.setAttribute('aria-label', '相邻小节');
    const previous = chapter.sections[index - 1], next = chapter.sections[index + 1];
    if (previous) nav.append(link('← ' + previous.number + ' ' + previous.title, targetHash(previous.id)));
    if (next) nav.append(link(next.number + ' ' + next.title + ' →', targetHash(next.id)));
    article.append(nav); return article;
  }
  function renderMain() {
    if (query) { renderSearch(); return; }
    const host = $('curriculum-main'); host.replaceChildren();
    if (routeWarning) host.append(element('p', routeWarning, 'curriculum-route-warning'));
    if (!catalog) { host.append(element('div', loading ? '正在加载教材目录……' : '教材目录暂不可用，请使用上方重试。', 'curriculum-placeholder')); return; }
    const entry = catalog.chapters.find(chapter => chapter.id === selectedChapter) || catalog.chapters[0];
    if (!entry) { host.append(element('p', '目录尚未收录章节。')); return; }
    const chapter = chapters.get(entry.id);
    if (!chapter) {
      const placeholder = element('div', undefined, 'curriculum-placeholder');
      placeholder.append(element('h3', chapterName(entry)), element('p', failures.has(entry.id) ? '本章加载失败。请重试，或选择其他已加载章节继续学习。' : '正在加载本章内容……'));
      if (failures.has(entry.id)) { const retry = button('重试未加载章节', () => load()); retry.disabled = loading; placeholder.append(retry); }
      host.append(placeholder); return;
    }
    const book = catalog.books.find(item => item.id === chapter.bookId) || {};
    const intro = element('div', undefined, 'curriculum-chapter-intro'); intro.append(element('h3', chapterName(chapter)), element('p', chapter.summary)); host.append(intro);
    const section = chapter.sections.find(item => item.id === selectedSection) || chapter.sections[0];
    if (section) host.append(renderSection(chapter, section, book));
  }
  function render() {
    const chapter = chapters.get(selectedChapter);
    if (chapter && !chapter.sections.some(section => section.id === selectedSection)) selectedSection = chapter.sections[0]?.id;
    renderStatus(); renderNavigation(); renderMain();
    if (pendingSectionScroll && !query && !routeWarning && $('curriculum-current')) {
      pendingSectionScroll = false;
      global.requestAnimationFrame(() => {
        const heading = $('curriculum-current')?.querySelector('h2');
        heading?.scrollIntoView({ block: 'start' }); heading?.focus({ preventScroll: true });
      });
    }
  }
  function pickChapter(id) {
    selectedChapter = id; routeWarning = ''; clearQuery();
    const section = chapters.get(id)?.sections[0];
    if (section) navigate(section.id); else { selectedSection = null; navigate('learn'); render(); }
  }
  function selectRouteSection() {
    const match = global.location.hash.match(/^#learn\/([^/?#]+)$/);
    if (!match) return;
    let id; try { id = decodeURIComponent(match[1]); } catch (_) { routeWarning = '该小节链接格式不完整，请从目录重新选择。'; return; }
    const record = records.find(item => item.section.id === id);
    if (record) { selectedChapter = record.chapter.id; selectedSection = id; routeWarning = ''; }
    else routeWarning = loading ? '正在查找链接中的小节：' + id : failures.size ? '暂时找不到小节 ' + id + '；部分章节尚未加载，请重试或从目录选择。' : '目录中没有小节 ' + id + '。可从左侧目录选择，或使用全文搜索。';
  }
  async function readJSON(path) {
    const response = await global.fetch(path);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return response.json();
  }
  function localChapterPath(path) { return typeof path === 'string' && /^data\/curriculum\/[a-z0-9-]+\.json$/i.test(path); }
  async function load() {
    if (loading) return;
    loading = true; started = true; renderStatus();
    try {
      if (!catalog) {
        const data = await readJSON('data/curriculum/index.json');
        if (!Array.isArray(data.books) || !Array.isArray(data.chapters) || !data.chapters.length) throw new Error('目录数据格式不完整');
        catalog = data; failures.delete('catalog'); selectedChapter ||= catalog.chapters[0].id;
      }
      const pending = catalog.chapters.filter(entry => !chapters.has(entry.id));
      // Recover each chapter separately; retain successful sibling chapters on retry.
      await Promise.allSettled(pending.map(async entry => {
        try {
          if (!localChapterPath(entry.path)) throw new Error('章节路径格式无效');
          const chapter = await readJSON(entry.path);
          if (chapter.id !== entry.id || !Array.isArray(chapter.sections) || !chapter.sections.length) throw new Error('章节数据格式不完整');
          chapters.set(entry.id, chapter); failures.delete(entry.id);
        } catch (error) { failures.set(entry.id, error.message || '网络读取失败'); }
        records = searchRecords(catalog.chapters.map(item => chapters.get(item.id)).filter(Boolean), catalog.books);
        selectRouteSection(); render();
      }));
    } catch (error) { failures.set('catalog', error.message || '网络读取失败'); }
    finally { loading = false; selectRouteSection(); render(); }
  }
  function activatePage(id) {
    const target = $(id); if (!target?.classList.contains('page')) return false;
    doc.querySelectorAll('.page').forEach(node => node.classList.toggle('active', node === target));
    doc.querySelectorAll('.tab').forEach(node => {
      const active = node.dataset.page === id; node.classList.toggle('active', active);
      if (active) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
    });
    return true;
  }
  function applyRoute() {
    const hash = global.location.hash.slice(1), isLearning = hash === 'learn' || hash.startsWith('learn/');
    if (isLearning) {
      pendingSectionScroll = hash.startsWith('learn/');
      activatePage('theory'); clearQuery(); routeWarning = ''; selectRouteSection(); render();
      if (!started) load();
      if (hash === 'learn') global.requestAnimationFrame(() => $('learn')?.scrollIntoView({ block: 'start' }));
    } else if (hash === 'theory') {
      activatePage('theory');
      if (!started) load();
    } else if (Object.hasOwn(modelRoutes, hash)) {
      const [pageId, anchor] = modelRoutes[hash]; activatePage(pageId);
      global.requestAnimationFrame(() => $(anchor)?.scrollIntoView({ block: 'start' }));
    } else if (hash) activatePage(hash);
    else activatePage('explore');
  }
  function navigate(target) {
    const hash = targetHash(target) || (Array.from(doc.querySelectorAll('.tab')).some(node => node.dataset.page === target) ? '#' + target : null);
    if (!hash) return;
    if (global.location.hash === hash) applyRoute(); else global.location.hash = hash;
  }
  $('curriculum-book').addEventListener('change', event => {
    const entry = chapterOptions(event.target.value)[0]; if (entry) pickChapter(entry.id);
  });
  $('curriculum-chapter').addEventListener('change', event => pickChapter(event.target.value));
  function runSearch() { query = $('curriculum-search').value.trim(); $('curriculum-clear').hidden = !query; renderMain(); }
  $('curriculum-search-form').addEventListener('submit', event => { event.preventDefault(); runSearch(); });
  let searchTimer;
  $('curriculum-search').addEventListener('input', () => { global.clearTimeout(searchTimer); searchTimer = global.setTimeout(runSearch, 140); });
  $('curriculum-clear').addEventListener('click', () => { clearQuery(); renderMain(); $('curriculum-search').focus(); });
  // app.js binds its handlers synchronously before this script; route all existing tabs too.
  doc.querySelectorAll('.tab').forEach(node => { node.onclick = () => navigate(node.dataset.page); });
  global.addEventListener('hashchange', applyRoute);
  global.CFCurriculum = Object.freeze({ navigate });
  applyRoute();
})(typeof window === 'undefined' ? globalThis : window);
