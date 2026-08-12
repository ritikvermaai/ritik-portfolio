const express = require("express");
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const fs = require("fs");
const { execFile } = require("child_process");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();



app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("public"));


const codesDir = path.join(__dirname, "codes");
const dbPath = path.join(__dirname, "database.json");

// Ensure folders/files exist
if (!fs.existsSync(codesDir)) {
    fs.mkdirSync(codesDir);
}
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "[]");
}

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
app.post("/save", (req, res) => {
    const { title, code, language } = req.body;

    if (!title) {
        return res.json({ message: "Project title required" });
    }

    const extension = language === "cpp" ? "cpp" : "c";
    const fileName = `${title}.${extension}`;
    const filePath = path.join(codesDir, fileName);

    fs.writeFileSync(filePath, code);

    let db = JSON.parse(fs.readFileSync(dbPath));
    db.push({ title, language });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.json({ message: "Project Saved Successfully" });
});

// ================= GET PROJECTS =================
app.get("/projects", (req, res) => {
    const db = JSON.parse(fs.readFileSync(dbPath));
    res.json(db);
});

// ================= DOWNLOAD PROJECT =================
app.get("/download/:title/:lang", (req, res) => {
    const filePath = path.join(codesDir, `${req.params.title}.${req.params.lang}`);
    res.download(filePath);
});


// ================= DELETE PROJECT =================
const ADMIN_PASSWORD = "ritik123";
app.delete("/delete/:title/:lang", (req, res) => {

    const title = req.params.title;
    const lang = req.params.lang;
    const { password } = req.body;
     if (!password || password !== ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Wrong Password" });
    }
    else
    {

    const filePath = path.join(codesDir, `${title}.${lang}`);

    // Delete file from codes folder
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    // Remove from database.json
    let db = JSON.parse(fs.readFileSync(dbPath));

    db = db.filter(p => !(p.title === title && p.language === lang));

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    res.json({ message: "Project Deleted Successfully" });}
});
app.get("/visitor-count", (req, res) => {
    const filePath = "visitor.json";

    fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
            return res.json({ count: 0 });
        }

        let visitorData = JSON.parse(data);

        visitorData.count += 1;

        fs.writeFile(filePath, JSON.stringify(visitorData), (err) => {
            if (err) {
                console.error("Error saving visitor count");
            }
        });

        res.json({ count: visitorData.count });
    });
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

// VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount,
        name,
        email
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature === razorpay_signature) {

        const data = JSON.parse(fs.readFileSync("donations.json"));

        const realAmount = amount / 100;

        data.totalAmount += realAmount;
        data.totalDonors += 1;

        data.donations.push({
            name,
            email,
            amount: realAmount,
            date: new Date()
        });

         fs.writeFileSync("donations.json", JSON.stringify(data, null, 2));

        res.json({ success: true });

    } else {
        res.status(400).json({ success: false });
    }
});

// GET STATS
app.get("/donation-stats", (req, res) => {
    const data = JSON.parse(fs.readFileSync("donations.json"));
    res.json(data);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running");
});