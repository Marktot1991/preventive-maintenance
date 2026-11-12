function switchDept(dept, preventClear) {
  activeDepartment = dept;
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
  ["deluting","delicel","additive","updown","tankfarm2","surpressor","silo","hopper","diverter","slurry","thinning","reactor","fmu","wwt_flow","wwt_cond","pigline","filling"].forEach(t=>{const e=document.getElementById(t+"Select");if(e)e.value=""});
  document.getElementById("deptSelect").value=dept;
  updateSidebarForDept();
  updateEquipmentSelect();
  updateSidebarActive();
  if(!preventClear) renderForm();
}

function switchTank(type){
  const el=document.getElementById(type+"Select");if(!el||!el.value)return;
  activeTankType=type;activeTankName=el.value;
  ["deluting","delicel","additive","updown","tankfarm2","surpressor","silo","hopper","diverter","slurry","thinning","reactor","fmu","wwt_flow","wwt_cond","pigline","filling"].forEach(t=>{if(t!==type){const e=document.getElementById(t+"Select");if(e)e.value=""}});
  if(currentRole!=="view")saveMany([{key:"lastSavedTankType",value:type},{key:"lastSavedTank",value:activeTankName}]).catch(console.error);
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

async function clearCurrentTankData(){
  if(currentRole==="view"||!activeTankName)return;
  if(!confirm(`ล้างข้อมูลถัง ${activeTankName} บน Supabase ใช่หรือไม่?`))return;
  setLoading(true);
  try{
    const {error}=await db.from("pm_data").delete().like("data_key",`${likeEsc(activeTankName)}\\_%`);
    if(error)throw error;
    await loadDbData();renderForm();alert("เคลียร์ข้อมูลถังเรียบร้อย");
  }catch(e){alert("เกิดข้อผิดพลาด: "+e.message)}finally{setLoading(false)}
}

async function clearCurrentGroupData(){
  if(currentRole==="view"||!activeTankType)return;
  const tanks=tankGroupMapping[activeTankType]||[];
  if(!tanks.length)return;
  if(!confirm(`⚠️ ล้างข้อมูลกรุ๊ป ${activeTankType} จำนวน ${tanks.length} อุปกรณ์?\n\nการกระทำนี้ไม่สามารถกู้คืนได้`))return;
  setLoading(true);
  try{
    for(const tank of tanks){
      const {error}=await db.from("pm_data").delete().like("data_key",`${likeEsc(tank)}\\_%`);
      if(error)throw error;
    }
    await loadDbData();renderForm();alert("เคลียร์ข้อมูลทั้งกรุ๊ปเรียบร้อยแล้ว");
  }catch(e){alert("เกิดข้อผิดพลาด: "+e.message)}finally{setLoading(false)}
}

async function saveGroupDate(id){
  if(currentRole==="view"||!activeTankType)return;
  const value=document.getElementById(id).value,tanks=tankGroupMapping[activeTankType]||[];
  await saveMany(tanks.map(t=>({key:`${t}_header_${id}`,value})));
}
