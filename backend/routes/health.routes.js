const router = require("express").Router();
const c = require("../controllers/health.controller");
router.get("/api/health", c.health);
router.get("/admin/api/system-health", c.health);
module.exports = router;
