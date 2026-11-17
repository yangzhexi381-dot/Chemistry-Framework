(function(global){
  global.CFModels=global.CFModels||{};
  function simulate({K=5,lambda=1,dt=.002,steps=6000,n4Initial=1,n2Initial=.1}={}){
    if(!(K>0&&lambda>0&&dt>0&&steps>0))throw new Error('K、λ、步长和步数必须为正');
    const kf=K*lambda,kr=lambda;
    let xi=0;const rows=[];
    for(let i=0;i<=steps;i++){
      const tau=i*dt,n4=Math.max(1e-8,n4Initial-xi),n2=Math.max(1e-8,n2Initial+2*xi);
      const Q=n2*n2/n4;
      rows.push({t:tau,n4,n2,Q,qratio:Q/K,dgOverRT:Math.log(Q/K)});
      if(i<steps){const dxi=(kf*n4-kr*n2*n2)*dt;xi=Math.max(-n2Initial/2+.000001,Math.min(n4Initial-.000001,xi+dxi));}
    }
    return {K,lambda,kf,kr,rows,final:rows[rows.length-1]};
  }
  global.CFModels.n2o4={system:'N₂O₄(g) ⇌ 2 NO₂(g)',reactionQuotient:(a4,a2)=>a2*a2/a4,deltaGOverRT:(Q,K)=>Math.log(Q/K),simulate};
})(window);
