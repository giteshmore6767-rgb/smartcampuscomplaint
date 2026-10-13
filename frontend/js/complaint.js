if(requireLogin("student")){
 const form=document.getElementById("complaintForm");
 const message=document.getElementById("message");
 const submitButton=form.querySelector('[type="submit"]');
 const followUpLinks=document.querySelectorAll(".submission-actions a");
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  followUpLinks.forEach(link=>link.hidden=true);
  submitButton.disabled=true;
  message.dataset.state="loading";
  message.textContent="Submitting complaint...";
  try{
   const response=await fetch(`${API_BASE}/complaints`,{
    method:"POST",
    headers:{Authorization:`Bearer ${getToken()}`},
    body:new FormData(form)
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.message||`Submission failed (${response.status})`);
   if(!data.complaint_code)throw new Error("The complaint was saved, but the server did not return its complaint code.");
   message.dataset.state="success";
   message.textContent=`Complaint submitted successfully. Complaint ID: ${data.complaint_code}`;
   form.reset();
   followUpLinks.forEach(link=>link.hidden=false);
  }catch(error){
   message.dataset.state="error";
    message.textContent=error instanceof TypeError?"Could not reach the complaint service. Confirm the backend is running, then try again.":error.message||"Could not submit complaint. Please try again.";
  }finally{
   submitButton.disabled=false;
  }
 });
}