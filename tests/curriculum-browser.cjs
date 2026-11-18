/* Optional browser acceptance; requires local HTTP server and Playwright. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CF_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.CF_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(base+'#learn/pc.11.1');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2'));
  assert.match(await page.locator('#curriculum-current h2').innerText(),/化学动力学的任务和目的/);
  assert.equal(await page.locator('nav.tabs .tab').count(),4);
  assert.equal(await page.locator('nav.tabs [data-page="electrochem"]').count(),0);
  assert.equal(await page.locator('nav.tabs [data-page="workbench"]').count(),1);
  assert.equal(await page.locator('nav.tabs [data-page="learn"]').count(),0);
  assert.ok(await page.locator('#theory').evaluate(node=>node.classList.contains('active')));
  assert.ok(await page.locator('#learn').evaluate(node=>node.closest('.page')?.id==='theory'));
  await page.goto(base+'#theory');
  assert.equal(await page.locator('#theory #unified-theory-board').count(),1);
  assert.equal(await page.locator('#theory #unified-theory-board .textbook-chapters details').count(),3);
  assert.equal(await page.locator('#theory #unified-theory-board #learn').count(),1);
  assert.equal(await page.locator('#theory #unified-theory-board #theory-cards').count(),1);
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2'));
  assert.ok(await page.locator('#theory').evaluate(node=>node.classList.contains('active')));
  await page.goto(base+'#learn/pc.11.1');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('化学动力学的任务和目的'));
  assert.equal(await page.locator('#curriculum-chapter option').count(),1);
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`overflow at ${width}`);
  }
  await page.locator('#curriculum-current summary').first().click();
  assert.ok(await page.locator('#curriculum-current details[open]').count()>0);
  await page.locator('#curriculum-search').fill('Arrhenius');
  await page.locator('#curriculum-search-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-main')?.textContent.includes('Arrhenius'));
  assert.ok(await page.locator('.curriculum-search-result').count()>0);
  await page.locator('#curriculum-clear').click();
  await page.locator('#curriculum-sections a[href="#learn/pc.11.7"]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('温度对反应速率的影响'));
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('化学动力学的任务和目的'));
  await page.goForward();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('温度对反应速率的影响'));
  await page.goto(base+'#explore');
  await page.waitForFunction(()=>document.querySelectorAll('#graph .atlas-cluster').length===6);
  assert.equal(await page.locator('#graph #network-svg').count(),1);
  assert.equal(await page.locator('#graph .network-node').count(),64);
  assert.equal(await page.locator('#graph .network-relation').count(),49);
  assert.equal(await page.locator('#graph .network-relation.is-cross').count(),8);
  assert.equal(await page.locator('#graph .network-junction').count()>0,true);
  const initialView=await page.locator('#network-svg').getAttribute('viewBox');
  assert.equal(await page.locator('#network-viewport.is-overview').count(),1);
  assert.equal(await page.locator('#network-svg .network-node circle:not(.network-hit-target)').count(),64);
  assert.ok(await page.locator('#network-svg .network-node .network-label tspan').count()>64,'full labels are wrapped, not truncated');
  await page.locator('#domains .atlas-jump[data-group="structure"]').click();
  assert.equal(await page.locator('#network-viewport.is-domain-zoom').count(),1);
  await page.locator('#network-zoom-in').click();
  assert.equal(await page.locator('#network-viewport.is-detail-zoom').count(),1);
  const overlaps=await page.locator('#network-svg .network-node[data-group="structure"] .network-label').evaluateAll(labels=>{
    const boxes=labels.filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getBBox());
    let count=0;
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],b=boxes[j];
      if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>2 &&
         Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>2)count++;
    }
    return count;
  });
  assert.equal(overlaps,0,'zoomed labels must not overlap');
  await page.locator('#network-reset').click();
  assert.equal(await page.locator('#network-viewport.is-overview').count(),1);
  assert.equal(initialView,'0 0 1840 1380');
  assert.match(await page.locator('#graph .network-footnote').innerText(),/10 个关系子网，6 个节点/);
  await page.locator('#network-zoom-in').click();
  assert.notEqual(await page.locator('#network-svg').getAttribute('viewBox'),initialView);
  await page.locator('#network-zoom-out').click();
  await page.locator('#network-reset').click();
  assert.equal(await page.locator('#network-svg').getAttribute('viewBox'),initialView);
  assert.equal((await page.locator('#node-count').innerText()),'64 个节点 · 49 条关系');
  assert.equal(await page.locator('#domains .atlas-jump').count(),6);
  assert.equal(await page.locator('#domains .domain-btn').count(),0);
  assert.equal(await page.locator('#graph .atlas-node').count(),64);
  assert.equal(await page.locator('#graph .atlas-bridge').count(),8);
  assert.equal(await page.locator('#relations .relation-card').count(),49);
  assert.equal(await page.locator('#graph [data-atlas-group="matter"] .atlas-node').count(),15);
  assert.equal(await page.locator('#graph [data-atlas-group="kinetics"] .atlas-node').count(),12);
  const expectedGroups={matter:15,structure:13,thermo:15,kinetics:12,electrochem:7,analysis:2};
  for(const [id,count] of Object.entries(expectedGroups)){
   assert.equal(await page.locator('#atlas-'+id+' .atlas-node').count(),count,id);
  }
  await page.locator('#domains .atlas-jump[data-group="kinetics"]').click();
  assert.equal(await page.locator('#graph .network-node').count(),64,'topic click must not filter/hide nodes');
  assert.notEqual(await page.locator('#network-svg').getAttribute('viewBox'),initialView,'topic control zooms within the same graph');
  await page.locator('#domains .atlas-jump[data-group="matter"]').click();
  await page.locator('.network-index>summary').click();
  assert.equal(await page.locator('#graph .atlas-cluster').count(),6,'secondary index has all six regions');
  await page.locator('#atlas-matter details.atlas-more summary').click();
  await page.locator('#network-reset').click();
  await page.locator('#graph .node[data-node="matter.h2plus"]').click();
  assert.match(await page.locator('#detail').innerText(),/化学式|元素计量/);
  await page.locator('#detail a[href="#model.h2plus"]').click();
  await page.waitForFunction(()=>document.querySelector('#workbench')?.classList.contains('active'));
  await page.goto(base+'#explore');
  await page.locator('#network-reset').click();
  await page.locator('#graph .node[data-node="matter.n2o4"]').click();
  assert.match(await page.locator('#detail').innerText(),/N₂O₄/);
  await page.locator('#detail a[href="#model.n2o4"]').click();
  await page.waitForFunction(()=>document.querySelector('#workbench')?.classList.contains('active'));
  await page.goto(base+'#explore');
  await page.locator('#domains .atlas-jump[data-group="kinetics"]').click();
  assert.equal(await page.locator('#graph .node[data-node^="kinetics.ch11."]').count(),10);
  const numberedConcepts=await page.locator('#graph .node[data-node^="kinetics.ch11."]').evaluateAll(nodes=>nodes.some(n=>/^11\.\d+/.test(n.textContent)));
  assert.equal(numberedConcepts,false);
  await page.locator('#network-reset').click();
  await page.locator('#graph .node[data-node="kinetics.ch11.3"]').click();
  assert.match(await page.locator('#detail h3').innerText(),/速率方程/);
  await page.locator('#detail a[href="#learn/pc.11.3"]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('化学反应的速率方程'));
  assert.ok(await page.locator('#theory').evaluate(e=>e.classList.contains('active')));
  await page.goto(base+'#concept/kinetics.ch11.8');
  await page.waitForFunction(()=>document.querySelector('#detail h3')?.textContent.includes('活化能'));
  assert.ok(await page.locator('#graph .network-node[data-node="kinetics.ch11.8"]').evaluate(node=>node.classList.contains('selected')));
  assert.notEqual(await page.locator('#network-svg').getAttribute('viewBox'),initialView,'deep link focuses the actual network node');
  await page.goto(base+'#explore');
  await page.locator('#domains .atlas-jump[data-group="kinetics"]').click();
  await page.locator('#network-reset').click();
  await page.locator('#graph .node[data-node="kinetics.ch11.4"]').click();
  await page.locator('#detail a[href="#learn/pc.11.4"]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('具有简单级数的反应'));
  assert.ok(await page.locator('#theory').evaluate(e=>e.classList.contains('active')));
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:850});
   await page.goto(base+'#explore');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'unified atlas page overflow '+width);
   assert.equal(await page.locator('#graph .network-node').count(),64);
   assert.equal(await page.locator('#graph .network-relation').count(),49);
  }
  // A real mobile-sized browser starts with a legible topic, not tiny 64-node labels.
  const mobilePage=await browser.newPage({viewport:{width:390,height:840},isMobile:true,hasTouch:true});
  try{
   await mobilePage.goto(base+'#explore');
   await mobilePage.waitForFunction(()=>document.querySelectorAll('#network-svg .network-node').length===64);
   assert.equal(await mobilePage.locator('#network-viewport.is-overview').count(),1);
   assert.equal(await mobilePage.locator('#network-svg').getAttribute('viewBox'),'0 0 1840 1380');
   assert.equal(await mobilePage.locator('#network-svg .network-node').count(),64);
   assert.ok(await mobilePage.locator('#network-svg .network-node .network-label').evaluateAll(labels=>labels.filter(el=>getComputedStyle(el).display!=='none').length)>=20);
   await mobilePage.locator('#domains .atlas-jump[data-group="matter"]').click();
   assert.equal(await mobilePage.locator('#network-viewport.is-domain-zoom').count(),1);
   await mobilePage.locator('#network-zoom-in').click();
   assert.equal(await mobilePage.locator('#network-viewport.is-detail-zoom').count(),1);
   assert.ok(await mobilePage.locator('#network-svg .network-node[data-group="matter"] .network-label').evaluateAll(labels=>labels.every(el=>getComputedStyle(el).display!=='none')));
   assert.equal(await mobilePage.locator('#network-pan-toggle').count(),0,'touch panning requires no toggle');
   assert.equal(await mobilePage.locator('#graph .network-node .network-hit-target').count(),64);
   assert.ok(await mobilePage.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'mobile network layout overflow');
   const beforePan=await mobilePage.locator('#network-svg').getAttribute('viewBox');
   await mobilePage.evaluate(()=>{
    const svg=document.getElementById('network-svg'),rect=svg.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const emit=(type,id,dx,dy)=>svg.dispatchEvent(new PointerEvent(type,{
      bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,
      clientX:x+dx,clientY:y+dy,isPrimary:id===111
    }));
    emit('pointerdown',111,0,0);emit('pointermove',111,65,30);emit('pointerup',111,65,30);
   });
   assert.notEqual(await mobilePage.locator('#network-svg').getAttribute('viewBox'),beforePan,'one-finger pan must change the camera');
   const beforePinch=(await mobilePage.locator('#network-svg').getAttribute('viewBox')).split(' ').map(Number)[2];
   await mobilePage.evaluate(()=>{
    const svg=document.getElementById('network-svg'),rect=svg.getBoundingClientRect();
    const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const emit=(type,id,dx)=>svg.dispatchEvent(new PointerEvent(type,{
      bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',button:0,
      clientX:x+dx,clientY:y,isPrimary:id===201
    }));
    emit('pointerdown',201,-35);emit('pointerdown',202,35);
    emit('pointermove',201,-70);emit('pointermove',202,70);
    emit('pointerup',201,-70);emit('pointerup',202,70);
   });
   const afterPinch=(await mobilePage.locator('#network-svg').getAttribute('viewBox')).split(' ').map(Number)[2];
   assert.ok(afterPinch<beforePinch,'pinch-out must zoom in');
   await mobilePage.locator('#network-reset').click();
   assert.equal(await mobilePage.locator('#network-svg').getAttribute('viewBox'),'0 0 1840 1380');
   await mobilePage.locator('#domains .atlas-jump[data-group="kinetics"]').click();
   assert.equal(await mobilePage.locator('#network-svg .network-node').count(),64);
  } finally {await mobilePage.close();}
  for(const moduleId of ['explore','inquire','theory','electrochem','workbench']){
    await page.goto(base+'#'+moduleId);
    const host=page.locator('#'+moduleId+' [data-knowledge-module="'+moduleId+'"]');
    await host.locator('.knowledge-bridge-card').first().waitFor();
    assert.ok(await host.locator('a.concept-link').count()>0,moduleId);
    await host.locator('a.concept-link').first().click();
    await page.waitForFunction(()=>document.querySelector('#explore')?.classList.contains('active')&&document.querySelector('#detail .statement'));
    assert.ok((await page.locator('#detail h3').innerText()).length>0);
  }
  await page.goto(base+'#concept/kinetics.ch11.8');
  await page.waitForFunction(()=>document.querySelector('#detail h3')?.textContent.includes('活化能'));
  await page.goto(base+'#inquire');
  await page.locator('#case-list .case-btn').nth(1).click();
  await page.locator('#analyze').click();
  await page.locator('#analysis a.concept-link').first().click();
  await page.waitForFunction(()=>document.querySelector('#explore')?.classList.contains('active'));
  await page.goto(base+'#workbench');
  assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  assert.equal(await page.locator('#workbench #electrochem').count(),1);
  assert.equal(await page.locator('#workbench .module-jump-links a').count(),2);
  await page.locator('#workbench .module-jump-links a[href="#electrochem"]').click();
  assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  await page.locator('#electrochem .mode-btn[data-mode="charge"]').click();
  assert.ok(await page.locator('#electrochem .mode-btn[data-mode="charge"]').evaluate(e=>e.classList.contains('active')));
  await page.goto(base+'#electrochem');
  assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  assert.equal(await page.locator('#electrochem .textbook-chapters').count(),0);
  // Seven structure-chemistry modes share the same native workbench and knowledge routes.
  await page.goto(base+'#theory');
  await page.waitForFunction(()=>document.querySelectorAll('#sc-theory-grid .sc-theory-card').length===7);
  assert.equal(await page.locator('#sc-theory-grid a[href^="#model.structure."]').count(),7);
  for(const mode of ['well','orbitals','terms','coupling','spectra','symmetry','huckel']){
    await page.goto(base+'#model.structure.'+mode);
    await page.waitForFunction(expected=>document.querySelector('#workbench')?.classList.contains('active')&&document.querySelector('#structure-studio .sc-mode-tabs button.active')?.dataset.structureMode===expected,mode);
    assert.equal(await page.locator('#structure-studio .sc-page:not([hidden])').count(),1);
    const visible=page.locator('#structure-studio .sc-page:not([hidden])');
    assert.ok(await visible.locator('canvas,svg').count()>0,mode);
    assert.ok((await page.locator('#sc-mode-boundary').innerText()).length>10);
    await page.locator('#sc-concept-link').click();
    await page.waitForFunction(()=>document.querySelector('#explore')?.classList.contains('active'));
  }
  await page.goto(base+'#model.structure.well');
  await page.locator('#nBox').evaluate(el=>{el.value='5';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.match(await page.locator('#boxEnergy').innerText(),/25 E/);
  await page.goto(base+'#model.structure.orbitals');
  await page.locator('#orbSelect').selectOption('3p');
  assert.equal(await page.locator('#rNodes').innerText(),'1');
  await page.goto(base+'#model.structure.terms');
  await page.locator('#termConfig button[data-val="pp"]').click();
  assert.equal(await page.locator('#termGrid button').count(),3);
  await page.goto(base+'#model.structure.coupling');
  await page.locator('#coupling').evaluate(el=>{el.value='1.2';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#couplingOut').innerText(),'1.20');
  await page.goto(base+'#model.structure.spectra');
  await page.locator('#vibModel button[data-val="morse"]').click();
  assert.ok(await page.locator('#vibModel button[data-val="morse"]').evaluate(el=>el.classList.contains('on')));
  const morseLabels=await page.locator('#dissoc').evaluate(slider=>{
    const context=document.querySelector('#vibCanvas').getContext('2d');
    const fillText=context.fillText;
    let labels=[];
    context.fillText=function(text,...args){labels.push(text);return fillText.call(this,text,...args)};
    try {
      return ['3','7'].map(value=>{
        labels=[];
        slider.value=value;
        slider.dispatchEvent(new Event('input',{bubbles:true}));
        return labels;
      });
    } finally {
      context.fillText=fillText;
    }
  });
  assert.ok(morseLabels[0].includes('v=5'));
  assert.ok(!morseLabels[0].includes('v=6'));
  assert.ok(morseLabels[1].includes('v=6'));
  await page.goto(base+'#model.structure.symmetry');
  await page.locator('#irrepF').selectOption('B1');
  assert.match(await page.locator('#selResult').innerText(),/A₁|允许|禁戒/);
  await page.goto(base+'#model.structure.huckel');
  await page.locator('#hN').evaluate(el=>{el.value='6';el.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await page.locator('#hNOut').innerText(),'6');
  for(const width of [390,768,1280]){
    await page.setViewportSize({width,height:850});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'structure studio overflow '+width);
  }
  await page.goto(base+'#model.n2o4');assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  await page.goto(base+'#learn/pc.unknown.0');await page.waitForFunction(()=>document.querySelector('.curriculum-route-warning'));
  let fail=true;
  await page.route('**/data/curriculum/pc-11.json',r=>fail?r.fulfill({status:503,body:'temporarily unavailable'}):r.continue());
  await page.goto(base+'#learn/pc.11.1');await page.reload();
  await page.waitForFunction(()=>document.querySelector('#curriculum-errors')?.textContent.includes('503'));
  assert.ok((await page.locator('#curriculum-status').innerText()).includes('0 / 1'));
  fail=false;await page.getByRole('button',{name:'重试未加载内容',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('化学动力学的任务和目的')&&document.querySelector('#curriculum-errors').hidden);
  assert.deepEqual(errors,[]);
  console.log('PASS: screenshot-style spiral graph, 64 nodes and 49 relations, no label overlap, mobile finger pan and pinch, navigation');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
