/* Optional AI service: never enter your OpenAI API key into this public webpage. */
(() => {
  const $ = selector => document.querySelector(selector);
  const start = $('#cf-ai-analyze');
  if (!start) return;

  function show(message, result = false) {
    const panel = $('#analysis');
    panel.replaceChildren();
    const header = document.createElement('div');
    header.className = 'analysis-title';
    const title = document.createElement('h3');
    title.textContent = result ? 'AI 化学命题审查' : 'AI 服务提示';
    header.append(title);
    if (result) {
      const badge = document.createElement('span');
      badge.className = 'assessment';
      badge.textContent = '模型生成 · 尚未核验';
      header.append(badge);
    }
    const block = document.createElement('div');
    block.className = 'analysis-block';
    const para = document.createElement('p');
    para.className = 'ai-analysis-text';
    para.textContent = message;
    block.append(para);
    panel.append(header, block);
  }

  start.addEventListener('click', async () => {
    const hypothesis = $('#intuition').value.trim();
    const system = $('#system').value.trim();
    const endpoint = $('#cf-api-endpoint').value.trim();
    const token = $('#cf-api-token').value;
    const status = $('#cf-ai-status');

    if (!hypothesis) { $('#intuition').focus(); status.textContent = '请先填写命题。'; return; }
    if (!endpoint || !token) { status.textContent = '请填写已部署的后端地址与 CF 访问令牌。'; return; }

    let url;
    try {
      const base = new URL(endpoint);
      if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) {
        throw new Error('非本机服务必须使用 HTTPS。');
      }
      url = new URL('/api/analyze', base);
    } catch (err) { status.textContent = err.message || '后端地址无效。'; return; }

    start.disabled = true;
    status.textContent = '正在请求 AI 分析…';
    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ hypothesis, system })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '服务响应异常：' + response.status);
      show(payload.analysis, true);
      status.textContent = '分析已返回；没有执行文献检索或独立数值核验。';
    } catch (err) {
      show('AI 服务暂时不可用。仍可使用上方“分析命题”进行离线规则审查。\n' + (err.message || '未知错误'));
      status.textContent = '调用失败（不会影响离线模块）。';
    } finally {
      start.disabled = false;
    }
  });
})();
