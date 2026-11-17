/* Interface only: all orbital integrals, energies and density live in models/h2plus.js. */
(function(){
  'use strict';
  const model=window.CFModels?.h2plus;
  const anchor=document.querySelector('#orbital-visual')?.closest('.model-card');
  if(!model||!anchor)return;
  const section=document.createElement('section');
  section.className='model-card physical-model';section.id='h2plus-calculation';
  section.innerHTML=`<div class="model-heading"><div><div class="eyebrow">QUANTUM CALCULATION · H₂⁺ · MINIMAL 1s LCAO</div>
    <h3>由 Hamiltonian 求解成键：H₂⁺ 势能与近似电子密度</h3>
    <p>一个电子、两个固定质子；氢原子 1s 基函数指数固定为 1/a₀。解析积分求解 Hc=εSc，再加入核间排斥。</p></div><span class="model-tag">模型内可验证</span></div>
    <div class="physical-controls">
      <label>核间距 R（a₀ / bohr）<input id="h2-R" type="number" min="0.1" max="100" step="0.1" value="2"></label>
      <label>密度截面对应态<select id="h2-state"><option value="bonding">σg 成键态</option><option value="antibonding">σu 反键态</option></select></label>
      <div class="physical-actions"><button class="primary" id="h2-run">计算 H₂⁺</button><button id="h2-reset">恢复 R=2</button></div>
    </div><div id="h2-error" class="physical-error" role="alert" hidden></div>
    <div class="physical-metrics" aria-live="polite">
      <div><small>重叠 S</small><strong id="h2-S">—</strong></div>
      <div><small>电子能 εg / Eh</small><strong id="h2-electronic">—</strong></div>
      <div><small>核间排斥 / Eh</small><strong id="h2-repulsion">—</strong></div>
      <div><small>总能 Eg / Eh</small><strong id="h2-Eg">—</strong></div>
      <div><small>总能 Eu / Eh</small><strong id="h2-Eu">—</strong></div>
      <div><small>扫描最低点 R / a₀</small><strong id="h2-min">—</strong></div>
    </div>
    <div class="physical-chartbox"><svg id="h2-energy" viewBox="0 0 600 280" role="img" aria-label="H₂⁺ 成键与反键总势能曲线，包含核间排斥"></svg>
    <p class="physical-legend">绿色：Eg　紫色：Eu　虚线：H + H⁺ 解离极限 −0.5 Eh；曲线范围 1–10 a₀。</p></div>
    <div class="physical-chartbox"><svg id="h2-density" viewBox="0 0 600 240" role="img" aria-label="H₂⁺ 核间轴上的近似电子数密度截面"></svg>
    <p class="physical-legend">ρ(x,0,0)=|ψ(x,0,0)|²，单位 a₀⁻³；这是三维密度的轴向截面，曲线下面积不是电子总数。竖线标出两核位置。</p></div>
    <p id="h2-status" class="physical-status"></p>
    <div class="model-foot">h=−½∇²−1/rA−1/rB（原子单位）；φA/B=π⁻¹/²exp(−rA/B)；E=ε+1/R。<br>
    <b>近似边界：</b>固定核、非相对论、仅两个未优化的 1s 基函数；不含核运动与振动零点能。此基组的最低点约 2.493 a₀、−0.564831 Eh，不能视为精确分子参数。
    该固定指数基组不能正确描述合核极限；支持 R=0.1–100 a₀。上方彩色轨道图仍为相位示意，以下密度曲线才由近似波函数计算。
    <a href="docs/models/H2PLUS_LCAO.md">模型方程、积分与独立验证说明</a></div>`;
  anchor.after(section);
  const $=s=>section.querySelector(s);
  const curve=model.curve({minR:1,maxR:10,points:500});
  const minimum=model.curve({minR:2.3,maxR:2.7,points:1000}).reduce((a,b)=>a.bonding.totalEnergy<b.bonding.totalEnergy?a:b);
  const NS='http://www.w3.org/2000/svg';
  function element(svg,name,attrs,text){const el=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(text!==undefined)el.textContent=text;svg.append(el);return el;}
  function graph(svg,series,xMin,xMax,yMin,yMax,xLabel,yLabel,h){
    svg.replaceChildren();const left=62,right=18,top=24,bottom=40,width=600-left-right,height=h-top-bottom;
    const X=x=>left+(x-xMin)/(xMax-xMin)*width,Y=y=>top+(yMax-y)/(yMax-yMin)*height;
    for(let i=0;i<=4;i++){
      const y=yMin+(yMax-yMin)*i/4,x=xMin+(xMax-xMin)*i/4;
      element(svg,'line',{x1:left,x2:582,y1:Y(y),y2:Y(y),stroke:'#dfe7df'});
      element(svg,'text',{x:2,y:Y(y)+4,'font-size':11,fill:'#53645e'},y.toFixed(3));
      element(svg,'text',{x:X(x)-10,y:h-22,'font-size':11,fill:'#53645e'},x.toFixed(1));
    }
    element(svg,'text',{x:4,y:13,'font-size':11},yLabel);element(svg,'text',{x:490,y:h-3,'font-size':11},xLabel);
    for(const {data,color,dash} of series)element(svg,'path',{d:data.map(([x,y],i)=>`${i?'L':'M'}${X(x).toFixed(3)},${Y(y).toFixed(3)}`).join(' '),fill:'none',stroke:color,'stroke-width':2,...(dash?{'stroke-dasharray':dash}:{})});
    return {X,Y,top,height};
  }
  function run(){
    $('#h2-error').hidden=true;
    try{
      if($('#h2-R').value.trim()==='')throw new RangeError('请填写核间距');
      const R=Number($('#h2-R').value),out=model.solve(R),state=$('#h2-state').value;
      for(const [id,value] of Object.entries({'S':out.overlap,'electronic':out.bonding.electronicEnergy,'repulsion':out.nuclearRepulsion,'Eg':out.bonding.totalEnergy,'Eu':out.antibonding.totalEnergy,'min':minimum.R}))$('#h2-'+id).textContent=value.toFixed(6);
      const svg=$('#h2-energy');
      const frame=graph(svg,[{data:curve.map(p=>[p.R,p.bonding.totalEnergy]),color:'#277859'},{data:curve.map(p=>[p.R,p.antibonding.totalEnergy]),color:'#7965aa'},{data:[[1,-.5],[10,-.5]],color:'#61776b',dash:'5 4'}],1,10,-.65,.65,'R / a₀','E / Eh',280);
      if(R>=1&&R<=10)for(const [key,color] of [['bonding','#277859'],['antibonding','#7965aa']])element(svg,'circle',{cx:frame.X(R),cy:frame.Y(out[key].totalEnergy),r:4,fill:color});
      const xmax=Math.max(4,R/2+3),samples=Array.from({length:501},(_,i)=>{const x=-xmax+2*xmax*i/500;return [x,model.density({R,x,state})];});
      const densitySVG=$('#h2-density');
      const df=graph(densitySVG,[{data:samples,color:state==='bonding'?'#277859':'#7965aa'}],-xmax,xmax,0,Math.max(...samples.map(p=>p[1]))*1.1,'x / a₀','ρ / a₀⁻³',240);
      for(const x of [-R/2,R/2])element(densitySVG,'line',{x1:df.X(x),x2:df.X(x),y1:df.top,y2:df.top+df.height,stroke:'#aa7662','stroke-dasharray':'3 4'});
      $('#h2-status').textContent=`R=${R} a₀；HAA=${out.hamiltonian[0][0].toFixed(6)} Eh，HAB=${out.hamiltonian[0][1].toFixed(6)} Eh。密度显示${state==='bonding'?'成键':'反键'}态。${R<1||R>10?'当前 R 超出势能图范围，读数与密度仍按输入计算。':''}`;
    }catch(e){
      section.querySelectorAll('.physical-metrics strong').forEach(el=>el.textContent='—');
      $('#h2-energy').replaceChildren();$('#h2-density').replaceChildren();$('#h2-status').textContent='请修正输入后重算。';
      $('#h2-error').textContent=e.message;$('#h2-error').hidden=false;
    }
  }
  $('#h2-run').addEventListener('click',run);
  $('#h2-reset').addEventListener('click',()=>{$('#h2-R').value=2;$('#h2-state').value='bonding';run();});
  $('#h2-R').addEventListener('change',run);$('#h2-state').addEventListener('change',run);run();
})();
