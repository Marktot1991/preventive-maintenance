function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
function likeEsc(v){return String(v??"").replace(/[\\%_]/g,m=>"\\"+m)}
function setLoading(on){document.getElementById("loading").style.display=on?"block":"none"}
function applyTheme(theme){
  const t=theme==="dark"?"dark":"light";
  document.documentElement.setAttribute("data-theme",t);
  localStorage.setItem("pmTheme",t);
  document.querySelectorAll(".theme-toggle").forEach(b=>{
    const i=b.querySelector("i");
    const l=b.querySelector(".menu-label");
    if(i)i.className=t==="dark"?"fa-solid fa-sun":"fa-solid fa-moon";
    if(l)l.textContent=t==="dark"?"โหมดสว่าง":"โหมดมืด";
    b.setAttribute("title",t==="dark"?"เปลี่ยนเป็นโหมดสว่าง":"เปลี่ยนเป็นโหมดมืด");
  });
}
function toggleTheme(){applyTheme((document.documentElement.getAttribute("data-theme")||"light")==="dark"?"light":"dark")}
function initTheme(){const s=localStorage.getItem("pmTheme");applyTheme(s||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"))}
function showLoginError(msg){const e=document.getElementById("login-error");e.textContent=msg;e.style.display="block"}
function hideLoginError(){document.getElementById("login-error").style.display="none"}
function showApp(){document.getElementById("login-screen").classList.add("hidden");document.getElementById("app-container").classList.remove("hidden")}
function showLogin(){document.getElementById("login-screen").classList.remove("hidden");document.getElementById("app-container").classList.add("hidden")}
