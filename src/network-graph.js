/* One graph for the entire Chemistry Framework. Pure geometry; graph science data unchanged. */
(function(root){
'use strict';
const width=1460,height=1110;
const centers=Object.freeze({
 matter:[250,280],structure:[730,280],thermo:[1210,280],
 analysis:[250,820],electrochem:[730,820],kinetics:[1210,820]
});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function build(atlas){
 const points=[],pointById=new Map();
 for(const group of atlas.groups){
  const center=centers[group.id];
  if(!center)throw new Error('Unknown graph region '+group.id);
  const featured=group.nodes.filter(n=>group.highlights.includes(n.id));
  const rest=group.nodes.filter(n=>!group.highlights.includes(n.id));
  // A stable reading hierarchy. Main concepts occupy the upper two rows; dependent
  // concepts remain visible below them. No arbitrary spiral or overlapping rings.
  const majorSlots=[[-137,-95],[0,-95],[137,-95],[-137,-9],[0,-9],[137,-9]];
  const minorSlots=[];
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)
   minorSlots.push([-156+104*col,89+47*row]);
  if(featured.length>majorSlots.length||rest.length>minorSlots.length)
   throw new Error('Too many graph nodes for region '+group.id);
  const assign=(nodes,slots,isMajor)=>{
   nodes.forEach((node,i)=>{
    const slot=slots[i],point={id:node.id,group:group.id,x:center[0]+slot[0],
      y:center[1]+slot[1],featured:isMajor,title:node.title,label:node.graph_label||node.title};
    points.push(point);pointById.set(point.id,point);
   });
  };
  assign(featured,majorSlots,true);
  assign(rest,minorSlots,false);
 }
 const edges=[];
 for(const relation of [...atlas.groups.flatMap(g=>g.relations),...atlas.bridges]){
  const targets=[...relation.premises,relation.conclusion].map(id=>pointById.get(id));
  if(targets.some(p=>!p))throw new Error('Relation endpoint not positioned: '+relation.id);
  const cross=targets.some(p=>p.group!==targets[0].group);
  const end=pointById.get(relation.conclusion),from=relation.premises.map(id=>pointById.get(id));
  const joint=from.length>1?{
   x:Math.round((from.reduce((s,p)=>s+p.x,0)/from.length+end.x)/2),
   y:Math.round((from.reduce((s,p)=>s+p.y,0)/from.length+end.y)/2)
  }:null;
  edges.push({id:relation.id,relation,cross,from,end,joint});
 }
 // Connectivity is a property of evidence, not of layout. Do not invent edges
 // to suggest that isolated topics have been scientifically linked.
 const adj=new Map(points.map(p=>[p.id,new Set()]));
 for(const edge of edges)for(const prem of edge.from){
   adj.get(prem.id).add(edge.end.id);
   adj.get(edge.end.id).add(prem.id);
 }
 let componentCount=0;const visited=new Set();
 for(const point of points){
  if(visited.has(point.id))continue;
  componentCount++;
  const stack=[point.id];visited.add(point.id);
  while(stack.length)for(const n of adj.get(stack.pop()))if(!visited.has(n)){visited.add(n);stack.push(n);}
 }
 const unlinkedIds=points.filter(p=>adj.get(p.id).size===0).map(p=>p.id);
 return {width,height,centers,points,edges,count:points.length,relationCount:edges.length,
   componentCount,unlinkedIds};
}
const api=Object.freeze({width,height,centers,build,clamp});
root.CFNetworkGraph=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
