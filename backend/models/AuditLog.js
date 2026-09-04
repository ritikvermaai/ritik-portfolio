const mongoose = require("mongoose");

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", new mongoose.Schema({
    action: { type: String, required: true, index: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    actor: { type: String, default: "Ritik Verma" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now, index: true }
}));

module.exports = AuditLog;
