const crypto=require("crypto");
const bcrypt=require("bcryptjs");
const {AdminCredential,LoginThrottle}=require("../models");

const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"";
const ADMIN_PASSWORD_HASH=process.env.ADMIN_PASSWORD_HASH||"";
const MAX_DELAY=300;
const COOLDOWN_START_FAILURE=3;
const THROTTLE_POLICY_VERSION=2;

const loginKeyFor=req=>crypto.createHash("sha256").update(String(req.ip||"unknown")).digest("hex");

// First 2 failed passwords are allowed without a cooldown.
// The 3rd failure starts a 60s cooldown. Each later failed attempt
// increases the cooldown by 60s, capped at 5 minutes.
const loginDelaySeconds=failures=>{
  const count=Number(failures||0);
  if(count<COOLDOWN_START_FAILURE)return 0;
  return Math.min(MAX_DELAY,(count-COOLDOWN_START_FAILURE+1)*60);
};

async function getCurrentThrottleDoc(req){
  const doc=await LoginThrottle.findById(loginKeyFor(req)).lean();
  // A policy-version mismatch means this is legacy throttle state from
  // the previous login policy. Reset it so old locks do not leak into the
  // new 3-attempt policy.
  if(doc && Number(doc.policyVersion||0)!==THROTTLE_POLICY_VERSION){
    await LoginThrottle.findByIdAndDelete(loginKeyFor(req));
    return null;
  }
  return doc;
}

async function getLoginThrottle(req){
  const doc=await getCurrentThrottleDoc(req);
  const remainingMs=doc?.blockedUntil?Math.max(0,new Date(doc.blockedUntil).getTime()-Date.now()):0;
  return{doc,remainingMs};
}

async function registerFailedLogin(req){
  const key=loginKeyFor(req);
  const existing=await getCurrentThrottleDoc(req);
  const failures=Number(existing?.failures||0)+1;
  const delay=loginDelaySeconds(failures);
  const blockedUntil=delay>0?new Date(Date.now()+delay*1000):null;

  await LoginThrottle.findByIdAndUpdate(
    key,
    {$set:{policyVersion:THROTTLE_POLICY_VERSION,failures,blockedUntil,lastFailedAt:new Date(),updatedAt:new Date()}},
    {upsert:true,new:true,setDefaultsOnInsert:true}
  );

  await AdminCredential.findByIdAndUpdate(
    "main",
    {$inc:{failedLoginAttempts:1},$set:{updatedAt:new Date()}},
    {upsert:true,setDefaultsOnInsert:true}
  );

  return{failures,delay,retryAfter:delay};
}

async function clearLoginThrottle(req){
  await LoginThrottle.findByIdAndDelete(loginKeyFor(req));
}

async function activeSessionList(){
  const credential=await AdminCredential.findById("main");
  if(!credential)return[];
  const cutoff=new Date(Date.now()-4*60*60*1000);
  credential.activeSessions=(credential.activeSessions||[]).filter(s=>s.createdAt&&new Date(s.createdAt)>cutoff);
  await credential.save();
  return credential.activeSessions||[];
}

async function verifyAdminPassword(password){
  const stored=await AdminCredential.findById("main").lean();
  if(stored?.passwordHash)return bcrypt.compare(password,stored.passwordHash);
  if(ADMIN_PASSWORD_HASH){
    const valid=await bcrypt.compare(password,ADMIN_PASSWORD_HASH);
    if(valid)await AdminCredential.findByIdAndUpdate("main",{passwordHash:ADMIN_PASSWORD_HASH,updatedAt:new Date()},{upsert:true});
    return valid;
  }
  if(!ADMIN_PASSWORD)return false;
  const a=Buffer.from(password),b=Buffer.from(ADMIN_PASSWORD);
  const valid=a.length===b.length&&crypto.timingSafeEqual(a,b);
  if(valid){
    const passwordHash=await bcrypt.hash(password,12);
    await AdminCredential.findByIdAndUpdate("main",{passwordHash,updatedAt:new Date()},{upsert:true,new:true,setDefaultsOnInsert:true});
  }
  return valid;
}

module.exports={MAX_DELAY,COOLDOWN_START_FAILURE,THROTTLE_POLICY_VERSION,loginKeyFor,loginDelaySeconds,getLoginThrottle,registerFailedLogin,clearLoginThrottle,activeSessionList,verifyAdminPassword};
