async function performLogin(){
  hideLoginError();
  const email=document.getElementById("username").value.trim(),password=document.getElementById("password").value;
  if(!email||!password){showLoginError("กรุณากรอก E-Mail และรหัสผ่าน");return}
  const b=document.getElementById("loginButton");b.disabled=true;b.textContent="กำลังตรวจสอบ...";

  const {data,error}=await db.auth.signInWithPassword({email,password});
  b.disabled=false;b.textContent="เข้าสู่ระบบ";

  if(error){
    clearTabSession();
    showLoginError("เข้าสู่ระบบไม่สำเร็จ: "+error.message);
    return;
  }

  currentUser=data.user;
  document.getElementById("sync-overlay").classList.remove("hidden");

  try{
    const started=await loadUserAndStart();
    if(started) markTabSession();
    else clearTabSession();
  }catch(e){
    clearTabSession();
    throw e;
  } finally {
    document.getElementById("sync-overlay").classList.add("hidden");
  }
}

async function loadUserAndStart(){
  const {data,error}=await db.from("profiles").select("role,display_name,email").eq("id",currentUser.id).single();
  if(error){
    showLoginError("ไม่พบ Profile ของผู้ใช้งาน: "+error.message);
    return false;
  }
  currentRole=data.role||"view";
  // ใช้ E-Mail จาก Supabase Auth ของบัญชีที่ล็อกอินจริงก่อนเสมอ
  // และใช้ profiles.email เฉพาะกรณีที่ Auth ไม่ส่ง E-Mail กลับมา
  let authEmail=String(currentUser?.email||"").trim();
  try{
    const {data:authData,error:authError}=await db.auth.getUser();
    if(!authError && authData?.user?.id===currentUser.id){
      currentUser=authData.user;
      authEmail=String(authData.user.email||authEmail).trim();
    }
  }catch(e){
    console.warn("Cannot refresh user email, using session/profile email:",e);
  }
  signedInEmail=authEmail||String(data.email||"").trim();
  currentUserName=String(data.display_name||signedInEmail||"").trim();
  await loadDbData();
  startApp();
  return true;
}

async function checkLoginStatus(){
  const {data}=await db.auth.getSession();

  if(!data.session){
    clearTabSession();
    signedInEmail="";
    showLogin();
    return;
  }

  if(!hasTabSession()){
    try{
      await db.auth.signOut({scope:"local"});
    }catch(e){
      console.warn("Auto logout after browser/tab close:", e);
    }
    currentUser=null;
    signedInEmail="";
    currentRole="view";
    clearTabSession();
    showLogin();
    return;
  }

  currentUser=data.session.user;
  document.getElementById("sync-overlay").classList.remove("hidden");
  try {
    await loadUserAndStart();
  } finally {
    document.getElementById("sync-overlay").classList.add("hidden");
  }
}

// แสดง E-Mail จริงบริเวณเหนือปุ่มออกจากระบบสำหรับทุกสิทธิ์ (ไม่ใช้ "Online Admin")
// ใช้ textContent เพื่อไม่ตีความ E-Mail เป็น HTML
function renderSignedInEmail(){
  const display=document.getElementById("currentUserDisplay");
  if(!display)return;
  const email=String(signedInEmail||currentUser?.email||"").trim();
  const shown=email||"ไม่พบอีเมลผู้ใช้";
  const icon=document.createElement("span");
  icon.className="user-status-icon user-online-dot";
  icon.setAttribute("aria-hidden","true");
  const label=document.createElement("span");
  label.className="user-email";
  label.textContent=shown;
  display.replaceChildren(icon,label);
  display.title=shown;
  display.setAttribute("aria-label","อีเมลผู้ใช้ที่เข้าสู่ระบบ: "+shown);
}

function startApp(){
  // V19: Every authenticated app start opens the neutral dashboard, never the
  // equipment saved by a previous user. Keep inspection data untouched.
  currentPage="form";
  activeDepartment="em2";
  activeTankType="";
  activeTankName="";
  if(typeof pmTemplateEditMode!=="undefined")pmTemplateEditMode=false;
  if(typeof expandedPmSidebarDepartment!=="undefined")expandedPmSidebarDepartment=null;
  if(typeof expandedPmSidebarCategory!=="undefined")expandedPmSidebarCategory=null;
  if(typeof resultNoteSidebarOpen!=="undefined")resultNoteSidebarOpen=false;
  if(typeof resultNoteExpandedDept!=="undefined")resultNoteExpandedDept=null;
  if(typeof resultNoteExpandedGroup!=="undefined")resultNoteExpandedGroup=null;
  if(typeof resultNoteDept!=="undefined")resultNoteDept="all";
  if(typeof resultNoteFormFilter!=="undefined")resultNoteFormFilter="all";

  const view=currentRole==="view";
  renderSignedInEmail();
  if(typeof applyAdministratorUI==="function")applyAdministratorUI();
  if(typeof initSessionTracking==="function")initSessionTracking();
  document.getElementById("btnClearData").style.display=view?"none":"inline-block";
  document.getElementById("btnClearGroup").style.display=view?"none":"inline-block";
  ["orderNo","orderType","orderActivity","desc","workCenter","supervisor","sysStatus","userStatus","releaseDate","pmDate","pmNextDate"].forEach(id=>{
    const e=document.getElementById(id==="pmDate"||id==="pmNextDate"?id+"_display":id);
    if(e)e.readOnly=view;
  });

  // Reset the PM form and its legacy selectors without writing to Supabase.
  switchDept("em2", true);
  if(typeof expandedPmSidebarDepartment!=="undefined")expandedPmSidebarDepartment=null;
  if(typeof expandedPmSidebarCategory!=="undefined")expandedPmSidebarCategory=null;
  updateSidebarForDept();
  updateEquipmentSelect();
  renderForm();

  // Select a known page explicitly (not just currentPage="form").
  // This also hides History / Result Note left visible in an existing DOM.
  showPMProgress();
  showApp();
}
async function performLogout(){
  try{
    if(typeof endSessionTracking==="function")await endSessionTracking();
  }catch(e){}
  try{
    await db.auth.signOut({scope:"local"});
  }catch(e){
    console.warn("Logout error:", e);
  }finally{
    clearTabSession();
    currentUser=null;
    signedInEmail="";
    currentRole="view";
    if(typeof applyAdministratorUI==="function")applyAdministratorUI();
    showLogin();
    location.reload();
  }
}

function togglePasswordVisibility(){
  const p=document.getElementById("password"),i=document.querySelector("#passwordToggle i");
  if(p.type==="password"){
    p.type="text";
    i.className="fa-solid fa-eye";
  }else{
    p.type="password";
    i.className="fa-solid fa-eye-slash";
  }
  p.focus();
}

async function requestPasswordHelp(){
  const email=document.getElementById("username").value.trim(),s=document.getElementById("forgot-status"),b=document.getElementById("forgotPasswordBtn");
  s.className="";s.style.display="none";
  if(!email){s.className="is-error";s.textContent="กรุณากรอก E-Mail ก่อนแจ้งลืมรหัสผ่าน";s.style.display="block";return}
  b.disabled=true;s.className="is-loading";s.textContent="⏳ กำลังส่งลิงค์รีเซ็ตรหัสผ่าน...";s.style.display="block";
  const redirectTo=window.location.origin+window.location.pathname;
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo});
  b.disabled=false;
  if(error){s.className="is-error";s.textContent="ส่งลิงค์ไม่สำเร็จ: "+error.message}
  else{s.className="is-success";s.textContent="✓ ส่งลิงค์รีเซ็ตรหัสผ่านไปยัง E-Mail แล้ว กรุณาตรวจสอบกล่องจดหมาย"}
}
