const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','src','models','n2o4-ideal-gas.js'),'utf8');
const context={window:{}};
vm.runInNewContext(source,context);
const m=context.window.CFModels.n2o4IdealGas;
const defaults={T:298.15,volumeM3:.001,n4:.001,n2:.0001,K:.2,kappa:.5,durationSec:1200,points:300};
function close(actual,expected,atol,caption=''){assert.ok(Math.abs(actual-expected)<=atol, `${caption}: ${actual} ≠ ${expected} ± ${atol}`);}

test('SI quantities and pressure activity use p° = 1 bar',()=>{
  const x=m.simulate(defaults), a=x.rows[0];
  close(a.p4Pa,defaults.n4*m.R*defaults.T/defaults.volumeM3,1e-9);
  close(a.a4,a.p4Pa/100000,1e-14);
  close(a.Q,a.a2*a.a2/a.a4,1e-14);
  close(a.deltaGJMol,m.R*defaults.T*Math.log(a.Q/defaults.K),1e-9);
});

test('conservation law, positive amounts and stoichiometric extent hold across trajectory',()=>{
  const x=m.simulate(defaults),N=2*defaults.n4+defaults.n2;
  assert.equal(x.rows.length,defaults.points+1);
  for(const a of x.rows){
    assert.ok(a.n4Mol>=0 && a.n2Mol>=0);
    close(2*a.n4Mol+a.n2Mol,N,1e-13);
    close(a.n4Mol,defaults.n4-a.extentMol,1e-15);
    close(a.n2Mol,defaults.n2+2*a.extentMol,1e-15);
  }
});

test('analytical quadratic equilibrium obeys specified K° exactly',()=>{
  for(const K of [0.002,0.01,0.2,5,100]){
    const x=m.simulate({...defaults,K}),eq=x.equilibrium;
    const a=m.sample(x.params,eq.extentMol,300);
    close(a.ratio,1,1e-10,'Q/K');
    close(a.rateMolPerSec,0,1e-12,'rate');
    close(2*eq.n4Mol+eq.n2Mol,2*defaults.n4+defaults.n2,1e-13);
  }
});

test('direction sign agrees with Q/K both initially and at physical amount boundaries',()=>{
  const forward=m.simulate(defaults).rows[0];
  assert.ok(forward.ratio<1 && forward.rateMolPerSec>0 && forward.deltaGJMol<0);
  const reverse=m.simulate({...defaults,K:0.0001}).rows[0];
  assert.ok(reverse.ratio>1 && reverse.rateMolPerSec<0 && reverse.deltaGJMol>0);
  const zeroN2=m.simulate({...defaults,n2:0}).rows[0];
  assert.equal(zeroN2.Q,0);
  assert.equal(zeroN2.deltaGJMol,-Infinity);
  const zeroN4=m.simulate({...defaults,n4:0}).rows[0];
  assert.equal(zeroN4.Q,Infinity);
  assert.equal(zeroN4.deltaGJMol,Infinity);
});

test('rate coefficient affects relaxation, not analytically calculated equilibrium',()=>{
  const slow=m.simulate({...defaults,kappa:.05});
  const fast=m.simulate({...defaults,kappa:1.5});
  close(slow.equilibrium.n2Mol,fast.equilibrium.n2Mol,1e-15);
  const eq=fast.equilibrium.n2Mol;
  assert.ok(Math.abs(fast.final.n2Mol-eq)<Math.abs(slow.final.n2Mol-eq));
});

test('long-run relaxation approaches the independent equilibrium root',()=>{
  const x=m.simulate({...defaults,durationSec:10000});
  close(x.final.ratio,1,1e-7);
  close(x.final.n4Mol,x.equilibrium.n4Mol,1e-10);
});

test('RK4 converges under output timestep refinement',()=>{
  const base={...defaults,durationSec:150, kappa:1};
  const coarse=m.simulate({...base,points:60}),fine=m.simulate({...base,points:600});
  close(coarse.final.n2Mol,fine.final.n2Mol,1e-9);
});

test('invalid physical inputs and stiffness budget are explicitly rejected',()=>{
  for(const input of [{...defaults,T:0},{...defaults,volumeM3:0},{...defaults,n4:-1},{...defaults,n4:0,n2:0},{...defaults,K:0},{...defaults,kappa:NaN},{...defaults,points:1}]){
    assert.throws(()=>m.simulate(input));
  }
  assert.throws(()=>m.simulate({...defaults,kappa:1e5,durationSec:1e5}),/stiff/);
});

test('HTML loads physical model and GUI modules with current development version',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(html,/src\/models\/n2o4-ideal-gas\.js/);
  assert.match(html,/src\/physical-workbench\.js/);
  assert.match(html,/assets\/css\/physical-model\.css/);
  assert.match(html,/v0\.5\.0-dev/);
});


test('extreme scales fail explicitly instead of emitting false equilibrium or overflow',()=>{
  for(const patch of [{K:1e-40},{K:1e200},{T:1e308},{volumeM3:1e-320},{n4:1e308}]){
    assert.throws(()=>m.simulate({...defaults,...patch}),/scale|stiff/);
  }
  for(const z of [2e-12,1e-8,1,1e8,5e11]){
    const ctx=m.setup({...defaults,K:z*m.R*defaults.T/(defaults.volumeM3*100000)*(2*defaults.n4+defaults.n2)});
    const eq=m.equilibrium(ctx);
    close(ctx.s*eq.n2Mol**2/eq.n4Mol/ctx.K,1,1e-12);
    close(2*eq.n4Mol+eq.n2Mol,ctx.totalNitrogenUnits,1e-17);
  }
});

test('net rate dissipates Helmholtz free energy along both directions',()=>{
  for(const n2 of [0,.0001,.01]){
    const result=m.simulate({...defaults,n2});
    let previous=Infinity;
    for(const r of result.rows){
      assert.ok(r.rateMolPerSec*r.deltaGJMol<=1e-15);
      const mix=(n)=>n===0?0:n*(Math.log(result.params.s*n)-1);
      const A= -r.n2Mol*Math.log(defaults.K)/2+mix(r.n4Mol)+mix(r.n2Mol);
      assert.ok(A<=previous+1e-14);previous=A;
    }
  }
});


test('finite raw parameters cannot silently produce NaN through derived overflow',()=>{
  assert.throws(()=>m.simulate({T:1e110,volumeM3:1e200,n4:1e200,n2:1e199,K:1e106,kappa:1e-220,durationSec:1,points:20}),/numerical scale/);
  const ctx=m.setup(defaults);
  assert.throws(()=>m.sample(ctx,defaults.n4+1,0),/bounds/);
  assert.throws(()=>m.sample(ctx,0,NaN),/time/);
});
