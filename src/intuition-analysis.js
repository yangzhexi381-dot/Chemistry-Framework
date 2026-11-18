(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CFIntuitionAnalysis = api;
})(globalThis, function () {
  const generic = new Set([
    '化学', '反应', '理论', '模型', '体系', '条件', '结构', '电化学', '物理化学', '量子化学',
    '结构化学', '可视化模型', '电池体系', '动力学', '热力学', '机理', '测量', '证据链',
    '反证', '选择性', '第十一章', '标准态', '可视化', '问题', '结果', '原因', '关系',
    '情况', '分析', '影响', '有关', '可以', '是否', '一定', '改变', '假设', '就是',
    '只有', '怎么', '如何', '哪些', '什么', '可能', '如果', '那么', '因此', '但是',
    '为什么', '我的', '想法', '验证', '今天', '哪一项', '什么样', '这样', '那样',
    '怎么回事', '不能', '没有', '有没有', '更高', '更快', '选择', '需要'
  ]);
  const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase()
    .replace(/[−–—]/g, '-').replace(/\s+/g, ' ').trim();
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh', {granularity:'word'}) : null;
  const han = /\p{Script=Han}/u;

  function useful(term) {
    return term.length >= 2 && !generic.has(term) && /\p{L}/u.test(term);
  }

  function keywordPattern(term) {
    const leading = /^[a-z0-9]/.test(term) ? '(?<![a-z0-9])' : '';
    const trailing = /[a-z0-9+-]$/.test(term) ? '(?![a-z0-9+-])' : '';
    return new RegExp(leading + escapeRegExp(term) + trailing, 'u');
  }

  function createIndex(nodes, relations) {
    const terms = new Map();
    const byId = new Map(nodes.map(node => [node.id, node]));
    for (const node of nodes) {
      const nodeTerms = new Map();
      const fields = [
        [node.search_aliases || [], 5], [[node.title, node.graph_label, node.formula], 4],
        [node.tags || [], 2]
      ];
      for (const [names, weight] of fields) {
        for (const name of names) {
          const term = normalize(name);
          if (useful(term) && !nodeTerms.has(term)) nodeTerms.set(term, {name, weight});
        }
      }
      for (const [term, entry] of nodeTerms) {
        if (!terms.has(term)) terms.set(term, {term, pattern:keywordPattern(term), nodes:[]});
        terms.get(term).nodes.push({id:node.id, ...entry});
      }
    }
    return {byId, terms:[...terms.values()], relations};
  }

  function matchNodes(question, context, index) {
    const matches = new Map();
    for (const {term, pattern, nodes} of index.terms) {
      const inQuestion = pattern.test(question);
      if (!inQuestion && !pattern.test(context)) continue;
      for (const {id, name, weight} of nodes) {
        const match = matches.get(id) || {id, hits:[]};
        match.hits.push({term, name, inQuestion, weight:weight / Math.sqrt(nodes.length)});
        matches.set(id, match);
      }
    }
    return [...matches.values()].map(match => {
      match.hits.sort((a,b) => b.term.length-a.term.length || b.weight-a.weight);
      const distinct = match.hits.filter((hit, i, hits) => !hits.slice(0,i).some(other =>
        other.inQuestion === hit.inQuestion && other.term.includes(hit.term) && other.weight >= hit.weight));
      const score = distinct.reduce((total, hit) => total + hit.weight * (hit.inQuestion ? 1 : .6), 0);
      return {id:match.id, node:index.byId.get(match.id), hits:distinct, score};
    }).filter(match => match.score >= 2).sort((a,b) => b.score-a.score).slice(0,8);
  }

  function matchRelations(matches, index) {
    const weights = new Map(matches.map(match => [match.id, match.score]));
    return index.relations.map(relation => {
      const endpoints = [...relation.premises, relation.conclusion];
      const matched = endpoints.filter(id => weights.has(id));
      return {relation, matched, endpoints, score:matched.reduce((sum,id) => sum + weights.get(id), 0)};
    }).filter(item => item.matched.length > 0 && item.endpoints.every(id => index.byId.has(id)))
      .sort((a,b) => b.matched.length-a.matched.length || b.score-a.score)
      .slice(0,4);
  }

  function fallbackTerms(text) {
    const candidates = text.match(/[a-zA-Z][a-zA-Z0-9₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻+-]?/gu) || [];
    const parts = segmenter ? [...segmenter.segment(text)].filter(part => part.isWordLike).map(part => part.segment)
      : text.match(/\p{Script=Han}{2,12}/gu) || [];
    return [...candidates, ...parts.filter(word => han.test(word) || /[δΔ]/u.test(word))]
      .filter(word => useful(normalize(word)) && !/^(what|why|when|does|the|and|for|with|how|only)$/i.test(word))
      .sort((a,b) => Number(han.test(a))-Number(han.test(b)) || b.length-a.length);
  }

  function uniqueTerms(values) {
    const known = new Set();
    return values.filter(value => {
      const term = normalize(value);
      if (!term || known.has(term)) return false;
      known.add(term);
      return true;
    });
  }

  function inspectClauses(original) {
    return (original.match(/[^。！？!?\n；;]+[。！？!?；;]?/g) || []).map(text => text.trim())
      .filter(Boolean).map(text => {
        const checks = [];
        if (/[≤≥=<>≈≠]|恒温|恒压|标准态/.test(text)) checks.push('式子里的量如何定义？符号约定与成立条件是什么？');
        if (/只取决于|仅取决于|一定|必然|只要|等同|等价|就是|意味着|能否推出/.test(text)) checks.push('这一步用了哪些额外假设？保持前提时，能否找到结论不成立的情形？');
        if (/违反|不满足|第二定律|热力学定律/.test(text)) checks.push('体系边界画在哪里？纳入外部驱动以及能量、熵交换后，还能得到同一判断吗？');
        if (!checks.length) checks.push('这句话要比较或预测什么？需要哪些条件、可观测量或独立证据？');
        return {text, checks};
      });
  }

  function analyze(original, context, index) {
    const matches = matchNodes(normalize(original), normalize(context), index);
    const recognized = uniqueTerms(matches.flatMap(match => match.hits.map(hit => hit.name)));
    const suggested = uniqueTerms(matches.filter(match => match.hits.some(hit => hit.inQuestion))
      .flatMap(match => match.node.literature_terms?.slice(0,1) || [match.hits[0].name]));
    const extra = fallbackTerms(original).filter(word => !recognized.some(term => normalize(term).includes(normalize(word))));
    const keywords = recognized.length ? recognized.slice(0,12) : uniqueTerms(extra).slice(0,8);
    const searchTerms = suggested.length ? suggested.slice(0,3) : uniqueTerms(extra).slice(0,5);
    return {
      original, context, keywords, matches, relations:matchRelations(matches,index),
      clauses:inspectClauses(original), searchQuery:searchTerms.join(' ').slice(0,160)
    };
  }

  return {analyze, createIndex};
});
