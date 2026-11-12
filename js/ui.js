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
}

function showPMForm(){
  currentPage="form";
  const form=document.getElementById("pm-form-page");
  const dash=document.getElementById("pm-progress-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(form)form.classList.remove("hidden");
  if(dash)dash.classList.add("hidden");
  if(eq)eq.style.display="flex";
  if(title)title.style.display="none";
  updateSidebarActive();
}

function showPMProgress(){
  currentPage="progress";
  const form=document.getElementById("pm-form-page");
  const dash=document.getElementById("pm-progress-page");
  const eq=document.querySelector(".topbar-equipment");
  const title=document.getElementById("topbarPageTitle");
  if(form)form.classList.add("hidden");
  if(dash)dash.classList.remove("hidden");
  if(eq)eq.style.display="none";
  if(title)title.style.display="flex";
  updateSidebarActive();
  renderProgressGroupOptions();
  renderPMProgress();
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
