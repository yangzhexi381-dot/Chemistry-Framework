/* UI only: units, controls, readouts and plotting. Scientific equations live in models/. */
(function(){
  'use strict';
  const target=document.querySelector('#workbench .compact-model');
  if(!target || !window.CFModels?.n2o4IdealGas)return;
  const section=document.createElement('section');
  section.className='model-card physical-model';
  section.id='n2o4-physical-model';
  section.innerHTML=`
    <div class="model-heading"><div><div class="eyebrow">v0.4 · MODEL WITH SI UNITS · N₂O₄(g) ⇌ 2NO₂(g)</div>
      <h3>封闭容器内的气相解离：从物质的量到分压、反应商与时间演化</h3>
      <p>理想气体、恒温、恒容；通过明确的物料衡算与速率方程计算，所得数值不代表实验实测。</p></div><span class="model-tag">SI · 可验算</span></div>
    <div class="physical-controls">
      <label>温度 T（K）<input type="number" id="phys-T" value="298.15" min="100" max="1000" step="5"></label>
      <label>容器体积 V（L）<input type="number" id="phys-V" value="1" min="0.01" max="100" step="0.1"></label>
      <label>初始 N₂O₄（mmol）<input type="number" id="phys-n4" value="1" min="0" max="100" step="0.1"></label>
      <label>初始 NO₂（mmol）<input type="number" id="phys-n2" value="0.1" min="0" max="100" step="0.1"></label>
      <label>给定 K°(T)（无量纲）<input type="number" id="phys-K" value="0.2" min="0.00001" max="100" step="0.05"></label>
      <label>速率尺度 κ（mmol L⁻¹ s⁻¹）<input type="number" id="phys-kappa" value="0.5" min="0.00001" max="100" step="0.1"></label>
      <label>模拟总时长（s）<input type="number" id="phys-duration" value="1200" min="1" max="100000" step="100"></label>
      <div class="physical-actions"><button class="primary" id="phys-run">重新计算</button><button id="phys-reset" type="button">恢复示例参数</button></div>
    </div>
    <div class="physical-error" id="phys-error" role="alert" hidden></div>
    <div class="physical-metrics" aria-live="polite">
      <div><small>初始 Q/K°</small><strong id="phys-initial-q">—</strong></div>
      <div><small>最终 Q/K°</small><strong id="phys-final-q">—</strong></div>
      <div><small>最终总压（bar）</small><strong id="phys-pressure">—</strong></div>
      <div><small>终态 ΔᵣG（kJ mol⁻¹）</small><strong id="phys-dg">—</strong></div>
      <div><small>解析平衡 NO₂（mmol）</small><strong id="phys-equilibrium">—</strong></div>
      <div><small>模型末态与平衡差值（mmol）</small><strong id="phys-difference">—</strong></div>
    </div>
    <div class="physical-status" id="phys-status">点击“重新计算”开始。</div>
    <div class="physical-chartbox"><canvas id="phys-chart" height="260" aria-label="有单位的 N₂O₄ 与 NO₂ 物质的量随时间变化曲线"></canvas>
      <div class="physical-legend"><span><i class="physical-color-n4"></i>N₂O₄（mmol）</span><span><i class="physical-color-n2"></i>NO₂（mmol）</span><span class="muted">横轴：时间 / s</span></div></div>
    <div class="model-foot"><b>明确的模型：</b>pᵢ=nᵢRT/V；aᵢ=pᵢ/p°；Q=a(NO₂)²/a(N₂O₄)；ΔᵣG=RT ln(Q/K°)；
    r=κ[K°a(N₂O₄)−a(NO₂)²]，dn₄/dt=−Vr，dn₂/dt=2Vr。
    <br><b>边界：</b>p°=1 bar；κ 是人为指定、具有单位的现象学参数，并非查证的 N₂O₄ 反应速率常数。
    改变 T 时 K° 不会自动重新估计；此处每组 K° 均被视为指定温度下的输入。
    恒温恒容时，平衡态对应 Helmholtz 自由能极小，而 ΔᵣG=0 仍是反应平衡条件。
    未考虑非理想性、扩散、容器温度变化及光化学。</div>
    <p class="physical-doclink"><a href="https://github.com/yangzhexi381-dot/Chemistry-Framework/blob/main/docs/models/N2O4_IDEAL_GAS.md" target="_blank" rel="noopener noreferrer">查看模型推导、算法和验证边界</a></p>
  `;
  target.before(section);
  const $=s=>section.querySelector(s);
  const inputIds=['T','V','n4','n2','K','kappa','duration'];
  const defaults=[298.15,1,1,.1,.2,.5,1200];
  let latest=null;
  const read=()=>{
    const numbers=inputIds.map(k=>Number($('#phys-'+k).value));
    if(inputIds.some(k=>$('#phys-'+k).value.trim()===''))throw new RangeError('所有输入项都需要填写数值');
    const [T,litres,n4mmol,n2mmol,K,kappa,durationSec]=numbers;
    return {T,volumeM3:litres*1e-3,n4:n4mmol*1e-3,n2:n2mmol*1e-3,K,kappa,durationSec,points:300};
  };
  const fmt=(x,d=4)=>Number.isFinite(x)?x.toFixed(d):x===Infinity?'∞':x===-Infinity?'−∞':'—';
  function draw(data){
    const canvas=$('#phys-chart');const bounds=canvas.getBoundingClientRect();
    if(bounds.width<20)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=bounds.width,h=260, ctx=canvas.getContext('2d');
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const L=52,R=15,T=17,B=37,W=w-L-R,H=h-T-B;
    const rows=data.rows, total=rows[rows.length-1].timeSec;
    const yMax=Math.max(...rows.map(r=>Math.max(r.n4Mol,r.n2Mol)))*1000*1.10||1;
    ctx.font='11px sans-serif';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y=T+i*H/4;
      ctx.strokeStyle='#dfe7df';ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(w-R,y);ctx.stroke();
      ctx.fillStyle='#61776b';ctx.fillText(fmt(yMax*(1-i/4),2),3,y+4);
    }
    for(let i=0;i<=4;i++){
      const t=total*i/4,x=L+i*W/4;
      ctx.fillStyle='#61776b';ctx.fillText(fmt(t,0),x-9,h-15);
    }
    function curve(key,color){
      ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
      rows.forEach((r,i)=>{const x=L+r.timeSec/total*W,y=T+H-(r[key]*1000/yMax)*H;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});
      ctx.stroke();
    }
    curve('n4Mol','#277859');curve('n2Mol','#7965aa');
    ctx.fillStyle='#61776b';ctx.fillText('n / mmol',4,10);ctx.fillText('t / s',w-39,h-2);
  }
  function run(){
    const msg=$('#phys-error');msg.hidden=true;
    try{
      const data=window.CFModels.n2o4IdealGas.simulate(read());latest=data;
      const first=data.rows[0],last=data.final,eq=data.equilibrium;
      $('#phys-initial-q').textContent=fmt(first.ratio,4);
      $('#phys-final-q').textContent=fmt(last.ratio,4);
      $('#phys-pressure').textContent=fmt(last.pTotalPa/100000,5);
      $('#phys-dg').textContent=fmt(last.deltaGJMol/1000,4);
      $('#phys-equilibrium').textContent=fmt(eq.n2Mol*1000,4);
      $('#phys-difference').textContent=fmt(Math.abs(last.n2Mol-eq.n2Mol)*1000,4);
      const nearEq=Math.abs(last.ratio-1)<0.01;
      const initial=first.rateMolPerSec>0?'起始净正向（生成 NO₂）':first.rateMolPerSec<0?'起始净逆向（生成 N₂O₄）':'初始恰好平衡';
      $('#phys-status').textContent=`${initial}；${nearEq?'终态已在 1% 误差阈值内接近平衡':'终态尚未满足 1% 平衡阈值'}。积分步数：${data.numerical.totalIntegrationSteps.toLocaleString()}。`;
      requestAnimationFrame(()=>draw(data));
    }catch(e){latest=null;msg.textContent='计算失败：'+e.message;msg.hidden=false;$('#phys-status').textContent='请修改输入参数后重新计算。';}
  }
  $('#phys-run').addEventListener('click',run);
  $('#phys-reset').addEventListener('click',()=>{inputIds.forEach((k,i)=>$('#phys-'+k).value=defaults[i]);run();});
  inputIds.forEach(k=>$('#phys-'+k).addEventListener('change',run));
  window.addEventListener('resize',()=>{if(latest)requestAnimationFrame(()=>draw(latest))});
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='workbench'&&latest)requestAnimationFrame(()=>draw(latest))}));
  run();
})();
