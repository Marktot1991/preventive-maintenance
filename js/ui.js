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
  fillSelect("wwt_flowSelect",wwtFlowTanks);fillSelect("wwt_condSelect",wwtCondTanks);fillSelect("piglineSelect",piglineTanks);fillSelect("fillingSelect",fillingTanks);
}

function toggleSidebar(){
  document.body.classList.toggle("sidebar-open");
  const sidebar=document.getElementById("sidebar");
  const main=document.querySelector(".app-main");
  const top=document.querySelector(".app-topbar");
  if(!sidebar||!main||!top)return;
  if(window.innerWidth>720){
    document.body.classList.toggle("sidebar-collapsed");
    const collapsed=document.body.classList.contains("sidebar-collapsed");
    const w=collapsed?68:235;
    sidebar.style.width=w+"px";
    main.style.marginLeft=w+"px";
    top.style.left=w+"px";
    const icon=document.querySelector(".sidebar-collapse i");
    if(icon)icon.className=collapsed?"fa-solid fa-angles-right":"fa-solid fa-angles-left";
    document.querySelectorAll(".sidebar-link .menu-label,.sidebar-section-label,.dept-wrap,.brand-title,.menu-chevron").forEach(el=>el.style.display=collapsed?"none":"");
  }
}
function sidebarCategoryVisible(type){
  if(activeDepartment==='em1') return ['fmu'].includes(type);
  if(activeDepartment==='resin') return ['thinning','reactor'].includes(type);
  if(activeDepartment==='wwt') return ['wwt_flow','wwt_cond'].includes(type);
  return !['thinning','reactor','fmu','wwt_flow','wwt_cond'].includes(type);
}
function updateSidebarForDept(){
  document.querySelectorAll('.tank-nav').forEach(btn=>{
    btn.style.display=sidebarCategoryVisible(btn.dataset.type)?'flex':'none';
  });
}
function updateSidebarActive(){
  document.querySelectorAll('.tank-nav').forEach(btn=>btn.classList.toggle('active',currentPage==="form" && btn.dataset.type===activeTankType&&sidebarCategoryVisible(btn.dataset.type)));
  const nav=document.getElementById("navPMProgress");
  if(nav)nav.classList.toggle("active",currentPage==="progress");
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
  ["pm-form-page","pm-progress-page","pm-history-page","pm-activity-page","pm-users-page","pm-logs-page","pm-next-due-page"].forEach(id=>{
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
  if(eq)eq.style.display="flex";
  if(title)title.style.display="none";
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
      : (activeTankType === "fmu" ? "Flow Meter Unit " + parseInt(v.split("-")[1], 10) : (activeTankType === "filling" ? (fillingMachineInfo[v]?.desc||v) : v));
    sel.add(new Option(label,v));
  });
  if(list.includes(current))sel.value=current;
}
function selectCategory(type){
  showPMForm();
  if(!sidebarCategoryVisible(type))return;
  activeTankType=type;
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
