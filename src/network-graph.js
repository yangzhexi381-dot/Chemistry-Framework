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
  for(const [items,radius,featuredFlag] of [[featured,97,true],[rest,159,false]]){
   items.forEach((node,i)=>{
    const angle=-Math.PI/2+2*Math.PI*i/Math.max(1,items.length);
    const x=center[0]+Math.cos(angle)*radius,y=center[1]+Math.sin(angle)*radius;
    const point={id:node.id,group:group.id,x,y,featured:featuredFlag,title:node.title,
      label:node.graph_label||node.title};
    points.push(point);pointById.set(point.id,point);
   });
  }
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
 return {width,height,centers,points,edges,count:points.length,relationCount:edges.length};
}
const api=Object.freeze({width,height,centers,build,clamp});
root.CFNetworkGraph=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
