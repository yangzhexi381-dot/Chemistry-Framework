/* Chemistry Framework legacy-style connected spiral map, scaled for readable labels.
   Geometry and label collision avoidance stay separate from scientific data and DOM. */
(function(root){
'use strict';
const width=1840,height=1380,goldenAngle=2.399963229728653;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const approximateWidth=char=>/[\u2e80-\u9fff]/u.test(char)?1:/\s/.test(char)?0.38:0.62;
function labelLines(label,maxUnits=7.5){
 const lines=[];let part='',units=0;
 for(const char of Array.from(label)){
  const size=approximateWidth(char);
  if(part&&units+size>maxUnits){lines.push(part);part='';units=0;}
  part+=char;units+=size;
 }
 if(part)lines.push(part);
 return lines;
}
const rectOverlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*
 Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
const directionalScore=(side,theta)=>{
 const x=Math.cos(theta),y=Math.sin(theta);
 const preference={east:x,west:-x,north:-y,south:y,
  ne:(x-y)*.7,nw:(-x-y)*.7,se:(x+y)*.7,sw:(-x+y)*.7};
 return -(preference[side]||0);
};
function placeLabels(points){
 const placed=[];
 const priority=[...points].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.y-b.y);
 for(const point of priority){
  const lines=point.lines;
  const w=Math.max(...lines.map(line=>Array.from(line).reduce((sum,c)=>sum+approximateWidth(c),0)))*17.8;
  const h=lines.length*24;
  const bases=[
   {side:'east',dx:25,dy:-h/2,anchor:'start'},
   {side:'west',dx:-25-w,dy:-h/2,anchor:'end'},
   {side:'north',dx:-w/2,dy:-h-27,anchor:'middle'},
   {side:'south',dx:-w/2,dy:26,anchor:'middle'},
   {side:'ne',dx:21,dy:-h-23,anchor:'start'},
   {side:'nw',dx:-21-w,dy:-h-23,anchor:'end'},
   {side:'se',dx:21,dy:23,anchor:'start'},
   {side:'sw',dx:-21-w,dy:23,anchor:'end'}
  ];
  const candidates=[];
  for(const offset of [0,-25,25,-50,50])for(const base of bases){
   candidates.push({x:point.x+base.dx,y:point.y+base.dy+offset,
    w,h,side:base.side,anchor:base.anchor});
  }
  let best=null;
  for(const candidate of candidates){
   const overlap=placed.reduce((sum,r)=>sum+rectOverlap(candidate,r),0);
   const outside=candidate.x<12||candidate.y<15||
    candidate.x+candidate.w>width-12||candidate.y+candidate.h>height-15;
   const score=overlap*50+(outside?100000:0)+
    directionalScore(candidate.side,point.theta)*20+
    Math.abs(candidate.y-point.y)*.05+Math.abs(candidate.x-point.x)*.05;
   if(!best||score<best.score)best={...candidate,score};
  }
  const labelX=best.anchor==='start'?best.x:best.anchor==='end'?best.x+best.w:best.x+best.w/2;
  point.labelX=labelX;
  point.labelY=best.y+18;
  point.labelAnchor=best.anchor;
  point.labelBox={x:best.x,y:best.y,w:best.w,h:best.h};
  placed.push(point.labelBox);
 }
}
function build(atlas){
 const points=[],lookup=new Map();
 // Preserve the original globally interleaved spiral rather than six separate boxes.
 // The order moves from quantum/structure through state and kinetics to matter.
 const order=['structure','thermo','kinetics','electrochem','matter','analysis'];
 const groups=new Map(atlas.groups.map(g=>[g.id,g]));
 for(const groupId of order){
  const group=groups.get(groupId);
  if(!group)throw new Error('Missing chemistry domain '+groupId);
  for(const node of group.nodes){
   const index=points.length,theta=index*goldenAngle;
   const radius=63+77*Math.sqrt(index+1);
   const point={id:node.id,group:groupId,featured:group.highlights.includes(node.id),
    title:node.title,label:node.graph_label||node.title,
    x:width/2+1.07*radius*Math.cos(theta),
    y:height/2+.77*radius*Math.sin(theta),theta};
   point.lines=labelLines(point.label);
   lookup.set(node.id,point);
   points.push(point);
  }
 }
 placeLabels(points);
 // Domain navigation focuses a representative concept on the SAME graph.
 const centers=Object.fromEntries(atlas.groups.map(g=>{
  const node=g.nodes.find(n=>g.highlights.includes(n.id))||g.nodes[0];
  const pos=lookup.get(node.id);
  return [g.id,[pos.x,pos.y]];
 }));
 const edges=[];
 for(const relation of [...atlas.groups.flatMap(g=>g.relations),...atlas.bridges]){
  const from=relation.premises.map(id=>lookup.get(id));
  const end=lookup.get(relation.conclusion);
  if(!end||from.some(p=>!p))throw new Error('Unpositioned relation endpoint '+relation.id);
  const cross=[...from,end].some(p=>p.group!==from[0].group);
  const joint=from.length>1?{
   x:Math.round((from.reduce((sum,p)=>sum+p.x,0)/from.length+end.x)/2),
   y:Math.round((from.reduce((sum,p)=>sum+p.y,0)/from.length+end.y)/2)
  }:null;
  edges.push({id:relation.id,relation,cross,from,end,joint});
 }
 const adjacency=new Map(points.map(p=>[p.id,new Set()]));
 for(const edge of edges)for(const p of edge.from){
  adjacency.get(p.id).add(edge.end.id);adjacency.get(edge.end.id).add(p.id);
 }
 const visited=new Set();let componentCount=0;
 for(const p of points){
  if(visited.has(p.id))continue;
  componentCount++;visited.add(p.id);
  const stack=[p.id];
  while(stack.length)for(const next of adjacency.get(stack.pop())){
   if(!visited.has(next)){visited.add(next);stack.push(next);}
  }
 }
 const unlinkedIds=points.filter(p=>adjacency.get(p.id).size===0).map(p=>p.id);
 return {width,height,centers,points,edges,count:points.length,relationCount:edges.length,componentCount,unlinkedIds};
}
const api=Object.freeze({width,height,build,clamp,labelLines,approximateWidth,rectOverlap});
root.CFNetworkGraph=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
