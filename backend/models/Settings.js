const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({

    siteTitle: {
        type: String,
        default: "Ritik Verma Portfolio"
    },

    siteDescription: {
        type: String,
        default: ""
    },

    profileImage: {
    type: String,
    default: "/assets/photoweb.png"
},

    contactEmail: {
        type: String,
        default: ""
    },

    instagram: {
        type: String,
        default: ""
    },

    github: {
        type: String,
        default: ""
    },

    linkedin: {
        type: String,
        default: ""
    },

    theme: {
        mode: { type: String, enum: ["dark", "light"], default: "dark" },
        primary: { type: String, default: "#6d5dfc" },
        secondary: { type: String, default: "#08b7d4" },
        accent: { type: String, default: "#f04f9d" },
        cardBackground: { type: String, default: "#17122f" },
        cardBorder: { type: String, default: "#ffffff" },
        heading: { type: String, default: "#f8f7ff" },
        body: { type: String, default: "#a9a5c0" }
    }

});

const Settings =
    mongoose.model(
        "Settings",
        settingsSchema
    );



module.exports = Settings;
