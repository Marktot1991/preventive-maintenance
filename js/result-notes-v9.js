/* Result Note V9 — read-only report over existing Supabase pm_data.
   Only nonempty, visible task _note values are shown; never writes to the database.
   Only forms with at least one matching note appear. */
const RESULT_NOTE_DEPARTMENTS = [
  {id:"em1", label:"EM1", subtitle:"Emulsion 1", icon:"fa-industry"},
  {id:"em2", label:"EM2", subtitle:"Emulsion 2", icon:"fa-industry"},
  {id:"resin", label:"Resin PD1", subtitle:"Resin", icon:"fa-flask-vial"},
  {id:"wwt", label:"WWT", subtitle:"Waste Water Treatment", icon:"fa-water"}
];
let resultNoteDept = "all";
let resultNoteFormFilter = "all";
// Sidebar expansion state is independent of the visible Result Note page.
let resultNoteSidebarOpen = false;
let resultNoteExpandedDept = null;
let resultNoteExpandedGroup = null;  // One open PM group under the active Result Note department.
let __resultNoteSidebarOptionSource = null;
let __resultNoteRecordsCache = null;
let __resultNoteLabelCache = new Map();
let __resultNoteRenderTimer = null;

function invalidateResultNotesCache(){
  __resultNoteRecordsCache = null;
  __resultNoteLabelCache.clear();
}

function collectResultNoteRecords(){
  if(__resultNoteRecordsCache) return __resultNoteRecordsCache;
  const forms = new Map();
  for(const [key, value] of Object.entries(dbData || {})){
    if(!key.endsWith("_note")) continue;
    const note = String(value ?? "").trim();
    if(!note) continue;

    // Use the same equipment-key parser as Activity Log; handles IDs with hyphens.
    const split = typeof activitySplitKey === "function" ? activitySplitKey(key) : null;
    if(!split) continue;
    const match = split.rest.match(/^(.+)_(\d+)_note$/);
    if(!match) continue;
    const sectionId = match[1];
    const itemNumber = Number(match[2]);
    if(!Number.isSafeInteger(itemNumber) || itemNumber < 1) continue;
    const taskPrefix = key.slice(0, -"_note".length);
    // Hidden PM rows are not active rows on the checklist and are excluded.
    if(dbData[`${taskPrefix}_hidden`] === "1") continue;

    const groupType = split.groupType;
    const dept = (typeof pmProgressDeptByGroup === "object" && pmProgressDeptByGroup[groupType]) || "em2";
    const formId = groupType + "|" + split.tank;
    if(!forms.has(formId)){
      forms.set(formId, {
        dept, groupType, tank: split.tank,
        deptLabel: typeof getDeptLabel === "function" ? getDeptLabel(dept) : dept,
        groupLabel: (typeof pmProgressGroupLabels === "object" && pmProgressGroupLabels[groupType]) || groupType,
        displayTank: typeof getTankDisplayLabel === "function" ? getTankDisplayLabel(groupType, split.tank) : split.tank,
        orderNo: "", notes: [], updatedAt: ""
      });
    }
    const form = forms.get(formId);
    const meta = (dbMeta || {})[key] || {};
    const at = meta.at || "";
    const record = {
      key, text: note, sectionId, itemNumber,
      taskName: String(dbData[`${taskPrefix}_taskName`] || "").trim() || `รายการที่ ${itemNumber}`,
      result: String(dbData[`${taskPrefix}_radio`] || "").trim(),
      by: meta.by || "", at
    };
    form.notes.push(record);
    if(at > form.updatedAt) form.updatedAt = at;
  }
  const result = [...forms.values()];
  result.forEach(form=>{
    form.orderNo = String(dbData[`${form.tank}_header_orderNo`] || "").trim();
    form.notes.sort((a,b)=>b.at.localeCompare(a.at) || a.key.localeCompare(b.key));
  });
  result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt) || a.tank.localeCompare(b.tank, "th"));
  __resultNoteRecordsCache = result;
  return result;
}

function updateResultNoteSidebarCounts(){
  const rows = collectResultNoteRecords();
  const total = document.getElementById("resultNoteSidebarTotal");
  if(total) total.textContent = String(rows.length);
  const needsListRefresh = __resultNoteSidebarOptionSource !== rows;
  for(const dept of RESULT_NOTE_DEPARTMENTS){
    const forms=rows.filter(r=>r.dept===dept.id);
    const counter = document.querySelector(`[data-count-dept="${dept.id}"]`);
    if(counter) counter.textContent = String(forms.length);
    if(needsListRefresh) renderResultNoteSidebarList(dept.id, forms);
  }
  if(needsListRefresh) __resultNoteSidebarOptionSource = rows;
}

// Result Note Sidebar V18: department -> collapsible equipment group -> clickable forms.
// Build only the forms containing saved Result Notes. No counts or note text in the dropdown.
function renderResultNoteSidebarList(deptId, forms){
  const holder=document.getElementById("resultNoteSideList-"+deptId);
  if(!holder) return;
  const groups=new Map();
  for(const form of forms){
    if(!groups.has(form.groupType)) groups.set(form.groupType,{label:form.groupLabel,forms:[]});
    groups.get(form.groupType).forms.push(form);
  }
  const fragment=document.createDocumentFragment();
  [...groups.entries()].sort((a,b)=>a[1].label.localeCompare(b[1].label,"th")).forEach(([groupType,group])=>{
    const block=document.createElement("div");
    block.className="result-note-side-group-block";
    block.dataset.resultNoteGroup=groupType;
    block.dataset.resultNoteDept=deptId;

    const toggle=document.createElement("button");
    toggle.type="button";
    toggle.className="result-note-side-group-toggle";
    toggle.setAttribute("aria-expanded","false");
    const panelId="result-note-side-forms-"+deptId+"-"+groupType;
    toggle.setAttribute("aria-controls",panelId);
    toggle.title="เปิดหรือยุบรายการฟอร์ม "+group.label;
    const sourceIcon=document.querySelector('.pm-side-group[data-pm-side-group="'+groupType+'"] .tank-nav > i');
    const icon=document.createElement("i");
    icon.className=sourceIcon?.className || "fa-solid fa-layer-group";
    icon.setAttribute("aria-hidden","true");
    const name=document.createElement("span");
    name.className="result-note-side-group-name";
    name.textContent=group.label;
    const chevron=document.createElement("i");
    chevron.className="fa-solid fa-chevron-down result-note-side-group-chevron";
    chevron.setAttribute("aria-hidden","true");
    toggle.append(icon,name,chevron);
    toggle.addEventListener("click",()=>toggleResultNoteGroup(deptId,groupType));
    block.appendChild(toggle);

    const list=document.createElement("div");
    list.id=panelId;
    list.className="result-note-side-form-buttons";
    list.hidden=true;
    group.forms.sort((a,b)=>a.tank.localeCompare(b.tank,"th",{numeric:true})).forEach(form=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="result-note-side-form-option";
      button.dataset.resultNoteChoice=`form:${groupType}|${form.tank}`;
      // Same short equipment code + secondary description as the PM form Sidebar.
      const label=typeof getPmSidebarEquipmentLabel==="function"
        ? getPmSidebarEquipmentLabel(groupType,form.tank) : form.tank;
      const code=groupType==="slurry" ? label : form.tank;
      const description=groupType==="slurry" ? form.tank : label;
      button.title=form.displayTank;
      button.setAttribute("aria-label","เปิด Result Note ฟอร์ม "+form.tank);
      const codeNode=document.createElement("span");
      codeNode.className="result-note-side-form-code";
      codeNode.textContent=code;
      button.appendChild(codeNode);
      if(description && description!==code){
        const desc=document.createElement("small");
        desc.className="result-note-side-form-desc";
        desc.textContent=description;
        button.appendChild(desc);
      }
      button.addEventListener("click",()=>chooseResultNoteSidebarForm(deptId,`form:${groupType}|${form.tank}`));
      list.appendChild(button);
    });
    block.appendChild(list);
    fragment.appendChild(block);
  });
  holder.replaceChildren(fragment);
}

function toggleResultNoteGroup(deptId,groupType){
  if(!RESULT_NOTE_DEPARTMENTS.some(dept=>dept.id===deptId))return;
  const valid=collectResultNoteRecords().some(form=>form.dept===deptId&&form.groupType===groupType);
  if(!valid)return;
  resultNoteSidebarOpen=true;
  resultNoteExpandedDept=deptId;
  resultNoteExpandedGroup=resultNoteExpandedGroup===groupType ? null : groupType;
  updateSidebarActive();
}

function populateResultNoteFormSelect(select, forms, allLabel){
  const groups=new Map();
  for(const form of forms){
    if(!groups.has(form.groupType)) groups.set(form.groupType,{label:form.groupLabel,forms:[]});
    groups.get(form.groupType).forms.push(form);
  }
  const options=document.createDocumentFragment();
  options.appendChild(new Option(allLabel,"all"));
  [...groups.entries()].sort((a,b)=>a[1].label.localeCompare(b[1].label,"th")).forEach(([groupType,group])=>{
    options.appendChild(new Option(`ทั้งกลุ่ม: ${group.label} (${group.forms.length})`, `group:${groupType}`));
    const section=document.createElement("optgroup");
    section.label=`${group.label} · เลือกฟอร์ม`;
    group.forms.sort((a,b)=>a.displayTank.localeCompare(b.displayTank,"th",{numeric:true})).forEach(form=>{
      section.appendChild(new Option(`${form.displayTank} (${form.notes.length} หมายเหตุ)`, `form:${groupType}|${form.tank}`));
    });
    options.appendChild(section);
  });
  select.replaceChildren(options);
}

function toggleResultNoteSidebar(){
  if(currentPage!=="resultNotes"){
    resultNoteSidebarOpen=true;
    resultNoteExpandedDept=null;
    resultNoteExpandedGroup=null;
    resultNoteFormFilter="all";
    showResultNotes("all", true);
    return;
  }
  resultNoteSidebarOpen=!resultNoteSidebarOpen;
  if(!resultNoteSidebarOpen){resultNoteExpandedDept=null;resultNoteExpandedGroup=null;}
  updateSidebarActive();
}

function toggleResultNoteDepartment(dept){
  if(!RESULT_NOTE_DEPARTMENTS.some(d=>d.id===dept)) return;
  const isSameOpen=currentPage==="resultNotes" && resultNoteSidebarOpen && resultNoteExpandedDept===dept;
  resultNoteSidebarOpen=true;
  resultNoteExpandedDept=isSameOpen ? null : dept;
  if(!isSameOpen) resultNoteExpandedGroup=null;
  // Clicking the already-open department folds its forms without changing page/filter.
  if(isSameOpen){updateSidebarActive();return;}
  resultNoteFormFilter="all";
  showResultNotes(dept, true);
}

function chooseResultNoteSidebarForm(dept, selected){
  if(!RESULT_NOTE_DEPARTMENTS.some(d=>d.id===dept)) return;
  const valid = selected === "all" || collectResultNoteRecords().some(form =>
    form.dept === dept && (`form:${form.groupType}|${form.tank}` === selected || `group:${form.groupType}` === selected)
  );
  if(!valid) return;
  resultNoteSidebarOpen=true;
  resultNoteExpandedDept=dept;
  if(selected.startsWith("form:"))resultNoteExpandedGroup=selected.slice(5).split("|")[0];
  else if(selected.startsWith("group:"))resultNoteExpandedGroup=selected.slice(6);
  resultNoteFormFilter=selected || "all";
  showResultNotes(dept);
}

// Form selector is built from saved notes in the selected department only.
// Allow both a whole equipment group and an individual PM form (equipment code).
function refreshResultNoteFormOptions(){
  const select = document.getElementById("resultNoteFormFilter");
  if(!select) return;
  const forms = collectResultNoteRecords().filter(form => resultNoteDept === "all" || form.dept === resultNoteDept);
  populateResultNoteFormSelect(select, forms, `ทุกฟอร์มที่มีบันทึก (${forms.length})`);
  // Changing department or refreshing may remove the previously selected form.
  const available=[...select.options].some(option=>option.value===resultNoteFormFilter);
  if(!available) resultNoteFormFilter="all";
  select.value=resultNoteFormFilter;
}

function setResultNoteFormFilter(value){
  resultNoteFormFilter=String(value || "all");
  updateSidebarActive();
  renderResultNotes();
}

function showResultNotes(dept="all", keepMobileSidebarOpen=false){
  if(!["all", ...RESULT_NOTE_DEPARTMENTS.map(d=>d.id)].includes(dept)) dept="all";
  const changedDepartment = resultNoteDept !== dept;
  resultNoteDept = dept;
  // Keep the sidebar sub-menu in sync when the department filter at the top changes.
  if(changedDepartment && resultNoteSidebarOpen){
    if(resultNoteExpandedDept!==dept)resultNoteExpandedGroup=null;
    resultNoteExpandedDept=dept === "all" ? null : dept;
  }
  currentPage = "resultNotes";
  setAllMainPagesHidden();
  const page = document.getElementById("pm-result-note-page");
  if(page) page.classList.remove("hidden");
  const eq = document.querySelector(".topbar-equipment");
  const title = document.getElementById("topbarPageTitle");
  if(eq) eq.style.display="none";
  if(title){
    title.style.display="flex";
    title.innerHTML='<i class="fa-solid fa-note-sticky"></i><span>Result Note</span>';
  }
  const selector = document.getElementById("resultNoteDeptFilter");
  if(selector) selector.value=dept;
  refreshResultNoteFormOptions();
  renderResultNotes();
  updateSidebarActive();
  if(window.innerWidth <= 720 && !keepMobileSidebarOpen) document.body.classList.remove("sidebar-open");
}

function fmtResultNoteTime(at){
  if(!at) return "";
  const date = new Date(at);
  if(Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("th-TH", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

function scheduleResultNoteRender(){
  clearTimeout(__resultNoteRenderTimer);
  __resultNoteRenderTimer = setTimeout(()=>{
    if(currentPage==="resultNotes") renderResultNotes();
  }, 200);
}

function renderResultNotes(){
  const list = document.getElementById("resultNoteGroups");
  const summary = document.getElementById("resultNoteSummary");
  if(!list || !summary) return;
  updateResultNoteSidebarCounts();
  const filtered = collectResultNoteRecords().filter(form=>{
    if(resultNoteDept !== "all" && form.dept !== resultNoteDept) return false;
    if(resultNoteFormFilter.startsWith("group:") && form.groupType !== resultNoteFormFilter.slice(6)) return false;
    if(resultNoteFormFilter.startsWith("form:") && `${form.groupType}|${form.tank}` !== resultNoteFormFilter.slice(5)) return false;
    return true;
  });
  const noteCount=filtered.reduce((sum,form)=>sum+form.notes.length,0);
  summary.innerHTML = `<div class="result-note-summary-item"><i class="fa-solid fa-file-circle-check"></i> <strong>${filtered.length.toLocaleString("th-TH")}</strong> ฟอร์มที่มีบันทึก</div>
    <div class="result-note-summary-item"><i class="fa-solid fa-comment-dots"></i> <strong>${noteCount.toLocaleString("th-TH")}</strong> รายการหมายเหตุ</div>
    <div class="result-note-summary-caption">แสดงเฉพาะ Result Note ที่มีข้อความจริง · อ่านข้อมูลจาก Supabase</div>`;
  if(!filtered.length){
    list.innerHTML='<div class="result-note-empty"><i class="fa-regular fa-note-sticky"></i><h2>ยังไม่มี Result Note ในเงื่อนไขนี้</h2><p>จะแสดงฟอร์มที่มีข้อความในช่อง Result Note เท่านั้น หากเพิ่งบันทึก ให้กด “อัปเดตข้อมูล”</p></div>';
    return;
  }
  list.innerHTML = RESULT_NOTE_DEPARTMENTS.map(dept=>{
    const forms=filtered.filter(r=>r.dept===dept.id);
    if(!forms.length) return "";
    return `<section class="result-note-department">
      <header class="result-note-department-head"><span class="result-note-department-icon"><i class="fa-solid ${dept.icon}"></i></span>
        <div><h2>${esc(dept.label)}</h2><p>${esc(dept.subtitle)}</p></div>
        <span class="result-note-dept-total">${forms.length} ฟอร์ม</span>
      </header>
      <div class="result-note-card-grid">${forms.map(renderResultNoteCard).join("")}</div>
    </section>`;
  }).join("");
}

function renderResultNoteCard(form){
  const latest = form.notes[0];
  const preview = latest?.text || "";
  const time = fmtResultNoteTime(form.updatedAt);
  return `<article class="result-note-card">
    <div class="result-note-card-head">
      <div class="result-note-tank-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
      <div class="result-note-form-label"><h3>${esc(form.displayTank)}</h3><p>${esc(form.groupLabel)}${form.orderNo ? ` · Order ${esc(form.orderNo)}` : ""}</p></div>
      <span class="result-note-pill"><i class="fa-solid fa-comment-dots"></i> ${form.notes.length}</span>
    </div>
    <p class="result-note-preview" title="${esc(preview)}">${esc(preview)}</p>
    <div class="result-note-card-meta">${time ? `<span><i class="fa-regular fa-clock"></i> ${esc(time)}</span>` : ""}<span>มี Result Note ${form.notes.length} รายการ</span></div>
    <details class="result-note-details" data-dept="${esc(form.dept)}" data-group="${esc(form.groupType)}" data-tank="${esc(form.tank)}" ontoggle="enrichResultNoteDetails(this)">
      <summary><i class="fa-solid fa-list-check"></i> ดูรายละเอียดหมายเหตุ (${form.notes.length})</summary>
      <div class="result-note-detail-list">
        ${form.notes.map(n=>`<div class="result-note-detail-row" data-note-key="${esc(n.key)}">
          <div class="result-note-detail-label"><strong data-note-title>${esc(n.taskName)} · ${esc(n.sectionId)}</strong>
          ${n.result === "OK" ? '<span class="result-note-status is-ok">OK</span>' : n.result === "NO" ? '<span class="result-note-status is-no">NO</span>' : ""}</div>
          <p>${esc(n.text)}</p>
          <small>${n.by ? esc(typeof activityUserName === "function" ? activityUserName(n.by) : "") : ""}${n.at ? ` · ${esc(fmtResultNoteTime(n.at))}` : ""}</small>
        </div>`).join("")}
      </div>
    </details>
    <div class="result-note-card-actions"><button type="button" class="result-note-open-form" data-dept="${esc(form.dept)}" data-group="${esc(form.groupType)}" data-tank="${esc(form.tank)}" onclick="openResultNoteForm(this)"><i class="fa-solid fa-arrow-up-right-from-square"></i> เปิดฟอร์ม PM</button></div>
  </article>`;
}

// Get original task names only when the user expands an item. Avoid building
// all PM forms on initial dashboard display (important for large installations).
function enrichResultNoteDetails(details){
  if(!details.open || details.dataset.enriched === "1") return;
  const dept=details.dataset.dept, group=details.dataset.group, tank=details.dataset.tank;
  const cacheKey=group+"|"+tank;
  let titleMap=__resultNoteLabelCache.get(cacheKey);
  if(!titleMap){
    titleMap=new Map();
    const oldDept=activeDepartment,oldGroup=activeTankType,oldTank=activeTankName;
    try{
      activeDepartment=dept;
      activeTankType=group;
      activeTankName=tank;
      const holder=document.createElement("div");
      holder.innerHTML=buildFormModel().h;
      holder.querySelectorAll("table").forEach(table=>{
        const headers=table.querySelector("tr.header-bg");
        const eq=String(headers?.cells?.[0]?.textContent || "").replace(/^Equipment\s*:\s*/i, "").trim();
        const desc=String(headers?.cells?.[1]?.textContent || "").replace(/^Description\s*:\s*/i, "").trim();
        table.querySelectorAll('tr[data-pm-check="1"]').forEach(row=>{
          const input=row.querySelector("td:last-child input[onchange]");
          const match=input?.getAttribute("onchange")?.match(/saveDataToServer\('([^']+)'/);
          if(!match) return;
          const task=row.cells?.[1]?.textContent?.trim() || "";
          titleMap.set(match[1], [task,desc || eq].filter(Boolean).join(" · "));
        });
      });
    }catch(err){console.warn("Result Note detail label fallback:",err);}
    finally{
      activeDepartment=oldDept;
      activeTankType=oldGroup;
      activeTankName=oldTank;
    }
    __resultNoteLabelCache.set(cacheKey,titleMap);
  }
  details.querySelectorAll("[data-note-key]").forEach(item=>{
    const title=titleMap.get(item.dataset.noteKey);
    const label=item.querySelector("[data-note-title]");
    if(title&&label) label.textContent=title;
  });
  details.dataset.enriched="1";
}

function openResultNoteForm(button){
  const {dept,group,tank}=button.dataset;
  if(!dept || !group || !tank || !(tankGroupMapping[group]||[]).includes(tank)) return;
  if(typeof openEquipmentForm === "function") openEquipmentForm(dept,group,tank);
}

async function refreshResultNotes(){
  if(currentPage!=="resultNotes") return;
  const btn=document.getElementById("resultNoteRefresh");
  if(btn) btn.disabled=true;
  try{
    await loadDbData();
    if(currentPage==="resultNotes"){
      refreshResultNoteFormOptions();
      renderResultNotes();
      updateSidebarActive();
    }
  }catch(err){alert("โหลด Result Note ไม่สำเร็จ: "+err.message);}
  finally{if(btn) btn.disabled=false;}
}
