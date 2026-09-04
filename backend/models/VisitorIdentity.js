const mongoose = require("mongoose");

const visitorIdentitySchema =
    new mongoose.Schema({

        _id: {
            type: String,
            required: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }

    });

const VisitorIdentity =
    mongoose.model(
        "VisitorIdentity",
        visitorIdentitySchema
    );

module.exports = VisitorIdentity;
