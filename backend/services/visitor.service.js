const crypto=require("crypto");
const {Visitor,VisitorIdentity}=require("../models");
function getCookie(req,name){const raw=req.headers.cookie||"";const found=raw.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));return found?decodeURIComponent(found.slice(name.length+1)):null;}
function ensureAnalyticsVisitorId(req,res){let id=getCookie(req,"ritik_visitor_id");if(!id){id=crypto.randomUUID();res.cookie("ritik_visitor_id",id,{httpOnly:false,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:1000*60*60*24*3650,path:"/"});}return id;}
async function registerUniqueVisitor(req,res){const visitorId=ensureAnalyticsVisitorId(req,res);try{const created=await VisitorIdentity.findOneAndUpdate({_id:visitorId},{$setOnInsert:{_id:visitorId,createdAt:new Date()}},{upsert:true,new:false});if(!created)await Visitor.findOneAndUpdate({_id:"main"},{$inc:{count:1}},{upsert:true,setDefaultsOnInsert:true});return{visitorId,isNew:!created};}catch(error){console.error("Visitor registration error:",error);return{visitorId,isNew:false};}}
module.exports={getCookie,ensureAnalyticsVisitorId,registerUniqueVisitor};
