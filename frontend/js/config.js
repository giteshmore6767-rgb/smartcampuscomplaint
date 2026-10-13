const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:5000/api"
  : `${window.location.origin}/api`;
function getToken(){ return localStorage.getItem("sc_token"); }
function logout(){ localStorage.removeItem("sc_token"); localStorage.removeItem("sc_user"); location.href="index.html"; }
function requireLogin(role){
  const token=getToken();
  if(!token){ location.href=role==="admin"?"admin-login.html":"student-login.html"; return false; }
  try{
    const user=JSON.parse(localStorage.getItem("sc_user")||"{}");
    if(role && user.role!==role){ location.href=role==="admin"?"admin-login.html":"student-dashboard.html"; return false; }
  }catch{}
  return true;
}
