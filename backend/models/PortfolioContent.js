const mongoose = require("mongoose");

const portfolioContentSchema = new mongoose.Schema({

    profileImage: {
        type: String,
        default: "/assets/photoweb.png"
    },

    hero: {
        name: {
            type: String,
            default: "Ritik Verma"
        },

        typing: {
            type: String,
            default:
                "B.Tech CSE Student | Future Software Developer"
        },

        roles: {
            type: [String],
            default: [
                "Developer",
                "Problem Solver",
                "Builder",
                "Lifelong Learner"
            ]
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
    },

    resume: {
        summary: { type: String, default: "" },
        email: { type: String, default: "" },
        phone: { type: String, default: "" },
        location: { type: String, default: "" },
        website: { type: String, default: "" },
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        experience: {
            type: [{ role: String, company: String, period: String, description: String }],
            default: []
        },
        education: {
            type: [{ title: String, institute: String, status: String }],
            default: []
        },
        certifications: {
            type: [{ name: String, issuer: String, year: String }],
            default: []
        },
        achievements: { type: [String], default: [] },
        interests: { type: [String], default: [] }
    }

});


const PortfolioContent =
    mongoose.model(
        "PortfolioContent",
        portfolioContentSchema
    );





module.exports = PortfolioContent;
