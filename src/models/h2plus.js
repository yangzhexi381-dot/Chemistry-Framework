(function(global){
  global.CFModels=global.CFModels||{};
  global.CFModels.h2plus={
    system:{name:'H₂⁺',electrons:1,nuclei:2,approximation:'Born–Oppenheimer固定核近似；LCAO近似'},
    states:{
      bonding:{title:'σg 成键轨道',equation:'ψg ≈ N(1sA + 1sB)',caption:'同相叠加：核间电子密度增加',description:'同相组合使核间区域的波函数振幅增强，电子密度增加；对 H₂⁺ 基态有利于稳定成键。',phase:['positive','positive'],hasNode:false},
      antibonding:{title:'σu* 反键轨道',equation:'ψu ≈ N(1sA − 1sB)',caption:'异相叠加：核间出现节面',description:'异相组合在核间形成节面；核间电子密度降低，能量高于对应成键组合。',phase:['positive','negative'],hasNode:true}
    }
  };
})(window);
