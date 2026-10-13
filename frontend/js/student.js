if(requireLogin("student")){
 const user=JSON.parse(localStorage.getItem("sc_user")||"{}");
 const userKey=String(user.id||user.roll_no||"student").replace(/[^a-zA-Z0-9_-]/g,"_");
 const snapshotKey=`sc_complaint_status_${userKey}`;
 const notificationKey=`sc_complaint_notifications_${userKey}`;
 let complaints=[];
 let notifications=readStoredArray(notificationKey);
 let loading=false;
 const welcome=document.getElementById("welcome");
 const profileName=document.getElementById("profileName"),profileDepartment=document.getElementById("profileDepartment"),profileRoll=document.getElementById("profileRoll"),profileEmail=document.getElementById("profileEmail"),profileAvatar=document.getElementById("profileAvatar");

 function renderProfile(){
  if(profileName)profileName.textContent=user.name||"Student";
  if(profileDepartment)profileDepartment.textContent=user.department||"Department not provided";
  if(profileRoll)profileRoll.textContent=user.roll_no||"Not available";
  if(profileEmail)profileEmail.textContent=user.email||"Not provided";
  if(profileAvatar)profileAvatar.textContent=(user.name||"Student").trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("");
  if(welcome)welcome.textContent=`Hello, ${user.name||"Student"}`;
 }
 renderProfile();

 const profileDialog=document.getElementById("profileDialog"),profileForm=document.getElementById("profileForm"),profileMessage=document.getElementById("profileMessage");
 const editProfileButton=document.querySelector("[data-edit-profile]");
 if(profileDialog&&profileForm&&profileMessage&&editProfileButton){
  editProfileButton.addEventListener("click",()=>{
   document.getElementById("profileEditName").value=user.name||"";
   document.getElementById("profileEditDepartment").value=user.department||"";
   profileMessage.textContent="";
   profileDialog.showModal();
  });
  document.querySelectorAll("[data-close-profile]").forEach(button=>button.addEventListener("click",()=>profileDialog.close()));
  profileForm.addEventListener("submit",async event=>{
   event.preventDefault();
   const name=document.getElementById("profileEditName").value.trim();
   const department=document.getElementById("profileEditDepartment").value;
   profileMessage.dataset.state="loading";
   profileMessage.textContent="Saving profile...";
   try{
    const response=await fetch(`${API_BASE}/auth/profile`,{
     method:"PATCH",
     headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
     body:JSON.stringify({name,department})
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||"Could not update profile");
    Object.assign(user,data.user);
    localStorage.setItem("sc_user",JSON.stringify(user));
    renderProfile();
    profileDialog.close();
   }catch(error){
    profileMessage.dataset.state="error";
    profileMessage.textContent=error.message;
   }
  });
 }

 const searchInput=document.getElementById("complaintSearch");
 const statusFilter=document.getElementById("statusFilter");
 const categoryFilter=document.getElementById("categoryFilter");
 [searchInput,statusFilter,categoryFilter].filter(Boolean).forEach(control=>control.addEventListener("input",()=>renderComplaints(complaints)));
 [statusFilter,categoryFilter].filter(Boolean).forEach(control=>control.addEventListener("change",()=>renderComplaints(complaints)));

 const notificationButton=document.getElementById("notificationButton");
 const notificationPanel=document.getElementById("notificationPanel");
 const clearNotificationsButton=document.getElementById("clearNotifications");
 if(notificationButton&&notificationPanel){
  notificationButton.addEventListener("click",()=>{
   const open=notificationPanel.hidden;
   notificationPanel.hidden=!open;
   notificationButton.setAttribute("aria-expanded",String(open));
   if(open){
    notifications=notifications.map(notification=>({...notification,read:true}));
    saveNotifications();
    renderNotifications();
   }
  });
 }
 if(clearNotificationsButton){
  clearNotificationsButton.addEventListener("click",()=>{
   notifications=[];
   saveNotifications();
   renderNotifications();
  });
 }

 function loadingMarkup(){
  return '<div class="skeleton-card" aria-hidden="true"><span></span><span></span><span></span></div><div class="skeleton-card" aria-hidden="true"><span></span><span></span><span></span></div>';
 }

 function syncStatusNotifications(items){
  let previous={};
  try{previous=JSON.parse(localStorage.getItem(snapshotKey)||"{}");}catch{}
  const next={};
  items.forEach(complaint=>{
   const code=String(complaint.complaint_code||"");
   const prior=previous[code];
   if(prior&&prior.status!==complaint.status){
    const notificationId=`${code}:${complaint.status}:${complaint.updated_at||""}`;
    if(!notifications.some(notification=>notification.id===notificationId)){
     notifications.unshift({id:notificationId,complaint_code:code,status:complaint.status,created_at:complaint.updated_at||new Date().toISOString(),read:false});
    }
   }
   next[code]={status:complaint.status,updated_at:complaint.updated_at||null};
  });
  notifications=notifications.slice(0,10);
  try{localStorage.setItem(snapshotKey,JSON.stringify(next));}catch{}
  saveNotifications();
  renderNotifications();
 }

 function saveNotifications(){
  try{localStorage.setItem(notificationKey,JSON.stringify(notifications));}catch{}
 }

 function renderNotifications(){
  const countElement=document.getElementById("notificationCount");
  const listElement=document.getElementById("notificationList");
  if(!countElement||!listElement)return;
  const unread=notifications.filter(notification=>!notification.read).length;
  countElement.textContent=unread>9?"9+":String(unread);
  countElement.hidden=unread===0;
  notificationButton.setAttribute("aria-label",unread?`Notifications, ${unread} unread updates`:"Notifications");
    listElement.innerHTML=notifications.length?notifications.map(notification=>`<li><span>Your complaint <strong>${esc(notification.complaint_code)}</strong> has been marked as ${esc(notification.status)}.</span><small>${formatDate(notification.created_at)}</small></li>`).join(""):'<li class="muted">No recent updates.</li>';
 }

 function populateCategoryFilter(items){
  if(!categoryFilter)return;
  const selected=categoryFilter.value;
  const categories=[...new Set(items.map(complaint=>String(complaint.category||"")).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  categoryFilter.replaceChildren(new Option("All categories",""),...categories.map(category=>new Option(category,category)));
  categoryFilter.value=categories.includes(selected)?selected:"";
 }

 function renderComplaints(items){
  const list=document.getElementById("complaints");
  if(!list)return;
  if(!items.length){
   list.innerHTML='<div class="empty-state"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M13 8h16l7 7v25H13z"/><path d="M29 8v8h7M19 25h11M19 31h11" stroke-linecap="round"/><path d="m7 16 2 2m0-2-2 2" stroke-linecap="round"/></svg><h3>No complaints yet</h3><p>Everything looks good! If you find an issue on campus, you can report it here.</p><a class="btn primary" href="register-complaint.html">+ Raise Complaint</a></div>';
   return;
  }
  const search=searchInput?searchInput.value.trim().toLowerCase():"";
  const selectedStatus=statusFilter?statusFilter.value:"";
  const selectedCategory=categoryFilter?categoryFilter.value:"";
  const filtered=items.filter(complaint=>
   (!search||String(complaint.complaint_code||"").toLowerCase().includes(search))&&
   (!selectedStatus||complaint.status===selectedStatus)&&
   (!selectedCategory||complaint.category===selectedCategory)
  );
  if(!filtered.length){
   list.innerHTML='<div class="empty-state compact-empty"><h3>No matching complaints</h3><p>Try another complaint ID, status, or category.</p></div>';
   return;
  }
  list.innerHTML=filtered.map(renderComplaint).join("");
 }

 function renderComplaint(complaint){
  const code=String(complaint.complaint_code||"");
  const status=validStatus(complaint.status)?complaint.status:"Submitted";
  const photoUrl=getPhotoUrl(complaint.photo);
  return `<article class="complaint-card"><div><h3>${esc(code)} · ${esc(complaint.category)}</h3><p><b>Department:</b> ${esc(complaint.department)}</p><p><b>Location:</b> ${esc(complaint.location)}</p><p><b>Description:</b> ${esc(complaint.description)}</p>${photoUrl?`<a class="complaint-photo-link" href="${esc(photoUrl)}" target="_blank" rel="noopener"><img class="complaint-photo" src="${esc(photoUrl)}" alt="Photo attached to complaint ${esc(code)}"></a>`:'<p class="no-photo">No photo attached</p>'}${complaint.admin_note?`<p class="admin-note-display"><b>Admin note:</b> ${esc(complaint.admin_note)}</p>`:""}<div class="timeline-wrap"><span class="timeline-heading">Status timeline</span>${renderTimeline(status)}</div></div><div class="complaint-meta"><span class="status ${status}">${status=== "Processing"?"Processing":esc(status)}</span><p>${formatDate(complaint.created_at)}</p></div></article>`;
 }

 function renderTimeline(status){
  const rejected=status==="Rejected";
  const stages=rejected?["Submitted","Under Review","Rejected"]:["Submitted","Under Review","Processing","Resolved"];
  const activeIndex=status==="Submitted"?0:status==="Processing"?2:status==="Resolved"?3:2;
  return `<ol class="complaint-timeline" aria-label="Complaint status: ${esc(status)}">${stages.map((stage,index)=>{
   const current=rejected?index===2:index===activeIndex;
   const complete=index<activeIndex;
   return `<li class="timeline-step${complete?" is-complete":""}${current?" is-current":""}"${current?' aria-current="step"':""}><span class="timeline-marker" aria-hidden="true">${complete?"✓":index+1}</span><span>${stage}</span></li>`;
  }).join("")}</ol>`;
 }

 function validStatus(status){return ["Submitted","Processing","Resolved","Rejected"].includes(status);}
 function formatDate(value){const date=new Date(value);return Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleString();}
 function getPhotoUrl(photo){
  if(!photo)return "";
  try{const origin=new URL(API_BASE).origin;const url=new URL(photo,`${origin}/`);return url.origin===origin?url.href:"";}catch{return "";}
 }
 function readStoredArray(key){try{const value=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[];}catch{return [];}}
 function esc(value){return String(value??"").replace(/[&<>"']/g,match=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[match]));}

 async function loadComplaints(){
  if(loading)return;
  loading=true;
  const list=document.getElementById("complaints");
  const statElements=["total","submitted","processing","resolved","rejected"].map(id=>document.getElementById(id)).filter(Boolean);
  if(list&&!complaints.length)list.innerHTML=loadingMarkup();
  if(!complaints.length)statElements.forEach(element=>element.textContent="…");
  try{
   const response=await fetch(`${API_BASE}/complaints/mine`,{headers:{Authorization:`Bearer ${getToken()}`}});
   const data=await response.json().catch(()=>({}));
   if(!response.ok){if(response.status===401)logout();throw new Error(data.message||`Could not load complaints (${response.status})`);}
   if(!Array.isArray(data.complaints))throw new Error("The server returned an invalid complaints response.");
   complaints=data.complaints;
   syncStatusNotifications(complaints);
   populateCategoryFilter(complaints);
   const counts={Submitted:0,Processing:0,Resolved:0,Rejected:0};
   complaints.forEach(complaint=>{if(validStatus(complaint.status))counts[complaint.status]++;});
   const values={total:complaints.length,submitted:counts.Submitted,processing:counts.Processing,resolved:counts.Resolved,rejected:counts.Rejected};
   Object.entries(values).forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=value;});
   renderComplaints(complaints);
  }catch(error){
   console.error("Could not load student complaints:",error);
   if(!complaints.length)statElements.forEach(element=>element.textContent="—");
   const errorMessage=error instanceof TypeError?"Could not reach the complaint service. Confirm the backend is running and refresh the page.":error.message||"Could not load your complaints. Please try again.";
   if(list)list.innerHTML=`<div class="empty-state error-state"><h3>Complaints could not be loaded</h3><p role="alert">${esc(errorMessage)}</p><button class="btn secondary" type="button" onclick="location.reload()">Try again</button></div>`;
  }finally{loading=false;}
 }

 renderNotifications();
 loadComplaints();
 window.setInterval(()=>{if(document.visibilityState==="visible")loadComplaints();},60000);
}