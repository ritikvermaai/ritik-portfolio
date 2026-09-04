const mongoose = require("mongoose");
const os = require("os");
const { v2: cloudinary } = require("cloudinary");
const Razorpay = require("razorpay");

let cache = { at: 0, data: null };
const CACHE_MS = 15000;

function formatUptime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

async function checkCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return { status: "not_configured", label: "Not configured" };
  }
  try {
    const result = await cloudinary.api.ping();
    return { status: result?.status === "ok" ? "connected" : "degraded", label: result?.status === "ok" ? "Connected" : "Degraded" };
  } catch (error) {
    return { status: "error", label: "Error", error: error.message };
  }
}

async function checkRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
    return { status: "not_configured", label: "Not configured" };
  }
  try {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_SECRET });
    // Read-only authenticated request; no payment/order is created.
    await razorpay.orders.all({ count: 1 });
    return { status: "connected", label: "Connected" };
  } catch (error) {
    return { status: "error", label: "Error", error: error.message };
  }
}

exports.health = async (req, res) => {
  const started = process.hrtime.bigint();
  if (cache.data && Date.now() - cache.at < CACHE_MS) {
    return res.json({ ...cache.data, cached: true });
  }

  const dbConnected = mongoose.connection.readyState === 1;
  const [cloud, razorpay] = await Promise.all([checkCloudinary(), checkRazorpay()]);
  const frontendDist = require("path").join(require("path").resolve(__dirname, "../.."), "frontend", "dist", "index.html");
  const frontendHealthy = require("fs").existsSync(frontendDist) || process.env.NODE_ENV !== "production";
  const responseMs = Number(process.hrtime.bigint() - started) / 1e6;
  const services = {
    mongodb: { status: dbConnected ? "connected" : "disconnected", label: dbConnected ? "Connected" : "Disconnected" },
    cloudinary: cloud,
    razorpay,
    api: { status: "healthy", label: "Healthy" },
    frontend: { status: frontendHealthy ? "healthy" : "development", label: frontendHealthy ? "Healthy" : "Unavailable" }
  };
  const overall = dbConnected && [cloud, razorpay].every(x => ["connected", "not_configured"].includes(x.status)) ? "healthy" : "degraded";
  const data = {
    success: true,
    status: overall,
    services,
    responseTimeMs: Math.round(responseMs),
    uptimeSeconds: Math.floor(process.uptime()),
    uptime: formatUptime(process.uptime()),
    node: process.version,
    memory: { rss: Math.round(process.memoryUsage().rss / 1048576), heapUsed: Math.round(process.memoryUsage().heapUsed / 1048576) },
    hostname: os.hostname(),
    timestamp: new Date().toISOString(),
    cached: false
  };
  cache = { at: Date.now(), data };
  res.json(data);
};
