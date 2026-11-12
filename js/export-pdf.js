/* ---------- GROUP PDF EXPORT ---------- */
function syncPrintInputState(root){
  root.querySelectorAll("input").forEach(input=>{
    if(input.type==="radio"){
      const isChecked = input.checked || input.getAttribute("data-checked")==="true" || input.hasAttribute("checked");
      const indicator=document.createElement("span");
      indicator.className="print-status-radio "+(input.classList.contains("radio-ok")?"selected-ok":"selected-no");
      if(!isChecked)indicator.classList.remove("selected-ok","selected-no");
      indicator.setAttribute("aria-hidden","true");
      input.replaceWith(indicator);
    }else if(input.type==="checkbox"){
      if(input.checked) input.setAttribute("checked","checked");
      else input.removeAttribute("checked");
    }else{
      input.setAttribute("value",input.value??"");
    }
  });
}

function exportCurrentGroupPDF(){
  const groupType=activeTankType;
  const tanks=[...(tankGroupMapping[groupType]||[])];
  if(!groupType || !tanks.length){
    alert("กรุณาเลือกกรุ๊ปอุปกรณ์ก่อนส่งออก PDF");
    return;
  }

  const printRoot=document.getElementById("print-group-container");
  if(!printRoot)return;

  const savedTankType=activeTankType;
  const savedTankName=activeTankName;
  const savedDept=activeDepartment;

  const uniqueTanks=[...new Set(tanks)];
  printRoot.innerHTML="";

  const groupLabel={
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
  }[groupType]||groupType;

  uniqueTanks.forEach((tank,index)=>{
    activeTankType=groupType;
    activeTankName=tank;

    renderForm();

    const source=document.querySelector(".page-container");
    if(!source)return;

    const item=document.createElement("section");
    item.className="print-group-item";
    item.setAttribute("data-tank",tank);

    const clone=source.cloneNode(true);
    syncPrintInputState(clone);
    item.appendChild(clone);
    printRoot.appendChild(item);
  });

  activeTankType=savedTankType;
  activeTankName=savedTankName;
  activeDepartment=savedDept;

  updateEquipmentSelect();
  updateSidebarForDept();
  updateSidebarActive();
  renderForm();

  document.body.classList.add("printing-group");
  const cleanup=()=>{
    document.body.classList.remove("printing-group");
    printRoot.innerHTML="";
    window.removeEventListener("afterprint",cleanup);
  };
  window.addEventListener("afterprint",cleanup,{once:true});

  setTimeout(()=>document.body.classList.remove("printing-group"),60000);

  window.print();
}
