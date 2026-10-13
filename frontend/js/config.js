const API_BASE = "http://localhost:5000/api";
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
