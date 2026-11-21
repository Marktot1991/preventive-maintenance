function formatMonthEn(yyyy_mm) {
    if (!yyyy_mm || yyyy_mm.length < 7) return "";
    const y = yyyy_mm.substring(0, 4);
    const m = parseInt(yyyy_mm.substring(5, 7), 10);
    if(isNaN(m)) return "";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[m-1]} ${y}`;
}
function onMonthFocus(el) {
    if(currentRole === "view") return;
    el.type = 'month';
    el.value = el.dataset.val || '';
    try { el.showPicker(); } catch(e){}
}
function onMonthBlur(el) {
    el.dataset.val = el.value || '';
    el.type = 'text';
    el.value = formatMonthEn(el.dataset.val);
}
function onMonthChange(el, hiddenId) {
    el.dataset.val = el.value;
    const hiddenEl = document.getElementById(hiddenId);
    if(hiddenEl) {
        hiddenEl.value = el.value;
        saveGroupDate(hiddenId);
    }
}

function fillSelect(id,arr){const s=document.getElementById(id);arr.forEach(x=>s.add(new Option(x,x)))}
function initSelectors(){
  fillSelect("delutingSelect",delutingTanks);fillSelect("delicelSelect",delicelTanks);fillSelect("additiveSelect",additiveTanks);fillSelect("updownSelect",updownTanks);fillSelect("tankfarm2Select",tankfarm2Tanks);fillSelect("surpressorSelect",surpressorTanks);fillSelect("siloSelect",siloPowderTanks);fillSelect("hopperSelect",hopperPowderTanks);fillSelect("diverterSelect",diverterTanks);
  fillSelect("thinningSelect",resinThinningTanks);fillSelect("reactorSelect",resinReactorTanks);fillSelect("slurrySelect",slurryTanks);fillSelect("fmuSelect",fmuTanks);
  fillSelect("wwt_flowSelect",wwtFlowTanks);fillSelect("wwt_condSelect",wwtCondTanks);fillSelect("piglineSelect",piglineTanks);fillSelect("fillingSelect",fillingTanks);fillSelect("selectaSelect",selectaTanks);
  initPmSidebarDropdowns();
}

function toggleSidebar(){
  const isMobile=window.innerWidth<=720;

  // มือถือ: เปิด/ปิด Sidebar แบบเลื่อนเข้า-ออก โดยไม่เปลี่ยน layout ของหน้า
  if(isMobile){
    document.body.classList.remove("sidebar-collapsed");
    document.body.classList.toggle("sidebar-open");
    return;
  }

  // Desktop: ใช้ class ให้ CSS จัดการ ไม่เขียน inline style และไม่วนแก้ DOM ทีละเมนู
  document.body.classList.remove("sidebar-open");
  document.body.classList.toggle("sidebar-collapsed");

  const collapsed=document.body.classList.contains("sidebar-collapsed");
  const icon=document.querySelector(".sidebar-collapse i");
  if(icon) icon.className=collapsed
    ?"fa-solid fa-angles-right"
    :"fa-solid fa-angles-left";
}
// V13 — department → PM group → named forms. Built once from local equipment lists.
const pmSidebarGroupDepartment = {
  fmu:'em1',
  deluting:'em2',delicel:'em2',additive:'em2',updown:'em2',tankfarm2:'em2',
  surpressor:'em2',silo:'em2',hopper:'em2',diverter:'em2',slurry:'em2',pigline:'em2',filling:'em2',selecta:'em2',
  thinning:'resin',reactor:'resin',wwt_flow:'wwt',wwt_cond:'wwt'
};
const pmSidebarDepartmentNames = {em1:'EM1',em2:'EM2',resin:'Resin PD1',wwt:'WWT'};
let expandedPmSidebarDepartment = null;
let expandedPmSidebarCategory = null;
function getPmSidebarEquipmentLabel(type, value){
  if(type === 'slurry') return (slurryTankDescriptions[value] || value).split(/\s+/)[0] || value;
  if(type === 'fmu') return 'Flow Meter Unit ' + parseInt(value.split('-')[1],10);
  if(type === 'filling') return fillingMachineInfo[value]?.desc || value;
  if(type === 'selecta') return selectaMachineInfo[value]?.short || value;
  return value;
}
function initPmSidebarDropdowns(){
  document.querySelectorAll('.pm-side-group').forEach(group=>{
    const type=group.dataset.pmSideGroup;
    const list=group.querySelector('.pm-side-form-list');
    if(!list || !tankGroupMapping[type])return;
    const fragment=document.createDocumentFragment();
    (tankGroupMapping[type]||[]).forEach(value=>{
      const name=getPmSidebarEquipmentLabel(type,value);
      const button=document.createElement('button');
      button.type='button';
      button.className='pm-side-form-option';
      button.dataset.tank=value;
      button.title=(pmProgressGroupLabels[type]||type)+' / '+value;
      const code=document.createElement('span');
      code.className='pm-side-form-code';
      code.textContent=type==='slurry' ? name : (type==='selecta' ? (selectaMachineInfo[value]?.code||value) : value);
      button.appendChild(code);
      // Only include descriptive labels known from the existing PM data.
      const description=(type==='slurry' ? value : name);
      if(description && description!==code.textContent){
        const secondary=document.createElement('small');
        secondary.className='pm-side-form-description';
        secondary.textContent=description;
        button.appendChild(secondary);
      }
      button.addEventListener('click',()=>choosePmSidebarEquipment(type,value));
      fragment.appendChild(button);
    });
    list.replaceChildren(fragment);
  });
}
function ensurePmSidebarUncollapsed(){
  if(window.innerWidth>720 && document.body.classList.contains('sidebar-collapsed'))toggleSidebar();
}
function togglePmSidebarDepartment(dept){
  if(!Object.prototype.hasOwnProperty.call(pmSidebarDepartmentNames,dept))return;
  ensurePmSidebarUncollapsed();
  const next=expandedPmSidebarDepartment===dept ? null : dept;
  if(next!==expandedPmSidebarDepartment)expandedPmSidebarCategory=null;
  expandedPmSidebarDepartment=next;
  // Expanding a department does not change the selected PM form or write to Supabase.
  updateSidebarActive();
}
function togglePmSidebarCategory(type){
  const dept=pmSidebarGroupDepartment[type];
  if(!dept)return;
  ensurePmSidebarUncollapsed();
  if(expandedPmSidebarDepartment!==dept){
    expandedPmSidebarDepartment=dept;
    expandedPmSidebarCategory=null;
  }
  expandedPmSidebarCategory=expandedPmSidebarCategory===type ? null : type;
  updateSidebarActive();
}
function choosePmSidebarEquipment(type,value){
  const dept=pmSidebarGroupDepartment[type];
  if(!dept || !(tankGroupMapping[type]||[]).includes(value))return;
  const legacy=document.getElementById(type+'Select');
  if(!legacy)return;
  // Reuse the existing inspection save + form-render path, switching departments silently.
  if(activeDepartment!==dept)switchDept(dept,true);
  expandedPmSidebarDepartment=dept;
  expandedPmSidebarCategory=type;
  showPMForm();
  legacy.value=value;
  switchTank(type);
  if(window.innerWidth<=720)document.body.classList.remove('sidebar-open');
}
function syncPmSidebarDropdowns(){
  document.querySelectorAll('.pm-dept-section').forEach(section=>{
    const dept=section.dataset.pmDept;
    const isExpanded=expandedPmSidebarDepartment===dept;
    const button=section.querySelector('.pm-dept-toggle');
    const body=section.querySelector('.pm-dept-body');
    if(button){
      button.setAttribute('aria-expanded',String(isExpanded));
      button.classList.toggle('has-active-form',currentPage==='form' && activeDepartment===dept);
    }
    if(body)body.hidden=!isExpanded;
  });
  document.querySelectorAll('.pm-side-group').forEach(group=>{
    const type=group.dataset.pmSideGroup;
    const isExpanded=expandedPmSidebarDepartment===pmSidebarGroupDepartment[type] && expandedPmSidebarCategory===type;
    const button=group.querySelector('.tank-nav');
    const panel=group.querySelector('.pm-side-form-panel');
    if(button)button.setAttribute('aria-expanded',String(isExpanded));
    if(panel)panel.hidden=!isExpanded;
  });
  document.querySelectorAll('.pm-side-form-option.active').forEach(button=>{
    button.classList.remove('active');
    button.removeAttribute('aria-current');
  });
  if(currentPage==='form' && activeTankName){
    const group=document.querySelector('.pm-side-group[data-pm-side-group="'+activeTankType+'"]');
    group?.querySelectorAll('.pm-side-form-option').forEach(button=>{
      if(button.dataset.tank===activeTankName){
        button.classList.add('active');
        button.setAttribute('aria-current','page');
      }
    });
  }
}
function sidebarCategoryVisible(type){
  // All departments have direct submenus now; visibility is controlled by their parent.
  return Object.prototype.hasOwnProperty.call(pmSidebarGroupDepartment,type);
}
function updateSidebarForDept(){
  // Do not hide other departments: users can expand any department without selecting it.
  syncPmSidebarDropdowns();
}
function updatePmFormTopbarTitle(){
  if(currentPage!=='form')return;
  const title=document.getElementById('topbarPageTitle');
  if(!title)return;
  const icon=document.createElement('i');
  icon.className='fa-solid fa-clipboard-check';
  const label=document.createElement('span');
  label.textContent=activeTankName
    ? 'PM Checklist · '+(pmSidebarDepartmentNames[activeDepartment]||activeDepartment)+' / '+(pmProgressGroupLabels[activeTankType]||activeTankType)+' / '+getPmSidebarEquipmentLabel(activeTankType,activeTankName)
    : 'PM Checklist · เลือกฟอร์มจาก Sidebar';
  title.replaceChildren(icon,label);
  title.style.display='flex';
}
function updateSidebarActive(){
  document.querySelectorAll('.tank-nav').forEach(btn=>btn.classList.toggle('active',currentPage==='form' && btn.dataset.type===activeTankType));
  syncPmSidebarDropdowns();
  updatePmFormTopbarTitle();
  const nav=document.getElementById("navPMProgress");
  if(nav)nav.classList.toggle("active",currentPage==="progress");
  const navNotes=document.getElementById("navPMResultNote");
  if(navNotes)navNotes.classList.toggle("active",currentPage==="resultNotes");
  // Result Note accordion can be collapsed without leaving the Result Note page.
  const rnIsOpen=currentPage==="resultNotes" && resultNoteSidebarOpen;
  const rnSubmenu=document.getElementById("resultNoteDeptMenu");
  if(rnSubmenu)rnSubmenu.hidden=!rnIsOpen;
  if(navNotes)navNotes.setAttribute("aria-expanded",String(rnIsOpen));
  document.querySelectorAll("[data-result-dept]").forEach(btn=>{
    const dept=btn.dataset.resultDept;
    const expanded=rnIsOpen && resultNoteExpandedDept===dept;
    btn.classList.toggle("active",currentPage==="resultNotes" && dept===resultNoteDept);
    btn.setAttribute("aria-expanded",String(expanded));
    const sub=document.getElementById("resultNoteForms-"+dept);
    if(sub)sub.hidden=!expanded;
  });
  document.querySelectorAll('.result-note-side-group-block').forEach(block=>{
    const dept=block.dataset.resultNoteDept;
    const type=block.dataset.resultNoteGroup;
    const open=rnIsOpen && resultNoteExpandedDept===dept && resultNoteExpandedGroup===type;
    const toggle=block.querySelector('.result-note-side-group-toggle');
    const panel=block.querySelector('.result-note-side-form-buttons');
    if(toggle)toggle.setAttribute('aria-expanded',String(open));
    if(panel)panel.hidden=!open;
  });
  document.querySelectorAll('.result-note-side-form-option').forEach(btn=>{
    const choice=btn.dataset.resultNoteChoice||'';
    const active=currentPage==='resultNotes' && rnIsOpen && btn.closest('.result-note-form-submenu') && btn.closest('.result-note-form-submenu').id===('resultNoteForms-'+resultNoteDept) && choice===resultNoteFormFilter;
    btn.classList.toggle('active', active);
    if(active) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
  });
  const navHist=document.getElementById("navPMHistory");
  if(navHist)navHist.classList.toggle("active",currentPage==="history");
  const navAct=document.getElementById("navActivityLog");
  if(navAct)navAct.classList.toggle("active",currentPage==="activity");
  const navUsers=document.getElementById("navAdminUsers");
  if(navUsers)navUsers.classList.toggle("active",currentPage==="adminUsers");
  const navLogs=document.getElementById("navAdminLogs");
  if(navLogs)navLogs.classList.toggle("active",currentPage==="adminLogs");
  const navNext=document.getElementById("navPMNextDue");
  if(navNext)navNext.classList.toggle("active",currentPage==="nextdue");
}

function setAllMainPagesHidden(){
  ["pm-form-page","pm-progress-page","pm-history-page","pm-activity-page","pm-users-page","pm-logs-page","pm-next-due-page","pm-result-note-page"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.classList.add("hidden");
  });
}

function showPMForm(){
  currentPage="form";
  setAllMainPagesHidden();
  const form=document.getElementById("pm-form-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(form)form.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title)title.style.display="flex";
  updateSidebarActive();
}

function showPMProgress(){
  currentPage="progress";
  setAllMainPagesHidden();
  const dash=document.getElementById("pm-progress-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(dash)dash.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid fa-chart-column"></i><span>PM Progress Dashboard</span>';
  }
  updateSidebarActive();
  renderProgressGroupOptions();
  renderPMProgress();
}

function showPMHistory(){
  currentPage="history";
  setAllMainPagesHidden();
  const page=document.getElementById("pm-history-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(page)page.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid fa-clock-rotate-left"></i><span>PM History</span>';
  }
  updateSidebarActive();
  if(typeof renderHistoryGroupOptions==="function")renderHistoryGroupOptions();
  if(typeof renderPMHistory==="function")renderPMHistory();
}

function showPMActivityLog(){
  currentPage="activity";
  setAllMainPagesHidden();
  const page=document.getElementById("pm-activity-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(page)page.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid fa-user-pen"></i><span>Activity Log</span>';
  }
  updateSidebarActive();
  if(typeof renderActivityGroupOptions==="function")renderActivityGroupOptions();
  if(typeof renderActivityLog==="function")renderActivityLog(true);
}

function showAdminPage(pageId,page,icon,titleText){
  if(typeof isAdministrator!=="function"||!isAdministrator())return false;
  currentPage=page;
  setAllMainPagesHidden();
  const el=document.getElementById(pageId);
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(el)el.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid '+icon+'"></i><span>'+titleText+'</span>';
  }
  updateSidebarActive();
  return true;
}
function showAdminUsers(){
  if(showAdminPage("pm-users-page","adminUsers","fa-users-gear","จัดการผู้ใช้"))renderAdminUsers();
}
function showAdminLogs(){
  if(showAdminPage("pm-logs-page","adminLogs","fa-clipboard-user","Login & Export Log"))loadAdminLogs();
}

function showPMNextDue(){
  currentPage="nextdue";
  setAllMainPagesHidden();
  const page=document.getElementById("pm-next-due-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(page)page.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid fa-calendar-check"></i><span>Preventive Maintenance Next Due Date</span>';
  }
  updateSidebarActive();
  if(typeof renderNextDueGroupOptions==="function")renderNextDueGroupOptions();
  if(typeof renderBulkNextDueGroupOptions==="function")renderBulkNextDueGroupOptions();
  if(typeof renderPMNextDue==="function")renderPMNextDue();
}
function updateEquipmentSelect(){
  const sel=document.getElementById('equipmentSelect');
  if(!sel)return;
  const list=tankGroupMapping[activeTankType]||[];
  const current=activeTankName||'';
  sel.innerHTML='<option value="">-- เลือกอุปกรณ์ --</option>';
  list.forEach(v=>{
    const label = activeTankType === "slurry"
      ? ((slurryTankDescriptions[v]||v).split(/\s+/)[0] || v)
      : (activeTankType === "fmu" ? "Flow Meter Unit " + parseInt(v.split("-")[1], 10) : (activeTankType === "filling" ? (fillingMachineInfo[v]?.desc||v) : (activeTankType === "selecta" ? (selectaMachineInfo[v]?.desc||v) : v)));
    sel.add(new Option(label,v));
  });
  if(list.includes(current))sel.value=current;
}
function selectCategory(type){
  showPMForm();
  if(!sidebarCategoryVisible(type))return;
  activeTankType=type;
  pmTemplateEditMode=false;
  const legacy=document.getElementById(type+'Select');
  if(legacy&&legacy.value){
    activeTankName=legacy.value;
  }else{
    activeTankName="";
  }
  updateEquipmentSelect();
  updateSidebarActive();
  renderForm();
}
function switchTankFromTopbar(value){
  if(!value)return;
  const type=activeTankType;
  if(!type)return;
  const legacy=document.getElementById(type+'Select');
  if(!legacy)return;
  legacy.value=value;
  switchTank(type);
}
