async function loadDbData(){
  const pageSize = 1000;
  const allRows = [];

  for(let from = 0; ; from += pageSize){
    const {data,error} = await db
      .from("pm_data")
      .select("data_key,data_value")
      .order("data_key", {ascending:true})
      .range(from, from + pageSize - 1);

    if(error) throw error;
    if(!data || data.length === 0) break;
    allRows.push(...data);
    if(data.length < pageSize) break;
  }

  dbData = {};
  allRows.forEach(r => {
    if(r && r.data_key != null){
      dbData[r.data_key] = r.data_value ?? "";
    }
  });
  if(typeof invalidateProgressCache==="function")invalidateProgressCache();
}

async function saveDataToServer(key,value){
  if(currentRole==="view")return;
  dbData[key]=String(value??"");
  if(typeof invalidateProgressCache==="function")invalidateProgressCache(key);
  try{
    setLoading(true);
    const {error}=await db.from("pm_data").upsert({data_key:key,data_value:String(value??""),updated_by:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"data_key"});
    if(error)throw error;
    if(currentPage==="progress")schedulePMProgressRefresh();
  }catch(e){alert("⚠️ บันทึกไม่สำเร็จ: "+e.message);throw e}
  finally{setLoading(false)}
}

async function saveMany(rows){
  if(currentRole==="view"||!rows.length)return;
  rows.forEach(r=>{dbData[r.key]=String(r.value??"");if(typeof invalidateProgressCache==="function")invalidateProgressCache(r.key)});
  try{
    setLoading(true);
    const payload=rows.map(r=>({data_key:r.key,data_value:String(r.value??""),updated_by:currentUser.id,updated_at:new Date().toISOString()}));
    const {error}=await db.from("pm_data").upsert(payload,{onConflict:"data_key"});
    if(error)throw error;
    if(currentPage==="progress")schedulePMProgressRefresh();
  }catch(e){alert("⚠️ บันทึกข้อมูลไม่สำเร็จ: "+e.message);throw e}
  finally{setLoading(false)}
}
