/* PM template overrides — เก็บแยกตามรหัสถัง + รหัสอุปกรณ์ในตาราง pm_data ของ Supabase.
   ไม่แก้ array แม่แบบและไม่ต้องสร้างตารางฐานข้อมูลใหม่ */
let pmTemplateEditMode = false;

function pmIsTemplateEditing() {
  return pmTemplateEditMode && currentRole === "administrator" && currentPage === "form";
}

function pmTemplateKey(tank, section, n, field) {
  return `${tank}_${section}_${n}_${field}`;
}

function pmSectionMaxRows(tank, section, originalCount) {
  const raw = Number(dbData[`${tank}_${section}_customMax`]);
  return Math.max(6, originalCount,
    Number.isSafeInteger(raw) && raw > 0 ? Math.min(raw, 150) : 0);
}

function togglePmTemplateEdit() {
  if (currentRole !== "administrator") return;
  if (!activeTankName) { alert("กรุณาเลือกรหัสอุปกรณ์ก่อน"); return; }
  pmTemplateEditMode = !pmTemplateEditMode;
  renderForm();
}

function syncPmTemplateToolbar() {
  if (currentRole !== "administrator") pmTemplateEditMode = false;
  const toolbar = document.getElementById("pm-template-edit-toolbar");
  const toggle = document.getElementById("pm-template-edit-toggle");
  if (toolbar) toolbar.hidden = currentRole !== "administrator" || !activeTankName;
  if (toggle) {
    toggle.classList.toggle("is-editing", pmTemplateEditMode);
    toggle.setAttribute("aria-pressed", String(pmTemplateEditMode));
    toggle.innerHTML = pmTemplateEditMode
      ? '<i class="fa-solid fa-check"></i> เสร็จสิ้นการแก้ไข'
      : '<i class="fa-solid fa-pen-to-square"></i> แก้ไขรายการ PM';
  }
}

async function savePmTemplateCell(input, key) {
  if (!pmIsTemplateEditing() || !activeTankName ||
      !key.startsWith(`${activeTankName}_`)) return;
  const value = input.value.trim();
  if (key.endsWith("_taskName") && !value) {
    alert("กรุณาระบุชื่อรายการ PM (ใช้ปุ่มซ่อนรายการหากไม่ต้องการแสดง)");
    input.value = input.defaultValue;
    input.focus();
    return;
  }
  if (value === input.defaultValue) return;
  const beforeValue = input.defaultValue;
  const previous = dbData[key];
  input.disabled = true;
  try {
    await saveDataToServer(key, value);
    input.defaultValue = value;
  } catch (e) {
    // database.js ใช้ optimistic update; คืนค่าในแคชถ้าบันทึกไม่สำเร็จ
    if (previous === undefined) delete dbData[key]; else dbData[key] = previous;
    if (typeof invalidateProgressCache === "function") invalidateProgressCache(key);
    input.value = beforeValue;
  } finally { input.disabled = false; }
}

async function addPmCustomTask(button, tank, section, originalCount) {
  if (!pmIsTemplateEditing() || tank !== activeTankName) return;
  const panel = button.closest(".pm-add-task-panel");
  const name = panel?.querySelector("[data-field='name']")?.value.trim() || "";
  const standard = panel?.querySelector("[data-field='standard']")?.value.trim() || "";
  const pkg = panel?.querySelector("[data-field='package']")?.value.trim() || "";
  if (!name) {
    alert("กรุณากรอกชื่อรายการตรวจ PM");
    panel?.querySelector("[data-field='name']")?.focus();
    return;
  }
  const maxKey = `${tank}_${section}_customMax`;
  const baseCount = Number(originalCount) || 0;
  const savedMax = Number(dbData[maxKey]);
  let max = Math.max(baseCount, Number.isSafeInteger(savedMax) && savedMax > 0 ? Math.min(savedMax, 150) : 0);
  // รายการจากเวอร์ชันเก่าบางชุดยังไม่มี customMax
  for (let i = baseCount + 1; i <= 6; i++) {
    if (dbData[pmTemplateKey(tank, section, i, "taskName")]) max = Math.max(max, i);
  }
  // ใช้เลขลำดับที่ว่างจากการลบรายการก่อน เพื่อไม่ให้เลขวิ่งไปจนเกิน 150
  // ยืนยันว่าไม่มีทั้งรายละเอียดและผลตรวจเก่าหลงเหลือในตำแหน่งนั้น
  let n = 0;
  for (let i = baseCount + 1; i <= max; i++) {
    const hasStoredData = ["taskName", "standard", "package", "hidden", "radio", "note"]
      .some(field => String(dbData[pmTemplateKey(tank, section, i, field)] ?? "").length > 0);
    if (!hasStoredData) { n = i; break; }
  }
  if (!n) n = max + 1;
  if (n > 150) { alert("เพิ่มรายการได้สูงสุด 150 รายการต่ออุปกรณ์"); return; }
  const prefix = `${tank}_${section}_${n}`;
  const rows = [
    {key:`${prefix}_taskName`, value:name},
    {key:`${prefix}_standard`, value:standard},
    {key:`${prefix}_package`, value:pkg},
    {key:`${prefix}_hidden`, value:""},
    {key:maxKey, value:String(Math.max(max, n))}
  ];
  const previous = rows.map(r=>({key:r.key, value:dbData[r.key]}));
  button.disabled = true;
  try {
    await saveMany(rows);
    if (activeTankName === tank && pmIsTemplateEditing()) renderForm();
  } catch (e) {
    previous.forEach(r=>{if(r.value === undefined) delete dbData[r.key]; else dbData[r.key] = r.value;});
    if (typeof invalidateProgressCache === "function") invalidateProgressCache(maxKey);
    if (activeTankName === tank) renderForm();
  } finally { button.disabled = false; }
}

async function togglePmTaskHidden(tank, section, n) {
  if (!pmIsTemplateEditing() || tank !== activeTankName) return;
  const key = pmTemplateKey(tank, section, n, "hidden");
  const next = dbData[key] === "1" ? "" : "1";
  if (next === "1" && !confirm("ซ่อนรายการนี้จากฟอร์ม PM และ Progress? ผลตรวจเดิมจะยังอยู่ในฐานข้อมูล")) return;
  const previous = dbData[key];
  try {
    await saveDataToServer(key, next);
    if (activeTankName === tank && pmIsTemplateEditing()) renderForm();
  } catch (e) {
    if (previous === undefined) delete dbData[key]; else dbData[key] = previous;
    if (typeof invalidateProgressCache === "function") invalidateProgressCache(key);
    if (activeTankName === tank) renderForm();
  }
}

// ลบเฉพาะรายการที่ผู้ดูแล "เพิ่มเอง" — รายการต้นฉบับยังมีปุ่มซ่อน/คืนค่าเดิม
// ลบคีย์ของแถวนี้เท่านั้น ไม่ลบรายการถังอื่น; ลบผล OK/NO และหมายเหตุของแถวที่ยืนยันลบด้วย
const pmDeletingCustomRows = new Set();
async function deletePmCustomTask(button, tank, section, n, originalCount) {
  if (!pmIsTemplateEditing() || currentRole !== "administrator" || tank !== activeTankName) return;
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(originalCount) ||
      n <= originalCount || n > 150 || originalCount < 0) return;
  const prefix = `${tank}_${section}_${n}`;
  const nameKey = `${prefix}_taskName`;
  const taskName = String(dbData[nameKey] ?? "").trim();
  if (!taskName || pmDeletingCustomRows.has(prefix)) return;
  if (!confirm(`ลบรายการ PM "${taskName}" ของ ${tank} ใช่หรือไม่?\n\n` +
    "รายการนี้และผลตรวจ OK/NO / หมายเหตุของรายการนี้จะถูกลบถาวรจาก Supabase\n" +
    "ไม่กระทบรายการหรือผลตรวจของอุปกรณ์อื่น")) return;

  const keys = ["taskName", "standard", "package", "hidden", "radio", "note"]
    .map(field => `${prefix}_${field}`);
  pmDeletingCustomRows.add(prefix);
  const controls = button.closest("tr")?.querySelectorAll("button, input") || [button];
  const wasDisabled = Array.from(controls, el => [el, el.disabled]);
  wasDisabled.forEach(([el]) => { el.disabled = true; });
  try {
    setLoading(true);
    // DELETE แบบเจาะจง data_key เฉพาะแถวนี้และอ่านผลตอบกลับ เพื่อไม่แจ้งสำเร็จถ้า RLS บล็อกการลบ
    const {data, error} = await db.from("pm_data")
      .delete().in("data_key", keys).select("data_key");
    if (error) throw error;
    if (!Array.isArray(data) || !data.some(row => row.data_key === nameKey)) {
      throw new Error("ฐานข้อมูลไม่อนุญาตให้ลบรายการนี้ หรือไม่พบรายการ กรุณาตรวจสอบสิทธิ์ DELETE ใน Supabase");
    }
    keys.forEach(key => { delete dbData[key]; delete dbMeta[key]; });
    if (typeof invalidateProgressCache === "function") invalidateProgressCache(nameKey);
    if (typeof invalidateReportCaches === "function") invalidateReportCaches();
    if (activeTankName === tank && pmIsTemplateEditing()) renderForm();
  } catch (e) {
    alert("⚠️ ลบรายการ PM ไม่สำเร็จ: " + e.message);
  } finally {
    pmDeletingCustomRows.delete(prefix);
    wasDisabled.forEach(([el, value]) => { el.disabled = value; });
    setLoading(false);
  }
}

async function resetPmDefaultTask(tank, section, n) {
  if (!pmIsTemplateEditing() || tank !== activeTankName) return;
  if (!confirm("คืนชื่อรายการ มาตรฐาน และ Package เป็นค่าต้นฉบับ? ผล OK/NO และหมายเหตุจะยังอยู่")) return;
  const prefix = `${tank}_${section}_${n}`;
  const rows = ["taskName", "standard", "package", "hidden"]
    .map(field=>({key:`${prefix}_${field}`, value:""}));
  const previous = rows.map(r=>({key:r.key, value:dbData[r.key]}));
  try {
    await saveMany(rows);
    if (activeTankName === tank && pmIsTemplateEditing()) renderForm();
  } catch (e) {
    previous.forEach(r=>{if(r.value === undefined) delete dbData[r.key]; else dbData[r.key] = r.value;});
    if (typeof invalidateProgressCache === "function") invalidateProgressCache(rows[0].key);
    if (activeTankName === tank) renderForm();
  }
}
