const crypto=require("crypto");
const {AuditLog}=require("../models");
function csrfTokenFor(req){if(!req.session.csrfToken)req.session.csrfToken=crypto.randomBytes(32).toString("hex");return req.session.csrfToken;}
function auditActionFor(req){const p=req.path.replace(/\/+$/,""),m=req.method;const rules=[[/resume/i,"updated Resume"],[/gallery/i,m==="DELETE"?"deleted Gallery image":"updated Gallery"],[/projects?/i,m==="DELETE"?"deleted Project":m==="POST"?"added Project":"updated Project"],[/theme/i,"updated Theme"],[/settings/i,"updated Website settings"],[/builder|portfolio-content/i,"updated Website content"],[/ratings/i,m==="DELETE"?"deleted Rating":"updated Ratings"],[/messages/i,"updated Message"],[/donations/i,"updated Donation records"],[/profile-image/i,"updated Profile photo"],[/server\/restart/i,"restarted Server"]];return(rules.find(([re])=>re.test(p))||[null,`${m} ${p}`])[1];}
async function writeAudit(req,action){try{await AuditLog.create({action,method:req.method,path:req.path,ip:req.ip||"",userAgent:String(req.get("user-agent")||"").slice(0,300)});}catch(error){console.error("Audit log error:",error);}}
module.exports={csrfTokenFor,auditActionFor,writeAudit};
