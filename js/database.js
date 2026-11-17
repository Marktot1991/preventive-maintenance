function invalidateReportCaches(){
  if(typeof invalidateEquipmentRecordsCache === "function") invalidateEquipmentRecordsCache();
  if(typeof invalidateActivityCache === "function") invalidateActivityCache();
}

// ผู้ทำ PM: บันทึกชื่อผู้ใช้ที่แก้ไขฟอร์มของอุปกรณ์นั้นล่าสุด (เก็บเป็น key ของอุปกรณ์เอง จึงถูกล้างพร้อมข้อมูลถังเมื่อกดล้างข้อมูล)
function pmUserRowsForKeys(keys){
  if(currentPage!=="form"||!activeTankName||!currentUserName||!keys.length)return [];
  const p=activeTankName+"_";
  if(!keys.every(k=>String(k).startsWith(p)))return [];
  if(keys.every(k=>/_header_pmUser(At)?$/.test(k)))return [];
  return [
    {key:`${activeTankName}_header_pmUser`,value:currentUserName},
    {key:`${activeTankName}_header_pmUserAt`,value:new Date().toISOString()}
  ];
}

async function loadDbData(){
  const pageSize = 1000;
  const allRows = [];

  for(let from = 0; ; from += pageSize){
    const {data,error} = await db
      .from("pm_data")
      .select("data_key,data_value,updated_by,updated_at")
      .order("data_key", {ascending:true})
      .range(from, from + pageSize - 1);

    if(error) throw error;
    if(!data || data.length === 0) break;
    allRows.push(...data);
    if(data.length < pageSize) break;
  }

  dbData = {};
  dbMeta = {};
  allRows.forEach(r => {
    if(r && r.data_key != null){
      dbData[r.data_key] = r.data_value ?? "";
      dbMeta[r.data_key] = {by:r.updated_by||"", at:r.updated_at||""};
    }
  });
  invalidateReportCaches();
  await loadProfileNames();
  if(typeof invalidateProgressCache==="function")invalidateProgressCache();
}

// แปลง user id -> ชื่อ (ใช้กับข้อมูลเก่าที่ยังไม่มีชื่อผู้ทำ PM) ถ้าอ่านตาราง profiles ของคนอื่นไม่ได้จะข้ามไป
let profileNamesLoaded = false;
async function loadProfileNames(force=false){
  if(profileNamesLoaded && !force){
    if(currentUser&&currentUserName&&!profileNames[currentUser.id])profileNames[currentUser.id]=currentUserName;
    return;
  }
  try{
    const {data,error}=await db.from("profiles").select("id,display_name,email");
    if(error||!data)return;
    data.forEach(p=>{ if(p&&p.id) profileNames[p.id]=String(p.display_name||p.email||"").trim(); });
    profileNamesLoaded = true;
  }catch(e){console.warn("loadProfileNames:",e)}
  if(currentUser&&currentUserName&&!profileNames[currentUser.id])profileNames[currentUser.id]=currentUserName;
}

async function saveDataToServer(key,value){
  if(currentRole==="view")return;
  dbData[key]=String(value??"");
  dbMeta[key]={by:currentUser.id,at:new Date().toISOString()};
  if(typeof invalidateProgressCache==="function")invalidateProgressCache(key);
  try{
    setLoading(true);
    const extra=pmUserRowsForKeys([key]);
    extra.forEach(r=>{dbData[r.key]=String(r.value);dbMeta[r.key]={by:currentUser.id,at:new Date().toISOString()}});
    invalidateReportCaches();
    const nowIso=new Date().toISOString();
    const payload=[{data_key:key,data_value:String(value??""),updated_by:currentUser.id,updated_at:nowIso}].concat(extra.map(r=>({data_key:r.key,data_value:String(r.value),updated_by:currentUser.id,updated_at:nowIso})));
    const {error}=await db.from("pm_data").upsert(payload,{onConflict:"data_key"});
    if(error)throw error;
    if(currentPage==="progress")schedulePMProgressRefresh();
    if(currentPage==="history"&&typeof schedulePMHistoryRefresh==="function")schedulePMHistoryRefresh();
    if(currentPage==="activity"&&typeof scheduleActivityRefresh==="function")scheduleActivityRefresh();
    if(currentPage==="nextdue"&&typeof schedulePMNextDueRefresh==="function")schedulePMNextDueRefresh();
  }catch(e){alert("⚠️ บันทึกไม่สำเร็จ: "+e.message);throw e}
  finally{setLoading(false)}
}

async function saveMany(rows){
  if(currentRole==="view"||!rows.length)return;
  rows.forEach(r=>{dbData[r.key]=String(r.value??"");dbMeta[r.key]={by:currentUser.id,at:new Date().toISOString()};if(typeof invalidateProgressCache==="function")invalidateProgressCache(r.key)});
  try{
    setLoading(true);
    const allRows=rows.concat(pmUserRowsForKeys(rows.map(r=>r.key)));
    allRows.forEach(r=>{dbData[r.key]=String(r.value??"");dbMeta[r.key]={by:currentUser.id,at:new Date().toISOString()}});
    invalidateReportCaches();
    const payload=allRows.map(r=>({data_key:r.key,data_value:String(r.value??""),updated_by:currentUser.id,updated_at:new Date().toISOString()}));
    const {error}=await db.from("pm_data").upsert(payload,{onConflict:"data_key"});
    if(error)throw error;
    if(currentPage==="progress")schedulePMProgressRefresh();
    if(currentPage==="history"&&typeof schedulePMHistoryRefresh==="function")schedulePMHistoryRefresh();
    if(currentPage==="activity"&&typeof scheduleActivityRefresh==="function")scheduleActivityRefresh();
    if(currentPage==="nextdue"&&typeof schedulePMNextDueRefresh==="function")schedulePMNextDueRefresh();
  }catch(e){alert("⚠️ บันทึกข้อมูลไม่สำเร็จ: "+e.message);throw e}
  finally{setLoading(false)}
}
