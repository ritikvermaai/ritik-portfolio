const express = require("express");
require("dotenv").config();
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("crypto");
const fs = require("fs");
const { execFile } = require("child_process");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Connection Error:", err));


app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));

const projectSchema = new mongoose.Schema({
    title: String,
    code: String,
    language: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Project = mongoose.model("Project", projectSchema);


const visitorSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "main"
    },
    count: {
        type: Number,
        default: 0
    }
});

const Visitor = mongoose.model("Visitor", visitorSchema);


const donationSchema = new mongoose.Schema({
    name: String,
    email: String,
    amount: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

const Donation = mongoose.model("Donation", donationSchema);



// ================= RUN CODE =================
const { spawn } = require("child_process");

app.post("/run", (req, res) => {
    const { code, language, input } = req.body;

    const fs = require("fs");

    fs.writeFileSync("program.c", code);

    const compile = spawn("gcc", ["program.c", "-o", "program"]);

    compile.on("close", (compileCode) => {
        if (compileCode !== 0) {
            return res.json({ output: "Compilation Error" });
        }

        const run = spawn("./program");

        if (input) {
            run.stdin.write(input);
        }

        run.stdin.end();

        let outputData = "";

        run.stdout.on("data", (data) => {
            outputData += data.toString();
        });

        run.stderr.on("data", (data) => {
            outputData += data.toString();
        });

        run.on("close", () => {
            res.json({ output: outputData });
        });
    });
});

// ================= SAVE PROJECT =================
app.post("/save", async (req, res) => {
    try {
        const { title, code, language } = req.body;

        if (!title || !code || !language) {
            return res.status(400).json({
                message: "Project details required"
            });
        }

        const project = await Project.create({
            title,
            code,
            language
        });

        res.json({
            message: "Project Saved Successfully",
            project
        });

    } catch (error) {
        console.error("Save Project Error:", error);

        res.status(500).json({
            message: "Failed to save project"
        });
    }
});


// ================= GET PROJECTS =================
app.get("/projects", async (req, res) => {
    try {
        const projects = await Project.find()
            .select("title language createdAt")
            .sort({ createdAt: -1 });

        res.json(projects);

    } catch (error) {
        console.error("Get Projects Error:", error);

        res.status(500).json({
            message: "Failed to load projects"
        });
    }
});

// ================= DOWNLOAD PROJECT =================
app.get("/download/:title/:lang", async (req, res) => {
    try {
        const { title, lang } = req.params;

        const project = await Project.findOne({
            title: title,
            language: lang
        });

        if (!project) {
            return res.status(404).send("Project not found");
        }

        const extension = lang === "cpp" ? "cpp" : "c";
        const fileName = `${project.title}.${extension}`;

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.setHeader(
            "Content-Type",
            "text/plain"
        );

        res.send(project.code);

    } catch (error) {
        console.error("Download Project Error:", error);

        res.status(500).send("Failed to download project");
    }
});


// ================= DELETE PROJECT =================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

app.delete("/delete/:title/:lang", async (req, res) => {
    try {
        const { title, lang } = req.params;
        const { password } = req.body;

        // Check admin password
        if (!password || password !== ADMIN_PASSWORD) {
            return res.status(403).json({
                message: "Wrong Password"
            });
        }

        // Find and delete project from MongoDB
        const project = await Project.findOneAndDelete({
            title: title,
            language: lang
        });

        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }

        res.json({
            message: "Project Deleted Successfully"
        });

    } catch (error) {
        console.error("Delete Project Error:", error);

        res.status(500).json({
            message: "Failed to delete project"
        });
    }
});

// ================= VISITOR COUNT =================
app.get("/visitor-count", async (req, res) => {
    try {
        const visitor = await Visitor.findOneAndUpdate(
    { _id: "main" },
    { $inc: { count: 1 } },
    {
        returnDocument: "after",
        upsert: true
    }
);

        res.json({
            count: visitor.count
        });

    } catch (error) {
        console.error("Visitor Count Error:", error);

        res.status(500).json({
            count: 0
        });
    }
});



const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

// CREATE ORDER
app.post("/create-order", async (req, res) => {
    const { amount } = req.body;

    try {
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now()
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: "Order creation failed" });
    }
});

// ================= VERIFY PAYMENT =================
app.post("/verify-payment", async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        name,
        email
    } = req.body;

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false
            });
        }

        const realAmount = amount / 100;

        await Donation.create({
            name,
            email,
            amount: realAmount,
            date: new Date()
        });

        res.json({
            success: true
        });

    } catch (error) {
        console.error("Payment Verification Error:", error);

        res.status(500).json({
            success: false
        });
    }
});

// ================= DONATION STATS =================
app.get("/donation-stats", async (req, res) => {
    try {
        const donations = await Donation.find();

        const totalAmount = donations.reduce(
            (total, donation) => total + donation.amount,
            0
        );

        const totalDonors = donations.length;

        res.json({
            totalAmount,
            totalDonors,
            donations
        });

    } catch (error) {
        console.error("Donation Stats Error:", error);

        res.status(500).json({
            totalAmount: 0,
            totalDonors: 0,
            donations: []
        });
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running");
});