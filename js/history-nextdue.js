/* ============================================================
   HISTORY & PREVENTIVE MAINTENANCE NEXT DUE DATE PAGES
   ============================================================ */

function getTankDisplayLabel(groupType, tank) {
  if (groupType === "slurry") {
    return ((typeof slurryTankDescriptions !== "undefined" && slurryTankDescriptions[tank]) || tank).split(/\s+/)[0] || tank;
  }
  if (groupType === "filling") {
    return (typeof fillingMachineInfo !== "undefined" && fillingMachineInfo[tank]?.desc) ? `${tank} (${fillingMachineInfo[tank].desc})` : tank;
  }
  if (groupType === "fmu") {
    const num = parseInt(String(tank).split("-")[1], 10);
    return !isNaN(num) ? `${tank} (Flow Meter Unit ${num})` : tank;
  }
  return tank;
}

function getDeptLabel(dept) {
  if (dept === "em1") return "EM1";
  if (dept === "resin") return "Resin PD1";
  if (dept === "wwt") return "WWT";
  return "EM2";
}

function parseMonthYearToDate(yyyy_mm) {
  if (!yyyy_mm || typeof yyyy_mm !== "string" || yyyy_mm.length < 7) return null;
  const parts = yyyy_mm.substring(0, 7).split("-");
  if (parts.length !== 2) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return null;
  return { year: y, month: m, key: `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}` };
}

function getMonthDiffFromNow(yyyy_mm) {
  const parsed = parseMonthYearToDate(yyyy_mm);
  if (!parsed) return null;
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  return (parsed.year - curY) * 12 + (parsed.month - curM);
}

function getDueStatusInfo(pmNextDate) {
  const diff = getMonthDiffFromNow(pmNextDate);
  if (diff === null) {
    return { code: "unset", label: "ยังไม่กำหนดวันครบกำหนด", badgeClass: "status-unset", icon: "fa-circle-question", diff: 99999 };
  }
  if (diff < 0) {
    return { code: "overdue", label: `เกินกำหนด (${Math.abs(diff)} เดือน)`, badgeClass: "status-overdue", icon: "fa-triangle-exclamation", diff };
  }
  if (diff === 0) {
    return { code: "duenow", label: "ครบกำหนดเดือนนี้", badgeClass: "status-duenow", icon: "fa-bell", diff };
  }
  if (diff <= 2) {
    return { code: "soon", label: `ใกล้ครบกำหนด (อีก ${diff} เดือน)`, badgeClass: "status-soon", icon: "fa-clock", diff };
  }
  return { code: "ontrack", label: `ตามแผน (อีก ${diff} เดือน)`, badgeClass: "status-ontrack", icon: "fa-calendar-check", diff };
}

// ข้อมูลเก่าที่ยังไม่มีชื่อผู้ทำ PM: ใช้ผู้แก้ไขล่าสุดจากข้อมูลของอุปกรณ์นั้นใน pm_data (updated_by / updated_at)
function buildLastEditorByTank() {
  const map = {};
  Object.keys(dbMeta || {}).forEach(key => {
    if (/_header_(pmUser|pmUserAt|pmNextDate)$/.test(key)) return;
    const i = key.indexOf("_");
    if (i <= 0) return;
    const m = dbMeta[key];
    if (!m || !m.by || !m.at) return;
    const tank = key.substring(0, i);
    if (!map[tank] || m.at > map[tank].at) map[tank] = { by: m.by, at: m.at };
  });
  return map;
}

function collectAllEquipmentRecords() {
  const records = [];
  const lastEditorByTank = buildLastEditorByTank();
  if (typeof tankGroupMapping === "undefined") return records;

  Object.entries(tankGroupMapping).forEach(([groupType, tanks]) => {
    const dept = pmProgressDeptByGroup[groupType] || "em2";
    const groupLabel = pmProgressGroupLabels[groupType] || groupType;
    [...new Set(tanks || [])].forEach(tank => {
      const prog = calculateTankProgress(groupType, tank);
      const orderNo = (dbData[`${tank}_header_orderNo`] || "").trim();
      const orderType = (dbData[`${tank}_header_orderType`] || "").trim();
      const orderActivity = (dbData[`${tank}_header_orderActivity`] || "").trim();
      const desc = (dbData[`${tank}_header_desc`] || "").trim();
      const workCenter = (dbData[`${tank}_header_workCenter`] || "").trim();
      const supervisor = (dbData[`${tank}_header_supervisor`] || "").trim();
      const sysStatus = (dbData[`${tank}_header_sysStatus`] || "").trim();
      const userStatus = (dbData[`${tank}_header_userStatus`] || "").trim();
      const releaseDate = (dbData[`${tank}_header_releaseDate`] || "").trim();
      const pmDateRaw = (dbData[`${tank}_header_pmDate`] || "").trim().substring(0, 7);
      const pmNextDateRaw = (dbData[`${tank}_header_pmNextDate`] || "").trim().substring(0, 7);
      let pmUser = (dbData[`${tank}_header_pmUser`] || "").trim();
      let pmUserAtRaw = (dbData[`${tank}_header_pmUserAt`] || "").trim();
      let pmUserInferred = false;
      if (!pmUser && lastEditorByTank[tank]) {
        const le = lastEditorByTank[tank];
        pmUser = profileNames[le.by] || (currentUser && le.by === currentUser.id ? currentUserName : "") || `ไม่ทราบชื่อ (ID ${String(le.by).substring(0, 8)})`;
        pmUserAtRaw = le.at;
        pmUserInferred = true;
      }

      const hasHeaderData = Boolean(orderNo || desc || supervisor || releaseDate || pmDateRaw || pmNextDateRaw);
      const isStarted = prog.done > 0 || hasHeaderData;

      records.push({
        groupType,
        groupLabel,
        dept,
        deptLabel: getDeptLabel(dept),
        tank,
        displayTank: getTankDisplayLabel(groupType, tank),
        total: prog.total,
        done: prog.done,
        ok: prog.ok,
        no: prog.no,
        percent: prog.percent,
        orderNo,
        orderType,
        orderActivity,
        desc,
        workCenter,
        supervisor,
        sysStatus,
        userStatus,
        releaseDate,
        pmDate: pmDateRaw,
        pmDateFormatted: formatMonthEn(pmDateRaw) || "-",
        pmNextDate: pmNextDateRaw,
        pmNextDateFormatted: formatMonthEn(pmNextDateRaw) || "-",
        pmUser,
        pmUserAt: pmUserAtRaw,
        pmUserInferred,
        isStarted,
        dueInfo: getDueStatusInfo(pmNextDateRaw)
      });
    });
  });

  return records;
}

function openEquipmentForm(dept, groupType, tank) {
  const deptSel = document.getElementById("deptSelect");
  if (deptSel) deptSel.value = dept;
  switchDept(dept, true);
  activeTankType = groupType;
  activeTankName = tank;
  const legacy = document.getElementById(groupType + "Select");
  if (legacy) legacy.value = tank;
  showPMForm();
  updateSidebarForDept();
  updateEquipmentSelect();
  updateSidebarActive();
  renderForm();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- HISTORY PAGE ---------- */
function renderHistoryGroupOptions() {
  const sel = document.getElementById("historyGroupFilter");
  if (!sel) return;
  const current = sel.value || "all";
  sel.innerHTML = '<option value="all">ทุกกลุ่มอุปกรณ์</option>';
  Object.entries(pmProgressGroupLabels).forEach(([k, v]) => sel.add(new Option(v, k)));
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function schedulePMHistoryRefresh() {
  clearTimeout(window.__pmHistoryTimer);
  window.__pmHistoryTimer = setTimeout(() => {
    if (currentPage === "history") renderPMHistory();
  }, 180);
}

function getSnapshotsList() {
  try {
    const raw = dbData["__pm_history_snapshots__"];
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function saveCurrentAsHistorySnapshot() {
  if (currentRole === "view") {
    alert("สิทธิ์ผู้ใช้งานของคุณเป็นแบบดูข้อมูลอย่างเดียว (View Only)");
    return;
  }
  const allRecords = collectAllEquipmentRecords().filter(r => r.done > 0 || r.orderNo || r.pmDate);
  if (!allRecords.length) {
    alert("ยังไม่มีรายการที่เริ่มตรวจหรือบันทึกข้อมูลสำหรับเก็บเป็นประวัติ");
    return;
  }
  const note = prompt("ระบุชื่อรอบบันทึกประวัติ (เช่น รอบ PM ประจำเดือน / ครึ่งปีแรก):", `PM Snapshot (${new Date().toLocaleDateString("th-TH")})`);
  if (note === null) return;

  const snap = {
    id: "snap_" + Date.now(),
    title: note.trim() || `PM Snapshot (${new Date().toLocaleDateString("th-TH")})`,
    savedAt: new Date().toISOString(),
    savedBy: currentUser?.email || "Admin",
    totalForms: allRecords.length,
    completedForms: allRecords.filter(r => r.total > 0 && r.done === r.total).length,
    totalOk: allRecords.reduce((a, r) => a + r.ok, 0),
    totalNo: allRecords.reduce((a, r) => a + r.no, 0),
    items: allRecords.map(r => ({
      dept: r.dept,
      deptLabel: r.deptLabel,
      groupType: r.groupType,
      groupLabel: r.groupLabel,
      tank: r.tank,
      orderNo: r.orderNo,
      supervisor: r.supervisor,
      pmDate: r.pmDate,
      pmNextDate: r.pmNextDate,
      pmUser: r.pmUser,
      done: r.done,
      total: r.total,
      ok: r.ok,
      no: r.no,
      percent: r.percent
    }))
  };

  const list = getSnapshotsList();
  list.unshift(snap);
  const trimmed = list.slice(0, 30);
  await saveDataToServer("__pm_history_snapshots__", JSON.stringify(trimmed));
  renderPMHistory();
}

async function deleteHistorySnapshot(snapId) {
  if (currentRole === "view") return;
  if (!confirm("ต้องการลบรายการประวัตินี้ใช่หรือไม่?")) return;
  const list = getSnapshotsList().filter(s => s.id !== snapId);
  await saveDataToServer("__pm_history_snapshots__", JSON.stringify(list));
  renderPMHistory();
}

function renderPMHistory() {
  if (currentPage !== "history") return;
  const summaryEl = document.getElementById("history-summary");
  const rowsEl = document.getElementById("history-rows");
  const snapSection = document.getElementById("history-snapshots-list");
  const saveSnapBtn = document.getElementById("btnSaveHistorySnapshot");
  if (!summaryEl || !rowsEl) return;

  if (saveSnapBtn) {
    saveSnapBtn.style.display = currentRole === "view" ? "none" : "inline-flex";
  }

  const dept = document.getElementById("historyDeptFilter")?.value || "all";
  const group = document.getElementById("historyGroupFilter")?.value || "all";
  const statusFilter = document.getElementById("historyStatusFilter")?.value || "all";
  const monthFilter = (document.getElementById("historyMonthFilter")?.value || "").trim();
  const search = (document.getElementById("historySearch")?.value || "").trim().toLowerCase();

  let records = collectAllEquipmentRecords();

  if (dept !== "all") records = records.filter(r => r.dept === dept);
  if (group !== "all") records = records.filter(r => r.groupType === group);
  if (monthFilter) records = records.filter(r => r.pmDate === monthFilter);

  if (statusFilter === "completed") {
    records = records.filter(r => r.total > 0 && r.done === r.total);
  } else if (statusFilter === "inprogress") {
    records = records.filter(r => r.done > 0 && r.done < r.total);
  } else if (statusFilter === "has_no") {
    records = records.filter(r => r.no > 0);
  } else if (statusFilter === "recorded") {
    records = records.filter(r => r.isStarted);
  }

  if (search) {
    records = records.filter(r =>
      `${r.tank} ${r.displayTank} ${r.groupLabel} ${r.deptLabel} ${r.orderNo} ${r.supervisor} ${r.pmUser} ${r.desc} ${r.pmDateFormatted}`.toLowerCase().includes(search)
    );
  }

  const totalForms = records.length;
  const recordedForms = records.filter(r => r.isStarted).length;
  const completedForms = records.filter(r => r.total > 0 && r.done === r.total).length;
  const formsWithNo = records.filter(r => r.no > 0).length;
  const totalChecked = records.reduce((a, r) => a + r.done, 0);

  summaryEl.innerHTML = `
    <div class="progress-card">
      <div class="progress-card-label">RECORDED PM FORMS</div>
      <div class="progress-card-value">${recordedForms.toLocaleString()}</div>
      <div class="progress-card-sub">ที่มีประวัติการตรวจ/บันทึก จาก ${totalForms.toLocaleString()} ฟอร์ม</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">COMPLETED 100%</div>
      <div class="progress-card-value">${completedForms.toLocaleString()}</div>
      <div class="progress-card-sub">ตรวจครบสมบูรณ์ 100%</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">FORMS WITH DEFECT (NO)</div>
      <div class="progress-card-value">${formsWithNo.toLocaleString()}</div>
      <div class="progress-card-sub">ฟอร์มที่พบรายการ NO</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">TOTAL ITEMS CHECKED</div>
      <div class="progress-card-value">${totalChecked.toLocaleString()}</div>
      <div class="progress-card-sub">รายการย่อยที่ได้รับการบันทึกผล</div>
    </div>
  `;

  // Sort: started/completed first, then by pmDate desc, then percent desc, then tank name
  records.sort((a, b) => {
    if (a.isStarted !== b.isStarted) return a.isStarted ? -1 : 1;
    if (a.pmDate !== b.pmDate) return (b.pmDate || "").localeCompare(a.pmDate || "");
    if (b.percent !== a.percent) return b.percent - a.percent;
    return a.tank.localeCompare(b.tank);
  });

  if (!records.length) {
    rowsEl.innerHTML = '<div class="progress-empty">ไม่พบประวัติรายการ PM ตามตัวกรองที่เลือก</div>';
  } else {
    rowsEl.innerHTML = records.map(r => {
      const state = r.percent >= 100 ? "done" : r.percent > 0 ? "partial" : "zero";
      const statusBadge = r.percent >= 100
        ? '<span class="pm-table-badge badge-done"><i class="fa-solid fa-circle-check"></i> เสร็จสิ้น 100%</span>'
        : r.percent > 0
          ? `<span class="pm-table-badge badge-partial"><i class="fa-solid fa-spinner"></i> กำลังทำ (${r.percent}%)</span>`
          : '<span class="pm-table-badge badge-zero"><i class="fa-regular fa-circle"></i> ยังไม่เริ่ม</span>';

      return `<div class="pm-custom-row row-${state}">
        <div class="pm-col-equip">
          <div class="pm-equip-code">${esc(r.displayTank)}</div>
          <small>${esc(r.deptLabel)} · ${esc(r.groupLabel)}</small>
        </div>
        <div class="pm-col-order">
          <strong>${esc(r.orderNo || "-")}</strong>
          <small>${esc(r.supervisor ? "ผู้ควบคุม: " + r.supervisor : (r.workCenter || "ไม่ระบุ Work Center"))}</small>
        </div>
        <div class="pm-col-user">
          ${r.pmUser
            ? `<strong><i class="fa-solid fa-user-check"></i> ${esc(r.pmUser)}</strong><small>${esc(r.pmUserAt ? new Date(r.pmUserAt).toLocaleString("th-TH") : "")}${r.pmUserInferred ? " · จากประวัติเดิม" : ""}</small>`
            : '<span class="pm-user-empty">-</span>'}
        </div>
        <div class="pm-col-date text-center">
          <span class="pm-date-pill">${esc(r.pmDateFormatted)}</span>
        </div>
        <div class="pm-col-date text-center">
          <span class="pm-date-pill next">${esc(r.pmNextDateFormatted)}</span>
        </div>
        <div class="pm-col-result">
          <div class="pm-result-counts">
            <span class="ok-count">OK: ${r.ok}</span>
            <span class="no-count ${r.no > 0 ? "has-no" : ""}">NO: ${r.no}</span>
            <span class="total-count">(${r.done}/${r.total})</span>
          </div>
          <div class="progress-bar-wrap" style="margin-top:5px;height:8px!important"><div class="progress-bar ${state}" style="width:${Math.max(0, Math.min(100, r.percent))}%"></div></div>
        </div>
        <div class="pm-col-status text-center">${statusBadge}</div>
        <div class="pm-col-action text-center">
          <button type="button" class="pm-open-form-btn" onclick="openEquipmentForm('${esc(r.dept)}','${esc(r.groupType)}','${esc(r.tank)}')">
            <i class="fa-solid fa-up-right-from-square"></i> เปิดฟอร์ม
          </button>
        </div>
      </div>`;
    }).join("");
  }

  if (snapSection) {
    const snaps = getSnapshotsList();
    if (!snaps.length) {
      snapSection.innerHTML = '<div class="progress-empty">ยังไม่มีประวัติ Snapshot ที่บันทึกไว้ กดปุ่ม "บันทึกรอบประวัติปัจจุบัน" ด้านบนเพื่อเก็บ Snapshot</div>';
    } else {
      snapSection.innerHTML = snaps.map(s => {
        const dt = s.savedAt ? new Date(s.savedAt).toLocaleString("th-TH") : "-";
        const delBtn = currentRole === "view" ? "" : `<button type="button" class="pm-snap-del-btn" onclick="deleteHistorySnapshot('${esc(s.id)}')" title="ลบประวัติ"><i class="fa-solid fa-trash-can"></i></button>`;
        return `<div class="pm-snapshot-card">
          <div class="pm-snapshot-head">
            <div>
              <div class="pm-snapshot-title"><i class="fa-solid fa-box-archive"></i> ${esc(s.title)}</div>
              <div class="pm-snapshot-meta">บันทึกเมื่อ: ${esc(dt)} · โดย: ${esc(s.savedBy || "-")}</div>
            </div>
            ${delBtn}
          </div>
          <div class="pm-snapshot-stats">
            <span>ฟอร์มที่มีข้อมูล: <strong>${s.totalForms || 0}</strong></span>
            <span>ครบ 100%: <strong>${s.completedForms || 0}</strong></span>
            <span>OK รวม: <strong style="color:#48e0bd">${s.totalOk || 0}</strong></span>
            <span>NO รวม: <strong style="color:#ff7884">${s.totalNo || 0}</strong></span>
          </div>
        </div>`;
      }).join("");
    }
  }

}

async function refreshPMHistory() {
  if (currentPage !== "history") return;
  const btn = document.getElementById("btnRefreshHistory");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...'; }
  try {
    await loadDbData();
    renderPMHistory();
  } catch (e) {
    alert("โหลดข้อมูลไม่สำเร็จ: " + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> รีเฟรช'; }
  }
}

/* ---------- PREVENTIVE MAINTENANCE NEXT DUE DATE PAGE ---------- */
function renderNextDueGroupOptions() {
  const sel = document.getElementById("nextDueGroupFilter");
  if (!sel) return;
  const current = sel.value || "all";
  sel.innerHTML = '<option value="all">ทุกกลุ่มอุปกรณ์</option>';
  Object.entries(pmProgressGroupLabels).forEach(([k, v]) => sel.add(new Option(v, k)));
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function schedulePMNextDueRefresh() {
  clearTimeout(window.__pmNextDueTimer);
  window.__pmNextDueTimer = setTimeout(() => {
    if (currentPage === "nextdue") renderPMNextDue();
  }, 180);
}

async function quickUpdateNextDueDate(groupType, tank, newMonthVal, applyToGroup) {
  if (currentRole === "view") {
    alert("สิทธิ์ผู้ใช้งานของคุณเป็นแบบดูข้อมูลอย่างเดียว (View Only)");
    return;
  }
  const cleanVal = (newMonthVal || "").trim().substring(0, 7);
  if (applyToGroup) {
    const tanks = tankGroupMapping[groupType] || [];
    await saveMany(tanks.map(t => ({ key: `${t}_header_pmNextDate`, value: cleanVal })));
  } else {
    await saveDataToServer(`${tank}_header_pmNextDate`, cleanVal);
  }
  renderPMNextDue();
}

async function applyBulkGroupNextDue() {
  if (currentRole === "view") {
    alert("สิทธิ์ผู้ใช้งานของคุณเป็นแบบดูข้อมูลอย่างเดียว (View Only)");
    return;
  }
  const groupSel = document.getElementById("bulkNextDueGroup");
  const monthInput = document.getElementById("bulkNextDueMonth");
  if (!groupSel || !monthInput) return;
  const groupType = groupSel.value;
  const monthVal = (monthInput.value || "").trim().substring(0, 7);
  if (!groupType) {
    alert("กรุณาเลือกกลุ่มอุปกรณ์ที่ต้องการตั้งค่า");
    return;
  }
  if (!monthVal) {
    alert("กรุณาเลือกเดือน/ปี (Next Due Date)");
    return;
  }
  const tanks = tankGroupMapping[groupType] || [];
  if (!tanks.length) return;
  const label = pmProgressGroupLabels[groupType] || groupType;
  if (!confirm(`ยืนยันการตั้งค่า Next Due Date (${formatMonthEn(monthVal)}) ให้กับกลุ่ม "${label}" ทั้งหมด ${tanks.length} อุปกรณ์?`)) return;
  await saveMany(tanks.map(t => ({ key: `${t}_header_pmNextDate`, value: monthVal })));
  renderPMNextDue();
}

function renderBulkNextDueGroupOptions() {
  const sel = document.getElementById("bulkNextDueGroup");
  if (!sel) return;
  const current = sel.value || "";
  sel.innerHTML = '<option value="">-- เลือกกลุ่มอุปกรณ์เพื่อตั้งค่าทั้งกรุ๊ป --</option>';
  Object.entries(pmProgressGroupLabels).forEach(([k, v]) => sel.add(new Option(v, k)));
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function renderPMNextDue() {
  if (currentPage !== "nextdue") return;
  const summaryEl = document.getElementById("nextdue-summary");
  const timelineEl = document.getElementById("nextdue-timeline-grid");
  const rowsEl = document.getElementById("nextdue-rows");
  const bulkBar = document.getElementById("nextdue-bulk-bar");
  if (!summaryEl || !rowsEl) return;

  if (bulkBar) {
    bulkBar.style.display = currentRole === "view" ? "none" : "flex";
  }

  const dept = document.getElementById("nextDueDeptFilter")?.value || "all";
  const group = document.getElementById("nextDueGroupFilter")?.value || "all";
  const statusFilter = document.getElementById("nextDueStatusFilter")?.value || "all";
  const monthFilter = (document.getElementById("nextDueMonthFilter")?.value || "").trim();
  const search = (document.getElementById("nextDueSearch")?.value || "").trim().toLowerCase();

  let records = collectAllEquipmentRecords();
  if (dept !== "all") records = records.filter(r => r.dept === dept);
  if (group !== "all") records = records.filter(r => r.groupType === group);
  if (monthFilter) records = records.filter(r => r.pmNextDate === monthFilter);
  if (statusFilter !== "all") records = records.filter(r => r.dueInfo.code === statusFilter);
  if (search) {
    records = records.filter(r =>
      `${r.tank} ${r.displayTank} ${r.groupLabel} ${r.deptLabel} ${r.pmDateFormatted} ${r.pmNextDateFormatted} ${r.dueInfo.label}`.toLowerCase().includes(search)
    );
  }

  const overdueCount = records.filter(r => r.dueInfo.code === "overdue").length;
  const dueNowCount = records.filter(r => r.dueInfo.code === "duenow").length;
  const soonCount = records.filter(r => r.dueInfo.code === "soon").length;
  const onTrackCount = records.filter(r => r.dueInfo.code === "ontrack").length;
  const unsetCount = records.filter(r => r.dueInfo.code === "unset").length;

  summaryEl.innerHTML = `
    <div class="progress-card">
      <div class="progress-card-label">OVERDUE / เกินกำหนด</div>
      <div class="progress-card-value" style="color:#ff7884!important">${overdueCount.toLocaleString()}</div>
      <div class="progress-card-sub">อุปกรณ์ที่เลยกำหนด PM Next Due Date</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">DUE SOON / ครบกำหนดเร็วๆ นี้</div>
      <div class="progress-card-value" style="color:#ffd07d!important">${(dueNowCount + soonCount).toLocaleString()}</div>
      <div class="progress-card-sub">เดือนนี้ ${dueNowCount} · ภายใน 1-2 เดือน ${soonCount}</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">ON SCHEDULE / ตามแผน</div>
      <div class="progress-card-value" style="color:#48e0bd!important">${onTrackCount.toLocaleString()}</div>
      <div class="progress-card-sub">กำหนดการมากกว่า 2 เดือนขึ้นไป</div>
    </div>
    <div class="progress-card">
      <div class="progress-card-label">UNSCHEDULED / ยังไม่ระบุ</div>
      <div class="progress-card-value" style="color:#9db8ca!important">${unsetCount.toLocaleString()}</div>
      <div class="progress-card-sub">ยังไม่ได้ระบุวันครบกำหนดรอบถัดไป</div>
    </div>
  `;

  // Group summary by Next Due Month
  if (timelineEl) {
    const byMonth = new Map();
    records.forEach(r => {
      const key = r.pmNextDate || "UNSET";
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          key,
          label: key === "UNSET" ? "ยังไม่กำหนด (Unscheduled)" : formatMonthEn(key),
          dueInfo: r.dueInfo,
          count: 0,
          groups: new Set()
        });
      }
      const item = byMonth.get(key);
      item.count++;
      item.groups.add(r.groupLabel);
    });

    const sortedMonths = [...byMonth.values()].sort((a, b) => {
      if (a.key === "UNSET") return 1;
      if (b.key === "UNSET") return -1;
      return a.key.localeCompare(b.key);
    });

    timelineEl.innerHTML = sortedMonths.length ? sortedMonths.map(m => `
      <div class="pm-schedule-card ${m.dueInfo.badgeClass}">
        <div class="pm-schedule-month">
          <i class="fa-solid ${m.dueInfo.icon}"></i>
          <span>${esc(m.label)}</span>
        </div>
        <div class="pm-schedule-count">${m.count} <small>อุปกรณ์</small></div>
        <div class="pm-schedule-status">${esc(m.dueInfo.label)}</div>
        <div class="pm-schedule-groups">${esc([...m.groups].slice(0, 4).join(", "))}${m.groups.size > 4 ? " ..." : ""}</div>
      </div>
    `).join("") : '<div class="progress-empty">ไม่มีข้อมูลตารางกำหนดการ</div>';
  }

  // Sort rows by due date urgency
  records.sort((a, b) => {
    if (a.dueInfo.diff !== b.dueInfo.diff) return a.dueInfo.diff - b.dueInfo.diff;
    if (a.groupType !== b.groupType) return a.groupType.localeCompare(b.groupType);
    return a.tank.localeCompare(b.tank);
  });

  if (!records.length) {
    rowsEl.innerHTML = '<div class="progress-empty">ไม่พบข้อมูลอุปกรณ์ตามตัวกรองที่เลือก</div>';
    return;
  }

  const isView = currentRole === "view";
  rowsEl.innerHTML = records.map(r => {
    const state = r.percent >= 100 ? "done" : r.percent > 0 ? "partial" : "zero";
    const dateInputHtml = isView
      ? `<span class="pm-date-pill next">${esc(r.pmNextDateFormatted)}</span>`
      : `<input type="month" class="pm-inline-month-input" value="${esc(r.pmNextDate)}" onchange="quickUpdateNextDueDate('${esc(r.groupType)}','${esc(r.tank)}',this.value,false)" title="เปลี่ยน Next Due Date ของอุปกรณ์นี้">`;

    return `<div class="pm-custom-row row-${state}">
      <div class="pm-col-equip">
        <div class="pm-equip-code">${esc(r.displayTank)}</div>
        <small>${esc(r.deptLabel)} · ${esc(r.groupLabel)}</small>
      </div>
      <div class="pm-col-date text-center">
        <span class="pm-date-pill">${esc(r.pmDateFormatted)}</span>
      </div>
      <div class="pm-col-date text-center">
        ${dateInputHtml}
      </div>
      <div class="pm-col-status text-center">
        <span class="pm-due-badge ${r.dueInfo.badgeClass}">
          <i class="fa-solid ${r.dueInfo.icon}"></i> ${esc(r.dueInfo.label)}
        </span>
      </div>
      <div class="pm-col-result">
        <div class="pm-result-counts">
          <span>ความคืบหน้า: <strong>${r.percent}%</strong></span>
          <span class="total-count">(${r.done}/${r.total})</span>
        </div>
        <div class="progress-bar-wrap" style="margin-top:5px;height:8px!important"><div class="progress-bar ${state}" style="width:${Math.max(0, Math.min(100, r.percent))}%"></div></div>
      </div>
      <div class="pm-col-action text-center">
        <button type="button" class="pm-open-form-btn" onclick="openEquipmentForm('${esc(r.dept)}','${esc(r.groupType)}','${esc(r.tank)}')">
          <i class="fa-solid fa-up-right-from-square"></i> เปิดฟอร์ม
        </button>
      </div>
    </div>`;
  }).join("");
}

async function refreshPMNextDue() {
  if (currentPage !== "nextdue") return;
  const btn = document.getElementById("btnRefreshNextDue");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...'; }
  try {
    await loadDbData();
    renderPMNextDue();
  } catch (e) {
    alert("โหลดข้อมูลไม่สำเร็จ: " + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> รีเฟรช'; }
  }
}
