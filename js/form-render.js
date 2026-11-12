function getEquipData(tank,code,tankType){
  const pTank="P"+tank.substring(1);
  if(tankType==="tankfarm2"){
    if(code==="LS")return{eq:"N/A",desc:`LS${tank.substring(1)} Level switch`,tasks:t_LS};
    if(code==="PDTR")return{eq:"N/A",desc:"Level Transmitter (Radar)",tasks:t_PDTR};
    if(code==="PDTD")return{eq:"IPDT0110"+(tank==="T9110"?"40":"XX"),desc:"Diff. Pressure Transmitter",tasks:t_PDTD};
    if(code==="TT")return{eq:"N/A",desc:`TT${tank.substring(1)} Temp. Transmitter of Mobile Pump`,tasks:t_TT};
    if(code.startsWith("XV"))return{eq:"N/A",desc:`${tank}-${code} Actuator valve`,tasks:t_XV};
    if(code==="XV40_P")return{eq:"N/A",desc:`${pTank}-XV40 Actuator valve`,tasks:t_XV};
    if(code==="XV41_P")return{eq:"N/A",desc:`${pTank}-XV41 Actuator valve`,tasks:t_XV};
    if(code==="XV42_P")return{eq:"N/A",desc:`${pTank}-XV42 Actuator valve`,tasks:t_XV};
    if(code==="XV43_P")return{eq:"N/A",desc:`${pTank}-XV43 Actuator valve`,tasks:t_XV};
    if(code==="PSV")return{eq:"N/A",desc:`PSV${tank.substring(1)} Breather valve`,tasks:t_PSV};
    if(code==="FT")return{eq:"N/A",desc:tf2FtDescMap[tank]||"Mass Flow Transmitter",tasks:t_FT};
    if(code==="SOV50")return{eq:"N/A",desc:`${pTank}-XV50 Solenoid valve 2/2`,tasks:t_SOV};
    if(code==="REG")return{eq:"N/A",desc:`${pTank}-PCV54 Electric regulator`,tasks:t_REG};
  }
  if(tankType==="surpressor"){
    if(code==="XV80"||code==="XV50"||code==="XV51"||code==="XV52")return{eq:"MVAC01",desc:`${tank}-${code} Actuator Valve`,tasks:t_XVS};
    if(code==="PIC01")return{eq:"MIPRE01",desc:`${tank}-PIC01 Pressure Switch`,tasks:t_PIC};
  }
  if(tankType==="silo"){
    if(code==="JET")return{eq:"IPAT011",desc:`Pressure Alarm Filter ${tank}`,tasks:t_JET};
    if(code==="PRV")return{eq:"IPSI011",desc:`SPRV${tank.substring(1)} Safety Relief Valve (Pressure)`,tasks:t_PRV};
    if(code==="TT")return{eq:"ITRT011",desc:`${tank}TT01 Temperature Transmitter`,tasks:t_TTP};
    if(code==="LSH")return{eq:"N/A",desc:`${tank}-LSH01 Level switch`,tasks:t_LSP};
    if(code==="YC")return{eq:"N/A",desc:`${tank}-YC01 Electromachanical Level`,tasks:t_YCP};
    if(code.startsWith("XV"))return{eq:"N/A",desc:`${tank}-${code} Actuator valve`,tasks:t_XVS};
    if(code.startsWith("FB"))return{eq:"N/A",desc:`FB${tank.substring(1)}-XV50 Actuator valve`,tasks:t_XVS};
    if(code.startsWith("RV"))return{eq:"N/A",desc:`RV${tank.substring(1)}-${code.replace("RV","")} Actuator valve`,tasks:t_XVS};
  }
  if(tankType==="hopper"){
    if(code==="XV50")return{eq:"MVAC01",desc:`${tank}-XV50 Actuator Valve`,tasks:t_XVS};
    if(code==="RV50")return{eq:"MVAC01",desc:`RV${tank.substring(1)}-XV50 Actuator Valve`,tasks:t_XVS};
    if(code==="JET")return{eq:"IPAT01",desc:`${tank} Dust Collector`,tasks:t_JET};
    if(code==="LSH")return{eq:"MILSH01",desc:`${tank.charAt(0)==="X"?tank:"RV"+tank.substring(1)}-LSH01 Level Switch`,tasks:t_LSP};
    if(code==="RV1220-XV50"||code==="RV1221-XV50")return{eq:"MVAC01",desc:`${code} Actuator Valve`,tasks:t_XVS};
  }
  return{eq:"-",desc:code,tasks:[]};
}

function buildTaskRows(maxRows,tasks,tankCode,valveId){
  const view=currentRole==="view",ro=view?"readonly":"",cursor=view?"locked-cursor":"";
  let h="";
  const list=Array.isArray(tasks)?tasks:[];
  const limit=Math.max(Number(maxRows)||0,list.length);

  for(let i=0;i<limit;i++){
    const n=i+1;
    const rKey=`${tankCode}_${valveId}_${n}_radio`;
    const nKey=`${tankCode}_${valveId}_${n}_note`;
    const radio=dbData[rKey]||"";
    const note=dbData[nKey]||"";
    const ok=radio==="OK",no=radio==="NO";

    if(i<list.length){
      const t=list[i];
      const taskName=String(t?.n??"").trim();
      if(!taskName)continue;

      h+=`<tr data-pm-check="1">
        <td class="text-center">${t.i}</td>
        <td>${esc(taskName)}</td>
        <td>${esc(t.s)}</td>
        <td class="text-center">${esc(t.p)}</td>
        <td class="radio-center"><input type="radio" class="radio-ok ${cursor}" name="grp_${esc(rKey)}" value="OK" ${ok?"checked":""} data-checked="${ok}" onclick="toggleRadio(event,this,'${esc(rKey)}','OK')"></td>
        <td class="radio-center"><input type="radio" class="radio-no ${cursor}" name="grp_${esc(rKey)}" value="NO" ${no?"checked":""} data-checked="${no}" onclick="toggleRadio(event,this,'${esc(rKey)}','NO')"></td>
        <td><input type="text" class="borderless-input" value="${esc(note)}" ${ro} onchange="saveDataToServer('${esc(nKey)}',this.value)"></td>
      </tr>`;
      continue;
    }

    const a=`${tankCode}_${valveId}_${n}_taskName`;
    const s=`${tankCode}_${valveId}_${n}_standard`;
    const p=`${tankCode}_${valveId}_${n}_package`;
    const customTaskName=String(dbData[a]??"").trim();

    if(!customTaskName){
      continue;
    }

    h+=`<tr data-pm-check="1">
      <td class="text-center">${n}</td>
      <td><input type="text" class="borderless-input" value="${esc(customTaskName)}" ${ro} onchange="saveDataToServer('${esc(a)}',this.value)"></td>
      <td><input type="text" class="borderless-input" value="${esc(dbData[s]||"")}" ${ro} onchange="saveDataToServer('${esc(s)}',this.value)"></td>
      <td><input type="text" class="borderless-input text-center" value="${esc(dbData[p]||"")}" ${ro} onchange="saveDataToServer('${esc(p)}',this.value)"></td>
      <td class="radio-center"><input type="radio" class="radio-ok ${cursor}" name="grp_${esc(rKey)}" value="OK" ${ok?"checked":""} data-checked="${ok}" onclick="toggleRadio(event,this,'${esc(rKey)}','OK')"></td>
      <td class="radio-center"><input type="radio" class="radio-no ${cursor}" name="grp_${esc(rKey)}" value="NO" ${no?"checked":""} data-checked="${no}" onclick="toggleRadio(event,this,'${esc(rKey)}','NO')"></td>
      <td><input type="text" class="borderless-input" value="${esc(note)}" ${ro} onchange="saveDataToServer('${esc(nKey)}',this.value)"></td>
    </tr>`;
  }
  return h;
}

function buildSection(eq,desc,tasks,valveId,tankName=activeTankName){
  const rowCount=Array.isArray(tasks)?Math.max(6,tasks.length):6;
  return `<table><tr class="header-bg"><td colspan="4" style="text-align:left">Equipment : ${esc(eq)}</td><td colspan="4" style="text-align:left;color:#b30000">Description : ${esc(desc)}</td></tr>
  <tr class="sub-header-bg text-center"><td width="4%">Items</td><td width="24%">Preventive Maintenance Task List</td><td width="24%">Standard</td><td width="6%">Package</td><td width="4%">OK</td><td width="4%">NO</td><td width="28%">Result Note</td></tr>
  ${buildTaskRows(rowCount,tasks,tankName,valveId)}</table>`;
}

const RESIN_TASK_LISTS={psv:tr_psv,temp:tr_temp,sv:tr_sv,rota:tr_rota,ft:tr_ft,pt:tr_pt,pg:tr_pg,btv:tr_btv,cv:tr_cv};

// สร้าง HTML ของฟอร์มเป็น string เท่านั้น (ไม่แตะ DOM) — ใช้ได้ทั้งตอนแสดงฟอร์มและตอนคำนวณ Progress
function buildFormModel(){
  if(!activeTankName)return {h:"",fl:null,ed:null};
  let h="";
  const fl={textContent:null},ed={textContent:null};
  
  if (activeDepartment === "em1") {
    if(activeTankType === "fmu") {
      fl.textContent = `Functional Location : T-M-01-00-${activeTankName}`;
      ed.textContent = `Description : Flow Meter Unit ${activeTankName.split('-')[1].replace(/^0+/, '')}`;
      const equips = em1Equipments[activeTankName] || [];
      equips.forEach(eq => {
        const tasks = eq.tType === 5 ? t_em1_fmu_full : t_em1_fmu_batch;
        h += buildSection(eq.id, eq.desc, tasks, eq.id, activeTankName);
      });
    }
  } else if(activeDepartment === "resin") {
    const p = x => { let [e,d,t] = x.split('|'); return {e, d, t:RESIN_TASK_LISTS[t]} };
    if(activeTankType === "thinning") {
      fl.textContent = activeTankName === 'T-111' ? "Functional Location : T-M-03-03-TTN-001" : "Functional Location : T-M-03-03-TTN-002";
      ed.textContent = activeTankName === 'T-111' ? "Description : T-111" : "Description : PDTA141 Thinning Tank T141";
      const list = (activeTankName === 'T-111' ? L111 : L141).map(p);
      list.forEach(v => h += buildSection(v.e, v.d, v.t, v.e));
    } else if (activeTankType === "reactor") {
      fl.textContent = activeTankName === 'R-111' ? "Functional Location : T-M-03-03-REC-001" : "Functional Location : T-M-03-03-REC-002";
      ed.textContent = activeTankName === 'R-111' ? "Description : R-111" : "Description : PDRE141 Reactor R141";
      const list = (activeTankName === 'R-111' ? LR111 : LR141).map(p);
      list.forEach(v => h += buildSection(v.e, v.d, v.t, v.e));
    }
  } else if (activeDepartment === "wwt") {
    if(activeTankType === "wwt_flow") {
      const data = wwtFlowEquipments[activeTankName];
      if(data) {
        fl.textContent = `Functional Location : ${data.fl}`;
        ed.textContent = `Description : ${data.desc}`;
        data.items.forEach(eq => {
          h += buildSection(eq.id, eq.desc, t_wwt_flow, eq.id, activeTankName);
        });
      }
    } else if(activeTankType === "wwt_cond") {
      const data = wwtCondEquipments[activeTankName];
      if(data) {
        fl.textContent = `Functional Location : ${data.fl}`;
        ed.textContent = `Description : ${data.desc}`;
        data.items.forEach(eq => {
          h += buildSection(eq.id, eq.desc, t_wwt_cond, eq.id, activeTankName);
        });
      }
    }
  } else {
    if(activeTankType==="filling"){
      const data=fillingMachineInfo[activeTankName];
      if(data){
        fl.textContent=`Functional Location : ${data.fl}`;
        ed.textContent=`Description : ${data.desc}`;
        data.assets.forEach(([eq,desc,kind])=>{
          const tasks=kind==="weight"?fillingWeightTasks:(kind==="color"?fillingColorTasks:fillingActuatorTasks);
          h+=buildSection(eq,desc,tasks,eq,activeTankName);
        });
      }
    } else if(activeTankType==="slurry"){
      const loc=activeTankName;
      fl.textContent=`Functional Location : T-M-01-01-${loc}`;
      ed.textContent=`Description : ${slurryTankDescriptions[loc]||"Slurry"}`;
      (slurryEquipmentByLocation[loc]||[]).forEach(asset=>{
        const d=asset.description.toLowerCase();
        const tasks=d.includes("mass flow meter")?slurryTaskLists.flow:d.includes("pressure transmitter")?slurryTaskLists.pressure:slurryTaskLists.actuator;
        h+=buildSection(asset.number,asset.description,tasks,asset.id,loc);
      });
    } else if(activeTankType==="deluting"){
      fl.textContent="Functional Location : T-M-01-01-LET-001";ed.textContent=`Description : ${activeTankName} Deluting Tank (E2M12501)`;
      delutingValveList.forEach(v=>h+=buildSection(v.eq||"MVAC011XXX",`${activeTankName}-${v.suffix} Actuator valve`,v.suffix==="XV40"?[...delutingStdTasks,xv40Task]:delutingStdTasks,v.suffix));
    }else if(activeTankType==="delicel"){
      fl.textContent="Functional Location : T-M-01-01-DEL-001";ed.textContent=`Description : ${activeTankName} Delicel`;
      delicelValveList.forEach(v=>{let d;if(["magFlow","tempTrans","loadCell"].includes(v.type))d=activeTankName+v.suffix;else d=(v.p==="R"?activeTankName:v.p+activeTankName.substring(1))+v.suffix;
        const id=v.p+"_"+v.suffix.split(" ")[0].replace("-","");
        const t=v.type==="jet"?delicelJetTasks:v.type==="magFlow"?delicelMagFlowTasks:v.type==="tempTrans"?delicelTempTransTasks:v.type==="loadCell"?delicelLoadCellTasks:delicelStdTasks;
        h+=buildSection(v.eq,d,t,id)});
    }else if(activeTankType==="additive"){
      fl.textContent=`Functional Location : ${additiveFuncLocMap[activeTankName]||""}`;
      ed.textContent=`Description : ${activeTankName} Additive Tank`;

      const equipmentSuffixes=additiveTankEquipmentMap[activeTankName]||[];
      const pre="P"+activeTankName.substring(1);

      equipmentSuffixes.forEach(suffix=>{
        const v=additiveValveList.find(x=>x.suffix===suffix);
        if(!v)return;

        const d=pre+v.suffix+
          (v.type==="actuator"?" Actuator valve":
           v.type==="solenoid"?" Solenoid valve 2/2":
           " Flow transmitter");

        const id="add_"+v.suffix.replace("-","");
        const t=v.type==="actuator"
          ?additiveActuatorTasks
          :v.type==="solenoid"
            ?additiveSolenoidTasks
            :additiveFlowTasks;

        h+=buildSection(v.eq,d,t,id);
      });
    }else if(activeTankType==="updown"){
      fl.textContent=`Functional Location : T-M-01-01-MIX-${mixFlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName} Up Down Mixer (E2M026${mixFlMap[activeTankName].substring(1)})`;
      h+=buildSection("MVAC011",`${activeTankName}-XV50 Actuator valve`,t_UPDOWN,"XV50");
    }else if(activeTankType==="tankfarm2"){
      fl.textContent=`Functional Location : T-M-01-01-TSR-${tf2FlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName} Storage Tank`;
      (tf2Map[activeTankName]||[]).forEach(c=>{const d=getEquipData(activeTankName,c,"tankfarm2");h+=buildSection(d.eq,d.desc,d.tasks,c)});
    }else if(activeTankType==="surpressor"){
      fl.textContent=`Functional Location : T-M-01-01-BLO-${surpFlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName} Surpressor`;
      (surpMap[activeTankName]||[]).forEach(c=>{const d=getEquipData(activeTankName,c,"surpressor");h+=buildSection(d.eq,d.desc,d.tasks,c)});
    }else if(activeTankType==="silo"){
      fl.textContent=`Functional Location : T-M-01-01-SLO-${siloFlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName} Silo Powder`;
      (siloMap[activeTankName]||[]).forEach(c=>{const d=getEquipData(activeTankName,c,"silo");h+=buildSection(d.eq,d.desc,d.tasks,c)});
    }else if(activeTankType==="hopper"){
      fl.textContent=`Functional Location : T-M-01-01-HOP-${hopperFlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName} Powder Hopper`;
      (hopperMap[activeTankName]||[]).forEach(c=>{const d=getEquipData(activeTankName,c,"hopper");h+=buildSection(d.eq,d.desc,d.tasks,c)});
    }else if(activeTankType==="diverter"){
      fl.textContent=`Functional Location : T-M-01-01-VAC-${divFlMap[activeTankName]}`;ed.textContent=`Description : ${activeTankName}-2 Way Diverter`;
      h+=buildSection("MVAC0110"+divFlMap[activeTankName],`${activeTankName}-2 Way Diverter`,t_DIV,"DIV");
    } else if(activeTankType==="pigline"){
      const pglData=piglineEquipments[activeTankName];
      if(pglData){
        fl.textContent=`Functional Location : ${pglData.fl}`;ed.textContent=`Description : ${pglData.desc}`;
        pglData.items.forEach(item=>{
          const [desc,eq,type]=item.split('|');
          const tasks=type==='pt'?t_pig_pt:type==='xv'?t_pig_xv:type==='xv_sensor'?t_pig_xvs:type==='msen'?t_pig_msen:type==='lt'?t_pig_lt:t_pig_sov;
          const cleanId=desc.replace(/[^A-Za-z0-9]/g,'');
          h+=buildSection(eq,desc,tasks,cleanId,activeTankName);
        });
      }
    }
  }
  return {h,fl:fl.textContent,ed:ed.textContent};
}

function renderForm(){
  const deptDisplay = document.getElementById("dept-display");
  if(activeDepartment === "em1") deptDisplay.textContent = "Department : Emulsion 1";
  else if(activeDepartment === "resin") deptDisplay.textContent = "Department : Resin PD1";
  else if(activeDepartment === "wwt") deptDisplay.textContent = "Department : WWT";
  else deptDisplay.textContent = "Department : Emulsion 2";
  if(!activeTankName){document.getElementById("checklist-container").innerHTML="";return}
  ["orderNo","orderType","orderActivity","desc","workCenter","supervisor","sysStatus","userStatus","releaseDate","pmDate","pmNextDate"].forEach(id=>{
    let val = dbData[`${activeTankName}_header_${id}`]||"";
    if(id==="pmDate" || id==="pmNextDate") {
      if(val.length > 7) val = val.substring(0, 7);
      const hiddenEl = document.getElementById(id);
      const dispEl = document.getElementById(id + "_display");
      if(hiddenEl) hiddenEl.value = val;
      if(dispEl) {
        dispEl.dataset.val = val;
        dispEl.type = 'text';
        dispEl.value = formatMonthEn(val);
      }
    } else {
      const el = document.getElementById(id);
      if(el) el.value = val;
    }
  });
  const m=buildFormModel();
  if(m.fl!==null)document.getElementById("fl-display").textContent=m.fl;
  if(m.ed!==null)document.getElementById("equipment-desc-display").textContent=m.ed;
  document.getElementById("checklist-container").innerHTML=m.h;
}
