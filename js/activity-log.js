// =====================================================
// ACTIVITY LOG (หน้า Activity Log แยกจาก History) — ใคร บันทึก/แก้ไขอะไร เมื่อไหร่
// อ่านจาก pm_data.updated_at / updated_by (dbMeta) จึงไม่ต้องสร้างตารางเพิ่ม
// เก็บได้เฉพาะ "การบันทึกล่าสุดของแต่ละรายการ" ไม่มีค่าเดิมก่อนถูกแก้
// =====================================================
const ACTIVITY_PAGE_SIZE = 100;
let activityLimit = ACTIVITY_PAGE_SIZE;

const ACTIVITY_HEADER_LABELS = {
  orderNo: "Order No", orderType: "Order Type", orderActivity: "Order Activity Type", desc: "Description",
  workCenter: "Maintenance Work Center", supervisor: "Supervisor", sysStatus: "Order System Status",
  userStatus: "Order User Status", releaseDate: "Order Release Date",
  pmDate: "Preventive Maintenance Date", pmNextDate: "Preventive Maintenance Next Due Date"
};

let __activityTankIndex = null;
function activityTankIndex() {
  if (__activityTankIndex) return __activityTankIndex;
  const byTank = new Map();
  Object.entries(tankGroupMapping).forEach(([g, tanks]) => (tanks || []).forEach(t => { if (!byTank.has(t)) byTank.set(t, g); }));
  __activityTankIndex = { byTank, sorted: [...byTank.keys()].sort((a, b) => b.length - a.length) };
  return __activityTankIndex;
}

// แยก data_key เป็น {tank, groupType, rest}; null ถ้าไม่ใช่ key ของอุปกรณ์ (เช่น lastSavedTank)
function activitySplitKey(key) {
  const { byTank, sorted } = activityTankIndex();
  const i = key.indexOf("_");
  if (i > 0) {
    const t = key.slice(0, i);
    if (byTank.has(t)) return { tank: t, groupType: byTank.get(t), rest: key.slice(i + 1) };
  }
  for (const t of sorted) {
    if (key.startsWith(t + "_")) return { tank: t, groupType: byTank.get(t), rest: key.slice(t.length + 1) };
  }
  return null;
}

function activityUserName(id) {
  if (!id) return "—";
  if (profileNames && profileNames[id]) return profileNames[id];
  if (currentUser && id === currentUser.id) return currentUserName || "คุณ";
  return "ผู้ใช้ " + String(id).slice(0, 6);
}

function classifyActivityEntry(key, value, meta) {
  const p = activitySplitKey(key);
  if (!p) return null;
  const base = { key, tank: p.tank, groupType: p.groupType, at: meta.at, by: meta.by, value: String(value ?? "") };
  const h = p.rest.match(/^header_(.+)$/);
  if (h) {
    const f = h[1];
    if (f === "pmUser" || f === "pmUserAt") return null;   // ข้อมูลช่วยของระบบ ไม่ใช่การแก้ไขโดยผู้ใช้
    if (f === "pmDate" || f === "pmNextDate") {
      return { ...base, type: "date", equip: "", field: f,
        title: f === "pmDate" ? "ตั้งวันที่ PM" : "ตั้ง Next Due Date",
        detail: base.value ? formatMonthEn(base.value.slice(0, 7)) : "(ล้างค่า)" };
    }
    return { ...base, type: "other", equip: "", title: "แก้ไขข้อมูลหัวฟอร์ม",
      detail: `${ACTIVITY_HEADER_LABELS[f] || f}: ${base.value || "(ล้างค่า)"}` };
  }
  const m = p.rest.match(/^(.*)_(\d+)_(radio|note|taskName|standard|package)$/);
  if (!m) return null;
  const [, equip, item, field] = m;
  const where = `รายการที่ ${item} · ${equip}`;
  if (field === "radio") {
    if (base.value === "OK") return { ...base, type: "ok", equip, title: "ติ๊ก OK", detail: where };
    if (base.value === "NO") return { ...base, type: "no", equip, title: "ติ๊ก NO", detail: where };
    return { ...base, type: "uncheck", equip, title: "ยกเลิกการติ๊ก", detail: where };
  }
  if (field === "note") return { ...base, type: "note", equip, title: "บันทึกหมายเหตุ", detail: `${where} — ${base.value || "(ล้างค่า)"}` };
  const fl = { taskName: "ชื่อรายการ", standard: "Standard", package: "Package" }[field];
  return { ...base, type: "other", equip, title: "แก้ไขรายการ PM", detail: `${where} — ${fl}: ${base.value || "(ล้างค่า)"}` };
}

function buildActivityEntries() {
  const all = [];
  Object.keys(dbData).forEach(key => {
    const meta = dbMeta[key];
    if (!meta || !meta.at) return;
    const e = classifyActivityEntry(key, dbData[key], meta);
    if (e) all.push(e);
  });
  // ตั้งวันที่ทั้งกลุ่มพร้อมกัน → รวมเป็นแถวเดียว ไม่ให้รายการท่วม
  const merged = [], bulk = new Map();
  all.forEach(e => {
    if (e.type !== "date") { merged.push(e); return; }
    const k = [e.groupType, e.field, e.value, e.by, String(e.at).slice(0, 16)].join("|");
    const g = bulk.get(k);
    if (g) g.count++; else { const c = { ...e, count: 1 }; bulk.set(k, c); merged.push(c); }
  });
  merged.forEach(e => {
    if (e.type === "date" && e.count > 1) { e.detail += ` · ทั้งกลุ่ม ${e.count} อุปกรณ์`; e.bulk = true; }
  });
  return merged;
}

function fmtActivityTime(at) {
  const d = new Date(at);
  if (isNaN(d)) return "—";
  return d.toLocaleString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getActivityRows() {
  const dept = document.getElementById("activityDeptFilter")?.value || "all";
  const group = document.getElementById("activityGroupFilter")?.value || "all";
  const type = document.getElementById("activityTypeFilter")?.value || "all";
  const period = document.getElementById("activityPeriodFilter")?.value || "all";
  const q = (document.getElementById("activitySearch")?.value || "").trim().toLowerCase();
  const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 0;
  let since = 0;
  if (days === 1) { const d = new Date(); d.setHours(0, 0, 0, 0); since = d.getTime(); }
  else if (days) since = Date.now() - days * 86400000;

  return buildActivityEntries().filter(e => {
    const gd = pmProgressDeptByGroup[e.groupType] || "em2";
    if (dept !== "all" && gd !== dept) return false;
    if (group !== "all" && e.groupType !== group) return false;
    if (type !== "all" && e.type !== type) return false;
    if (since && !(Date.parse(e.at) >= since)) return false;
    if (q) {
      const hay = `${e.tank} ${getTankDisplayLabel(e.groupType, e.tank)} ${e.equip} ${e.title} ${e.detail} ${pmProgressGroupLabels[e.groupType] || ""} ${activityUserName(e.by)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

function renderActivityGroupOptions() {
  const sel = document.getElementById("activityGroupFilter");
  if (!sel) return;
  const current = sel.value || "all";
  sel.innerHTML = '<option value="all">ทุกกลุ่มอุปกรณ์</option>';
  Object.entries(pmProgressGroupLabels).forEach(([k, v]) => sel.add(new Option(v, k)));
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

async function refreshActivityLog() {
  if (currentPage !== "activity") return;
  const btn = document.getElementById("btnRefreshActivity");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลด...'; }
  try {
    await loadDbData();
    renderActivityLog(true);
  } catch (e) {
    alert("โหลดข้อมูลไม่สำเร็จ: " + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> รีเฟรช'; }
  }
}

function renderActivityLog(resetLimit) {
  if (currentPage !== "activity") return;
  if (resetLimit === true) activityLimit = ACTIVITY_PAGE_SIZE;
  const box = document.getElementById("activity-log-rows");
  if (!box) return;

  const rows = getActivityRows();
  const countEl = document.getElementById("activity-count");
  if (countEl) countEl.textContent = `${Math.min(activityLimit, rows.length).toLocaleString()} / ${rows.length.toLocaleString()} รายการ`;

  if (!rows.length) {
    box.innerHTML = '<div class="progress-empty">ไม่พบประวัติการบันทึกตามเงื่อนไขที่เลือก</div>';
    return;
  }
  const shown = rows.slice(0, activityLimit);
  box.innerHTML = shown.map(e => {
    const label = pmProgressGroupLabels[e.groupType] || e.groupType;
    const dept = getDeptLabel(pmProgressDeptByGroup[e.groupType] || "em2");
    const name = e.bulk ? label : getTankDisplayLabel(e.groupType, e.tank);
    const link = e.bulk ? "" : `onclick="openEquipmentForm('${esc(pmProgressDeptByGroup[e.groupType] || "em2")}','${esc(e.groupType)}','${esc(e.tank)}')" title="เปิดฟอร์ม ${esc(name)}"`;
    return `<div class="pm-custom-row pm-activity-row">
      <div class="pm-activity-time">${esc(fmtActivityTime(e.at))}</div>
      <div class="pm-col-equip"><div class="pm-equip-code ${e.bulk ? "" : "pm-activity-link"}" ${link}>${esc(name)}</div><small>${esc(dept)} · ${esc(label)}</small></div>
      <div class="pm-activity-event"><span class="pm-activity-badge act-${esc(e.type)}">${esc(e.title)}</span><span class="pm-activity-detail">${esc(e.detail)}</span></div>
      <div class="pm-col-user"><strong><i class="fa-regular fa-user"></i> ${esc(activityUserName(e.by))}</strong></div>
    </div>`;
  }).join("") + (rows.length > shown.length
    ? `<div style="text-align:center;padding:12px"><button type="button" class="progress-refresh-btn" onclick="activityShowMore()">แสดงเพิ่ม (${(rows.length - shown.length).toLocaleString()} รายการ)</button></div>` : "");
}

function activityShowMore() { activityLimit += ACTIVITY_PAGE_SIZE; renderActivityLog(); }
function scheduleActivityRefresh() { clearTimeout(window.__activityTimer); window.__activityTimer = setTimeout(() => { if (currentPage === "activity") renderActivityLog(true); }, 180); }
