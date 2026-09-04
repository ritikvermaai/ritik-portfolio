const {z}=require("zod");
exports.loginSchema=z.object({password:z.string().min(1).max(256)});
exports.changePasswordSchema=z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(8).max(256),confirmPassword:z.string().min(8).max(256)});
