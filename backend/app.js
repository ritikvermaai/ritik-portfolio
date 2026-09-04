const express = require("express");
require("dotenv").config();

const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const compression = require("compression");
const { rateLimit } = require("express-rate-limit");
const { z } = require("zod");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");

const app = express();
const {PageVisit,AnalyticsEvent,AuditLog,Project,PortfolioSeed,Gallery,Visitor,VisitorIdentity,PortfolioRating,Donation,Settings,PortfolioContent,AdminCredential,LoginThrottle,Message,Theme}=require("./models");
const { validateAdminSession, requireAdmin } = require("./middleware/auth.middleware");
const { csrfTokenFor, auditActionFor, writeAudit } = require("./services/audit.service");

const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = require("./middleware/upload.middleware");

/* =====================================================
   MONGODB
===================================================== */

const { connectDatabase } = require("./config/database");
connectDatabase().then(connected => {
    if (connected) {
        seedPortfolioProjects();
        ensureFeaturedGalleryImage();
    }
});


/* =====================================================
   ANALYTICS MODELS
===================================================== */




/* =====================================================
   MIDDLEWARE
===================================================== */

const allowedOrigins = String(process.env.FRONTEND_ORIGIN || "").split(",").map(v => v.trim()).filter(Boolean);
app.use(cors({
    origin(origin, callback) {
        if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS policy."));
    },
    credentials: true
}));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(bodyParser.json({ limit: "12mb" }));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: req => req.path.startsWith("/admin") && req.session?.isAdmin === true
});
app.use("/api", apiLimiter);

const loginBodySchema = z.object({ password: z.string().min(1).max(256) });
const contactBodySchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(180),
    message: z.string().trim().min(2).max(5000)
});



/* =====================================================
   ADMIN SESSION
===================================================== */
app.set("trust proxy", 1);
app.use(
    session({
        name: "ritik.sid",
        secret: process.env.ADMIN_SESSION_SECRET || "change-me-in-production",
        resave: false,
        saveUninitialized: false,
        store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: "admin_sessions", ttl: 60 * 60 * 4 }) : undefined,
        cookie: {
            httpOnly: true,
            sameSite: (process.env.FRONTEND_ORIGIN && process.env.FRONTEND_ORIGIN !== "*") ? "none" : "lax",
            secure: process.env.NODE_ENV === "production" || Boolean(process.env.FRONTEND_ORIGIN),
            maxAge: 1000 * 60 * 60 * 4
        }
    })
);


// CSRF middleware is registered immediately after the session so every mutating
// admin route (including logout/settings) is protected, regardless of where the route is declared.
app.use(csrfProtect);

// System health endpoints. Public /api/health is safe for basic service status;
// detailed /admin/api/system-health is protected by the route-level admin guard below.
const healthController = require("./controllers/health.controller");
app.get("/api/health", healthController.health);
app.get("/admin/api/system-health", requireAdmin, healthController.health);

/* =====================================================
   PUBLIC PAGE ANALYTICS
===================================================== */
const { getCookie, ensureAnalyticsVisitorId, registerUniqueVisitor } = require("./services/visitor.service");

/* =====================================================
   ONLINE C / C++ COMPILER
===================================================== */
const compilerSessions = new Map();
function compilerCleanup(id){const x=compilerSessions.get(id);if(!x)return;try{if(x.timer)clearTimeout(x.timer)}catch(_){}try{fs.rmSync(x.dir,{recursive:true,force:true})}catch(_){}compilerSessions.delete(id)}
function startCompilerSession(child,dir){const id=crypto.randomBytes(18).toString("hex"),x={id,child,dir,output:"",running:true,exitCode:null,timer:null};compilerSessions.set(id,x);const append=d=>{x.output+=d.toString();if(x.output.length>120000)x.output=x.output.slice(-120000)};child.stdout.on("data",append);child.stderr.on("data",append);child.on("error",e=>{x.output+=`\nExecution error: ${e.message}`;x.running=false});child.on("close",c=>{x.exitCode=c;x.running=false;if(c!==0)x.output+=`\nProcess exited with code ${c}.`;x.timer=setTimeout(()=>compilerCleanup(id),120000)});x.timer=setTimeout(()=>{if(!x.running)return;try{child.kill()}catch(_){}x.output+='\nExecution timed out after 30 seconds.';x.running=false;x.exitCode=-1;x.timer=setTimeout(()=>compilerCleanup(id),10000)},30000);return x}
app.post("/run",async(req,res)=>{const{code="",language="c",input=""}=req.body||{};if(!code.trim())return res.json({output:"Please enter a program before running it."});if(!["c","cpp"].includes(language))return res.status(400).json({output:"Unsupported language."});const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ritik-compiler-")),source=path.join(dir,language==="cpp"?"main.cpp":"main.c"),binary=path.join(dir,process.platform==="win32"?"program.exe":"program");fs.writeFileSync(source,code,"utf8");const compiler=language==="cpp"?"g++":"gcc",args=language==="cpp"?[source,"-std=c++17","-O2","-o",binary]:[source,"-std=c11","-O2","-o",binary];const compile=spawn(compiler,args,{windowsHide:true});let co="",ce="";compile.stdout.on("data",d=>co+=d.toString());compile.stderr.on("data",d=>ce+=d.toString());compile.on("error",e=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch(_){}if(!res.headersSent)res.status(500).json({output:`Compiler unavailable on server: ${e.message}`})});compile.on("close",status=>{if(res.headersSent)return;if(status!==0){try{fs.rmSync(dir,{recursive:true,force:true})}catch(_){}return res.json({output:ce||co||"Compilation failed.",status:"error"})}const child=spawn(binary,[],{windowsHide:true,stdio:["pipe","pipe","pipe"]}),x=startCompilerSession(child,dir);if(String(input).length){try{child.stdin.write(String(input));if(!String(input).endsWith("\n"))child.stdin.write("\n")}catch(_){}}res.json({sessionId:x.id,status:"running",output:"Program started. Waiting for output…"})})});
app.get("/run/:id",(req,res)=>{const x=compilerSessions.get(req.params.id);if(!x)return res.status(404).json({output:"Compiler session not found or expired.",status:"error"});res.json({status:x.running?"running":"finished",output:x.output||(x.running?"Program is running…":"Program finished with no output."),exitCode:x.exitCode})});
app.post("/run/:id/input",(req,res)=>{const x=compilerSessions.get(req.params.id);if(!x||!x.running)return res.status(409).json({error:"Program is no longer running."});const input=String(req.body?.input??"");try{x.child.stdin.write(input);if(input&&!input.endsWith("\n"))x.child.stdin.write("\n");res.json({success:true})}catch(e){res.status(500).json({error:`Unable to send input: ${e.message}`})}});
app.post("/run/:id/stop",(req,res)=>{const x=compilerSessions.get(req.params.id);if(!x)return res.status(404).json({error:"Compiler session not found."});try{x.child.kill()}catch(_){}x.running=false;x.exitCode=-1;x.output+="\nProcess stopped by user.";setTimeout(()=>compilerCleanup(x.id),1000);res.json({success:true})});

/* ================= NEW REACT WEBSITE ================= */

const PROJECT_ROOT = path.resolve(__dirname, "..");
const frontendDist = path.join(PROJECT_ROOT, "frontend", "dist");
const legacyPublic = path.join(PROJECT_ROOT, "public");

function sendReactApp(req, res) {
    const distIndex = path.join(frontendDist, "index.html");
    if (fs.existsSync(distIndex)) return res.sendFile(distIndex);
    return res.status(503).send("Frontend is not built. Run: cd frontend && npm install && npm run build");
}

// Route aliases retained from the previous site so bookmarks continue to work.
app.get(["/", "/projects", "/compiler", "/gallery", "/attendance", "/resume", "/contact", "/admin", "/admin/login", "/admin/dashboard", "/dashboard", "/projects.html", "/coding.html", "/gallery.html", "/attendance.html", "/resume.html", "/contact.html"], sendReactApp);

// New React build assets first, then legacy assets (sound/images) for compatibility.
if (fs.existsSync(frontendDist)) app.use(express.static(frontendDist, { index: false }));
app.use(express.static(legacyPublic, { index: false }));


/* =====================================================
   DATABASE MODELS
===================================================== */


/* ================= PROJECT ================= */



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


async function ensureFeaturedGalleryImage(){
    try {
        const count=await Gallery.countDocuments({visible:true,featured:true});
        if(count===0){
            const first=await Gallery.findOne({visible:true}).sort({order:1,createdAt:-1});
            if(first){ first.featured=true; await first.save(); console.log('Gallery: marked first image as featured.'); }
        }
    } catch(error){ console.error('Featured gallery setup error:',error.message); }
}

/* ================= VISITOR ================= */

// Stores the total unique visitor count.

// One record per browser/device visitor. The visitor ID is kept in a
// long-lived cookie so returning visitors are not counted again.



/* ================= PORTFOLIO RATING ================= */

// One rating per permanent browser/device visitor.

    /* ================= WEBSITE SETTINGS ================= */

    /* =====================================================
   THEME DESIGNER API
===================================================== */

const { getTheme, saveTheme, DEFAULT_THEME, cleanTheme } = require("./services/theme.service");

/* =====================================================
   PORTFOLIO WEBSITE BUILDER
===================================================== */

/* =====================================================
   ADMIN AUTHENTICATION
===================================================== */

const { getLoginThrottle, registerFailedLogin, clearLoginThrottle, activeSessionList, verifyAdminPassword, COOLDOWN_START_FAILURE } = require("./services/auth.service");

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
                "/assets/photoweb.png";

            await settings.save();


            /* RESET PORTFOLIO CONTENT */

            let content =
                await PortfolioContent.findOne();

            if (!content) {

                content =
                    new PortfolioContent();

            }

            content.profileImage =
                "/assets/photoweb.png";

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





/* ================= LOGIN ================= */

app.get("/admin/login-status", async (req, res) => {
    try {
        const { doc, remainingMs } = await getLoginThrottle(req);
        res.json({
            locked: remainingMs > 0,
            retryAfter: Math.ceil(remainingMs / 1000),
            failures: Number(doc?.failures || 0),
            cooldownStartsAfter: 3,
            maxWait: LOGIN_MAX_DELAY_SECONDS
        });
    } catch (error) {
        res.json({ locked: false, retryAfter: 0, failures: 0, cooldownStartsAfter: 3, maxWait: LOGIN_MAX_DELAY_SECONDS });
    }
});

app.post(
    ["/admin/login", "/api/admin/login"],
    async (req, res) => {
        const parsed = loginBodySchema.safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: "A valid password is required." });
        }

        try {
            const throttle = await getLoginThrottle(req);
            if (throttle.remainingMs > 0) {
                const retryAfter = Math.ceil(throttle.remainingMs / 1000);
                res.set("Retry-After", String(retryAfter));
                res.set("X-Login-Retry-After-Ms", String(throttle.remainingMs));
                return res.status(429).json({ success: false, locked: true, retryAfter, message: `Too many failed attempts. Please wait ${retryAfter} seconds.` });
            }

            const valid = await verifyAdminPassword(parsed.data.password);
            if (!valid) {
                const lock = await registerFailedLogin(req);
                if (lock.retryAfter > 0) {
                    res.set("Retry-After", String(lock.retryAfter));
                    res.set("X-Login-Retry-After-Ms", String(lock.retryAfter * 1000));
                    return res.status(401).json({
                        success: false,
                        locked: true,
                        retryAfter: lock.retryAfter,
                        failures: lock.failures,
                        message: `Incorrect password. Too many failed attempts. Please wait ${lock.retryAfter} seconds before trying again.`
                    });
                }
                const attemptsUntilCooldown=Math.max(0,COOLDOWN_START_FAILURE-lock.failures);
                return res.status(401).json({
                    success: false,
                    locked: false,
                    retryAfter: 0,
                    failures: lock.failures,
                    attemptsUntilCooldown,
                    message: attemptsUntilCooldown > 0
                        ? `Incorrect password. ${attemptsUntilCooldown} more failed attempt${attemptsUntilCooldown===1?"":"s"} before the security cooldown.`
                        : "Incorrect password."
                });
            }

            await clearLoginThrottle(req);
            const credential = await AdminCredential.findById("main").lean();
            const sessionVersion = Number(credential?.sessionVersion || 1);

            await new Promise((resolve, reject) => {
                req.session.regenerate(err => err ? reject(err) : resolve());
            });

            req.session.isAdmin = true;
            req.session.sessionVersion = sessionVersion;
            req.session.loginAt = Date.now();
            req.session.lastActivityAt = Date.now();

            await new Promise((resolve, reject) => {
                req.session.save(err => err ? reject(err) : resolve());
            });

            await AdminCredential.findByIdAndUpdate("main", {
                $set: { lastLoginAt: new Date(), failedLoginAttempts: 0, updatedAt: new Date() },
                $push: { activeSessions: { sessionId: req.session.id, createdAt: new Date(), lastSeenAt: new Date(), ip: String(req.ip || ""), userAgent: String(req.get("user-agent") || "").slice(0, 300) } }
            }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });

            await writeAudit(req, "Admin logged in");
            res.json({ success: true, loginAt: req.session.loginAt });
        } catch (error) {
            console.error("Admin login error:", error);
            res.status(500).json({ success: false, message: "Authentication failed." });
        }
    }
);

/* ================= SESSION CHECK ================= */

app.get(
    "/admin/status",
    async (req, res) => {
        if (!req.session?.isAdmin) return res.json({ loggedIn: false });
        try {
            const credential = await AdminCredential.findById("main").lean();
            const currentVersion = Number(credential?.sessionVersion || 1);
            const valid = Number(req.session.sessionVersion || 1) === currentVersion;
            if (!valid) {
                await new Promise(resolve => req.session.destroy(() => resolve()));
                res.clearCookie("ritik.sid");
            }
            res.json({ loggedIn: valid });
        } catch (_) {
            res.status(500).json({ loggedIn: false });
        }
    }
);

/* ================= LOGOUT ================= */

app.post(
    "/admin/logout",
    (req, res) => {

        const sid = req.session?.id;
        req.session.destroy(
            err => {

                if (err) {

                    return res.status(500)
                        .json({

                            success: false

                        });

                }


                AdminCredential.findByIdAndUpdate("main", { $pull: { activeSessions: { sessionId: sid } } }).catch(() => {});
                writeAudit(req, "Admin logged out").finally(() => {
                    res.clearCookie("ritik.sid");
                    res.json({ success: true });
                });

            }
        );

    }
);


/* ================= ADMIN MIDDLEWARE ================= */

function csrfProtect(req,res,next){if(!req.path.startsWith("/admin"))return next();if(["GET","HEAD","OPTIONS"].includes(req.method))return next();if(req.path==="/admin/login"||req.path==="/api/admin/login")return next();if(!req.session?.isAdmin)return next();const token=req.get("x-csrf-token"),expected=req.session.csrfToken;if(!token||!expected||token.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(token),Buffer.from(expected)))return res.status(403).json({success:false,message:"CSRF validation failed. Refresh and try again."});next();}
app.get("/admin/api/csrf",requireAdmin,(req,res)=>res.json({success:true,token:csrfTokenFor(req)}));
app.use((req,res,next)=>{if(req.path.startsWith("/admin")&&["POST","PUT","PATCH","DELETE"].includes(req.method)&&req.path!=="/admin/api/csrf"&&req.path!=="/admin/login"){res.on("finish",()=>{if(req.session?.isAdmin&&res.statusCode>=200&&res.statusCode<400)writeAudit(req,auditActionFor(req));});}next();});
app.get("/admin/api/security/status",requireAdmin,async(req,res)=>{try{const credential=await AdminCredential.findById("main").lean(),sessions=await activeSessionList(),maxAgeMs=4*60*60*1000,currentId=req.session?.id;res.json({success:true,passwordHashConfigured:Boolean(credential?.passwordHash||process.env.ADMIN_PASSWORD_HASH),sessionHours:4,csrfEnabled:true,secureCookies:process.env.NODE_ENV==="production"||Boolean(process.env.FRONTEND_ORIGIN),loginAt:req.session?.loginAt||credential?.lastLoginAt||null,lastLoginAt:credential?.lastLoginAt||null,failedLoginAttempts:Number(credential?.failedLoginAttempts||0),activeSessions:sessions.map(x=>({...x,current:x.sessionId===currentId,expiresAt:new Date(new Date(x.createdAt).getTime()+maxAgeMs)}))});}catch(e){res.status(500).json({success:false,message:"Failed to load security status."});}});
app.post("/admin/api/security/change-password",requireAdmin,async(req,res)=>{const schema=z.object({currentPassword:z.string().min(1).max(256),newPassword:z.string().min(8).max(256),confirmPassword:z.string().min(8).max(256)}),parsed=schema.safeParse(req.body||{});if(!parsed.success)return res.status(400).json({success:false,message:"Use a new password with at least 8 characters."});if(parsed.data.newPassword!==parsed.data.confirmPassword)return res.status(400).json({success:false,message:"New passwords do not match."});if(parsed.data.currentPassword===parsed.data.newPassword)return res.status(400).json({success:false,message:"New password must be different from the current password."});try{if(!await verifyAdminPassword(parsed.data.currentPassword))return res.status(401).json({success:false,message:"Current password is incorrect."});const passwordHash=await bcrypt.hash(parsed.data.newPassword,12),credential=await AdminCredential.findById("main").lean(),nextVersion=Number(credential?.sessionVersion||1)+1;await AdminCredential.findByIdAndUpdate("main",{$set:{passwordHash,sessionVersion:nextVersion,updatedAt:new Date(),failedLoginAttempts:0,activeSessions:[]}},{upsert:true,new:true,setDefaultsOnInsert:true});await writeAudit(req,"Changed admin password");await new Promise(resolve=>req.session.destroy(()=>resolve()));res.clearCookie("ritik.sid");res.json({success:true,message:"Password changed. All admin sessions were signed out."});}catch(e){res.status(500).json({success:false,message:"Unable to change password."});}});
app.get("/admin/api/audit-logs",requireAdmin,async(req,res)=>{try{res.json({success:true,logs:await AuditLog.find().sort({createdAt:-1}).limit(100).lean()});}catch(e){res.status(500).json({success:false,message:"Failed to load audit logs."});}});
app.delete("/admin/api/audit-logs",requireAdmin,async(req,res)=>{try{await AuditLog.deleteMany({});res.json({success:true});}catch(e){res.status(500).json({success:false,message:"Failed to clear audit logs."});}});
app.post("/admin/api/security/logout-all",requireAdmin,async(req,res)=>{try{const nextVersion=Number((await AdminCredential.findById("main").lean())?.sessionVersion||1)+1;await AdminCredential.findByIdAndUpdate("main",{$set:{sessionVersion:nextVersion,updatedAt:new Date(),activeSessions:[]}},{upsert:true,new:true,setDefaultsOnInsert:true});await writeAudit(req,"Logged out all admin sessions");await new Promise(resolve=>req.session.destroy(()=>resolve()));res.clearCookie("ritik.sid");res.json({success:true,message:"All admin sessions have been invalidated."});}catch(e){res.status(500).json({success:false,message:"Unable to log out all sessions."});}});

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

            if (data.resume && typeof data.resume === "object") {
                content.resume = data.resume;
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

                    featured: String(req.body.featured).toLowerCase() === 'true',

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
            const featured =
                req.body.featured === true || String(req.body.featured).toLowerCase() === 'true';

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
                        description,
                        featured
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
        const parsed = contactBodySchema.safeParse(req.body || {});
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: "Please provide a valid name, email and message." });
        }
        const { name, email, message } = parsed.data;

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
    ["/projects", "/api/projects"],
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
   CONTENT ANALYTICS EVENTS
===================================================== */
app.post("/api/analytics/page", async (req, res) => {
    try {
        const page = String(req.body?.path || "/").slice(0, 160);
        if (!page.startsWith("/") || page.startsWith("/admin")) {
            return res.status(400).json({ success: false });
        }

        const { visitorId } = await registerUniqueVisitor(req, res);

        // Only the first public page seen from this lifetime visitor is stored.
        // This keeps the visitor analytics truly one-visit-per-lifetime.
        const existing = await PageVisit.findOne({ visitorId }).select("_id").lean();
        if (!existing) {
            await PageVisit.create({ path: page, visitorId });
            return res.json({ success: true, recorded: true });
        }

        return res.json({ success: true, recorded: false });
    } catch (error) {
        console.error("Analytics page error:", error);
        res.status(500).json({ success: false });
    }
});

app.post("/api/analytics/event", async (req, res) => {
    try {
        const type = String(req.body?.type || "");
        const itemId = String(req.body?.id || "").trim().slice(0, 120);
        const name = String(req.body?.name || "").trim().slice(0, 180);
        if (!["project", "gallery"].includes(type) || !itemId) {
            return res.status(400).json({ success: false, message: "Invalid analytics event." });
        }

        // Use the same long-lived visitor identity as lifetime visitor counting.
        // This fixes project/gallery analytics while keeping the public visitor
        // count independent from every click.
        const visitorId = ensureAnalyticsVisitorId(req, res);

        await AnalyticsEvent.create({
            type,
            itemId,
            name,
            visitorId
        });

        res.json({ success: true, recorded: true });
    } catch (error) {
        console.error("Analytics event error:", error);
        res.status(500).json({ success: false, message: "Unable to record analytics event." });
    }
});

app.get("/admin/analytics", requireAdmin, async (req, res) => {
    try {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [visitor, periodVisitorRows, dailyRows, pageRows, projectRows, galleryRows, totalEvents] = await Promise.all([
            Visitor.findOne({ _id: "main" }),
            // Count unique analytics visitors during the last 7 days, not raw
            // page events. A refresh therefore does not inflate this number.
            PageVisit.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $group: { _id: "$visitorId" } },
                { $count: "count" }
            ]),
            // Daily chart also uses unique visitors per day.
            PageVisit.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, visitorId: "$visitorId" } } },
                { $group: { _id: "$_id.date", visits: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            PageVisit.aggregate([
                { $group: { _id: "$path", visits: { $sum: 1 } } },
                { $sort: { visits: -1 } }, { $limit: 7 }
            ]),
            AnalyticsEvent.aggregate([
                { $match: { type: "project" } },
                { $group: { _id: { id: "$itemId", name: "$name" }, views: { $sum: 1 } } },
                { $sort: { views: -1 } }, { $limit: 7 }
            ]),
            AnalyticsEvent.aggregate([
                { $match: { type: "gallery" } },
                { $group: { _id: { id: "$itemId", name: "$name" }, views: { $sum: 1 } } },
                { $sort: { views: -1 } }, { $limit: 7 }
            ]),
            AnalyticsEvent.countDocuments({})
        ]);
        const dayMap = new Map(dailyRows.map(x => [x._id, x.visits]));
        const daily = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            daily.push({ date: key, label: d.toLocaleDateString("en-IN", { weekday: "short" }), visits: dayMap.get(key) || 0 });
        }
        res.json({
            totalVisitors: visitor?.count || 0,
            periodVisits: periodVisitorRows[0]?.count || 0,
            totalEvents,
            daily,
            topPages: pageRows.map(x => ({ path: x._id, visits: x.visits })),
            projects: projectRows.map(x => ({ name: x._id.name || x._id.id || "Project", views: x.views })),
            gallery: galleryRows.map(x => ({ name: x._id.name || x._id.id || "Gallery image", views: x.views }))
        });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ message: "Unable to load analytics" });
    }
});

/* =====================================================
   UNIQUE VISITOR COUNT
===================================================== */

app.get(
    "/visitor-count",
    async (req, res) => {
        try {
            // This endpoint also registers a visitor so older/direct clients
            // continue to participate in the same lifetime visitor system.
            await registerUniqueVisitor(req, res);

            const visitor = await Visitor.findOne({ _id: "main" }).lean();
            res.json({ count: visitor?.count || 0 });
        } catch (error) {
            console.error("Visitor Count Error:", error);
            res.status(500).json({ count: 0 });
        }
    }
);


/* =====================================================
   ADMIN VISITOR STATS
===================================================== */
app.get("/admin/visitor-stats", requireAdmin, async (req, res) => {
    try {
        const visitor = await Visitor.findOne({ _id: "main" }).lean();
        res.json({ success: true, count: Number(visitor?.count || 0) });
    } catch (error) {
        console.error("Admin Visitor Stats Error:", error);
        res.status(500).json({ success: false, message: "Failed to load visitor count." });
    }
});


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


            res.json({ ...order.toJSON ? order.toJSON() : order, key_id: process.env.RAZORPAY_KEY_ID });

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
   SYSTEM HEALTH / ADMIN OVERVIEW
===================================================== */
app.post('/admin/api/server/restart', requireAdmin, async (req, res) => {
    try {
        const marker = path.join(PROJECT_ROOT, '.portfolio-restart');
        fs.writeFileSync(marker, String(Date.now()));
        res.json({ success: true, message: 'Server restart scheduled.' });
        setTimeout(() => process.exit(0), 250);
    } catch (error) {
        console.error('Server restart error:', error);
        res.status(500).json({ success:false, message:'Unable to restart server.' });
    }
});

app.get("/admin/api/overview", requireAdmin, async (req, res) => {
    try {
        const [visitors, projects, gallery, messages, donations, ratings] = await Promise.all([
            PageVisit.countDocuments(),
            Project.countDocuments({ portfolioProject: true }),
            Gallery.countDocuments(),
            Message.countDocuments({ read: false }),
            Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
            PortfolioRating.aggregate([{ $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }])
        ]);
        const weekStart = new Date(Date.now() - 7 * 86400000);
        const weekVisitors = await PageVisit.countDocuments({ createdAt: { $gte: weekStart } });
        res.json({ success: true, metrics: { visitors, weekVisitors, projects, gallery, unreadMessages: messages, donations: donations[0]?.total || 0, donationCount: donations[0]?.count || 0, ratingAverage: Number((ratings[0]?.average || 0).toFixed(1)), ratingCount: ratings[0]?.count || 0 }, database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
    } catch (error) {
        console.error("Admin overview error:", error);
        res.status(500).json({ success: false, message: "Unable to load admin overview." });
    }
});

app.get("/admin/api/ratings", requireAdmin, async (req, res) => {
    try {
        const ratings = await PortfolioRating.find().sort({ createdAt: -1 }).limit(500).lean();
        res.json({ success: true, ratings });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to load ratings." });
    }
});

app.delete("/admin/api/ratings/:id", requireAdmin, async (req, res) => {
    try {
        const deleted = await PortfolioRating.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: "Rating not found." });
        res.json({ success: true, message: "Rating removed." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to remove rating." });
    }
});

require("./routes")({ app, requireAdmin });

/* =====================================================
   REACT SPA FALLBACK
===================================================== */

app.get(/^(?!\/api(?:\/|$)|\/admin\/api(?:\/|$)|\/admin\/status$|\/admin\/login(?:-status)?$|\/admin\/logout$|\/admin\/projects(?:\/|$)|\/admin\/visitor(?:-|\/)|\/run(?:\/|$)|\/projects$|\/save$|\/download(?:\/|$)|\/delete(?:\/|$)|\/create-order$|\/verify-payment$|\/donation-stats$|\/visitor-count$)/, sendReactApp);

/* =====================================================
   APPLICATION EXPORT
===================================================== */

module.exports = app;
