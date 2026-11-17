const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/models/electrochemical-cell.js'),'utf8'),ctx);
const m=ctx.window.CFModels.electrochemicalCell;
const base={temperatureK:298.15,electrons:2,standardEmfV:1.1,reactionQuotient:1};
test('cell contract: Q=1 reference and reversible Gibbs electrical work',()=>{
  const x=m.reversible(base);assert.equal(x.emfV,1.1);
  assert.ok(Math.abs(x.deltaGJMol+212267.730664)<1e-6);
  const decade=m.reversible({...base,reactionQuotient:10});
  assert.ok(Math.abs(decade.emfV-1.070420325)<1e-8);
});
test('cell contract: thermodynamic equilibrium and invalid input',()=>{
  const K=Math.exp(2*m.F*1.1/(m.R*298.15));
  assert.ok(Math.abs(m.reversible({...base,reactionQuotient:K}).emfV)<1e-12);
  for(const patch of [{temperatureK:0},{electrons:0},{electrons:1.5},{reactionQuotient:0},{standardEmfV:NaN}])assert.throws(()=>m.reversible({...base,...patch}));
});
