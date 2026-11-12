const pmProgressGroupLabels={
  filling:"Auto Filling M/C",
  fmu:"Flow Meter Unit",
  deluting:"Letdown Tanks",
  delicel:"Delicel Tanks",
  additive:"Additive Tanks",
  updown:"Up Down Mixer",
  tankfarm2:"Tank Farm 2",
  surpressor:"Surpressor",
  silo:"Silo Powder",
  hopper:"Hopper Powder",
  diverter:"2-Way Diverter",
  slurry:"Slurry",
  thinning:"Thinning Tank",
  reactor:"Reactor",
  wwt_flow:"WWT Flow Meter",
  wwt_cond:"WWT Conductivity",
  pigline:"Pigline"
};
const pmProgressDeptByGroup={
  filling:"em2",
  fmu:"em1",
  deluting:"em2",delicel:"em2",additive:"em2",updown:"em2",tankfarm2:"em2",surpressor:"em2",silo:"em2",hopper:"em2",diverter:"em2",slurry:"em2",pigline:"em2",
  thinning:"resin",reactor:"resin",
  wwt_flow:"wwt",wwt_cond:"wwt"
};

function schedulePMProgressRefresh(){
  clearTimeout(window.__pmProgressTimer);
  window.__pmProgressTimer=setTimeout(()=>{if(currentPage==="progress")renderPMProgress()},180);
}

function calculateTankProgress(groupType,tank){
  const savedType=activeTankType;
  const savedName=activeTankName;
  const savedDept=activeDepartment;
  try{
    activeTankType=groupType;
    activeTankName=tank;
    activeDepartment=pmProgressDeptByGroup[groupType]||"em2";
    renderForm();

    const root=document.getElementById("checklist-container");
    if(!root)return {groupType,tank,total:0,done:0,percent:0,ok:0,no:0};

    const byName=new Map();
    root.querySelectorAll('tr[data-pm-check="1"] input[type="radio"]').forEach(r=>{
      const name=r.name||"";
      if(!name)return;
      if(!byName.has(name))byName.set(name,{done:false,ok:false,no:false});
      const item=byName.get(name);
      if(r.checked){
        item.done=true;
        if(r.value==="OK")item.ok=true;
        if(r.value==="NO")item.no=true;
      }
    });

    let done=0,ok=0,no=0;
    byName.forEach(v=>{
      if(v.done)done++;
      if(v.ok)ok++;
      if(v.no)no++;
    });
    const total=byName.size;
    const percent=total?Math.round((done/total)*1000)/10:0;
    return {groupType,tank,total,done,percent,ok,no};
  }finally{
    activeTankType=savedType;
    activeTankName=savedName;
    activeDepartment=savedDept;
    renderForm();
  }
}

function getProgressRows(){
  const dept=document.getElementById("progressDeptFilter")?.value||"all";
  const group=document.getElementById("progressGroupFilter")?.value||"all";
  const search=(document.getElementById("progressSearch")?.value||"").trim().toLowerCase();
  const rows=[];

  Object.entries(tankGroupMapping).forEach(([groupType,tanks])=>{
    const groupDept=pmProgressDeptByGroup[groupType]||"em2";
    if(dept!=="all"&&groupDept!==dept)return;
    if(group!=="all"&&groupType!==group)return;
    [...new Set(tanks||[])].forEach(tank=>{
      const label=pmProgressGroupLabels[groupType]||groupType;
      const displayTank=groupType==="slurry"
        ? ((slurryTankDescriptions[tank]||tank).split(/\s+/)[0]||tank)
        : tank;
      if(search&&!(`${tank} ${displayTank} ${label} ${groupType}`.toLowerCase().includes(search)))return;
      rows.push(calculateTankProgress(groupType,tank));
    });
  });
  return rows;
}

function renderProgressGroupOptions(){
  const sel=document.getElementById("progressGroupFilter");
  if(!sel)return;
  const current=sel.value||"all";
  sel.innerHTML='<option value="all">ทุกกลุ่ม</option>';
  Object.entries(pmProgressGroupLabels).forEach(([k,v])=>sel.add(new Option(v,k)));
  if([...sel.options].some(o=>o.value===current))sel.value=current;
}

function aggregateProgressByGroup(rows){
  const map=new Map();
  rows.forEach(r=>{
    if(!map.has(r.groupType))map.set(r.groupType,{groupType:r.groupType,total:0,done:0,forms:0});
    const g=map.get(r.groupType);
    g.total+=r.total;
    g.done+=r.done;
    g.forms++;
  });
  return [...map.values()]
    .map(g=>({...g,percent:g.total?Math.round((g.done/g.total)*1000)/10:0}))
    .sort((a,b)=>b.percent-a.percent || a.groupType.localeCompare(b.groupType));
}

function renderDepartmentPanel(dept,rows){
  const labels=dept==="em1"?{name:"EM1",title:"Emulsion 1",icon:"fa-industry"}:dept==="em2"?{name:"EM2",title:"Emulsion 2",icon:"fa-industry"}:dept==="wwt"?{name:"WWT",title:"Waste Water Treatment",icon:"fa-water"}:{name:"Resin PD1",title:"Resin PD1",icon:"fa-flask-vial"};

  const total=rows.reduce((a,r)=>a+r.total,0);
  const done=rows.reduce((a,r)=>a+r.done,0);
  const overall=total?Math.round((done/total)*1000)/10:0;
  const complete=rows.filter(r=>r.total>0&&r.done===r.total).length;
  const started=rows.filter(r=>r.done>0&&r.done<r.total).length;
  const notStarted=rows.filter(r=>r.done===0).length;
  const groupRows=aggregateProgressByGroup(rows);

  return `<section class="progress-dept-panel">
    <div class="progress-dept-head">
      <div class="progress-dept-title">
        <span class="progress-dept-icon"><i class="fa-solid ${labels.icon}"></i></span>
        <span>${esc(labels.name)} <small style="font-size:10px;color:var(--text-muted);font-weight:800">· ${esc(labels.title)}</small></span>
      </div>
      <span class="progress-dept-count">${rows.length} ฟอร์ม</span>
    </div>
    <div class="progress-dept-body">
      <div class="progress-overview">
        <div class="progress-ring" style="--progress-pct:${Math.max(0,Math.min(100,overall))}">
          <div class="progress-ring-center">
            <div class="progress-ring-value">${overall}%</div>
            <div class="progress-ring-label">ความคืบหน้ารวม</div>
          </div>
        </div>
        <div class="progress-overview-stats">
          <div class="progress-mini-stat"><span class="label">ติ๊กแล้ว</span><span class="value">${done.toLocaleString()} / ${total.toLocaleString()}</span></div>
          <div class="progress-mini-stat"><span class="label">ครบ 100%</span><span class="value">${complete}</span></div>
          <div class="progress-mini-stat"><span class="label">กำลังทำ</span><span class="value">${started}</span></div>
          <div class="progress-mini-stat"><span class="label">ยังไม่เริ่ม</span><span class="value">${notStarted}</span></div>
        </div>
      </div>

      <h3 class="progress-group-chart-title">ความคืบหน้าตามกลุ่มอุปกรณ์</h3>
      <div class="progress-group-chart">
        ${groupRows.length?groupRows.map(g=>{
          const label=pmProgressGroupLabels[g.groupType]||g.groupType;
          return `<div class="progress-group-row">
            <div class="progress-group-label" title="${esc(label)}">${esc(label)}</div>
            <div class="progress-group-bar"><div class="progress-group-fill" style="width:${Math.max(0,Math.min(100,g.percent))}%"></div></div>
            <div class="progress-group-percent">${g.percent}%</div>
          </div>`;
        }).join(""):'<div class="progress-no-data">ไม่มีข้อมูลของแผนกนี้ตามตัวกรองที่เลือก</div>'}
      </div>
    </div>
  </section>`;
}

function renderRepairDepartmentPanel(dept,rows){
  const labels=dept==="em1"?{name:"EM1",title:"Emulsion 1"}:dept==="em2"?{name:"EM2",title:"Emulsion 2"}:dept==="wwt"?{name:"WWT",title:"Waste Water Treatment"}:{name:"Resin PD1",title:"Resin PD1"};

  const total=rows.reduce((a,r)=>a+r.total,0);
  const no=rows.reduce((a,r)=>a+r.no,0);
  const repairPct=total?Math.round((no/total)*1000)/10:0;
  const formsWithRepair=rows.filter(r=>r.no>0).length;

  const groupRows=new Map();
  rows.forEach(r=>{
    if(!groupRows.has(r.groupType)){
      groupRows.set(r.groupType,{groupType:r.groupType,total:0,no:0,forms:0,formsWithRepair:0});
    }
    const g=groupRows.get(r.groupType);
    g.total+=r.total;
    g.no+=r.no;
    g.forms++;
    if(r.no>0)g.formsWithRepair++;
  });
  const sorted=[...groupRows.values()]
    .map(g=>({...g,percent:g.total?Math.round((g.no/g.total)*1000)/10:0}))
    .sort((a,b)=>b.percent-a.percent || a.groupType.localeCompare(b.groupType));

  return `<section class="progress-repair-panel">
    <div class="progress-repair-panel-head">
      <div class="progress-repair-panel-title">
        <i class="fa-solid fa-chart-bar"></i>
        <span>${esc(labels.name)} · ${esc(labels.title)}</span>
      </div>
      <span class="progress-repair-panel-count">${formsWithRepair} ฟอร์มมีรายการรอแก้</span>
    </div>

    <div class="progress-repair-total-wrap">
      <div class="progress-repair-total-donut" style="--repair-pct:${Math.max(0,Math.min(100,repairPct))}">
        <div class="progress-repair-total-donut-center">
          <div class="progress-repair-total-donut-value">${repairPct}%</div>
          <div class="progress-repair-total-donut-label">NO รวม</div>
        </div>
      </div>
      <div class="progress-repair-total">
        <span>NO รวม / รายการที่มีชื่อ</span>
        <strong>${no.toLocaleString()} / ${total.toLocaleString()}</strong>
      </div>
    </div>

    <div class="progress-repair-list">
      ${sorted.length?sorted.map(g=>{
        const pct=g.percent;
        const label=pmProgressGroupLabels[g.groupType]||g.groupType;
        const hasRepair=g.no>0;

        return `<div class="progress-repair-row ${hasRepair?"has-repair":""}" title="${esc(label)} · NO ${g.no}/${g.total}">
          <div class="progress-repair-form">${esc(label)}<small>${g.forms} ฟอร์ม · ${g.formsWithRepair} ฟอร์มมี NO</small></div>
          <div class="progress-repair-bar-wrap">
            <div class="progress-repair-bar ${hasRepair?"":"zero"}" style="width:${Math.max(0,Math.min(100,pct))}%"></div>
          </div>
          <div class="progress-repair-percent">${pct}%</div>
          <div class="progress-repair-count">NO ${g.no}/${g.total}</div>
          <div class="progress-repair-status ${hasRepair?"":"clear"}">
            <i class="fa-solid ${hasRepair?"fa-triangle-exclamation":"fa-circle-check"}"></i>
            ${hasRepair?"มีรายการรอแก้":"ไม่มี NO"}
          </div>
        </div>`;
      }).join(""):'<div class="progress-repair-empty">ไม่มีฟอร์มตามตัวกรองที่เลือก</div>'}
    </div>
  </section>`;
}


function renderPMVisualCharts(rows,em1Rows,em2Rows,resinRows,wwtRows,filteredDept){
  const barRoot=document.getElementById("pm-plan-actual-chart");
  const donutRoot=document.getElementById("pm-result-donut");
  const areaRoot=document.getElementById("pm-group-trend-chart");
  if(!barRoot||!donutRoot||!areaRoot)return;

  const deptData=[];
  if(filteredDept==="all"||filteredDept==="em1")deptData.push({label:"EM1",rows:em1Rows});
  if(filteredDept==="all"||filteredDept==="em2")deptData.push({label:"EM2",rows:em2Rows});
  if(filteredDept==="all"||filteredDept==="resin")deptData.push({label:"Resin PD1",rows:resinRows});
  if(filteredDept==="all"||filteredDept==="wwt")deptData.push({label:"WWT",rows:wwtRows});
  const stats=deptData.map(d=>({label:d.label,plan:d.rows.reduce((a,r)=>a+r.total,0),checked:d.rows.reduce((a,r)=>a+r.done,0)}));
  const maxPlan=Math.max(1,...stats.map(x=>x.plan));
  const roundedMax=Math.max(5,Math.ceil(maxPlan/5)*5);
  const chartW=700,chartH=252,left=49,right=18,top=18,bottom=42;
  const plotW=chartW-left-right,plotH=chartH-top-bottom,baseY=top+plotH;
  const yGrid=[];
  for(let i=0;i<=4;i++){
    const value=roundedMax*i/4, y=baseY-(value/roundedMax)*plotH;
    yGrid.push(`<line x1="${left}" y1="${y}" x2="${chartW-right}" y2="${y}" stroke="#29465b" stroke-width="1"/><text x="${left-10}" y="${y+4}" text-anchor="end" fill="#8fa9bd" font-size="11">${Math.round(value)}</text>`);
  }
  let bars="";
  const groupSlot=plotW/Math.max(stats.length,1),barW=Math.min(45,groupSlot*.24);
  const planBar3D=(x,y,w,h,kind,label,value)=>{
    const dx=7,dy=5,base=kind==='planned'?'#d5e4ee':'#2587bd';
    const top=kind==='planned'?'#f4fbff':'#6bc4f5';
    const side=kind==='planned'?'#879dad':'#14547f';
    return `<g class="pm-3d-column pm-3d-${kind}">
      <polygon class="pm-3d-column-side" points="${x+w},${y} ${x+w+dx},${y-dy} ${x+w+dx},${baseY-dy} ${x+w},${baseY}" fill="${side}"/>
      <polygon class="pm-3d-column-top" points="${x},${y} ${x+dx},${y-dy} ${x+w+dx},${y-dy} ${x+w},${y}" fill="${top}"/>
      <rect class="pm-3d-column-front" x="${x}" y="${y}" width="${w}" height="${Math.max(0,h)}" rx="1.5" fill="${base}"><title>${esc(label)} ${kind}: ${value}</title></rect>
    </g>`;
  };
  stats.forEach((d,i)=>{
    const cx=left+groupSlot*(i+.5);
    const ph=d.plan/roundedMax*plotH,ch=d.checked/roundedMax*plotH;
    bars+=planBar3D(cx-barW-3,baseY-ph,barW,ph,'planned',d.label,d.plan);
    bars+=planBar3D(cx+3,baseY-ch,barW,ch,'actual',d.label,d.checked);
    bars+=`<text x="${cx}" y="${baseY+22}" text-anchor="middle" fill="#b9cddc" font-size="12" font-weight="700">${esc(d.label)}</text>`;
  });
  barRoot.innerHTML=stats.length&&rows.length?`<svg viewBox="0 0 ${chartW} ${chartH}" role="img" aria-label="Planned tasks compared with checked tasks">${yGrid.join("")}<line x1="${left}" y1="${baseY}" x2="${chartW-right}" y2="${baseY}" stroke="#527086" stroke-width="1.2"/>${bars}</svg>`:'<div class="pm-visual-no-data">ไม่มีข้อมูลตามตัวกรองที่เลือก</div>';

  const status={ok:rows.reduce((a,r)=>a+r.ok,0),no:rows.reduce((a,r)=>a+r.no,0),pending:rows.reduce((a,r)=>a+Math.max(0,r.total-r.done),0)};
  const statusTotal=status.ok+status.no+status.pending;
  const pOk=statusTotal?status.ok/statusTotal*100:0;
  const pNo=statusTotal?status.no/statusTotal*100:0;
  const pPending=statusTotal?status.pending/statusTotal*100:0;
  const noStart=pOk, noEnd=pOk+pNo;
  const donutBg=statusTotal?`conic-gradient(#35d8b0 0 ${noStart}%,#ff6675 ${noStart}% ${noEnd}%,#526579 ${noEnd}% 100%)`:`conic-gradient(#294256 0 100%)`;
  const legend=(color,label,val,pct)=>`<div class="pm-donut-legend-item"><i class="pm-donut-legend-dot" style="background:${color}"></i><span class="pm-donut-legend-name">${label}</span><strong class="pm-donut-legend-value">${val.toLocaleString()} <span style="color:#90aabd;font-weight:700">${statusTotal?Math.round(pct):0}%</span></strong></div>`;
  donutRoot.innerHTML=`<div class="pm-visual-donut" style="background:${donutBg}"><div class="pm-visual-donut-center"><div class="pm-visual-donut-total">${statusTotal.toLocaleString()}</div><div class="pm-visual-donut-label">TOTAL ITEMS</div></div></div><div class="pm-visual-donut-legend">${legend('#35d8b0','OK',status.ok,pOk)}${legend('#ff6675','NO',status.no,pNo)}${legend('#526579','Pending',status.pending,pPending)}</div>`;

  const groups=aggregateProgressByGroup(rows).slice(0,12);
  const avgLabel=document.getElementById("pm-group-average-label");
  if(!groups.length){
    areaRoot.innerHTML='<div class="pm-visual-no-data">ไม่มีข้อมูลตามตัวกรองที่เลือก</div>';
    if(avgLabel)avgLabel.textContent='0%';
    return;
  }

  const w=1100,h=290,l=52,r=22,t=20,b=66;
  const pw=w-l-r,ph=h-t-b,barBaseY=t+ph;
  const cleanPct=v=>Math.max(0,Math.min(100,Number(v)||0));
  const pctAvg=groups.reduce((sum,g)=>sum+cleanPct(g.percent),0)/groups.length;
  if(avgLabel)avgLabel.textContent=`${Math.round(pctAvg*10)/10}%`;
  let pctGrid='';
  [0,20,40,60,80,100].forEach(v=>{
    const y=t+(100-v)/100*ph;
    pctGrid+=`<line x1="${l}" y1="${y}" x2="${w-r}" y2="${y}" stroke="${v===0?'#58758a':'#29465b'}" stroke-width="${v===0?'1.4':'1'}" ${v===0?'':'stroke-dasharray="3 4"'}/><text x="${l-11}" y="${y+4}" text-anchor="end" fill="#9db5c7" font-size="11" font-weight="700">${v}%</text>`;
  });
  const pctSlot=pw/groups.length;
  const pctBarW=Math.min(54,pctSlot*.55);
  let pctBars='',pctLabels='';
  groups.forEach((g,i)=>{
    const pct=cleanPct(g.percent);
    const bh=pct/100*ph;
    const x=l+pctSlot*i+(pctSlot-pctBarW)/2;
    const y=barBaseY-bh;
    const label=pmProgressGroupLabels[g.groupType]||g.groupType;
    const shortLabel=label.length>15?label.slice(0,14)+'…':label;
    const dx3=8,dy3=6,frontH=Math.max(0,bh);
    pctBars+=`<g class="pm-percent-column">
      <polygon class="pm-percent-column-side" points="${(x+pctBarW).toFixed(1)},${y.toFixed(1)} ${(x+pctBarW+dx3).toFixed(1)},${(y-dy3).toFixed(1)} ${(x+pctBarW+dx3).toFixed(1)},${(barBaseY-dy3).toFixed(1)} ${(x+pctBarW).toFixed(1)},${barBaseY.toFixed(1)}" fill="#24547f"/>
      <polygon class="pm-percent-column-top" points="${x.toFixed(1)},${y.toFixed(1)} ${(x+dx3).toFixed(1)},${(y-dy3).toFixed(1)} ${(x+pctBarW+dx3).toFixed(1)},${(y-dy3).toFixed(1)} ${(x+pctBarW).toFixed(1)},${y.toFixed(1)}" fill="#8bcaff"/>
      <rect class="pm-percent-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${pctBarW.toFixed(1)}" height="${frontH.toFixed(1)}" rx="2" fill="url(#pmPercentBarGradient)" stroke="#4b91c6" stroke-width=".6"><title>${esc(label)}: ${pct.toFixed(1)}%</title></rect>
      <text x="${(x+pctBarW/2+3).toFixed(1)}" y="${Math.max(t+12,y-10).toFixed(1)}" text-anchor="middle" fill="#e6f6ff" font-size="${groups.length>8?10:12}" font-weight="850">${Math.round(pct)}%</text>
    </g>`;
    pctLabels+=`<text x="${(l+pctSlot*(i+.5)).toFixed(1)}" y="${barBaseY+19}" text-anchor="middle" fill="#bdd0df" font-size="${groups.length>8?9:11}" font-weight="700"><title>${esc(label)}</title>${esc(shortLabel)}</text>`;
  });
  const avgY=t+(100-pctAvg)/100*ph;
  const avgLine=`<line class="pm-percent-average" x1="${l}" y1="${avgY.toFixed(1)}" x2="${w-r}" y2="${avgY.toFixed(1)}" stroke="#e0525b" stroke-width="3.5" stroke-linecap="round"><title>ค่าเฉลี่ย ${pctAvg.toFixed(1)}%</title></line>`;
  const avgTagX=w-r-3;
  const avgTagY=Math.max(t+12,Math.min(barBaseY-5,avgY-8));
  const avgTag=`<rect x="${avgTagX-58}" y="${avgTagY-12}" width="58" height="18" rx="5" fill="#642e39" stroke="#e0525b" stroke-width=".7"/><text x="${avgTagX-29}" y="${avgTagY+1}" text-anchor="middle" fill="#ffdce0" font-size="10" font-weight="900">AVG ${Math.round(pctAvg*10)/10}%</text>`;
  areaRoot.innerHTML=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="PM completion percentages from zero to one hundred with average line"><defs><linearGradient id="pmPercentBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#69b8f4"/><stop offset="100%" stop-color="#3274b8"/></linearGradient><filter id="pmBarGlow" x="-30%" y="-20%" width="160%" height="150%"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${pctGrid}${pctBars}${avgLine}${avgTag}${pctLabels}<text x="${l}" y="${h-8}" fill="#7f9bb0" font-size="10">เปอร์เซ็นต์ความคืบหน้า</text></svg>`;
}

function renderPMProgress(){
  if(currentPage!=="progress")return;
  const rowsEl=document.getElementById("progress-rows");
  const summaryEl=document.getElementById("progress-summary");
  const deptGrid=document.getElementById("progress-dept-grid");
  if(!rowsEl||!summaryEl||!deptGrid)return;

  const rows=getProgressRows();
  progressCache=rows;

  const total=rows.reduce((a,r)=>a+r.total,0);
  const done=rows.reduce((a,r)=>a+r.done,0);
  const overall=total?Math.round((done/total)*1000)/10:0;
  const completeForms=rows.filter(r=>r.total>0&&r.done===r.total).length;
  const startedForms=rows.filter(r=>r.done>0&&r.done<r.total).length;
  const notStartedForms=rows.filter(r=>r.done===0).length;

  const totalNo=rows.reduce((a,r)=>a+r.no,0);
  summaryEl.innerHTML=`
    <div class="progress-card">
      <div class="progress-card-label">PM COMPLIANCE RATE</div>
      <div class="progress-card-value">${overall}%</div>
      <div class="progress-card-sub">${done.toLocaleString()} / ${total.toLocaleString()} รายการตรวจแล้ว</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">PM ITEMS CHECKED</div>
      <div class="progress-card-value">${done.toLocaleString()}</div>
      <div class="progress-card-sub">จากแผนทั้งหมด ${total.toLocaleString()} รายการ</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">OUTSTANDING NO ITEMS</div>
      <div class="progress-card-value">${totalNo.toLocaleString()}</div>
      <div class="progress-card-sub">รายการที่ต้องติดตามแก้ไข</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">FORMS COMPLETED</div>
      <div class="progress-card-value">${completeForms}</div>
      <div class="progress-card-sub">ครบ 100% จาก ${rows.length} ฟอร์ม</div>
    </div>`;

  const filteredDept=document.getElementById("progressDeptFilter")?.value||"all";
  const em1Rows=rows.filter(r=>pmProgressDeptByGroup[r.groupType]==="em1");
  const em2Rows=rows.filter(r=>pmProgressDeptByGroup[r.groupType]==="em2");
  const resinRows=rows.filter(r=>pmProgressDeptByGroup[r.groupType]==="resin");
  const wwtRows=rows.filter(r=>pmProgressDeptByGroup[r.groupType]==="wwt");
  renderPMVisualCharts(rows,em1Rows,em2Rows,resinRows,wwtRows,filteredDept);

  let panels="";
  if(filteredDept==="all"||filteredDept==="em1")panels+=renderDepartmentPanel("em1",em1Rows);
  if(filteredDept==="all"||filteredDept==="em2")panels+=renderDepartmentPanel("em2",em2Rows);
  if(filteredDept==="all"||filteredDept==="resin")panels+=renderDepartmentPanel("resin",resinRows);
  if(filteredDept==="all"||filteredDept==="wwt")panels+=renderDepartmentPanel("wwt",wwtRows);
  deptGrid.innerHTML=panels || '<div class="progress-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>';

  const repairGrid=document.getElementById("progress-repair-grid");
  if(repairGrid){
    let repairPanels="";
    if(filteredDept==="all"||filteredDept==="em1")repairPanels+=renderRepairDepartmentPanel("em1",em1Rows);
    if(filteredDept==="all"||filteredDept==="em2")repairPanels+=renderRepairDepartmentPanel("em2",em2Rows);
    if(filteredDept==="all"||filteredDept==="resin")repairPanels+=renderRepairDepartmentPanel("resin",resinRows);
    if(filteredDept==="all"||filteredDept==="wwt")repairPanels+=renderRepairDepartmentPanel("wwt",wwtRows);
    repairGrid.innerHTML=repairPanels || '<div class="progress-repair-empty">ไม่พบข้อมูลตามเงื่อนไขที่เลือก</div>';
  }

  if(!rows.length){
    rowsEl.innerHTML='<div class="progress-empty">ไม่พบฟอร์มตามเงื่อนไขที่เลือก</div>';
    return;
  }

  rows.sort((a,b)=>a.percent-b.percent || a.groupType.localeCompare(b.groupType) || a.tank.localeCompare(b.tank));
  rowsEl.innerHTML=rows.map(r=>{
    const label=pmProgressGroupLabels[r.groupType]||r.groupType;
    const dept=pmProgressDeptByGroup[r.groupType]==="em1"?"EM1":pmProgressDeptByGroup[r.groupType]==="resin"?"Resin PD1":pmProgressDeptByGroup[r.groupType]==="wwt"?"WWT":"EM2";
    const state=r.percent>=100?"done":r.percent>0?"partial":"zero";
    const displayTank=r.groupType==="slurry"
      ? ((slurryTankDescriptions[r.tank]||r.tank).split(/\s+/)[0]||r.tank)
      : r.tank;
    return `<div class="progress-row row-${state}">
      <div class="progress-form-name">${esc(displayTank)}<small>${esc(dept)} · ${esc(label)}</small></div>
      <div><span class="progress-group-badge">${esc(label)}</span></div>
      <div class="progress-bar-wrap" title="${r.done} / ${r.total} รายการ"><div class="progress-bar ${state}" style="width:${Math.max(0,Math.min(100,r.percent))}%"></div></div>
      <div class="progress-percent ${state}">${r.percent}%</div>
      <div class="progress-checks">${r.done}/${r.total} · OK ${r.ok} / NO ${r.no}</div>
    </div>`;
  }).join("");
}

async function refreshPMProgress(){
  if(currentPage!=="progress")return;
  const btn=document.querySelector(".progress-refresh-btn");
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...';}
  try{
    await loadDbData();
    renderPMProgress();
  }catch(e){
    alert("โหลดข้อมูล PM ไม่สำเร็จ: "+e.message);
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-rotate"></i> รีเฟรช';}
  }
}
