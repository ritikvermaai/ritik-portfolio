const mongoose = require("mongoose");
const themeSchema = new mongoose.Schema({
 _id:{type:String,default:"main"}, mode:{type:String,enum:["dark","light"],default:"dark"}, primary:{type:String,default:"#6d5dfc"}, secondary:{type:String,default:"#08b7d4"}, accent:{type:String,default:"#f04f9d"}, cardBackground:{type:String,default:"#17122f"}, cardBorder:{type:String,default:"#ffffff"}, heading:{type:String,default:"#f8f7ff"}, body:{type:String,default:"#a9a5c0"}, updatedAt:{type:Date,default:Date.now}
});
module.exports=mongoose.models.Theme||mongoose.model("Theme",themeSchema);
