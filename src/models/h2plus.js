(function(global){
  'use strict';
  global.CFModels=global.CFModels||{};
  function distance(R){
    if(!Number.isFinite(R)||R<0.1||R>100)throw new RangeError('R must be finite and between 0.1 and 100 bohr');
    return R;
  }
  // Atomic units, frozen hydrogen 1s Slater functions (exponent = 1/a0).
  // Symmetry diagonalizes H and S simultaneously: an exact solution in this basis.
  function solve(R){
    distance(R);
    const e=Math.exp(-R), overlap=e*(1+R+R*R/3);
    const J=-1/R+e*e*(1+1/R), C=-e*(1+R);
    const aa=-0.5+J, ab=-0.5*overlap+C;
    function state(sign){
      const c=1/Math.sqrt(2*(1+sign*overlap));
      const electronicEnergy=(aa+sign*ab)/(1+sign*overlap);
      return {electronicEnergy,totalEnergy:electronicEnergy+1/R,coefficients:[c,sign*c]};
    }
    return {R,overlap,hamiltonian:[[aa,ab],[ab,aa]],metric:[[1,overlap],[overlap,1]],
      nuclearRepulsion:1/R,bonding:state(1),antibonding:state(-1)};
  }
  function curve({minR=0.2,maxR=12,points=240}={}){
    distance(minR);distance(maxR);
    if(maxR<=minR||!Number.isInteger(points)||points<2||points>2000)throw new RangeError('Require minR < maxR and integer points in [2,2000]');
    return Array.from({length:points},(_,i)=>solve(minR+(maxR-minR)*i/(points-1)));
  }
  function density({R,x,y=0,z=0,state='bonding'}){
    if(![x,y,z].every(Number.isFinite)||!['bonding','antibonding'].includes(state))throw new RangeError('Invalid density coordinates or state');
    const result=solve(R), c=result[state].coefficients;
    const a=Math.exp(-Math.hypot(x+R/2,y,z))/Math.sqrt(Math.PI);
    const b=Math.exp(-Math.hypot(x-R/2,y,z))/Math.sqrt(Math.PI);
    return (c[0]*a+c[1]*b)**2;
  }
  global.CFModels.h2plus={
    solve,curve,density,
    system:{name:'H₂⁺',electrons:1,nuclei:2,approximation:'Born–Oppenheimer固定核近似；LCAO近似'},
    states:{
      bonding:{title:'σg 成键轨道',equation:'ψg ≈ N(1sA + 1sB)',caption:'同相叠加：核间电子密度增加',description:'同相组合使核间区域的波函数振幅增强，电子密度增加；对 H₂⁺ 基态有利于稳定成键。',phase:['positive','positive'],hasNode:false},
      antibonding:{title:'σu* 反键轨道',equation:'ψu ≈ N(1sA − 1sB)',caption:'异相叠加：核间出现节面',description:'异相组合在核间形成节面；核间电子密度降低，能量高于对应成键组合。',phase:['positive','negative'],hasNode:true}
    }
  };
})(window);
