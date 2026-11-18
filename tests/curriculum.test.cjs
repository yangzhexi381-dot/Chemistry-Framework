const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('published chapter 11 covers all ten sections with source ranges and definitions',()=>{
 const catalog=read('data/curriculum/index.json'),ids=new Set();
 assert.deepEqual(catalog.chapters.map(c=>c.id),['pc-11']);
 assert.equal(catalog.chapters[0].sectionCount,10);
 assert.equal(catalog.review.status,'in_review');
 for(const entry of catalog.chapters){
  const c=read(entry.path);assert.equal(c.id,entry.id);assert.equal(c.bookId,'physical');assert.equal(c.sections.length,entry.sectionCount);
  assert.deepEqual(c.sections.map(s=>s.id),Array.from({length:entry.sectionCount},(_,i)=>`pc.${entry.number}.${i+1}`));
  for(const s of [c,...c.sections]){assert.deepEqual(s.source.pdfPages,s.source.printedPages.map(n=>n+11));assert.ok(s.source.printedPages[0]<=s.source.printedPages[1]);}
  for(const s of c.sections){ids.add(s.id);assert.ok(s.overview&&s.title);assert.ok(['theory','approximation','empirical','concept'].includes(s.level));
   for(const key of ['subtopics','derivation','assumptions','pitfalls','examples','tags'])assert.ok(s[key]?.length,`${s.id}.${key}`);
   for(const t of s.subtopics)assert.ok(t.title&&t.explanation.length>=20,s.id);
   for(const e of s.equations)for(const k of ['label','expression','meaning','conditions'])assert.ok(e[k],`${s.id}.${k}`);
   for(const e of s.examples)assert.ok(e.question&&e.answer,s.id);
  }
 }
 for(const entry of catalog.chapters)for(const s of read(entry.path).sections)for(const l of s.links){
  const plannedChapter12=/^pc\.12\.[1-9]\d*$/.test(l.target);
  assert.ok(ids.has(l.target)||plannedChapter12||['model.h2plus','model.n2o4','electrochem'].includes(l.target),`${s.id}: ${l.target}`);
 }
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(!html.includes('href="#learn/pc.12.1"'),'unpublished chapter must not have an active navigation link');
 assert.match(fs.readFileSync(path.join(root,'src/curriculum.js'),'utf8'),/sectionReady/,'future cross-chapter links must not navigate to missing pages');
});
test('public curriculum contains authored text and no source scans or private paths',()=>{
 for(const entry of read('data/curriculum/index.json').chapters){const t=fs.readFileSync(path.join(root,entry.path),'utf8');assert.doesNotMatch(t,/<\s*(script|iframe|img)\b|data:image|libfile_|\/workspace\//i);}
});
