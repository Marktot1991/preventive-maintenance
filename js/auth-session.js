// =====================================================
// AUTH SESSION CONTROL
// -----------------------------------------------------
// Supabase keeps its auth session in persistent browser storage.
// We add a tab-scoped marker so this app behaves like this:
//   - Refresh / F5       => stay logged in
//   - Close tab/browser  => marker disappears
//   - Open app again     => Login is required
// =====================================================
const AUTH_TAB_KEY = "pm_tab_session_v1";

function hasTabSession(){
  try{
    return sessionStorage.getItem(AUTH_TAB_KEY) === "1";
  }catch(e){
    console.warn("Cannot access sessionStorage:", e);
    return false;
  }
}

function markTabSession(){
  try{
    sessionStorage.setItem(AUTH_TAB_KEY, "1");
  }catch(e){
    console.warn("Cannot write sessionStorage:", e);
  }
}

function clearTabSession(){
  try{
    sessionStorage.removeItem(AUTH_TAB_KEY);
  }catch(e){
    console.warn("Cannot clear sessionStorage:", e);
  }
}
