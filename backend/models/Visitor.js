const mongoose = require("mongoose");

const visitorSchema =
    new mongoose.Schema({

        _id: {
            type: String,
            default: "main"
        },

        count: {
            type: Number,
            default: 0
        }

    });

const Visitor =
    mongoose.model(
        "Visitor",
        visitorSchema
    );

module.exports = Visitor;
