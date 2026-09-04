const mongoose=require("mongoose");

let connectionErrorHandlerInstalled = false;
if (!connectionErrorHandlerInstalled) {
  connectionErrorHandlerInstalled = true;
  mongoose.connection.on("error", (error) => {
    // Keep the Node process alive when MongoDB is temporarily unavailable.
    // API/health endpoints will report the disconnected state instead.
    console.error("MongoDB connection error:", error?.message || error);
  });
}
async function connectDatabase(){
  if(!process.env.MONGODB_URI){ console.warn("MONGODB_URI is not configured."); return false; }
  try{ await mongoose.connect(process.env.MONGODB_URI); console.log("MongoDB Connected"); return true; }
  catch(error){ console.error("MongoDB Connection Error:",error); return false; }
}
module.exports={connectDatabase};
