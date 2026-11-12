window.addEventListener("DOMContentLoaded",async()=>{
  initTheme();initSelectors();
  document.getElementById("username").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("password").focus()});
  document.getElementById("password").addEventListener("keydown",e=>{if(e.key==="Enter")performLogin()});
  const {createClient}=supabase;
  window.db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  db.auth.onAuthStateChange(async(event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      const p=prompt("ตั้งรหัสผ่านใหม่:");
      if(p){const {error}=await db.auth.updateUser({password:p});alert(error?"เปลี่ยนรหัสผ่านไม่สำเร็จ: "+error.message:"เปลี่ยนรหัสผ่านสำเร็จ");}
    }
  });
  try{await checkLoginStatus()}catch(e){showLoginError("เชื่อมต่อ Supabase ไม่สำเร็จ: "+e.message)}
});
