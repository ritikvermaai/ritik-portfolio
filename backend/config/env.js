require("dotenv").config();
module.exports={
  port: Number(process.env.PORT||5000),
  mongoUri: process.env.MONGODB_URI||"",
  frontendOrigin: String(process.env.FRONTEND_ORIGIN||"").split(",").map(v=>v.trim()).filter(Boolean),
  isProduction: process.env.NODE_ENV === "production"
};
