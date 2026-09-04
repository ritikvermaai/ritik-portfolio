const mongoose = require("mongoose");

const portfolioRatingSchema =
    new mongoose.Schema({

        visitorId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        feedback: {
            type: String,
            default: "",
            maxlength: 500,
            trim: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }

    });

const PortfolioRating =
    mongoose.model(
        "PortfolioRating",
        portfolioRatingSchema
    );

/* ================= DONATION ================= */

module.exports = PortfolioRating;
