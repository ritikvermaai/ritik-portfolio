const mongoose = require("mongoose");

const AdminCredential = mongoose.models.AdminCredential || mongoose.model("AdminCredential", new mongoose.Schema({
    _id: { type: String, default: "main" },
    passwordHash: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sessionVersion: { type: Number, default: 1 },
    lastLoginAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    activeSessions: { type: [{ sessionId: String, createdAt: Date, lastSeenAt: Date, ip: String, userAgent: String }], default: [] }
}));

module.exports = AdminCredential;
