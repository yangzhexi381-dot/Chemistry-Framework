const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db, selectedDomain='全部视角', selectedNode=null;
const views=[['全部视角','全部']];
const atlasExpanded=new Set();
let networkData=null;
let networkCamera={x:0,y:0,w:CFNetworkGraph.width,h:CFNetworkGraph.height};
let networkStarted=false;
function domainOf(n){const d=n.domain||[];if(d.some(x=>x.includes('electro')))return '电化学与界面';if(d.some(x=>x.includes('analytical')))return '分析与表征';if(n.id.startsWith('chem.'))return '反应与机理';return '理论工具'}
function visibleNodes(){let ns=db.nodes;if(selectedDomain==='全部视角')return ns;if(selectedDomain==='物质与组成')return ns.filter(CFGraphViews.matterCompositionNode);if(selectedDomain==='结构与成键')return ns.filter(n=>n.id.startsWith('qm.')||n.domain.includes('structure_bonding')||/结构|成键|轨道|电子/.test(n.title));if(selectedDomain==='反应与机理')return ns.filter(CFGraphViews.reactionMechanismNode);if(selectedDomain==='热力学与动力学')return ns.filter(n=>n.domain.includes('quantum_statistical_mechanics')||n.domain.includes('chemical_kinetics')||n.domain.includes('thermodynamics')||/动力学|平衡|自由能/.test(n.title));if(selectedDomain==='电化学与界面')return ns.filter(n=>n.domain.includes('electrochemistry'));return ns.filter(n=>n.domain.includes('analytical_chemistry'))}
function renderDomains(){
 const parts=CFUnifiedMap.groups;
 $('#domains').innerHTML='<div class="atlas-path-heading"><span>知识层级</span><small>同一张网络，按概念层次定位</small></div><div class="atlas-path">'+parts.map((g,i)=>'<button class="atlas-jump" type="button" data-group="'+esc(g.id)+'"><span>'+esc(g.number)+'</span>'+esc(g.label)+'</button>').join('<span class="atlas-path-arrow" aria-hidden="true">›</span>')+'</div>';
 $('#domains').querySelectorAll('.atlas-jump').forEach(button=>button.onclick=()=>{
  networkFocusGroup(button.dataset.group);
  document.getElementById('network-viewport')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  $('#domains').querySelectorAll('.atlas-jump').forEach(b=>b.classList.toggle('active',b===button));
 });
}


const clampCamera=()=>{
 const maxW=CFNetworkGraph.width,maxH=CFNetworkGraph.height;
 networkCamera.w=Math.min(maxW,Math.max(280,networkCamera.w));
 networkCamera.h=Math.min(maxH,Math.max(210,networkCamera.h));
 networkCamera.x=CFNetworkGraph.clamp(networkCamera.x,0,maxW-networkCamera.w);
 networkCamera.y=CFNetworkGraph.clamp(networkCamera.y,0,maxH-networkCamera.h);
};
function networkApplyCamera(){
 clampCamera();
 const svg=document.getElementById('network-svg');
 if(svg)svg.setAttribute('viewBox',[networkCamera.x,networkCamera.y,networkCamera.w,networkCamera.h].join(' '));
 const viewport=document.getElementById('network-viewport');
 if(viewport){
  viewport.classList.toggle('is-overview',networkCamera.w>1120);
  viewport.classList.toggle('is-domain-zoom',networkCamera.w<=1120&&networkCamera.w>570);
  viewport.classList.toggle('is-detail-zoom',networkCamera.w<=570);
 }
 const zoom=document.getElementById('network-zoom-label');
 if(zoom)zoom.textContent=Math.round(CFNetworkGraph.width/networkCamera.w*100)+'%';
}
function networkZoom(factor){
 const cx=networkCamera.x+networkCamera.w/2,cy=networkCamera.y+networkCamera.h/2;
 const w=networkCamera.w/factor,h=networkCamera.h/factor;
 networkCamera={x:cx-w/2,y:cy-h/2,w,h};networkApplyCamera();
}
function networkFocusGroup(id){
 const pos=networkData?.centers[id];if(!pos)return;
 networkCamera={x:pos[0]-360,y:pos[1]-270,w:720,h:540};networkApplyCamera();
}
function networkFocusNode(id){
 const n=networkData?.points.find(p=>p.id===id);if(!n)return;
 networkCamera={x:n.x-235,y:n.y-176,w:470,h:352};networkApplyCamera();
}
function renderAtlas(){
 const map=CFUnifiedMap.build(db.nodes,db.relations);
 if(map.assignedCount!==map.nodeCount)throw new Error('知识节点有缺失分组');
 const graph=CFNetworkGraph.build(map);
 if(graph.count!==map.nodeCount||graph.relationCount!==map.relationCount)throw new Error('知识图谱几何与原始关系数据不一致');
 networkData=graph;
 const host=$('#graph');host.classList.remove('materials-graph');host.classList.add('unified-graph','connected-graph','radial-graph');
 const byId=new Map(db.nodes.map(n=>[n.id,n]));
 const colors={matter:'#5c9878',structure:'#a395c0',thermo:'#a395c0',kinetics:'#5c9878',electrochem:'#5c9878',analysis:'#a395c0'};
 const relationSelected=r=>selectedNode&&(r.conclusion===selectedNode||r.premises.includes(selectedNode));
 const curved=(a,b,cross)=>{
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
  const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
  const deviation=Math.min(24,length*.065)*(cross?1.0:.55);
  return 'M'+a.x.toFixed(1)+','+a.y.toFixed(1)+' Q'+(mx-(b.y-a.y)/length*deviation).toFixed(1)+','+(my+(b.x-a.x)/length*deviation).toFixed(1)+' '+b.x.toFixed(1)+','+b.y.toFixed(1);
 };
 const relationSVG=graph.edges.map(edge=>{
   const r=edge.relation,active=relationSelected(r),dim=selectedNode&&!active;
   const cls='network-relation'+(edge.cross?' is-cross':' is-local')+(active?' is-connected':'')+(dim?' is-muted':'');
   const limbs=edge.from.map(source=>'<path class="network-limb" d="'+curved(source,edge.joint||edge.end,edge.cross)+'"'+(edge.joint?'':' marker-end="url(#network-arrow)"')+'/>').join('');
   const end=edge.joint?'<path class="network-final" d="'+curved(edge.joint,edge.end,edge.cross)+'" marker-end="url(#network-arrow)"/>':'';
   const joint=edge.joint?'<circle class="network-junction" cx="'+edge.joint.x+'" cy="'+edge.joint.y+'" r="3.7"/>':'';
   const title=r.claim+'；关系类型：'+r.type+'；条件：'+(r.conditions||[]).join('；');
   return '<g class="'+cls+'" data-relation="'+esc(r.id)+'" role="button" tabindex="0" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+limbs+end+joint+'</g>';
 }).join('');
 const groupSVG=''; // Restore the original open node-cloud canvas: no boxed subject panels.
 const activeIds=new Set();if(selectedNode)for(const e of graph.edges)if(relationSelected(e.relation))for(const id of [...e.relation.premises,e.relation.conclusion])activeIds.add(id);
 const nodeSVG=graph.points.map(p=>{
  const n=byId.get(p.id),chosen=selectedNode===p.id,related=activeIds.has(p.id);
  const isDim=selectedNode&&!chosen&&!related;
  const cls='node network-node'+(chosen?' selected':'')+(related?' is-related':'')+(isDim?' is-muted':'');
  const labelLines=p.lines.map((line,i)=>'<tspan x="'+p.labelX.toFixed(1)+'" dy="'+(i===0?0:24)+'">'+esc(line)+'</tspan>').join('');
  return '<g class="'+cls+'" data-node="'+esc(p.id)+'" data-group="'+esc(p.group)+'" role="button" tabindex="0" aria-label="'+esc(n.title)+'"><title>'+esc(n.title)+'</title>'+
    '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+(chosen?17:p.featured?15:12)+'" fill="'+colors[p.group]+'"/>'+
    '<circle class="network-hit-target" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="30" fill="transparent"/>'+
    '<text class="network-label'+(p.featured?' network-primary':' network-secondary')+'" x="'+p.labelX.toFixed(1)+'" y="'+p.labelY.toFixed(1)+'" style="text-anchor:'+p.labelAnchor+'">'+labelLines+'</text></g>';
 }).join('');
 const diagram='<svg id="network-svg" class="network-svg" viewBox="0 0 '+graph.width+' '+graph.height+'" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+graph.count+' 个化学知识节点与 '+graph.relationCount+' 条带条件关系的统一交互网络"><defs><marker id="network-arrow" markerWidth="7" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L6 3 L0 6" fill="none" stroke="#6f9c81" stroke-width="1.3"/></marker></defs>'+groupSVG+relationSVG+nodeSVG+'</svg>';
 const chip=node=>'<button class="atlas-node'+(selectedNode===node.id?' selected':'')+'" type="button" data-node="'+esc(node.id)+'" title="'+esc(node.title)+'">'+esc(node.graph_label||node.title)+'</button>';
 const sections=map.groups.map(g=>{
  const featured=g.nodes.filter(n=>g.highlights.includes(n.id)),rest=g.nodes.filter(n=>!g.highlights.includes(n.id)),open=atlasExpanded.has(g.id);
  const more=rest.length?'<details class="atlas-more" data-group="'+esc(g.id)+'"'+(open?' open':'')+'><summary>其余 '+rest.length+' 个概念</summary><div class="atlas-nodes">'+rest.map(chip).join('')+'</div></details>':'';
  return '<section class="atlas-cluster atlas-'+esc(g.id)+'" id="atlas-'+esc(g.id)+'" data-atlas-group="'+esc(g.id)+'">'+
   '<div class="atlas-cluster-head"><span class="atlas-number">'+esc(g.number)+'</span><div><h3>'+esc(g.title)+'</h3><p>'+esc(g.subtitle)+'</p></div></div>'+
   '<div class="atlas-metrics"><span>'+g.nodes.length+' 个节点</span><span>'+g.relations.length+' 条内部关系</span></div>'+
   '<div class="atlas-nodes">'+featured.map(chip).join('')+'</div>'+more+'<p class="atlas-context">'+esc(g.note)+'</p></section>';
 }).join('');
 const relationText=relation=>{
  const groupNames=relation.groups.map(id=>CFUnifiedMap.groups.find(g=>g.id===id)?.label||id).join(' · ');
  return '<a class="atlas-bridge" data-relation="'+esc(relation.id)+'" href="#concept/'+esc(relation.conclusion)+'"><span class="atlas-bridge-domain">'+esc(groupNames)+'</span><b>'+esc(byId.get(relation.conclusion)?.title||relation.conclusion)+'</b><span class="atlas-bridge-claim">'+esc(relation.claim)+'</span><small>类型：'+esc(relation.type)+' · '+esc((relation.conditions||[]).slice(0,2).join('；')||'详见适用条件')+'</small></a>';
 };
 host.innerHTML='<div class="network-intro"><div><strong>化学知识关系图</strong><p>放大后可逐一查看知识节点及关系条件。</p></div><span>'+graph.count+' 个节点 · '+graph.relationCount+' 条关系</span></div>'+
  '<div class="network-controls"><div class="network-controls-left"><button type="button" id="network-zoom-in" aria-label="放大网络">放大 ＋</button><button type="button" id="network-zoom-out" aria-label="缩小网络">缩小 −</button><button type="button" id="network-reset">完整网络</button></div><div class="network-controls-right"><span id="network-zoom-label">100%</span><span>单指平移 · 双指捏合缩放 · 点节点查看详情</span></div></div>'+
  '<div id="network-viewport" class="network-viewport" aria-label="可拖动和缩放的化学知识网络">'+diagram+'</div>'+
  '<div class="network-footnote">连线均来自已有的真实知识关系；双指缩放后可查看完整节点名称，未补画任何无证据的关联。目前包含 '+graph.componentCount+' 个关系子网，'+graph.unlinkedIds.length+' 个节点尚无直接编码关系；这属于知识覆盖情况，不是显示错误。</div>'+
  '<details class="network-index"><summary><span>按领域查阅所有知识点</span><small>六组辅助索引，不会从网络中移除节点</small></summary><div class="atlas-grid">'+sections+'</div></details>'+
  '<section class="atlas-links"><div class="atlas-links-head"><div><h3>跨领域的真实联系</h3><p>点击一条跨领域关系，可查看对应节点及成立条件。</p></div><span>'+map.bridges.length+' 条</span></div><div class="atlas-link-grid">'+map.bridges.map(relationText).join('')+'</div></section>';
 if(!networkStarted){
  networkCamera={x:0,y:0,w:graph.width,h:graph.height};
 }
 networkStarted=true;
 const viewport=host.querySelector('#network-viewport');
 networkApplyCamera();
 host.querySelector('#network-zoom-in').onclick=()=>networkZoom(1.32);
 host.querySelector('#network-zoom-out').onclick=()=>networkZoom(1/1.32);
 host.querySelector('#network-reset').onclick=()=>{networkCamera={x:0,y:0,w:graph.width,h:graph.height};networkApplyCamera();};
 host.querySelectorAll('details.atlas-more').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)atlasExpanded.add(d.dataset.group);else atlasExpanded.delete(d.dataset.group)}));
 const handleNode=id=>{
  selectedNode=id;showNode(id);
  if(window.matchMedia('(max-width:780px)').matches)$('#detail').scrollIntoView({block:'start',behavior:'smooth'});
 };
 host.querySelectorAll('.network-node,.atlas-node').forEach(el=>{
  el.onclick=()=>handleNode(el.dataset.node);
  el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handleNode(el.dataset.node)}};
 });
 host.querySelectorAll('.network-relation').forEach(el=>{
  const click=()=>{const relation=db.relations.find(r=>r.id===el.dataset.relation);if(relation)handleNode(relation.conclusion)};
  el.onclick=click;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();click()}};
 });
 const svg=host.querySelector('#network-svg');
 const pointers=new Map();let gesture=null,lastGestureAt=-10000;
 const capture=id=>{try{svg.setPointerCapture(id)}catch(_){}};
 const visibleSize=()=>{
  const rect=svg.getBoundingClientRect(),worldAspect=networkCamera.w/networkCamera.h;
  const renderedW=Math.min(rect.width,rect.height*worldAspect);
  const renderedH=Math.min(rect.height,rect.width/worldAspect);
  return {rect,w:Math.max(1,renderedW),h:Math.max(1,renderedH)};
 };
 const normal=(x,y)=>{
  const s=visibleSize();
  return {x:(x-s.rect.left-(s.rect.width-s.w)/2)/s.w,
   y:(y-s.rect.top-(s.rect.height-s.h)/2)/s.h};
 };
 const restartGesture=()=>{
  const arr=[...pointers.values()];
  if(arr.length===0){gesture=null;return;}
  const cam={...networkCamera};
  if(arr.length===1){
   gesture={kind:'pan',x:arr[0].x,y:arr[0].y,cam,moved:false};
  }else{
   const x=(arr[0].x+arr[1].x)/2,y=(arr[0].y+arr[1].y)/2;
   const n=normal(x,y);
   gesture={kind:'pinch',cam,dist:Math.max(1,Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y)),
    worldX:cam.x+n.x*cam.w,worldY:cam.y+n.y*cam.h,moved:true};
  }
 };
 svg.addEventListener('pointerdown',event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  restartGesture();
  if(pointers.size>1)for(const id of pointers.keys())capture(id);
 });
 svg.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId)||!gesture)return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size===1&&gesture.kind==='pan'){
   const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
   if(!gesture.moved&&Math.hypot(dx,dy)<5)return;
   if(!gesture.moved){gesture.moved=true;capture(event.pointerId);}
   const size=visibleSize();
   networkCamera.x=gesture.cam.x-dx*gesture.cam.w/size.w;
   networkCamera.y=gesture.cam.y-dy*gesture.cam.h/size.h;
   networkApplyCamera();
   event.preventDefault();
  }else if(pointers.size>=2&&gesture.kind==='pinch'){
   const pts=[...pointers.values()].slice(0,2);
   const x=(pts[0].x+pts[1].x)/2,y=(pts[0].y+pts[1].y)/2;
   const dist=Math.max(1,Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y));
   const zoom=dist/gesture.dist;
   const n=normal(x,y);
   const w=gesture.cam.w/zoom,h=gesture.cam.h/zoom;
   networkCamera={x:gesture.worldX-n.x*w,y:gesture.worldY-n.y*h,w,h};
   networkApplyCamera();event.preventDefault();
  }
 },{passive:false});
 const endPointer=event=>{
  if(!pointers.has(event.pointerId))return;
  if(gesture?.moved||gesture?.kind==='pinch')lastGestureAt=performance.now();
  pointers.delete(event.pointerId);restartGesture();
 };
 for(const name of ['pointerup','pointercancel','lostpointercapture'])
  svg.addEventListener(name,endPointer);
 svg.addEventListener('click',event=>{
  if(performance.now()-lastGestureAt<350){event.stopPropagation();event.preventDefault();}
 },true);
 svg.addEventListener('wheel',event=>{
  if(!event.ctrlKey)return;
  event.preventDefault();networkZoom(event.deltaY<0?1.2:1/1.2);
 },{passive:false});
 $('#node-count').textContent=graph.count+' 个节点 · '+graph.relationCount+' 条关系';
}

function renderGraph(){if(selectedDomain==='全部视角'){renderAtlas();return;}const ns=visibleNodes(), focusedReaction=selectedDomain==='反应与机理',focusedMatter=selectedDomain==='物质与组成', W=focusedMatter?900:(focusedReaction?820:760),H=focusedMatter?560:(focusedReaction?480:420),cx=W/2,cy=H/2;
$('#graph').classList.toggle('materials-graph',focusedMatter);
let coords={};
if(focusedMatter){
 const groups=[
  ['element.hydrogen','element.carbon','element.nitrogen','element.oxygen','element.sulfur','element.lead'],
  ['matter.h2plus','matter.water','matter.butadiene','matter.no2','matter.n2o4'],
  ['matter.lead_metal','matter.lead_dioxide','matter.lead_sulfate','matter.sulfuric_acid']
 ];
 const ys=[90,280,485];
 for(let i=0;i<groups.length;i++){
   const row=groups[i].filter(id=>ns.some(n=>n.id===id));
   for(let j=0;j<row.length;j++)coords[row[j]]=[60+(j+.5)*(W-120)/row.length,ys[i]];
 }
}else if(focusedReaction){
 const rank=[
  'kinetics.thermo_rate_distinction','kinetics.reaction_rate','kinetics.ch11.1','battery.lead_acid',
  'kinetics.ch11.2','kinetics.ch11.3','kinetics.ch11.4','kinetics.ch11.5',
  'kinetics.ch11.6','kinetics.ch11.7','kinetics.ch11.8','kinetics.ch11.9','kinetics.ch11.10'
 ];
 const ordered=[...ns].sort((a,b)=>rank.indexOf(a.id)-rank.indexOf(b.id));
 const rows=[ordered.slice(0,4),ordered.slice(4,8),ordered.slice(8)];
 rows.forEach((items,row)=>{
  items.forEach((n,j)=>{
    const step=(W-110)/items.length;
    coords[n.id]=[55+(j+.5)*step,90+row*155];
  });
 });
}else{ns.forEach((n,i)=>{let angle=i*2.399963,rad=45+Math.sqrt(i+1)*25;coords[n.id]=[cx+Math.cos(angle)*Math.min(rad,280),cy+Math.sin(angle)*Math.min(rad,155)]});}
let edges=CFGraphViews.completeRelations(ns,db.relations);let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="化学知识关系图">`;for(const r of edges){let t=coords[r.conclusion];for(const id of r.premises.filter(x=>coords[x])){let s=coords[id];svg+=`<path class="edge" d="M${s[0]} ${s[1]} Q${(s[0]+t[0])/2} ${(s[1]+t[1])/2-12} ${t[0]} ${t[1]}"/>`}}for(const n of ns){const [x,y]=coords[n.id], chem=n.id.startsWith('chem.')||n.type==='chemical_entity'||n.type==='chemical_element'||Boolean(n.curriculum_ref), active=selectedNode===n.id, label=n.graph_label||n.title;svg+=`<g class="node ${active?'selected':''}" data-node="${esc(n.id)}" tabindex="0" role="button" aria-label="${esc(n.title)}"><title>${esc(n.title)}</title><circle cx="${x}" cy="${y}" r="${chem?9:7}" fill="${chem?'#5c9878':'#a395c0'}"/><text x="${x}" y="${y+23}">${esc(label.length>13?label.slice(0,12)+'…':label)}</text></g>`}svg+='</svg>';$('#graph').innerHTML=svg;document.querySelectorAll('.node').forEach(e=>{const activate=()=>showNode(e.dataset.node);e.onclick=activate;e.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();activate()}}});$('#node-count').textContent=`${ns.length} 个节点 · ${edges.length} 条关系`}
function showNode(id){selectedNode=id;renderGraph();const n=db.nodes.find(x=>x.id===id), rels=db.relations.filter(r=>r.conclusion===id||r.premises.includes(id));const asList=value=>Array.isArray(value)?value:(typeof value==='string'&&value.trim()?[value]:[]);const equations=asList(n.equations),assumptions=asList(n.assumptions),limitations=asList(n.limitations);const l0=n.presentation?.chemical_meaning||n.statement,l1=n.presentation?.intuitive_explanation||n.description||n.statement,l2=equations.length?equations.join('　;　'):'此节点没有显式公式。',l3=rels.map(r=>r.claim+'（'+r.conditions.join('；')+'）').join('\n')||'暂无已编码的推导关系。';const materialInfo=n.composition?`<div class="material-metadata"><b>化学式：</b>${esc(n.formula||'—')}　<b>元素计量：</b>${esc(Object.entries(n.composition).map(([k,v])=>k+'×'+v).join(' · '))}${Number.isFinite(n.charge)?'　净电荷：'+esc(n.charge>0?'+'+n.charge:String(n.charge)):''}${n.phase?' · '+esc(n.phase):''}</div>`:'';const validMaterialRoutes=new Set(['#model.h2plus','#model.n2o4','#model.structure.symmetry','#model.structure.huckel','#electrochem']);const materialModelLink=validMaterialRoutes.has(n.model_route)?`<p class="graph-curriculum-link"><a href="${esc(n.model_route)}">进入对应体系与模型 →</a></p>`:'';const curriculumLink=/^pc\.11\.(?:[1-9]|10)$/.test(n.curriculum_ref||'')?`<p class="graph-curriculum-link"><a href="#learn/${esc(n.curriculum_ref)}">深入推导、适用边界与自测 →</a></p>`:'';const structureLink=/^(well|orbitals|terms|coupling|spectra|symmetry|huckel)$/.test(n.model_ref||'')?`<p class="graph-curriculum-link"><a href="#model.structure.${esc(n.model_ref)}">打开交互模型并调整参数 →</a></p>`:'';$('#detail').classList.add('has-selection');$('#detail').innerHTML=`<div class="detail-top"><span class="tag">${esc(n.type)}</span><span class="muted">${esc(n.claim_status)} · ${esc(n.review_status)}</span></div><h3>${esc(n.title)}</h3><div class="statement">${esc(n.statement)}</div>${materialInfo}${curriculumLink}${structureLink}${materialModelLink}<div class="detail-tabs">${['L0 化学','L1 机制','L2 模型','L3 推导'].map((x,i)=>`<button class="depth ${i===0?'active':''}" data-level="${i}">${x}</button>`).join('')}</div><div class="detail-body" id="depth-body">${depthContent(n,0,l0,l1,l2,l3)}</div><div class="detail-body"><h4>范围与边界</h4><p><b>范围：</b>${esc(n.scope)}</p><ul>${limitations.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>前提</h4><ul>${assumptions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>关联关系</h4><p>${rels.length?rels.map(r=>esc(r.claim)).join('<br>'):'暂无编码关系'}</p></div>`;document.querySelectorAll('.depth').forEach(b=>b.onclick=()=>{document.querySelectorAll('.depth').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#depth-body').innerHTML=depthContent(n,+b.dataset.level,l0,l1,l2,l3)})}
function depthContent(n,i,a,b,c,d){let vals=[a,b,c,d],titles=['直接化学解释','过程与机制','相关物理/数学模型','推导链与可检验边界'];return `<h4>${titles[i]}</h4>${i===2&&n.equations?.length?`<div class="equation">${esc(vals[i])}</div>`:`<p>${esc(vals[i])}</p>`}`}
function renderRelations(){const relationList=db.relations;$('#relations').innerHTML=relationList.map(r=>{let ps=r.premises.map(id=>db.nodes.find(n=>n.id===id)?.title||id),c=db.nodes.find(n=>n.id===r.conclusion)?.title||r.conclusion;return `<article class="relation-card"><div class="detail-top"><span class="tag">${esc(r.type)}</span><span class="muted">${esc(r.review_status)}</span></div><h3>${esc(r.claim)}</h3><div class="flow">${ps.map(x=>`<span>${esc(x)}</span>`).join('<b>+</b>')}<b>→</b><span>${esc(c)}</span></div><p>${esc(r.scope)}</p><button class="rel-more">查看条件与限制 +</button><div class="rel-extra"><p><b>条件：</b>${esc((r.conditions||[]).join('；')||'无额外条件已记录')}</p><p><b>步骤：</b>${esc((r.steps||[]).join(' → ')||'—')}</p><p><b>限制：</b>${esc((r.limitations||[]).join('；')||'未额外记录')}</p><p><b>来源：</b>${r.sources?.length?r.sources.map(s=>esc(s.title)).join('；'):'未录入来源'}</p></div></article>`}).join('');document.querySelectorAll('.rel-more').forEach(b=>b.onclick=()=>{let x=b.nextElementSibling;x.classList.toggle('open');b.textContent=x.classList.contains('open')?'收起条件 −':'查看条件与限制 +'})}
const relationLabels={exact_derivation:'严格推导（依前提）',conditional_derivation:'条件推导',controlled_approximation:'受控近似',empirical_relation:'经验关系',modeling_step:'建模步骤',inference_constraint:'机理检验约束',equilibrium_constraint:'平衡约束',conceptual_bridge:'概念联系',conceptual_distinction:'概念区分',explanation:'解释性联系',definition:'定义联系'};
function renderModulePaths(){
 const routes=db.module_paths||{};
 for(const [key,route] of Object.entries(routes)){
  const host=document.querySelector('[data-knowledge-module="'+key+'"]');if(!host)continue;
  host.innerHTML='<div class="knowledge-bridge-heading"><h3>'+esc(route.title)+'</h3><p>'+esc(route.intro)+'</p></div><div class="knowledge-bridge-grid">'+(route.paths||[]).map(path=>{
   const nodes=path.node_ids.map(id=>db.nodes.find(n=>n.id===id)).filter(Boolean);
   const r=db.relations.find(item=>item.id===path.relation_id);
   const links=nodes.map(n=>'<a class="concept-link" href="#concept/'+esc(n.id)+'">'+esc(n.title)+'</a>').join('');
   const detail=r?'<p class="knowledge-bridge-relation"><strong>'+esc(relationLabels[r.type]||r.type)+'</strong> · '+esc(r.claim)+'</p><p class="knowledge-bridge-boundary">成立条件：'+esc((r.conditions||[]).join('；')||'详见节点中的前提')+'</p>':'<p class="knowledge-bridge-boundary">跨领域概念联系，不声称存在直接数学推导。</p>';
   return '<article class="knowledge-bridge-card"><h4>'+esc(path.title)+'</h4><div class="knowledge-bridge-nodes">'+links+'</div>'+detail+'</article>';
  }).join('')+'</div>';
 }
}
function focusKnowledgeNode(raw){
 let id;try{id=decodeURIComponent(raw)}catch(_){return false}
 if(!/^[a-z0-9._-]+$/i.test(id)||!db.nodes.some(n=>n.id===id))return false;
 selectedDomain='全部视角';renderDomains();showNode(id);renderRelations();
 networkFocusNode(id);
 const el=document.getElementById('network-viewport');
 el?.scrollIntoView({block:'nearest'});
 return true;
}

function renderStructureTheory(){
 const host=document.getElementById('sc-theory-grid'),M=window.CFStructureModels;if(!host||!M)return;
 host.innerHTML=M.catalog.map(m=>{
  const node=db.nodes.find(n=>n.id===m.node);
  return `<article class="sc-theory-card"><h4>${esc(node?.title||m.title)}</h4><p>${esc(node?.statement||m.scope)}</p><div class="sc-formula">${esc(m.formula)}</div><div class="sc-theory-actions"><a href="#concept/${esc(m.node)}">理论与边界 →</a><a href="#model.structure.${esc(m.id)}">交互模型 →</a></div></article>`;
 }).join('');
 const focus=M.twoState(0,0.8);
}
function renderTheory(){const ns=db.nodes.filter(n=>n.domain.some(d=>['quantum_statistical_mechanics','quantum_chemistry','thermodynamics','chemical_kinetics','structure_bonding'].includes(d)));$('#theory-cards').innerHTML=ns.map(n=>`<article class="theory-card"><div class="eyebrow">${esc(n.type)} · ${esc(n.claim_status)}</div><h3>${esc(n.title)}</h3><p>${esc(n.statement)}</p><a class="concept-link" href="#concept/${esc(n.id)}">查看知识关系 →</a></article>`).join('');}
function setBatteryMode(mode){const state=CFModels.leadAcid.state(mode);document.querySelectorAll('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('#negative-reaction').textContent=state.negativeReaction;$('#positive-reaction').textContent=state.positiveReaction;$('#electron-flow').textContent=state.electronFlow;$('#energy-flow').textContent=state.energyFlow;$('#overall-reaction').textContent=state.overallReaction;$('#mode-note').textContent=state.note}
document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>setBatteryMode(b.dataset.mode)));
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.page).classList.add('active')});
async function boot(){
 const embedded=document.getElementById('cf-data');
 const bundled=embedded&&embedded.textContent.trim()?JSON.parse(embedded.textContent):await (await fetch('./data/knowledge.json?v=20261118-intuition')).json();
 db={nodes:bundled.nodes,relations:bundled.relations,module_paths:bundled.module_paths||{}};
 renderDomains();renderGraph();renderRelations();renderTheory();renderStructureTheory();renderModulePaths();
 window.CFKnowledge=Object.freeze({focusNode:focusKnowledgeNode});
 if(window.location.hash.startsWith('#concept/'))focusKnowledgeNode(window.location.hash.slice(9));
 CFIntuitionWorkbench.init({nodes:db.nodes,relations:db.relations,examples:bundled.science_cases||[],relationLabels});
}
boot().catch(e=>{
 $('#graph').innerHTML='<p role="alert">知识数据加载失败：'+esc(e.message)+'。可刷新重试，其他页面仍可使用。</p>';
 $('#analysis').innerHTML='<p role="alert">无法加载知识网络。请刷新页面重试。</p>';
});
