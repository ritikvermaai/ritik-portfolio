const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: "" },
  subject: { type: String, trim: true, default: "" },
  inquiryType: { type: String, trim: true, default: "General enquiry" },
  company: { type: String, trim: true, default: "" },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

messageSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  if (this.status === "new") this.read = false;
  if (this.status !== "new") this.read = true;
  next();
});

module.exports = mongoose.model("Message", messageSchema);
