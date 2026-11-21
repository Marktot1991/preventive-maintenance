function switchDept(dept, preventClear) {
  const changedDepartment = activeDepartment !== dept;
  activeDepartment = dept;
  if(typeof expandedPmSidebarDepartment !== "undefined")expandedPmSidebarDepartment=dept;
  if(changedDepartment && typeof expandedPmSidebarCategory !== "undefined")expandedPmSidebarCategory=null;
  if(!preventClear)pmTemplateEditMode=false;
  document.getElementById("em1-controls").classList.add("hidden");
  document.getElementById("em2-controls").classList.add("hidden");
  document.getElementById("resin-controls").classList.add("hidden");
  document.getElementById("wwt-controls").classList.add("hidden");
  if(dept === 'resin'){
    document.getElementById("resin-controls").classList.remove("hidden");
  } else if(dept === 'wwt'){
    document.getElementById("wwt-controls").classList.remove("hidden");
    document.getElementById("resin-controls").classList.remove("hidden");
  } else if(dept === 'em1'){
    document.getElementById("em1-controls").classList.remove("hidden");
  } else {
    document.getElementById("em2-controls").classList.remove("hidden");
  }
  if(!preventClear) { activeTankType = ""; activeTankName = ""; }
  ["deluting","delicel","additive","updown","tankfarm2","surpressor","silo","hopper","diverter","slurry","thinning","reactor","fmu","wwt_flow","wwt_cond","pigline","filling","selecta"].forEach(t=>{const e=document.getElementById(t+"Select");if(e)e.value=""});
  const oldDeptSelector=document.getElementById("deptSelect");
  if(oldDeptSelector)oldDeptSelector.value=dept;
  updateSidebarForDept();
  updateEquipmentSelect();
  updateSidebarActive();
  if(!preventClear) renderForm();
}

function switchTank(type){
  const el=document.getElementById(type+"Select");if(!el||!el.value)return;
  activeTankType=type;activeTankName=el.value;
  pmTemplateEditMode=false;
  ["deluting","delicel","additive","updown","tankfarm2","surpressor","silo","hopper","diverter","slurry","thinning","reactor","fmu","wwt_flow","wwt_cond","pigline","filling","selecta"].forEach(t=>{if(t!==type){const e=document.getElementById(t+"Select");if(e)e.value=""}});
  // V19: Selection is tab-local UI state, not shared pm_data. This prevents
  // another person's last open equipment from becoming everybody's login page.
  updateEquipmentSelect();
  updateSidebarActive();
  renderForm();
}

async function saveHeader(id){if(currentRole!=="view"&&activeTankName)await saveDataToServer(`${activeTankName}_header_${id}`,document.getElementById(id).value)}

async function toggleRadio(e,radio,key,value){
  if(currentRole==="view"){e.preventDefault();return false}
  if(radio.getAttribute("data-checked")==="true"){
    radio.checked = false;
    radio.setAttribute("data-checked","false");
    await saveDataToServer(key,"");
  }else{
    document.getElementsByName(radio.name).forEach(r=>{r.setAttribute("data-checked","false")});
    radio.setAttribute("data-checked","true");
    await saveDataToServer(key,value);
  }
  return true;
}

// ล้างเฉพาะข้อมูลผลตรวจ โดยเก็บการปรับแต่งแม่แบบ PM เอาไว้ทุกสิทธิ์
// ป้องกันการลบแม่แบบทางอ้อมด้วยปุ่มล้างข้อมูล (SQL trigger ปฏิเสธด้วยหากผู้ใช้ไม่มีสิทธิ์)
async function deleteTankInspectionData(tank){
  const prefix=tank+"_";
  const keys=Object.keys(dbData).filter(k=>k.startsWith(prefix)&&!isPmTemplateConfigKey(k));
  for(let i=0;i<keys.length;i+=60){
    const {error}=await db.from("pm_data").delete().in("data_key",keys.slice(i,i+60));
    if(error)throw error;
  }
}

async function clearCurrentTankData(){
  if(currentRole==="view"||!activeTankName)return;
  if(!confirm(`ล้างผลตรวจถัง ${activeTankName} บน Supabase ใช่หรือไม่?\n\nรายการแม่แบบ PM ที่ปรับแต่งไว้จะยังคงอยู่`))return;
  setLoading(true);
  try{
    await loadDbData(); // อ่านข้อมูลล่าสุดก่อนเลือกคีย์ที่จะลบ
    await deleteTankInspectionData(activeTankName);
    await loadDbData();renderForm();alert("ล้างผลตรวจถังเรียบร้อย (เก็บรายการ PM ที่ปรับแต่งไว้)");
  }catch(e){alert("เกิดข้อผิดพลาด: "+e.message)}finally{setLoading(false)}
}

async function clearCurrentGroupData(){
  if(currentRole==="view"||!activeTankType)return;
  const tanks=tankGroupMapping[activeTankType]||[];
  if(!tanks.length)return;
  if(!confirm(`⚠️ ล้างผลตรวจกรุ๊ป ${activeTankType} จำนวน ${tanks.length} อุปกรณ์?\n\nรายการแม่แบบ PM ที่ปรับแต่งไว้จะยังคงอยู่ แต่ผลตรวจที่ล้างไม่สามารถกู้คืนได้`))return;
  setLoading(true);
  try{
    await loadDbData();
    for(const tank of tanks)await deleteTankInspectionData(tank);
    await loadDbData();renderForm();alert("ล้างผลตรวจทั้งกรุ๊ปเรียบร้อย (เก็บรายการ PM ที่ปรับแต่งไว้)");
  }catch(e){alert("เกิดข้อผิดพลาด: "+e.message)}finally{setLoading(false)}
}

async function saveGroupDate(id){
  if(currentRole==="view"||!activeTankType)return;
  const value=document.getElementById(id).value,tanks=tankGroupMapping[activeTankType]||[];
  await saveMany(tanks.map(t=>({key:`${t}_header_${id}`,value})));
}
