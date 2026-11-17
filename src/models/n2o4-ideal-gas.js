/*
 * N2O4(g) ⇌ 2 NO2(g) — isothermal ideal-gas closed-vessel model.
 * All internal calculations use SI units. No fitted experimental parameters.
 * κ [mol m^-3 s^-1] is a chosen phenomenological rate scale; K° is supplied for the selected T.
 */
(function(global){
  'use strict';
  global.CFModels = global.CFModels || {};
  const R = 8.31446261815324; // J mol^-1 K^-1
  const P_STANDARD = 100000; // Pa; 1 bar

  function checkedPositive(name, value, allowZero = false){
    if(!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)){
      throw new RangeError(`${name} must be ${allowZero ? 'nonnegative' : 'positive'} and finite`);
    }
    return value;
  }

  function setup(input){
    const T = checkedPositive('T (K)', input.T);
    const volumeM3 = checkedPositive('V (m³)', input.volumeM3);
    const n4 = checkedPositive('n(N₂O₄) (mol)', input.n4, true);
    const n2 = checkedPositive('n(NO₂) (mol)', input.n2, true);
    const K = checkedPositive('K° (dimensionless)', input.K);
    const kappa = checkedPositive('κ (mol m⁻³ s⁻¹)', input.kappa);
    if(n4 === 0 && n2 === 0) throw new RangeError('At least one species must initially be present');
    const totalNitrogenUnits = 2*n4+n2; // mol NO₂ formula units; conserved
    const s = R*T/(volumeM3*P_STANDARD); // mol^-1, p_i/p° = s*n_i
    const activityScale=s*totalNitrogenUnits;
    // Extent-based double precision cannot resolve arbitrarily disparate species.
    const balanceRatio=K/activityScale;
    if(!Number.isFinite(activityScale) || activityScale<=0 ||
       !Number.isFinite(totalNitrogenUnits) || !Number.isFinite(balanceRatio) || balanceRatio<1e-12 || balanceRatio>1e12){
      throw new RangeError('Unsupported numerical scale: require finite RTN/(Vp°) and 1e-12 ≤ K°/(sN) ≤ 1e12');
    }
    return {T,volumeM3,n4,n2,K,kappa,totalNitrogenUnits,s};
  }

  function sample(ctx, extent, timeSec){
    const n4 = ctx.n4-extent;
    const n2 = ctx.n2+2*extent;
    const p4Pa = n4*R*ctx.T/ctx.volumeM3;
    const p2Pa = n2*R*ctx.T/ctx.volumeM3;
    const a4 = p4Pa/P_STANDARD;
    const a2 = p2Pa/P_STANDARD;
    const Q = a4 === 0 ? Infinity : a2*a2/a4;
    const ratio = Q/ctx.K;
    const dgOverRT = Math.log(ratio); // ±∞ is physically meaningful at an ideal-gas zero-amount boundary
    const rateMolPerSec = ctx.volumeM3*ctx.kappa*(ctx.K*a4-a2*a2);
    return {
      timeSec, extentMol:extent, n4Mol:n4, n2Mol:n2,
      p4Pa, p2Pa, pTotalPa:p4Pa+p2Pa, a4, a2, Q,
      ratio, dgOverRT, deltaGJMol:R*ctx.T*dgOverRT,
      rateMolPerSec
    };
  }

  function equilibrium(ctx){
    // 2*n4+n2=N, Q=s*n2²/n4=K° gives:
    // 4s*n4²-(4s*N+K°)*n4+s*N²=0.
    // Stable quadratic root avoids subtracting two nearly equal terms.
    const N=ctx.totalNitrogenUnits, z=ctx.K/(ctx.s*N);
    const root=Math.sqrt(z)*Math.sqrt(z+8);
    const n4Eq=2*N/(4+z+root);
    // Calculate both roots stably; do not subtract nearly equal amounts.
    const n2Eq=2*N/(1+Math.sqrt(1+8/z));
    return {n4Mol:n4Eq,n2Mol:n2Eq,extentMol:ctx.n4-n4Eq};
  }

  function simulate(input){
    const ctx=setup(input);
    const durationSec=checkedPositive('duration (s)', input.durationSec);
    const points=input.points == null ? 300 : input.points;
    if(!Number.isInteger(points) || points<20 || points>1200)throw new RangeError('points must be an integer between 20 and 1200');

    const lo=-ctx.n2/2, hi=ctx.n4;
    const N=ctx.totalNitrogenUnits;
    const derivative=(x)=>{
      const a4=ctx.s*(ctx.n4-x), a2=ctx.s*(ctx.n2+2*x);
      return ctx.volumeM3*ctx.kappa*(ctx.K*a4-a2*a2);
    };
    // The upper bound |f'(xi)| ensures RK4 substeps are small relative to the fastest
    // local relaxation scale; no arbitrary 'fast simulation' shortcut is used.
    const maxRelaxation=ctx.volumeM3*ctx.kappa*(ctx.K*ctx.s+4*ctx.s*ctx.s*N);
    const segment=durationSec/points;
    const substeps=Math.max(1,Math.ceil(segment*maxRelaxation/0.20));
    if(!Number.isFinite(maxRelaxation) || maxRelaxation<=0 || !Number.isFinite(segment) || substeps*points>250000)throw new RangeError('Model is too stiff for the configured horizon; reduce duration or κ');
    const h=segment/substeps;
    const rows=[];
    let x=0;
    for(let i=0;i<=points;i++){
      rows.push(sample(ctx,x,i*segment));
      if(i===points)break;
      for(let j=0;j<substeps;j++){
        const k1=derivative(x);
        const k2=derivative(x+h*k1/2);
        const k3=derivative(x+h*k2/2);
        const k4=derivative(x+h*k3);
        const candidate=x+h*(k1+2*k2+2*k3+k4)/6;
        const epsilon=1e-12*Math.max(1,N);
        if(candidate<lo-epsilon || candidate>hi+epsilon || !Number.isFinite(candidate)){
          throw new Error('Numerical integration violated positivity bounds');
        }
        x=Math.min(hi,Math.max(lo,candidate)); // only round-off projection onto physical domain
      }
    }
    return {params:ctx, equilibrium:equilibrium(ctx), rows, final:rows[rows.length-1], numerical:{method:'RK4 with relaxation-scale substeps',substepsPerOutput:substeps,totalIntegrationSteps:substeps*points}};
  }

  global.CFModels.n2o4IdealGas={R,P_STANDARD,setup,sample,equilibrium,simulate};
})(window);
