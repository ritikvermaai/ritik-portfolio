const mongoose = require("mongoose");

const LoginThrottle = mongoose.models.LoginThrottle || mongoose.model("LoginThrottle", new mongoose.Schema({
    _id: { type: String },
    policyVersion: { type: Number, default: 2 },
    failures: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },
    lastFailedAt: { type: Date, default: null },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: false }));

module.exports = LoginThrottle;
