const {getTheme,saveTheme,DEFAULT_THEME}=require("../services/theme.service");
exports.adminGet=async(req,res)=>{try{res.json({success:true,theme:await getTheme()});}catch(e){res.status(500).json({success:false,message:"Failed to load theme."});}};
exports.save=async(req,res)=>{try{const theme=await saveTheme(req.body?.theme||req.body||{});res.json({success:true,theme,message:"Theme saved successfully."});}catch(e){console.error("Theme Save Error:",e);res.status(500).json({success:false,message:"Failed to save theme."});}};
exports.publicGet=async(req,res)=>{try{res.json({success:true,theme:await getTheme()});}catch(e){res.json({success:true,theme:DEFAULT_THEME});}};
