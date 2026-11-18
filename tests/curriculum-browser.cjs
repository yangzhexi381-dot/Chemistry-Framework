/* Optional browser acceptance; requires local HTTP server and Playwright. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CF_CHROMIUM||chromium.executablePath(),headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.CF_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(base+'#learn/pc.11.1');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2'));
  assert.match(await page.locator('#curriculum-current h2').innerText(),/11.1/);
  assert.equal(await page.locator('nav.tabs .tab').count(),5);
  assert.equal(await page.locator('nav.tabs [data-page="learn"]').count(),0);
  assert.ok(await page.locator('#theory').evaluate(node=>node.classList.contains('active')));
  assert.ok(await page.locator('#learn').evaluate(node=>node.closest('.page')?.id==='theory'));
  await page.goto(base+'#theory');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2'));
  assert.ok(await page.locator('#theory').evaluate(node=>node.classList.contains('active')));
  await page.goto(base+'#learn/pc.11.1');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.1'));
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
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.7'));
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.1'));
  await page.goForward();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.7'));
  await page.goto(base+'#explore');
  await page.getByRole('button',{name:'反应动力学'}).click();
  await page.locator('.node[data-node="kinetics.ch11.4"]').click();
  await page.locator('#detail a[href="#learn/pc.11.4"]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.4'));
  assert.ok(await page.locator('#theory').evaluate(e=>e.classList.contains('active')));
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
  await page.goto(base+'#model.n2o4');assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  await page.goto(base+'#learn/pc.unknown.0');await page.waitForFunction(()=>document.querySelector('.curriculum-route-warning'));
  let fail=true;
  await page.route('**/data/curriculum/pc-11.json',r=>fail?r.fulfill({status:503,body:'temporarily unavailable'}):r.continue());
  await page.goto(base+'#learn/pc.11.1');await page.reload();
  await page.waitForFunction(()=>document.querySelector('#curriculum-errors')?.textContent.includes('503'));
  assert.ok((await page.locator('#curriculum-status').innerText()).includes('0 / 1'));
  fail=false;await page.getByRole('button',{name:'重试未加载内容',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.1')&&document.querySelector('#curriculum-errors').hidden);
  assert.deepEqual(errors,[]);
  console.log('PASS: shared paths in five modules, concept routes, inquiry-to-graph, graph-to-theory, search/self-check/history, model, recovery, three widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
