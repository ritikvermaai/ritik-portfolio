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

app.use(bodyParser.json());

app.use(express.json());



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

const projectSchema =
    new mongoose.Schema({

        title: String,

        code: String,

        language: String,

        createdAt: {

            type: Date,

            default: Date.now

        }

    });


const Project =
    mongoose.model(
        "Project",
        projectSchema
    );

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

            const projects =
                await Project.find()
                    .sort({
                        createdAt: -1
                    });

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
                await Project.findById(
                    req.params.id
                );

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


/* ================= ADD PROJECT ================= */

app.post(
    "/admin/projects",
    requireAdmin,
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

                return res.status(400).json({
                    success: false,
                    message:
                        "Title, code and language are required."
                });

            }


            if (
                language !== "c" &&
                language !== "cpp"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Language must be c or cpp."
                });

            }


            const project =
                await Project.create({

                    title:
                        title.trim(),

                    code,

                    language

                });


            res.json({

                success: true,

                message:
                    "Project added successfully.",

                project

            });

        } catch (error) {

            console.error(
                "Admin Add Project Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to add project."

            });

        }

    }
);


/* ================= UPDATE PROJECT ================= */

app.put(
    "/admin/projects/:id",
    requireAdmin,
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

                return res.status(400).json({

                    success: false,

                    message:
                        "Title, code and language are required."

                });

            }


            if (
                language !== "c" &&
                language !== "cpp"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Language must be c or cpp."

                });

            }


            const project =
                await Project.findByIdAndUpdate(

                    req.params.id,

                    {

                        title:
                            title.trim(),

                        code,

                        language

                    },

                    {

                        new: true,

                        runValidators: true

                    }

                );


            if (!project) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Project not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Project updated successfully.",

                project

            });

        } catch (error) {

            console.error(
                "Admin Update Project Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to update project."

            });

        }

    }
);


/* ================= DELETE PROJECT ================= */

app.delete(
    "/admin/projects/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const project =
                await Project.findByIdAndDelete(
                    req.params.id
                );


            if (!project) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Project not found."

                });

            }


            res.json({

                success: true,

                message:
                    "Project deleted successfully."

            });

        } catch (error) {

            console.error(
                "Admin Delete Project Error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete project."

            });

        }

    }
);

/* =====================================================
   RUN C/C++ CODE
===================================================== */

const {
    spawn
} = require("child_process");


app.post(
    "/run",
    (req, res) => {

        const {
            code,
            language,
            input
        } = req.body;


        const extension =
            language === "cpp"
                ? "cpp"
                : "c";


        const compiler =
            language === "cpp"
                ? "g++"
                : "gcc";


        const sourceFile =
            `program.${extension}`;


        const outputFile =
            process.platform === "win32"
                ? "program.exe"
                : "./program";


        const compile =
            spawn(
                compiler,
                [
                    sourceFile,
                    "-o",
                    "program"
                ]
            );


        const fs =
            require("fs");


        fs.writeFileSync(
            sourceFile,
            code
        );


        let compileOutput = "";


        compile.stderr.on(
            "data",
            data => {

                compileOutput +=
                    data.toString();

            }
        );


        compile.on(
            "close",
            compileCode => {

                if (compileCode !== 0) {

                    return res.json({

                        output:
                            compileOutput ||
                            "Compilation Error"

                    });

                }


                const run =
                    process.platform === "win32"

                        ? spawn(
                            outputFile
                        )

                        : spawn(
                            outputFile
                        );


                if (input) {

                    run.stdin.write(
                        input
                    );

                }


                run.stdin.end();


                let outputData = "";


                run.stdout.on(
                    "data",
                    data => {

                        outputData +=
                            data.toString();

                    }
                );


                run.stderr.on(
                    "data",
                    data => {

                        outputData +=
                            data.toString();

                    }
                );


                run.on(
                    "close",
                    () => {

                        res.json({

                            output:
                                outputData

                        });

                    }
                );

            }
        );

    }
);


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

                    language

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

            const projects =
                await Project.find()

                    .select(
                        "title language createdAt"
                    )

                    .sort({
                        createdAt: -1
                    });


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