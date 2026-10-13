if(requireLogin("admin")){
 const rowsElement=document.getElementById("adminRows");
 const messageElement=document.getElementById("adminMessage");
 const deleteDialog=document.getElementById("deleteComplaintDialog");
 const confirmDeleteButton=deleteDialog.querySelector("[data-confirm-delete]");
 const allowedStatuses=["Submitted","Processing","Resolved","Rejected"];
 let hasLoaded=false;
 let pendingDeleteId=null;
 let pendingDeleteButton=null;

 async function loadAdmin(){
  messageElement.dataset.state="loading";
  messageElement.textContent="Loading complaints...";
  if(!hasLoaded){
   ["total","submitted","processing","resolved","rejected"].forEach(key=>{
    const element=document.getElementById(key);
    if(element)element.textContent="…";
   });
  rowsElement.innerHTML='<tr><td colspan="11"><div class="admin-loading" role="status"><span class="sr-only">Loading complaint records</span><i></i><i></i><i></i></div></td></tr>';
  }
  try{
   const headers={Authorization:`Bearer ${getToken()}`};
   const [statsResponse,complaintsResponse]=await Promise.all([
    fetch(`${API_BASE}/admin/dashboard`,{headers}),
    fetch(`${API_BASE}/admin/complaints`,{headers})
   ]);
   if(statsResponse.status===401||complaintsResponse.status===401){logout();return;}
   const statsData=await statsResponse.json().catch(()=>({}));
   const complaintsData=await complaintsResponse.json().catch(()=>({}));
   if(!statsResponse.ok)throw new Error(statsData.message||"Could not load complaint totals");
   if(!complaintsResponse.ok)throw new Error(complaintsData.message||"Could not load complaints");
   const stats=statsData.stats||{};
   ["total","submitted","processing","resolved","rejected"].forEach(key=>{
    const element=document.getElementById(key);
    if(element)element.textContent=stats[key]??0;
   });
   if(!Array.isArray(complaintsData.complaints))throw new Error("The server returned an invalid complaints response.");
   rowsElement.innerHTML=complaintsData.complaints.map(renderComplaint).join("")||'<tr><td colspan="11">No complaints found.</td></tr>';
   rowsElement.querySelectorAll("[data-save-code]").forEach(button=>button.addEventListener("click",()=>updateComplaint(button)));
  rowsElement.querySelectorAll("[data-status-code]").forEach(button=>button.addEventListener("click",()=>updateComplaint(button,button.dataset.status)));
  rowsElement.querySelectorAll("[data-delete-id]").forEach(button=>button.addEventListener("click",()=>openDeleteDialog(button)));
    hasLoaded=true;
   messageElement.textContent="";
  return true;
  }catch(error){
   console.error("Could not load admin complaints:",error);
   ["total","submitted","processing","resolved","rejected"].forEach(key=>{
    const element=document.getElementById(key);
    if(element)element.textContent="—";
   });
    const errorMessage=error instanceof TypeError?"Could not reach the complaint service. Confirm the backend is running and refresh.":error.message||"Could not load complaints. Please try again.";
    rowsElement.innerHTML=`<tr><td colspan="11">${esc(errorMessage)}</td></tr>`;
   messageElement.dataset.state="error";
   messageElement.textContent="Complaint data could not be loaded.";
  return false;
  }
 }

 function renderComplaint(complaint){
  const code=String(complaint.complaint_code||"");
  const photoUrl=getPhotoUrl(complaint.photo);
  const status=allowedStatuses.includes(complaint.status)?complaint.status:"Submitted";
  const date=new Date(complaint.created_at);
  const dateLabel=Number.isNaN(date.getTime())?"Date unavailable":date.toLocaleString();
  return `<tr data-status="${esc(status)}"><td><b>${esc(code)}</b><br><small>Record ${esc(complaint.id)}</small></td><td><b>${esc(complaint.student_name)}</b><br><small>Roll: ${esc(complaint.student_roll_no)}</small><br><small>${esc(complaint.student_department)}</small></td><td>${esc(complaint.category)}</td><td><div class="admin-description">${esc(complaint.description)}</div></td><td>${esc(complaint.department)}</td><td>${esc(complaint.location)}</td><td>${photoUrl?`<a href="${esc(photoUrl)}" target="_blank" rel="noopener"><img class="complaint-photo" src="${esc(photoUrl)}" alt="Photo for ${esc(code)}"></a>`:'<span class="no-photo">No photo attached</span>'}</td><td>${dateLabel}</td><td><span class="status ${status}">${esc(status)}</span></td><td><textarea class="admin-note" rows="2" aria-label="Admin note for ${esc(code)}">${esc(complaint.admin_note||"")}</textarea></td><td><div class="complaint-actions"><button class="complaint-action is-processing" type="button" data-status-code="${esc(code)}" data-status="Processing">Processing</button><button class="complaint-action is-resolved" type="button" data-status-code="${esc(code)}" data-status="Resolved">Resolved</button><button class="complaint-action is-rejected" type="button" data-status-code="${esc(code)}" data-status="Rejected">Reject</button><button class="complaint-action is-delete" type="button" data-delete-id="${esc(complaint.id)}">Delete</button><button class="save-btn" type="button" data-save-code="${esc(code)}">Save note</button></div></td></tr>`;
 }

   async function updateComplaint(button,requestedStatus){
  const row=button.closest("tr");
    const code=button.dataset.saveCode||button.dataset.statusCode;
    const status=requestedStatus||row.dataset.status;
  const adminNote=row.querySelector(".admin-note").value;
    setRowDisabled(row,true);
  messageElement.dataset.state="loading";
    messageElement.textContent=`Saving ${code}...`;
  try{
     const response=await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(code)}`,{
    method:"PATCH",
    headers:{"Content-Type":"application/json",Authorization:`Bearer ${getToken()}`},
    body:JSON.stringify({status,admin_note:adminNote})
   });
   const data=await response.json().catch(()=>({}));
   if(response.status===401){logout();return;}
   if(!response.ok)throw new Error(data.message||`Could not update complaint (${response.status})`);
   const refreshed=await loadAdmin();
   messageElement.dataset.state=refreshed?"success":"error";
   messageElement.textContent=refreshed?(data.message||"Complaint updated successfully"):"Complaint updated, but the list could not refresh. Use Refresh to try again.";
  }catch(error){
   console.error("Could not update complaint:",error);
   messageElement.dataset.state="error";
   messageElement.textContent=error.message||"Could not update complaint. Please try again.";
   setRowDisabled(row,false);
  }
 }

 function openDeleteDialog(button){
  if(deleteDialog.open)return;
  pendingDeleteId=Number(button.dataset.deleteId);
  pendingDeleteButton=button;
  confirmDeleteButton.disabled=false;
  if(!Number.isSafeInteger(pendingDeleteId)||pendingDeleteId<1){
   messageElement.dataset.state="error";
   messageElement.textContent="Could not identify the selected complaint.";
   pendingDeleteId=null;
   pendingDeleteButton=null;
   return;
  }
  try{
   deleteDialog.showModal();
  }catch(error){
   console.error("Could not open delete confirmation:",error);
   messageElement.dataset.state="error";
   messageElement.textContent="Could not open the delete confirmation. Please refresh and try again.";
   pendingDeleteId=null;
   pendingDeleteButton=null;
  }
 }

 function closeDeleteDialog(){
  if(deleteDialog.open&&typeof deleteDialog.close==="function")deleteDialog.close();
 }

 deleteDialog.querySelector("[data-cancel-delete]").addEventListener("click",()=>{
  pendingDeleteId=null;
  pendingDeleteButton=null;
  closeDeleteDialog();
 });
 confirmDeleteButton.addEventListener("click",deleteComplaint);

 async function deleteComplaint(){
  if(!pendingDeleteId||confirmDeleteButton.disabled)return;
  const id=pendingDeleteId;
  const deleteButton=pendingDeleteButton;
  confirmDeleteButton.disabled=true;
  messageElement.dataset.state="loading";
  messageElement.textContent=`Deleting complaint ${id}...`;
  try{
   const response=await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(id)}`,{
    method:"DELETE",
    headers:{Authorization:`Bearer ${getToken()}`}
   });
   const data=await response.json().catch(()=>({}));
   if(response.status===401){logout();return;}
   if(!response.ok||data.success!==true)throw new Error(data.message||`Could not delete complaint (${response.status})`);
   deleteButton?.closest("tr")?.remove();
   pendingDeleteId=null;
   pendingDeleteButton=null;
  closeDeleteDialog();
   const refreshed=await loadAdmin();
   messageElement.dataset.state=refreshed?"success":"error";
   messageElement.textContent=refreshed?(data.message||"Complaint deleted successfully"):(data.message||"Complaint deleted, but the list could not refresh. Use Refresh to try again.");
  }catch(error){
   console.error("Could not delete complaint:",error);
   messageElement.dataset.state="error";
   messageElement.textContent=error.message||"Could not delete complaint. Please try again.";
  closeDeleteDialog();
    pendingDeleteId=null;
    pendingDeleteButton=null;
   confirmDeleteButton.disabled=false;
  }
 }

 function setRowDisabled(row,disabled){
  row.querySelectorAll("button,select,textarea").forEach(control=>{control.disabled=disabled;});
 }

 function getPhotoUrl(photo){
  if(!photo)return "";
  try{
   const origin=new URL(API_BASE).origin;
   const url=new URL(photo,`${origin}/`);
   return url.origin===origin?url.href:"";
  }catch{return "";}
 }

 function esc(value){return String(value??"").replace(/[&<>"']/g,match=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[match]));}
 window.loadAdmin=loadAdmin;
 loadAdmin();
}