const multer=require("multer");
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:10*1024*1024,files:5},fileFilter(req,file,cb){const allowed=new Set(["image/jpeg","image/png","image/webp","image/gif"]);if(!allowed.has(file.mimetype))return cb(new Error("Only JPG, PNG, WEBP and GIF images are allowed."));cb(null,true);}});
module.exports=upload;
