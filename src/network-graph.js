/* Pure six-domain chemistry graph geometry. Every original node/edge remains.
   Stable reading hierarchy and semantic label wrapping; no fabricated edges. */
(function(root){
'use strict';
const width=2440,height=1760;
const centers=Object.freeze({
 matter:[440,450],structure:[1220,450],thermo:[2000,450],
 kinetics:[440,1300],electrochem:[1220,1300],analysis:[2000,1300]
});
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const columns=Object.freeze([-210,0,210]);
const rows=Object.freeze([-248,-112,35,163,288]);
const approximateWidth=c=>/[\u2e80-\u9fff]/u.test(c)?1:/\s/.test(c)?0.38:0.62;
function labelLines(label,maxUnits=7.5){
 const lines=[];let line='',sum=0;
 for(const char of Array.from(label)){
  const amount=approximateWidth(char);
  if(line&&sum+amount>maxUnits){lines.push(line);line='';sum=0;}
  line+=char;sum+=amount;
 }
 if(line)lines.push(line);
 return lines;
}
function build(atlas){
 const points=[],pointById=new Map();
 for(const group of atlas.groups){
  const center=centers[group.id];
  if(!center)throw new Error('Unknown graph region '+group.id);
  const primary=group.nodes.filter(n=>group.highlights.includes(n.id));
  const secondary=group.nodes.filter(n=>!group.highlights.includes(n.id));
  if(primary.length>6||secondary.length>9)throw new Error('Graph region exceeds 3×5 grid '+group.id);
  function position(items,firstRow,featured){
   items.forEach((n,i)=>{
    const row=firstRow+Math.floor(i/3),rowStart=Math.floor(i/3)*3;
    const rowCount=Math.min(3,items.length-rowStart),within=i-rowStart;
    const xOffsets=rowCount===1?[0]:rowCount===2?[-120,120]:columns;
    const x=center[0]+xOffsets[within],y=center[1]+rows[row];
    const label=n.graph_label||n.title,point={id:n.id,group:group.id,x,y,featured,title:n.title,label,lines:labelLines(label)};
    points.push(point);pointById.set(n.id,point);
   });
  }
  position(primary,0,true);
  position(secondary,2,false);
 }
 const edges=[];
 for(const relation of [...atlas.groups.flatMap(g=>g.relations),...atlas.bridges]){
  const targets=[...relation.premises,relation.conclusion].map(id=>pointById.get(id));
  if(targets.some(p=>!p))throw new Error('Unpositioned relation endpoint '+relation.id);
  const cross=targets.some(p=>p.group!==targets[0].group);
  const end=pointById.get(relation.conclusion),from=relation.premises.map(id=>pointById.get(id));
  const joint=from.length>1?{
   x:Math.round((from.reduce((s,p)=>s+p.x,0)/from.length+end.x)/2),
   y:Math.round((from.reduce((s,p)=>s+p.y,0)/from.length+end.y)/2)
  }:null;
  edges.push({id:relation.id,relation,cross,from,end,joint});
 }
 // Coverage, not visual proximity, determines graph connectivity.
 const adj=new Map(points.map(p=>[p.id,new Set()]));
 for(const edge of edges)for(const source of edge.from){
  adj.get(source.id).add(edge.end.id);adj.get(edge.end.id).add(source.id);
 }
 let componentCount=0;const visited=new Set();
 for(const point of points){
  if(visited.has(point.id))continue;
  componentCount++;
  const queue=[point.id];visited.add(point.id);
  while(queue.length)for(const next of adj.get(queue.pop()))if(!visited.has(next)){visited.add(next);queue.push(next);}
 }
 const unlinkedIds=points.filter(p=>adj.get(p.id).size===0).map(p=>p.id);
 return {width,height,centers,points,edges,count:points.length,relationCount:edges.length,
  componentCount,unlinkedIds};
}
const api=Object.freeze({width,height,centers,build,clamp,labelLines,approximateWidth});
root.CFNetworkGraph=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
