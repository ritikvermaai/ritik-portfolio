const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "Web Development", trim: true },
    description: { type: String, default: "", trim: true },
    technologies: { type: [String], default: [] },
    liveUrl: { type: String, default: "", trim: true },
    githubUrl: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "", trim: true },
    images: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    portfolioProject: { type: Boolean, default: false },
    // Kept for backward compatibility with older compiler projects.
    code: { type: String, default: "" },
    language: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});


const Project =
    mongoose.model(
        "Project",
        projectSchema
    );

module.exports = Project;
