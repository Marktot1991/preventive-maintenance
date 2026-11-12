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
  await loadDbData();
  startApp();
  return true;
}

async function checkLoginStatus(){
  const {data}=await db.auth.getSession();

  if(!data.session){
    clearTabSession();
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

function startApp(){
  showApp();
  currentPage="form";
  const view=currentRole==="view";
  document.getElementById("currentUserDisplay").innerHTML=view?`<span class="user-status-icon"><i class="fa-solid fa-user"></i></span><span class="user-status-text"><strong>ดูข้อมูลอย่างเดียว</strong></span>`:`<span class="user-status-icon"><i class="fa-solid fa-user-shield"></i></span><span class="user-status-text"><strong><span class="online-dot"></span>Online (Admin)</strong></span>`;
  document.getElementById("btnClearData").style.display=view?"none":"inline-block";
  document.getElementById("btnClearGroup").style.display=view?"none":"inline-block";
  ["orderNo","orderType","orderActivity","desc","workCenter","supervisor","sysStatus","userStatus","releaseDate","pmDate","pmNextDate"].forEach(id=>{const e=document.getElementById(id==="pmDate"||id==="pmNextDate"?id+"_display":id);if(e)e.readOnly=view});
  activeTankType=dbData.lastSavedTankType||"deluting";
  activeTankName=dbData.lastSavedTank||"T5110";
  const isResin = ['thinning', 'reactor'].includes(activeTankType);
  const isEm1 = ['fmu'].includes(activeTankType);
  const startDept = isResin ? 'resin' : (isEm1 ? 'em1' : 'em2');
  document.getElementById("deptSelect").value = startDept;
  switchDept(startDept, true);
  ["deluting","delicel","additive","updown","tankfarm2","surpressor","silo","hopper","diverter","slurry","thinning","reactor","fmu","wwt_flow","wwt_cond","pigline","filling"].forEach(t=>{const e=document.getElementById(t+"Select");if(e)e.value=t===activeTankType?activeTankName:""});
  updateSidebarForDept();
  updateEquipmentSelect();
  updateSidebarActive();
  renderForm();
}

async function performLogout(){
  try{
    await db.auth.signOut({scope:"local"});
  }catch(e){
    console.warn("Logout error:", e);
  }finally{
    clearTabSession();
    currentUser=null;
    currentRole="view";
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
