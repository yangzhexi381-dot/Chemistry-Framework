/* Optional browser acceptance: run with a local HTTP server and Playwright installed. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CF_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.CF_TEST_URL||'http://127.0.0.1:8765/';
  await page.goto(base+'#learn/pc.11.1');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2'));
  assert.match(await page.locator('#curriculum-current h2').innerText(),/11.1/);
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`overflow at ${width}`);
  }
  await page.locator('#curriculum-search').fill('Arrhenius');
  await page.locator('#curriculum-search-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-main')?.textContent.includes('Arrhenius'));
  assert.ok(await page.locator('.curriculum-search-result').count()>0);
  await page.locator('#curriculum-clear').click();
  await page.locator('#curriculum-chapter').selectOption('pc-12');
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('12.1'));
  await page.locator('#curriculum-current summary').first().click();
  assert.ok(await page.locator('#curriculum-current details[open]').count()>0);
  await page.goBack();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('11.1'));
  await page.goForward();await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('12.1'));
  await page.goto(base+'#model.n2o4');assert.ok(await page.locator('#workbench').evaluate(e=>e.classList.contains('active')));
  await page.goto(base+'#learn/pc.unknown.0');await page.waitForFunction(()=>document.querySelector('.curriculum-route-warning'));
  let fail=true;
  await page.route('**/data/curriculum/pc-12.json',r=>fail?r.fulfill({status:503,body:'temporarily unavailable'}):r.continue());
  await page.goto(base+'#learn/pc.12.1');await page.reload();
  await page.waitForFunction(()=>document.querySelector('#curriculum-errors')?.textContent.includes('503'));
  assert.ok((await page.locator('#curriculum-status').innerText()).includes('1'));
  fail=false;await page.getByRole('button',{name:'重试未加载内容',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#curriculum-current h2')?.textContent.includes('12.1')&&document.querySelector('#curriculum-errors').hidden);
  await page.route('**/data/knowledge.json',r=>r.fulfill({status:503,body:'unavailable'}));
  await page.reload();await page.waitForFunction(()=>document.querySelector('#graph')?.textContent.includes('知识数据加载失败'));
  await page.locator('#curriculum-current h2').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: deep links, search, self-check, history, model navigation, unknown target, 503 retry, 390/768/1280 widths; no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
