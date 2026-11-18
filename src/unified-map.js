/* Chemistry Framework: one semantic knowledge atlas, not independent topic pages.
   Pure group model; node/relation data stay in data/knowledge.json. */
(function(root){
'use strict';
const groups=Object.freeze([
 Object.freeze({id:'matter',title:'物质与组成',subtitle:'元素 → 化学式 → 具体物种',label:'组成',number:'01',note:'化学式确定元素计量，不直接确定结构与反应速率。'}),
 Object.freeze({id:'structure',title:'结构与成键',subtitle:'量子态 → 轨道 → 对称性',label:'结构',number:'02',note:'由哈密顿量及模型假设决定结构和能级。'}),
 Object.freeze({id:'thermo',title:'统计与热力学',subtitle:'微观态 → 配分函数 → 平衡',label:'状态',number:'03',note:'建立状态、自由能与平衡约束。'}),
 Object.freeze({id:'kinetics',title:'反应与动力学',subtitle:'反应速率 → 路径 → 机理证据',label:'反应',number:'04',note:'反应快慢与反应路径不能直接由平衡常数推断。'}),
 Object.freeze({id:'electrochem',title:'电化学与界面',subtitle:'电极反应 → 电势 → 极化',label:'界面',number:'05',note:'电极过程受电子转移、物质传递及极化约束。'}),
 Object.freeze({id:'analysis',title:'分析与表征',subtitle:'信号 → 反问题 → 证据',label:'验证',number:'06',note:'实验测量与机理归属需要可检验的证据链。'})
]);
const idFor=node=>{
 const id=node?.id||'';
 if(id.startsWith('element.')||id.startsWith('matter.'))return'matter';
 if(id.startsWith('qm.')||id.startsWith('structure.')||id.startsWith('model.h2plus.'))return'structure';
 if(id.startsWith('stat.')||id.startsWith('thermo.')||id.startsWith('model.two_level'))return'thermo';
 if(id.startsWith('kinetics.'))return'kinetics';
 if(id.startsWith('battery.'))return'electrochem';
 if(id.startsWith('analysis.'))return'analysis';
 return null;
};
function build(nodes,relations){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const grouped=groups.map(g=>({...g,nodes:nodes.filter(n=>idFor(n)===g.id)}));
 const internal=new Map(grouped.map(g=>[g.id,[]]));
 const bridges=[];
 for(const relation of relations){
  if(!byId.has(relation.conclusion)||!relation.premises?.length||!relation.premises.every(id=>byId.has(id)))continue;
  const domains=new Set([...relation.premises,relation.conclusion].map(id=>idFor(byId.get(id))));
  if(domains.has(null))continue;
  if(domains.size===1)internal.get([...domains][0]).push(relation);
  else bridges.push({...relation,groups:[...domains]});
 }
 for(const g of grouped)g.relations=internal.get(g.id);
 return {groups:grouped,bridges,nodeCount:nodes.length,relationCount:relations.length,
  assignedCount:grouped.reduce((n,g)=>n+g.nodes.length,0)};
}
const api=Object.freeze({groups,idFor,build});
root.CFUnifiedMap=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
