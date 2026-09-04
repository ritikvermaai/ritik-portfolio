const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    imageUrl: {
        type: String,
        required: true
    },

    publicId: {
        type: String,
        required: true
    },

    visible: {
        type: Boolean,
        default: true
    },

    featured: {
        type: Boolean,
        default: false,
        index: true
    },

    order: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});
const Gallery = mongoose.model("Gallery", gallerySchema);

module.exports = Gallery;
