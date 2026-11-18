const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/models/structure-chemistry.js');
const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<=eps,`${a} differs from ${b}`);
test('seven experiments have unique, routed model identities and defined conditions',()=>{
 assert.equal(M.catalog.length,7);
 assert.equal(new Set(M.catalog.map(m=>m.id)).size,7);
 for(const m of M.catalog){assert.match(m.node,/^structure\./);assert.ok(m.title&&m.formula&&m.scope)}
});
test('infinite well is normalized, obeys its boundary conditions and has n squared spacing',()=>{
 near(M.wellWave(3,0),0);near(M.wellWave(3,1),0,1e-12);
 near(M.wellEnergy(3)/M.wellEnergy(1),9);
 let sum=0;for(let i=0;i<=1000;i++)sum+=M.wellWave(2,i/1000)**2/1000;
 near(sum,1,0.003);assert.throws(()=>M.wellEnergy(0));assert.throws(()=>M.wellEnergy(2,1,0));
});
test('hydrogen orbital radial/ angular node behavior matches source model',()=>{
 near(M.radial('2s',2),0);near(M.radial('3p',6),0);
 near(M.angular('2p',0),0);near(M.angular('3d',Math.sqrt(1/3)),0);
 near(M.angular('1s',0.5),1);
});
test('two-state eigenvalues and normalized eigenvectors',()=>{
 const z=M.twoState(0,0.8);near(z.low,-0.8);near(z.high,0.8);near(z.gap,1.6);
 near(z.a*z.a+z.b*z.b,1);near(M.twoState(2,0).gap,2);
 near(M.twoState(3,4).gap,Math.sqrt(9+64));
 assert.throws(()=>M.twoState(NaN,1));
});
test('two-state eigenvector satisfies the scaled residual through small nonzero coupling',()=>{
 for(const [d,v] of [[0,1e-9],[0,-1e-9],[3,1e-9],[-3,1e-9],[-3,-4],[3,0],[-3,0],[1e-200,1e-200],[0,0]]){
  const {low,a,b}=M.twoState(d,v);
  const scale=Math.max(Math.abs(d),Math.abs(v))||1;
  const diagonal=(d/scale)/2,coupling=v/scale,e=low/scale;
  near(a*a+b*b,1,1e-14);
  near(diagonal*a+coupling*b-e*a,0,1e-14);
  near(coupling*a-diagonal*b-e*b,0,1e-14);
 }
});
test('harmonic/Morse potentials and energies preserve normalized source formulas',()=>{
 near(M.vibrationEnergy(0),0.5);near(M.vibrationEnergy(1)-M.vibrationEnergy(0),1);
 near(M.vibrationPotential(0,'morse',7),0);
 assert.ok(M.vibrationEnergy(1,'morse',7)-M.vibrationEnergy(0,'morse',7)<1);
 assert.throws(()=>M.vibrationPotential(0,'morse',0));
});
test('Morse levels stop at dissociation and turning points solve V(q) = E',()=>{
 assert.equal(M.vibrationLevelExists(5,'morse',3),true);
 near(M.vibrationEnergy(5,'morse',3),143/48);
 assert.equal(M.vibrationLevelExists(6,'morse',3),false);
 assert.throws(()=>M.vibrationEnergy(6,'morse',3),RangeError);
 assert.throws(()=>M.vibrationEnergy(5,'morse',2.75),RangeError);
 assert.throws(()=>M.vibrationEnergy(1.5),RangeError);
 for(const [v,mode,depth] of [[5,'morse',3],[5,'morse',2.75000001],[5,'harmonic',3]]){
  const [left,right]=M.vibrationTurningPoints(v,mode,depth);
  assert.ok(left<0&&right>0&&Number.isFinite(right));
  const energy=M.vibrationEnergy(v,mode,depth);
  for(const q of [left,right])near(M.vibrationPotential(q,mode,depth),energy,1e-12);
 }
});
test('LS term coupling and exchange screening and C2v selection rule',()=>{
 assert.equal(M.allowedTerms('pd').length,6);
 assert.deepEqual(M.allowedTerms('pp'),[{L:0,S:0},{L:2,S:0},{L:1,S:1}]);
 assert.equal(M.transitionAllowed('A1','B1','B1'),true);
 assert.equal(M.transitionAllowed('A1','A1','B1'),false);
 assert.throws(()=>M.transitionAllowed('E','A1','B2'));
});
test('Huckel open-chain eigenvectors are normalized and mutually orthogonal',()=>{
 for(let n=3;n<=6;n++){
  for(let k=1;k<=n;k++){
    near(Array.from({length:n},(_,i)=>M.huckelCoefficient(n,i+1,k)**2).reduce((a,b)=>a+b,0),1);
    for(let j=1;j<k;j++)near(Array.from({length:n},(_,i)=>M.huckelCoefficient(n,i+1,k)*M.huckelCoefficient(n,i+1,j)).reduce((a,b)=>a+b,0),0);
  }
 }
 near(M.huckelEnergy(3,1,-1),-Math.SQRT2);
 near(M.huckelEnergy(3,3,-1),Math.SQRT2);
 assert.throws(()=>M.huckelEnergy(3,4));
});
