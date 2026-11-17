(function(global){
  global.CFModels=global.CFModels||{};
  const states={
    discharge:{negativeReaction:'Pb + SO₄²⁻ → PbSO₄ + 2e⁻',positiveReaction:'PbO₂ + 4H⁺ + SO₄²⁻ + 2e⁻ → PbSO₄ + 2H₂O',electronFlow:'电子：负极 Pb → 外电路 → 正极 PbO₂',energyFlow:'化学能 → 电能 → 外部负载',overallReaction:'总反应：Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O',note:'放电时，氧化还原反应推动电子经外电路由负极流向正极；电解液内由离子承担电荷传递。'},
    charge:{negativeReaction:'PbSO₄ + 2e⁻ → Pb + SO₄²⁻',positiveReaction:'PbSO₄ + 2H₂O → PbO₂ + 4H⁺ + SO₄²⁻ + 2e⁻',electronFlow:'外加电源驱动电子：正极 → 充电器 → 负极',energyFlow:'电能 → 化学能（储存）',overallReaction:'总反应方向反转：2PbSO₄ + 2H₂O → Pb + PbO₂ + 2H₂SO₄',note:'充电时，外部电源迫使反应逆向进行；实际充电还可能伴随副反应，不能视为完全可逆。'},
    loaded:{negativeReaction:'负极反应受电荷转移与传质共同限制',positiveReaction:'正极反应也可能出现活化与浓差极化',electronFlow:'负载电流增大 → 欧姆压降与极化加重',energyFlow:'端电压低于同状态下的可逆电动势',overallReaction:'放电端电压 ≈ 可逆电动势 − I·R内 − 极化损失',note:'这是概念性关系，不提供虚构数值；实际损失随电流、温度、荷电状态和器件老化变化。'}
  };
  global.CFModels.leadAcid={state:mode=>states[mode]||states.discharge,normalizedExtent:percent=>{const fraction=Math.max(0,Math.min(100,Number(percent)))/100;return {fraction,label:Math.round(fraction*100)+'%',progress:fraction,assumptions:['计量比初始配料','无副反应','以理论完全反应进度归一化']};}};
})(window);
