/* Derived from the seven model definitions in the supplied Structure Chemistry Interactive Lab.
   Pure numerical kernels: no DOM, canvas, I/O or timers. */
(function (global) {
  'use strict';
  const catalog=[
  {
    "id": "well",
    "node": "structure.infinite_well",
    "title": "势阱与量子化",
    "short": "量子态",
    "formula": "Eₙ=n²π²ℏ²/(2mL²)",
    "scope": "一维无限深势阱：边界条件决定离散本征值。"
  },
  {
    "id": "orbitals",
    "node": "structure.atomic_orbitals",
    "title": "氢原子轨道",
    "short": "原子轨道",
    "formula": "ψₙₗₘ=RₙₗYₗᵐ",
    "scope": "类氢体系、非相对论；点云从归一化概率分布抽样。"
  },
  {
    "id": "terms",
    "node": "structure.atomic_terms",
    "title": "角动量与光谱项",
    "short": "多电子态",
    "formula": "J=|L−S|,…,L+S",
    "scope": "LS 耦合近似；等价电子需交换反对称性。"
  },
  {
    "id": "coupling",
    "node": "structure.two_state_coupling",
    "title": "双能级与分子轨道",
    "short": "轨道耦合",
    "formula": "E±=±√[(Δ/2)²+V²]",
    "scope": "正交两态模型；不等同于有重叠积分的 H₂⁺ LCAO。"
  },
  {
    "id": "spectra",
    "node": "structure.vibrational_spectra",
    "title": "势能面与振动光谱",
    "short": "振动光谱",
    "formula": "Eᵥ=(v+½)ℏω（谐振子）",
    "scope": "归一化一维势能与示意光谱；峰强不代表实测结果。"
  },
  {
    "id": "symmetry",
    "node": "structure.c2v_symmetry",
    "title": "对称性与选择定则",
    "short": "群论选律",
    "formula": "Γᵢ⊗Γμ⊗Γ𝒇 ⊃ A₁ ?",
    "scope": "H₂O 的 C₂ᵥ、特定取向；对称允许不保证跃迁强度。"
  },
  {
    "id": "huckel",
    "node": "structure.huckel_pi",
    "title": "Hückel 共轭体系",
    "short": "π 电子",
    "formula": "Eₖ=α+2βcos[kπ/(N+1)]",
    "scope": "开链、正交、最近邻 π 电子模型；N=3–6。"
  }
];
  const radial=(type,r)=>{
    if(type==='1s')return 2*Math.exp(-r);
    if(type==='2s')return(2-r)*Math.exp(-r/2);
    if(type==='2p')return r*Math.exp(-r/2);
    if(type==='3p')return r*(6-r)*Math.exp(-r/3);
    if(type==='3d')return r*r*Math.exp(-r/3);
    throw new RangeError('Unknown orbital '+type);
  };
  const angular=(type,u)=>{
    if(['1s','2s'].includes(type))return 1;
    if(['2p','3p'].includes(type))return u;
    if(type==='3d')return(3*u*u-1)/2;
    throw new RangeError('Unknown orbital');
  };
  const wellEnergy=(n,m=1,L=1,hbar=1)=>{
    if(!Number.isInteger(n)||n<1||!(m>0)||!(L>0)||!(hbar>0))throw new RangeError('Invalid well parameters');
    return n*n*Math.PI**2*hbar*hbar/(2*m*L*L);
  };
  const wellWave=(n,x,L=1)=> {
    if(!Number.isInteger(n)||n<1||!(L>0))throw new RangeError('Invalid state');
    return x<0||x>L?0:Math.sqrt(2/L)*Math.sin(n*Math.PI*x/L);
  };
  const twoState=(d,v)=>{
    if(!Number.isFinite(d)||!Number.isFinite(v))throw new RangeError('Finite energies required');
    const scale=Math.max(Math.abs(d),Math.abs(v));
    if(scale===0)return {low:0,high:0,a:1,b:0,gap:0};
    const diagonal=(d/scale)/2, coupling=v/scale;
    const radius=Math.hypot(diagonal,coupling);
    const energy=scale*radius;
    // Use the component without subtracting nearly equal numbers.
    const [a,b]=d>=0
      ?[coupling,-(radius+diagonal)]
      :[radius-diagonal,-coupling];
    const norm=Math.hypot(a,b);
    return {low:-energy,high:energy,a:a/norm,b:b/norm,gap:2*energy};
  };
  const vibrationLevelExists=(v,mode='harmonic',depth=7)=>
    Number.isInteger(v)&&v>=0&&Number.isFinite(depth)&&depth>0&&
    (mode==='harmonic'||(mode==='morse'&&(v+.5)/depth<2));
  const vibrationEnergy=(v,mode='harmonic',depth=7)=>{
    if(!vibrationLevelExists(v,mode,depth))throw new RangeError('Invalid or unbound vibration level');
    const x=v+.5;
    return mode==='harmonic'?x:x*(1-(x/depth)/4);
  };
  const vibrationPotential=(x,mode='harmonic',depth=7)=>{
    if(!(depth>0)||!['harmonic','morse'].includes(mode))throw new RangeError('Invalid potential');
    return mode==='harmonic'?x*x/2:depth*Math.pow(1-Math.exp(-x/Math.sqrt(2*depth)),2);
  };
  const vibrationTurningPoints=(v,mode='harmonic',depth=7)=>{
    const energy=vibrationEnergy(v,mode,depth);
    if(mode==='harmonic'){
      const extent=Math.sqrt(2*energy);
      return [-extent,extent];
    }
    const fraction=((v+.5)/depth)/2;
    const q=Math.sqrt(energy/depth);
    const length=Math.SQRT2*Math.sqrt(depth);
    // 1 - q = (1 - fraction)^2 / (1 + q), even near dissociation.
    return [-length*Math.log1p(q),length*(Math.log1p(q)-2*Math.log1p(-fraction))];
  };
  const allowedTerms=(configuration)=>{
    if(configuration==='pd')return [1,2,3].flatMap(L=>[0,1].map(S=>({L,S})));
    if(configuration==='pp')return [{L:0,S:0},{L:2,S:0},{L:1,S:1}];
    throw new RangeError('Unknown electron configuration');
  };
  const reps={A1:0,A2:3,B1:1,B2:2};
  const transitionAllowed=(initial,final,component)=>{
    if(!Object.hasOwn(reps,initial)||!Object.hasOwn(reps,final)||!Object.hasOwn(reps,component))throw new RangeError('Invalid C2v irrep');
    return (reps[initial]^reps[final]^reps[component])===0;
  };
  const huckelEnergy=(N,k,beta=-1,alpha=0)=>{
    if(!Number.isInteger(N)||N<2||!Number.isInteger(k)||k<1||k>N||!Number.isFinite(beta))throw new RangeError('Invalid Hückel parameters');
    return alpha+2*beta*Math.cos(k*Math.PI/(N+1));
  };
  const huckelCoefficient=(N,j,k)=>{
    if(!Number.isInteger(N)||N<2||!Number.isInteger(j)||j<1||j>N||!Number.isInteger(k)||k<1||k>N)throw new RangeError('Invalid orbital index');
    return Math.sqrt(2/(N+1))*Math.sin(j*k*Math.PI/(N+1));
  };
  const api=Object.freeze({catalog,radial,angular,wellEnergy,wellWave,twoState,vibrationLevelExists,vibrationEnergy,vibrationPotential,vibrationTurningPoints,allowedTerms,transitionAllowed,huckelEnergy,huckelCoefficient});
  global.CFStructureModels=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
