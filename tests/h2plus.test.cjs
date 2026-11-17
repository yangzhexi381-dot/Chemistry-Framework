const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/models/h2plus.js'),'utf8'),ctx);
const model = ctx.window.CFModels.h2plus;
const close=(a,b,tol=1e-12)=>assert.ok(Math.abs(a-b)<=tol,`${a} differs from ${b} by more than ${tol}`);

// Independent spatial quadrature, NOT evaluation of the production integral formulas.
// Gauss–Legendre nodes/weights are computed from Legendre recurrence and Newton roots.
function gaussLegendre(n){
  const nodes=[],weights=[];
  for(let i=0;i<n;i++){
    let x=Math.cos(Math.PI*(i+.75)/(n+.5)),dp;
    for(let iteration=0;iteration<100;iteration++){
      let p0=1,p1=x;
      for(let k=2;k<=n;k++){const p=((2*k-1)*x*p1-(k-1)*p0)/k;p0=p1;p1=p;}
      dp=n*(x*p1-p0)/(x*x-1);
      const next=x-p1/dp;
      if(Math.abs(next-x)<1e-15){x=next;break;}
      x=next;
    }
    nodes.push(x);weights.push(2/((1-x*x)*dp*dp));
  }
  return {nodes,weights};
}
function spatialIntegrals(R,n){
  const {nodes,weights}=gaussLegendre(n);
  let overlap=0,J=0,C=0;
  // Prolate spheroidal coordinates: rA=R(mu+nu)/2, rB=R(mu-nu)/2.
  // mu tail ends at 1+40/R (exponential cutoff), azimuth integrated exactly.
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const mu=1+20*(nodes[i]+1)/R,nu=nodes[j];
    const weight=weights[i]*weights[j]*20/R;
    overlap+=weight*R**3/4*Math.exp(-R*mu)*(mu*mu-nu*nu);
    J-=weight*R*R/2*Math.exp(-R*(mu+nu))*(mu+nu);
    C-=weight*R*R/2*Math.exp(-R*mu)*(mu-nu);
  }
  return {overlap,J,C};
}

test('H2+ mathematical: analytic matrix elements agree with independently converged spatial quadrature',()=>{
  for(const R of [.5,2,5]){
    const q8=spatialIntegrals(R,8),q16=spatialIntegrals(R,16),q32=spatialIntegrals(R,32);
    for(const k of ['overlap','J','C']){
      assert.ok(Math.abs(q32[k]-q16[k])<Math.abs(q16[k]-q8[k]),`quadrature refinement for ${k}, R=${R}`);
    }
    const out=model.solve(R);
    close(out.overlap,q32.overlap,2e-11);
    close(out.hamiltonian[0][0],-.5+q32.J,2e-11);
    close(out.hamiltonian[0][1],-.5*q32.overlap+q32.C,2e-11);
  }
});

test('H2+ scientific: R=2 bohr reproducible minimal-basis reference includes proton repulsion',()=>{
  const out=model.solve(2);
  close(out.overlap,.5864528940253216);
  close(out.hamiltonian[0][0],-.9725265416668987);
  close(out.hamiltonian[0][1],-.6992322967224989);
  close(out.bonding.totalEnergy,-.5537714953184827);
  close(out.antibonding.totalEnergy,-.16085396559668752);
  for(const state of [out.bonding,out.antibonding])close(state.totalEnergy-state.electronicEnergy,.5);
});

test('H2+ mathematical: Hc=epsilon Sc and overlap normalization hold for both states',()=>{
  for(const R of [.1,.5,2,5,20,100]){
    const out=model.solve(R),H=out.hamiltonian,S=out.metric;
    for(const state of [out.bonding,out.antibonding]){
      const c=state.coefficients;
      let norm=0;
      for(let i=0;i<2;i++){
        let hc=0,sc=0;
        for(let j=0;j<2;j++){hc+=H[i][j]*c[j];sc+=S[i][j]*c[j];norm+=c[i]*S[i][j]*c[j];}
        close(hc,state.electronicEnergy*sc,2e-12);
      }
      close(norm,1,2e-12);
      assert.ok(Number.isFinite(state.totalEnergy));
    }
    assert.ok(out.bonding.totalEnergy<=out.antibonding.totalEnergy+1e-12);
  }
});

test('H2+ scientific: finite basis minimum and hydrogen plus proton dissociation limit',()=>{
  const curve=model.curve({minR:.2,maxR:12,points:1000});
  assert.ok(curve.length>=1000);
  const min=curve.reduce((a,b)=>a.bonding.totalEnergy<b.bonding.totalEnergy?a:b);
  assert.ok(Math.abs(min.R-2.493)<.02,`minimum R=${min.R}`);
  close(min.bonding.totalEnergy,-.56483099,2e-6);
  for(const state of ['bonding','antibonding'])close(model.solve(100)[state].totalEnergy,-.5,1e-12);
  assert.ok(model.solve(.1).bonding.totalEnergy>0,'short-range proton repulsion');
});

test('H2+ scientific: computed approximate density has parity and antibonding midplane node',()=>{
  for(const state of ['bonding','antibonding']){
    for(const x of [-3,-1,0,1,3]){
      const density=model.density({R:2,x,y:.4,z:.2,state});
      assert.ok(Number.isFinite(density)&&density>=0);
      close(density,model.density({R:2,x:-x,y:.4,z:.2,state}),1e-14);
    }
  }
  close(model.density({R:2,x:0,y:.7,z:.2,state:'antibonding'}),0,1e-15);
  assert.ok(model.density({R:2,x:0,state:'bonding'})>0);
});

test('H2+ software: invalid distances, curve requests and density inputs fail explicitly',()=>{
  for(const R of [0,-1,.09,100.1,NaN,Infinity,'2',null,undefined])assert.throws(()=>model.solve(R));
  for(const options of [{minR:3,maxR:2},{minR:0},{points:0},{points:2.5},{points:Infinity}])assert.throws(()=>model.curve(options));
  assert.throws(()=>model.density({R:2,x:NaN}));
  assert.throws(()=>model.density({R:2,x:0,state:'unknown'}));
});
