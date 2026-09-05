const mongoose=require("mongoose");
async function connectDatabase(){
  if(!process.env.MONGODB_URI){ console.warn("MONGODB_URI is not configured."); return false; }
  try{ await mongoose.connect(process.env.MONGODB_URI); console.log("MongoDB Connected"); return true; }
  catch(error){ console.error("MongoDB Connection Error:",error); return false; }
}
module.exports={connectDatabase};
