const mongoose = require("mongoose");

const pageVisitSchema = new mongoose.Schema({
    path: { type: String, required: true, index: true },
    visitorId: { type: String, default: null, index: true },
    createdAt: { type: Date, default: Date.now, index: true }
});
const PageVisit = mongoose.models.PageVisit || mongoose.model("PageVisit", pageVisitSchema);

module.exports = PageVisit;
