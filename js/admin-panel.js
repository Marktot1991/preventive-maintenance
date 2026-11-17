// =====================================================
// ADMINISTRATOR PANEL
//  - จัดการผู้ใช้ (เพิ่ม / ลบ / เปลี่ยนสิทธิ์)       เฉพาะ administrator
//  - Login log (เข้า-ออก, ใช้งานกี่นาที)              เฉพาะ administrator
//  - Export log (ใครส่งออกเอกสารส่วนไหน)             เฉพาะ administrator
// การบังคับสิทธิ์จริงอยู่ที่ฝั่ง Supabase (RLS + RPC ใน sql/administrator-setup.sql)
// ฝั่งหน้าเว็บแค่ซ่อน/แสดงเมนูเท่านั้น
// =====================================================
const LOGIN_LOG_ID_KEY = "pm_login_log_id_v1";
const HEARTBEAT_MS = 60000;
const ONLINE_WINDOW_MS = 3 * 60000;
let __loginLogId = null, __heartbeatTimer = null, __lastAccessToken = "";
let __admTab = "login", __admLoginRows = [], __admExportRows = [];

function isAdministrator() { return currentRole === "administrator"; }

function admEsc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function admRoleLabel(r) { return r === "administrator" ? "Administrator" : r === "admin" ? "Admin" : "View"; }
function admBadge(r) { return `<span class="adm-badge ${admEsc(r || "view")}">${admRoleLabel(r)}</span>`; }
function admFmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
function admFmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function admFmtDuration(ms) {
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 60) return `${min} นาที`;
  return `${Math.floor(min / 60)} ชม. ${min % 60} นาที`;
}
function admMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = "adm-msg " + (text ? (ok ? "ok" : "err") : "");
  el.textContent = text || "";
}

// ---------- เมนู / สิทธิ์ ----------
function applyAdministratorUI() {
  document.body.classList.toggle("is-administrator", isAdministrator());
}

// ---------- Login tracking ----------
async function initSessionTracking() {
  if (!currentUser) return;
  try {
    let existing = null;
    try { existing = hasTabSession() ? sessionStorage.getItem(LOGIN_LOG_ID_KEY) : null; } catch (e) {}
    if (existing) {
      __loginLogId = existing;           // รีเฟรชหน้า (F5) = session เดิม
      await sendHeartbeat();
    } else {
      // สร้าง id ฝั่งเบราว์เซอร์ ไม่ต้องอ่านแถวกลับ (ผู้ใช้ที่ไม่ใช่ administrator อ่านตาราง log ไม่ได้)
      const newId = (crypto.randomUUID ? crypto.randomUUID() :
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); }));
      const { error } = await db.from("login_logs").insert({
        id: newId,
        user_id: currentUser.id,
        email: currentUser.email || "",
        display_name: currentUserName || currentUser.email || "",
        role: currentRole,
        user_agent: (navigator.userAgent || "").slice(0, 250)
      });
      if (error) throw error;
      __loginLogId = newId;
      try { sessionStorage.setItem(LOGIN_LOG_ID_KEY, __loginLogId); } catch (e) {}
    }
    await refreshAccessToken();
    clearInterval(__heartbeatTimer);
    __heartbeatTimer = setInterval(() => { if (!document.hidden) sendHeartbeat(); }, HEARTBEAT_MS);
  } catch (e) {
    console.warn("login log:", e.message || e);   // ยังไม่ได้รัน SQL ก็ไม่ให้กระทบการใช้งาน
  }
}
async function refreshAccessToken() {
  try { const { data } = await db.auth.getSession(); __lastAccessToken = data?.session?.access_token || ""; } catch (e) {}
}
async function sendHeartbeat() {
  if (!__loginLogId) return;
  try { await db.from("login_logs").update({ last_seen_at: new Date().toISOString() }).eq("id", __loginLogId); } catch (e) {}
  refreshAccessToken();
}
async function endSessionTracking() {
  clearInterval(__heartbeatTimer);
  if (__loginLogId) {
    try {
      await db.from("login_logs").update({ logout_at: new Date().toISOString(), last_seen_at: new Date().toISOString() }).eq("id", __loginLogId);
    } catch (e) {}
  }
  __loginLogId = null;
  try { sessionStorage.removeItem(LOGIN_LOG_ID_KEY); } catch (e) {}
}
// ปิดแท็บ/เบราว์เซอร์: บันทึกเวลาออกแบบ best-effort ด้วย keepalive fetch
window.addEventListener("pagehide", () => {
  if (!__loginLogId || !__lastAccessToken || typeof SUPABASE_URL === "undefined") return;
  try {
    fetch(`${SUPABASE_URL}/rest/v1/login_logs?id=eq.${encodeURIComponent(__loginLogId)}`, {
      method: "PATCH", keepalive: true,
      headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + __lastAccessToken },
      body: JSON.stringify({ last_seen_at: new Date().toISOString() })
    });
  } catch (e) {}
});
document.addEventListener("visibilitychange", () => { if (!document.hidden) sendHeartbeat(); });

// ---------- Export logging ----------
async function logExport(info) {
  if (!currentUser) return;
  try {
    const { error } = await db.from("export_logs").insert({
      user_id: currentUser.id,
      email: currentUser.email || "",
      display_name: currentUserName || currentUser.email || "",
      export_type: info.type || "PDF / พิมพ์ A4",
      department: info.department || "",
      group_type: info.groupType || "",
      group_label: info.groupLabel || "",
      tanks: info.tanks || [],
      detail: info.detail || ""
    });
    if (error) throw error;
  } catch (e) { console.warn("export log:", e.message || e); }
}

// ---------- หน้า จัดการผู้ใช้ ----------
async function fetchAdminUsers() {
  // 1) ใช้ RPC (ไม่ติด RLS)  2) ถ้ายังไม่ได้รัน SQL ใหม่ ให้ fallback ไปอ่านตาราง profiles ตรง ๆ
  let res = await db.rpc("admin_list_users");
  if (!res.error) return { data: res.data || [], error: null, viaRpc: true };
  const fb = await db.from("profiles").select("id,email,display_name,role").order("email");
  if (fb.error) return { data: [], error: res.error, viaRpc: false };
  return { data: fb.data || [], error: null, viaRpc: false, rpcError: res.error };
}

async function renderAdminUsers() {
  if (!isAdministrator()) return;
  const body = document.getElementById("adm-users-body");
  if (!body) return;
  body.innerHTML = '<tr><td colspan="6" class="adm-empty">กำลังโหลด...</td></tr>';
  const { data, error, viaRpc, rpcError } = await fetchAdminUsers();
  if (error) {
    body.innerHTML = `<tr><td colspan="6" class="adm-empty">โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ${admEsc(error.message)}<br><span class="adm-sub">(ยังไม่ได้รัน sql/administrator-setup.sql ล่าสุดใน Supabase?)</span></td></tr>`;
    return;
  }
  admMsg("adm-users-msg", viaRpc ? "" :
    "แสดงรายชื่อแบบจำกัด เพราะยังไม่ได้รัน sql/administrator-setup.sql ล่าสุด (" + (rpcError?.message || "") + ")", false);
  const order = { administrator: 0, admin: 1, view: 2 };
  data.sort((a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3) || String(a.email).localeCompare(String(b.email)));
  document.getElementById("adm-users-count").textContent = `${data.length} บัญชี`;
  body.innerHTML = data.map(u => {
    const self = currentUser && u.id === currentUser.id;
    const roleSel = self ? admBadge(u.role) + ' <span class="adm-sub">(คุณ)</span>' :
      `<select class="adm-role-sel" onchange="changeUserRole('${admEsc(u.id)}', this.value, this)">
        ${["administrator", "admin", "view"].map(r => `<option value="${r}" ${u.role === r ? "selected" : ""}>${admRoleLabel(r)}</option>`).join("")}
      </select>`;
    const del = self ? "" : `<button type="button" class="adm-btn danger small" onclick="deleteUser('${admEsc(u.id)}','${admEsc(u.email)}')"><i class="fa-solid fa-trash-can"></i> ลบ</button>`;
    const last = u.last_sign_in_at ? admFmtDate(u.last_sign_in_at) + " " + admFmtTime(u.last_sign_in_at) : "—";
    return `<tr><td>${admEsc(u.display_name || "—")}</td><td>${admEsc(u.email)}</td><td>${roleSel}</td><td>${viaRpc ? admFmtDate(u.created_at) : "—"}</td><td>${viaRpc ? last : "—"}</td><td>${del}</td></tr>`;
  }).join("") || '<tr><td colspan="6" class="adm-empty">ไม่มีผู้ใช้</td></tr>';
}

async function addUser() {
  if (!isAdministrator()) return;
  const email = document.getElementById("admNewEmail").value.trim();
  const name = document.getElementById("admNewName").value.trim();
  const pass = document.getElementById("admNewPass").value;
  const role = document.getElementById("admNewRole").value;
  if (!email || !pass) { admMsg("adm-add-msg", "กรุณากรอก E-Mail และรหัสผ่าน", false); return; }
  const btn = document.getElementById("admAddBtn");
  btn.disabled = true; admMsg("adm-add-msg", "");
  const { error } = await db.rpc("admin_create_user", { p_email: email, p_password: pass, p_display_name: name, p_role: role });
  btn.disabled = false;
  if (error) { admMsg("adm-add-msg", "เพิ่มผู้ใช้ไม่สำเร็จ: " + error.message, false); return; }
  ["admNewEmail", "admNewName", "admNewPass"].forEach(id => { document.getElementById(id).value = ""; });
  admMsg("adm-add-msg", `เพิ่มผู้ใช้ ${email} เรียบร้อย`, true);
  await loadProfileNames(true);
  renderAdminUsers();
}

async function deleteUser(id, email) {
  if (!isAdministrator()) return;
  if (!confirm(`ลบผู้ใช้ ${email} ?\nผู้ใช้นี้จะเข้าสู่ระบบไม่ได้อีก (ประวัติการแก้ไขที่เคยบันทึกจะยังอยู่)`)) return;
  const { error } = await db.rpc("admin_delete_user", { p_user_id: id });
  if (error) {
    admMsg("adm-users-msg", "ลบผู้ใช้ไม่สำเร็จ: " + error.message, false);
    alert("ลบผู้ใช้ไม่สำเร็จ: " + error.message);
    return;
  }
  delete profileNames[id];
  admMsg("adm-users-msg", `ลบผู้ใช้ ${email} เรียบร้อย`, true);
  renderAdminUsers();
}

async function changeUserRole(id, role, el) {
  if (!isAdministrator()) return;
  el.disabled = true;
  const { error } = await db.rpc("admin_set_role", { p_user_id: id, p_role: role });
  el.disabled = false;
  if (error) { alert("เปลี่ยนสิทธิ์ไม่สำเร็จ: " + error.message); }
  renderAdminUsers();
}

// ---------- หน้า Login / Export Log ----------
function setAdminLogTab(tab) {
  __admTab = tab;
  document.querySelectorAll(".adm-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.getElementById("adm-login-view").style.display = tab === "login" ? "" : "none";
  document.getElementById("adm-export-view").style.display = tab === "export" ? "" : "none";
  renderAdminLogs();
}

async function loadAdminLogs() {
  if (!isAdministrator()) return;
  const btn = document.getElementById("admLogRefresh");
  if (btn) btn.disabled = true;
  const since = new Date(Date.now() - 365 * 86400000).toISOString();
  const [lg, ex] = await Promise.all([
    db.from("login_logs").select("*").gte("login_at", since).order("login_at", { ascending: false }).limit(2000),
    db.from("export_logs").select("*").gte("exported_at", since).order("exported_at", { ascending: false }).limit(2000)
  ]);
  if (btn) btn.disabled = false;
  const errs = [lg.error, ex.error].filter(Boolean).map(e => e.message);
  admMsg("adm-log-msg", errs.length ? "โหลดล็อกไม่สำเร็จ (ยังไม่ได้รัน sql/administrator-setup.sql?): " + errs.join(" | ") : "", false);
  __admLoginRows = lg.data || [];
  __admExportRows = ex.data || [];
  fillAdminUserFilter();
  renderAdminLogs();
}

function fillAdminUserFilter() {
  const sel = document.getElementById("admLogUser");
  const cur = sel.value || "all";
  const users = new Map();
  [...__admLoginRows, ...__admExportRows].forEach(r => users.set(r.user_id, r.display_name || r.email || r.user_id));
  sel.innerHTML = '<option value="all">ผู้ใช้ทั้งหมด</option>' +
    [...users.entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1])))
      .map(([id, n]) => `<option value="${admEsc(id)}">${admEsc(n)}</option>`).join("");
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function admInPeriod(iso, period) {
  if (period === "all") return true;
  const t = new Date(iso).getTime(), now = Date.now();
  if (period === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return t >= d.getTime(); }
  return t >= now - (period === "7d" ? 7 : 30) * 86400000;
}

let __adminLogsSearchTimer = null;
function scheduleAdminLogsRefresh(){
  clearTimeout(__adminLogsSearchTimer);
  __adminLogsSearchTimer = setTimeout(() => {
    if (currentPage === "adminLogs") renderAdminLogs();
  }, 280);
}

function renderAdminLogs() {
  if (!isAdministrator()) return;
  const user = document.getElementById("admLogUser").value;
  const period = document.getElementById("admLogPeriod").value;
  const q = document.getElementById("admLogSearch").value.trim().toLowerCase();
  const match = r => (user === "all" || r.user_id === user) &&
    (!q || [r.display_name, r.email, r.group_label, r.detail, (r.tanks || []).join(" ")].join(" ").toLowerCase().includes(q));

  const logins = __admLoginRows.filter(r => match(r) && admInPeriod(r.login_at, period));
  const now = Date.now();
  let total = 0, online = 0;
  const lbody = document.getElementById("adm-login-body");
  if (__admTab === "login") lbody.innerHTML = logins.map(r => {
    const start = new Date(r.login_at).getTime();
    const end = new Date(r.logout_at || r.last_seen_at).getTime();
    const dur = Math.max(0, end - start); total += dur;
    const isOn = !r.logout_at && now - new Date(r.last_seen_at).getTime() < ONLINE_WINDOW_MS;
    if (isOn) online++;
    return `<tr>
      <td>${admEsc(r.display_name || r.email || "—")}<div class="adm-sub" style="margin:0">${admEsc(r.email || "")}</div></td>
      <td>${admBadge(r.role)}</td>
      <td>${admFmtDate(r.login_at)}</td>
      <td>${admFmtTime(r.login_at)}</td>
      <td>${r.logout_at ? admFmtTime(r.logout_at) : admFmtTime(r.last_seen_at) + ' <span class="adm-sub">(ล่าสุด)</span>'}</td>
      <td><b>${admFmtDuration(dur)}</b></td>
      <td>${isOn ? '<span class="adm-badge online">ออนไลน์</span>' : r.logout_at ? '<span class="adm-badge offline">ออกจากระบบ</span>' : '<span class="adm-badge offline">ปิดหน้าเว็บ</span>'}</td>
    </tr>`;
  }).join("") || '<tr><td colspan="7" class="adm-empty">ไม่มีข้อมูลการเข้าใช้งาน</td></tr>';
  document.getElementById("adm-stat-logins").textContent = logins.length;
  document.getElementById("adm-stat-online").textContent = online;
  document.getElementById("adm-stat-minutes").textContent = Math.round(total / 60000);

  const exps = __admExportRows.filter(r => match(r) && admInPeriod(r.exported_at, period));
  document.getElementById("adm-stat-exports").textContent = exps.length;
  if (__admTab === "export") document.getElementById("adm-export-body").innerHTML = exps.map(r => `<tr>
      <td>${admEsc(r.display_name || r.email || "—")}<div class="adm-sub" style="margin:0">${admEsc(r.email || "")}</div></td>
      <td>${admFmtDate(r.exported_at)}</td>
      <td>${admFmtTime(r.exported_at)}</td>
      <td>${admEsc(r.export_type || "")}</td>
      <td>${admEsc(r.department || "—")}</td>
      <td><b>${admEsc(r.group_label || r.group_type || "—")}</b></td>
      <td>${admEsc((r.tanks || []).join(", ") || "—")}</td>
    </tr>`).join("") || '<tr><td colspan="7" class="adm-empty">ไม่มีข้อมูลการส่งออกเอกสาร</td></tr>';
}
