const express = require("express");
require("dotenv").config();

const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const session = require("express-session");

const bodyParser = require("body-parser");

const app = express();

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

/* =====================================================
   MONGODB
===================================================== */

mongoose.connect(process.env.MONGODB_URI)

    .then(() => {

        console.log("MongoDB Connected");
        seedPortfolioProjects();

    })

    .catch(err => {

        console.error(
            "MongoDB Connection Error:",
            err
        );

    });


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());

app.use(bodyParser.json({ limit: "12mb" }));

app.use(express.json({ limit: "12mb" }));



/* =====================================================
   ADMIN SESSION
===================================================== */
app.set("trust proxy", 1);
app.use(
    session({

        secret:
            process.env.ADMIN_SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {

            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            maxAge:
                1000 * 60 * 60 * 4

        }

    })
);

/* ================= MAIN WEBSITE ================= */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


/* =====================================================
   STATIC WEBSITE
===================================================== */

app.use(
    express.static(
        path.join(__dirname, "public"),
        { index: false }
    )
);


/* =====================================================
   DATABASE MODELS
===================================================== */


/* ================= PROJECT ================= */

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

const portfolioSeedSchema = new mongoose.Schema({ key:{type:String,unique:true} });
const PortfolioSeed = mongoose.model("PortfolioSeed", portfolioSeedSchema);

async function seedPortfolioProjects(){
    try {
        const marker = await PortfolioSeed.findOne({key:"default-portfolio-projects-v1"});
        if (marker) return;
        const defaults = [
            {title:"Personal Portfolio Website",category:"Web Development",description:"A full-stack personal portfolio with responsive pages, project showcase, coding tools, contact functionality, visitor tracking and a professional dark interface.",technologies:["HTML","CSS","JavaScript","Node.js","Express"],liveUrl:"/",featured:true,portfolioProject:true},
            {title:"CampusFind — Lost & Found Portal",category:"College Project",description:"A campus-focused platform where students can report lost or found items, browse listings, communicate with other users and manage their posts through an account-based system.",technologies:["React","Node.js","Express","MongoDB","REST API"],liveUrl:"https://campusfind-q7ol.onrender.com",featured:true,portfolioProject:true},
            {title:"C / C++ Online Compiler",category:"Programming Tool",description:"A browser-based coding environment with a VS Code-inspired editor, line numbers, program input, terminal output and an online run workflow for C and C++ programs.",technologies:["C","C++","JavaScript","Node.js"],liveUrl:"/coding.html",portfolioProject:true},
            {title:"Student Attendance Calculator",category:"Utility",description:"A responsive attendance utility designed to quickly calculate attendance percentage and understand how future attended or missed classes affect the overall percentage.",technologies:["HTML","CSS","JavaScript","Responsive UI"],liveUrl:"/attendance.html",portfolioProject:true}
        ];
        if (await Project.countDocuments({portfolioProject:true}) === 0) await Project.insertMany(defaults);
        await PortfolioSeed.create({key:"default-portfolio-projects-v1"});
        console.log("Portfolio projects initialized");
    } catch(error) { console.error("Portfolio project seed error:", error); }
}

/* ================= GALLERY ================= */

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

/* ================= VISITOR ================= */

// Stores the total unique visitor count.
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

// One record per browser/device visitor. The visitor ID is kept in a
// long-lived cookie so returning visitors are not counted again.
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



/* ================= PORTFOLIO RATING ================= */

// One rating per permanent browser/device visitor.
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

const donationSchema =
    new mongoose.Schema({

        name: String,

        email: String,

        amount: Number,

        date: {

            type: Date,

            default: Date.now

        }

    });


const Donation =
    mongoose.model(
        "Donation",
        donationSchema
    );


    /* ================= WEBSITE SETTINGS ================= */

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
    default: "images/photoweb.jpg"
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
    }

});

const Settings =
    mongoose.model(
        "Settings",
        settingsSchema
    );


    /* =====================================================
   PORTFOLIO WEBSITE BUILDER
===================================================== */

const portfolioContentSchema = new mongoose.Schema({

    profileImage: {
        type: String,
        default: "images/photoweb.jpg"
    },

    hero: {
        name: {
            type: String,
            default: "Ritik Verma"
        },

        typing: {
            type: String,
            default:
                "B.Tech CSE Student | Future Software Developer 🚀"
        },

        tagline: {
            type: String,
            default:
                "Learn. Build. Improve. Repeat."
        }
    },


    education: {
        type: [
            {
                title: String,
                institute: String,
                status: String
            }
        ],

        default: [
            {
                title:
                    "B.Tech Computer Science Engineering",

                institute:
                    "PSIT Kanpur",

                status:
                    "1st Year Student"
            }
        ]
    },


    counters: {

        problemsSolved: {
            type: Number,
            default: 500
        },

        problemsLabel: {
            type: String,
            default: "Problems Solved"
        },

        yearsLabel: {
            type: String,
            default: "Years Coding"
        },

        projectsLabel: {
            type: String,
            default: "Projects Completed"
        },

        hoursLabel: {
            type: String,
            default: "Hours on Website"
        },

        startDate: {
            type: String,
            default: "2024-05-01"
        }
    },


    skills: {
        type: [String],

        default: [
            "C",
            "C++",
            "Data Structures",
            "Problem Solving",
            "Git"
        ]
    },


    progressSkills: {

        type: [
            {
                name: String,
                percentage: Number
            }
        ],

        default: [
            {
                name: "C",
                percentage: 100
            },
            {
                name: "C++",
                percentage: 80
            },
            {
                name: "Data Structures",
                percentage: 75
            }
        ]
    },


    about: {

        title: {
            type: String,
            default: "About Me"
        },

        text: {
            type: String,
            default:
                "I'm a passionate B.Tech Computer Science student who loves building real-world projects and solving problems using C and C++. Currently exploring Data Structures, Algorithms, and Backend Development."
        }
    },


    contact: {

        title: {
            type: String,
            default: "Send Me a Message"
        },

        namePlaceholder: {
            type: String,
            default: "Your Name"
        },

        emailPlaceholder: {
            type: String,
            default: "Your Email"
        },

        messagePlaceholder: {
            type: String,
            default: "Your Message"
        },

        buttonText: {
            type: String,
            default: "Send Message"
        }
    },


    donation: {

        title: {
            type: String,
            default: "Support My Work 💙"
        },

        goal: {
            type: Number,
            default: 10000
        },

        donorNamePlaceholder: {
            type: String,
            default: "Your Name"
        },

        donorEmailPlaceholder: {
            type: String,
            default: "Your Email"
        },

        customAmountPlaceholder: {
            type: String,
            default: "Enter custom amount"
        },

        buttonText: {
            type: String,
            default: "Donate Now"
        },

        leaderboardTitle: {
            type: String,
            default: "🏆 Top Supporters"
        },

        milestoneTitle: {
            type: String,
            default: "🎯 Support Goal"
        }
    },


    thankYou: {

        title: {
            type: String,
            default: "THANK YOU FOR VISITING"
        }
    }

});


const PortfolioContent =
    mongoose.model(
        "PortfolioContent",
        portfolioContentSchema
    );




/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD;


/* ================= GET WEBSITE SETTINGS ================= */

app.get(
    "/admin/api/settings",
    requireAdmin,
    async (req, res) => {

        try {

            let settings =
                await Settings.findOne();

            if (!settings) {

                settings =
                    await Settings.create({});

            }

            res.json({
                success: true,
                settings
            });

        } catch (error) {

            console.error(
                "Settings Load Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load settings."
            });

        }

    }
);



/* ================= SAVE WEBSITE SETTINGS ================= */

app.put(
    "/admin/api/settings",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                siteTitle,
                siteDescription,
                contactEmail,
                instagram,
                github,
                linkedin
            } = req.body;

            let settings =
                await Settings.findOne();

            if (!settings) {

                settings =
                    new Settings();

            }

            settings.siteTitle =
                siteTitle || "";

            settings.siteDescription =
                siteDescription || "";

            settings.contactEmail =
                contactEmail || "";

            settings.instagram =
                instagram || "";

            settings.github =
                github || "";

            settings.linkedin =
                linkedin || "";

            await settings.save();

            res.json({
                success: true,
                message:
                    "Settings saved successfully.",
                settings
            });

        } catch (error) {

            console.error(
                "Settings Save Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to save settings."
            });

        }

    }
);


/* =====================================================
   HOMEPAGE EDITOR + PROFILE IMAGE
===================================================== */

async function getHomepageDocument() {

    let homepage =
        await Homepage.findOne();

    if (!homepage) {

        const fs =
            require("fs");

        const indexPath =
            path.join(
                __dirname,
                "public",
                "index.html"
            );

        const html =
            fs.readFileSync(
                indexPath,
                "utf8"
            );

        homepage =
            await Homepage.create({
                html: html
            });
    }

    return homepage;
}


/* ================= GET HOMEPAGE ================= */

app.get(
    "/admin/api/homepage",
    requireAdmin,
    async (req, res) => {

        try {

            const homepage =
                await getHomepageDocument();

            res.json({
                success: true,
                homepage: homepage
            });

        } catch (error) {

            console.error(
                "Homepage Load Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load homepage."
            });
        }
    }
);


/* ================= SAVE HOMEPAGE ================= */

app.put(
    "/admin/api/homepage",
    requireAdmin,
    async (req, res) => {

        try {

            const html =
                req.body?.html;

            if (
                typeof html !== "string" ||
                !html.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Homepage HTML cannot be empty."
                });
            }

            const homepage =
                await getHomepageDocument();

            homepage.html =
                html;

            homepage.updatedAt =
                new Date();

            await homepage.save();

            res.json({
                success: true,
                message:
                    "Homepage saved successfully."
            });

        } catch (error) {

            console.error(
                "Homepage Save Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to save homepage."
            });
        }
    }
);


/* =====================================================
   PROFILE IMAGE UPLOAD
===================================================== */

app.post(
    "/admin/api/profile-image",
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message:
                        "No image file received."
                });
            }

            if (
                !process.env.CLOUDINARY_CLOUD_NAME ||
                !process.env.CLOUDINARY_API_KEY ||
                !process.env.CLOUDINARY_API_SECRET
            ) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Cloudinary environment variables are missing."
                });
            }

            const result =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "ritik-portfolio/profile",

                                    resource_type:
                                        "image",

                                    public_id:
                                        "profile",

                                    overwrite:
                                        true,

                                    invalidate:
                                        true
                                },

                                (error, uploaded) => {

                                    if (error) {

                                        reject(error);

                                    } else {

                                        resolve(
                                            uploaded
                                        );
                                    }
                                }
                            );

                        stream.end(
                            req.file.buffer
                        );
                    }
                );

            const imageUrl =
                result.secure_url;


            /* SAVE IMAGE URL */

            let settings =
                await Settings.findOne();

            if (!settings) {

                settings =
                    new Settings();

            }

            settings.profileImage =
                imageUrl;

            await settings.save();

            
            /* UPDATE PORTFOLIO CONTENT */

let content =
    await PortfolioContent.findOne();

if (!content) {

    content =
        new PortfolioContent();

}

content.profileImage =
    imageUrl;

await content.save();
           


            res.json({

                success: true,

                message:
                    "Profile picture updated successfully.",

                imageUrl:
                    imageUrl

            });

        } catch (error) {

            console.error(
                "Profile Image Upload Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Profile picture upload failed."

            });
        }
    }
);



/* =====================================================
   DELETE PROFILE IMAGE
===================================================== */

app.delete(
    "/admin/api/profile-image",
    requireAdmin,
    async (req, res) => {

        try {

            /* DELETE FROM CLOUDINARY */

            await cloudinary.uploader.destroy(
                "ritik-portfolio/profile/profile",
                {
                    resource_type: "image",
                    invalidate: true
                }
            );


            /* RESET SETTINGS */

            let settings =
                await Settings.findOne();

            if (!settings) {

                settings =
                    new Settings();

            }

            settings.profileImage =
                "/images/photoweb.jpg";

            await settings.save();


            /* RESET PORTFOLIO CONTENT */

            let content =
                await PortfolioContent.findOne();

            if (!content) {

                content =
                    new PortfolioContent();

            }

            content.profileImage =
                "/images/photoweb.jpg";

            await content.save();


            res.json({

                success: true,

                message:
                    "Profile picture deleted successfully."

            });


        } catch (error) {

            console.error(
                "Profile Image Delete Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to delete profile picture."

            });

        }

    }
);



/* ================= ADMIN PAGE ================= */

app.get("/admin", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "admin",
            "admin.html"
        )
    );

});


/* ================= LOGIN ================= */

app.post(
    "/admin/login",
    (req, res) => {

        const { password } =
            req.body;

        if (!password) {

            return res.status(400).json({

                success: false,

                message:
                    "Password is required."

            });

        }


        if (
            password !==
            ADMIN_PASSWORD
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Incorrect password."

            });

        }


        req.session.isAdmin = true;

req.session.save((err) => {

    if (err) {
        console.error("Session save error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to create login session."
        });
    }

        res.json({
        success: true
    });

});
});


/* ================= SESSION CHECK ================= */

app.get(
    "/admin/status",
    (req, res) => {

        res.json({

            loggedIn:
                req.session &&
                req.session.isAdmin === true

        });

    }
);


/* ================= LOGOUT ================= */

app.post(
    "/admin/logout",
    (req, res) => {

        req.session.destroy(
            err => {

                if (err) {

                    return res.status(500)
                        .json({

                            success: false

                        });

                }


                res.json({

                    success: true

                });

            }
        );

    }
);


/* ================= ADMIN MIDDLEWARE ================= */

function requireAdmin(
    req,
    res,
    next
) {

    if (
        req.session &&
        req.session.isAdmin === true
    ) {

        return next();

    }


    return res.status(401).json({

        success: false,

        message:
            "Unauthorized."

    });

}

/* =====================================================
   WEBSITE BUILDER API
===================================================== */

async function getPortfolioContent() {

    let content =
        await PortfolioContent.findOne();

    if (!content) {

        content =
            await PortfolioContent.create({});

    }

    return content;
}


/* ================= GET WEBSITE CONTENT ================= */

app.get(
    "/admin/api/portfolio-content",
    requireAdmin,
    async (req, res) => {

        try {

            const content =
                await getPortfolioContent();

            res.json({
                success: true,
                content: content
            });

        } catch (error) {

            console.error(
                "Portfolio Content Load Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load website content."
            });

        }

    }
);


/* ================= SAVE WEBSITE CONTENT ================= */

app.put(
    "/admin/api/portfolio-content",
    requireAdmin,
    async (req, res) => {

        try {

            const data =
                req.body || {};

            let content =
                await PortfolioContent.findOne();

            if (!content) {

                content =
                    new PortfolioContent();

            }


            if (data.hero) {

                content.hero =
                    data.hero;

            }


            if (
                Array.isArray(
                    data.education
                )
            ) {

                content.education =
                    data.education;

            }


            if (data.counters) {

                content.counters =
                    data.counters;

            }


            if (
                Array.isArray(
                    data.skills
                )
            ) {

                content.skills =
                    data.skills;

            }


            if (
                Array.isArray(
                    data.progressSkills
                )
            ) {

                content.progressSkills =
                    data.progressSkills;

            }


            if (data.about) {

                content.about =
                    data.about;

            }


            if (data.contact) {

                content.contact =
                    data.contact;

            }


            if (data.donation) {

                content.donation =
                    data.donation;

            }


            if (data.thankYou) {

                content.thankYou =
                    data.thankYou;

            }


            await content.save();


            res.json({

                success: true,

                message:
                    "Website updated successfully."

            });

        } catch (error) {

            console.error(
                "Portfolio Content Save Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to save website content."

            });

        }

    }
);


/* ================= PUBLIC WEBSITE CONTENT ================= */

app.get(
    "/api/portfolio-content",
    async (req, res) => {

        try {

            const content =
                await getPortfolioContent();

            res.json({

                success: true,

                content: content

            });

        } catch (error) {

            console.error(
                "Public Portfolio Content Error:",
                error
            );

            res.status(500).json({

                success: false

            });

        }

    }
);


/* ================= PUBLIC GALLERY ================= */

app.get("/api/gallery", async (req, res) => {

    try {

        const images = await Gallery.find({
            visible: true
        })
        .sort({
            order: 1,
            createdAt: -1
        });

        res.json({
            success: true,
            images: images
        });

    } catch (error) {

        console.error(
            "Gallery Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load gallery."
        });

    }

});



/* ================= ADMIN GALLERY LIST ================= */

app.get(
    "/admin/api/gallery",
    requireAdmin,
    async (req, res) => {

        try {

            const images = await Gallery.find()
                .sort({
                    order: 1,
                    createdAt: -1
                });

            res.json({
                success: true,
                images: images
            });

        } catch (error) {

            console.error(
                "Admin Gallery Error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to load gallery."
            });

        }

    }
);

/* ================= ADMIN GALLERY UPLOAD ================= */

app.post(
    "/admin/api/gallery",
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            console.log("========== GALLERY UPLOAD ==========");

            console.log("File received:",
                req.file ? req.file.originalname : "NO FILE"
            );

            console.log("Title:",
                req.body.title
            );


            if (!req.file) {

                return res.status(400).json({
                    success: false,
                    message: "No image file received."
                });

            }


            const title =
                req.body.title?.trim();

            const description =
                req.body.description?.trim() || "";


            if (!title) {

                return res.status(400).json({
                    success: false,
                    message: "Image title is required."
                });

            }


            if (
                !process.env.CLOUDINARY_CLOUD_NAME ||
                !process.env.CLOUDINARY_API_KEY ||
                !process.env.CLOUDINARY_API_SECRET
            ) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Cloudinary environment variables are missing."
                });

            }


            const result =
                await new Promise(
                    (resolve, reject) => {

                        const stream =
                            cloudinary.uploader.upload_stream(
                                {
                                    folder:
                                        "ritik-portfolio/gallery",

                                    resource_type:
                                        "image"
                                },

                                (error, result) => {

                                    if (error) {

                                        console.error(
                                            "CLOUDINARY ERROR:",
                                            error
                                        );

                                        reject(error);

                                    } else {

                                        resolve(result);

                                    }

                                }
                            );


                        stream.end(
                            req.file.buffer
                        );

                    }
                );


            console.log(
                "Cloudinary URL:",
                result.secure_url
            );


            const galleryImage =
                await Gallery.create({

                    title: title,

                    description: description,

                    imageUrl:
                        result.secure_url,

                    publicId:
                        result.public_id,

                    visible: true,

                    order: 0

                });


            console.log(
                "MongoDB gallery saved:",
                galleryImage._id
            );


            res.json({

                success: true,

                message:
                    "Image uploaded successfully.",

                image:
                    galleryImage

            });


        } catch (error) {

            console.error(
                "========== GALLERY UPLOAD ERROR =========="
            );

            console.error(error);


            res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Image upload failed."

            });

        }

    }
);


/* ================= GET SINGLE GALLERY IMAGE ================= */

app.get(
    "/admin/api/gallery/:id",
    requireAdmin,
    async (req, res) => {
        try {
            const image =
                await Gallery.findById(
                    req.params.id
                );

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found."
                });
            }

            res.json({
                success: true,
                image
            });

        } catch (error) {
            console.error(
                "Gallery Image Error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Failed to load image."
            });
        }
    }
);


/* ================= UPDATE GALLERY ================= */

app.put(
    "/admin/api/gallery/:id",
    requireAdmin,
    async (req, res) => {
        try {
            const title =
                req.body.title?.trim();

            const description =
                req.body.description?.trim() || "";

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: "Image title is required."
                });
            }

            const image =
                await Gallery.findByIdAndUpdate(
                    req.params.id,
                    {
                        title,
                        description
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found."
                });
            }

            res.json({
                success: true,
                message:
                    "Gallery image updated successfully.",
                image
            });

        } catch (error) {
            console.error(
                "Gallery Update Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update gallery image."
            });
        }
    }
);


/* ================= DOWNLOAD GALLERY IMAGE ================= */

app.get(
    "/admin/api/gallery/:id/download",
    requireAdmin,
    async (req, res) => {
        try {
            const image =
                await Gallery.findById(
                    req.params.id
                );

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found."
                });
            }

            const downloadUrl =
                cloudinary.url(
                    image.publicId,
                    {
                        secure: true,
                        resource_type: "image",
                        flags: "attachment"
                    }
                );

            res.redirect(downloadUrl);

        } catch (error) {
            console.error(
                "Gallery Download Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to download image."
            });
        }
    }
);


/* ================= DELETE GALLERY IMAGE ================= */

app.delete(
    "/admin/api/gallery/:id",
    requireAdmin,
    async (req, res) => {
        try {
            const image =
                await Gallery.findById(
                    req.params.id
                );

            if (!image) {
                return res.status(404).json({
                    success: false,
                    message: "Image not found."
                });
            }

            if (image.publicId) {
                await cloudinary.uploader.destroy(
                    image.publicId,
                    {
                        resource_type: "image",
                        invalidate: true
                    }
                );
            }

            await Gallery.findByIdAndDelete(
                req.params.id
            );

            res.json({
                success: true,
                message:
                    "Image deleted successfully."
            });

        } catch (error) {
            console.error(
                "Gallery Delete Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete image."
            });
        }
    }
);

/* ================= CONTACT MESSAGE ================= */

app.post("/api/messages", async (req, res) => {
    try {
        const {
            name,
            email,
            message
        } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        const newMessage = await Message.create({
            name: name.trim(),
            email: email.trim(),
            message: message.trim()
        });

        res.json({
            success: true,
            message: "Message saved successfully.",
            data: newMessage
        });

    } catch (error) {
        console.error(
            "Save Message Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to save message."
        });
    }
});




/* =====================================================
   ADMIN PROJECT MANAGEMENT
===================================================== */


/* ================= GET ALL PROJECT DETAILS ================= */

app.get(
    "/admin/projects",
    requireAdmin,
    async (req, res) => {

        try {

            const projects = await Project.find({ portfolioProject: true }).sort({ featured:-1, createdAt:-1 });

            res.json({
                success: true,
                projects
            });

        } catch (error) {

            console.error(
                "Admin Get Projects Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load projects"
            });

        }

    }
);


/* ================= GET SINGLE PROJECT ================= */

app.get(
    "/admin/projects/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const project =
                await Project.findOne({
                    _id: req.params.id,
                    portfolioProject: true
                });

            if (!project) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Project not found"
                });

            }

            res.json({
                success: true,
                project
            });

        } catch (error) {

            console.error(
                "Admin Get Project Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load project"
            });

        }

    }
);


/* ================= PROJECT IMAGE UPLOAD ================= */

app.post("/admin/projects/upload-images", requireAdmin, upload.array("images", 5), async (req, res) => {
    try {
        const files = req.files || [];
        if (!files.length) return res.status(400).json({ success:false, message:"Please select at least one image." });
        if (files.length > 5) return res.status(400).json({ success:false, message:"You can upload a maximum of 5 images." });

        const urls = await Promise.all(files.map(file => new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "ritik-portfolio/projects", resource_type: "image" },
                (error, result) => error ? reject(error) : resolve(result.secure_url)
            );
            stream.end(file.buffer);
        })));

        res.json({ success:true, images: urls });
    } catch (error) {
        console.error("Project Image Upload Error:", error);
        res.status(500).json({ success:false, message:"Project image upload failed. Please try again." });
    }
});

/* ================= ADD / UPDATE / DELETE PORTFOLIO PROJECTS ================= */

function normalizeProjectPayload(body) {
    const technologies = Array.isArray(body.technologies)
        ? body.technologies.map(v => String(v).trim()).filter(Boolean)
        : String(body.technologies || "").split(",").map(v => v.trim()).filter(Boolean);
    return {
        title: String(body.title || "").trim(),
        category: String(body.category || "Web Development").trim(),
        description: String(body.description || "").trim(),
        technologies,
        liveUrl: String(body.liveUrl || "").trim(),
        githubUrl: String(body.githubUrl || "").trim(),
        imageUrl: String(body.imageUrl || "").trim(),
        images: Array.isArray(body.images) ? body.images.map(v => String(v).trim()).filter(Boolean).slice(0, 5) : [],
        featured: Boolean(body.featured),
        portfolioProject: true,
        updatedAt: new Date()
    };
}

app.post("/admin/projects", requireAdmin, async (req, res) => {
    try {
        const payload = normalizeProjectPayload(req.body);
        if (!payload.title || !payload.description) {
            return res.status(400).json({ success:false, message:"Project title and description are required." });
        }
        const project = await Project.create(payload);
        res.json({ success:true, message:"Project added successfully.", project });
    } catch (error) {
        console.error("Admin Add Project Error:", error);
        res.status(500).json({ success:false, message:"Failed to add project." });
    }
});

app.put("/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
        const payload = normalizeProjectPayload(req.body);
        if (!payload.title || !payload.description) {
            return res.status(400).json({ success:false, message:"Project title and description are required." });
        }
        const project = await Project.findByIdAndUpdate(req.params.id, payload, { new:true, runValidators:true });
        if (!project) return res.status(404).json({ success:false, message:"Project not found." });
        res.json({ success:true, message:"Project updated successfully.", project });
    } catch (error) {
        console.error("Admin Update Project Error:", error);
        res.status(500).json({ success:false, message:"Failed to update project." });
    }
});

app.delete("/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ success:false, message:"Project not found." });
        res.json({ success:true, message:"Project deleted successfully." });
    } catch (error) {
        console.error("Admin Delete Project Error:", error);
        res.status(500).json({ success:false, message:"Failed to delete project." });
    }
});

/* =====================================================
   SAVE PROJECT
===================================================== */

app.post(
    "/save",
    async (req, res) => {

        try {

            const {
                title,
                code,
                language
            } = req.body;


            if (
                !title ||
                !code ||
                !language
            ) {

                return res.status(400)
                    .json({

                        message:
                            "Project details required"

                    });

            }


            const project =
                await Project.create({
                    title,
                    code,
                    language,
                    portfolioProject: false
                });


            res.json({

                message:
                    "Project Saved Successfully",

                project

            });

        }

        catch (error) {

            console.error(
                "Save Project Error:",
                error
            );


            res.status(500)
                .json({

                    message:
                        "Failed to save project"

                });

        }

    }
);


/* =====================================================
   GET PROJECTS
===================================================== */

app.get(
    "/projects",
    async (req, res) => {

        try {

            const projects = await Project.find({ portfolioProject: true }).select("title category description technologies liveUrl githubUrl imageUrl images featured createdAt").sort({ featured:-1, createdAt:-1 });


            res.json(projects);

        }

        catch (error) {

            console.error(
                "Get Projects Error:",
                error
            );


            res.status(500)
                .json({

                    message:
                        "Failed to load projects"

                });

        }

    }
);


/* =====================================================
   DOWNLOAD PROJECT
===================================================== */

app.get(
    "/download/:title/:lang",
    async (req, res) => {

        try {

            const {
                title,
                lang
            } = req.params;


            const project =
                await Project.findOne({

                    title: title,

                    language: lang

                });


            if (!project) {

                return res
                    .status(404)
                    .send(
                        "Project not found"
                    );

            }


            const extension =
                lang === "cpp"
                    ? "cpp"
                    : "c";


            const fileName =
                `${project.title}.${extension}`;


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${fileName}"`
            );


            res.setHeader(
                "Content-Type",
                "text/plain"
            );


            res.send(
                project.code
            );

        }

        catch (error) {

            console.error(
                "Download Project Error:",
                error
            );


            res.status(500)
                .send(
                    "Failed to download project"
                );

        }

    }
);


/* =====================================================
   DELETE PROJECT
===================================================== */

app.delete(
    "/delete/:title/:lang",
    async (req, res) => {

        try {

            const {
                title,
                lang
            } = req.params;


            const {
                password
            } = req.body;


            if (
                !password ||
                password !==
                ADMIN_PASSWORD
            ) {

                return res
                    .status(403)
                    .json({

                        message:
                            "Wrong Password"

                    });

            }


            const project =
                await Project
                    .findOneAndDelete({

                        title: title,

                        language: lang

                    });


            if (!project) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Project not found"

                    });

            }


            res.json({

                message:
                    "Project Deleted Successfully"

            });

        }

        catch (error) {

            console.error(
                "Delete Project Error:",
                error
            );


            res.status(500)
                .json({

                    message:
                        "Failed to delete project"

                });

        }

    }
);



/* =====================================================
   PORTFOLIO RATING
===================================================== */

function getPortfolioVisitorId(req) {

    const cookieHeader = req.headers.cookie || "";

    const visitorCookie = cookieHeader
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie =>
            cookie.startsWith("portfolioVisitorId=")
        );

    if (!visitorCookie) {
        return null;
    }

    try {
        return decodeURIComponent(
            visitorCookie
                .split("=")
                .slice(1)
                .join("=")
        );
    }
    catch {
        return null;
    }
}


// Public rating summary.
app.get(
    "/api/portfolio-rating",
    async (req, res) => {

        try {

            const visitorId =
                getPortfolioVisitorId(req);

            const count =
                await PortfolioRating.countDocuments();

            const averageResult =
                await PortfolioRating.aggregate([
                    {
                        $group: {
                            _id: null,
                            average: {
                                $avg: "$rating"
                            }
                        }
                    }
                ]);

            const average =
                averageResult.length
                    ? Number(
                        averageResult[0]
                            .average
                    .toFixed(1)
                    )
                    : 0;

            let hasRated = false;

            if (visitorId) {
                hasRated =
                    !!(
                        await PortfolioRating
                            .exists({
                                visitorId
                            })
                    );
            }

            res.json({
                success: true,
                average,
                count,
                hasRated
            });

        }
        catch (error) {

            console.error(
                "Portfolio Rating Summary Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to load rating"
            });

        }

    }
);


// Submit one rating per permanent visitor.
app.post(
    "/api/portfolio-rating",
    async (req, res) => {

        try {

            const visitorId =
                getPortfolioVisitorId(req);

            if (!visitorId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please visit the website first."
                });

            }

            const rating =
                Number(req.body?.rating);

            const feedback =
                String(
                    req.body?.feedback || ""
                ).trim().slice(0, 500);

            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Please select a rating from 1 to 5."
                });

            }

            const existing =
                await PortfolioRating
                    .findOne({
                        visitorId
                    });

            if (existing) {

                return res.status(409).json({
                    success: false,
                    alreadyRated: true,
                    message:
                        "You have already rated this portfolio."
                });

            }

            await PortfolioRating.create({
                visitorId,
                rating,
                feedback
            });

            const summary =
                await PortfolioRating.aggregate([
                    {
                        $group: {
                            _id: null,
                            average: {
                                $avg: "$rating"
                            },
                            count: {
                                $sum: 1
                            }
                        }
                    }
                ]);

            const result =
                summary[0] || {
                    average: 0,
                    count: 0
                };

            res.json({
                success: true,
                average: Number(
                    result.average
                .toFixed(1)
                ),
                count: result.count
            });

        }
        catch (error) {

            // Unique index is the final protection against
            // two simultaneous submissions from the same visitor.
            if (error.code === 11000) {

                return res.status(409).json({
                    success: false,
                    alreadyRated: true,
                    message:
                        "You have already rated this portfolio."
                });

            }

            console.error(
                "Portfolio Rating Submit Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to save your rating."
            });

        }

    }
);


/* =====================================================
   UNIQUE VISITOR COUNT
===================================================== */

app.get(
    "/visitor-count",
    async (req, res) => {

        try {

            // Keep the browser visitor ID for 10 years. Refreshing or
            // returning years later will not increase the visitor count.
            const cookieHeader = req.headers.cookie || "";
            const visitorCookie = cookieHeader
                .split(";")
                .map(cookie => cookie.trim())
                .find(cookie => cookie.startsWith("portfolioVisitorId="));

            let visitorId = visitorCookie
                ? decodeURIComponent(
                    visitorCookie.split("=").slice(1).join("=")
                )
                : null;

            let isNewVisitor = false;

            if (!visitorId) {
                visitorId = crypto.randomUUID();
                isNewVisitor = true;
            }

            // MongoDB provides a second guard: one visitor ID can only be
            // inserted once, so it can only contribute one to the count.
            if (isNewVisitor) {

                try {
                    await VisitorIdentity.create({
                        _id: visitorId
                    });
                }
                catch (identityError) {

                    if (identityError.code === 11000) {
                        isNewVisitor = false;
                    }
                    else {
                        throw identityError;
                    }

                }

            }

            if (isNewVisitor) {

                await Visitor.findOneAndUpdate(
                    {
                        _id: "main"
                    },
                    {
                        $inc: {
                            count: 1
                        }
                    },
                    {
                        upsert: true,
                        new: true
                    }
                );

            }

            const visitor =
                await Visitor.findOne({
                    _id: "main"
                });

            // 10 years in seconds. This survives normal returns for years.
            const cookie =
                `portfolioVisitorId=${encodeURIComponent(visitorId)}; Max-Age=315360000; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

            res.setHeader("Set-Cookie", cookie);

            res.json({
                count: visitor
                    ? visitor.count
                    : 0
            });

        }

        catch (error) {

            console.error(
                "Visitor Count Error:",
                error
            );

            res.status(500)
                .json({
                    count: 0
                });

        }

    }
);


/* =====================================================
   ADMIN VISITOR STATISTICS
===================================================== */

app.get(
    "/admin/visitor-stats",
    requireAdmin,
    async (req, res) => {

        try {

            const visitor =
                await Visitor.findOne({
                    _id: "main"
                });


            res.json({

                count:
                    visitor
                        ? visitor.count
                        : 0

            });

        }

        catch (error) {

            console.error(
                "Admin Visitor Error:",
                error
            );


            res.status(500)
                .json({

                    count: 0

                });

        }

    }
);


/* =====================================================
   UPDATE VISITOR COUNT
===================================================== */

app.put(
    "/admin/visitor-count",
    requireAdmin,
    async (req, res) => {

        try {

            const count =
                Number(req.body.count);

            if (
                !Number.isInteger(count) ||
                count < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Visitor count must be a valid number greater than or equal to 0."

                });

            }


            const visitor =
                await Visitor.findOneAndUpdate(

                    {
                        _id: "main"
                    },

                    {
                        $set: {
                            count: count
                        }
                    },

                    {
    returnDocument: "after",
    upsert: true
}

                );


            res.json({

                success: true,

                count:
                    visitor.count,

                message:
                    "Visitor count updated successfully."

            });


        } catch (error) {

            console.error(
                "Update Visitor Count Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to update visitor count."

            });

        }

    }
);

/* =====================================================
   RAZORPAY
===================================================== */

const razorpay =
    new Razorpay({

        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_SECRET

    });


/* =====================================================
   CREATE ORDER
===================================================== */

app.post(
    "/create-order",
    async (req, res) => {

        const {
            amount
        } = req.body;


        try {

            const order =
                await razorpay.orders.create({

                    amount:
                        amount * 100,

                    currency:
                        "INR",

                    receipt:
                        "receipt_" +
                        Date.now()

                });


            res.json(order);

        }

        catch (err) {

            console.error(
                "Order Error:",
                err
            );


            res.status(500)
                .json({

                    error:
                        "Order creation failed"

                });

        }

    }
);


/* =====================================================
   VERIFY PAYMENT
===================================================== */

app.post(
    "/verify-payment",
    async (req, res) => {

        const {

            razorpay_order_id,

            razorpay_payment_id,

            razorpay_signature,

            amount,

            name,

            email

        } = req.body;


        try {

            const body =
                razorpay_order_id +
                "|" +
                razorpay_payment_id;


            const expectedSignature =
                crypto

                    .createHmac(
                        "sha256",
                        process.env
                            .RAZORPAY_SECRET
                    )

                    .update(body)

                    .digest("hex");


            if (
                expectedSignature !==
                razorpay_signature
            ) {

                return res
                    .status(400)
                    .json({

                        success: false

                    });

            }


            const realAmount =
                amount / 100;


            await Donation.create({

                name,

                email,

                amount:
                    realAmount,

                date:
                    new Date()

            });


            res.json({

                success: true

            });

        }

        catch (error) {

            console.error(
                "Payment Verification Error:",
                error
            );


            res.status(500)
                .json({

                    success: false

                });

        }

    }
);


/* =====================================================
   ADMIN MESSAGES
===================================================== */

app.get(
    "/admin/api/messages",
    requireAdmin,
    async (req, res) => {

        try {

            const messages =
                await Message.find()
                    .sort({
                        createdAt: -1
                    });

            res.json({
                success: true,
                messages
            });

        } catch (error) {

            console.error(
                "Admin Messages Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load messages."
            });

        }

    }
);


/* ================= MARK MESSAGE READ / UNREAD ================= */

app.put(
    "/admin/api/messages/:id/read", 
    requireAdmin,
    async (req, res) => {

        try {

            const message =
                await Message.findById(
                    req.params.id
                );

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: "Message not found."
                });
            }

            message.read = !message.read;

            await message.save();

            res.json({
                success: true,
                message:
                    message.read
                        ? "Message marked as read."
                        : "Message marked as unread.",
                data: message
            });

        } catch (error) {

            console.error(
                "Toggle Message Read Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update message."
            });

        }

    }
);


/* ================= DELETE MESSAGE ================= */

app.delete(
    "/admin/api/messages/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const message =
                await Message.findByIdAndDelete(
                    req.params.id
                );

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: "Message not found."
                });
            }

            res.json({
                success: true,
                message: "Message deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete Message Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete message."
            });
        }
    }
);

/* =====================================================
   ADMIN DONATIONS
===================================================== */

app.get(
    "/admin/api/donations",
    requireAdmin,
    async (req, res) => {

        try {

            const donations =
                await Donation.find()
                    .sort({
                        date: -1
                    });

            res.json({
                success: true,
                donations
            });

        } catch (error) {

            console.error(
                "Admin Donations Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to load donations."
            });

        }

    }
);

app.delete(
    "/admin/api/donations/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const donation =
                await Donation.findByIdAndDelete(
                    req.params.id
                );

            if (!donation) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Donation not found."
                });

            }

            res.json({
                success: true,
                message:
                    "Donation deleted successfully."
            });

        } catch (error) {

            console.error(
                "Delete Donation Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete donation."
            });

        }

    }
);

app.put(
    "/admin/api/donations/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                name,
                email,
                amount
            } = req.body;

            if (!name || !email || !amount) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email and amount are required."
                });

            }

            const donation =
                await Donation.findByIdAndUpdate(
                    req.params.id,
                    {
                        name: name.trim(),
                        email: email.trim(),
                        amount: Number(amount)
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!donation) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Donation not found."
                });

            }

            res.json({
                success: true,
                message:
                    "Donation updated successfully.",
                donation
            });

        } catch (error) {

            console.error(
                "Edit Donation Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update donation."
            });

        }

    }
);


/* =====================================================
   ADD DONATION
===================================================== */

app.post(
    "/admin/api/donations",
    requireAdmin,
    async (req, res) => {

        try {

            const {
                name,
                email,
                amount
            } = req.body;

            if (
                !name ||
                !email ||
                !amount
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Name, email and amount are required."
                });

            }

            const donation =
                await Donation.create({
                    name: name.trim(),
                    email: email.trim(),
                    amount: Number(amount),
                    date: new Date()
                });

            res.status(201).json({
                success: true,
                message:
                    "Donation added successfully.",
                donation
            });

        } catch (error) {

            console.error(
                "Add Donation Error:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to add donation."
            });

        }

    }
);

/* ================= MESSAGE ================= */

const messageSchema =
    new mongoose.Schema({
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            trim: true
        },

        message: {
            type: String,
            required: true,
            trim: true
        },

        read: {
            type: Boolean,
            default: false
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    });

const Message =
    mongoose.model(
        "Message",
        messageSchema
    );


/* =====================================================
   DONATION STATS
===================================================== */

app.get(
    "/donation-stats",
    async (req, res) => {

        try {

            const donations =
                await Donation.find()
                    .sort({
                        date: -1
                    });


            const totalAmount =
                donations.reduce(

                    (total, donation) =>
                        total +
                        donation.amount,

                    0

                );


            const totalDonors =
                donations.length;


            res.json({

                totalAmount,

                totalDonors,

                donations

            });

        }

        catch (error) {

            console.error(
                "Donation Stats Error:",
                error
            );


            res.status(500)
                .json({

                    totalAmount: 0,

                    totalDonors: 0,

                    donations: []

                });

        }

    }
);


/* =====================================================
   START SERVER
===================================================== */

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);