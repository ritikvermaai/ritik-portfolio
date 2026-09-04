const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
    type: { type: String, enum: ["project", "gallery"], required: true, index: true },
    itemId: { type: String, default: null, index: true },
    name: { type: String, default: "" },
    visitorId: { type: String, default: null, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
});
const AnalyticsEvent = mongoose.models.AnalyticsEvent || mongoose.model("AnalyticsEvent", analyticsEventSchema);

module.exports = AnalyticsEvent;
