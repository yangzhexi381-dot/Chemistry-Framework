/* Pure graph-view predicates; no DOM or rendering dependencies. */
(function(root){
'use strict';
function matterCompositionNode(n){return Array.isArray(n.domain)&&n.domain.includes('chemical_composition');}
function reactionMechanismNode(n){
 const domain=Array.isArray(n.domain)?n.domain:[];
 return ['chemical_process','mechanism'].includes(n.type) ||
   (typeof n.id==='string'&&n.id.startsWith('chem.')) ||
   domain.includes('chemical_kinetics');
}
function completeRelations(nodes,relations){
 const ids=new Set(nodes.map(n=>n.id));
 return relations.filter(r=>ids.has(r.conclusion) &&
   Array.isArray(r.premises) && r.premises.length>0 &&
   r.premises.every(id=>ids.has(id)));
}
const api=Object.freeze({matterCompositionNode,reactionMechanismNode,completeRelations});
root.CFGraphViews=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
